import { anthropic, MODELS } from '@/lib/anthropic';
import { CLASSIFY_SYSTEM } from './prompts';
import type { Classification } from './types';

export async function classify(rawNote: string): Promise<Classification> {
  const msg = await anthropic.messages.create({
    model: MODELS.classifier,
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: CLASSIFY_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Raw note from staff:\n\n${rawNote}\n\nReturn the JSON classification.`,
      },
    ],
  });

  const text = msg.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();

  const parsed = safeJson(text);
  return {
    sensitivity: parsed?.sensitivity ?? 'medium',
    themes: Array.isArray(parsed?.themes) ? parsed.themes.slice(0, 6) : [],
    suggestedRoles: Array.isArray(parsed?.suggestedRoles) ? parsed.suggestedRoles : [],
  };
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* noop */ }
    }
    return null;
  }
}
