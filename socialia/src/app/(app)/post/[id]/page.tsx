"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Send,
  Trash2,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SchedulePicker } from "@/components/create/schedule-picker";

interface Post {
  id: string;
  generation_mode: string;
  user_prompt: string | null;
  image_format: string;
  generated_image_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "Rascunho", className: "bg-gray-100 text-gray-700" },
  scheduled: { label: "Agendado", className: "bg-blue-100 text-blue-700" },
  publishing: { label: "Publicando", className: "bg-yellow-100 text-yellow-700" },
  published: { label: "Publicado", className: "bg-green-100 text-green-700" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-700" },
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchPost = useCallback(async () => {
    const res = await apiFetch(`/api/posts/${id}`);
    if (res.ok) {
      const data = await res.json();
      const p = data.post || data;
      setPost(p);
      setCaption(p.caption || "");
      setHashtags(p.hashtags || []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Post nao encontrado.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard")}
        >
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
  const isDraft = post.status === "draft";
  const isFailed = post.status === "failed";
  const isScheduled = post.status === "scheduled";
  const canEdit = isDraft || isFailed || isScheduled;

  const handleSave = async () => {
    await apiFetch(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ caption, hashtags }),
    });
    setMessage({ type: "success", text: "Legenda salva!" });
    toast.success("Legenda salva!");
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setMessage(null);
    try {
      await handleSave();
      const res = await apiFetch(`/api/posts/${id}/publish`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao publicar");
      }
      setMessage({ type: "success", text: "Post publicado com sucesso!" });
      toast.success("Post publicado com sucesso!");
      fetchPost();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao publicar";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = () => {
    confirmAction("Excluir este post permanentemente?", async () => {
      setIsDeleting(true);
      const res = await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post excluido!");
        router.push("/dashboard");
      } else {
        toast.error("Erro ao excluir post.");
        setIsDeleting(false);
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>
        <Badge className={config.className}>{config.label}</Badge>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image */}
        <Card>
          <CardContent className="p-2">
            {post.generated_image_url ? (
              <img
                src={post.generated_image_url}
                alt="Post"
                className="w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                <p className="text-muted-foreground">Sem imagem</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-4">
          {/* Caption */}
          <div className="space-y-2">
            <Label>Legenda</Label>
            {canEdit ? (
              <>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
                  className="min-h-40 resize-none"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {caption.length}/2200
                </p>
              </>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1A73E8]/10 px-2.5 py-0.5 text-xs text-[#1A73E8]"
                >
                  {tag}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setHashtags(hashtags.filter((_, idx) => idx !== i))}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-[#1A73E8]/20"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tag = newHashtag.trim().replace(/^#/, "");
                      if (tag && !hashtags.includes(`#${tag}`)) {
                        setHashtags([...hashtags, `#${tag}`]);
                        setNewHashtag("");
                      }
                    }
                  }}
                  placeholder="Adicionar hashtag..."
                  className="flex-1 rounded-full border border-input bg-transparent px-4 py-1.5 text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const tag = newHashtag.trim().replace(/^#/, "");
                    if (tag && !hashtags.includes(`#${tag}`)) {
                      setHashtags([...hashtags, `#${tag}`]);
                      setNewHashtag("");
                    }
                  }}
                  disabled={!newHashtag.trim()}
                  className="rounded-full border border-[#1A73E8] px-4 py-1.5 text-sm text-[#1A73E8] hover:bg-[#1A73E8]/10 disabled:opacity-40"
                >
                  Adicionar
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Criado em: {new Date(post.created_at).toLocaleString("pt-BR")}</p>
            {post.scheduled_at && (
              <p>
                Agendado para:{" "}
                {new Date(post.scheduled_at).toLocaleString("pt-BR")}
              </p>
            )}
            {post.published_at && (
              <p>
                Publicado em:{" "}
                {new Date(post.published_at).toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Button
                  variant="secondary"
                  className="w-full gap-2 sm:flex-1"
                  onClick={handleSave}
                >
                  Salvar
                </Button>
                {!isScheduled ? (
                  <Button
                    className="w-full gap-2 bg-[#1A73E8] text-white hover:bg-[#0d5bbd] sm:flex-1"
                    onClick={() => setScheduleOpen(true)}
                  >
                    <Calendar className="h-4 w-4" />
                    Agendar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 sm:flex-1"
                    onClick={async () => {
                      confirmAction("Desagendar este post?", async () => {
                        const res = await apiFetch(`/api/posts/${id}/cancel`, { method: "POST" });
                        if (res.ok) {
                          toast.success("Post desagendado!");
                          fetchPost();
                        }
                      });
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Desagendar
                  </Button>
                )}
              </div>
              <Button
                className="w-full gap-2 bg-green-600 text-white hover:bg-green-700"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isPublishing ? "Publicando..." : "Postar Agora"}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                Excluir Post
              </Button>
            </div>
          )}
        </div>
      </div>

      <SchedulePicker
        postId={id}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onScheduled={() => {
          setScheduleOpen(false);
          setMessage({ type: "success", text: "Post agendado!" });
          fetchPost();
        }}
      />
    </div>
  );
}
