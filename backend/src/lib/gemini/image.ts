const REPLICATE_API = "https://api.replicate.com/v1";
const MODEL = "google/nano-banana-pro";
const MAX_WAIT_MS = 120_000;
const POLL_INTERVAL_MS = 2_000;

function aspectRatioFor(format: "square" | "portrait"): string {
  return format === "portrait" ? "3:4" : "1:1";
}

type Prediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  urls: { get: string; cancel: string };
};

export async function generateImage(params: {
  prompt: string;
  imageFormat: "square" | "portrait";
  referenceImages?: { base64: string; mimeType: string }[];
}): Promise<{ base64: string; mimeType: string }> {
  const apiKey = process.env.REPLICATE_API_TOKEN!;

  const input: Record<string, unknown> = {
    prompt: params.prompt,
    aspect_ratio: aspectRatioFor(params.imageFormat),
    output_format: "png",
    resolution: "2K",
  };

  if (params.referenceImages?.length) {
    input.image_input = params.referenceImages.map(
      (ref) => `data:${ref.mimeType};base64,${ref.base64}`
    );
  }

  const res = await fetch(`${REPLICATE_API}/models/${MODEL}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Replicate API error:", error);
    throw new Error(`Falha na geracao de imagem: ${res.status}`);
  }

  let prediction = (await res.json()) as Prediction;

  const terminal = new Set(["succeeded", "failed", "canceled"]);
  const startedAt = Date.now();
  while (!terminal.has(prediction.status) && Date.now() - startedAt < MAX_WAIT_MS) {
    if (!prediction.urls?.get) {
      console.error("Replicate sem urls.get:", JSON.stringify(prediction).slice(0, 500));
      throw new Error("Resposta invalida do Replicate (sem url de polling).");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!pollRes.ok) {
      throw new Error(`Falha ao consultar geracao: ${pollRes.status}`);
    }
    prediction = (await pollRes.json()) as Prediction;
  }

  if (prediction.status !== "succeeded") {
    const reason = prediction.error || prediction.status;
    console.error("Replicate falhou:", reason);
    const reasonStr = typeof reason === "string" ? reason : "";
    const isSafetyBlock = /safety|flagged|sensitive|policy|blocked/i.test(reasonStr);
    throw new Error(
      isSafetyBlock
        ? "Imagem bloqueada pelo filtro de seguranca. Tente com outro tema."
        : reasonStr.length > 0
          ? `Falha na geracao de imagem: ${reasonStr}`
          : "Falha na geracao de imagem. Tente novamente."
    );
  }

  const output = prediction.output;
  const imageUrl = Array.isArray(output) ? output[0] : output;
  if (!imageUrl || typeof imageUrl !== "string") {
    console.error("Replicate sem output:", JSON.stringify(prediction).slice(0, 500));
    throw new Error("Replicate nao retornou URL da imagem.");
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error(`Falha ao baixar imagem gerada: ${imageRes.status}`);
  }
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const mimeType = imageRes.headers.get("content-type") || "image/png";

  return { base64: buffer.toString("base64"), mimeType };
}
