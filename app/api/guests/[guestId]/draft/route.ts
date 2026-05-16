import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const { guestId } = await params;
  const placeMakerId = req.nextUrl.searchParams.get('placeMakerId');
  if (!placeMakerId) {
    return Response.json({ error: 'placeMakerId required' }, { status: 400 });
  }

  const draft = await prisma.messageDraft.findFirst({
    where: { guestId, fromPlaceMakerId: placeMakerId },
    include: { from: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!draft) return Response.json({ draft: null });

  return Response.json({
    draft: {
      id: draft.id,
      content: draft.content,
      status: draft.status,
      intent: draft.intent,
      from: {
        name: draft.from.name,
        slug: draft.from.slug,
        role: draft.from.role,
      },
    },
  });
}
