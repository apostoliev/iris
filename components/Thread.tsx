'use client';
import { relativeTime, cn } from '@/lib/utils';

export type ThreadItem =
  | { kind: 'message'; id: string; content: string; at: string; fromName: string; fromSlug: string; fromRole: string }
  | { kind: 'reply'; id: string; content: string; at: string; toName: string; toSlug: string };

export function Thread({
  items,
  perspective,
}: {
  items: ThreadItem[];
  perspective: 'staff' | 'guest';
}) {
  if (!items.length) {
    return (
      <div className="text-sm text-muted italic">No messages yet.</div>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {items.map((it) => {
        const isFromStaff = it.kind === 'message';
        const onLeft = perspective === 'staff' ? !isFromStaff : isFromStaff;
        return (
          <li
            key={it.id}
            className={cn('flex', onLeft ? 'justify-start' : 'justify-end')}
          >
            <div
              className={cn(
                'max-w-[78%] rounded-2xl px-4 py-3',
                onLeft
                  ? 'bg-sandlight text-ink rounded-tl-md'
                  : 'bg-discovery text-cream rounded-tr-md'
              )}
            >
              <div className={cn('text-[10px] uppercase tracking-widest mb-1', onLeft ? 'text-muted' : 'text-cream/70')}>
                {it.kind === 'message' ? it.fromName : 'You'}
                <span className="opacity-70"> · {relativeTime(it.at)}</span>
              </div>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-serif">
                {it.content}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
