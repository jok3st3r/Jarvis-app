'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { askTextMode, setChatMode } from '@/components/app/chat-mode';
import { HoldToTalk } from '@/components/app/hold-to-talk';
import { JarvisStatus } from '@/components/app/jarvis-status';
import { ModelPicker } from '@/components/app/model-picker';
import { TextChatView, TextToggle } from '@/components/app/text-chat-view';
import { WelcomeView } from '@/components/app/welcome-view';
import { Button } from '@/components/ui/button';
import type { ChatSummary, SavedChat } from '@/lib/conversations';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  isVideoInputSupported: boolean;
  textMode: boolean;
  setTextMode: (on: boolean) => void;
  recentChats: ChatSummary[];
  savedChat: SavedChat | null;
  savedSummary: ChatSummary | null;
  requestedChat: boolean;
  canResume: boolean;
}

export function ViewController({
  isVideoInputSupported,
  textMode,
  setTextMode,
  recentChats,
  savedChat,
  savedSummary,
  requestedChat,
  canResume,
}: ViewControllerProps) {
  const { isConnected, start, end } = useSessionContext();
  const router = useRouter();
  const wasConnected = useRef(false);
  const agent = useAgent();
  const { resolvedTheme } = useTheme();
  const { agent: voiceAgent, agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const conversationFull = agentAttributes?.jarvis_chat_full === '1';

  useEffect(() => {
    if (wasConnected.current && !isConnected) router.refresh();
    wasConnected.current = isConnected;
  }, [isConnected, router]);

  const startNew = async () => {
    if (isConnected) await end();
    window.location.assign('/');
  };

  useEffect(() => {
    if (!isConnected || textMode || !navigator.wakeLock) return;

    let disposed = false;
    let requesting = false;
    let lock: WakeLockSentinel | undefined;

    const keepScreenAwake = async () => {
      if (disposed || requesting || document.visibilityState !== 'visible') return;
      if (lock && !lock.released) return;

      requesting = true;
      try {
        const nextLock = await navigator.wakeLock.request('screen');
        if (disposed || document.visibilityState !== 'visible') {
          await nextLock.release();
        } else {
          lock = nextLock;
        }
      } catch {
        // Browser and device power policies can deny a wake lock.
      } finally {
        requesting = false;
      }
    };

    const onVisibilityChange = () => void keepScreenAwake();
    document.addEventListener('visibilitychange', onVisibilityChange);
    void keepScreenAwake();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (lock && !lock.released) void lock.release().catch(() => {});
    };
  }, [isConnected, textMode]);

  const startCall = () => {
    setChatMode('voice');
    setTextMode(false);
    start();
  };

  const startText = () => {
    setChatMode('text');
    setTextMode(true);
    return start({ tracks: { microphone: { enabled: false } } });
  };

  // Mid-call switches: tell Jarvis, then turn the mic off or on.
  const switchToText = async () => {
    setTextMode(true);
    try {
      await localParticipant.setMicrophoneEnabled(false);
    } catch (e) {
      console.warn('Mic off failed:', e);
    }
  };

  const switchToVoice = async () => {
    if (!(await askTextMode(localParticipant, voiceAgent, false))) return false;
    setTextMode(false);
    try {
      await localParticipant.setMicrophoneEnabled(true);
    } catch (e) {
      console.warn('Mic on failed:', e);
    }
    return true;
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Welcome view */}
        {!isConnected && !requestedChat && (
          <MotionWelcomeView
            key="welcome"
            {...VIEW_MOTION_PROPS}
            startButtonText="Start call"
            onStartCall={startCall}
            onStartText={startText}
            recentChats={recentChats}
          />
        )}
        {/* Text chat view */}
        {((isConnected && textMode) || (!isConnected && requestedChat)) && (
          <TextChatView
            key="text-view"
            onVoice={switchToVoice}
            onContinue={startText}
            onNewChat={startNew}
            savedChat={savedChat}
            savedSummary={savedSummary}
            canResume={canResume}
          />
        )}
        {/* Session view */}
        {isConnected && !textMode && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            preConnectMessage={
              agent.isConnected ? 'Agent is listening, ask it a question' : 'Waiting for agent'
            }
            controls={{
              leave: true,
              microphone: true,
              chat: true,
              camera: isVideoInputSupported,
              screenShare: isVideoInputSupported,
            }}
            isPreConnectBufferEnabled={true}
            themeMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
            className="fixed inset-0"
          />
        )}
      </AnimatePresence>
      {/* What Jarvis is doing right now */}
      {isConnected && !textMode && <JarvisStatus />}
      {/* Hold to talk, plus the noisy-room hint */}
      {isConnected && !textMode && <HoldToTalk />}
      {/* Switch a voice call to typing without hanging up */}
      {isConnected && !textMode && !conversationFull && <TextToggle onText={switchToText} />}
      {isConnected && !textMode && conversationFull && (
        <div className="fixed inset-x-0 top-28 z-[55] flex justify-center">
          <Button onClick={startNew}>Chat is full · Start a new chat</Button>
        </div>
      )}
      {/* Which Claude model Jarvis is using, always visible during a call */}
      {isConnected && !textMode && <ModelPicker />}
    </>
  );
}
