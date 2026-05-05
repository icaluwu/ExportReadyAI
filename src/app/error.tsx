'use client'

import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-10 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] text-center relative overflow-hidden">
            <div className="absolute -z-10 -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -z-10 -bottom-20 -left-16 h-64 w-64 rounded-full bg-accent/12 blur-3xl" />

            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
              Maaf, terjadi gangguan.
            </h1>
            <p className="text-slate-600 font-medium mb-8">
              Silakan coba lagi. Jika masih bermasalah, kembali ke beranda dan ulangi prosesnya.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => reset()} className="bg-primary font-black h-12 px-7 rounded-2xl">
                Coba Lagi
              </Button>
              <Button asChild variant="outline" className="h-12 px-7 rounded-2xl border-2 bg-white/60 hover:bg-white font-black">
                <Link href="/">
                  Kembali ke Beranda <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-xs text-slate-400">
              Kode: {error?.digest ?? 'n/a'}
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

