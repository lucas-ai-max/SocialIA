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

// CORS — FRONTEND_URL pode ser um unico URL ou lista separada por virgulas.
// Em dev, aceitamos 3000 e 3001 por padrao (Next costuma usar 3001 se 3000 estiver ocupada).
const allowedOrigins = (process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((s) => s.trim()).filter(Boolean)
  : ["http://localhost:3000", "http://localhost:3001"]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} nao permitida pelo CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

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
