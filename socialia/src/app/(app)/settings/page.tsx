import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Palette,
  CreditCard,
  ExternalLink,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import { ProfilePhotoUpload } from "@/components/settings/profile-photo-upload";
import { BrandEditor } from "@/components/settings/brand-editor";
import { InstagramCard } from "@/components/settings/instagram-card";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, credits, profile_photo_url")
    .eq("id", user.id)
    .single<{
      full_name: string | null;
      avatar_url: string | null;
      credits: number;
      profile_photo_url: string | null;
    }>();

  // Fetch Instagram account
  const { data: instagram } = await supabase
    .from("instagram_accounts")
    .select("ig_username, ig_profile_picture_url, ig_followers_count")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single<{
      ig_username: string;
      ig_profile_picture_url: string | null;
      ig_followers_count: number | null;
    }>();

  // Fetch brand profile
  const { data: brand } = await supabase
    .from("brand_profiles")
    .select("niche, brand_voice, target_audience, visual_style, content_pillars, additional_context, color_palette, brand_logo_url")
    .eq("user_id", user.id)
    .single<{
      niche: string | null;
      brand_voice: string | null;
      target_audience: string | null;
      visual_style: string | null;
      content_pillars: string[] | null;
      additional_context: string | null;
      color_palette: string[] | null;
      brand_logo_url: string | null;
    }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">Configuracoes</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-5 text-[#1A73E8]" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfilePhotoUpload
              userId={user.id}
              currentPhotoUrl={profile?.profile_photo_url ?? null}
            />
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Nome completo</p>
              <p className="font-medium">
                {profile?.full_name || "Nao informado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="size-5 text-[#1A73E8]" />
              Instagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InstagramCard
              connected={!!instagram}
              username={instagram?.ig_username}
              profilePictureUrl={instagram?.ig_profile_picture_url}
              followersCount={instagram?.ig_followers_count}
            />
          </CardContent>
        </Card>

        {/* Marca */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="size-5 text-[#1A73E8]" />
              Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {brand ? (
              <BrandEditor
                userId={user.id}
                initialData={{
                  niche: brand.niche,
                  brand_voice: brand.brand_voice,
                  target_audience: brand.target_audience,
                  visual_style: brand.visual_style,
                  content_pillars: brand.content_pillars,
                  additional_context: brand.additional_context,
                  color_palette: brand.color_palette,
                  brand_logo_url: brand.brand_logo_url,
                }}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nenhum perfil de marca configurado.
                </p>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Configurar marca
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cobranca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5 text-[#1A73E8]" />
              Cobranca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Creditos disponiveis</p>
              <p className="text-2xl font-bold text-[#1A73E8]">
                {profile?.credits ?? 0}
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              Gerenciar cobranca
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
