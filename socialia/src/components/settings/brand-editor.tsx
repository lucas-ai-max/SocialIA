"use client";

import { useState } from "react";
import { Loader2, X, Plus, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";

interface BrandData {
  niche: string | null;
  brand_voice: string | null;
  target_audience: string | null;
  visual_style: string | null;
  content_pillars: string[] | null;
  additional_context: string | null;
}

interface BrandEditorProps {
  initialData: BrandData;
}

const VOICE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Divertido" },
  { value: "professional", label: "Profissional" },
];

const STYLE_OPTIONS = [
  { value: "minimalist", label: "Minimalista" },
  { value: "vibrant", label: "Vibrante" },
  { value: "dark", label: "Escuro" },
  { value: "clean", label: "Clean" },
];

function getVoiceLabel(value: string | null) {
  return VOICE_OPTIONS.find((o) => o.value === value)?.label || value || "Nao informado";
}

function getStyleLabel(value: string | null) {
  return STYLE_OPTIONS.find((o) => o.value === value)?.label || value || "Nao informado";
}

export function BrandEditor({ initialData }: BrandEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [niche, setNiche] = useState(initialData.niche || "");
  const [brandVoice, setBrandVoice] = useState(initialData.brand_voice || "");
  const [targetAudience, setTargetAudience] = useState(initialData.target_audience || "");
  const [visualStyle, setVisualStyle] = useState(initialData.visual_style || "");
  const [contentPillars, setContentPillars] = useState<string[]>(initialData.content_pillars || []);
  const [additionalContext, setAdditionalContext] = useState(initialData.additional_context || "");
  const [newPillar, setNewPillar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addPillar = () => {
    const trimmed = newPillar.trim();
    if (trimmed && !contentPillars.includes(trimmed)) {
      setContentPillars([...contentPillars, trimmed]);
      setNewPillar("");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/brand-profile", {
        method: "PUT",
        body: JSON.stringify({
          niche, targetAudience, brandVoice, visualStyle, contentPillars, additionalContext,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao salvar");
      }
      setMessage({ type: "success", text: "Salvo com sucesso!" });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNiche(initialData.niche || "");
    setBrandVoice(initialData.brand_voice || "");
    setTargetAudience(initialData.target_audience || "");
    setVisualStyle(initialData.visual_style || "");
    setContentPillars(initialData.content_pillars || []);
    setAdditionalContext(initialData.additional_context || "");
    setIsEditing(false);
    setMessage(null);
  };

  // ---- READ-ONLY VIEW ----
  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Nicho</p>
          <p className="font-medium">{niche || "Nao informado"}</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground">Tom de voz</p>
          <p className="font-medium">{getVoiceLabel(brandVoice)}</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground">Publico-alvo</p>
          <p className="font-medium">{targetAudience || "Nao informado"}</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground">Estilo visual</p>
          <p className="font-medium">{getStyleLabel(visualStyle)}</p>
        </div>
        {contentPillars.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Pilares de conteudo</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {contentPillars.map((p) => (
                  <span key={p} className="rounded-full bg-[#1A73E8]/10 px-3 py-0.5 text-xs text-[#1A73E8]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        {additionalContext && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Contexto adicional</p>
              <p className="text-sm">{additionalContext}</p>
            </div>
          </>
        )}

        {message && (
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {message.type === "success" && <Check className="size-4" />}
            {message.text}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="mt-2 gap-2"
        >
          <Pencil className="size-3.5" />
          Editar marca
        </Button>
      </div>
    );
  }

  // ---- EDIT VIEW ----
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted-foreground">Nicho</label>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Ex: Fitness, Gastronomia, Tecnologia..."
          className="w-full rounded-full border border-input bg-background px-5 py-2 text-sm font-light outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-foreground">Tom de voz</label>
        <select
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          className="w-full rounded-full border border-input bg-background px-5 py-2 text-sm font-light outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
        >
          <option value="">Selecione...</option>
          {VOICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-foreground">Publico-alvo</label>
        <textarea
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="Descreva seu publico-alvo..."
          rows={3}
          className="w-full rounded-[22px] border border-input bg-background px-5 py-3 text-sm font-light outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-foreground">Estilo visual</label>
        <select
          value={visualStyle}
          onChange={(e) => setVisualStyle(e.target.value)}
          className="w-full rounded-full border border-input bg-background px-5 py-2 text-sm font-light outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
        >
          <option value="">Selecione...</option>
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-foreground">Pilares de conteudo</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {contentPillars.map((pillar) => (
            <span key={pillar} className="inline-flex items-center gap-1 rounded-full bg-[#1A73E8]/10 px-3 py-1 text-sm text-[#1A73E8]">
              {pillar}
              <button type="button" onClick={() => setContentPillars(contentPillars.filter((p) => p !== pillar))} className="ml-1 rounded-full p-0.5 transition-colors hover:bg-[#1A73E8]/20">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPillar(); } }}
            placeholder="Adicionar pilar..."
            className="flex-1 rounded-full border border-input bg-background px-5 py-2 text-sm font-light outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
          />
          <button type="button" onClick={addPillar} disabled={!newPillar.trim()} className="flex items-center gap-1 rounded-full border border-[#1A73E8] px-4 py-2 text-sm text-[#1A73E8] transition-colors hover:bg-[#1A73E8]/10 disabled:opacity-40">
            <Plus className="size-4" />
            Adicionar
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted-foreground">
          Contexto adicional <span className="text-xs text-muted-foreground/60">(opcional)</span>
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Informacoes extras sobre sua marca..."
          rows={3}
          className="w-full rounded-[22px] border border-input bg-background px-5 py-3 text-sm font-light outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
        />
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" && <Check className="size-4" />}
          {message.text}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 bg-[#1A73E8] text-white hover:bg-[#0d5bbd]"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          Salvar alteracoes
        </Button>
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
