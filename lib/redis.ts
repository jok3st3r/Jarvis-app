/* eslint-disable */
// Tiny Upstash Redis helper (REST). Used by the History page and its folder API.
export async function redis(command: string[]) {
  const res = await fetch(process.env.KV_REST_API_URL as string, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const data = await res.json();
  return data.result;
}

export async function getFolders(): Promise<string[]> {
  const raw = await redis(['GET', 'folders']);
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((f) => typeof f === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveFolders(folders: string[]) {
  await redis(['SET', 'folders', JSON.stringify(folders)]);
}
