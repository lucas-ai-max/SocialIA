import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createInstagramPost,
  publishInstagramMedia,
} from "../lib/composio/instagram";

const router = Router();

// GET / - Listar posts do usuario
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const status = req.query.status as string | undefined;

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const from = req.query.from as string;
    const to = req.query.to as string;
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
      res.status(500).json({ error: "Erro ao buscar posts." });
      return;
    }

    res.json({ posts: posts ?? [] });
  } catch (error) {
    console.error("Erro ao listar posts:", error);
    res.status(500).json({ error: "Erro interno ao buscar posts." });
  }
});

// POST / - Criar post rascunho
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { generationMode, userPrompt, imageFormat } = req.body as {
      generationMode: "prompt";
      userPrompt: string;
      imageFormat: "square" | "portrait";
    };

    if (!userPrompt || !imageFormat) {
      res.status(400).json({ error: "Campos obrigatorios: userPrompt, imageFormat." });
      return;
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        generation_mode: generationMode || "prompt",
        user_prompt: userPrompt,
        image_format: imageFormat,
        status: "draft",
      } as never)
      .select("*")
      .single();

    if (error || !post) {
      res.status(500).json({ error: "Erro ao criar post." });
      return;
    }

    res.status(201).json({ post });
  } catch (error) {
    console.error("Erro ao criar post:", error);
    res.status(500).json({ error: "Erro interno ao criar post." });
  }
});

// GET /:id - Buscar post por ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { id } = req.params;

    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    res.json({ post });
  } catch (error) {
    console.error("Erro ao buscar post:", error);
    res.status(500).json({ error: "Erro interno ao buscar post." });
  }
});

// PATCH /:id - Atualizar post
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { id } = req.params;

    const allowedFields = ["caption", "hashtags", "status", "scheduled_at"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        error: "Nenhum campo valido para atualizar. Campos permitidos: caption, hashtags, status, scheduled_at.",
      });
      return;
    }

    if (updates.caption && typeof updates.caption === "string" && updates.caption.length > 2200) {
      res.status(400).json({ error: "Legenda deve ter no maximo 2200 caracteres." });
      return;
    }
    if (updates.hashtags && Array.isArray(updates.hashtags) && updates.hashtags.length > 30) {
      res.status(400).json({ error: "Maximo de 30 hashtags." });
      return;
    }

    const { data: post, error } = await supabase
      .from("posts")
      .update(updates as never)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !post) {
      res.status(404).json({ error: "Post nao encontrado ou erro ao atualizar." });
      return;
    }

    res.json({ post });
  } catch (error) {
    console.error("Erro ao atualizar post:", error);
    res.status(500).json({ error: "Erro interno ao atualizar post." });
  }
});

// DELETE /:id - Excluir post
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { id } = req.params;

    // Check post exists, belongs to user, and is deletable
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", userId)
      .single<{ id: string; status: string }>();

    if (fetchError || !post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    if (post.status !== "draft" && post.status !== "failed") {
      res.status(400).json({ error: "Apenas posts com status 'draft' ou 'failed' podem ser excluidos." });
      return;
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      res.status(500).json({ error: "Erro ao excluir post." });
      return;
    }

    res.json({ message: "Post excluido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    res.status(500).json({ error: "Erro interno ao excluir post." });
  }
});

// POST /:id/schedule - Agendar post
router.post("/:id/schedule", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { id: postId } = req.params;

    const { scheduledAt } = req.body as { scheduledAt: string };

    if (!scheduledAt) {
      res.status(400).json({ error: "O campo scheduledAt e obrigatorio." });
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      res.status(400).json({ error: "Data de agendamento invalida." });
      return;
    }

    const now = Date.now();
    const diff = scheduledDate.getTime() - now;
    const SEVENTY_FIVE_DAYS_MS = 75 * 24 * 60 * 60 * 1000;

    if (diff > SEVENTY_FIVE_DAYS_MS) {
      res.status(400).json({ error: "O agendamento nao pode ser superior a 75 dias no futuro." });
      return;
    }

    // Fetch post and validate ownership/status
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", userId)
      .single<{
        id: string;
        user_id: string;
        status: string;
        generated_image_url: string | null;
        caption: string | null;
        hashtags: string[] | null;
      }>();

    if (postError || !post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    if (post.status !== "draft") {
      res.status(400).json({ error: "Apenas posts com status 'draft' podem ser agendados." });
      return;
    }

    if (!post.generated_image_url || !post.caption) {
      res.status(400).json({ error: "O post precisa ter imagem e legenda para ser agendado." });
      return;
    }

    // Fetch user's active Instagram account
    const { data: igAccount, error: igError } = await supabase
      .from("instagram_accounts")
      .select("composio_connection_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single<{ composio_connection_id: string | null }>();

    if (igError || !igAccount?.composio_connection_id) {
      res.status(400).json({ error: "Nenhuma conta do Instagram ativa encontrada." });
      return;
    }

    // Salvar agendamento localmente
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({
        status: "scheduled",
        scheduled_at: scheduledDate.toISOString(),
      } as never)
      .eq("id", postId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError) {
      res.status(500).json({ error: "Erro ao atualizar o status do post." });
      return;
    }

    res.json(updatedPost);
  } catch (error) {
    console.error("[posts/schedule] Erro:", error);
    res.status(500).json({ error: "Erro ao agendar o post. Tente novamente." });
  }
});

// POST /:id/cancel - Cancelar agendamento
router.post("/:id/cancel", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { id: postId } = req.params;

    // Fetch post and validate ownership/status
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, status")
      .eq("id", postId)
      .eq("user_id", userId)
      .single<{ id: string; user_id: string; status: string }>();

    if (postError || !post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    if (post.status !== "scheduled") {
      res.status(400).json({ error: "Apenas posts agendados podem ser cancelados." });
      return;
    }

    // Update post back to draft
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({
        status: "draft",
        scheduled_at: null,
        ig_container_id: null,
      } as never)
      .eq("id", postId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError) {
      console.error("[posts/cancel] Erro ao atualizar post:", updateError);
      res.status(500).json({ error: "Erro ao cancelar o agendamento do post." });
      return;
    }

    res.json(updatedPost);
  } catch (error) {
    console.error("[posts/cancel] Erro:", error);
    res.status(500).json({ error: "Erro ao cancelar o agendamento. Tente novamente." });
  }
});

// POST /:id/publish - Publicar imediatamente
router.post("/:id/publish", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const { id: postId } = req.params;

    // Fetch post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", userId)
      .single<{
        id: string;
        status: string;
        generated_image_url: string | null;
        caption: string | null;
        hashtags: string[] | null;
      }>();

    if (postError || !post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    if (post.status !== "draft" && post.status !== "scheduled" && post.status !== "failed") {
      res.status(400).json({ error: "Este post nao pode ser publicado no estado atual." });
      return;
    }

    if (!post.generated_image_url || !post.caption) {
      res.status(400).json({ error: "O post precisa ter imagem e legenda para ser publicado." });
      return;
    }

    // Fetch Instagram account
    const { data: igAccount, error: igError } = await supabase
      .from("instagram_accounts")
      .select("composio_connection_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single<{ composio_connection_id: string | null }>();

    if (igError || !igAccount?.composio_connection_id) {
      res.status(400).json({ error: "Nenhuma conta do Instagram ativa encontrada." });
      return;
    }

    // Build full caption
    const hashtags = post.hashtags?.join(" ") ?? "";
    const fullCaption = hashtags
      ? `${post.caption}\n\n${hashtags}`
      : post.caption;

    // Update status to publishing
    await supabase
      .from("posts")
      .update({ status: "publishing" } as never)
      .eq("id", postId)
      .eq("user_id", userId);

    // Create media container
    const containerResult = await createInstagramPost({
      connectionId: igAccount.composio_connection_id,
      userId,
      imageUrl: post.generated_image_url,
      caption: fullCaption,
    });

    if (!containerResult.containerId) {
      await supabase
        .from("posts")
        .update({ status: "failed", publish_error: "Falha ao criar container" } as never)
        .eq("id", postId)
        .eq("user_id", userId);
      res.status(500).json({ error: "Falha ao criar post no Instagram." });
      return;
    }

    // Aguardar container ficar pronto e tentar publicar (max 3 tentativas)
    let publishResult;
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        publishResult = await publishInstagramMedia({
          connectionId: igAccount.composio_connection_id,
          userId,
          containerId: containerResult.containerId,
        });
        break;
      } catch (err) {
        if (attempt === 2) throw err;
      }
    }
    if (!publishResult) throw new Error("Falha ao publicar apos 3 tentativas");

    // Atualizar post como publicado
    await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        ig_media_id: publishResult.mediaId,
        ig_container_id: containerResult.containerId,
      } as never)
      .eq("id", postId)
      .eq("user_id", userId);

    res.json({
      success: true,
      mediaId: publishResult.mediaId,
    });
  } catch (error) {
    console.error("[posts/publish] Erro:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Erro ao publicar. Tente novamente.",
    });
  }
});

export default router;
