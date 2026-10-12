import type { Metadata } from 'next';
import { PricingSection } from '@/components/pricing/PricingSection';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Harga & Paket',
  description: 'Pilih paket ExportReady AI untuk membuka fitur pendampingan ekspor sesuai kebutuhan UMKM Anda.',
  alternates: { canonical: '/harga' },
  openGraph: {
    title: 'Harga & Paket | ExportReady AI',
    description: 'Bandingkan paket gratis dan premium ExportReady AI.',
    url: '/harga',
    images: ['/og-image.png'],
  },
};

export default function HargaPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-primary/80 px-4 py-16 text-center text-white">
        <h1 className="text-4xl font-black md:text-5xl">Mulai dari kebutuhan ekspor Anda</h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/80">
          Assessment dasar tetap bisa dimulai gratis. Buka analisis dan pendampingan lebih lengkap saat bisnis Anda siap.
        </p>
      </section>
      <PricingSection />
    </div>
  );
}
