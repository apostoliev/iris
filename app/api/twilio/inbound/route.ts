export const runtime = 'nodejs';

export async function POST() {
  return new Response('<Response/>', {
    headers: { 'Content-Type': 'application/xml' },
  });
}
