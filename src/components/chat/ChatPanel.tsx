'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Bagaimana cara mengurus sertifikasi BPOM?',
  'Apa langkah pertama untuk mulai ekspor?',
  'Dokumen apa saja yang wajib untuk ekspor?',
];

const CONTEXT_SUGGESTIONS = [
  'Kenapa skor saya seperti ini?',
  'Bagaimana cara memperbaiki gap terbesar saya?',
  'Jelaskan fase pertama roadmap saya.',
];

export function ChatPanel({ assessmentId }: { assessmentId?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || isStreaming) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, assessmentId }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Gagal mendapatkan respon.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: 'assistant', content: assistantText }]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      setMessages([...nextMessages, { role: 'assistant', content: `Maaf, ${message}` }]);
    } finally {
      setIsStreaming(false);
    }
  }

  const suggestions = assessmentId ? CONTEXT_SUGGESTIONS : SUGGESTIONS;

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            aria-label="Buka Konsultan AI"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-4 text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-105 transition-transform font-bold"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Tanya Konsultan AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex h-[70vh] max-h-[600px] w-auto sm:w-[400px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black leading-tight">Konsultan AI</p>
                  <p className="text-[11px] opacity-80 leading-tight">
                    {assessmentId ? 'Paham konteks hasil analisis Anda' : 'Siap bantu pertanyaan ekspor 24/7'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup chat"
                className="rounded-full p-2 hover:bg-white/15 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="rounded-2xl rounded-tl-sm bg-muted p-4 text-sm font-medium text-foreground">
                    Halo! Saya Konsultan AI ExportReady. Tanyakan apa pun seputar ekspor—sertifikasi,
                    dokumen, logistik, atau strategi pasar. 👋
                  </div>
                  <div className="space-y-2">
                    <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Coba tanyakan
                    </p>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="block w-full rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-foreground/90 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl p-4 text-sm font-medium leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm bg-muted text-foreground'
                    )}
                  >
                    {m.content || (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Sedang mengetik...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-border bg-card p-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pertanyaan Anda..."
                className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-primary transition-colors"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming || !input.trim()}
                aria-label="Kirim pesan"
                className="h-11 w-11 rounded-xl bg-primary shrink-0"
              >
                {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
