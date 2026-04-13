"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/products";
import { cn } from "@/lib/utils";

interface SubscriptionPlansProps {
  currentPlanId?: string | null;
}

export function SubscriptionPlans({ currentPlanId }: SubscriptionPlansProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    try {
      setLoadingId(planId);
      const res = await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao iniciar checkout");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar o checkout. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SUBSCRIPTION_PLANS.map((plan) => {
        const isHighlighted = "highlighted" in plan && plan.highlighted;
        const isCurrent = currentPlanId === plan.id;
        return (
          <Card
            key={plan.id}
            className={cn(
              "relative flex flex-col border-0",
              isHighlighted && "border-2 border-[#1A73E8] shadow-lg",
              isCurrent && "ring-2 ring-green-500"
            )}
          >
            {isHighlighted && !isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#F26526] text-white gap-1">
                  <Sparkles className="size-3" />
                  Mais popular
                </Badge>
              </div>
            )}
            {isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-600 text-white gap-1">
                  <Check className="size-3" />
                  Plano atual
                </Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div>
                <p className="text-3xl font-bold">{plan.credits}</p>
                <p className="text-sm text-muted-foreground">posts/mes</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{plan.priceDisplay}</p>
                <p className="text-sm text-muted-foreground">
                  {plan.perPost} por post
                </p>
              </div>
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingId !== null || isCurrent}
                className={cn(
                  "mt-auto w-full gap-2",
                  isHighlighted &&
                    "bg-[#1A73E8] text-white hover:bg-[#0d5bbd]",
                  isCurrent && "bg-green-600 hover:bg-green-600 cursor-default"
                )}
              >
                {loadingId === plan.id ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processando...
                  </>
                ) : isCurrent ? (
                  "Plano atual"
                ) : (
                  "Assinar"
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
