import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Pill } from '@/components/Pill';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StaffDashboard({
  params,
}: {
  params: Promise<{ placemakerSlug: string }>;
}) {
  const { placemakerSlug } = await params;
  const placeMaker = await prisma.placeMaker.findUnique({
    where: { slug: placemakerSlug },
  });
  if (!placeMaker) notFound();

  const relationships = await prisma.relationshipRecord.findMany({
    where: { placeMakerId: placeMaker.id },
    include: {
      guest: {
        include: {
          briefs: {
            where: { recipientPlaceMakerId: placeMaker.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { lastSeenAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-10">
      <section>
        <div className="text-xs uppercase tracking-[0.3em] text-muted mb-2">
          {placeMaker.title ?? placeMaker.role.replace('_', ' ')}
        </div>
        <h1 className="font-serif text-5xl text-ink leading-tight">
          Good morning, {placeMaker.name.split(' ')[0]}.
        </h1>
        <p className="font-serif text-xl text-muted mt-3 max-w-xl">
          A few of your people are within reach. Here's what to hold in mind.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-3xl text-ink">Your circle</h2>
          <span className="text-xs text-muted">{relationships.length} guests</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationships.map((rel) => {
            const guest = rel.guest;
            const latestBrief = guest.briefs[0];
            return (
              <Link
                key={guest.id}
                href={`/${placemakerSlug}/guests/${guest.id}`}
                className="card p-5 flex flex-col gap-3 hover:border-discovery/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-serif text-2xl text-ink leading-tight">
                      {guest.name}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {rel.visits} visits · last seen {rel.lastSeenAt ? relativeTime(rel.lastSeenAt) : '—'}
                    </div>
                  </div>
                </div>
                {rel.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rel.themes.slice(0, 3).map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </div>
                )}
                {latestBrief ? (
                  <p className="text-sm text-ink/80 leading-relaxed line-clamp-3 font-serif">
                    {latestBrief.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted italic">No brief yet.</p>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
