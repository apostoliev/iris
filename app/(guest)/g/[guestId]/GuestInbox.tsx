'use client';
import { useState, useMemo } from 'react';
import { useSse } from '@/lib/use-sse';
import type { ThreadItem } from '@/components/Thread';
import { SmallCaps } from '@/components/iris/SmallCaps';
import { Initials } from '@/components/iris/Initials';
import { cn } from '@/lib/utils';

const DISCOVERY = '#1F4A3A';
const DISCOVERY_DEEP = '#143E2E';
const DISCOVERY_MUTED = '#5C7368';

type PlaceMakerCard = {
  slug: string;
  name: string;
  role: string;
  title?: string | null;
  property: string;
  visits?: number;
  sinceYear?: number | null;
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
  const lastMessage = useMemo(
    () =>
      [...thread]
        .reverse()
        .find((it) => it.kind === 'message') as
        | Extract<ThreadItem, { kind: 'message' }>
        | undefined,
    [thread]
  );
  const [activeMessageId, setActiveMessageId] = useState<string | null>(
    lastMessage?.id ?? null
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(
    lastMessage?.fromSlug ?? null
  );
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'inbox' | 'compose'>('inbox');
  const [composeFresh, setComposeFresh] = useState(false);

  useSse(`guest-${guest.id}`, (event) => {
    if (event.type === 'message.sent' || event.type === 'guest.replied') {
      refreshThread(true);
    }
  });

  async function refreshThread(maybeOpenNew = false) {
    const res = await fetch(`/api/messages/thread/${guest.id}`);
    if (!res.ok) return;
    const data = await res.json();
    const items: ThreadItem[] = data.items ?? [];
    setThread(items);
    if (maybeOpenNew) {
      const latest = [...items]
        .reverse()
        .find((it) => it.kind === 'message') as
        | Extract<ThreadItem, { kind: 'message' }>
        | undefined;
      if (latest && latest.id !== activeMessageId) {
        setActiveMessageId(latest.id);
        setReplyingTo(latest.fromSlug);
        setMode('inbox');
      }
    }
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
        setMode('inbox');
        setComposeFresh(false);
        refreshThread();
      }
    } finally {
      setSending(false);
    }
  }

  function openComposeTo(slug: string) {
    setReplyingTo(slug);
    setComposeFresh(true);
    setMode('compose');
  }

  const activeMessage =
    (thread.find((it) => it.id === activeMessageId) as
      | Extract<ThreadItem, { kind: 'message' }>
      | undefined) ?? lastMessage;
  const sender = activeMessage
    ? placeMakers.find((p) => p.slug === activeMessage.fromSlug)
    : null;
  const composeTarget =
    composeFresh && replyingTo
      ? placeMakers.find((p) => p.slug === replyingTo) ?? null
      : null;
  const guestFirst = guest.name.split(' ')[0];

  if (mode === 'compose') {
    if (composeFresh && composeTarget) {
      return (
        <ComposeScreen
          guestFirst={guestFirst}
          recipient={composeTarget}
          original={null}
          value={replyText}
          onChange={setReplyText}
          onSend={sendReply}
          sending={sending}
          onBack={() => {
            setMode('inbox');
            setComposeFresh(false);
          }}
        />
      );
    }
    if (activeMessage && sender) {
      return (
        <ComposeScreen
          guestFirst={guestFirst}
          recipient={sender}
          original={activeMessage.content}
          value={replyText}
          onChange={setReplyText}
          onSend={sendReply}
          sending={sending}
          onBack={() => setMode('inbox')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Property masthead — Rosewood-first */}
      <header className="px-6 pt-8 pb-5">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col gap-0.5">
            <span
              className="font-serif text-[19px] leading-none"
              style={{ color: DISCOVERY }}
            >
              Rosewood
            </span>
            <SmallCaps size={9} tracking={0.30} color={DISCOVERY_MUTED}>
              Sand Hill
            </SmallCaps>
          </div>
          <SmallCaps size={9} tracking={0.30} color={DISCOVERY_MUTED}>
            {guestFirst}&apos;s circle
          </SmallCaps>
        </div>
      </header>

      <Divider />

      {/* The postcard — the latest thing someone sent you */}
      {activeMessage && sender ? (
        <Postcard
          guestFirst={guestFirst}
          sender={sender}
          at={activeMessage.at}
          content={activeMessage.content}
          onReply={() => setMode('compose')}
        />
      ) : (
        <section className="px-6 pt-9 pb-7">
          <p
            className="font-serif text-[24px] leading-[1.25] max-w-[28ch]"
            style={{ color: DISCOVERY_DEEP }}
          >
            Welcome back, {guestFirst}.
          </p>
          <p className="font-serif text-[15.5px] text-inkFaint italic mt-3 max-w-[36ch]">
            The people here who know you are below. Tap anyone to write.
          </p>
        </section>
      )}

      <Divider />

      {/* Your circle — the private network */}
      <section className="px-6 pt-7 pb-8">
        <div className="flex items-baseline justify-between">
          <SmallCaps tracking={0.30} color={DISCOVERY}>
            Your circle
          </SmallCaps>
          <SmallCaps size={9} tracking={0.22} color={DISCOVERY_MUTED}>
            {placeMakers.length}{' '}
            {placeMakers.length === 1 ? 'person' : 'people'}
          </SmallCaps>
        </div>
        <p className="font-serif text-[15px] text-inkFaint italic mt-2 max-w-[36ch]">
          The people at Sand Hill who know you, {guestFirst}.
          {placeMakers.length > 1 && ' Tap anyone to write.'}
        </p>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {placeMakers.map((pm) => {
            const meta = circleMeta(pm);
            return (
              <button
                type="button"
                key={pm.slug}
                onClick={() => openComposeTo(pm.slug)}
                className="person-card flex-shrink-0 w-[112px] flex flex-col items-center gap-2 px-3 py-4 text-center"
              >
                <Initials name={pm.name} size={56} tone="discoverySoft" />
                <span className="font-serif text-[15.5px] text-ink leading-tight mt-0.5">
                  {pm.name.split(' ')[0]}
                </span>
                <SmallCaps size={8.5} tracking={0.22} color={DISCOVERY_MUTED}>
                  {pm.title ?? pm.role.replace('_', ' ')}
                </SmallCaps>
                {meta && (
                  <SmallCaps size={8} tracking={0.22} color="#B5B0A8">
                    {meta}
                  </SmallCaps>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* Recent thread */}
      <section className="px-6 pt-7 pb-8 flex-1">
        <SmallCaps tracking={0.30} color={DISCOVERY}>
          Recent
        </SmallCaps>
        <ul className="mt-4 flex flex-col">
          {thread.length === 0 && (
            <li className="font-serif text-[15px] italic text-stone py-4">
              No messages yet.
            </li>
          )}
          {[...thread].reverse().map((it, idx) => {
            const isMessage = it.kind === 'message';
            const isActive = isMessage && it.id === activeMessageId;
            const partyName = isMessage ? it.fromName : it.toName;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (isMessage) {
                      setActiveMessageId(it.id);
                      setReplyingTo(it.fromSlug);
                    } else {
                      // Tapping a reply = re-open composer to same recipient
                      openComposeTo(it.toSlug);
                    }
                  }}
                  className={cn(
                    'w-full text-left grid grid-cols-[44px_1fr_auto] gap-3 items-center py-4 transition-colors',
                    idx > 0 && 'border-t border-hairSoft',
                    isActive ? 'bg-paperLight' : 'hover:bg-paperLight'
                  )}
                  style={
                    isActive
                      ? { boxShadow: `inset 2px 0 0 ${DISCOVERY}` }
                      : undefined
                  }
                >
                  <Initials
                    name={partyName}
                    size={40}
                    tone={isMessage ? 'discoverySoft' : 'paper'}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-serif text-[16px] text-ink leading-tight">
                      {isMessage ? partyName : `You wrote to ${partyName}`}
                    </span>
                    <span className="font-serif text-[14px] text-inkFaint truncate italic">
                      {it.content.split('\n')[0]}
                    </span>
                  </div>
                  <SmallCaps
                    size={9}
                    tracking={0.22}
                    color={DISCOVERY_MUTED}
                  >
                    {formatShort(it.at)}
                  </SmallCaps>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer
        className="border-t py-5 text-center"
        style={{ borderColor: 'rgba(31, 74, 58, 0.14)' }}
      >
        <SmallCaps size={9} tracking={0.30} color={DISCOVERY_MUTED}>
          A private network · between you and the people who serve you here
        </SmallCaps>
      </footer>
    </div>
  );
}

/* ─── Postcard — the latest message, treated as a letter ─────── */

function Postcard({
  guestFirst,
  sender,
  at,
  content,
  onReply,
}: {
  guestFirst: string;
  sender: PlaceMakerCard;
  at: string;
  content: string;
  onReply: () => void;
}) {
  const date = new Date(at);
  const day = date.toLocaleString('en-US', { weekday: 'long' });
  const clock = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const senderFirst = sender.name.split(' ')[0];
  const lines = content.split('\n').filter(Boolean);

  return (
    <section className="px-5 pt-7 pb-2">
      <article className="postcard px-7 pt-6 pb-7 flex flex-col gap-5">
        {/* Date strip */}
        <div className="flex items-center justify-between">
          <SmallCaps size={9.5} tracking={0.30} color={DISCOVERY}>
            {day}
          </SmallCaps>
          <SmallCaps size={9.5} tracking={0.22} color={DISCOVERY_MUTED}>
            {clock}
          </SmallCaps>
        </div>

        {/* Body */}
        <div className="font-serif text-inkSoft">
          <p className="text-[20px] leading-[1.3] mb-3">{guestFirst} —</p>
          <div className="text-[16.5px] leading-[1.65] flex flex-col gap-2.5">
            {lines.map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Sender */}
        <div
          className="pt-5 mt-1 flex items-center gap-3"
          style={{ borderTop: '1px solid rgba(31, 74, 58, 0.16)' }}
        >
          <Initials name={sender.name} size={42} tone="discovery" />
          <div className="flex flex-col">
            <span
              className="font-serif text-[16px] leading-tight"
              style={{ color: DISCOVERY_DEEP }}
            >
              {sender.name}
            </span>
            <SmallCaps size={9} tracking={0.22} color={DISCOVERY_MUTED}>
              {sender.title ?? sender.role.replace('_', ' ')} ·{' '}
              {sender.property}
            </SmallCaps>
          </div>
        </div>
      </article>

      <div className="px-2 mt-5 mb-2">
        <button
          type="button"
          onClick={onReply}
          className="button-primary w-full"
        >
          Reply to {senderFirst}
        </button>
      </div>
    </section>
  );
}

/* ─── Compose / reply screen ─────────────────────────────────── */

function ComposeScreen({
  guestFirst,
  recipient,
  original,
  value,
  onChange,
  onSend,
  sending,
  onBack,
}: {
  guestFirst: string;
  recipient: PlaceMakerCard;
  original: string | null;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  onBack: () => void;
}) {
  const recipientFirst = recipient.name.split(' ')[0];
  const isFresh = original === null;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header
        className="px-6 pt-8 pb-4 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(31, 74, 58, 0.14)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1 -mx-2"
        >
          <SmallCaps tracking={0.22} color={DISCOVERY}>
            ← back
          </SmallCaps>
        </button>
        <SmallCaps tracking={0.30} color={DISCOVERY}>
          {isFresh ? 'Write' : 'Reply'}
        </SmallCaps>
        <div className="w-12" />
      </header>

      <div className="px-6 pt-7 pb-4 flex-1 flex flex-col gap-6">
        {/* Recipient identity — the visual anchor of the screen */}
        <section className="flex items-center gap-4">
          <Initials name={recipient.name} size={56} tone="discovery" />
          <div className="flex flex-col gap-0.5">
            <SmallCaps size={9} tracking={0.30} color={DISCOVERY_MUTED}>
              {isFresh ? 'To' : 'In reply to'}
            </SmallCaps>
            <span
              className="font-serif text-[22px] leading-tight"
              style={{ color: DISCOVERY_DEEP }}
            >
              {recipient.name}
            </span>
            <SmallCaps size={9} tracking={0.22} color={DISCOVERY_MUTED}>
              {recipient.title ?? recipient.role.replace('_', ' ')} ·{' '}
              {recipient.property}
            </SmallCaps>
          </div>
        </section>

        {/* Quoted original — only when replying */}
        {!isFresh && original && (
          <div
            className="px-5 py-4"
            style={{
              borderLeft: `2px solid ${DISCOVERY}`,
              background: 'rgba(31, 74, 58, 0.03)',
            }}
          >
            <SmallCaps size={9} tracking={0.22} color={DISCOVERY_MUTED}>
              {recipient.name.split(' ')[0]} wrote
            </SmallCaps>
            <p className="font-serif text-[15px] leading-[1.6] text-inkFaint mt-2 italic whitespace-pre-wrap">
              {original}
            </p>
          </div>
        )}

        {/* The letter — paper-like input area */}
        <div
          className="flex-1 flex flex-col px-5 py-4 min-h-[200px]"
          style={{
            background: '#FAF8F3',
            border: '1px solid rgba(26, 26, 26, 0.06)',
            borderRadius: 3,
          }}
        >
          <SmallCaps size={9} tracking={0.22} color={DISCOVERY_MUTED}>
            From {guestFirst}
          </SmallCaps>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isFresh
                ? `Hi ${recipientFirst}, …`
                : `Write to ${recipientFirst}…`
            }
            rows={8}
            autoFocus
            className="flex-1 w-full mt-3 resize-none bg-transparent font-serif text-[18px] leading-[1.55] text-inkSoft placeholder:italic placeholder:text-stoneLight focus:outline-none"
          />
        </div>
      </div>

      <footer
        className="border-t px-6 py-4"
        style={{ borderColor: 'rgba(31, 74, 58, 0.14)' }}
      >
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !value.trim()}
          className="button-primary w-full"
        >
          {sending ? 'Sending…' : `Send to ${recipientFirst} →`}
        </button>
      </footer>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function Divider() {
  return (
    <div
      className="mx-6"
      style={{ height: 1, background: 'rgba(31, 74, 58, 0.10)' }}
    />
  );
}

function circleMeta(pm: PlaceMakerCard): string | null {
  const parts: string[] = [];
  if (pm.visits && pm.visits > 0) {
    parts.push(`${pm.visits} ${pm.visits === 1 ? 'stay' : 'stays'}`);
  }
  if (pm.sinceYear) parts.push(`since ${pm.sinceYear}`);
  return parts.length ? parts.join(' · ') : null;
}

function formatShort(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}
