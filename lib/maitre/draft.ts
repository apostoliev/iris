import { anthropic, MODELS } from '@/lib/anthropic';
import { DRAFT_SYSTEM } from './prompts';
import type { DraftInput } from './types';

export async function draftMessage(input: DraftInput): Promise<string> {
  const exchanges = input.priorExchanges
    .map((e) => `${e.from === 'staff' ? input.placeMakerName : input.guestName}: ${e.content}`)
    .join('\n');

  const userMessage = [
    `Place-maker: ${input.placeMakerName} (${input.placeMakerRole})`,
    `Voice style: ${input.placeMakerVoiceStyle}`,
    '',
    `Guest: ${input.guestName}`,
    input.guestPartnerName ? `Partner: ${input.guestPartnerName}` : '',
    input.guestAnniversary ? `Anniversary: ${input.guestAnniversary}` : '',
    input.guestInterestTags.length ? `Preferences: ${input.guestInterestTags.join(', ')}` : '',
    input.relationshipThemes.length ? `Themes you share: ${input.relationshipThemes.join(', ')}` : '',
    `Visits: ${input.visits}`,
    '',
    exchanges ? 'Prior exchanges (most recent last):' : '',
    exchanges,
    '',
    'New context (a staff observation — DO NOT quote or paraphrase to the guest):',
    input.rawNote,
    `Sensitivity of that context: ${input.sensitivity}`,
    '',
    `Intent: ${input.intent}`,
    '',
    `Write the message in ${input.placeMakerName}'s voice. Output the message text only.`,
  ]
    .filter(Boolean)
    .join('\n');

  const msg = await anthropic.messages.create({
    model: MODELS.drafter,
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: DRAFT_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  return msg.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();
}
