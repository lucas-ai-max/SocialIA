"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeStorageUrl } from "@/lib/storage-url";

interface BrandLogoUploadProps {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function BrandLogoUpload({ userId, value, onChange, disabled }: BrandLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && !isUploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato invalido. Use PNG, JPG, WebP ou SVG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Arquivo muito grande. Tamanho maximo: 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${userId}/brand-logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(uploadError.message || "Erro ao enviar logotipo.");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("generated-images").getPublicUrl(filePath);

      onChange(`${publicUrl}?t=${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar logotipo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (disabled || isUploading) return;
    onChange(null);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="group relative flex size-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-background transition-colors hover:border-[#1A73E8] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 disabled:opacity-50"
        >
          {value ? (
            <img
              src={normalizeStorageUrl(value) || ""}
              alt="Logotipo"
              className="size-full object-contain p-2"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" />
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}
        </button>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>{value ? "Clique para substituir" : "Clique para enviar"}</span>
          <span className="text-muted-foreground/70">PNG, JPG, WebP ou SVG ate 5MB</span>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-destructive/30 px-2 py-0.5 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
            >
              <X className="size-3" />
              Remover logo
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
