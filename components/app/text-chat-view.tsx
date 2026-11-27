'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useSessionMessages,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { askTextMode } from '@/components/app/chat-mode';
import { ModelPicker } from '@/components/app/model-picker';
import { Button } from '@/components/ui/button';
import type { ChatSummary, SavedChat } from '@/lib/conversations';

interface TextChatViewProps {
  onVoice: () => Promise<boolean>;
  onContinue: () => Promise<void>;
  onNewChat: () => Promise<void>;
  savedChat: SavedChat | null;
  savedSummary: ChatSummary | null;
  canResume: boolean;
  autoContinue: boolean;
}

export function TextChatView({
  onVoice,
  onContinue,
  onNewChat,
  savedChat,
  savedSummary,
  canResume,
  autoContinue,
}: TextChatViewProps) {
  const session = useSessionContext();
  const { messages, send, isSending } = useSessionMessages(session);
  const { state: agentState } = useAgent();
  const { agent, agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const asked = useRef(false);
  const autoStarted = useRef(false);
  const pendingMode = useRef<Promise<boolean> | null>(null);
  const chat = useRef<HTMLElement>(null);
  const connected = session.isConnected;
  const full = savedSummary?.full || agentAttributes?.jarvis_chat_full === '1';
  const expired = savedSummary?.expired;
  const historyUnavailable = agentAttributes?.jarvis_history_unavailable === '1';
  const liveMessages = connected ? messages : [];

  useEffect(() => {
    const viewport = window.visualViewport;
    const element = chat.current;
    if (!viewport || !element) return;

    const fitVisibleScreen = () => {
      // Mobile keyboards can resize the visible viewport without resizing the page.
      if (viewport.scale !== 1) {
        element.style.removeProperty('height');
        element.style.removeProperty('top');
        return;
      }
      element.style.height = `${viewport.height}px`;
      element.style.top = `${viewport.offsetTop}px`;
    };

    fitVisibleScreen();
    viewport.addEventListener('resize', fitVisibleScreen);
    viewport.addEventListener('scroll', fitVisibleScreen);
    return () => {
      viewport.removeEventListener('resize', fitVisibleScreen);
      viewport.removeEventListener('scroll', fitVisibleScreen);
    };
  }, []);

  // Safety net: make sure Jarvis knows this is a text chat, even if the start signal got lost.
  useEffect(() => {
    if (!connected) {
      asked.current = false;
      return;
    }
    if (!agent || asked.current || agentAttributes?.jarvis_text === '1') {
      return;
    }
    asked.current = true;
    pendingMode.current = askTextMode(localParticipant, agent, true).finally(() => {
      pendingMode.current = null;
    });
  }, [connected, agent, agentAttributes, localParticipant]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || !connected || full || isSending || busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      if (!(await (pendingMode.current ?? askTextMode(localParticipant, agent, true)))) {
        setError('Jarvis hasn’t confirmed text mode. Try sending again.');
        return;
      }
      setDraft('');
      await send(text);
    } catch (e) {
      console.warn('Send failed:', e);
      setDraft(text);
      setError('Message couldn’t be sent. Try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const switchToVoice = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await pendingMode.current;
      if (!(await onVoice())) setError('Couldn’t switch to voice. Try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const continueChat = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await onContinue();
    } catch {
      setError('Couldn’t continue this chat. Try again or start a new chat.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [onContinue]);

  useEffect(() => {
    if (!autoContinue || !canResume || !savedChat || connected || autoStarted.current) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('continue') !== '1') return;
    autoStarted.current = true;
    url.searchParams.delete('continue');
    window.history.replaceState(null, '', url);
    void continueChat();
  }, [autoContinue, canResume, savedChat, connected, continueChat]);

  return (
    <section
      ref={chat}
      aria-label="Chat with Jarvis"
      className="bg-background fixed inset-x-0 top-0 z-[60] grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
    >
      <header className="border-border border-b pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-4 pb-2 sm:px-6">
          <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3">
            <h1
              className="font-display max-w-[18rem] truncate text-xl font-semibold"
              title={savedSummary?.title}
            >
              {savedSummary?.title || 'Jarvis'}
            </h1>
            <div className="flex items-center gap-1">
              {connected && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    onClick={switchToVoice}
                    disabled={busy}
                  >
                    Switch to voice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => session.end()}
                  >
                    End chat
                  </Button>
                </>
              )}
              {!connected && (
                <Button asChild variant="outline" size="sm" className="min-h-11">
                  <Link href="/">Back to Recents</Link>
                </Button>
              )}
            </div>
          </div>
          {connected && <ModelPicker inline />}
          <p role="status" className="text-muted-foreground min-h-4 truncate text-center text-xs">
            {historyUnavailable
              ? 'Chat history is temporarily unavailable.'
              : agentAttributes?.jarvis_status}
          </p>
        </div>
      </header>
      <div className="min-h-0 min-w-0">
        {liveMessages.length === 0 && !savedChat?.messages.length ? (
          <p className="text-muted-foreground mt-8 px-4 text-center text-sm">
            {!connected
              ? 'This saved chat is unavailable.'
              : agent
                ? 'How can I help?'
                : 'Waking Jarvis up...'}
          </p>
        ) : (
          <AgentChatTranscript
            agentState={agentState}
            messages={liveMessages}
            savedMessages={savedChat?.messages}
            className="mx-auto h-full max-w-3xl"
            wideReplies
          />
        )}
      </div>
      <div className="bg-background border-border border-t pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 sm:px-6">
          {full || expired ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {full
                  ? 'This chat has reached its limit. You can still read it.'
                  : 'This older chat is saved for reference.'}
              </p>
              <Button onClick={onNewChat}>Start a new chat</Button>
            </div>
          ) : !connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {savedChat && canResume && (
                <Button onClick={continueChat} disabled={busy}>
                  {busy ? 'Opening chat…' : 'Continue in text'}
                </Button>
              )}
              <Button variant="outline" onClick={onNewChat}>
                Start a new chat
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <textarea
                  aria-label="Message Jarvis"
                  className="bg-card border-border focus-visible:ring-ring max-h-36 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border px-3 py-2.5 text-base leading-6 focus-visible:ring-2 focus-visible:outline-none"
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
                <Button
                  type="button"
                  className="min-h-11 rounded-full px-4 font-semibold"
                  onClick={submit}
                  disabled={!draft.trim() || busy || isSending}
                >
                  Send
                </Button>
              </div>
            </>
          )}
          {error && (
            <p role="status" className="text-destructive mt-2 text-sm">
              {error}
            </p>
          )}
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="pointer-events-auto rounded-full"
        onClick={onText}
      >
        Switch to text
      </Button>
    </div>
  );
}
