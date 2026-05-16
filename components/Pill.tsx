import { cn } from '@/lib/utils';

export function Pill({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'discovery' | 'warn';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] tracking-wide uppercase',
        tone === 'default' && 'border-mist text-muted bg-whisper',
        tone === 'discovery' && 'border-discovery/30 text-discovery bg-discovery/5',
        tone === 'warn' && 'border-gold/40 text-gold bg-gold/5',
        className
      )}
    >
      {children}
    </span>
  );
}
