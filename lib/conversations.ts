import { redis } from '@/lib/redis';

export type SavedMessage = { role: 'user' | 'assistant'; text: string };
export interface SavedChat {
  id: string;
  started: string;
  updated?: string;
  kind?: string;
  messages: SavedMessage[];
}
export type ChatSummary = { id: string; title: string; updated: string; full: boolean };

export const validChatId = (id: string) => /^[a-zA-Z0-9_-]{1,160}$/.test(id);

function parseChat(raw: unknown): SavedChat | null {
  if (typeof raw !== 'string') return null;
  try {
    const chat = JSON.parse(raw) as SavedChat | null;
    if (
      !chat ||
      typeof chat.id !== 'string' ||
      !validChatId(chat.id) ||
      typeof chat.started !== 'string' ||
      !Array.isArray(chat.messages) ||
      !chat.messages.every(
        (m) => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'assistant')
      )
    )
      return null;
    return chat;
  } catch {
    return null;
  }
}

export function summarizeChat(chat: SavedChat): ChatSummary {
  const title =
    chat.messages.find(
      (m) => m.role === 'user' && !/^\[passphrase(?: accepted)?\]$/i.test(m.text.trim())
    )?.text ??
    chat.messages[0]?.text ??
    'Jarvis conversation';
  const encoder = new TextEncoder();
  return {
    id: chat.id,
    title: title.replace(/\s+/g, ' ').trim().slice(0, 90),
    updated: chat.updated || chat.started,
    full:
      chat.messages.filter((m) => m.role === 'user').length >= 60 ||
      chat.messages.reduce((total, m) => total + encoder.encode(m.text).length, 0) >= 80_000,
  };
}

export async function getSavedChat(id: string): Promise<SavedChat | null> {
  if (!validChatId(id)) return null;
  const chat = parseChat(await redis(['GET', `convo:${id}`]));
  return chat?.id === id ? chat : null;
}

export async function getRecentChats(): Promise<ChatSummary[]> {
  const ids = await redis(['LRANGE', 'convos', '0', '3']);
  if (!Array.isArray(ids) || !ids.length) return [];
  const keys = ids.filter((id): id is string => typeof id === 'string' && validChatId(id));
  if (!keys.length) return [];
  const chats = await redis(['MGET', ...keys.map((id) => `convo:${id}`)]);
  return Array.isArray(chats)
    ? chats
        .map(parseChat)
        .filter((chat): chat is SavedChat => Boolean(chat))
        .map(summarizeChat)
    : [];
}
