import { EventEmitter } from 'node:events';

type KinEventName =
  | 'note.captured'
  | 'brief.updated'
  | 'draft.ready'
  | 'message.sent'
  | 'guest.replied'
  | 'regenerate.started'
  | 'regenerate.completed';

export type KinEvent = {
  type: KinEventName;
  channel: string;
  data: Record<string, unknown>;
  ts: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __kinBus: EventEmitter | undefined;
}

function getBus(): EventEmitter {
  if (!globalThis.__kinBus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(200);
    globalThis.__kinBus = bus;
  }
  return globalThis.__kinBus;
}

export function publish(event: KinEvent) {
  getBus().emit(event.channel, event);
  getBus().emit('*', event);
}

export function subscribe(channel: string, handler: (event: KinEvent) => void) {
  const bus = getBus();
  bus.on(channel, handler);
  return () => bus.off(channel, handler);
}

export function guestChannel(guestId: string) {
  return `guest-${guestId}`;
}

export function placemakerChannel(slug: string) {
  return `placemaker-${slug}`;
}
