'use client';

import { useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import type { ChatSummary, SavedChat } from '@/lib/conversations';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  tokenServerId?: string;
  tokenEndpoint: string;
  agentName?: string;
  isVideoInputSupported: boolean;
  recentChats: ChatSummary[];
  savedChat: SavedChat | null;
  savedSummary: ChatSummary | null;
  requestedChat: boolean;
}

export function App({
  tokenServerId,
  tokenEndpoint,
  agentName,
  isVideoInputSupported,
  recentChats,
  savedChat,
  savedSummary,
  requestedChat,
}: AppProps) {
  const canResume = !tokenServerId && tokenEndpoint === '/api/token';
  const endpoint =
    canResume && savedChat
      ? `${tokenEndpoint}?resume=${encodeURIComponent(savedChat.id)}`
      : tokenEndpoint;
  const tokenSource = useMemo(
    () =>
      tokenServerId
        ? TokenSource.developmentTokenServer(tokenServerId)
        : TokenSource.endpoint(endpoint),
    [tokenServerId, endpoint]
  );

  const session = useSession(tokenSource, agentName ? { agentName } : undefined);
  const [textMode, setTextMode] = useState(Boolean(savedChat));

  return (
    <AgentSessionProvider session={session} muted={textMode}>
      <AppSetup />
      <main className="min-h-svh">
        <ViewController
          isVideoInputSupported={isVideoInputSupported}
          textMode={textMode}
          setTextMode={setTextMode}
          recentChats={recentChats}
          savedChat={savedChat}
          savedSummary={savedSummary}
          requestedChat={requestedChat}
          canResume={canResume}
        />
      </main>
      {!textMode && <StartAudioButton label="Start Audio" />}
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}
