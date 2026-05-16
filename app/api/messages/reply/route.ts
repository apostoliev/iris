import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { publish, guestChannel } from '@/lib/events';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const guestId = body?.guestId as string | undefined;
  const content = (body?.content as string | undefined)?.trim();
  const toPlaceMakerSlug = body?.toPlaceMakerSlug as string | undefined;

  if (!guestId || !content) {
    return Response.json({ error: 'guestId and content required' }, { status: 400 });
  }

  let toPlaceMakerId: string | null = null;
  if (toPlaceMakerSlug) {
    const pm = await prisma.placeMaker.findUnique({ where: { slug: toPlaceMakerSlug } });
    toPlaceMakerId = pm?.id ?? null;
  }
  if (!toPlaceMakerId) {
    const lastMsg = await prisma.message.findFirst({
      where: { guestId },
      orderBy: { deliveredAt: 'desc' },
    });
    toPlaceMakerId = lastMsg?.fromPlaceMakerId ?? null;
  }
  if (!toPlaceMakerId) {
    return Response.json({ error: 'no place-maker to reply to' }, { status: 400 });
  }

  const reply = await prisma.guestReply.create({
    data: {
      fromGuestId: guestId,
      toPlaceMakerId,
      content,
    },
    include: { toPlaceMaker: true, fromGuest: true },
  });

  publish({
    type: 'guest.replied',
    channel: guestChannel(guestId),
    data: {
      replyId: reply.id,
      content,
      toPlaceMakerSlug: reply.toPlaceMaker.slug,
      fromGuestName: reply.fromGuest.name,
    },
    ts: Date.now(),
  });

  return Response.json({ replyId: reply.id });
}
