import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { publish, guestChannel } from '@/lib/events';
import { runMaitre } from '@/lib/maitre';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const transcript = (body?.transcript as string | undefined)?.trim();
  const guestId = body?.guestId as string | undefined;
  const sourcePlaceMakerId = body?.sourcePlaceMakerId as string | undefined;
  const eventType = body?.eventType as string | undefined;

  if (eventType && eventType !== 'final') {
    return Response.json({ accepted: true, ignored: eventType }, { status: 202 });
  }
  if (!transcript || !guestId || !sourcePlaceMakerId) {
    return Response.json(
      { error: 'transcript, guestId, sourcePlaceMakerId required' },
      { status: 400 }
    );
  }

  const note = await prisma.rawNote.create({
    data: { guestId, sourcePlaceMakerId, content: transcript },
  });

  publish({
    type: 'note.captured',
    channel: guestChannel(guestId),
    data: { rawNoteId: note.id, sourcePlaceMakerId, via: 'pipecat' },
    ts: Date.now(),
  });

  runMaitre({ rawNoteId: note.id }).catch((err) => {
    console.error('runMaitre failed', err);
  });

  return Response.json({ noteId: note.id }, { status: 202 });
}
