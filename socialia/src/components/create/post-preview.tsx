"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RefreshCw, Save, Calendar, Send, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SchedulePicker } from "@/components/create/schedule-picker";

interface PostPreviewProps {
  postId: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  onRegenerateImage: () => void;
  onRegenerateCaption: () => void;
  onSave: (caption: string, hashtags: string[]) => void;
  onSchedule: () => void;
  isRegenerating: boolean;
  credits: number;
  userName?: string | null;
  userAvatar?: string | null;
}

export function PostPreview({
  postId,
  imageUrl,
  caption: initialCaption,
  hashtags: initialHashtags,
  onRegenerateImage,
  onRegenerateCaption,
  onSave,
  onSchedule,
  isRegenerating,
  credits,
  userName,
  userAvatar,
}: PostPreviewProps) {
  const router = useRouter();
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [newHashtag, setNewHashtag] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const removeHashtag = (index: number) => {
    setHashtags((prev) => prev.filter((_, i) => i !== index));
  };

  const addHashtag = () => {
    const tag = newHashtag.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(`#${tag}`)) {
      setHashtags((prev) => [...prev, `#${tag}`]);
      setNewHashtag("");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Image preview - phone frame mockup */}
      <div className="flex items-start justify-center">
        <div className="w-full max-w-sm overflow-hidden rounded-[22px] bg-card shadow-[0_0_8px_0_rgba(0,0,0,0.1)] ring-1 ring-foreground/10">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#5fc1f8]" />
            )}
            <span className="text-sm font-semibold">{userName || "Seu perfil"}</span>
          </div>
          <div className="relative">
            {isRegenerating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <img
              src={imageUrl}
              alt="Post gerado"
              className="w-full object-contain"
            />
          </div>
          <div className="p-4">
            <p className="line-clamp-3 text-sm">
              {caption}
            </p>
            {hashtags.length > 0 && (
              <p className="mt-1 text-sm text-[#1A73E8]">
                {hashtags.join(" ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit panel */}
      <div className="space-y-6">
        {/* Caption editor */}
        <div className="space-y-2">
          <Label htmlFor="caption">Legenda</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
            className="min-h-36 resize-none"
          />
          <p className="text-right text-xs text-muted-foreground">
            {caption.length}/2200
          </p>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label>Hashtags</Label>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-[#1A73E8]/10 px-3 py-1 text-sm text-[#1A73E8]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(index)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[#1A73E8]/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHashtag();
                }
              }}
              placeholder="Adicionar hashtag..."
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addHashtag}
              disabled={!newHashtag.trim()}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Regenerate actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onRegenerateImage}
            disabled={isRegenerating || credits < 1}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerar Imagem
          </Button>
          <Button
            variant="outline"
            onClick={onRegenerateCaption}
            disabled={isRegenerating}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerar Legenda
          </Button>
        </div>
        {credits < 1 && (
          <p className="text-sm text-destructive">
            Você não tem créditos para regenerar a imagem.
          </p>
        )}
        {credits >= 1 && (
          <p className="text-xs text-muted-foreground">
            Regenerar imagem consome 1 crédito. Você tem {credits} crédito
            {credits !== 1 ? "s" : ""}.
          </p>
        )}

        {/* Save / Schedule / Publish */}
        {scheduled || published ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle className="size-5 shrink-0" />
            <p className="text-sm font-medium">
              {published
                ? "Post publicado com sucesso! Redirecionando..."
                : "Post agendado com sucesso! Redirecionando..."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => onSave(caption, hashtags)}
                disabled={isRegenerating || isPublishing}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Rascunho
              </Button>
              <Button
                onClick={() => setScheduleOpen(true)}
                disabled={isRegenerating || isPublishing}
                className="flex-1 gap-2 bg-[#1A73E8] text-white hover:bg-[#0d5bbd]"
              >
                <Calendar className="h-4 w-4" />
                Agendar
              </Button>
            </div>
            <Button
              onClick={async () => {
                setIsPublishing(true);
                try {
                  // Salvar legenda atualizada primeiro
                  onSave(caption, hashtags);
                  await new Promise((r) => setTimeout(r, 500));

                  const res = await apiFetch(`/api/posts/${postId}/publish`, {
                    method: "POST",
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Erro ao publicar");
                  }
                  setPublished(true);
                  setTimeout(() => router.push("/dashboard"), 2000);
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Erro ao publicar. Tente novamente."
                  );
                } finally {
                  setIsPublishing(false);
                }
              }}
              disabled={isRegenerating || isPublishing}
              className="w-full gap-2 bg-green-600 text-white hover:bg-green-700"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isPublishing ? "Publicando..." : "Postar Agora"}
            </Button>
          </div>
        )}

        <SchedulePicker
          postId={postId}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          onScheduled={() => {
            setScheduleOpen(false);
            setScheduled(true);
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }}
        />
      </div>
    </div>
  );
}
