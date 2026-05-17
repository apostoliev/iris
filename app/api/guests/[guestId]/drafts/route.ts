import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const { guestId } = await params;
  const drafts = await prisma.messageDraft.findMany({
    where: { guestId, status: 'draft' },
    include: { from: true },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json({
    drafts: drafts.map((d) => ({
      id: d.id,
      content: d.content,
      status: d.status,
      intent: d.intent,
      from: {
        name: d.from.name,
        slug: d.from.slug,
        role: d.from.role,
      },
    })),
  });
}
