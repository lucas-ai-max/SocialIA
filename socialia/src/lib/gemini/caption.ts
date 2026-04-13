import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export async function generateCaption(prompt: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("Nenhuma legenda gerada pelo Gemini");
  }

  return text.trim();
}

export async function generateHashtags(prompt: string): Promise<string[]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) return [];

  return text
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.startsWith("#"))
    .slice(0, 20);
}

export async function generateIdea(prompt: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("Nenhuma ideia gerada pelo Gemini");
  }

  return text.trim().replace(/^["']|["']$/g, "");
}
