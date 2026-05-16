import { anthropic, MODELS } from '@/lib/anthropic';
import { abstractSystemPrompt } from './prompts';
import type { AbstractInput } from './types';

export async function abstractForRole(input: AbstractInput): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODELS.drafter,
    max_tokens: 350,
    system: [
      {
        type: 'text',
        text: abstractSystemPrompt(input.role),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          `Guest: ${input.guestName}`,
          input.guestInterestTags.length
            ? `Known preferences: ${input.guestInterestTags.join(', ')}`
            : '',
          input.relationshipThemes.length
            ? `Prior themes with this role: ${input.relationshipThemes.join(', ')}`
            : '',
          `Sensitivity: ${input.sensitivity}`,
          input.themes.length ? `Note themes: ${input.themes.join(', ')}` : '',
          '',
          'Raw note from staff (NEVER quote directly to anyone):',
          input.raw,
          '',
          `Write the brief for ${input.role}.`,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
  });

  return msg.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();
}
