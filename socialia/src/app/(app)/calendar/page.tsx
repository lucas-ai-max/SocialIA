"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  ImageIcon,
  X,
  ExternalLink,
  XCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";

interface Post {
  id: string;
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
  { label: string; color: string; dotColor: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: {
    label: "Rascunho",
    color: "border-gray-300 text-gray-700 bg-gray-50",
    dotColor: "bg-gray-400",
    variant: "secondary",
  },
  scheduled: {
    label: "Agendado",
    color: "border-blue-300 text-blue-700 bg-blue-50",
    dotColor: "bg-blue-500",
    variant: "outline",
  },
  published: {
    label: "Publicado",
    color: "border-green-300 text-green-700 bg-green-50",
    dotColor: "bg-green-500",
    variant: "outline",
  },
  failed: {
    label: "Falhou",
    color: "border-red-300 text-red-700 bg-red-50",
    dotColor: "bg-red-500",
    variant: "destructive",
  },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function getPostDate(post: Post): Date {
  return new Date(post.scheduled_at ?? post.created_at);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function handleUnschedule(postId: string) {
    confirmAction("Desagendar este post?", async () => {
      setActionLoading(true);
      try {
        const res = await apiFetch(`/api/posts/${postId}/cancel`, { method: "POST" });
        if (res.ok) {
          setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: "draft", scheduled_at: null } : p));
          setPreviewPost(null);
          toast.success("Post desagendado!");
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Erro ao desagendar post.");
        }
      } catch { toast.error("Ocorreu um erro. Tente novamente."); } finally {
        setActionLoading(false);
      }
    });
  }

  function handlePublishNow(postId: string) {
    confirmAction("Publicar este post agora?", async () => {
      setActionLoading(true);
      try {
        const res = await apiFetch(`/api/posts/${postId}/publish`, { method: "POST" });
        if (res.ok) {
          setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: "published", published_at: new Date().toISOString() } : p));
          setPreviewPost(null);
          toast.success("Post publicado!");
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Erro ao publicar post.");
        }
      } catch { toast.error("Ocorreu um erro. Tente novamente."); } finally {
        setActionLoading(false);
      }
    });
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch posts for current month
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const startOfMonth = new Date(year, month - 1, 1).toISOString(); // 1 month before
        const endOfMonth = new Date(year, month + 2, 0, 23, 59, 59).toISOString(); // 1 month after
        const res = await apiFetch(`/api/posts?from=${startOfMonth}&to=${endOfMonth}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts ?? data ?? []);
        }
      } catch (error) {
        console.error("Erro ao carregar posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [currentDate]);

  // Group posts by day of current month
  const postsByDay = useMemo(() => {
    const map: Record<number, Post[]> = {};
    for (const post of posts) {
      const d = getPostDate(post);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(post);
      }
    }
    return map;
  }, [posts, year, month]);

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }

  const selectedPosts = selectedDay ? postsByDay[selectedDay] ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#1F2937]">
          <CalendarIcon className="size-6 text-[#1A73E8]" />
          Calendario
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="size-5" />
            </Button>
            <CardTitle className="text-lg">
              {MONTH_NAMES[month]} {year}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="size-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px">
                {/* Weekday headers */}
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square p-1" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayPosts = postsByDay[day] ?? [];
                  const isSelected = selectedDay === day;

                  // Collect unique status colors for dots
                  const statuses = [...new Set(dayPosts.map((p) => p.status))];

                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDay(isSelected ? null : day)
                      }
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg p-1 text-sm transition-colors hover:bg-muted",
                        isToday(day) && "font-bold text-[#1A73E8]",
                        isSelected &&
                          "bg-[#1A73E8]/10 ring-2 ring-[#1A73E8]",
                        dayPosts.length > 0 && "cursor-pointer"
                      )}
                    >
                      <span>{day}</span>
                      {statuses.length > 0 && (
                        <div className="flex gap-0.5">
                          {statuses.map((status) => (
                            <div
                              key={status}
                              className={cn(
                                "size-1.5 rounded-full",
                                STATUS_CONFIG[status]?.dotColor ?? "bg-gray-400"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDay
                ? `${String(selectedDay).padStart(2, "0")} de ${MONTH_NAMES[month]}`
                : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDay ? (
              <p className="text-sm text-muted-foreground">
                Clique em um dia no calendario para ver os posts.
              </p>
            ) : selectedPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum post neste dia.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedPosts.map((post) => {
                  const config =
                    STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
                  const dateStr = post.scheduled_at ?? post.created_at;
                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        setPreviewPost(post);
                        setTimeout(() => {
                          document.querySelector("[data-slot='dialog-content']")?.scrollTo(0, 0);
                        }, 50);
                      }}
                      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-300 hover:shadow-sm hover:bg-[#f4f9fe]"
                    >
                      {post.generated_image_url ? (
                        <img
                          src={post.generated_image_url}
                          alt="Post"
                          className="size-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                          <ImageIcon className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="line-clamp-2 text-xs">
                          {post.caption
                            ? post.caption.slice(0, 60) +
                              (post.caption.length > 60 ? "..." : "")
                            : "Sem legenda"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(dateStr)}
                          </span>
                          <Badge
                            variant={config.variant}
                            className={cn("text-[10px]", config.color)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="!max-w-3xl !w-[90vw] !max-h-[85vh] !overflow-hidden !rounded-[22px] !p-0 !gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-[#1F2937]">Detalhes do post</DialogTitle>
              {previewPost && (
                <Badge
                  variant={(STATUS_CONFIG[previewPost.status] ?? STATUS_CONFIG.draft).variant}
                  className={cn("text-xs", (STATUS_CONFIG[previewPost.status] ?? STATUS_CONFIG.draft).color)}
                >
                  {(STATUS_CONFIG[previewPost.status] ?? STATUS_CONFIG.draft).label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {previewPost && (
            <>
            <div className="flex-1 overflow-y-auto px-6 space-y-5">
              {/* Image - contained, centered, max height */}
              {previewPost.generated_image_url && (
                <div className="flex justify-center rounded-[16px] overflow-hidden bg-[#f4f9fe]">
                  <img
                    src={previewPost.generated_image_url}
                    alt="Post"
                    className="max-h-[350px] w-auto object-contain"
                  />
                </div>
              )}

              {/* Caption */}
              {previewPost.caption && (
                <p className="whitespace-pre-wrap text-sm text-[#474747] leading-relaxed">
                  {previewPost.caption}
                </p>
              )}

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
                {previewPost.scheduled_at
                  ? `Agendado para ${new Date(previewPost.scheduled_at).toLocaleString("pt-BR")}`
                  : previewPost.published_at
                    ? `Publicado em ${new Date(previewPost.published_at).toLocaleString("pt-BR")}`
                    : `Criado em ${new Date(previewPost.created_at).toLocaleString("pt-BR")}`}
              </p>

            </div>

            {/* Footer - always visible, never scrolls */}
            <div className="shrink-0 border-t border-[#e5e7eb] px-6 py-4 bg-white flex gap-2">
              {(previewPost.status === "scheduled" || previewPost.status === "draft") && (
                <>
                  {previewPost.status === "scheduled" && (
                    <Button
                      variant="outline"
                      onClick={() => handleUnschedule(previewPost.id)}
                      disabled={actionLoading}
                      className="flex-1 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="size-4" />
                      Desagendar
                    </Button>
                  )}
                  <Button
                    onClick={() => handlePublishNow(previewPost.id)}
                    disabled={actionLoading}
                    className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                  >
                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Postar agora
                  </Button>
                </>
              )}
              <Link
                href={`/post/${previewPost.id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e7eb] px-4 py-2.5 text-sm font-medium text-[#474747] transition-all duration-300 hover:bg-[#f4f9fe]"
              >
                <ExternalLink className="size-4" />
                Editar post
              </Link>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
