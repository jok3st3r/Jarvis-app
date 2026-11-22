/* eslint-disable */
export const dynamic = 'force-dynamic';

type Msg = { role: string; text: string };
type Convo = { id: string; started: string; messages: Msg[] };

async function redis(command: string[]) {
  const res = await fetch(process.env.KV_REST_API_URL!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const data = await res.json();
  return data.result;
}

async function getConvos(): Promise<Convo[]> {
  const ids: string[] = (await redis(['LRANGE', 'convos', '0', '49'])) || [];
  if (ids.length === 0) return [];
  const raw: (string | null)[] = await redis(['MGET', ...ids.map((id) => `convo:${id}`)]);
  return raw.filter(Boolean).map((r) => JSON.parse(r as string));
}

export default async function HistoryPage() {
  const convos = await getConvos();
  return (
    
      ← Back to Jarvis
      Conversations
      {convos.length === 0 && No conversations yet.}
      {convos.map((c) => (
        
          
            {new Date(c.started).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
            {' — '}
            {c.messages[0]?.text.slice(0, 60)}
          
          
            {c.messages.map((m, i) => (
              
                {m.role === 'user' ? 'You' : 'Jarvis'}: {m.text}
              
            ))}
          
        
      ))}
    
  );
}
