"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CameraIcon, CheckIcon } from "lucide-react";
import Image from "next/image";

interface PhotoUploadProps {
  label: string;
  value?: string;
  initialPreviewUrl?: string | null;
  onUploadSuccess: (storageId: string) => void;
  onRemove?: () => void;
}

export function PhotoUpload({
  label,
  value,
  initialPreviewUrl,
  onUploadSuccess,
  onRemove,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Mostra preview local rápido
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      // 1. Pede URL pro Convex
      const postUrl = await generateUploadUrl();

      // 2. Faz o POST do arquivo para a URL gerada
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();

      // 3. Devolve o storageId para o form
      onUploadSuccess(storageId);
    } catch (error) {
      console.error("Erro no upload", error);
      setPreviewUrl(null); // Reseta preview se der erro
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }
  };

  const hasPhoto = !!previewUrl || !!value;

  return (
    <div className="flex flex-col space-y-2 rounded-xl border border-dashed border-border p-3 bg-muted/20 items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
      {hasPhoto ? (
        <>
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black/10">
            {previewUrl ? (
              <Image src={previewUrl} alt={label} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground p-2 text-center">
                <CheckIcon className="w-6 h-6 text-green-500 mb-1" />
                <span>Foto Anexada</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-2">
            <span className="text-xs font-semibold text-white truncate max-w-full text-center px-1">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Button variant="secondary" size="sm" className="h-8 text-xs">
                  <CameraIcon className="w-3.5 h-3.5 mr-1" /> Trocar
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              {onRemove && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 text-xs"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <label className="flex flex-col items-center cursor-pointer w-full h-32 justify-center text-center p-2">
          {isUploading ? (
            <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                <CameraIcon className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-semibold leading-tight line-clamp-1">{label}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">Toque para fotografar</span>
            </>
          )}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
