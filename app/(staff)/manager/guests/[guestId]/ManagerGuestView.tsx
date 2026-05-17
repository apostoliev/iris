'use client';
import { useState } from 'react';
import { BriefTrio, type BriefForDisplay } from '@/components/BriefTrio';
import { Thread, type ThreadItem } from '@/components/Thread';
import { CaptureModal } from '@/components/CaptureModal';
import { useSse } from '@/lib/use-sse';
import { Loader2 } from 'lucide-react';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { MaitreMark } from '@/components/iris/Marks';
import { StatusDot } from '@/components/iris/StatusDot';

type Guest = {
  id: string;
  name: string;
  partnerName?: string | null;
  anniversary?: string | null;
  origin?: string | null;
  interestTags: string[];
  notes?: string | null;
  stayState?: string | null;
  arrivalAt?: string | null;
  visitCount?: number | null;
};

type DraftRow = {
  id: string;
  content: string;
  status: string;
  intent?: string | null;
  from: { name: string; slug: string; role: string };
};

type Observation = {
  id: string;
  content: string;
  createdAt: string;
  sensitivity: string;
  sourceName: string;
  sourceRole: string;
};

export function ManagerGuestView({
  carolId,
  guest,
  latestObservation,
  initialBriefs,
  initialDrafts,
  initialThread,
}: {
  carolId: string;
  guest: Guest;
  latestObservation: Observation | null;
  initialBriefs: BriefForDisplay[];
  initialDrafts: DraftRow[];
  initialThread: ThreadItem[];
}) {
  const [briefs, setBriefs] = useState(initialBriefs);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [thread, setThread] = useState<ThreadItem[]>(initialThread);
  const [freshBriefIds, setFreshBriefIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'note.captured') {
      setWorking(true);
      setFlash('Iris is fanning the brief across the team…');
    }
    if (event.type === 'regenerate.started') {
      setWorking(true);
    }
    if (event.type === 'brief.updated') {
      refreshBriefs();
    }
    if (event.type === 'draft.ready') {
      refreshDrafts();
      setWorking(false);
      setFlash(null);
    }
    if (event.type === 'message.sent') {
      refreshThread();
      refreshDrafts();
    }
    if (event.type === 'guest.replied') {
      refreshThread();
    }
  });

  async function refreshBriefs() {
    const res = await fetch(
      `/api/guests/${guest.id}/briefs?excludeRole=manager`
    );
    if (!res.ok) return;
    const data = await res.json();
    const incoming: BriefForDisplay[] = data.briefs ?? [];
    const previousIds = new Set(briefs.map((b) => b.id));
    const fresh = new Set(
      incoming.filter((b) => !previousIds.has(b.id)).map((b) => b.id)
    );
    setFreshBriefIds(fresh);
    setBriefs(incoming);
    setTimeout(() => setFreshBriefIds(new Set()), 6000);
  }

  async function refreshDrafts() {
    const res = await fetch(`/api/guests/${guest.id}/drafts`);
    if (!res.ok) return;
    const data = await res.json();
    setDrafts(data.drafts ?? []);
  }

  async function refreshThread() {
    const res = await fetch(`/api/messages/thread/${guest.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.items ?? []);
  }

  const firstName = guest.name.split(' ')[0];
  const stayBadge =
    guest.stayState === 'on_property'
      ? 'On property tonight'
      : guest.stayState === 'upcoming'
        ? 'Booked · upcoming'
        : 'Past · between stays';

  const observationAt = latestObservation
    ? new Date(latestObservation.createdAt).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
      {/* Profile sidebar */}
      <aside className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <SmallCaps tracking={0.3}>Guest · oversight view</SmallCaps>
          <div className="flex items-center gap-4">
            <Initials name={guest.name} size={64} tone="dark" />
            <div className="flex flex-col">
              <h1 className="font-serif text-[32px] text-ink leading-[1.05]">
                {firstName}.
              </h1>
              <span className="font-serif text-[15px] text-inkFaint italic">
                {guest.name.split(' ').slice(1).join(' ')}
              </span>
            </div>
          </div>
          <SmallCaps size={10} tracking={0.22}>
            {stayBadge}
            {guest.visitCount ? ` · ${guest.visitCount} visits` : ''}
          </SmallCaps>
        </div>

        <div className="hairline" />

        <div className="flex flex-col gap-4 text-[13.5px]">
          {guest.origin && <Row label="Origin">{guest.origin}</Row>}
          {guest.partnerName && <Row label="Partner">{guest.partnerName}</Row>}
          {guest.anniversary && <Row label="Anniversary">{guest.anniversary}</Row>}
          {guest.interestTags.length > 0 && (
            <div>
              <SmallCaps size={9.5} tracking={0.22}>
                The cellar remembers
              </SmallCaps>
              <ul className="mt-2 flex flex-col gap-1.5">
                {guest.interestTags.map((t) => (
                  <li
                    key={t}
                    className="font-serif text-[14.5px] text-inkSoft italic"
                  >
                    — {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guest.notes && (
            <div>
              <SmallCaps size={9.5} tracking={0.22}>
                Notes
              </SmallCaps>
              <p className="font-serif text-[15px] leading-[1.55] text-inkFaint mt-2">
                {guest.notes}
              </p>
            </div>
          )}
        </div>

        <div className="hairline" />

        <CaptureModal
          guestId={guest.id}
          sourcePlaceMakerId={carolId}
          guestName={guest.name}
        />
      </aside>

      {/* Main column */}
      <div className="flex flex-col gap-14">
        {/* Latest observation banner */}
        {latestObservation && (
          <section>
            <SmallCaps tracking={0.3}>
              Latest observation · {observationAt}
            </SmallCaps>
            <div
              className="card px-6 py-5 mt-3 max-w-3xl"
              style={{
                borderLeft:
                  latestObservation.sensitivity === 'high'
                    ? '2px solid #a8945a'
                    : '2px solid #D8D3CB',
              }}
            >
              <SmallCaps size={9.5} tracking={0.22}>
                Captured by {latestObservation.sourceName} ·{' '}
                {latestObservation.sourceRole.replace('_', ' ')}
              </SmallCaps>
              <p className="font-serif text-[15.5px] leading-[1.6] text-inkSoft italic mt-2 whitespace-pre-wrap">
                &ldquo;{latestObservation.content}&rdquo;
              </p>
              {latestObservation.sensitivity === 'high' && (
                <SmallCaps
                  size={9}
                  tracking={0.22}
                  color="#a8945a"
                  className="mt-3 inline-block"
                >
                  held in confidence · raw text not relayed to the team
                </SmallCaps>
              )}
            </div>
          </section>
        )}

        {/* Aggregate briefs — manager's privilege */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <SmallCaps tracking={0.3}>Briefs across the team</SmallCaps>
            <div className="flex items-center gap-2">
              {working && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-discovery uppercase tracking-[0.22em]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Iris is reshaping…
                </span>
              )}
              {flash && !working && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-discovery uppercase tracking-[0.22em] animate-fade-in-up">
                  {flash}
                </span>
              )}
            </div>
          </div>
          <h2 className="font-serif text-[26px] text-ink mb-2">
            Same observation, different shape.
          </h2>
          <p className="font-serif text-[15.5px] text-inkFaint italic mb-5 max-w-2xl">
            Each person on the floor sees only their brief. This view is yours
            alone — the whole shape of how the network is carrying {firstName}{' '}
            this week.
          </p>
          <BriefTrio briefs={briefs} freshIds={freshBriefIds} />
          <div className="flex items-center gap-2 mt-4">
            <MaitreMark size={12} />
            <SmallCaps size={9.5} tracking={0.22}>
              Maître routes role-by-role. You see all four — they each see only
              their own.
            </SmallCaps>
          </div>
        </section>

        {/* Pending drafts across the team — read-only oversight */}
        <section>
          <SmallCaps tracking={0.3} className="mb-2 block">
            Drafts in flight
          </SmallCaps>
          <h2 className="font-serif text-[26px] text-ink mb-5">
            Notes the team is about to send.
          </h2>
          {drafts.length === 0 ? (
            <div className="card p-8 text-center text-stone text-[14px] italic font-serif max-w-3xl">
              No drafts pending across the team.
            </div>
          ) : (
            <ul className="flex flex-col gap-4 max-w-3xl">
              {drafts.map((d) => (
                <li
                  key={d.id}
                  className="card px-6 py-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Initials name={d.from.name} size={36} tone="paper" />
                    <div className="flex flex-col">
                      <span className="font-serif text-[17px] text-ink leading-tight">
                        {d.from.name}
                      </span>
                      <SmallCaps size={9.5} tracking={0.22}>
                        {d.from.role.replace('_', ' ')} · drafted for{' '}
                        {firstName}
                      </SmallCaps>
                    </div>
                    <span className="ml-auto flex items-center gap-1.5">
                      <StatusDot status="pending" />
                      <SmallCaps size={9} tracking={0.22}>
                        awaiting {d.from.name.split(' ')[0]}&apos;s approval
                      </SmallCaps>
                    </span>
                  </div>
                  <p className="font-serif text-[16px] leading-[1.55] text-inkSoft whitespace-pre-wrap">
                    {d.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 mt-4">
            <SmallCaps size={9.5} tracking={0.22} color="#B5B0A8">
              read-only · the staff member who drafted it approves and sends
            </SmallCaps>
          </div>
        </section>

        {/* Thread */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <SmallCaps tracking={0.3}>Thread with {firstName}</SmallCaps>
            <a
              href={`/g/${guest.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.22em] text-stone hover:text-discovery"
            >
              Open guest view ↗
            </a>
          </div>
          <Thread items={thread} perspective="staff" />
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SmallCaps size={9.5} tracking={0.22}>
        {label}
      </SmallCaps>
      <div className="font-serif text-[15.5px] text-inkSoft mt-1">
        {children}
      </div>
    </div>
  );
}
