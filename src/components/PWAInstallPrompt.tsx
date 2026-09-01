"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { 
  Download, 
  Share, 
  PlusSquare, 
  X, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  installApp: () => void;
  openInstallGuide: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isInstallable: false,
  isIOS: false,
  installApp: () => {},
  openInstallGuide: () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Registrar Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registrado com sucesso:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Falha ao registrar Service Worker:", error);
        });
    }

    // 2. Verificar se já está rodando em modo standalone (já instalado)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkIsInstalled();

    // 3. Detectar se é dispositivo iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 4. Capturar evento de instalação nativa (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Detectar quando o app for instalado com sucesso
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
    });

    // Se for iOS e não estiver instalado, mostrar banner após 3 segundos (se não tiver sido dispensado)
    if (isIOSDevice && !checkIsStandalone()) {
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowBanner(true), 2500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  function checkIsStandalone() {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Erro ao solicitar instalação:", err);
      }
    } else {
      // Abre o guia instrucional caso não haja prompt nativo automático (ex: iOS ou navegadores sem prompt nativo direto)
      setIsGuideOpen(true);
    }
  };

  const openInstallGuide = () => {
    setIsGuideOpen(true);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa_banner_dismissed", "true");
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable: !!deferredPrompt || isIOS,
        isIOS,
        installApp,
        openInstallGuide,
      }}
    >
      {children}

      {/* Banner Flutuante Inferior de Instalação */}
      {mounted && showBanner && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white border border-primary/20 shadow-2xl rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#FF4F00]" />
            
            <div className="w-12 h-12 rounded-xl bg-orange-50 p-1 flex-shrink-0 flex items-center justify-center border border-orange-100">
              <Image
                src="/icon-192.png"
                alt="App Icon"
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-bold text-gray-900 leading-tight">
                Instalar Aplicativo
              </h4>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                Acesse mais rápido e use em tela cheia no seu aparelho
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                onClick={installApp}
                className="bg-[#FF4F00] hover:bg-[#E04500] text-white font-bold h-9 px-3.5 rounded-lg shadow-sm text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Instalar
              </Button>
              <button
                onClick={dismissBanner}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Guia de Instalação para iOS & Outros Dispositivos */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
              <Image
                src="/icon-192.png"
                alt="Logo App"
                width={48}
                height={48}
                className="rounded-xl"
              />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Como instalar o aplicativo
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Siga os passos abaixo para fixar o Controle de Frota no seu dispositivo:
            </DialogDescription>
          </DialogHeader>

          {isIOS ? (
            /* Guia Passo a Passo para iPhone / iPad no Safari */
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100">
                <div className="w-7 h-7 rounded-full bg-[#FF4F00] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  Toque no botão <strong className="text-gray-900 font-semibold">Compartilhar</strong> (ícone <Share className="w-3.5 h-3.5 inline mx-0.5 text-[#FF4F00]" /> na barra inferior do Safari).
                </div>
              </div>

              <div className="flex items-start gap-3 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100">
                <div className="w-7 h-7 rounded-full bg-[#FF4F00] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  Role a lista para baixo e selecione <strong className="text-gray-900 font-semibold">"Adicionar à Tela de Início"</strong> (ícone <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#FF4F00]" />).
                </div>
              </div>

              <div className="flex items-start gap-3 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100">
                <div className="w-7 h-7 rounded-full bg-[#FF4F00] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  Toque em <strong className="text-gray-900 font-semibold">"Adicionar"</strong> no canto superior direito para concluir.
                </div>
              </div>

              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  onClick={() => setIsGuideOpen(false)}
                  className="w-full h-11 border-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Entendi
                </Button>
              </div>
            </div>
          ) : (
            /* Guia para Android / Computador (Chrome / Edge) */
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <Smartphone className="w-5 h-5 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700 leading-relaxed">
                  <strong className="text-gray-900 block font-semibold mb-0.5">No celular Android:</strong>
                  Toque nos três pontinhos <strong>(⋮)</strong> do navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <Monitor className="w-5 h-5 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700 leading-relaxed">
                  <strong className="text-gray-900 block font-semibold mb-0.5">No computador (Chrome ou Edge):</strong>
                  Clique no ícone de instalação <Download className="w-3.5 h-3.5 inline mx-0.5 text-[#FF4F00]" /> na barra de endereço ao lado da estrela de favoritos.
                </div>
              </div>

              <div className="pt-2 text-center flex gap-2">
                {deferredPrompt && (
                  <Button
                    onClick={installApp}
                    className="flex-1 h-11 bg-[#FF4F00] hover:bg-[#E04500] text-white font-bold rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar Agora
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsGuideOpen(false)}
                  className="flex-1 h-11 border-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PWAContext.Provider>
  );
}
