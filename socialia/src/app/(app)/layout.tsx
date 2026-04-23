import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { normalizeStorageUrl } from "@/lib/storage-url";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, full_name, avatar_url, profile_photo_url, onboarding_completed")
    .eq("id", user.id)
    .single<{
      credits: number;
      full_name: string | null;
      avatar_url: string | null;
      profile_photo_url: string | null;
      onboarding_completed: boolean;
    }>();

  if (!profile) {
    redirect("/login");
  }

  // Redirect to onboarding if not completed.
  // Since this layout only wraps (app) routes (not /onboarding),
  // any request reaching here should be redirected if onboarding is pending.
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen flex-col">
      <AppHeader
        credits={profile.credits}
        fullName={profile.full_name}
        avatarUrl={normalizeStorageUrl(profile.profile_photo_url) ?? profile.avatar_url}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA] p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
