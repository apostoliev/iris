import { NextRequest } from 'next/server';
import { startPipecatSession } from '@/lib/pipecat';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const guestId = body?.guestId as string | undefined;
  const sourcePlaceMakerId = body?.sourcePlaceMakerId as string | undefined;
  if (!guestId || !sourcePlaceMakerId) {
    return Response.json(
      { error: 'guestId and sourcePlaceMakerId required' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/pipecat/webhook`;

  try {
    const session = await startPipecatSession({
      guestId,
      sourcePlaceMakerId,
      callbackUrl,
    });
    return Response.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
