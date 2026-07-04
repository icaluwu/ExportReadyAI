import Link from 'next/link';
import Image from 'next/image';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative overflow-hidden rounded-lg shadow-md shadow-primary/10 transition-transform group-hover:scale-105 duration-300 bg-white">
            <Image
              src="/logo.png"
              alt="ExportReady AI Logo"
              width={32}
              height={32}
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            ExportReady <span className="text-primary italic">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link href="/blog" className="relative text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px] flex items-center gap-1.5 group">
            <span>Blog</span>
            <span className="absolute -top-2 -right-5 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none group-hover:bg-primary transition-colors">Community</span>
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">Harga</Link>
          <Link href="/#features" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">Fitur</Link>
          <Link href="/#how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">Cara Kerja</Link>
          <Link href="/materi-belajar" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">Materi</Link>
          <Link href="/sertifikasi" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">Sertifikasi</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all hover:translate-y-[-1px]">Dashboard</Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
