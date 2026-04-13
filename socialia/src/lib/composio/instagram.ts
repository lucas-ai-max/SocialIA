import { getComposio } from "./client";

/**
 * Inicia o fluxo OAuth do Instagram para um usuario.
 * Retorna a URL de redirect e o ID da conexao.
 */
export async function initiateInstagramOAuth(params: {
  userId: string;
  redirectUrl: string;
}): Promise<{ redirectUrl: string; connectionId: string }> {
  const composio = getComposio();

  const connectionRequest = await composio.connectedAccounts.initiate(
    params.userId,
    process.env.COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID!,
    {
      callbackUrl: params.redirectUrl,
      allowMultiple: true,
    }
  );

  const oauthRedirectUrl = connectionRequest.redirectUrl;

  if (!oauthRedirectUrl) {
    throw new Error("Falha ao gerar URL de autorizacao do Instagram");
  }

  return {
    redirectUrl: oauthRedirectUrl,
    connectionId: connectionRequest.id,
  };
}

/**
 * Busca a conexao ativa do Instagram de um usuario.
 */
export async function getActiveInstagramConnection(
  userId: string
): Promise<{ connectionId: string } | null> {
  const composio = getComposio();

  const response = await composio.connectedAccounts.list({
    toolkitSlugs: ["instagram"],
    statuses: ["ACTIVE"],
    userIds: [userId],
  });

  const items = response.items || [];
  if (items.length === 0) return null;

  return { connectionId: items[0].id };
}

/**
 * Cria um media container no Instagram via Composio proxy.
 */
export async function createInstagramPost(params: {
  connectionId: string;
  userId: string;
  imageUrl: string;
  caption: string;
  publishTime?: number;
}): Promise<{ containerId?: string; mediaId?: string; success: boolean }> {
  const composio = getComposio();

  const body: Record<string, unknown> = {
    image_url: params.imageUrl,
    caption: params.caption,
  };

  if (params.publishTime) {
    body.published = false;
    body.scheduled_publish_time = params.publishTime;
  }

  const result = await composio.tools.proxyExecute({
    connectedAccountId: params.connectionId,
    endpoint: "/me/media",
    method: "POST",
    body,
  });

  if (result.status >= 400) {
    const errMsg =
      (result.data as Record<string, Record<string, string>>)?.error?.message ||
      "Falha ao criar post no Instagram";
    throw new Error(errMsg);
  }

  const data = result.data as Record<string, string>;

  return {
    containerId: data?.id,
    success: true,
  };
}

/**
 * Publica um media container no Instagram via Composio proxy.
 */
export async function publishInstagramMedia(params: {
  connectionId: string;
  userId: string;
  containerId: string;
}): Promise<{ mediaId: string }> {
  const composio = getComposio();

  const result = await composio.tools.proxyExecute({
    connectedAccountId: params.connectionId,
    endpoint: "/me/media_publish",
    method: "POST",
    body: {
      creation_id: params.containerId,
    },
  });

  if (result.status >= 400) {
    const errMsg =
      (result.data as Record<string, Record<string, string>>)?.error?.message ||
      "Falha ao publicar no Instagram";
    throw new Error(errMsg);
  }

  const data = result.data as Record<string, string>;
  return { mediaId: data?.id };
}
