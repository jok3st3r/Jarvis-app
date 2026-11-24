/* eslint-disable */
'use client';

import { useState } from 'react';

const S = {
  main: {
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: 'var(--font-public-sans), sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 24,
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--card)',
  },
  input: {
    height: 44,
    padding: '0 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: 16,
  },
  button: {
    height: 46,
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    fontWeight: 700,
    fontSize: 15,
  },
  row: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
} as const;

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass, remember }),
    }).catch(() => null);
    if (res?.ok) {
      window.location.href = '/';
      return;
    }
    setBusy(false);
    setError(res ? 'Wrong username or password.' : 'Could not reach the app. Try again.');
  };

  return (
    <main style={S.main as any}>
      <form style={S.card as any} onSubmit={submit}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Jarvis</h1>
        <input
          style={S.input}
          placeholder="Username"
          autoComplete="username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          style={S.input}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <label style={S.row as any}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember this device
        </label>
        {error && <p style={{ color: 'var(--destructive)', margin: 0, fontSize: 14 }}>{error}</p>}
        <button type="submit" style={S.button} disabled={busy || !user || !pass}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
