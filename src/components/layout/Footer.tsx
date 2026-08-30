import Link from 'next/link';
import Image from 'next/image';

const PLATFORM_LINKS = [
  { href: '/assessment', label: 'Cek Kesiapan Ekspor' },
  { href: '/#features', label: 'Fitur Utama' },
  { href: '/#pricing', label: 'Harga' },
  { href: '/dashboard', label: 'Dashboard Riwayat' },
];

const RESOURCE_LINKS = [
  { href: '/materi-belajar', label: 'Materi Belajar' },
  { href: '/sertifikasi', label: 'Direktori Sertifikasi' },
  { href: '/blog', label: 'Blog' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--paper-alt)] py-14">
      <div className="shell">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-white ring-1 ring-border">
                <Image src="/logo.png" alt="" width={20} height={20} />
              </span>
              <span className="font-heading text-base font-semibold tracking-tight">
                ExportReady <span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Membantu UMKM Indonesia naik kelas dan menembus pasar internasional dengan kekuatan AI.
            </p>
          </div>

          <div>
            <h4 className="eyebrow">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow">Sumber Belajar</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow">Kontak</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:info@exportready.ai"
                  className="transition-colors hover:text-foreground"
                >
                  info@exportready.ai
                </a>
              </li>
              <li>Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ExportReady AI. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <Link href="/kebijakan-privasi" className="transition-colors hover:text-foreground">
              Kebijakan Privasi
            </Link>
            <Link href="/syarat-ketentuan" className="transition-colors hover:text-foreground">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
