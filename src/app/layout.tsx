import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getServerSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(getServerSiteUrl()),
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
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ExportReady AI - Cek Kesiapan Ekspor UMKM Anda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExportReady AI | Cek Kesiapan Ekspor UMKM Anda",
    description:
      "Skor kesiapan ekspor 0-100, rekomendasi 3 negara tujuan, dan roadmap 4 fase untuk UMKM—gratis, 24/7.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body 
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col bg-background`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
