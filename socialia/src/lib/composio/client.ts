import { Composio } from "@composio/core";

let instance: Composio | null = null;

export function getComposio(): Composio {
  if (!instance) {
    instance = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! });
  }
  return instance;
}
