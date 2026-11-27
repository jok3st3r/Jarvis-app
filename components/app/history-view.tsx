/* eslint-disable */
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

/* eslint-disable */

/* eslint-disable */

// Past chats (voice and text), with folders. Folder changes save through /api/history.
type Convo = {
  id: string;
  started: string;
  updated?: string;
  kind?: string;
  folder: string;
  messages: { role: string; text: string }[];
};

const ALL = '__all__';
const UNFILED = '__unfiled__';

const S = {
  main: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '20px 16px 90px',
    fontFamily: 'var(--font-public-sans), sans-serif',
  },
  back: { color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: 14 },
  h1: { fontSize: 28, margin: '16px 0 12px', fontWeight: 600 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: (on: boolean) => ({
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: on ? 'var(--primary)' : 'var(--card)',
    color: on ? 'var(--primary-foreground)' : 'var(--foreground)',
    fontSize: 13,
    fontWeight: 600,
  }),
  folderTools: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  small: {
    padding: '4px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: 12,
  },
  card: {
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    background: 'var(--card)',
  },
  summary: { cursor: 'pointer', lineHeight: 1.5 },
  badge: {
    display: 'inline-block',
    marginLeft: 6,
    padding: '1px 8px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    fontSize: 11,
    color: 'var(--muted-foreground)',
  },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 },
  select: {
    padding: '4px 8px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: 13,
  },
  msg: { margin: '8px 0', whiteSpace: 'pre-wrap' },
  muted: { color: 'var(--muted-foreground)' },
} as const;

async function call(body: any) {
  const res = await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Could not save that');
  return data;
}

export function HistoryView({
  convos: start,
  folders: startFolders,
}: {
  convos: Convo[];
  folders: string[];
}) {
  const [convos, setConvos] = useState<Convo[]>(start);
  const [folders, setFolders] = useState<string[]>(startFolders);
  const [view, setView] = useState<string>(ALL);
  const [error, setError] = useState('');

  const shown = useMemo(() => {
    if (view === ALL) return convos;
    if (view === UNFILED) return convos.filter((c) => !c.folder);
    return convos.filter((c) => c.folder === view);
  }, [convos, view]);

  const run = async (body: any, after?: (data: any) => void) => {
    setError('');
    try {
      const data = await call(body);
      if (data?.folders) setFolders(data.folders);
      after?.(data);
    } catch (e: any) {
      setError(e?.message || 'Could not save that');
    }
  };

  const newFolder = () => {
    const name = window.prompt('New folder name')?.trim();
    if (name) run({ action: 'create', name }, () => setView(name));
  };

  const renameFolder = () => {
    const to = window.prompt('Rename folder to', view)?.trim();
    if (!to || to === view) return;
    run({ action: 'rename', name: view, to }, () => {
      setConvos((cs) => cs.map((c) => (c.folder === view ? { ...c, folder: to } : c)));
      setView(to);
    });
  };

  const deleteFolder = () => {
    if (
      !window.confirm(
        `Delete the folder "${view}"? The chats in it stay, they just go back to Unfiled.`
      )
    )
      return;
    const gone = view;
    run({ action: 'delete', name: gone }, () => {
      setConvos((cs) => cs.map((c) => (c.folder === gone ? { ...c, folder: '' } : c)));
      setView(ALL);
    });
  };

  const move = (id: string, name: string) => {
    if (name === '__new__') {
      const fresh = window.prompt('New folder name')?.trim();
      if (!fresh) return;
      name = fresh;
    }
    run({ action: 'move', id, name }, () =>
      setConvos((cs) => cs.map((c) => (c.id === id ? { ...c, folder: name } : c)))
    );
  };

  const count = (f: string) => convos.filter((c) => c.folder === f).length;
  const isFolder = view !== ALL && view !== UNFILED;

  return (
    <main style={S.main as any}>
      <a href="/" style={S.back}>
        ← Back to Jarvis
      </a>
      <h1 style={S.h1}>Conversations</h1>

      <div style={S.chips as any}>
        <button type="button" style={S.chip(view === ALL)} onClick={() => setView(ALL)}>
          All ({convos.length})
        </button>
        <button type="button" style={S.chip(view === UNFILED)} onClick={() => setView(UNFILED)}>
          Unfiled ({convos.filter((c) => !c.folder).length})
        </button>
        {folders.map((f) => (
          <button key={f} type="button" style={S.chip(view === f)} onClick={() => setView(f)}>
            📁 {f} ({count(f)})
          </button>
        ))}
        <button type="button" style={S.chip(false)} onClick={newFolder}>
          + New folder
        </button>
      </div>

      {isFolder && (
        <div style={S.folderTools as any}>
          <button type="button" style={S.small} onClick={renameFolder}>
            Rename folder
          </button>
          <button type="button" style={S.small} onClick={deleteFolder}>
            Delete folder
          </button>
        </div>
      )}

      {error && <p style={{ color: 'var(--destructive)' }}>{error}</p>}
      {shown.length === 0 && <p style={S.muted}>No conversations here yet.</p>}

      {shown.map((c) => (
        <article key={c.id} style={S.card}>
          <Link
            href={`/?chat=${encodeURIComponent(c.id)}&continue=1`}
            className="hover:bg-accent block min-h-11 rounded-md p-2"
          >
            <strong className="block truncate">
              {c.messages
                .find(
                  (m) => m.role === 'user' && !/^\[passphrase(?: accepted)?\]$/i.test(m.text.trim())
                )
                ?.text.slice(0, 90) || 'Jarvis conversation'}
            </strong>
            <span style={S.muted}>
              {new Date(c.updated || c.started).toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
              })}
            </span>
            <span style={S.badge}>{c.kind === 'text' ? 'Text' : 'Voice'}</span>
            {c.folder && <span style={S.badge}>📁 {c.folder}</span>}
          </Link>
          <details className="px-2">
            <summary style={S.summary} className="text-muted-foreground text-sm">
              Transcript and folder
            </summary>
            <div style={S.row as any}>
              <span style={S.muted}>Folder:</span>
              <select
                style={S.select}
                value={c.folder}
                onChange={(e) => move(c.id, e.target.value)}
              >
                <option value="">Unfiled</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="__new__">+ New folder…</option>
              </select>
            </div>
            <div style={{ marginTop: 10 }}>
              {c.messages.map((m, i) => (
                <p key={i} style={S.msg as any}>
                  <strong>{m.role === 'user' ? 'You: ' : 'Jarvis: '}</strong>
                  {m.text}
                </p>
              ))}
            </div>
          </details>
        </article>
      ))}
    </main>
  );
}
