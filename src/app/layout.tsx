import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://export-ready-ai.vercel.app"),
  title: {
    default: "ExportReady AI | Cek Kesiapan Ekspor UMKM Anda",
    template: "%s | ExportReady AI",
  },
  description:
    "Asisten ekspor virtual untuk UMKM Indonesia: skor kesiapan 0-100, rekomendasi 3 negara tujuan, dan roadmap ekspor 4 fase—gratis, 24/7.",
  keywords: [
    "ekspor",
    "UMKM",
    "Indonesia",
    "AI",
    "kesiapan ekspor",
    "market intelligence",
    "roadmap ekspor",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "ExportReady AI",
    title: "ExportReady AI | Cek Kesiapan Ekspor UMKM Anda",
    description:
      "Skor kesiapan ekspor 0-100, rekomendasi 3 negara tujuan, dan roadmap 4 fase dalam Bahasa Indonesia—kurang dari 30 menit.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ExportReady AI",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ExportReady AI | Cek Kesiapan Ekspor UMKM Anda",
    description:
      "Skor kesiapan ekspor 0-100, rekomendasi 3 negara tujuan, dan roadmap 4 fase untuk UMKM—gratis, 24/7.",
    images: ["/logo.png"],
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
