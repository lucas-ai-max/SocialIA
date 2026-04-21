const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

function aspectRatioFor(format: "square" | "portrait"): string {
  return format === "portrait" ? "3:4" : "1:1";
}

export async function generateImage(params: {
  prompt: string;
  imageFormat: "square" | "portrait";
  referenceImages?: { base64: string; mimeType: string }[];
}): Promise<{ base64: string; mimeType: string }> {
  const apiKey = process.env.GEMINI_API_KEY!;

  const parts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [];

  if (params.referenceImages?.length) {
    parts.push({
      text: "Use esta imagem como referencia visual para o estilo e aparencia da pessoa a ser incluida na cena:",
    });
    for (const ref of params.referenceImages) {
      parts.push({
        inline_data: { mime_type: ref.mimeType, data: ref.base64 },
      });
    }
  }

  parts.push({ text: params.prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatioFor(params.imageFormat),
        imageSize: "2K",
      },
    },
  };

  const res = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Gemini Image API error:", error);
    throw new Error(`Falha na geracao de imagem: ${res.status}`);
  }

  const data: any = await res.json();
  const candidates = data.candidates;

  if (!candidates?.length) {
    console.error("Gemini sem candidates:", JSON.stringify(data).slice(0, 500));
    throw new Error("Nenhuma resposta gerada pelo Gemini. Tente novamente.");
  }

  const content = candidates[0].content;
  if (!content?.parts) {
    const reason = candidates[0].finishReason || "unknown";
    const safetyRatings = JSON.stringify(candidates[0].safetyRatings || []);
    console.error(`Gemini bloqueou a geracao. Reason: ${reason}, Safety: ${safetyRatings}`);
    throw new Error(
      `Imagem bloqueada pelo filtro de seguranca (${reason}). Tente com outro tema.`
    );
  }

  for (const part of content.parts) {
    if (part.inlineData || part.inline_data) {
      const inlineData = part.inlineData || part.inline_data;
      return {
        base64: inlineData.data,
        mimeType: inlineData.mimeType || inlineData.mime_type || "image/png",
      };
    }
  }

  const textParts = content.parts
    .filter((p: Record<string, unknown>) => p.text)
    .map((p: Record<string, unknown>) => p.text)
    .join(" ");
  console.error("Gemini retornou texto sem imagem:", textParts.slice(0, 300));
  throw new Error("Gemini nao gerou imagem. Tente novamente com outro prompt.");
}
