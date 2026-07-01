'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getSnapScriptUrl, isMidtransProduction } from '@/lib/midtrans-client-browser';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price_idr: number;
  features: string[];
  is_active: boolean;
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const PLAN_LABELS: Record<string, { title: string; subtitle: string; period: string }> = {
  free: {
    title: 'Gratis',
    subtitle: 'Cocok untuk mulai kenalan dengan ekspor',
    period: 'Selamanya',
  },
  premium_monthly: {
    title: 'Premium Bulanan',
    subtitle: 'Akses penuh semua fitur canggih',
    period: '/bulan',
  },
  premium_yearly: {
    title: 'Premium Tahunan',
    subtitle: 'Hemat lebih banyak untuk komitmen jangka panjang',
    period: '/tahun',
  },
};

const FEATURE_LABELS: Record<string, string> = {
  assessment_basic: 'Assessment kesiapan ekspor',
  roadmap_full: 'Roadmap lengkap 4 fase',
  export_pdf: 'Unduh laporan PDF',
  market_recommendations: 'Rekomendasi pasar AI lengkap',
};

function formatPrice(price: number): string {
  if (price === 0) return 'Rp 0';
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      reject(new Error('Kunci Midtrans belum dikonfigurasi'));
      return;
    }

    const existing = document.querySelector('script[data-snap]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = getSnapScriptUrl();
    script.setAttribute('data-client-key', clientKey);
    script.setAttribute('data-snap', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Snap.js'));
    document.body.appendChild(script);
  });
}

export function PricingSection() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      const { data } = await supabase
        .from('subscription_plans')
        .select('id, name, price_idr, features, is_active')
        .eq('is_active', true)
        .order('price_idr', { ascending: true });

      if (data) {
        setPlans(
          data.map((p) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : [],
          })),
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleUpgrade = useCallback(
    async (planId: string) => {
      if (!isLoggedIn) {
        toast.info('Silakan login dulu untuk melanjutkan pembayaran');
        router.push('/login?next=/#pricing');
        return;
      }

      setPayingPlanId(planId);
      try {
        const res = await fetch('/api/payment/create-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal membuat transaksi');
        }

        await loadSnapScript();

        if (!window.snap) {
          throw new Error('Snap.js belum siap');
        }

        const orderId = data.order_id as string;

        window.snap.pay(data.token, {
          onSuccess: () => {
            router.push(`/payment/status?order_id=${orderId}`);
          },
          onPending: () => {
            router.push(`/payment/status?order_id=${orderId}`);
          },
          onError: () => {
            toast.error('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: () => {
            setPayingPlanId(null);
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        toast.error(msg);
        setPayingPlanId(null);
      }
    },
    [isLoggedIn, router],
  );

  if (loading) {
    return (
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
            Pilih Paket yang Sesuai
          </h2>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
            Mulai gratis, lalu buka fitur lengkap saat Anda siap ekspor lebih serius.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const meta = PLAN_LABELS[plan.name] ?? {
              title: plan.name,
              subtitle: '',
              period: '',
            };
            const isFree = plan.name === 'free';
            const isPremium = !isFree;
            const isYearly = plan.name === 'premium_yearly';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className={`h-full rounded-3xl relative overflow-hidden ${
                    isYearly
                      ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                      : 'border-border/70'
                  }`}
                >
                  {isYearly && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      Paling Hemat
                    </div>
                  )}
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {isPremium ? (
                        <Crown className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-primary" />
                      )}
                      <CardTitle className="text-xl font-black">{meta.title}</CardTitle>
                    </div>
                    <CardDescription className="font-medium">{meta.subtitle}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-black text-foreground">
                        {formatPrice(plan.price_idr)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">{meta.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4">
                    <ul className="space-y-3 mb-8">
                      {(isFree
                        ? ['assessment_basic']
                        : ['assessment_basic', 'roadmap_full', 'export_pdf', 'market_recommendations']
                      ).map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground font-medium">
                            {FEATURE_LABELS[feat] ?? feat}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isFree ? (
                      <Button asChild className="w-full h-12 rounded-xl font-bold">
                        <Link href="/assessment">Mulai Gratis</Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-12 rounded-xl font-bold"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={payingPlanId === plan.id}
                      >
                        {payingPlanId === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Memproses...
                          </>
                        ) : (
                          'Buka Fitur Lengkap'
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {!isMidtransProduction() && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Mode sandbox — pembayaran uji coba, bukan transaksi nyata.
          </p>
        )}
      </div>
    </section>
  );
}
