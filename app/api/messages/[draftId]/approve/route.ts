import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSms } from '@/lib/twilio';
import { publish, guestChannel } from '@/lib/events';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const body = await req.json().catch(() => ({}));
  const editedContent = (body?.content as string | undefined)?.trim();

  const draft = await prisma.messageDraft.findUnique({
    where: { id: draftId },
    include: { guest: true, from: true },
  });
  if (!draft) {
    return Response.json({ error: 'draft not found' }, { status: 404 });
  }
  if (draft.status === 'sent') {
    return Response.json({ error: 'already sent' }, { status: 409 });
  }

  const content = editedContent || draft.content;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const deepLink = `${appUrl}/g/${draft.guestId}`;
  const smsBody = `${content}\n\nReply privately: ${deepLink}`;

  const sms = draft.guest.phone
    ? await sendSms({ to: draft.guest.phone, body: smsBody })
    : { skipped: true, reason: 'guest has no phone' };

  const message = await prisma.message.create({
    data: {
      draftId: draft.id,
      fromPlaceMakerId: draft.fromPlaceMakerId,
      guestId: draft.guestId,
      content,
      twilioSid: 'sid' in sms ? sms.sid ?? null : null,
    },
  });

  await prisma.messageDraft.update({
    where: { id: draft.id },
    data: { status: 'sent', content },
  });

  publish({
    type: 'message.sent',
    channel: guestChannel(draft.guestId),
    data: {
      messageId: message.id,
      fromPlaceMakerId: draft.fromPlaceMakerId,
      content,
      smsSent: 'sid' in sms && !!sms.sid,
      smsReason: 'reason' in sms ? sms.reason : undefined,
    },
    ts: Date.now(),
  });

  return Response.json({
    messageId: message.id,
    sms,
    deepLink,
  });
}
