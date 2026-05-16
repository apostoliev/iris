import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!client) client = twilio(sid, token);
  return client;
}

export async function sendSms(opts: { to: string; body: string }): Promise<{ sid?: string; skipped?: true; reason?: string }> {
  const from = process.env.TWILIO_FROM_NUMBER;
  const c = getClient();
  if (!c || !from) {
    return { skipped: true, reason: 'Twilio not configured' };
  }
  try {
    const msg = await c.messages.create({
      from,
      to: opts.to,
      body: opts.body,
    });
    return { sid: msg.sid };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown';
    return { skipped: true, reason };
  }
}
