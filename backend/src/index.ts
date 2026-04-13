import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cron from "node-cron";

import { authMiddleware } from "./middleware/auth";
import generateRouter from "./routes/generate";
import postsRouter from "./routes/posts";
import billingRouter from "./routes/billing";
import instagramRouter from "./routes/instagram";
import cronRouter from "./routes/cron";
import { publishScheduledPosts, generateAutopilotPosts } from "./routes/cron";
import autopilotRouter from "./routes/autopilot";
import brandProfileRouter from "./routes/brand-profile";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// JSON body parser para todas as rotas EXCETO o webhook do Stripe
// O webhook do billing precisa de raw body, entao aplicamos json parsing
// apenas nas rotas que nao sao /api/billing/webhook
app.use((req, res, next) => {
  if (req.path === "/api/billing/webhook") {
    // Nao parsear JSON aqui - o handler do webhook usa express.raw()
    next();
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: "Muitas requisicoes. Tente novamente em alguns minutos." });
    }

    entry.count++;
    return next();
  };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

// Montar rotas
app.use("/api/generate", authMiddleware, rateLimit(20, 60000), generateRouter);
app.use("/api/posts", authMiddleware, postsRouter);
app.use("/api/billing", billingRouter); // mixed: checkout+credits usam auth internamente, webhook nao
app.use("/api/instagram", authMiddleware, instagramRouter);
app.use("/api/autopilot", authMiddleware, autopilotRouter);
app.use("/api/brand-profile", authMiddleware, brandProfileRouter);
app.use("/api/cron", cronRouter); // sem auth, usa CRON_SECRET

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Agendar cron job para publicar posts agendados a cada 1 minuto
cron.schedule("*/1 * * * *", async () => {
  try {
    const result = await publishScheduledPosts();
    if (result.published > 0) {
      console.log(`[cron] ${result.published} post(s) publicado(s)`);
    }
  } catch (error) {
    console.error("[cron] Erro ao executar publicacao agendada:", error);
  }

  // Executar geracao de posts do autopilot
  try {
    const autopilotResult = await generateAutopilotPosts();
    if (autopilotResult.generated > 0) {
      console.log(`[cron/autopilot] ${autopilotResult.generated} post(s) gerado(s)`);
    }
  } catch (error) {
    console.error("[cron/autopilot] Erro ao executar geracao automatica:", error);
  }
});

app.listen(PORT, () => {
  console.log(`Backend SocialIA rodando na porta ${PORT}`);
});
