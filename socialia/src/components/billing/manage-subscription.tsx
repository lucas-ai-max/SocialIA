import { Mail } from "lucide-react";

export function ManageSubscription() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/30 p-4 text-sm">
      <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium">Gerenciar assinatura</p>
        <p className="text-muted-foreground">
          O cancelamento e alteracao da assinatura sao feitos pelo email de
          confirmacao da Kiwify. Verifique sua caixa de entrada ou acesse sua
          area do cliente Kiwify.
        </p>
      </div>
    </div>
  );
}
