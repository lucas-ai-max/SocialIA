"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Zap, Plus, X, Check, Trash2, Clock, Loader2, ExternalLink, ImageIcon } from "lucide-react";

interface AutopilotConfig {
  isActive: boolean;
  postsPerDay: number;
  scheduleTimes: string[];
  requiresApproval: boolean;
  includeProfilePhoto: boolean;
}

interface PendingPost {
  id: string;
  caption: string | null;
  generated_image_url?: string | null;
  hashtags?: string[] | null;
  created_at: string;
}

const DEFAULT_CONFIG: AutopilotConfig = {
  isActive: false,
  postsPerDay: 1,
  scheduleTimes: ["09:00"],
  requiresApproval: true,
  includeProfilePhoto: false,
};

export default function AutopilotPage() {
  const [config, setConfig] = useState<AutopilotConfig>(DEFAULT_CONFIG);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newHour, setNewHour] = useState("09");
  const [newMinute, setNewMinute] = useState("00");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<PendingPost | null>(null);
  const [editCaption, setEditCaption] = useState("");

  const fetchConfig = useCallback(async () => {
    try {
      const res = await apiFetch("/api/autopilot");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          includeProfilePhoto: data.includeProfilePhoto ?? false,
        });
      }
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await apiFetch("/api/autopilot/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingPosts(Array.isArray(data) ? data : data.posts || []);
      }
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchConfig(), fetchPending()]).finally(() =>
      setLoading(false)
    );
  }, [fetchConfig, fetchPending]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/autopilot", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Configuracao salva com sucesso!" });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error || "Erro ao salvar configuracao." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar configuracao." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleAddTime = () => {
    const time = `${newHour}:${newMinute}`;
    if (
      config.scheduleTimes.length < config.postsPerDay &&
      !config.scheduleTimes.includes(time)
    ) {
      setConfig((prev) => ({
        ...prev,
        scheduleTimes: [...prev.scheduleTimes, time].sort(),
      }));
      setShowTimePicker(false);
    }
  };

  const handleRemoveTime = (time: string) => {
    setConfig((prev) => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.filter((t) => t !== time),
    }));
  };

  const handlePostsPerDayChange = (delta: number) => {
    setConfig((prev) => {
      const newVal = Math.min(5, Math.max(1, prev.postsPerDay + delta));
      const trimmedTimes =
        prev.scheduleTimes.length > newVal
          ? prev.scheduleTimes.slice(0, newVal)
          : prev.scheduleTimes;
      return { ...prev, postsPerDay: newVal, scheduleTimes: trimmedTimes };
    });
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/autopilot/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchPending();
      }
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id: string) => {
    confirmAction("Rejeitar este post?", async () => {
      setActionLoading(id);
      try {
        const res = await apiFetch(`/api/autopilot/${id}/reject`, {
          method: "POST",
        });
        if (res.ok) {
          toast.success("Post rejeitado!");
          await fetchPending();
        }
      } catch {
        toast.error("Erro ao rejeitar post.");
      } finally {
        setActionLoading(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#1A73E8]/10">
          <Zap className="size-5 text-[#1A73E8]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#1F2937] md:text-2xl">Autopilot</h1>
          <p className="text-sm text-[#474747]">
            Configure a IA para criar e publicar posts automaticamente
          </p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Left: Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#1F2937]">
              Configuracao
            </CardTitle>
            <CardDescription>
              Defina como o autopilot deve funcionar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#474747]">
                  Autopilot ativo
                </span>
                <Badge
                  variant={config.isActive ? "default" : "secondary"}
                  className={
                    config.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }
                >
                  {config.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.isActive}
                onClick={() =>
                  setConfig((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ${
                  config.isActive ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block size-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                    config.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Posts per day */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#474747]">
                Posts por dia
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePostsPerDayChange(-1)}
                  disabled={config.postsPerDay <= 1}
                >
                  <span className="text-base font-semibold">-</span>
                </Button>
                <span className="w-8 text-center text-base font-semibold text-[#1F2937]">
                  {config.postsPerDay}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePostsPerDayChange(1)}
                  disabled={config.postsPerDay >= 5}
                >
                  <span className="text-base font-semibold">+</span>
                </Button>
              </div>
            </div>

            {/* Posting times */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#474747]">
                Horarios de publicacao
              </label>
              <div className="flex flex-wrap gap-2">
                {config.scheduleTimes.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f9fe] px-3 py-1 text-sm font-medium text-[#1A73E8] transition-all duration-300"
                  >
                    <Clock className="size-3.5" />
                    {time}
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(time)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[#1A73E8]/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>

              {config.scheduleTimes.length < config.postsPerDay && (
                <>
                  {showTimePicker ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        value={newHour}
                        onChange={(e) => setNewHour(e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-[#1A73E8] focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                      >
                        {Array.from({ length: 24 }, (_, i) =>
                          String(i).padStart(2, "0")
                        ).map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm font-medium text-[#474747]">
                        :
                      </span>
                      <select
                        value={newMinute}
                        onChange={(e) => setNewMinute(e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-[#1A73E8] focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" onClick={handleAddTime}>
                        <Check className="size-3.5" />
                        Adicionar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTimePicker(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTimePicker(true)}
                      className="mt-1"
                    >
                      <Plus className="size-3.5" />
                      Adicionar horario
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Include face checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="include-face"
                checked={config.includeProfilePhoto}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    includeProfilePhoto: e.target.checked,
                  }))
                }
                className="mt-0.5 size-4 rounded border-gray-300 text-[#1A73E8] accent-[#1A73E8]"
              />
              <div>
                <label
                  htmlFor="include-face"
                  className="text-sm font-medium text-[#474747] cursor-pointer"
                >
                  Incluir meu rosto nos posts
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  A IA usara sua foto de perfil como referencia para gerar
                  imagens com voce
                </p>
              </div>
            </div>

            {/* Approval checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="require-approval"
                checked={config.requiresApproval}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    requiresApproval: e.target.checked,
                  }))
                }
                className="mt-0.5 size-4 rounded border-gray-300 text-[#1A73E8] accent-[#1A73E8]"
              />
              <div>
                <label
                  htmlFor="require-approval"
                  className="text-sm font-medium text-[#474747] cursor-pointer"
                >
                  Aprovar posts antes de publicar
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quando ativado, os posts gerados ficarao como rascunho ate
                  voce aprovar
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="space-y-3 pt-2">
              <Button
                className="w-full bg-[#1A73E8] hover:bg-[#0d5bbd]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar configuracao"
                )}
              </Button>

              {message && (
                <p
                  className={`text-center text-sm font-medium transition-all duration-300 ${
                    message.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Pending posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-[#1F2937]">
                Aguardando aprovacao
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-[#F26526] text-white"
              >
                {pendingPosts.length}
              </Badge>
            </div>
            <CardDescription>
              Posts gerados pelo autopilot que precisam da sua aprovacao
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#f4f9fe] mb-3">
                  <Clock className="size-5 text-[#1A73E8]" />
                </div>
                <p className="text-sm text-gray-500 max-w-[280px]">
                  Nenhum post pendente. Quando o autopilot gerar posts com
                  aprovacao ativada, eles aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => { setPreviewPost(post); setEditCaption(post.caption || ""); }}
                    className="flex gap-3 rounded-xl border border-gray-100 bg-[#f4f9fe]/50 p-3 transition-all duration-300 hover:shadow-sm cursor-pointer"
                  >
                    {post.generated_image_url && (
                      <img
                        src={post.generated_image_url}
                        alt=""
                        className="size-14 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#474747] line-clamp-2">
                        {(post.caption || "").length > 60
                          ? `${(post.caption || "").slice(0, 60)}...`
                          : post.caption}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Button
                        size="xs"
                        className="bg-green-500 text-white hover:bg-green-600"
                        onClick={(e) => { e.stopPropagation(); handleApprove(post.id); }}
                        disabled={actionLoading === post.id}
                      >
                        {actionLoading === post.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={(e) => { e.stopPropagation(); handleReject(post.id); }}
                        disabled={actionLoading === post.id}
                      >
                        <Trash2 className="size-3" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post Preview/Edit Dialog */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="max-w-3xl w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-[22px] !p-0 !gap-0 flex flex-col">
          <DialogHeader className="px-4 pt-6 pb-4 shrink-0 sm:px-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-[#1F2937]">Editar post</DialogTitle>
              <Badge variant="secondary" className="bg-[#F26526]/10 text-[#F26526] text-xs">
                Autopilot
              </Badge>
            </div>
          </DialogHeader>

          {previewPost && (
            <>
            <div className="flex-1 overflow-y-auto px-4 space-y-5 sm:px-6">
              {/* Image */}
              {previewPost.generated_image_url ? (
                <div className="flex justify-center rounded-[16px] overflow-hidden bg-[#f4f9fe]">
                  <img src={previewPost.generated_image_url} alt="Post" className="max-h-[240px] w-auto object-contain sm:max-h-[300px]" />
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 rounded-[16px] bg-[#f4f9fe]">
                  <ImageIcon className="size-10 text-muted-foreground/30" />
                </div>
              )}

              {/* Editable caption */}
              <div className="space-y-2">
                <Label>Legenda</Label>
                <Textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value.slice(0, 2200))}
                  className="min-h-32 resize-none rounded-[16px]"
                />
                <p className="text-right text-xs text-muted-foreground">{editCaption.length}/2200</p>
              </div>

              {/* Hashtags */}
              {previewPost.hashtags && previewPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewPost.hashtags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-[#1A73E8]/10 px-2.5 py-0.5 text-xs text-[#1A73E8]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground">
                Criado em {new Date(previewPost.created_at).toLocaleString("pt-BR")}
              </p>
            </div>

            {/* Footer - always visible */}
            <div className="shrink-0 border-t border-[#e5e7eb] px-4 py-4 bg-white space-y-2 sm:px-6">
              <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/posts/${previewPost.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ caption: editCaption }),
                      });
                      toast.success("Legenda salva!");
                      setPreviewPost(null);
                      fetchPending();
                    } catch {
                      toast.error("Erro ao salvar legenda.");
                    }
                  }}
                >
                  Salvar
                </Button>
                <Button
                  className="bg-green-500 text-white hover:bg-green-600 gap-2"
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/posts/${previewPost.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ caption: editCaption }),
                      });
                    } catch { /* continue with approve even if save fails */ }
                    handleApprove(previewPost.id);
                    setPreviewPost(null);
                  }}
                  disabled={actionLoading === previewPost.id}
                >
                  <Check className="size-4" />
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                  onClick={() => {
                    handleReject(previewPost.id);
                    setPreviewPost(null);
                  }}
                  disabled={actionLoading === previewPost.id}
                >
                  <Trash2 className="size-4" />
                  Rejeitar
                </Button>
              </div>
              <Link
                href={`/post/${previewPost.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#474747] transition-all duration-300 hover:bg-[#f4f9fe]"
              >
                <ExternalLink className="size-4" />
                Abrir pagina completa
              </Link>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
