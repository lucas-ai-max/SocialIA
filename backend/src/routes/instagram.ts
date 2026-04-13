import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  initiateInstagramOAuth,
  getActiveInstagramConnection,
  getInstagramProfile,
} from "../lib/composio/instagram";

const router = Router();

// POST /connect - Gerar URL de OAuth do Instagram (retorna JSON)
// Se ja existir conexao ativa no Composio, reutiliza ao inves de criar nova
router.post("/connect", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    // Tentar reutilizar conexao ativa existente no Composio
    const existing = await getActiveInstagramConnection(userId);
    if (existing) {
      const profile = await getInstagramProfile(existing.connectionId);
      if (profile) {
        await supabase.from("instagram_accounts").upsert(
          {
            user_id: userId,
            composio_connection_id: existing.connectionId,
            ig_user_id: profile.igUserId,
            ig_username: profile.username,
            ig_profile_picture_url: profile.profilePictureUrl || null,
            ig_name: profile.name || null,
            ig_followers_count: profile.followersCount || 0,
            facebook_page_id: "managed_by_composio",
            access_token: "managed_by_composio",
            token_expires_at: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            is_active: true,
          } as never,
          { onConflict: "user_id,ig_user_id" }
        );

        res.json({ reconnected: true, username: profile.username });
        return;
      }
    }

    // Sem conexao ativa — iniciar novo fluxo OAuth
    const { redirectUrl, connectionId } = await initiateInstagramOAuth({
      userId,
      redirectUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/api/auth/instagram/callback`,
    });

    // Salvar connectionId temporariamente
    await supabase
      .from("instagram_accounts")
      .upsert(
        {
          user_id: userId,
          composio_connection_id: connectionId,
          ig_user_id: "pending",
          ig_username: "pending",
          facebook_page_id: "pending",
          access_token: "managed_by_composio",
          token_expires_at: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: false,
        } as never,
        { onConflict: "user_id,ig_user_id" }
      );

    res.json({ redirectUrl });
  } catch (error) {
    console.error("Erro ao iniciar OAuth Instagram:", error);
    res.status(500).json({ error: "Erro ao iniciar conexao com Instagram." });
  }
});

// POST /callback - Processar callback do OAuth do Instagram
router.post("/callback", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    // Verificar se a conexao ficou ativa no Composio
    const connection = await getActiveInstagramConnection(userId);

    if (!connection) {
      res.status(400).json({ error: "Conexao Instagram nao encontrada." });
      return;
    }

    // Deletar a entrada "pending" anterior
    await supabase
      .from("instagram_accounts")
      .delete()
      .eq("user_id", userId)
      .eq("ig_user_id", "pending");

    // Buscar perfil real do Instagram via Composio proxy
    const profile = await getInstagramProfile(connection.connectionId);

    const igUserId = profile?.igUserId || connection.connectionId;
    const igUsername = profile?.username || "instagram_conectado";
    const igProfilePictureUrl = profile?.profilePictureUrl || null;
    const igName = profile?.name || null;
    const igFollowersCount = profile?.followersCount || 0;

    // Inserir a conta real com composio_connection_id
    await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        composio_connection_id: connection.connectionId,
        ig_user_id: igUserId,
        ig_username: igUsername,
        ig_profile_picture_url: igProfilePictureUrl,
        ig_name: igName,
        ig_followers_count: igFollowersCount,
        facebook_page_id: "managed_by_composio",
        access_token: "managed_by_composio",
        token_expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        is_active: true,
      } as never,
      { onConflict: "user_id,ig_user_id" }
    );

    res.json({ success: true, username: igUsername });
  } catch (error) {
    console.error("Erro no callback Instagram:", error);
    res.status(500).json({ error: "Erro ao processar conexao." });
  }
});

// POST /disconnect - Desconectar conta do Instagram
router.post("/disconnect", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { error } = await supabase
      .from("instagram_accounts")
      .delete()
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ error: "Erro ao desconectar conta." });
      return;
    }

    res.json({ success: true, message: "Conta desconectada com sucesso." });
  } catch (error) {
    console.error("[instagram/disconnect] Erro:", error);
    res.status(500).json({ error: "Erro ao desconectar conta." });
  }
});

export default router;
