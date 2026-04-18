export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 15,
    priceInCents: 2990,
    priceDisplay: "R$ 29,90",
    perPost: "R$ 1,99",
    description: "Ideal para quem esta comecando",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    priceInCents: 5990,
    priceDisplay: "R$ 59,90",
    perPost: "R$ 1,20",
    description: "Para criadores de conteudo ativos",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    credits: 150,
    priceInCents: 9990,
    priceDisplay: "R$ 99,90",
    perPost: "R$ 0,67",
    description: "Para agencias e power users",
  },
] as const;

export type PlanId = (typeof SUBSCRIPTION_PLANS)[number]["id"];

export function getPlan(id: string) {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}
