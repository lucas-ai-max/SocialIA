"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function ManageSubscription() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/billing/portal", { method: "POST" });

      if (!res.ok) {
        throw new Error("Erro ao abrir portal");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Erro ao abrir portal de cobranca.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handlePortal}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ExternalLink className="size-4" />
      )}
      Gerenciar Assinatura
    </Button>
  );
}
