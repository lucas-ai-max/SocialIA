"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReferenceImage {
  base64: string;
  mimeType: string;
  preview: string;
}

interface ReferenceUploadProps {
  onImagesChange: (images: { base64: string; mimeType: string }[]) => void;
}

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReferenceUpload({ onImagesChange }: ReferenceUploadProps) {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      if (images.length + fileArray.length > MAX_IMAGES) {
        setError(`Máximo de ${MAX_IMAGES} imagens permitidas.`);
        return;
      }

      const newImages: ReferenceImage[] = [];

      for (const file of fileArray) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError("Formato não suportado. Use JPG, PNG ou WebP.");
          return;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError(`Cada imagem deve ter no máximo ${MAX_SIZE_MB}MB.`);
          return;
        }

        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(file);
        newImages.push({ base64, mimeType: file.type, preview });
      }

      const updated = [...images, ...newImages];
      setImages(updated);
      onImagesChange(
        updated.map((img) => ({ base64: img.base64, mimeType: img.mimeType }))
      );
    },
    [images, onImagesChange]
  );

  const removeImage = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      URL.revokeObjectURL(images[index].preview);
      setImages(updated);
      onImagesChange(
        updated.map((img) => ({ base64: img.base64, mimeType: img.mimeType }))
      );
    },
    [images, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  return (
    <div className="space-y-2">
      <Label>Imagens de referência (opcional)</Label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-[#1A73E8] bg-[#1A73E8]/5"
            : "border-border hover:border-[#1A73E8]/50 hover:bg-muted/50",
          images.length >= MAX_IMAGES && "pointer-events-none opacity-50"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arraste imagens aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground/70">
          JPG, PNG ou WebP — máx. {MAX_SIZE_MB}MB cada — até {MAX_IMAGES}{" "}
          imagens
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {images.length > 0 && (
        <div className="flex gap-3 pt-2">
          {images.map((img, index) => (
            <div key={index} className="group relative">
              <img
                src={img.preview}
                alt={`Referência ${index + 1}`}
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-foreground/10"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-opacity hover:bg-destructive/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-[#1A73E8]/50 hover:text-[#1A73E8]"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
