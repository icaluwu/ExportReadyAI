import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/70 p-10 text-center shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] relative overflow-hidden">
        <div className="absolute -z-10 -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -z-10 -bottom-20 -left-16 h-64 w-64 rounded-full bg-accent/12 blur-3xl" />

        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
          <Search className="h-7 w-7" />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">Halaman tidak ditemukan</h1>
        <p className="text-slate-600 font-medium mb-8">
          Link yang Anda buka tidak tersedia, atau sudah dipindahkan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="bg-primary font-black h-12 px-7 rounded-2xl">
            <Link href="/assessment">
              Mulai Analisis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-7 rounded-2xl border-2 bg-white/60 hover:bg-white font-black">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

