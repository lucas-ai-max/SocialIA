"use client";

import { toast } from "sonner";
import { Camera, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InstagramConnectProps {
  connected: boolean;
  username?: string;
  profilePictureUrl?: string;
}

async function handleConnect() {
  const res = await apiFetch("/api/instagram/connect", { method: "POST" });
  if (res.ok) {
    const data = await res.json();
    if (data.reconnected) {
      toast.success(`Reconectado com @${data.username}!`);
      window.location.href = "/onboarding?instagram=connected&step=questionnaire";
      return;
    }
    window.location.href = data.redirectUrl;
  } else {
    toast.error("Erro ao conectar. Tente novamente.");
  }
}

export function InstagramConnect({
  connected,
  username,
  profilePictureUrl,
}: InstagramConnectProps) {
  if (connected) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">Instagram conectado!</CardTitle>
          <CardDescription>
            Sua conta foi vinculada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={username || "Perfil"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">@{username}</p>
              <p className="text-sm text-muted-foreground">Conta conectada</p>
            </div>
          </div>
          <Button
            onClick={() => {
              // Scroll or trigger next step - handled by parent via URL
              window.location.href = "/onboarding?instagram=connected&step=questionnaire";
            }}
            className="w-full"
            style={{ backgroundColor: "#1A73E8" }}
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Camera className="h-8 w-8" style={{ color: "#1A73E8" }} />
        </div>
        <CardTitle className="text-xl">Conecte seu Instagram</CardTitle>
        <CardDescription>
          Precisamos da conexao com seu Instagram Business para publicar posts
          automaticamente no seu perfil.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ul className="w-full space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span>Publicar posts diretamente no seu perfil</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span>Agendar publicacoes automaticamente</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span>Analisar o desempenho dos seus posts</span>
          </li>
        </ul>
        <button
          onClick={handleConnect}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 bg-[#1A73E8] hover:bg-[#0d5bbd]"
        >
          <Camera className="h-4 w-4" />
          Conectar Instagram
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Voce precisara de uma conta Instagram Business vinculada a uma Pagina
          do Facebook.
        </p>
      </CardContent>
    </Card>
  );
}
