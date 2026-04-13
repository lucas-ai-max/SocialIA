import { Request, Response, NextFunction } from "express";
import { createAuthClient } from "../lib/supabase";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
  supabase?: ReturnType<typeof createAuthClient>;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Token nao fornecido" });
    return;
  }

  const supabase = createAuthClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    res.status(401).json({ error: "Token invalido" });
    return;
  }

  req.user = { id: user.id, email: user.email || "" };
  req.supabase = supabase;
  next();
}
