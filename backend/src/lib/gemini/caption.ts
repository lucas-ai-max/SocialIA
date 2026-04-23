const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_TIMEOUT_MS = 30_000;

type ChatOpts = {
  temperature?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
};

async function chat(prompt: string, opts: ChatOpts = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;

  const body: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.presencePenalty !== undefined) body.presence_penalty = opts.presencePenalty;
  if (opts.frequencyPenalty !== undefined) body.frequency_penalty = opts.frequencyPenalty;

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("OpenAI Chat API error:", error);
    throw new Error(`Falha na geracao de texto: ${res.status}`);
  }

  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    console.error("OpenAI sem resposta:", JSON.stringify(data).slice(0, 500));
    throw new Error("Nenhum texto gerado pela OpenAI");
  }

  return text.trim();
}

export async function generateCaption(prompt: string): Promise<string> {
  return await chat(prompt);
}

export async function generateHashtags(prompt: string): Promise<string[]> {
  const text = await chat(prompt).catch((err) => {
    console.error("generateHashtags falhou:", err);
    return "";
  });

  if (!text) return [];

  return text
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.startsWith("#"))
    .slice(0, 20);
}

export async function generateIdea(prompt: string): Promise<string> {
  const text = await chat(prompt, {
    temperature: 1.1,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5,
  });
  return text.replace(/^["']|["']$/g, "");
}
