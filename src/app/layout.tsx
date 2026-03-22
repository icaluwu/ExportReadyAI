import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ExportReady AI | Cek Kesiapan Ekspor UMKM Anda",
  description: "Platform AI pertama di Indonesia yang memberikan analisis kesiapan kesiapan ekspor, rekomendasi pasar, dan roadmap ekspor personal untuk UMKM.",
  keywords: "ekspor, UMKM, Indonesia, AI, pasar internasional, kesiapan ekspor",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body 
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col bg-slate-50`}
        suppressHydrationWarning
      >
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
