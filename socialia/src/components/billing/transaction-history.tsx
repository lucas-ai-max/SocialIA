"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Transaction {
  id: string;
  type: "purchase" | "usage" | "bonus" | "refund";
  amount: number;
  balance_after: number;
  created_at: string;
  description?: string;
}

const TYPE_LABELS: Record<string, string> = {
  purchase: "Compra",
  usage: "Uso",
  bonus: "Bonus",
  refund: "Reembolso",
};

const TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  purchase: "default",
  usage: "secondary",
  bonus: "outline",
  refund: "destructive",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await apiFetch("/api/billing/credits");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions ?? []);
        }
      } catch (error) {
        console.error("Erro ao carregar transacoes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historico de Transacoes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Nenhuma transacao encontrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Data</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium text-right">
                    Quantidade
                  </th>
                  <th className="pb-2 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={TYPE_VARIANTS[tx.type] ?? "secondary"}>
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      <span
                        className={
                          tx.amount > 0 ? "text-green-600" : "text-red-500"
                        }
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </td>
                    <td className="py-3 text-right">{tx.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
