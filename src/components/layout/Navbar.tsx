'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const PRIMARY_LINKS = [
  { href: '/#features', label: 'Fitur' },
  { href: '/#how-it-works', label: 'Cara Kerja' },
  { href: '/#pricing', label: 'Harga' },
  { href: '/blog', label: 'Blog' },
];

const SECONDARY_LINKS = [
  { href: '/materi-belajar', label: 'Materi Belajar' },
  { href: '/sertifikasi', label: 'Direktori Sertifikasi' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full nav-blur">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ExportReady AI, beranda">
          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-border">
            <Image src="/logo.png" alt="" width={32} height={32} />
          </span>
          <span className="font-heading text-[1.0625rem] font-semibold tracking-[-0.02em] text-foreground">
            ExportReady <span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <span aria-hidden className="mx-1 h-4 w-px bg-border" />
          {SECONDARY_LINKS.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:block"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <UserMenu />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          'overflow-hidden border-t border-border bg-background md:hidden',
          open ? 'block' : 'hidden'
        )}
      >
        <nav className="shell flex flex-col py-3" aria-label="Navigasi seluler">
          {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-border/60 py-3 text-[0.9375rem] font-medium text-foreground/80 transition-colors last:border-0 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/assessment"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-[0.9375rem] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Mulai Analisis Gratis
          </Link>
        </nav>
      </div>
    </header>
  );
}
