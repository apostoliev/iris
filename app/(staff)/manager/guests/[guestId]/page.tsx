import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ManagerGuestView } from './ManagerGuestView';

export const dynamic = 'force-dynamic';

export default async function ManagerGuestPage({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  const { guestId } = await params;

  const carol = await prisma.placeMaker.findUnique({ where: { slug: 'carol' } });

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      relationships: { include: { placeMaker: true } },
    },
  });
  if (!guest || !carol) notFound();

  const latestRawNote = await prisma.rawNote.findFirst({
    where: { guestId },
    orderBy: { createdAt: 'desc' },
    include: { source: true },
  });

  // Manager sees every staff brief from the latest observation,
  // EXCEPT her own (she's the viewer, not a node on the floor).
  const briefs = latestRawNote
    ? await prisma.brief.findMany({
        where: {
          sourceRawNoteId: latestRawNote.id,
          recipient: { role: { not: 'manager' } },
        },
        include: { recipient: true },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  // All currently-pending drafts across the team for this guest.
  const drafts = await prisma.messageDraft.findMany({
    where: { guestId, status: 'draft' },
    include: { from: true },
    orderBy: { createdAt: 'desc' },
  });

  const messages = await prisma.message.findMany({
    where: { guestId },
    include: { from: true },
    orderBy: { deliveredAt: 'asc' },
  });
  const replies = await prisma.guestReply.findMany({
    where: { fromGuestId: guestId },
    include: { toPlaceMaker: true },
    orderBy: { createdAt: 'asc' },
  });

  const threadItems = [
    ...messages.map((m) => ({
      kind: 'message' as const,
      id: m.id,
      content: m.content,
      at: m.deliveredAt.toISOString(),
      fromName: m.from.name,
      fromSlug: m.from.slug,
      fromRole: m.from.role,
    })),
    ...replies.map((r) => ({
      kind: 'reply' as const,
      id: r.id,
      content: r.content,
      at: r.createdAt.toISOString(),
      toName: r.toPlaceMaker.name,
      toSlug: r.toPlaceMaker.slug,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col gap-8">
      <div className="text-[10px] uppercase tracking-[0.22em]">
        <Link
          href="/manager"
          className="text-discovery hover:text-discoveryDeep"
        >
          ← back to property overview
        </Link>
      </div>
      <ManagerGuestView
        carolId={carol.id}
        guest={{
          id: guest.id,
          name: guest.name,
          partnerName: guest.partnerName,
          anniversary: guest.anniversary,
          origin: guest.origin,
          interestTags: guest.interestTags,
          notes: guest.notes,
          stayState: guest.stayState,
          arrivalAt: guest.arrivalAt?.toISOString() ?? null,
          visitCount: guest.visitCount,
        }}
        latestObservation={
          latestRawNote && {
            id: latestRawNote.id,
            content: latestRawNote.content,
            createdAt: latestRawNote.createdAt.toISOString(),
            sensitivity: latestRawNote.sensitivity,
            sourceName: latestRawNote.source.name,
            sourceRole: latestRawNote.source.role,
          }
        }
        initialBriefs={briefs.map((b) => ({
          id: b.id,
          content: b.content,
          sensitivity: b.sensitivity,
          recipient: {
            slug: b.recipient.slug,
            name: b.recipient.name,
            role: b.recipient.role,
            title: b.recipient.title,
          },
        }))}
        initialDrafts={drafts.map((d) => ({
          id: d.id,
          content: d.content,
          status: d.status,
          intent: d.intent,
          from: {
            name: d.from.name,
            slug: d.from.slug,
            role: d.from.role,
          },
        }))}
        initialThread={threadItems}
      />
    </div>
  );
}
