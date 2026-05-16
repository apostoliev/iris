'use client';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Mic, X, Keyboard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CaptureModal({
  guestId,
  sourcePlaceMakerId,
  guestName,
  onCaptured,
}: {
  guestId: string;
  sourcePlaceMakerId: string;
  guestName: string;
  onCaptured?: (noteId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'speak' | 'type'>('speak');
  const [typedNote, setTypedNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'speak-loading' | 'speak-error' | 'done'>('idle');
  const [speakError, setSpeakError] = useState<string | null>(null);

  async function submitTyped() {
    if (!typedNote.trim()) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/dictate/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          sourcePlaceMakerId,
          transcript: typedNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'capture failed');
      setStatus('done');
      onCaptured?.(data.noteId);
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
        setTypedNote('');
      }, 400);
    } catch (err) {
      setStatus('idle');
      setSpeakError(err instanceof Error ? err.message : 'unknown');
    }
  }

  async function startSpeak() {
    setStatus('speak-loading');
    setSpeakError(null);
    try {
      const res = await fetch('/api/dictate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, sourcePlaceMakerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'pipecat start failed');
      window.open(data.roomUrl, 'kin-dictation', 'width=520,height=620');
      setStatus('idle');
    } catch (err) {
      setStatus('speak-error');
      setSpeakError(err instanceof Error ? err.message : 'unknown');
      setTab('type');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="button-primary">
          <Mic className="h-4 w-4" /> Capture observation
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-cream p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="font-serif text-2xl text-ink">
                Observation about {guestName.split(' ')[0]}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted mt-1">
                Stored privately as a Raw Note. Maître abstracts it by role before anyone sees it.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rounded-md p-1 text-muted hover:bg-sandlight">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as 'speak' | 'type')}>
            <Tabs.List className="flex gap-1 mb-4 p-1 bg-sandlight rounded-lg">
              <Tabs.Trigger
                value="speak"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-sm transition-colors',
                  tab === 'speak' ? 'bg-cream text-ink shadow-sm' : 'text-muted'
                )}
              >
                <Mic className="h-4 w-4" /> Speak
              </Tabs.Trigger>
              <Tabs.Trigger
                value="type"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-sm transition-colors',
                  tab === 'type' ? 'bg-cream text-ink shadow-sm' : 'text-muted'
                )}
              >
                <Keyboard className="h-4 w-4" /> Type
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="speak" className="flex flex-col items-center gap-4 py-6">
              <button
                type="button"
                onClick={startSpeak}
                disabled={status === 'speak-loading'}
                className="h-16 w-16 rounded-full bg-discovery text-cream flex items-center justify-center hover:bg-discovery2 transition-colors disabled:opacity-50"
              >
                {status === 'speak-loading' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Mic className="h-7 w-7" />
                )}
              </button>
              <p className="text-sm text-muted text-center max-w-xs">
                Opens a private voice session. Speak naturally, even mid-shift. Maître transcribes and structures.
              </p>
              {speakError && (
                <p className="text-xs text-gold text-center">
                  Voice unavailable — quick-type instead ({speakError.slice(0, 80)})
                </p>
              )}
            </Tabs.Content>

            <Tabs.Content value="type">
              <textarea
                value={typedNote}
                onChange={(e) => setTypedNote(e.target.value)}
                placeholder="What did you notice? Speak as you would to a colleague at shift change."
                rows={5}
                autoFocus
                className="w-full resize-y rounded-md border border-mist bg-whisper p-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-discovery/30"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={submitTyped}
                  disabled={!typedNote.trim() || status === 'submitting'}
                  className="button-primary"
                >
                  {status === 'submitting' ? 'Capturing…' : status === 'done' ? 'Captured ✓' : 'Capture'}
                </button>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
