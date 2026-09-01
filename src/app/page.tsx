"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download } from "lucide-react";
import { usePWA } from "@/components/PWAInstallPrompt";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isLoaded, userId } = useAuth();
  const { isInstalled, installApp } = usePWA();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace("/checklist");
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="flex justify-center">
          <Image 
            src="/eletromidia-app logo-1024px.png" 
            alt="Logo Eletromidia App" 
            width={200} 
            height={200} 
            className="drop-shadow-lg object-contain"
            priority
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Controle de Frota
          </h1>
          <p className="text-muted-foreground text-lg">
            Sistema digital de checklist de veículos
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <SignInButton mode="modal">
            <Button 
              size="lg" 
              className="w-full text-lg h-14 bg-primary text-white hover:bg-primary/90 font-bold rounded-[12px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
            >
              Entrar
            </Button>
          </SignInButton>

          <SignUpButton mode="modal">
            <Button 
              type="button"
              variant="outline" 
              size="lg" 
              className="w-full text-base h-12 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-bold rounded-[12px] transition-all"
            >
              Primeiro Acesso? Criar Cadastro
            </Button>
          </SignUpButton>

          {mounted && !isInstalled && (
            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={installApp}
                className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-2 h-10 rounded-xl transition-all"
              >
                <Download className="w-4 h-4 text-[#FF4F00]" />
                Instalar como aplicativo no seu aparelho
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
