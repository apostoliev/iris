import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { GuestInbox } from './GuestInbox';

export const dynamic = 'force-dynamic';

export default async function GuestInboxPage({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  const { guestId } = await params;

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      relationships: { include: { placeMaker: true } },
    },
  });
  if (!guest) notFound();

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

  const placeMakers = guest.relationships.map((r) => ({
    slug: r.placeMaker.slug,
    name: r.placeMaker.name,
    role: r.placeMaker.role,
    title: r.placeMaker.title,
    property: r.placeMaker.property,
  }));

  return (
    <GuestInbox
      guest={{ id: guest.id, name: guest.name }}
      placeMakers={placeMakers}
      initialThread={threadItems}
    />
  );
}
