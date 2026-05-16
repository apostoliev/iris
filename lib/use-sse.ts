'use client';
import { useEffect, useRef } from 'react';

type StreamEvent = { type: string; channel: string; data: Record<string, any>; ts: number };
type Handler = (event: StreamEvent) => void;

const EVENT_TYPES = [
  'note.captured',
  'brief.updated',
  'draft.ready',
  'message.sent',
  'guest.replied',
  'regenerate.started',
  'regenerate.completed',
];

export function useSse(channel: string | null, onEvent: Handler) {
  const ref = useRef(onEvent);
  ref.current = onEvent;

  useEffect(() => {
    if (!channel) return;
    const source = new EventSource(`/api/stream/${encodeURIComponent(channel)}`);
    const handler = (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        ref.current(parsed);
      } catch {
        /* malformed event */
      }
    };
    EVENT_TYPES.forEach((t) => source.addEventListener(t, handler as EventListener));
    return () => {
      EVENT_TYPES.forEach((t) => source.removeEventListener(t, handler as EventListener));
      source.close();
    };
  }, [channel]);
}
