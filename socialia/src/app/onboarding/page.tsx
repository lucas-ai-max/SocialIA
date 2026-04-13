import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InstagramConnect } from "@/components/onboarding/instagram-connect";
import { QuestionnaireForm } from "@/components/onboarding/questionnaire-form";

const ERROR_MESSAGES: Record<string, string> = {
  no_pages:
    "Nenhuma Pagina do Facebook encontrada. Crie uma Pagina e vincule sua conta Instagram Business.",
  no_instagram:
    "Nenhuma conta Instagram Business vinculada a sua Pagina do Facebook.",
  instagram_denied: "Voce recusou a conexao com o Instagram.",
  auth_failed: "Erro na autenticacao. Tente novamente.",
  save_failed: "Erro ao salvar. Tente novamente.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if onboarding already completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single<{ onboarding_completed: boolean }>();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  // Check if Instagram is connected
  const { data: igAccount } = await supabase
    .from("instagram_accounts")
    .select("ig_username, ig_profile_picture_url")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single<{ ig_username: string; ig_profile_picture_url: string | null }>();

  const instagramConnected =
    !!igAccount || params.instagram === "connected";
  const showQuestionnaire =
    instagramConnected && params.step === "questionnaire";

  // Error handling
  const errorKey = typeof params.error === "string" ? params.error : null;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.auth_failed : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 py-12">
      {/* Branding */}
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="SocialIA" className="mx-auto h-12 w-auto" />
        <p className="mt-1 text-sm text-muted-foreground">
          Vamos configurar seu perfil
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="mb-6 w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-2xl">
        {!instagramConnected || !showQuestionnaire ? (
          <InstagramConnect
            connected={instagramConnected}
            username={igAccount?.ig_username}
            profilePictureUrl={igAccount?.ig_profile_picture_url ?? undefined}
          />
        ) : (
          <QuestionnaireForm userId={user.id} />
        )}
      </div>
    </div>
  );
}
