"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { BrandVoice, VisualStyle } from "@/types/database";

interface QuestionnaireFormProps {
  userId: string;
}

const TOTAL_STEPS = 6;

const VOICE_OPTIONS: { value: BrandVoice; label: string; description: string }[] = [
  {
    value: "formal",
    label: "Formal",
    description: "Tom serio e corporativo, linguagem culta e direta.",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Tom descontraido e amigavel, como uma conversa entre amigos.",
  },
  {
    value: "playful",
    label: "Divertido",
    description: "Tom leve e bem-humorado, usa emojis e gírias.",
  },
  {
    value: "professional",
    label: "Profissional",
    description: "Tom confiante e especialista, transmite autoridade.",
  },
];

const STYLE_OPTIONS: { value: VisualStyle; label: string; description: string }[] = [
  {
    value: "minimalist",
    label: "Minimalista",
    description: "Menos e mais. Espacos em branco, tipografia limpa.",
  },
  {
    value: "vibrant",
    label: "Vibrante",
    description: "Cores vivas e saturadas, alto contraste, energia.",
  },
  {
    value: "dark",
    label: "Escuro",
    description: "Fundos escuros, tons profundos, elegancia.",
  },
  {
    value: "clean",
    label: "Clean",
    description: "Organizado e claro, tons neutros e pasteis.",
  },
];

export function QuestionnaireForm({ userId }: QuestionnaireFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [visualStyle, setVisualStyle] = useState<VisualStyle | null>(null);
  const [contentPillars, setContentPillars] = useState<string[]>([]);
  const [pillarInput, setPillarInput] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return niche.trim().length > 0;
      case 2:
        return targetAudience.trim().length > 0;
      case 3:
        return brandVoice !== null;
      case 4:
        return visualStyle !== null;
      case 5:
        return contentPillars.length > 0;
      case 6:
        return true; // optional step
      default:
        return false;
    }
  };

  const handleAddPillar = () => {
    const trimmed = pillarInput.trim();
    if (trimmed && contentPillars.length < 5 && !contentPillars.includes(trimmed)) {
      setContentPillars([...contentPillars, trimmed]);
      setPillarInput("");
    }
  };

  const handleRemovePillar = (pillar: string) => {
    setContentPillars(contentPillars.filter((p) => p !== pillar));
  };

  const handleSubmit = async () => {
    if (!brandVoice || !visualStyle) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: brandError } = await supabase.from("brand_profiles").insert({
        user_id: userId,
        niche: niche.trim(),
        target_audience: targetAudience.trim(),
        brand_voice: brandVoice,
        visual_style: visualStyle,
        content_pillars: contentPillars,
        additional_context: additionalContext.trim() || null,
      } as never);

      if (brandError) throw brandError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as never)
        .eq("id", userId);

      if (profileError) throw profileError;

      router.push("/dashboard");
    } catch {
      setError("Erro ao salvar seu perfil. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS) {
      handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          Configure seu perfil de marca
        </CardTitle>
        <CardDescription className="text-center">
          Essas informacoes ajudam a IA a criar conteudo personalizado para voce.
        </CardDescription>
        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i + 1 <= currentStep ? "bg-[#1A73E8]" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Passo {currentStep} de {TOTAL_STEPS}
        </p>
      </CardHeader>
      <CardContent className="min-h-[280px] flex flex-col">
        <div className="flex-1">
          {/* Step 1: Nicho */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Qual e o nicho do seu negocio?</Label>
                <Input
                  id="niche"
                  placeholder="Ex: fitness, gastronomia, moda, marketing digital"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canGoNext()) handleNext();
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Publico-alvo */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Descreva seu publico-alvo</Label>
                <Textarea
                  id="audience"
                  placeholder="Ex: Mulheres de 25-35 anos interessadas em vida saudavel"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Tom de voz */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label>Qual e o tom de voz da sua marca?</Label>
              <div className="grid grid-cols-2 gap-3">
                {VOICE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBrandVoice(option.value)}
                    className={cn(
                      "rounded-[22px] border-2 p-4 text-left transition-all duration-300 hover:border-[#1A73E8]/50",
                      brandVoice === option.value
                        ? "border-[#1A73E8] bg-[#1A73E8]/5"
                        : "border-muted"
                    )}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Estilo visual */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label>Qual e o estilo visual da sua marca?</Label>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisualStyle(option.value)}
                    className={cn(
                      "rounded-[22px] border-2 p-4 text-left transition-all duration-300 hover:border-[#1A73E8]/50",
                      visualStyle === option.value
                        ? "border-[#1A73E8] bg-[#1A73E8]/5"
                        : "border-muted"
                    )}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Pilares de conteudo */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pillars">Sobre o que voce posta?</Label>
                <p className="text-xs text-muted-foreground">
                  Adicione ate 5 temas principais do seu conteudo.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="pillars"
                    placeholder="Ex: dicas de treino"
                    value={pillarInput}
                    onChange={(e) => setPillarInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPillar();
                      }
                    }}
                    disabled={contentPillars.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddPillar}
                    disabled={
                      !pillarInput.trim() || contentPillars.length >= 5
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {contentPillars.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contentPillars.map((pillar) => (
                    <Badge
                      key={pillar}
                      variant="secondary"
                      className="gap-1 py-1.5 pl-3 pr-1.5"
                    >
                      {pillar}
                      <button
                        type="button"
                        onClick={() => handleRemovePillar(pillar)}
                        className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Contexto adicional */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="context">
                  Algo mais que a IA deve saber?{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="context"
                  placeholder="Ex: Uso cores quentes, prefiro fotos com fundo neutro"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-center text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isSubmitting}
            style={{ backgroundColor: "#1A73E8" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : currentStep === TOTAL_STEPS ? (
              "Finalizar"
            ) : (
              <>
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
