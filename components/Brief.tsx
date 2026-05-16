'use client';
import { useRef, useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Pill } from './Pill';
import { cn } from '@/lib/utils';

type BriefRecipient = {
  name: string;
  role: string;
  title?: string | null;
};

export function Brief({
  id,
  recipient,
  content,
  sensitivity,
  fresh,
  className,
}: {
  id?: string;
  recipient: BriefRecipient;
  content: string;
  sensitivity: string;
  fresh?: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');

  async function togglePlay() {
    if (!id) return;
    if (audioState === 'playing') {
      audioRef.current?.pause();
      setAudioState('idle');
      return;
    }
    setAudioState('loading');
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(`/api/briefs/${id}/audio`);
        audioRef.current.addEventListener('ended', () => setAudioState('idle'));
        audioRef.current.addEventListener('error', () => setAudioState('error'));
      }
      await audioRef.current.play();
      setAudioState('playing');
    } catch {
      setAudioState('error');
    }
  }

  return (
    <div
      className={cn(
        'card p-5 flex flex-col gap-3 min-h-[200px]',
        fresh && 'animate-fade-in-up ring-1 ring-discovery/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">
            {roleLabel(recipient.role)}
          </div>
          <div className="font-serif text-2xl text-ink leading-tight mt-0.5">
            {recipient.name.split(' ')[0]}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={sensitivity === 'high' ? 'warn' : sensitivity === 'low' ? 'default' : 'discovery'}>
            {sensitivity}
          </Pill>
          {id && (
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-full border border-mist bg-whisper p-1.5 text-discovery hover:bg-sandlight transition-colors"
              title="Play aloud"
              aria-label="Play aloud"
            >
              {audioState === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : audioState === 'playing' ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-ink/90 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

function roleLabel(role: string) {
  return role.replace('_', ' ');
}
