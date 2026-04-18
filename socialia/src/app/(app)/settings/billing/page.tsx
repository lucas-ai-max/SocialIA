import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, CheckCircle, XCircle, Crown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionPlans } from "@/components/billing/credit-packs";
import { TransactionHistory } from "@/components/billing/transaction-history";
import { ManageSubscription } from "@/components/billing/manage-subscription";
import { getPlan } from "@/lib/plans";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
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
    .select("credits")
    .eq("id", user.id)
    .single<{ credits: number }>();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<{
      plan_id: string;
      status: string;
      cancel_at_period_end: boolean;
      current_period_end: string | null;
    }>();

  const credits = profile?.credits ?? 0;
  const params = await searchParams;
  const showSuccess = params.success === "true";
  const showCanceled = params.canceled === "true";

  const currentPlan = subscription?.plan_id ? getPlan(subscription.plan_id) : null;
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">Cobranca</h1>

      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle className="size-5 shrink-0" />
          <p>Assinatura realizada com sucesso! Seus creditos foram adicionados.</p>
        </div>
      )}

      {showCanceled && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <XCircle className="size-5 shrink-0" />
          <p>Assinatura cancelada. Nenhuma cobranca foi realizada.</p>
        </div>
      )}

      {/* Saldo + Plano atual */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-[#1A73E8]/20 bg-gradient-to-r from-[#1A73E8]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo de Creditos
            </CardTitle>
            <CreditCard className="size-5 text-[#1A73E8]" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#1A73E8]">{credits}</p>
            <p className="text-sm text-muted-foreground">creditos disponiveis</p>
          </CardContent>
        </Card>

        <Card className={isActive ? "border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plano Atual
            </CardTitle>
            <Crown className={`size-5 ${isActive ? "text-green-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {isActive && currentPlan ? (
              <>
                <p className="text-2xl font-bold text-green-600">{currentPlan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.credits} posts/mes &middot; {currentPlan.priceDisplay}/mes
                </p>
                {subscription?.cancel_at_period_end && subscription.current_period_end && (
                  <p className="mt-1 text-xs text-yellow-600">
                    Cancela ao fim do periodo em{" "}
                    {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-muted-foreground">Gratuito</p>
                <p className="text-sm text-muted-foreground">Sem assinatura ativa</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gerenciar assinatura */}
      {isActive && <ManageSubscription />}

      {/* Planos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {isActive ? "Trocar Plano" : "Escolha seu Plano"}
        </h2>
        <SubscriptionPlans currentPlanId={isActive ? subscription?.plan_id : null} />
      </div>

      {/* Historico */}
      <TransactionHistory />
    </div>
  );
}
