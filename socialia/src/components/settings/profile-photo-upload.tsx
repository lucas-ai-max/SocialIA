"use client";

import { useState, useRef } from "react";
import { Camera, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfilePhotoUpload({
  userId,
  currentPhotoUrl,
}: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato invalido. Use JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Arquivo muito grande. Tamanho maximo: 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const filePath = `${userId}/profile-photo.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Erro ao fazer upload da foto.");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("generated-images").getPublicUrl(filePath);

      // Add cache-busting parameter
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_photo_url: urlWithCacheBust } as never)
        .eq("id", userId);

      if (updateError) {
        throw new Error("Erro ao atualizar perfil.");
      }

      setPhotoUrl(urlWithCacheBust);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao fazer upload da foto."
      );
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="group relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-[#1A73E8] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 disabled:opacity-50"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Foto de perfil"
            className="size-full object-cover"
          />
        ) : (
          <User className="size-10 text-muted-foreground" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="size-6 animate-spin text-white" />
          ) : (
            <Camera className="size-6 text-white" />
          )}
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">
        {isUploading ? "Enviando..." : "Clique para alterar a foto"}
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
