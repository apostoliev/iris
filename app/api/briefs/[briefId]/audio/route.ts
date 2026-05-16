import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { synthesizeSpeech, voiceIdForRole } from '@/lib/elevenlabs';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ briefId: string }> }
) {
  const { briefId } = await params;
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    include: { recipient: true, guest: true },
  });
  if (!brief) {
    return Response.json({ error: 'brief not found' }, { status: 404 });
  }

  const preface = `Brief for ${brief.recipient.name.split(' ')[0]}, regarding ${brief.guest.name.split(' ')[0]}.`;
  const spoken = `${preface} ${brief.content}`;

  const result = await synthesizeSpeech({
    text: spoken,
    voiceId: voiceIdForRole(brief.recipient.role),
  });

  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return new Response(result.audio, {
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
