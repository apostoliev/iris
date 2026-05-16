import { NextRequest } from 'next/server';
import { runMaitre } from '@/lib/maitre';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawNoteId = body?.rawNoteId as string | undefined;
  const draftForPlaceMakerId = body?.draftForPlaceMakerId as string | undefined;
  const draftIntent = body?.draftIntent as string | undefined;
  if (!rawNoteId) {
    return Response.json({ error: 'rawNoteId required' }, { status: 400 });
  }

  runMaitre({ rawNoteId, draftForPlaceMakerId, draftIntent }).catch((err) => {
    console.error('runMaitre failed', err);
  });

  return Response.json({ accepted: true, rawNoteId }, { status: 202 });
}
