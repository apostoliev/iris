'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type PersonaOption = {
  slug: string;
  name: string;
  role: string;
  title: string | null;
};

export function PersonaSwitcher({ options }: { options: PersonaOption[] }) {
  const pathname = usePathname();
  const activeSlug = pathname.split('/').filter(Boolean)[0] ?? null;
  return (
    <div className="flex items-center gap-1 rounded-full border border-mist bg-whisper p-1">
      {options.map((opt) => {
        const active = opt.slug === activeSlug;
        const href = `/${opt.slug}`;
        return (
          <Link
            key={opt.slug}
            href={href}
            className={cn(
              'rounded-full px-3 py-1 text-xs transition-colors',
              active
                ? 'bg-discovery text-cream'
                : 'text-muted hover:bg-sandlight hover:text-ink'
            )}
          >
            <span className="font-medium tracking-wide">{opt.name.split(' ')[0]}</span>
            <span className="ml-1.5 opacity-70">· {roleLabel(opt.role)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function roleLabel(role: string) {
  return role.replace('_', ' ');
}
