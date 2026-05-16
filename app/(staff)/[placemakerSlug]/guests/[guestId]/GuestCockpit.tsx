'use client';
import { useEffect, useState } from 'react';
import { Pill } from '@/components/Pill';
import { BriefTrio, type BriefForDisplay } from '@/components/BriefTrio';
import { DraftCard, type DraftCardData } from '@/components/DraftCard';
import { Thread, type ThreadItem } from '@/components/Thread';
import { CaptureModal } from '@/components/CaptureModal';
import { useSse } from '@/lib/use-sse';
import { Loader2, Sparkles } from 'lucide-react';

type Guest = {
  id: string;
  name: string;
  partnerName?: string | null;
  anniversary?: string | null;
  origin?: string | null;
  interestTags: string[];
  notes?: string | null;
};

export function GuestCockpit({
  placeMakerId,
  placeMakerName,
  guest,
  initialBriefs,
  initialDraft,
  initialThread,
}: {
  placeMakerId: string;
  placeMakerName: string;
  guest: Guest;
  initialBriefs: BriefForDisplay[];
  initialDraft: DraftCardData | null;
  initialThread: ThreadItem[];
}) {
  const [briefs, setBriefs] = useState(initialBriefs);
  const [draft, setDraft] = useState<DraftCardData | null>(initialDraft);
  const [thread, setThread] = useState<ThreadItem[]>(initialThread);
  const [freshBriefIds, setFreshBriefIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'note.captured') {
      setWorking(true);
      setFlash('Maître is fanning the brief across roles…');
    }
    if (event.type === 'regenerate.started') {
      setWorking(true);
    }
    if (event.type === 'brief.updated') {
      refreshBriefs();
    }
    if (event.type === 'draft.ready') {
      refreshDraft();
      setWorking(false);
      setFlash(null);
    }
    if (event.type === 'message.sent') {
      refreshThread();
    }
    if (event.type === 'guest.replied') {
      refreshThread();
      setFlash(`New reply from ${guest.name.split(' ')[0]}.`);
      setTimeout(() => setFlash(null), 4000);
    }
  });

  async function refreshBriefs() {
    const res = await fetch(`/api/guests/${guest.id}/briefs`);
    if (!res.ok) return;
    const data = await res.json();
    const incoming: BriefForDisplay[] = data.briefs ?? [];
    const previousIds = new Set(briefs.map((b) => b.id));
    const fresh = new Set(incoming.filter((b) => !previousIds.has(b.id)).map((b) => b.id));
    setFreshBriefIds(fresh);
    setBriefs(incoming);
    setTimeout(() => setFreshBriefIds(new Set()), 5000);
  }

  async function refreshDraft() {
    const res = await fetch(`/api/guests/${guest.id}/draft?placeMakerId=${placeMakerId}`);
    if (!res.ok) return;
    const data = await res.json();
    setDraft(data.draft ?? null);
  }

  async function refreshThread() {
    const res = await fetch(`/api/messages/thread/${guest.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.items ?? []);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      <aside className="flex flex-col gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted">Guest</div>
          <h1 className="font-serif text-4xl text-ink leading-tight mt-1">{guest.name}</h1>
          {guest.origin && (
            <div className="text-sm text-muted mt-1">{guest.origin}</div>
          )}
        </div>
        <div className="flex flex-col gap-3 text-sm">
          {guest.partnerName && (
            <Row label="Partner">{guest.partnerName}</Row>
          )}
          {guest.anniversary && (
            <Row label="Anniversary">{guest.anniversary}</Row>
          )}
          {guest.interestTags.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted mb-1.5">
                Preferences
              </div>
              <div className="flex flex-wrap gap-1.5">
                {guest.interestTags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            </div>
          )}
          {guest.notes && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted mb-1.5">
                Notes
              </div>
              <p className="font-serif text-[15px] leading-relaxed text-ink/80">
                {guest.notes}
              </p>
            </div>
          )}
        </div>
        <CaptureModal
          guestId={guest.id}
          sourcePlaceMakerId={placeMakerId}
          guestName={guest.name}
        />
      </aside>

      <div className="flex flex-col gap-8">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-3xl text-ink">Briefs by role</h2>
            <div className="flex items-center gap-2">
              {working && (
                <span className="inline-flex items-center gap-1.5 text-xs text-discovery">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Maître is thinking
                </span>
              )}
              {flash && !working && (
                <span className="inline-flex items-center gap-1.5 text-xs text-discovery animate-fade-in-up">
                  <Sparkles className="h-3.5 w-3.5" /> {flash}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted mb-4 max-w-2xl">
            Same observation. Different role, different abstraction. The discretion filter routes only what each person needs to know.
          </p>
          <BriefTrio briefs={briefs} freshIds={freshBriefIds} />
        </section>

        <section>
          <h2 className="font-serif text-3xl text-ink mb-3">Drafted in your voice</h2>
          <DraftCard
            draft={draft}
            onSent={() => {
              refreshThread();
            }}
          />
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-3xl text-ink">Your thread with {guest.name.split(' ')[0]}</h2>
            <a
              href={`/g/${guest.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted hover:text-discovery"
            >
              open guest view ↗
            </a>
          </div>
          <Thread items={thread} perspective="staff" />
        </section>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted mb-0.5">{label}</div>
      <div className="text-ink">{children}</div>
    </div>
  );
}
