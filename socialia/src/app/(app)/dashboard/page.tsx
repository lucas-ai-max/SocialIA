import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CalendarClock,
  CheckCircle,
  Plus,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentPost {
  id: string;
  generated_image_url: string | null;
  caption: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  scheduled: { label: "Agendado", variant: "outline", className: "border-blue-300 text-blue-700 bg-blue-50" },
  published: { label: "Publicado", variant: "outline", className: "border-green-300 text-green-700 bg-green-50" },
  failed: { label: "Falhou", variant: "destructive" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, full_name")
    .eq("id", user.id)
    .single<{ credits: number; full_name: string | null }>();

  const credits = profile?.credits ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "Usuario";

  // Fetch scheduled posts count
  const { count: scheduledCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  // Fetch published posts count
  const { count: publishedCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published");

  // Fetch last 5 posts
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, generated_image_url, caption, status, created_at, scheduled_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: RecentPost[] | null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">
          Ola, {firstName}!
        </h1>
        <p className="text-muted-foreground">
          Aqui esta um resumo da sua conta.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Creditos Disponiveis
            </CardTitle>
            <CreditCard className="size-5 text-[#1A73E8]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{credits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posts Agendados
            </CardTitle>
            <CalendarClock className="size-5 text-[#1A73E8]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{scheduledCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posts Publicados
            </CardTitle>
            <CheckCircle className="size-5 text-[#1A73E8]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{publishedCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Posts Recentes</h2>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Plus className="size-4" />
            Criar Post
          </Link>
        </div>

        {!recentPosts || recentPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="mb-4 size-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Nenhum post ainda.</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Crie seu primeiro post com inteligencia artificial!
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0d5bbd]"
              >
                <Plus className="size-4" />
                Criar Primeiro Post
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const config = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft;
              return (
                <Link key={post.id} href={`/post/${post.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 py-3">
                    {/* Thumbnail */}
                    {post.generated_image_url ? (
                      <img
                        src={post.generated_image_url}
                        alt="Post"
                        className="size-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="size-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Caption snippet */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {post.caption
                          ? post.caption.slice(0, 80) +
                            (post.caption.length > 80 ? "..." : "")
                          : "Sem legenda"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.scheduled_at ?? post.created_at)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <Badge
                      variant={config.variant}
                      className={cn("shrink-0", config.className)}
                    >
                      {config.label}
                    </Badge>
                  </CardContent>
                </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
