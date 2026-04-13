import { Router, Request, Response } from "express";
import { createAdminClient } from "../lib/supabase";
import {
  createInstagramPost,
  publishInstagramMedia,
} from "../lib/composio/instagram";
import { generateFullPost } from "../lib/generate-post";

const router = Router();

// Funcao de publicacao exportada para uso interno pelo node-cron
export async function publishScheduledPosts() {
  const admin = createAdminClient();

  // Buscar posts agendados que ja passaram do horario
  const { data: posts, error } = await admin
    .from("posts")
    .select("id, user_id, generated_image_url, caption, hashtags, scheduled_at, retry_count")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(10);

  if (error || !posts || posts.length === 0) {
    return { published: 0, message: "Nenhum post para publicar" };
  }

  let published = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      // Buscar conexao Instagram do usuario
      const { data: igAccount } = await admin
        .from("instagram_accounts")
        .select("composio_connection_id")
        .eq("user_id", post.user_id)
        .eq("is_active", true)
        .single();

      if (!igAccount?.composio_connection_id) {
        await admin
          .from("posts")
          .update({ status: "failed", publish_error: "Conta Instagram nao encontrada" } as never)
          .eq("id", post.id);
        errors.push(`${post.id}: sem conta IG`);
        continue;
      }

      // Build caption completa
      const hashtags = (post.hashtags as string[])?.join(" ") ?? "";
      const fullCaption = hashtags
        ? `${post.caption}\n\n${hashtags}`
        : (post.caption || "");

      // Marcar como publishing
      await admin
        .from("posts")
        .update({ status: "publishing" } as never)
        .eq("id", post.id);

      // Criar container
      const containerResult = await createInstagramPost({
        connectionId: igAccount.composio_connection_id,
        userId: post.user_id,
        imageUrl: post.generated_image_url!,
        caption: fullCaption,
      });

      if (!containerResult.containerId) {
        throw new Error("Container nao criado");
      }

      // Aguardar container ficar pronto e tentar publicar (max 3 tentativas)
      let pubResult;
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          pubResult = await publishInstagramMedia({
            connectionId: igAccount.composio_connection_id,
            userId: post.user_id,
            containerId: containerResult.containerId,
          });
          break;
        } catch (err) {
          if (attempt === 2) throw err;
        }
      }
      if (!pubResult) throw new Error("Falha ao publicar apos 3 tentativas");

      // Atualizar como publicado
      await admin
        .from("posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          ig_media_id: pubResult.mediaId,
          ig_container_id: containerResult.containerId,
        } as never)
        .eq("id", post.id);

      published++;
      console.log(`[cron/publish] Post ${post.id} publicado com sucesso`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error(`[cron/publish] Erro no post ${post.id}:`, msg);

      await admin
        .from("posts")
        .update({
          status: "failed",
          publish_error: msg,
          retry_count: ((post as Record<string, unknown>).retry_count as number || 0) + 1,
        } as never)
        .eq("id", post.id);

      errors.push(`${post.id}: ${msg}`);
    }
  }

  return { published, errors, total: posts.length };
}

// Funcao de geracao automatica exportada para uso interno pelo node-cron
export async function generateAutopilotPosts() {
  const admin = createAdminClient();

  // Buscar todas as configs ativas
  const { data: configs, error: configError } = await admin
    .from("auto_schedule_config")
    .select("*")
    .eq("is_active", true);

  if (configError || !configs || configs.length === 0) {
    return { generated: 0, message: "Nenhuma config de autopilot ativa" };
  }

  // Hora atual em UTC-3 (Brasil)
  const now = new Date();
  // TODO: Timezone hardcoded UTC-3 (Brasilia). Idealmente deveria ser configuravel por usuario.
  const brNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const currentTime =
    brNow.getUTCHours().toString().padStart(2, "0") +
    ":" +
    brNow.getUTCMinutes().toString().padStart(2, "0");

  // Inicio do dia em UTC-3
  const todayStart = new Date(brNow);
  todayStart.setUTCHours(0, 0, 0, 0);
  // Converter de volta para UTC para query
  const todayStartUTC = new Date(todayStart.getTime() + 3 * 60 * 60 * 1000);

  let generated = 0;
  const errors: string[] = [];

  for (const config of configs) {
    try {
      const scheduleTimes = config.schedule_times as string[];

      // Verificar se o horario atual bate com algum horario configurado (janela de 1 minuto)
      const matchesTime = scheduleTimes.some((time: string) => time === currentTime);

      if (!matchesTime) {
        continue;
      }

      const userId = config.user_id as string;

      // Verificar quantos posts ja foram gerados hoje para este usuario
      const { count: todayCount } = await admin
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("auto_generated", true)
        .gte("created_at", todayStartUTC.toISOString());

      if ((todayCount ?? 0) >= (config.posts_per_day as number)) {
        console.log(`[autopilot] Usuario ${userId}: limite diario atingido (${todayCount}/${config.posts_per_day})`);
        continue;
      }

      // Buscar brand_profile
      const { data: brandProfile, error: brandError } = await admin
        .from("brand_profiles")
        .select("*")
        .eq("user_id", userId)
        .single<{
          niche: string;
          target_audience: string;
          brand_voice: string;
          visual_style: string;
          color_palette: string[] | null;
          content_pillars: string[];
          additional_context: string | null;
        }>();

      if (brandError || !brandProfile) {
        console.log(`[autopilot] Usuario ${userId}: sem perfil de marca, pulando`);
        continue;
      }

      // Verificar creditos
      const { data: profile } = await admin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single<{ credits: number }>();

      if (!profile || profile.credits < 1) {
        console.log(`[autopilot] Usuario ${userId}: creditos insuficientes`);
        continue;
      }

      console.log(`[autopilot] Gerando post para usuario ${userId} no horario ${currentTime}`);

      const result = await generateFullPost({
        userId,
        brandProfile,
        imageFormat: "square",
      });

      if (!result) {
        errors.push(`${userId}: erro ao gerar post`);
        continue;
      }

      const { postId, imageUrl: publicUrl, caption, hashtags } = result;

      // Se nao requer aprovacao, publicar imediatamente
      if (!config.requires_approval) {
        try {
          // Buscar conexao Instagram do usuario
          const { data: igAccount } = await admin
            .from("instagram_accounts")
            .select("composio_connection_id")
            .eq("user_id", userId)
            .eq("is_active", true)
            .single();

          if (igAccount?.composio_connection_id) {
            const fullCaption = hashtags.length > 0
              ? `${caption}\n\n${hashtags.join(" ")}`
              : (caption || "");

            // Marcar como publishing
            await admin
              .from("posts")
              .update({ status: "publishing" } as never)
              .eq("id", postId);

            // Criar container
            const containerResult = await createInstagramPost({
              connectionId: igAccount.composio_connection_id,
              userId,
              imageUrl: publicUrl,
              caption: fullCaption,
            });

            if (!containerResult.containerId) {
              throw new Error("Container nao criado");
            }

            // Aguardar container ficar pronto e tentar publicar (max 3 tentativas)
            let pubResult;
            for (let attempt = 0; attempt < 3; attempt++) {
              await new Promise((r) => setTimeout(r, 5000));
              try {
                pubResult = await publishInstagramMedia({
                  connectionId: igAccount.composio_connection_id,
                  userId,
                  containerId: containerResult.containerId,
                });
                break;
              } catch (err) {
                if (attempt === 2) throw err;
              }
            }
            if (!pubResult) throw new Error("Falha ao publicar apos 3 tentativas");

            // Atualizar como publicado
            await admin
              .from("posts")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
                ig_media_id: pubResult.mediaId,
                ig_container_id: containerResult.containerId,
              } as never)
              .eq("id", postId);

            console.log(`[autopilot] Post ${postId} publicado automaticamente`);
          } else {
            // Sem conta IG - deixar como draft
            console.log(`[autopilot] Usuario ${userId}: sem conta IG, post ${postId} deixado como draft`);
          }
        } catch (pubErr) {
          const msg = pubErr instanceof Error ? pubErr.message : "Erro desconhecido";
          console.error(`[autopilot] Erro ao publicar post ${postId}:`, msg);
          await admin
            .from("posts")
            .update({
              status: "failed",
              publish_error: msg,
            } as never)
            .eq("id", postId);
        }
      } else {
        console.log(`[autopilot] Post ${postId} criado como draft (aguardando aprovacao)`);
      }

      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error(`[autopilot] Erro para usuario ${config.user_id}:`, msg);
      errors.push(`${config.user_id}: ${msg}`);
    }
  }

  return { generated, errors, total: configs.length };
}

// GET /publish - Publicar posts agendados (protegido por CRON_SECRET)
router.get("/publish", async (req: Request, res: Response) => {
  const secret = (req.headers["x-cron-secret"] as string) || (req.query.secret as string);

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: "Nao autorizado" });
    return;
  }

  try {
    const result = await publishScheduledPosts();
    res.json(result);
  } catch (error) {
    console.error("[cron/publish] Erro:", error);
    res.status(500).json({ error: "Erro ao publicar posts agendados." });
  }
});

export default router;
