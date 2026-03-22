import Link from 'next/link';
import Image from 'next/image';
import { UserMenu } from './UserMenu';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative overflow-hidden rounded-lg shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 duration-300">
            <Image 
              src="/logo.png" 
              alt="ExportReady AI Logo" 
              width={32} 
              height={32} 
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">
            ExportReady <span className="text-primary italic">AI</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-semibold text-slate-500 hover:text-primary transition-all hover:translate-y-[-1px]">Fitur</Link>
          <Link href="/#how-it-works" className="text-sm font-semibold text-slate-500 hover:text-primary transition-all hover:translate-y-[-1px]">Cara Kerja</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-primary transition-all hover:translate-y-[-1px]">Dashboard</Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
