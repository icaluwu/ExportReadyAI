'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, TrendingUp, Award, CheckCircle2, Circle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Roadmap {
  fase1: string[];
  fase2: string[];
  fase3: string[];
  fase4: string[];
}

const PHASES: Array<{
  key: keyof Roadmap;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { key: 'fase1', title: 'Fase 1: Persiapan Dasar', subtitle: 'Bulan 0-1', icon: <Zap className="h-5 w-5" />, color: 'bg-amber-500' },
  { key: 'fase2', title: 'Fase 2: Standarisasi', subtitle: 'Bulan 1-3', icon: <ShieldCheck className="h-5 w-5" />, color: 'bg-primary' },
  { key: 'fase3', title: 'Fase 3: Penetrasi Pasar', subtitle: 'Bulan 3-6', icon: <TrendingUp className="h-5 w-5" />, color: 'bg-emerald-500' },
  { key: 'fase4', title: 'Fase 4: Scale Up', subtitle: 'Bulan 6+', icon: <Award className="h-5 w-5" />, color: 'bg-blue-600' },
];

export function RoadmapChecklist({
  assessmentId,
  roadmap,
}: {
  assessmentId: string;
  roadmap: Roadmap;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAuthChecked(true);
        return;
      }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('roadmap_progress')
        .select('phase, item_index, done')
        .eq('assessment_id', assessmentId);

      if (data) {
        const map: Record<string, boolean> = {};
        for (const row of data) {
          map[`${row.phase}:${row.item_index}`] = row.done;
        }
        setProgress(map);
      }
      setAuthChecked(true);
    }
    load();
  }, [assessmentId]);

  async function toggleItem(phase: string, index: number) {
    if (!userId) return;
    const key = `${phase}:${index}`;
    const nextDone = !progress[key];
    setProgress((prev) => ({ ...prev, [key]: nextDone }));

    const { error } = await supabase.from('roadmap_progress').upsert(
      {
        assessment_id: assessmentId,
        user_id: userId,
        phase,
        item_index: index,
        done: nextDone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'assessment_id,phase,item_index' }
    );

    if (error) {
      // Roll back optimistic update on failure
      setProgress((prev) => ({ ...prev, [key]: !nextDone }));
    }
  }

  const totalItems = PHASES.reduce((acc, p) => acc + (roadmap[p.key]?.length || 0), 0);
  const doneItems = Object.values(progress).filter(Boolean).length;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Overall progress / login CTA */}
      {authChecked && (
        userId ? (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Progress Keseluruhan</span>
                <span className="text-primary">{doneItems}/{totalItems} selesai</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground">{overallPct}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              <Link href="/login" className="font-bold text-primary hover:underline">Masuk</Link> atau{' '}
              <Link href="/register" className="font-bold text-primary hover:underline">daftar gratis</Link>{' '}
              untuk mencentang langkah roadmap dan menyimpan progress Anda.
            </span>
          </div>
        )
      )}

      <div className="space-y-12 relative">
        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border" />
        {PHASES.map((phase) => {
          const items = roadmap[phase.key] || [];
          const phaseDone = items.filter((_, i) => progress[`${phase.key}:${i}`]).length;
          return (
            <motion.div
              key={phase.key}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative pl-16 group"
            >
              <div className={cn('absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110', phase.color)}>
                {phase.icon}
              </div>

              <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-all group-hover:shadow-xl group-hover:border-primary/20">
                <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-xl font-black text-foreground">{phase.title}</h4>
                    {userId && items.length > 0 && (
                      <p className="mt-1 text-xs font-bold text-muted-foreground">
                        {phaseDone}/{items.length} langkah selesai
                      </p>
                    )}
                  </div>
                  <span className={cn('w-fit shrink-0 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white opacity-90 shadow-sm', phase.color)}>
                    {phase.subtitle}
                  </span>
                </div>

                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((item, i) => {
                    const checked = !!progress[`${phase.key}:${i}`];
                    return (
                      <li key={i}>
                        {userId ? (
                          <button
                            type="button"
                            onClick={() => toggleItem(phase.key, i)}
                            className={cn(
                              'flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm font-medium transition-all',
                              checked
                                ? 'border-emerald-200 bg-emerald-50 text-muted-foreground line-through dark:border-emerald-900 dark:bg-emerald-950/40'
                                : 'border-border bg-background text-foreground/90 hover:border-primary/40 hover:bg-primary/5'
                            )}
                          >
                            {checked ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                            )}
                            <span>{item}</span>
                          </button>
                        ) : (
                          <div className="flex items-start gap-3 p-1 text-sm font-medium text-muted-foreground">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            <span>{item}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
