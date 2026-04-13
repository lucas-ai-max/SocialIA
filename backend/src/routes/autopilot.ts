import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";

const router = Router();

// GET / - Buscar configuracao do autopilot do usuario
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const admin = createAdminClient();

    const { data: config, error } = await admin
      .from("auto_schedule_config")
      .select("id, user_id, is_active, posts_per_day, schedule_times, requires_approval, include_profile_photo, created_at, updated_at")
      .eq("user_id", userId)
      .single();

    if (error || !config) {
      // Retornar config padrao se nao existir
      res.json({
        isActive: false,
        postsPerDay: 1,
        scheduleTimes: ["09:00"],
        requiresApproval: true,
        includeProfilePhoto: false,
      });
      return;
    }

    res.json({
      id: config.id,
      isActive: config.is_active,
      postsPerDay: config.posts_per_day,
      scheduleTimes: config.schedule_times,
      requiresApproval: config.requires_approval,
      includeProfilePhoto: config.include_profile_photo ?? false,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    });
  } catch (error) {
    console.error("[autopilot] Erro ao buscar config:", error);
    res.status(500).json({ error: "Erro ao buscar configuracao do autopilot." });
  }
});

// PUT / - Salvar/atualizar configuracao do autopilot
router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { isActive, postsPerDay, scheduleTimes, requiresApproval, includeProfilePhoto } = req.body as {
      isActive: boolean;
      postsPerDay: number;
      scheduleTimes: string[];
      requiresApproval: boolean;
      includeProfilePhoto: boolean;
    };

    // Validacoes
    if (typeof isActive !== "boolean") {
      res.status(400).json({ error: "Campo isActive deve ser um booleano." });
      return;
    }

    if (!Number.isInteger(postsPerDay) || postsPerDay < 1 || postsPerDay > 5) {
      res.status(400).json({ error: "postsPerDay deve ser um numero inteiro entre 1 e 5." });
      return;
    }

    if (!Array.isArray(scheduleTimes) || scheduleTimes.length === 0 || scheduleTimes.length > 5) {
      res.status(400).json({ error: "scheduleTimes deve ser um array de 1 a 5 horarios." });
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const time of scheduleTimes) {
      if (!timeRegex.test(time)) {
        res.status(400).json({ error: `Horario invalido: "${time}". Use o formato HH:MM.` });
        return;
      }
    }

    if (typeof requiresApproval !== "boolean") {
      res.status(400).json({ error: "Campo requiresApproval deve ser um booleano." });
      return;
    }

    // Upsert usando admin client
    const admin = createAdminClient();

    const { data: config, error } = await admin
      .from("auto_schedule_config")
      .upsert(
        {
          user_id: userId,
          is_active: isActive,
          posts_per_day: postsPerDay,
          schedule_times: scheduleTimes,
          requires_approval: requiresApproval,
          include_profile_photo: includeProfilePhoto ?? false,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[autopilot] Erro ao salvar config:", error);
      res.status(500).json({ error: "Erro ao salvar configuracao do autopilot." });
      return;
    }

    res.json({
      id: config.id,
      isActive: config.is_active,
      postsPerDay: config.posts_per_day,
      scheduleTimes: config.schedule_times,
      requiresApproval: config.requires_approval,
      includeProfilePhoto: config.include_profile_photo ?? false,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    });
  } catch (error) {
    console.error("[autopilot] Erro ao salvar config:", error);
    res.status(500).json({ error: "Erro interno ao salvar configuracao do autopilot." });
  }
});

// GET /pending - Buscar posts pendentes de aprovacao
router.get("/pending", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .eq("auto_generated", true)
      .eq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[autopilot] Erro ao buscar posts pendentes:", error);
      res.status(500).json({ error: "Erro ao buscar posts pendentes." });
      return;
    }

    res.json({ posts: posts || [] });
  } catch (error) {
    console.error("[autopilot] Erro ao buscar posts pendentes:", error);
    res.status(500).json({ error: "Erro interno ao buscar posts pendentes." });
  }
});

// POST /:id/approve - Aprovar um post pendente
router.post("/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;
    const admin = createAdminClient();

    // Verificar se o post pertence ao usuario e esta pendente
    const { data: post, error: fetchError } = await admin
      .from("posts")
      .select("id, user_id, auto_generated, status")
      .eq("id", postId)
      .eq("user_id", userId)
      .eq("auto_generated", true)
      .eq("status", "draft")
      .single();

    if (fetchError || !post) {
      res.status(404).json({ error: "Post pendente nao encontrado." });
      return;
    }

    // Buscar config do autopilot para pegar o proximo horario disponivel
    const { data: config } = await admin
      .from("auto_schedule_config")
      .select("schedule_times")
      .eq("user_id", userId)
      .single();

    // Calcular proximo horario de agendamento (proximo horario futuro)
    const now = new Date();
    // UTC-3 para Brasil
    const brNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    let scheduledAt: Date | null = null;

    if (config?.schedule_times && Array.isArray(config.schedule_times)) {
      const times = (config.schedule_times as string[]).sort();

      const currentTimeStr =
        brNow.getUTCHours().toString().padStart(2, "0") +
        ":" +
        brNow.getUTCMinutes().toString().padStart(2, "0");

      // Tentar encontrar um horario hoje que ainda nao passou
      for (const time of times) {
        if (time > currentTimeStr) {
          const [h, m] = time.split(":").map(Number);
          scheduledAt = new Date(brNow);
          scheduledAt.setUTCHours(h, m, 0, 0);
          // Converter de volta para UTC
          scheduledAt = new Date(scheduledAt.getTime() + 3 * 60 * 60 * 1000);
          break;
        }
      }

      // Se nenhum horario hoje, agendar para o primeiro horario de amanha
      if (!scheduledAt) {
        const [h, m] = times[0].split(":").map(Number);
        scheduledAt = new Date(brNow);
        scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);
        scheduledAt.setUTCHours(h, m, 0, 0);
        scheduledAt = new Date(scheduledAt.getTime() + 3 * 60 * 60 * 1000);
      }
    } else {
      // Fallback: agendar para daqui a 5 minutos
      scheduledAt = new Date(now.getTime() + 5 * 60 * 1000);
    }

    // Atualizar post para scheduled
    const { error: updateError } = await admin
      .from("posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
      } as never)
      .eq("id", postId);

    if (updateError) {
      console.error("[autopilot] Erro ao aprovar post:", updateError);
      res.status(500).json({ error: "Erro ao aprovar post." });
      return;
    }

    res.json({
      message: "Post aprovado e agendado com sucesso.",
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (error) {
    console.error("[autopilot] Erro ao aprovar post:", error);
    res.status(500).json({ error: "Erro interno ao aprovar post." });
  }
});

// POST /:id/reject - Rejeitar um post pendente
router.post("/:id/reject", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;
    const admin = createAdminClient();

    // Verificar se o post pertence ao usuario e esta pendente
    const { data: post, error: fetchError } = await admin
      .from("posts")
      .select("id, user_id, auto_generated, status")
      .eq("id", postId)
      .eq("user_id", userId)
      .eq("auto_generated", true)
      .eq("status", "draft")
      .single();

    if (fetchError || !post) {
      res.status(404).json({ error: "Post pendente nao encontrado." });
      return;
    }

    // Deletar o post
    const { error: deleteError } = await admin
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("[autopilot] Erro ao rejeitar post:", deleteError);
      res.status(500).json({ error: "Erro ao rejeitar post." });
      return;
    }

    res.json({ message: "Post rejeitado e removido com sucesso." });
  } catch (error) {
    console.error("[autopilot] Erro ao rejeitar post:", error);
    res.status(500).json({ error: "Erro interno ao rejeitar post." });
  }
});

export default router;
