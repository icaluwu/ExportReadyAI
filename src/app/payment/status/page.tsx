'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40;

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');

  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch(`/api/payment/status/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setStatus(data.status);
            if (['settlement', 'expire', 'cancel', 'deny'].includes(data.status)) {
              setLoading(false);
              clearInterval(intervalId);
            }
          }
        }
      } catch {
        // keep polling
      }

      if (!cancelled) {
        setPollCount((c) => c + 1);
      }
    }

    poll();
    intervalId = setInterval(() => {
      setPollCount((c) => {
        if (c >= MAX_POLLS) {
          clearInterval(intervalId);
          setLoading(false);
        }
        return c;
      });
      poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <Card className="max-w-md mx-auto rounded-3xl">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Nomor pesanan tidak ditemukan</h1>
          <p className="text-muted-foreground mb-6">Silakan coba lagi dari halaman harga.</p>
          <Button asChild>
            <Link href="/#pricing">Kembali ke Harga</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isSuccess = status === 'settlement';
  const isFailed = ['expire', 'cancel', 'deny'].includes(status);
  const isPending = !isSuccess && !isFailed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <Card className="rounded-3xl shadow-xl">
        <CardContent className="p-8 text-center">
          {isSuccess && (
            <>
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black mb-2">Pembayaran Berhasil!</h1>
              <p className="text-muted-foreground font-medium mb-6">
                Fitur lengkap sudah aktif. Anda bisa langsung pakai roadmap penuh, unduh PDF, dan rekomendasi pasar AI.
              </p>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => router.push('/dashboard')}
              >
                Ke Dashboard
              </Button>
            </>
          )}

          {isPending && (
            <>
              {loading ? (
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              ) : (
                <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              )}
              <h1 className="text-2xl font-black mb-2">Pembayaran Sedang Diproses</h1>
              <p className="text-muted-foreground font-medium mb-2">
                Mohon tunggu sebentar, kami sedang memverifikasi pembayaran Anda.
              </p>
              <p className="text-xs text-muted-foreground mb-6">No. pesanan: {orderId}</p>
              <Button variant="outline" asChild className="w-full h-12 rounded-xl">
                <Link href="/dashboard">Ke Dashboard Sementara</Link>
              </Button>
            </>
          )}

          {isFailed && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black mb-2">Pembayaran Tidak Berhasil</h1>
              <p className="text-muted-foreground font-medium mb-6">
                {status === 'expire' && 'Waktu pembayaran sudah habis. Silakan coba lagi.'}
                {status === 'cancel' && 'Pembayaran dibatalkan. Anda bisa coba lagi kapan saja.'}
                {status === 'deny' && 'Pembayaran ditolak. Periksa metode pembayaran Anda.'}
              </p>
              <Button asChild className="w-full h-12 rounded-xl font-bold">
                <Link href="/#pricing">Coba Lagi</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PaymentStatusPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
}
