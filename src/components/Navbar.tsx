"use client";

import { useEffect } from "react";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardListIcon, LayoutDashboardIcon, Download } from "lucide-react";
import { usePWA } from "@/components/PWAInstallPrompt";

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  const syncUser = useMutation(api.users.syncUser);
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Sincroniza o usuário do Clerk no Convex automaticamente
  useEffect(() => {
    if (isLoaded && user && user.id) {
      syncUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || "Técnico",
        email: user.primaryEmailAddress?.emailAddress || "",
      }).catch(console.error);
    }
  }, [isLoaded, user, syncUser]);

  const { isInstalled, installApp } = usePWA();

  const isLeader = currentUser?.role === "LIDER";

  const navLinks = [
    { name: "Novo Checklist", path: "/checklist", icon: ClipboardListIcon },
    ...(isLeader
      ? [{ name: "Dashboard (Líder)", path: "/dashboard", icon: LayoutDashboardIcon }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Eletromidia Horizontal (3).png"
            alt="Eletromidia Logo"
            width={140}
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* Navigation Links with animated active indicator */}
        {isSignedIn && (
          <nav className="flex items-center gap-2 sm:gap-6">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.path);
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.name}</span>
                  <span className="sm:hidden">
                    {link.name === "Novo Checklist" ? "Checklist" : "Dashboard"}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Profile, Role & Install Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isInstalled && (
            <Button
              variant="outline"
              size="sm"
              onClick={installApp}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#FF4F00] border-[#FF4F00]/30 hover:bg-[#FF4F00]/10 hover:text-[#FF4F00] rounded-xl h-8 px-2.5 transition-all"
              title="Instalar como aplicativo no dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
            </Button>
          )}

          {user && (
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold leading-tight truncate max-w-[160px]">
                {user.fullName || user.firstName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          )}

          {currentUser && (
            <Badge
              variant={currentUser.role === "LIDER" ? "default" : "secondary"}
              className={`hidden sm:inline-flex text-xs font-bold ${
                currentUser.role === "LIDER"
                  ? "bg-primary text-black hover:bg-primary/90"
                  : ""
              }`}
            >
              {currentUser.role === "LIDER" ? "LÍDER" : "TÉCNICO"}
            </Badge>
          )}

          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-primary/30",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
