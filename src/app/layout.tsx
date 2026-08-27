import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ptBR } from "@clerk/localizations";
import type { Metadata, Viewport } from "next";
import { Rethink_Sans } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toast";
import { PWAProvider } from "@/components/PWAInstallPrompt";

const rethinkSans = Rethink_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FF4F00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Eletromidia - Controle de Frota",
  description: "Sistema de Controle e Checklist de Frota",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Controle Frota",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        variables: {
          colorPrimary: "#FF4F00",
          colorPrimaryForeground: "#FFFFFF",
          colorBackground: "#FFFFFF",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-white border border-gray-200 shadow-xl rounded-2xl",
          formButtonPrimary: "bg-[#FF4F00] hover:bg-[#E04500] text-white font-bold rounded-xl h-11 transition-all shadow-md",
          headerTitle: "text-xl font-bold text-gray-900 tracking-tight",
          headerSubtitle: "text-gray-500 text-sm",
          formFieldLabel: "text-gray-700 font-semibold text-xs",
          formFieldInput: "bg-white border-gray-300 text-gray-900 rounded-xl focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] h-11",
          footerActionLink: "text-[#FF4F00] hover:text-[#FF4F00]/80 font-bold",
          footerActionText: "text-gray-500 text-xs",
          identityPreviewText: "text-gray-900 font-medium",
          identityPreviewEditButton: "text-[#FF4F00]",
          dividerLine: "bg-gray-200",
          dividerText: "text-gray-500 text-xs",
          modalBackdrop: "bg-black/40 backdrop-blur-sm",
          modalCloseButton: "text-gray-400 hover:text-gray-700",
        },
      }}
    >
      <html
        lang="pt-BR"
        className={`${rethinkSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ConvexClientProvider>
            <PWAProvider>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Toaster />
            </PWAProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}