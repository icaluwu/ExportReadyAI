'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumGateProps {
  feature: string;
  isPremium: boolean;
  children: React.ReactNode;
  blur?: boolean;
  className?: string;
}

export function PremiumGate({
  isPremium,
  children,
  blur = true,
  className = '',
}: PremiumGateProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      <div className={blur ? 'blur-sm pointer-events-none select-none' : 'opacity-50 pointer-events-none'}>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-2xl p-6">
        <div className="bg-primary/10 p-3 rounded-full mb-3">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold text-foreground text-center mb-3 max-w-xs">
          Fitur ini tersedia di paket Premium
        </p>
        <Button asChild size="sm" className="rounded-xl font-bold">
          <Link href="/#pricing">Buka Fitur Lengkap</Link>
        </Button>
      </div>
    </div>
  );
}

export function PremiumCTA({ className = '' }: { className?: string }) {
  return (
    <Button asChild className={`rounded-xl font-bold ${className}`}>
      <Link href="/#pricing">Buka Fitur Lengkap</Link>
    </Button>
  );
}
