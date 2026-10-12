import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description: 'Hubungi tim ExportReady AI untuk pertanyaan layanan, kerja sama, atau laporan masalah.',
  alternates: { canonical: '/hubungi-kami' },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-12">
        <p className="text-sm font-black uppercase tracking-widest text-primary">Hubungi kami</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">Mari bantu langkah ekspor Anda</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Untuk pertanyaan layanan, kerja sama pembinaan UMKM, atau laporan masalah, kirimkan email dengan konteks yang cukup agar kami dapat menindaklanjuti.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="mailto:info@exportready.web.id" className="rounded-2xl border border-border p-5 transition-colors hover:border-primary">
            <Mail className="h-6 w-6 text-primary" />
            <p className="mt-3 font-bold">Email layanan</p>
            <p className="mt-1 text-sm text-muted-foreground">info@exportready.web.id</p>
          </Link>
          <Link href="/harga" className="rounded-2xl border border-border p-5 transition-colors hover:border-primary">
            <MessageCircle className="h-6 w-6 text-primary" />
            <p className="mt-3 font-bold">Pertanyaan paket</p>
            <p className="mt-1 text-sm text-muted-foreground">Lihat fitur dan FAQ billing</p>
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          ExportReady AI saat ini beroperasi sebagai layanan perorangan. Kami tidak menyiratkan status PT/CV sebelum entitas tersebut tersedia.
        </p>
      </div>
    </div>
  );
}
