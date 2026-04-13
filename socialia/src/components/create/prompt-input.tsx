"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSubmit: (prompt: string, format: "square" | "portrait") => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<"square" | "portrait">("square");

  const isValid = prompt.trim().length >= 10;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="prompt">Descreva sua ideia</Label>
        <Textarea
          id="prompt"
          placeholder="Ex: Post sobre dicas de produtividade para empreendedores..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
          className="min-h-28 resize-none rounded-[22px]"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {prompt.length < 10
              ? `Mínimo 10 caracteres (faltam ${10 - prompt.length})`
              : ""}
          </span>
          <span>{prompt.length}/500</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Formato da imagem</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormat("square")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
              format === "square"
                ? "border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8]"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Quadrado (1:1)
          </button>
          <button
            type="button"
            onClick={() => setFormat("portrait")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
              format === "portrait"
                ? "border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8]"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Retrato (4:5)
          </button>
        </div>
      </div>

      <Button
        onClick={() => onSubmit(prompt.trim(), format)}
        disabled={!isValid || isLoading}
        className="w-full bg-[#1A73E8] text-white hover:bg-[#0d5bbd]"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar Post
          </>
        )}
      </Button>
    </div>
  );
}
