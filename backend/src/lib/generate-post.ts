import { createAdminClient } from "./supabase";
import { generateImage } from "./gemini/image";
import { generateCaption, generateHashtags, generateIdea } from "./gemini/caption";
import {
  buildImagePrompt,
  buildCaptionPrompt,
  buildHashtagsPrompt,
  buildAutoIdeaPrompt,
  buildHeadlinePrompt,
} from "./gemini/prompts";
import { deductCredits, refundCredits } from "./credits";
import { normalizeStorageUrl } from "./storage-url";

export async function generateFullPost(params: {
  userId: string;
  brandProfile: {
    niche: string;
    target_audience: string;
    brand_voice: string;
    visual_style: string;
    color_palette: string[] | null;
    content_pillars: string[];
    additional_context: string | null;
    brand_logo_url?: string | null;
  };
  imageFormat: "square" | "portrait";
  userPrompt?: string;
  referenceImages?: { base64: string; mimeType: string }[];
  includeProfilePhoto?: boolean;
}): Promise<{
  postId: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  idea: string;
} | null> {
  const admin = createAdminClient();
  const bp = params.brandProfile;

  // 1. Generate idea — fetch recent auto ideas to avoid repeats
  let recentIdeas: string[] = [];
  if (!params.userPrompt) {
    const { data: recent } = await admin
      .from("posts")
      .select("user_prompt")
      .eq("user_id", params.userId)
      .eq("auto_generated", true)
      .not("user_prompt", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);
    recentIdeas = (recent || [])
      .map((r: { user_prompt: string | null }) => r.user_prompt || "")
      .filter((s: string) => s.length > 0);
  }

  const ideaPrompt = buildAutoIdeaPrompt({
    niche: bp.niche,
    contentPillars: bp.content_pillars,
    targetAudience: bp.target_audience,
    recentIdeas,
  });
  const idea = params.userPrompt || (await generateIdea(ideaPrompt));

  // 2. Create post
  const { data: post, error: postError } = await admin
    .from("posts")
    .insert({
      user_id: params.userId,
      generation_mode: params.userPrompt ? "prompt" : "auto",
      user_prompt: idea,
      image_format: params.imageFormat,
      status: "draft",
      auto_generated: !params.userPrompt,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (postError || !post) return null;

  // 3. Deduct credit
  const creditResult = await deductCredits({
    userId: params.userId,
    amount: 1,
    description: "Geracao automatica de conteudo",
    postId: post.id,
  });

  if (!creditResult) {
    await admin.from("posts").delete().eq("id", post.id);
    return null;
  }

  // 4. Generate headline
  const headlinePrompt = buildHeadlinePrompt({
    userPrompt: idea,
    niche: bp.niche,
    targetAudience: bp.target_audience,
    brandVoice: bp.brand_voice,
  });

  let headline = "";
  let subheadline = "";
  try {
    const raw = await generateCaption(headlinePrompt);
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    headline = parsed.headline || "";
    subheadline = parsed.subheadline || "";
  } catch {
    headline = idea.toUpperCase().slice(0, 40);
  }

  // 5. Generate image — assemble reference images: [logo?, person?, ...userRefs]
  const personReferenceImages: { base64: string; mimeType: string }[] = [
    ...(params.referenceImages || []),
  ];

  if (params.includeProfilePhoto && personReferenceImages.length === 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("profile_photo_url")
      .eq("id", params.userId)
      .single();

    if (profile?.profile_photo_url) {
      try {
        const photoUrl = normalizeStorageUrl(profile.profile_photo_url as string)!;
        const photoRes = await fetch(photoUrl);
        if (photoRes.ok) {
          const buffer = Buffer.from(await photoRes.arrayBuffer());
          personReferenceImages.push({
            base64: buffer.toString("base64"),
            mimeType: photoRes.headers.get("content-type") || "image/jpeg",
          });
        }
      } catch {
        /* skip */
      }
    }
  }

  let logoReference: { base64: string; mimeType: string } | null = null;
  if (bp.brand_logo_url) {
    try {
      const logoUrl = normalizeStorageUrl(bp.brand_logo_url)!;
      const logoRes = await fetch(logoUrl);
      if (logoRes.ok) {
        const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
        logoReference = {
          base64: logoBuffer.toString("base64"),
          mimeType: logoRes.headers.get("content-type") || "image/png",
        };
      }
    } catch (err) {
      console.error("Erro ao baixar logotipo da marca:", err);
    }
  }

  const referenceImages = logoReference
    ? [logoReference, ...personReferenceImages]
    : personReferenceImages;

  const hasPersonReference = personReferenceImages.length > 0;
  const imagePrompt = buildImagePrompt({
    userPrompt: idea,
    niche: bp.niche,
    visualStyle: bp.visual_style,
    colorPalette: bp.color_palette ?? undefined,
    imageFormat: params.imageFormat,
    headline,
    subheadline: hasPersonReference ? undefined : subheadline,
    hasBrandLogo: !!logoReference,
    variationSeed: post.id,
  });

  const personHint = hasPersonReference
    ? logoReference
      ? "\nInclua uma pessoa com aparencia semelhante a(s) foto(s) de referencia (EXCLUINDO a primeira imagem, que e o logotipo) como protagonista da cena."
      : "\nInclua uma pessoa com aparencia semelhante a foto de referencia como protagonista da cena."
    : "";

  let base64: string;
  let mimeType: string;
  try {
    const imageResult = await generateImage({
      prompt: imagePrompt + personHint,
      imageFormat: params.imageFormat,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    });
    base64 = imageResult.base64;
    mimeType = imageResult.mimeType;
  } catch (err) {
    await refundCredits({
      userId: params.userId,
      amount: 1,
      description: "Reembolso - falha na geracao de imagem",
      postId: post.id,
    });
    await admin
      .from("posts")
      .update({ status: "failed" } as never)
      .eq("id", post.id);
    throw err;
  }

  // 6. Upload
  const filePath = `${params.userId}/${post.id}.png`;
  const buffer = Buffer.from(base64, "base64");
  const { error: uploadError } = await admin.storage
    .from("generated-images")
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    await refundCredits({
      userId: params.userId,
      amount: 1,
      description: "Reembolso - falha no upload de imagem",
      postId: post.id,
    });
    await admin
      .from("posts")
      .update({ status: "failed" } as never)
      .eq("id", post.id);
    return null;
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("generated-images").getPublicUrl(filePath);

  // 7. Generate caption + hashtags
  const captionPrompt = buildCaptionPrompt({
    userPrompt: idea,
    niche: bp.niche,
    targetAudience: bp.target_audience,
    brandVoice: bp.brand_voice,
    contentPillars: bp.content_pillars,
    additionalContext: bp.additional_context ?? undefined,
  });
  const caption = await generateCaption(captionPrompt);

  const hashtagsPrompt = buildHashtagsPrompt({ caption, niche: bp.niche });
  const hashtags = await generateHashtags(hashtagsPrompt);

  // 8. Update post
  await admin
    .from("posts")
    .update({
      generated_image_url: publicUrl,
      generated_image_prompt: imagePrompt,
      caption,
      hashtags,
      credits_charged: 1,
    } as never)
    .eq("id", post.id)
    .eq("user_id", params.userId);

  return { postId: post.id, imageUrl: publicUrl, caption, hashtags, idea };
}
