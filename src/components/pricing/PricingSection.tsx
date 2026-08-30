'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSnapScriptUrl, isMidtransProduction } from '@/lib/midtrans-client-browser';
import { toast } from 'sonner';
import { calculatePaymentTotal } from '@/lib/pricing';

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
  const [pricingError, setPricingError] = useState(false);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (!isSupabaseConfigured()) throw new Error('Supabase belum dikonfigurasi');

        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(Boolean(session));

        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, price_idr, features, is_active')
          .eq('is_active', true)
          .order('price_idr', { ascending: true });

        if (error || !data?.length) throw error || new Error('Paket aktif tidak ditemukan');
        setPlans(data.map((plan) => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : [],
        })));
      } catch (error) {
        console.error('Error loading pricing plans:', error);
        setPricingError(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleUpgrade = useCallback(
    async (planId: string) => {
      if (!isLoggedIn) {
        toast.info('Silakan login dulu untuk melanjutkan pembayaran');
        router.push('/login?next=/#pricing');
        return;
      }

      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        toast.error('Rincian paket tidak ditemukan');
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

        const orderId = data.order_id as string;

        await loadSnapScript();

        if (!window.snap) {
          throw new Error('Snap.js belum siap');
        }

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
    [isLoggedIn, router, plans],
  );

  if (loading) {
    return (
      <section id="pricing" className="border-b border-border py-24">
        <div className="shell flex justify-center">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (pricingError) {
    return (
      <section id="pricing" className="border-b border-border py-24">
        <div className="shell max-w-xl text-center">
          <p className="eyebrow">Harga</p>
          <h2 className="display-md mt-3">Paket sementara tidak tersedia</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Silakan coba kembali beberapa saat lagi.
          </p>
        </div>
      </section>
    );
  }
  return (
    <section id="pricing" className="border-b border-border py-20 sm:py-24">
      <div className="shell">
        <div className="max-w-2xl">
          <p className="eyebrow">Harga</p>
          <h2 className="display-lg mt-3">Pilih paket yang sesuai tahap bisnis Anda</h2>
          <p className="lede mt-4">
            Mulai gratis, lalu buka fitur lengkap saat Anda siap ekspor lebih serius.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 border-t border-border md:grid-cols-3">
          {plans.map((plan, idx) => {
            const meta = PLAN_LABELS[plan.name] ?? {
              title: plan.name,
              subtitle: '',
              period: '',
            };
            const isFree = plan.name === 'free';
            const isPremium = !isFree;
            const isYearly = plan.name === 'premium_yearly';
            const amount = calculatePaymentTotal(plan.price_idr);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] as const }}
                className={`relative flex flex-col border-b border-border py-8 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0 ${
                  isYearly ? 'bg-[var(--paper-alt)]' : ''
                }`}
              >
                {isYearly && (
                  <span className="absolute top-8 right-0 rounded-full bg-primary/8 px-3 py-1 text-[0.6875rem] font-semibold tracking-wide text-primary ring-1 ring-primary/15 md:right-8">
                    Paling Hemat
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {isPremium ? (
                    <Crown className="size-5 text-accent" />
                  ) : (
                    <Sparkles className="size-5 text-primary" />
                  )}
                  <h3 className="font-heading text-lg font-semibold">{meta.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{meta.subtitle}</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-[2rem] leading-none font-bold tracking-tight text-foreground">
                      {formatPrice(isFree ? 0 : amount.total)}
                    </span>
                    <span className="text-sm text-muted-foreground">{meta.period}</span>
                  </div>
                  {isPremium && (
                    <p className="mt-2 text-xs leading-snug text-muted-foreground">
                      Termasuk PPN 11% (harga dasar {formatPrice(amount.subtotal)})
                    </p>
                  )}
                </div>

                <ul className="rule-t mt-6 space-y-3 pt-6">
                  {(isFree
                    ? ['assessment_basic']
                    : ['assessment_basic', 'roadmap_full', 'export_pdf', 'market_recommendations']
                  ).map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">
                        {FEATURE_LABELS[feat] ?? feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-2">
                  {isFree ? (
                    <Button asChild size="cta" variant="outline" className="w-full">
                      <Link href="/assessment">Mulai Gratis</Link>
                    </Button>
                  ) : (
                    <Button
                      size="cta"
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={payingPlanId === plan.id}
                    >
                      {payingPlanId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        'Buka Fitur Lengkap'
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {!isMidtransProduction() && (
          <p className="mt-6 text-xs text-muted-foreground">
            Mode sandbox — pembayaran uji coba, bukan transaksi nyata.
          </p>
        )}
      </div>
    </section>
  );
}
