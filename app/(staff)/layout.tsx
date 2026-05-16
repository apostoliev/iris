import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PersonaSwitcher } from '@/components/PersonaSwitcher';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const placeMakers = await prisma.placeMaker.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-mist bg-cream/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-baseline gap-3 group">
            <span className="font-serif text-3xl text-ink leading-none">Kin</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted">
              Rosewood · Sand Hill
            </span>
          </Link>
          <PersonaSwitcher
            options={placeMakers.map((p) => ({
              slug: p.slug,
              name: p.name,
              role: p.role,
              title: p.title,
            }))}
          />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-mist py-4 text-center text-xs text-muted">
        Demo mode — auth disabled. The system that lets the people scale.
      </footer>
    </div>
  );
}
