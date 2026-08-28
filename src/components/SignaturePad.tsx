"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import SignaturePadLib from "signature_pad";
import { PenLineIcon, Trash2Icon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  label?: string;
  value?: string; // base64 data URL
  onChange: (dataUrl: string) => void;
  onClear?: () => void;
  error?: boolean;
  required?: boolean;
}

export function SignaturePad({
  label = "Assinatura do Técnico",
  value,
  onChange,
  onClear,
  error = false,
  required = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSigned, setIsSigned] = useState(!!value);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Save current signature data before resizing
    const data = signaturePadRef.current?.toData();

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = container.clientWidth;
    const height = 200;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    // Restore signature data after resize
    if (signaturePadRef.current && data && data.length > 0) {
      signaturePadRef.current.fromData(data);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      minWidth: 1,
      maxWidth: 3,
    });

    signaturePadRef.current = pad;

    // When the user finishes a stroke, capture the signature
    pad.addEventListener("endStroke", () => {
      if (!pad.isEmpty()) {
        const dataUrl = pad.toDataURL("image/png");
        onChange(dataUrl);
        setIsSigned(true);
      }
    });

    resizeCanvas();

    // Load existing value if provided
    if (value && value.startsWith("data:")) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        }
      };
      img.src = value;
      setIsSigned(true);
    }

    window.addEventListener("resize", resizeCanvas);

    return () => {
      pad.off();
      window.removeEventListener("resize", resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();

      // Re-apply white background after clearing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgb(255, 255, 255)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    setIsSigned(false);
    onChange("");
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLineIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            {label} {required && <span className="text-destructive">*</span>}
          </span>
        </div>
        {isSigned && (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2Icon className="w-4 h-4" />
            <span className="text-xs font-semibold">Assinado</span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative rounded-xl border-2 ${
          error && !isSigned
            ? "border-destructive bg-destructive/5"
            : isSigned
            ? "border-green-500/50 bg-white"
            : "border-dashed border-muted-foreground/30 bg-white"
        } overflow-hidden transition-colors`}
      >
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair w-full"
          style={{ height: "200px" }}
        />

        {!isSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground/40 font-medium select-none">
              Assine aqui com o dedo ou caneta
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {required
            ? "Obrigatório — o técnico deve assinar para concluir o checklist."
            : "A assinatura confirma a responsabilidade do técnico."}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
        >
          <Trash2Icon className="w-3 h-3 mr-1" />
          Limpar
        </Button>
      </div>

      {error && !isSigned && (
        <p className="text-xs text-destructive font-medium">
          A assinatura do técnico é obrigatória para concluir o checklist.
        </p>
      )}
    </div>
  );
}
