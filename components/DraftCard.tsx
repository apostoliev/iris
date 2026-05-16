'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Pill } from './Pill';

export type DraftCardData = {
  id: string;
  content: string;
  status: string;
  from: { name: string; slug: string; role: string };
  intent?: string | null;
};

export function DraftCard({
  draft,
  onSent,
}: {
  draft: DraftCardData | null;
  onSent?: (info: { messageId: string; smsSent: boolean }) => void;
}) {
  const [content, setContent] = useState(draft?.content ?? '');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    draft?.status === 'sent' ? 'sent' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (draft) {
      setContent(draft.content);
      setStatus(draft.status === 'sent' ? 'sent' : 'idle');
    }
  }, [draft?.id, draft?.content, draft?.status]);

  if (!draft) {
    return (
      <div className="card p-6 text-sm text-muted italic">
        A draft will appear here once a note is captured.
      </div>
    );
  }

  async function approve() {
    if (!draft) return;
    setStatus('sending');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/messages/${draft.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'send failed');
      }
      setStatus('sent');
      onSent?.({ messageId: data.messageId, smsSent: !!data.sms?.sid });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'unknown');
    }
  }

  return (
    <div className={cn('card p-6 flex flex-col gap-4', status === 'sent' && 'opacity-90')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Draft for approval</div>
          <div className="font-serif text-xl text-ink mt-0.5">
            From {draft.from.name.split(' ')[0]} — in their voice
          </div>
        </div>
        <Pill tone="discovery">{status === 'sent' ? 'sent' : 'draft'}</Pill>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={status === 'sending' || status === 'sent'}
        rows={Math.max(4, content.split('\n').length + 1)}
        className="w-full resize-y rounded-md border border-mist bg-cream/40 p-4 font-serif text-lg leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-discovery/30"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          One tap sends as SMS + opens an in-app thread.
        </span>
        <div className="flex items-center gap-2">
          {errorMessage && (
            <span className="text-xs text-gold">{errorMessage}</span>
          )}
          <button
            type="button"
            onClick={approve}
            disabled={status !== 'idle'}
            className="button-primary"
          >
            {status === 'sending'
              ? 'Sending…'
              : status === 'sent'
                ? 'Sent ✓'
                : 'Approve & send'}
          </button>
        </div>
      </div>
    </div>
  );
}
