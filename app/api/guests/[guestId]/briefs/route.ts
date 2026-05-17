import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const { guestId } = await params;
  const url = new URL(req.url);
  const placeMakerId = url.searchParams.get('placeMakerId');
  const excludeRole = url.searchParams.get('excludeRole');

  const latestNote = await prisma.rawNote.findFirst({
    where: { guestId },
    orderBy: { createdAt: 'desc' },
  });
  if (!latestNote) return Response.json({ briefs: [] });

  const briefs = await prisma.brief.findMany({
    where: {
      sourceRawNoteId: latestNote.id,
      ...(placeMakerId ? { recipientPlaceMakerId: placeMakerId } : {}),
      ...(excludeRole ? { recipient: { role: { not: excludeRole } } } : {}),
    },
    include: { recipient: true },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({
    briefs: briefs.map((b) => ({
      id: b.id,
      content: b.content,
      sensitivity: b.sensitivity,
      recipient: {
        slug: b.recipient.slug,
        name: b.recipient.name,
        role: b.recipient.role,
        title: b.recipient.title,
      },
    })),
  });
}
