import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";
import { generateImage } from "../lib/gemini/image";
import { generateCaption, generateHashtags } from "../lib/gemini/caption";
import {
  buildImagePrompt,
  buildCaptionPrompt,
  buildHashtagsPrompt,
  buildHeadlinePrompt,
} from "../lib/gemini/prompts";
import { deductCredits, refundCredits } from "../lib/credits";
import { generateFullPost } from "../lib/generate-post";

const router = Router();

// POST /image - Gerar imagem
router.post("/image", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { postId, userPrompt, imageFormat, referenceImages, includeProfilePhoto } = req.body as {
      postId: string;
      userPrompt?: string;
      imageFormat: "square" | "portrait";
      referenceImages?: { base64: string; mimeType: string }[];
      includeProfilePhoto?: boolean;
    };

    if (!postId || !imageFormat) {
      res.status(400).json({ error: "Campos obrigatorios: postId, imageFormat." });
      return;
    }

    // Fetch brand profile
    const { data: brandProfile, error: brandError } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("user_id", userId)
      .single<{
        niche: string;
        target_audience: string;
        brand_voice: string;
        visual_style: string;
        color_palette: string[] | null;
      }>();

    if (brandError || !brandProfile) {
      res.status(404).json({ error: "Perfil de marca nao encontrado. Complete o onboarding primeiro." });
      return;
    }

    // Check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single<{ credits: number }>();

    if (profileError || !profile) {
      res.status(404).json({ error: "Perfil do usuario nao encontrado." });
      return;
    }

    if (profile.credits < 1) {
      res.status(402).json({ error: "Creditos insuficientes. Adquira mais creditos para gerar imagens." });
      return;
    }

    // Deduct credit atomically BEFORE expensive work
    const creditResult = await deductCredits({ userId, amount: 1, description: "Geracao de imagem", postId });
    if (!creditResult) {
      res.status(402).json({ error: "Creditos insuficientes." });
      return;
    }

    // Generate headline + subheadline
    const headlinePrompt = buildHeadlinePrompt({
      userPrompt,
      niche: brandProfile.niche,
      targetAudience: brandProfile.target_audience,
      brandVoice: brandProfile.brand_voice,
    });

    let headline = "";
    let subheadline = "";
    try {
      const headlineRaw = await generateCaption(headlinePrompt);
      const parsed = JSON.parse(headlineRaw.replace(/```json\n?|\n?```/g, "").trim());
      headline = parsed.headline || "";
      subheadline = parsed.subheadline || "";
    } catch {
      headline = (userPrompt || brandProfile.niche).toUpperCase().slice(0, 40);
    }

    // Build prompt and generate image
    let prompt = buildImagePrompt({
      userPrompt,
      niche: brandProfile.niche,
      visualStyle: brandProfile.visual_style,
      colorPalette: brandProfile.color_palette ?? undefined,
      imageFormat,
      headline,
      subheadline,
    });

    // If includeProfilePhoto, fetch profile photo and add as reference
    let allReferenceImages = referenceImages || [];
    if (includeProfilePhoto) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("profile_photo_url")
        .eq("id", userId)
        .single<{ profile_photo_url: string | null }>();

      if (profileData?.profile_photo_url) {
        try {
          const photoRes = await fetch(profileData.profile_photo_url);
          const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
          const photoBase64 = photoBuffer.toString("base64");
          const photoMime = photoRes.headers.get("content-type") || "image/jpeg";
          allReferenceImages = [
            { base64: photoBase64, mimeType: photoMime },
            ...allReferenceImages,
          ];
          prompt += "\nInclua uma pessoa com aparencia semelhante a esta foto de referencia como protagonista da cena.";
        } catch (err) {
          console.error("Erro ao baixar foto de perfil:", err);
        }
      }
    }

    let base64: string;
    let mimeType: string;
    try {
      const imageResult = await generateImage({
        prompt,
        imageFormat,
        referenceImages: allReferenceImages.length > 0 ? allReferenceImages : undefined,
      });
      base64 = imageResult.base64;
      mimeType = imageResult.mimeType;
    } catch (err) {
      await refundCredits({ userId, amount: 1, description: "Reembolso - falha na geracao de imagem", postId });
      const adminForError = createAdminClient();
      await adminForError.from("posts").update({ status: "failed", publish_error: "Falha na geracao de imagem" } as never).eq("id", postId).eq("user_id", userId);
      throw err;
    }

    // Upload to Supabase Storage
    const admin = createAdminClient();
    const filePath = `${userId}/${postId}.png`;
    const buffer = Buffer.from(base64, "base64");

    const { error: uploadError } = await admin.storage
      .from("generated-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      await refundCredits({ userId, amount: 1, description: "Reembolso - falha no upload de imagem", postId });
      res.status(500).json({ error: "Erro ao salvar imagem. Tente novamente." });
      return;
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("generated-images").getPublicUrl(filePath);

    // Update post
    await admin
      .from("posts")
      .update({
        generated_image_url: publicUrl,
        generated_image_prompt: prompt,
        credits_charged: 1,
      } as never)
      .eq("id", postId)
      .eq("user_id", userId);

    res.json({ imageUrl: publicUrl, prompt });
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    res.status(500).json({ error: "Erro interno ao gerar imagem. Tente novamente." });
  }
});

// POST /caption - Gerar legenda
router.post("/caption", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { postId, userPrompt } = req.body as {
      postId: string;
      userPrompt?: string;
    };

    if (!postId) {
      res.status(400).json({ error: "Campo obrigatorio: postId." });
      return;
    }

    // Fetch brand profile
    const { data: brandProfile, error: brandError } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("user_id", userId)
      .single<{
        niche: string;
        target_audience: string;
        brand_voice: string;
        content_pillars: string[];
        additional_context: string | null;
      }>();

    if (brandError || !brandProfile) {
      res.status(404).json({ error: "Perfil de marca nao encontrado. Complete o onboarding primeiro." });
      return;
    }

    // Generate caption
    const captionPrompt = buildCaptionPrompt({
      userPrompt,
      niche: brandProfile.niche,
      targetAudience: brandProfile.target_audience,
      brandVoice: brandProfile.brand_voice,
      contentPillars: brandProfile.content_pillars,
      additionalContext: brandProfile.additional_context ?? undefined,
    });

    const caption = await generateCaption(captionPrompt);

    // Generate hashtags
    const hashtagsPrompt = buildHashtagsPrompt({
      caption,
      niche: brandProfile.niche,
    });

    const hashtags = await generateHashtags(hashtagsPrompt);

    // Update post
    await supabase
      .from("posts")
      .update({ caption, hashtags } as never)
      .eq("id", postId)
      .eq("user_id", userId);

    res.json({ caption, hashtags });
  } catch (error) {
    console.error("Erro ao gerar legenda:", error);
    res.status(500).json({ error: "Erro interno ao gerar legenda. Tente novamente." });
  }
});

// POST /auto - Geracao automatica completa
router.post("/auto", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { imageFormat, includeProfilePhoto } = req.body as {
      imageFormat: "square" | "portrait";
      includeProfilePhoto?: boolean;
    };

    if (!imageFormat) {
      res.status(400).json({ error: "Campo obrigatorio: imageFormat." });
      return;
    }

    // Fetch brand profile
    const { data: brandProfile, error: brandError } = await supabase
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
      res.status(404).json({ error: "Perfil de marca nao encontrado. Complete o onboarding primeiro." });
      return;
    }

    // Check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single<{ credits: number }>();

    if (profileError || !profile) {
      res.status(404).json({ error: "Perfil do usuario nao encontrado." });
      return;
    }

    if (profile.credits < 1) {
      res.status(402).json({ error: "Creditos insuficientes. Adquira mais creditos para gerar conteudo." });
      return;
    }

    const result = await generateFullPost({
      userId,
      brandProfile,
      imageFormat,
      includeProfilePhoto,
    });

    if (!result) {
      res.status(500).json({ error: "Erro ao gerar post. Tente novamente." });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("Erro na geracao automatica:", error);
    res.status(500).json({ error: "Erro interno na geracao automatica. Tente novamente." });
  }
});

export default router;
