"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { ModeSelector } from "@/components/create/mode-selector";
import { PromptInput } from "@/components/create/prompt-input";
import { ReferenceUpload } from "@/components/create/reference-upload";
import { GenerationLoader } from "@/components/create/generation-loader";
import { PostPreview } from "@/components/create/post-preview";

type Step = "mode" | "prompt" | "generating" | "preview" | "done";

interface ReferenceImage {
  base64: string;
  mimeType: string;
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<"auto" | "prompt" | null>(null);
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<"square" | "portrait">("square");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [postId, setPostId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [credits, setCredits] = useState(0);
  const [appearPhoto, setAppearPhoto] = useState<ReferenceImage | null>(null);
  const [appearPhotoPreview, setAppearPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Fetch credits on mount
  useEffect(() => {
    async function fetchCredits() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("credits, full_name")
        .eq("id", user.id)
        .single<{ credits: number; full_name: string | null }>();

      if (data) {
        setCredits(data.credits);
        setUserName(data.full_name);
      }

      // Buscar foto do Instagram
      const { data: igData } = await supabase
        .from("instagram_accounts")
        .select("ig_username, ig_profile_picture_url")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single<{ ig_username: string; ig_profile_picture_url: string | null }>();

      if (igData) {
        setUserName(igData.ig_username);
        setUserAvatar(igData.ig_profile_picture_url);
      }
    }
    fetchCredits();
  }, []);

  const handleModeSelect = useCallback(
    async (selectedMode: "auto" | "prompt") => {
      setMode(selectedMode);
      setError(null);

      if (selectedMode === "auto") {
        setStep("generating");
        setIsLoading(true);

        try {
          const res = await apiFetch("/api/generate/auto", {
            method: "POST",
            body: JSON.stringify({
              imageFormat: "square",
              referenceImages: appearPhoto ? [appearPhoto] : undefined,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Erro ao gerar post automaticamente.");
          }

          const data = await res.json();
          setPostId(data.postId);
          setImageUrl(data.imageUrl);
          setCaption(data.caption);
          setHashtags(data.hashtags || []);
          setCredits((prev) => Math.max(0, prev - 1));
          setStep("preview");
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Erro ao gerar post."
          );
          setStep("mode");
        } finally {
          setIsLoading(false);
        }
      } else {
        setStep("prompt");
      }
    },
    [appearPhoto]
  );

  const handlePromptSubmit = useCallback(
    async (userPrompt: string, imageFormat: "square" | "portrait") => {
      setPrompt(userPrompt);
      setFormat(imageFormat);
      setError(null);
      setStep("generating");
      setIsLoading(true);

      try {
        // Step 1: Create draft post
        const postRes = await apiFetch("/api/posts", {
          method: "POST",
          body: JSON.stringify({
            generationMode: "prompt",
            userPrompt,
            imageFormat,
          }),
        });

        if (!postRes.ok) {
          const errData = await postRes.json().catch(() => ({}));
          throw new Error(errData.error || "Erro ao criar rascunho.");
        }

        const postData = await postRes.json();
        const newPostId = postData.id || postData.post?.id;
        setPostId(newPostId);

        const mergedRefs: ReferenceImage[] = appearPhoto
          ? [appearPhoto, ...referenceImages]
          : referenceImages;

        // Step 2: Generate image
        const imageRes = await apiFetch("/api/generate/image", {
          method: "POST",
          body: JSON.stringify({
            postId: newPostId,
            userPrompt,
            imageFormat,
            referenceImages: mergedRefs.length > 0 ? mergedRefs : undefined,
          }),
        });

        if (!imageRes.ok) {
          const errData = await imageRes.json().catch(() => ({}));
          throw new Error(errData.error || "Erro ao gerar imagem.");
        }

        const imageData = await imageRes.json();
        setImageUrl(imageData.imageUrl);

        // Step 3: Generate caption
        const captionRes = await apiFetch("/api/generate/caption", {
          method: "POST",
          body: JSON.stringify({
            postId: newPostId,
            userPrompt,
          }),
        });

        if (!captionRes.ok) {
          const errData = await captionRes.json().catch(() => ({}));
          throw new Error(errData.error || "Erro ao gerar legenda.");
        }

        const captionData = await captionRes.json();
        setCaption(captionData.caption);
        setHashtags(captionData.hashtags || []);
        setCredits((prev) => Math.max(0, prev - 1));
        setStep("preview");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao gerar post."
        );
        setStep("prompt");
      } finally {
        setIsLoading(false);
      }
    },
    [referenceImages, appearPhoto]
  );

  const handleRegenerateImage = useCallback(async () => {
    if (!postId || credits < 1) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const res = await apiFetch("/api/generate/image", {
        method: "POST",
        body: JSON.stringify({
          postId,
          userPrompt: prompt || undefined,
          imageFormat: format,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao regenerar imagem.");
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
      setCredits((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao regenerar imagem."
      );
    } finally {
      setIsRegenerating(false);
    }
  }, [postId, prompt, format, credits]);

  const handleRegenerateCaption = useCallback(async () => {
    if (!postId) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const res = await apiFetch("/api/generate/caption", {
        method: "POST",
        body: JSON.stringify({
          postId,
          userPrompt: prompt || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao regenerar legenda.");
      }

      const data = await res.json();
      setCaption(data.caption);
      setHashtags(data.hashtags || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao regenerar legenda."
      );
    } finally {
      setIsRegenerating(false);
    }
  }, [postId, prompt]);

  const handleSave = useCallback(
    async (updatedCaption: string, updatedHashtags: string[]) => {
      if (!postId) return;
      setError(null);

      try {
        const res = await apiFetch(`/api/posts/${postId}`, {
          method: "PATCH",
          body: JSON.stringify({
            caption: updatedCaption,
            hashtags: updatedHashtags,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erro ao salvar rascunho.");
        }

        setCaption(updatedCaption);
        setHashtags(updatedHashtags);
        setStep("done");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao salvar."
        );
      }
    },
    [postId]
  );

  const handleSchedule = useCallback(async () => {
    if (!postId) return;

    // Save first, then show scheduling message
    try {
      const res = await apiFetch(`/api/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ caption, hashtags }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao salvar.");
      }

      toast.success("Post salvo como rascunho!");
      setStep("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar."
      );
    }
  }, [postId, caption, hashtags]);

  const handleReset = useCallback(() => {
    setStep("mode");
    setMode(null);
    setPrompt("");
    setFormat("square");
    setReferenceImages([]);
    setPostId(null);
    setImageUrl("");
    setCaption("");
    setHashtags([]);
    setError(null);
    setIsLoading(false);
    setIsRegenerating(false);
    setIncludeProfilePhoto(false);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step !== "mode" && step !== "generating" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (step === "prompt") setStep("mode");
              else if (step === "preview") setStep(mode === "prompt" ? "prompt" : "mode");
              else if (step === "done") handleReset();
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Criar Post</h1>
          <p className="text-sm text-muted-foreground">
            {step === "mode" && "Escolha como deseja criar seu post"}
            {step === "prompt" && "Descreva sua ideia para o post"}
            {step === "generating" && "Criando seu post..."}
            {step === "preview" && "Revise e edite seu post"}
            {step === "done" && "Post salvo com sucesso!"}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Opcao: Aparecer no post (upload de foto de referencia) */}
      {(step === "mode" || step === "prompt") && (
        <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="relative size-12 shrink-0">
            <label className="flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/40 transition-colors hover:border-[#1A73E8]">
              {appearPhotoPreview ? (
                <img
                  src={appearPhotoPreview}
                  alt="Sua foto"
                  className="size-full object-cover"
                />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                  setError("Formato nao suportado. Use JPG, PNG ou WebP.");
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  setError("A imagem deve ter no maximo 5MB.");
                  return;
                }
                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(",")[1]);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                if (appearPhotoPreview) URL.revokeObjectURL(appearPhotoPreview);
                setAppearPhoto({ base64, mimeType: file.type });
                setAppearPhotoPreview(URL.createObjectURL(file));
                setError(null);
              }}
            />
          </label>
            {appearPhotoPreview && (
              <button
                type="button"
                onClick={() => {
                  if (appearPhotoPreview) URL.revokeObjectURL(appearPhotoPreview);
                  setAppearPhoto(null);
                  setAppearPhotoPreview(null);
                }}
                className="absolute -right-1 -top-1 z-10 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/80"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium">Aparecer no post</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {appearPhoto
                ? "Sua foto sera usada como referencia na imagem gerada"
                : "Envie uma foto sua para aparecer no post"}
            </p>
          </div>
        </div>
      )}

      {/* Step: Mode Selection */}
      {step === "mode" && (
        <ModeSelector onSelect={handleModeSelect} selected={mode} />
      )}

      {/* Step: Prompt Input */}
      {step === "prompt" && (
        <div className="space-y-6 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
          <div className="border-t pt-4">
            <ReferenceUpload onImagesChange={setReferenceImages} />
          </div>
        </div>
      )}

      {/* Step: Generation Loading */}
      {step === "generating" && <GenerationLoader isVisible />}

      {/* Step: Preview */}
      {step === "preview" && postId && (
        <PostPreview
          postId={postId}
          imageUrl={imageUrl}
          caption={caption}
          hashtags={hashtags}
          onRegenerateImage={handleRegenerateImage}
          onRegenerateCaption={handleRegenerateCaption}
          onSave={handleSave}
          onSchedule={handleSchedule}
          isRegenerating={isRegenerating}
          credits={credits}
          userName={userName}
          userAvatar={userAvatar}
        />
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Post salvo com sucesso!</h2>
            <p className="mt-1 text-muted-foreground">
              Seu rascunho está disponível no painel.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Criar outro post
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="gap-2 bg-[#1A73E8] text-white hover:bg-[#0d5bbd]"
            >
              Ir para o painel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
