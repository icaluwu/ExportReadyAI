import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image 
                src="/logo.png" 
                alt="ExportReady AI Logo" 
                width={24} 
                height={24} 
              />
              <span className="text-lg font-bold tracking-tight text-primary">ExportReady AI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Membantu UMKM Indonesia naik kelas dan menembus pasar internasional dengan kekuatan AI.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-primary">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/assessment" className="hover:text-primary transition-colors">Cek Kesiapan Ekspor</Link></li>
              <li><Link href="/#features" className="hover:text-primary transition-colors">Fitur Utama</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard Riwayat</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-primary">Kontak</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:info@exportready.ai" className="hover:text-primary transition-colors">info@exportready.ai</a></li>
              <li><span className="text-xs">Jakarta, Indonesia</span></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2024 ExportReady AI. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary">Kebijakan Privasi</Link>
            <Link href="#" className="hover:text-primary">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
