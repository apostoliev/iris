'use client';
import { useState } from 'react';
import { useSse } from '@/lib/use-sse';
import { Thread, type ThreadItem } from '@/components/Thread';
import { Send } from 'lucide-react';

type PlaceMakerCard = {
  slug: string;
  name: string;
  role: string;
  title?: string | null;
  property: string;
};

export function GuestInbox({
  guest,
  placeMakers,
  initialThread,
}: {
  guest: { id: string; name: string };
  placeMakers: PlaceMakerCard[];
  initialThread: ThreadItem[];
}) {
  const [thread, setThread] = useState(initialThread);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(
    initialThread.findLast?.((it) => it.kind === 'message')?.fromSlug ?? null
  );
  const [sending, setSending] = useState(false);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'message.sent' || event.type === 'guest.replied') {
      refreshThread();
    }
  });

  async function refreshThread() {
    const res = await fetch(`/api/messages/thread/${guest.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.items ?? []);
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guest.id,
          content: replyText.trim(),
          toPlaceMakerSlug: replyingTo ?? undefined,
        }),
      });
      if (res.ok) {
        setReplyText('');
        refreshThread();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-mist bg-cream/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-1">
            Kin · for {guest.name.split(' ')[0]}
          </div>
          <h1 className="font-serif text-3xl text-ink">A few people who know you here.</h1>
        </div>
      </header>

      <section className="mx-auto max-w-2xl w-full px-6 pt-6">
        <h2 className="text-xs uppercase tracking-[0.3em] text-muted mb-3">Your circle at Rosewood Sand Hill</h2>
        <div className="flex gap-2 flex-wrap">
          {placeMakers.map((pm) => (
            <button
              key={pm.slug}
              onClick={() => setReplyingTo(pm.slug)}
              className={`card px-3 py-2 text-left transition-colors ${
                replyingTo === pm.slug ? 'border-discovery/60 bg-discovery/5' : 'hover:bg-sandlight'
              }`}
            >
              <div className="font-serif text-base text-ink leading-tight">{pm.name}</div>
              <div className="text-[11px] text-muted uppercase tracking-wide">
                {pm.title ?? pm.role.replace('_', ' ')}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl w-full px-6 py-8 flex-1">
        <h2 className="text-xs uppercase tracking-[0.3em] text-muted mb-3">Thread</h2>
        <Thread items={thread} perspective="guest" />
      </section>

      <footer className="border-t border-mist bg-whisper sticky bottom-0">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-end gap-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
            placeholder={
              replyingTo
                ? `Reply to ${placeMakers.find((p) => p.slug === replyingTo)?.name.split(' ')[0] ?? ''}…`
                : 'Choose someone in your circle to reply to.'
            }
            rows={1}
            className="flex-1 resize-none rounded-lg border border-mist bg-cream px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-discovery/30 max-h-32"
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={sending || !replyText.trim() || !replyingTo}
            className="button-primary disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
