/* eslint-disable */
import { NextResponse } from 'next/server';
import { getFolders, redis, saveFolders } from '@/lib/redis';

export const revalidate = 0;

// Folder actions for the History page (the whole site is behind the app login).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = String(body?.action ?? '');
    const name = String(body?.name ?? '')
      .trim()
      .slice(0, 40);
    const folders = await getFolders();

    if (action === 'create') {
      if (!name) return NextResponse.json({ error: 'Folder needs a name' }, { status: 400 });
      if (!folders.includes(name)) await saveFolders([...folders, name]);
    } else if (action === 'rename') {
      const to = String(body?.to ?? '')
        .trim()
        .slice(0, 40);
      if (!name || !to || !folders.includes(name)) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 400 });
      }
      await saveFolders(
        folders.map((f) => (f === name ? to : f)).filter((f, i, a) => a.indexOf(f) === i)
      );
      const map = ((await redis(['HGETALL', 'convo_folders'])) || []) as string[];
      for (let i = 0; i < map.length; i += 2) {
        if (map[i + 1] === name) await redis(['HSET', 'convo_folders', map[i], to]);
      }
    } else if (action === 'delete') {
      // Deleting a folder never deletes chats: they just go back to Unfiled.
      await saveFolders(folders.filter((f) => f !== name));
      const map = ((await redis(['HGETALL', 'convo_folders'])) || []) as string[];
      for (let i = 0; i < map.length; i += 2) {
        if (map[i + 1] === name) await redis(['HDEL', 'convo_folders', map[i]]);
      }
    } else if (action === 'move') {
      const id = String(body?.id ?? '');
      if (!id) return NextResponse.json({ error: 'Missing chat' }, { status: 400 });
      if (!name) {
        await redis(['HDEL', 'convo_folders', id]);
      } else {
        if (!folders.includes(name)) await saveFolders([...folders, name]);
        await redis(['HSET', 'convo_folders', id, name]);
      }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, folders: await getFolders() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
