/* eslint-disable */
import { createElement as h } from 'react';

export const dynamic = 'force-dynamic';

async function redis(command: string[]) {
  const res = await fetch(process.env.KV_REST_API_URL as string, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const data = await res.json();
  return data.result;
}

async function getConvos() {
  const ids = (await redis(['LRANGE', 'convos', '0', '49'])) || [];
  if (ids.length === 0) return [];
  const raw = await redis(['MGET', ...ids.map((id: string) => 'convo:' + id)]);
  return raw.filter(Boolean).map((r: string) => JSON.parse(r));
}

export default async function HistoryPage() {
  const convos = await getConvos();
  const box = { border: '1px solid #444', borderRadius: 10, padding: 12, marginBottom: 12 };

  return h(
    'main',
    { style: { maxWidth: 700, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' } },
    h('a', { href: '/', style: { color: '#888' } }, '← Back to Jarvis'),
    h('h1', { style: { fontSize: 28, margin: '16px 0' } }, 'Conversations'),
    convos.length === 0 ? h('p', null, 'No conversations yet.') : null,
    ...convos.map((c: any) =>
      h(
        'details',
        { key: c.id, style: box },
        h(
          'summary',
          { style: { cursor: 'pointer' } },
          h('strong', null, new Date(c.started).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })),
          ' — ' + (c.messages[0] ? c.messages[0].text.slice(0, 60) : '')
        ),
        h(
          'div',
          { style: { marginTop: 10 } },
          ...c.messages.map((m: any, i: number) =>
            h(
              'p',
              { key: i, style: { margin: '8px 0' } },
              h('strong', null, m.role === 'user' ? 'You: ' : 'Jarvis: '),
              m.text
            )
          )
        )
      )
    )
  );
}
