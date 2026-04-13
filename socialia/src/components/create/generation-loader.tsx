"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface GenerationLoaderProps {
  isVisible: boolean;
}

const messages = [
  "Gerando sua imagem...",
  "Criando a legenda perfeita...",
  "Quase pronto...",
];

export function GenerationLoader({ isVisible }: GenerationLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#1A73E8]/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1A73E8]/10">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A73E8]" />
        </div>
      </div>
      <p className="text-lg font-medium text-foreground animate-pulse">
        {messages[messageIndex]}
      </p>
      <p className="text-sm text-muted-foreground">
        Isso pode levar alguns segundos
      </p>
    </div>
  );
}
