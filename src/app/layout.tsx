import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaRegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduConnect — Сургалтын төвийн удирдлагын платформ",
  description:
    "Сургалтын төвүүдэд зориулсан нэгдсэн платформ: бүлэг, сурагч, ирц, даалгавар, эцэг эх-багшийн харилцаа.",
  keywords: ["EduConnect", "сургалтын төв", "курс", "ирц", "бүлэг", "Mongolia", "SaaS"],
  manifest: "/manifest.webmanifest",
  applicationName: "EduConnect",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EduConnect",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b2b4b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="top-right" richColors />
        <PwaRegister />
      </body>
    </html>
  );
}