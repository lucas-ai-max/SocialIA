import Link from "next/link";
import {
  Sparkles,
  Camera,
  Calendar,
  ImagePlus,
  Hash,
  CreditCard,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    icon: Camera,
    title: "Conecte seu Instagram",
    description:
      "Conecte sua conta Business e responda um mini questionário sobre sua marca",
    step: "01",
  },
  {
    icon: Sparkles,
    title: "Gere com IA",
    description:
      "A IA cria imagens e legendas personalizadas para seu público",
    step: "02",
  },
  {
    icon: Calendar,
    title: "Agende e publique",
    description: "Escolha quando publicar e agende com um clique",
    step: "03",
  },
];

const features = [
  {
    icon: ImagePlus,
    title: "Imagens geradas por IA",
    description: "Crie imagens únicas e profissionais com tecnologia Gemini",
  },
  {
    icon: Hash,
    title: "Legendas com hashtags otimizadas",
    description:
      "Legendas envolventes com hashtags relevantes para maior alcance",
  },
  {
    icon: Calendar,
    title: "Agendamento direto no Instagram",
    description: "Publique automaticamente no horário ideal para seu público",
  },
  {
    icon: Sparkles,
    title: "Imagens de referência para manter seu estilo",
    description:
      "Envie referências visuais e a IA mantém a identidade da sua marca",
  },
  {
    icon: Zap,
    title: "Edição de legenda antes de publicar",
    description:
      "Revise e ajuste o texto gerado antes de agendar a publicação",
  },
  {
    icon: CreditCard,
    title: "Pague por post, sem assinatura",
    description:
      "Compre créditos e use quando quiser. Sem mensalidade, sem compromisso",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    credits: 10,
    price: "R$24,90",
    perPost: "R$2,49",
    highlighted: false,
  },
  {
    name: "Popular",
    credits: 30,
    price: "R$64,90",
    perPost: "R$2,16",
    highlighted: true,
  },
  {
    name: "Pro",
    credits: 100,
    price: "R$174,90",
    perPost: "R$1,75",
    highlighted: false,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A73E8] via-[#0d5bbd] to-[#0a3061] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/15 text-white hover:bg-white/20"
          >
            <Sparkles className="mr-1 size-3" />
            Powered by AI
          </Badge>
          <h1 className="text-[38px] font-semibold leading-[46px] tracking-tight sm:text-5xl lg:text-6xl">
            Crie posts incríveis para o Instagram com IA
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-blue-100 sm:text-xl">
            Gere imagens e legendas profissionais em segundos. Conecte seu
            Instagram e agende com um clique.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold tracking-wide text-[#1A73E8] shadow-lg transition-all duration-300 hover:bg-blue-50 hover:shadow-xl"
            >
              Comece Grátis
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-8 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Veja como funciona
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="bg-[#f4f9fe] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1140px]">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
              Como funciona
            </h2>
            <p className="mt-4 text-lg font-light text-[#474747]">
              Três passos simples para transformar sua presença no Instagram
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A73E8] to-[#5fc1f8] text-white shadow-lg">
                  <step.icon className="size-7" />
                </div>
                <span className="mt-4 text-sm font-semibold text-[#1A73E8]">
                  Passo {step.step}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-[#1F2937]">
                  {step.title}
                </h3>
                <p className="mt-2 font-light text-[#474747]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1140px]">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="mt-4 text-lg font-light text-[#474747]">
              Ferramentas poderosas para criar conteúdo profissional sem esforço
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-50 text-[#1A73E8]">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#f4f9fe] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1140px]">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-4xl">
              Preços simples e transparentes
            </h2>
            <p className="mt-4 text-lg font-light text-[#474747]">
              Compre créditos e use quando quiser. 1 crédito = 1 post (imagem +
              legenda)
            </p>
            <Badge
              variant="secondary"
              className="mt-4 bg-emerald-100 text-emerald-700"
            >
              <Zap className="mr-1 size-3" />3 créditos grátis ao se cadastrar
            </Badge>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative border-0 transition-all duration-300 hover:shadow-lg",
                  plan.highlighted
                    ? "scale-105 shadow-xl ring-2 ring-[#1A73E8]"
                    : "shadow-sm"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#F26526] text-white">
                      Mais popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="items-center text-center">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.credits} créditos
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <span className="text-4xl font-semibold text-[#1F2937]">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {plan.perPost} por post
                  </p>
                  <ul className="mt-2 w-full space-y-2 text-sm font-light text-[#474747]">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-500" />
                      {plan.credits} posts com imagem + legenda
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-500" />
                      Créditos sem validade
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-500" />
                      Agendamento incluso
                    </li>
                  </ul>
                  <Link
                    href="/signup"
                    className={cn(
                      "mt-4 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                      plan.highlighted
                        ? "bg-[#1A73E8] text-white hover:bg-[#0d5bbd]"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    )}
                  >
                    Comece Grátis
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="SocialIA" className="size-8" />
            <span className="text-lg font-bold text-[#1F2937]">SocialIA</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; 2026 SocialIA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
