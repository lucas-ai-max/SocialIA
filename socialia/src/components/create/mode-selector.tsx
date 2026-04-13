"use client";

import { Sparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  onSelect: (mode: "auto" | "prompt") => void;
  selected?: "auto" | "prompt" | null;
}

const modes = [
  {
    key: "auto" as const,
    title: "A IA decide",
    description: "A IA escolhe o tema e cria tudo para você",
    icon: Sparkles,
  },
  {
    key: "prompt" as const,
    title: "Tenho uma ideia",
    description: "Você dá a ideia e a IA cria o post",
    icon: Lightbulb,
  },
];

export function ModeSelector({ onSelect, selected }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selected === mode.key;

        return (
          <button
            key={mode.key}
            type="button"
            onClick={() => onSelect(mode.key)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-[22px] border-2 bg-card p-8 text-center transition-all duration-300 hover:shadow-md",
              isSelected
                ? "border-[#1A73E8] shadow-md"
                : "border-transparent ring-1 ring-foreground/10 hover:ring-foreground/20"
            )}
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                isSelected
                  ? "bg-[#1A73E8]/10 text-[#1A73E8]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{mode.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
