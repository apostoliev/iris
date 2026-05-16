import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const { guestId } = await params;

  const [messages, replies, guest] = await Promise.all([
    prisma.message.findMany({
      where: { guestId },
      include: { from: true },
      orderBy: { deliveredAt: 'asc' },
    }),
    prisma.guestReply.findMany({
      where: { fromGuestId: guestId },
      include: { toPlaceMaker: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.guest.findUnique({ where: { id: guestId } }),
  ]);

  if (!guest) {
    return Response.json({ error: 'guest not found' }, { status: 404 });
  }

  const merged = [
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

  return Response.json({ guest: { id: guest.id, name: guest.name }, items: merged });
}
