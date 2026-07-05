'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Sparkles, Loader2, X, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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
  const [manualTx, setManualTx] = useState<{ orderId: string; planName: string; priceIdr: number } | null>(null);
  const [, setCopiedField] = useState<string | null>(null);

  const bankName = process.env.NEXT_PUBLIC_MANUAL_PAYMENT_BANK_NAME || 'Bank Central Asia (BCA)';
  const accountNumber = process.env.NEXT_PUBLIC_MANUAL_PAYMENT_ACCOUNT_NUMBER || '801234567890';
  const accountName = process.env.NEXT_PUBLIC_MANUAL_PAYMENT_ACCOUNT_NAME || 'PT Export Ready Indonesia';
  const whatsappNumber = process.env.NEXT_PUBLIC_MANUAL_PAYMENT_WHATSAPP_NUMBER || '6281234567890';

  useEffect(() => {
    async function load() {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured, using fallback plans');
          setPlans([
            {
              id: 'free',
              name: 'free',
              price_idr: 0,
              features: ['assessment_basic'],
              is_active: true,
            },
            {
              id: 'premium_monthly',
              name: 'premium_monthly',
              price_idr: 99000,
              features: ['roadmap_full', 'export_pdf', 'market_recommendations'],
              is_active: true,
            },
            {
              id: 'premium_yearly',
              name: 'premium_yearly',
              price_idr: 990000,
              features: ['roadmap_full', 'export_pdf', 'market_recommendations'],
              is_active: true,
            },
          ]);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        const { data } = await supabase
          .from('subscription_plans')
          .select('id, name, price_idr, features, is_active')
          .eq('is_active', true)
          .order('price_idr', { ascending: true });

        if (data && data.length > 0) {
          setPlans(
            data.map((p) => ({
              ...p,
              features: Array.isArray(p.features) ? p.features : [],
            })),
          );
        } else {
          // If query returned no plans, use default fallback plans
          setPlans([
            {
              id: 'free',
              name: 'free',
              price_idr: 0,
              features: ['assessment_basic'],
              is_active: true,
            },
            {
              id: 'premium_monthly',
              name: 'premium_monthly',
              price_idr: 99000,
              features: ['roadmap_full', 'export_pdf', 'market_recommendations'],
              is_active: true,
            },
            {
              id: 'premium_yearly',
              name: 'premium_yearly',
              price_idr: 990000,
              features: ['roadmap_full', 'export_pdf', 'market_recommendations'],
              is_active: true,
            },
          ]);
        }
      } catch (err) {
        console.error('Error loading pricing plans:', err);
        setPlans([
          {
            id: 'free',
            name: 'free',
            price_idr: 0,
            features: ['assessment_basic'],
            is_active: true,
          },
          {
            id: 'premium_monthly',
            name: 'premium_monthly',
            price_idr: 99000,
            features: ['roadmap_full', 'export_pdf', 'market_recommendations'],
            is_active: true,
          },
          {
            id: 'premium_yearly',
            name: 'premium_yearly',
            price_idr: 990000,
            features: ['roadmap_full', 'export_pdf', 'market_recommendations'],
            is_active: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
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

        if (data.manual) {
          setManualTx({
            orderId,
            planName: plan.name,
            priceIdr: plan.price_idr,
          });
          setPayingPlanId(null);
          return;
        }

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
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-foreground">
                          {formatPrice(plan.price_idr)}
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">{meta.period}</span>
                      </div>
                      {isPremium && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-semibold italic leading-snug">
                          *Belum termasuk pajak-pajak yang berlaku di Indonesia
                        </p>
                      )}
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

      <AnimatePresence>
        {manualTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setManualTx(null)}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative bg-card border border-border shadow-2xl rounded-3xl p-6 md:p-8 max-w-lg w-full z-10 overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setManualTx(null)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Instruksi Pembayaran Manual</h3>
                  <p className="text-xs text-muted-foreground">Selesaikan transfer bank untuk mengaktifkan akun Anda</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cost Breakdown */}
                <div className="bg-muted/40 rounded-2xl p-4 border border-border/55">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Rincian Pembayaran</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">Harga Paket ({manualTx.planName === 'premium_monthly' ? 'Premium Bulanan' : 'Premium Tahunan'})</span>
                      <span className="text-foreground">Rp {manualTx.priceIdr.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">PPN (11%)</span>
                      <span className="text-foreground">Rp {Math.round(manualTx.priceIdr * 0.11).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-border/70 my-2 pt-2 flex justify-between items-center">
                      <span className="font-bold text-foreground">Total Transfer</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-primary">Rp {(manualTx.priceIdr + Math.round(manualTx.priceIdr * 0.11)).toLocaleString('id-ID')}</span>
                        <button
                          onClick={() => {
                            const totalAmount = manualTx.priceIdr + Math.round(manualTx.priceIdr * 0.11);
                            navigator.clipboard.writeText(totalAmount.toString());
                            toast.success('Nominal transfer berhasil disalin!');
                            setCopiedField('total');
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Salin nominal transfer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-muted/40 rounded-2xl p-4 border border-border/55">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tujuan Transfer</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Bank</span>
                      <span className="font-bold text-foreground">{bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Nomor Rekening</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground tracking-wider">{accountNumber}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(accountNumber);
                            toast.success('Nomor rekening berhasil disalin!');
                            setCopiedField('rekening');
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Salin nomor rekening"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Atas Nama</span>
                      <span className="font-bold text-foreground">{accountName}</span>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Langkah Selanjutnya</h4>
                  <ol className="text-xs space-y-2 text-muted-foreground list-decimal pl-4 font-semibold leading-relaxed">
                    <li>Lakukan transfer dengan nominal yang <strong className="text-foreground">tepat</strong> ke rekening transfer di atas.</li>
                    <li>Simpan bukti transfer Anda.</li>
                    <li>Klik tombol <strong className="text-foreground">Konfirmasi via WhatsApp</strong> untuk mengirim bukti pembayaran ke Admin.</li>
                    <li>Akses fitur lengkap akan diaktifkan dalam waktu <strong className="text-foreground">5-15 menit</strong> setelah verifikasi.</li>
                  </ol>
                </div>

                {/* Alert */}
                <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Mohon sebutkan nomor pesanan: <strong className="font-mono font-bold">{manualTx.orderId}</strong> saat melakukan konfirmasi WhatsApp.</p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold h-12 border-border"
                    onClick={() => setManualTx(null)}
                  >
                    Tutup
                  </Button>
                  <Button
                    asChild
                    className="rounded-xl font-bold h-12 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                  >
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                        `Halo Admin ExportReady! Saya ingin melakukan konfirmasi pembayaran manual untuk berlangganan.\n\nDetail Transaksi:\n- Paket: ${manualTx.planName === 'premium_monthly' ? 'Premium Bulanan' : 'Premium Tahunan'}\n- No. Pesanan: ${manualTx.orderId}\n- Total Transfer: Rp ${(manualTx.priceIdr + Math.round(manualTx.priceIdr * 0.11)).toLocaleString('id-ID')}\n\nSaya melampirkan bukti transfer di bawah ini.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Konfirmasi WhatsApp
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
