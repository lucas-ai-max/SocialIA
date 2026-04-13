import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// GET / - Buscar perfil de marca
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { data, error } = await supabase
      .from("brand_profiles")
      .select(
        "niche, brand_voice, target_audience, visual_style, content_pillars, additional_context"
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      res.status(404).json({ error: "Perfil de marca nao encontrado" });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar perfil de marca:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT / - Atualizar perfil de marca
router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const {
      niche,
      targetAudience,
      brandVoice,
      visualStyle,
      contentPillars,
      additionalContext,
    } = req.body;

    const { data, error } = await supabase
      .from("brand_profiles")
      .update({
        niche: niche || null,
        brand_voice: brandVoice || null,
        target_audience: targetAudience || null,
        visual_style: visualStyle || null,
        content_pillars: contentPillars || [],
        additional_context: additionalContext || null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar perfil de marca:", error);
      res.status(500).json({ error: "Erro ao atualizar perfil de marca" });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error("Erro ao atualizar perfil de marca:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
