'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Lock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    // When user lands here from email, Supabase will put tokens in the URL.
    // supabase-js will pick it up and establish a session if the redirect URL is allowed.
    supabase.auth.getSession().then(() => setReady(true))
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Password berhasil diperbarui. Silakan login kembali.')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/8 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border border-white/70 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] bg-white/70 rounded-[2rem]">
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/60 bg-white/40">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Buat Password Baru</CardTitle>
            <CardDescription>
              Masukkan password baru untuk akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            {!ready ? (
              <div className="py-8 flex items-center justify-center text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Menyiapkan sesi...
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="Minimal 6 karakter"
                      className="pl-10 h-11 bg-white/80 border-slate-200 focus:border-primary transition-all shadow-sm"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-black shadow-lg shadow-primary/15 bg-primary hover:bg-primary/95 transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Simpan Password <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="pt-6 border-t text-center text-sm text-slate-500">
                  <Link href="/login" className="font-black text-primary hover:underline underline-offset-4">
                    Kembali ke Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

