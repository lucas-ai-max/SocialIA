"use client";

import { useState } from "react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle, XCircle, Loader2, LogOut, Link2 } from "lucide-react";

async function handleConnect() {
  const res = await apiFetch("/api/instagram/connect", { method: "POST" });
  if (res.ok) {
    const data = await res.json();
    if (data.reconnected) {
      toast.success(`Reconectado com @${data.username}!`);
      window.location.reload();
      return;
    }
    window.location.href = data.redirectUrl;
  } else {
    toast.error("Erro ao conectar. Tente novamente.");
  }
}

interface InstagramCardProps {
  connected: boolean;
  username?: string;
  profilePictureUrl?: string | null;
  followersCount?: number | null;
}

export function InstagramCard({
  connected,
  username,
  profilePictureUrl,
  followersCount,
}: InstagramCardProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const handleDisconnect = () => {
    confirmAction("Desconectar sua conta do Instagram?", async () => {
      setIsDisconnecting(true);
      try {
        const res = await apiFetch("/api/instagram/disconnect", {
          method: "POST",
        });
        if (res.ok) {
          setIsDisconnected(true);
          toast.success("Conta desconectada!");
          router.refresh();
        }
      } catch {
        toast.error("Erro ao desconectar. Tente novamente.");
      } finally {
        setIsDisconnecting(false);
      }
    });
  };

  if (isDisconnected || !connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <XCircle className="size-4" />
          Nenhuma conta conectada
        </div>
        <button
          onClick={handleConnect}
          className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#0d5bbd] hover:-translate-y-px"
        >
          <Link2 className="size-4" />
          Conectar Instagram
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt={username}
            className="size-12 rounded-full object-cover ring-2 ring-green-500/20"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1A73E8] to-[#5fc1f8]">
            <Globe className="size-6 text-white" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium text-[#1F2937]">@{username}</p>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="size-3" />
            Conectado
          </div>
          {followersCount != null && followersCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {followersCount.toLocaleString("pt-BR")} seguidores
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleConnect}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#474747] transition-all duration-300 hover:bg-[#f4f9fe]"
        >
          <Link2 className="size-3.5" />
          Reconectar
        </button>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {isDisconnecting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          Desconectar
        </Button>
      </div>
    </div>
  );
}
