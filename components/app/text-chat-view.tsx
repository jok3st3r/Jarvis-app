/* eslint-disable */
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useSessionMessages,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { askTextMode } from '@/components/app/chat-mode';

// Text-only chat with Jarvis: no mic, no voice. He answers in writing.
const S = {
  wrap: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--background)',
  },
  body: { flex: 1, minHeight: 0, paddingTop: 110 },
  bottom: {
    width: '100%',
    maxWidth: 720,
    margin: '0 auto',
    padding: '8px 12px 72px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1,
    resize: 'none',
    minHeight: 44,
    maxHeight: 160,
    padding: '10px 14px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: 16,
    lineHeight: '22px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  send: {
    height: 44,
    padding: '0 18px',
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    fontWeight: 700,
    fontSize: 14,
  },
  tools: { display: 'flex', gap: 8, justifyContent: 'center' },
  tool: {
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: 13,
    fontWeight: 600,
  },
  hint: { textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, padding: '0 16px' },
} as const;

interface TextChatViewProps {
  onVoice: () => void;
}

export function TextChatView({ onVoice }: TextChatViewProps) {
  const session = useSessionContext();
  const { messages, send, isSending } = useSessionMessages(session);
  const { state: agentState } = useAgent();
  const { agent, agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [draft, setDraft] = useState('');
  const asked = useRef(false);

  // Safety net: make sure Jarvis knows this is a text chat, even if the start signal got lost.
  useEffect(() => {
    if (!agent || asked.current || agentAttributes?.jarvis_text === '1') {
      return;
    }
    asked.current = true;
    askTextMode(localParticipant, agent, true);
  }, [agent, agentAttributes, localParticipant]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || isSending) {
      return;
    }
    setDraft('');
    try {
      await send(text);
    } catch (e) {
      console.warn('Send failed:', e);
      setDraft(text);
    }
  };

  return (
    <section style={S.wrap as any}>
      <div style={S.body as any}>
        {messages.length === 0 ? (
          <p style={{ ...S.hint, marginTop: 40 } as any}>
            {agent ? 'Text chat. Jarvis will answer here.' : 'Waking Jarvis up...'}
          </p>
        ) : (
          <AgentChatTranscript
            agentState={agentState}
            messages={messages}
            className="mx-auto h-full max-w-2xl"
          />
        )}
      </div>
      <div style={S.bottom as any}>
        <div style={S.row as any}>
          <textarea
            style={S.input as any}
            rows={1}
            value={draft}
            placeholder="Message Jarvis"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button type="button" style={S.send as any} onClick={submit} disabled={!draft.trim()}>
            Send
          </button>
        </div>
        <div style={S.tools as any}>
          <button type="button" style={S.tool as any} onClick={onVoice}>
            Switch to voice
          </button>
          <button type="button" style={S.tool as any} onClick={() => session.end()}>
            End chat
          </button>
        </div>
      </div>
    </section>
  );
}

interface TextToggleProps {
  onText: () => void;
}

// Shown during a voice call: switch to typing without hanging up.
export function TextToggle({ onText }: TextToggleProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 120,
        left: 0,
        right: 0,
        zIndex: 55,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <button type="button" style={{ ...S.tool, pointerEvents: 'auto' } as any} onClick={onText}>
        Switch to text
      </button>
    </div>
  );
}
