import { prisma } from '@/lib/db';
import { publish, guestChannel } from '@/lib/events';
import { classify } from './classify';
import { abstractForRole } from './abstract';
import { draftMessage } from './draft';

export type RunMaitreOptions = {
  rawNoteId: string;
  draftForPlaceMakerId?: string;
  draftIntent?: string;
};

export async function runMaitre(opts: RunMaitreOptions) {
  const raw = await prisma.rawNote.findUnique({
    where: { id: opts.rawNoteId },
    include: {
      guest: {
        include: {
          relationships: { include: { placeMaker: true } },
        },
      },
      source: true,
    },
  });
  if (!raw) return null;

  const channel = guestChannel(raw.guestId);
  publish({
    type: 'regenerate.started',
    channel,
    data: { rawNoteId: raw.id },
    ts: Date.now(),
  });

  const classification = await classify(raw.content);

  await prisma.rawNote.update({
    where: { id: raw.id },
    data: {
      sensitivity: classification.sensitivity,
      themes: classification.themes,
      suggestedRoles: classification.suggestedRoles,
    },
  });

  const placeMakers = raw.guest.relationships.map((r) => r.placeMaker);

  const briefsPromise = Promise.all(
    placeMakers.map(async (pm) => {
      const rel = raw.guest.relationships.find((r) => r.placeMakerId === pm.id);
      const content = await abstractForRole({
        raw: raw.content,
        sensitivity: classification.sensitivity,
        themes: classification.themes,
        role: pm.role,
        guestName: raw.guest.name,
        guestInterestTags: raw.guest.interestTags,
        relationshipThemes: rel?.themes ?? [],
      });
      return prisma.brief.create({
        data: {
          recipientPlaceMakerId: pm.id,
          guestId: raw.guestId,
          content,
          sensitivity: classification.sensitivity,
          sourceRawNoteId: raw.id,
        },
        include: { recipient: true },
      });
    })
  );

  const draftPlaceMakerId = opts.draftForPlaceMakerId ?? raw.sourcePlaceMakerId;
  const draftPlaceMaker = placeMakers.find((p) => p.id === draftPlaceMakerId) ?? raw.source;
  const draftRel = raw.guest.relationships.find((r) => r.placeMakerId === draftPlaceMaker.id);

  const draftPromise = (async () => {
    const messages = await prisma.message.findMany({
      where: { guestId: raw.guestId, fromPlaceMakerId: draftPlaceMaker.id },
      orderBy: { deliveredAt: 'asc' },
      take: 10,
    });
    const replies = await prisma.guestReply.findMany({
      where: { fromGuestId: raw.guestId, toPlaceMakerId: draftPlaceMaker.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    const priorExchanges = interleave(messages, replies);

    const content = await draftMessage({
      guestName: raw.guest.name,
      guestInterestTags: raw.guest.interestTags,
      guestPartnerName: raw.guest.partnerName,
      guestAnniversary: raw.guest.anniversary,
      placeMakerName: draftPlaceMaker.name,
      placeMakerRole: draftPlaceMaker.role,
      placeMakerVoiceStyle: draftPlaceMaker.voiceStyle,
      relationshipThemes: draftRel?.themes ?? [],
      visits: draftRel?.visits ?? 0,
      rawNote: raw.content,
      sensitivity: classification.sensitivity,
      priorExchanges,
      intent: opts.draftIntent ?? 'reach out warmly before arrival, reference recent context naturally',
    });

    return prisma.messageDraft.create({
      data: {
        fromPlaceMakerId: draftPlaceMaker.id,
        guestId: raw.guestId,
        content,
        intent: opts.draftIntent ?? 'post_note_outreach',
        status: 'draft',
      },
      include: { from: true },
    });
  })();

  const [briefs, draft] = await Promise.all([briefsPromise, draftPromise]);

  publish({
    type: 'brief.updated',
    channel,
    data: { briefIds: briefs.map((b) => b.id), rawNoteId: raw.id },
    ts: Date.now(),
  });
  publish({
    type: 'draft.ready',
    channel,
    data: { draftId: draft.id },
    ts: Date.now(),
  });
  publish({
    type: 'regenerate.completed',
    channel,
    data: { briefs: briefs.length, draftId: draft.id },
    ts: Date.now(),
  });

  return { briefs, draft, classification };
}

function interleave(
  messages: { content: string; deliveredAt: Date }[],
  replies: { content: string; createdAt: Date }[]
) {
  const merged: Array<{ from: 'staff' | 'guest'; content: string; at: Date }> = [
    ...messages.map((m) => ({ from: 'staff' as const, content: m.content, at: m.deliveredAt })),
    ...replies.map((r) => ({ from: 'guest' as const, content: r.content, at: r.createdAt })),
  ];
  merged.sort((a, b) => a.at.getTime() - b.at.getTime());
  return merged;
}
