/* eslint-disable */
import { HistoryView } from '@/components/app/history-view';
import { getFolders, redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function getConvos() {
  const ids = (await redis(['LRANGE', 'convos', '0', '199'])) || [];
  if (ids.length === 0) return [];
  const raw = (await redis(['MGET', ...ids.map((id: string) => 'convo:' + id)])) || [];
  const map = ((await redis(['HGETALL', 'convo_folders'])) || []) as string[];
  const folderOf: Record<string, string> = {};
  for (let i = 0; i < map.length; i += 2) folderOf[map[i]] = map[i + 1];
  return raw
    .filter(Boolean)
    .map((r: string) => JSON.parse(r))
    .map((c: any) => ({ ...c, folder: folderOf[c.id] || '' }));
}

export default async function HistoryPage() {
  const [convos, folders] = await Promise.all([getConvos(), getFolders()]);
  return <HistoryView convos={convos} folders={folders} />;
}
