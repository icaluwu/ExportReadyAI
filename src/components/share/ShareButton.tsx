'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Check, Loader2, Link2Off } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function ShareButton({ assessmentId }: { assessmentId: string }) {
  const [isOwner, setIsOwner] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from('assessments')
        .select('user_id, share_token')
        .eq('id', assessmentId)
        .maybeSingle();
      if (data?.user_id === session.user.id) {
        setIsOwner(true);
        setShareToken(data.share_token);
      }
    }
    load();
  }, [assessmentId]);

  if (!isOwner) return null;

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  async function enableShare() {
    setBusy(true);
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from('assessments')
      .update({ share_token: token })
      .eq('id', assessmentId);
    setBusy(false);
    if (error) {
      toast.error('Gagal membuat tautan publik.');
      return;
    }
    setShareToken(token);
    toast.success('Tautan publik aktif. Siapa pun dengan tautan ini bisa melihat hasil.');
  }

  async function disableShare() {
    setBusy(true);
    const { error } = await supabase
      .from('assessments')
      .update({ share_token: null })
      .eq('id', assessmentId);
    setBusy(false);
    if (error) {
      toast.error('Gagal menonaktifkan tautan.');
      return;
    }
    setShareToken(null);
    toast.success('Tautan publik dinonaktifkan.');
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Tautan disalin!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="h-14 px-6 rounded-2xl font-black border-2 gap-2"
      >
        <Share2 className="h-5 w-5" /> Bagikan
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-16 z-40 w-80 rounded-2xl border border-border bg-popover p-5 shadow-2xl"
          >
            <p className="mb-1 text-sm font-black text-foreground">Bagikan Hasil Analisis</p>
            <p className="mb-4 text-xs font-medium text-muted-foreground">
              Buat tautan publik read-only—tanpa data sensitif seperti email Anda.
            </p>

            {shareToken && shareUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="h-10 flex-1 truncate rounded-lg border border-border bg-muted px-3 text-xs font-medium"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button size="icon" onClick={copyLink} className="h-10 w-10 shrink-0 rounded-lg bg-primary">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={disableShare}
                  disabled={busy}
                  className="w-full rounded-lg font-bold gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
                  Nonaktifkan Tautan
                </Button>
              </div>
            ) : (
              <Button onClick={enableShare} disabled={busy} className="w-full rounded-lg bg-primary font-bold gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Aktifkan Tautan Publik
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
