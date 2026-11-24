'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
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
}

export function ViewController({ isVideoInputSupported }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const agent = useAgent();
  const { resolvedTheme } = useTheme();
  const { agent: voiceAgent } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [textMode, setTextMode] = useState(false);

  const startCall = () => {
    setChatMode('voice');
    setTextMode(false);
    start();
  };

  const startText = () => {
    setChatMode('text');
    setTextMode(true);
    start({ tracks: { microphone: { enabled: false } } });
  };

  // Mid-call switches: tell Jarvis, then turn the mic off or on.
  const switchToText = async () => {
    setTextMode(true);
    await askTextMode(localParticipant, voiceAgent, true);
    try {
      await localParticipant.setMicrophoneEnabled(false);
    } catch (e) {
      console.warn('Mic off failed:', e);
    }
  };

  const switchToVoice = async () => {
    setTextMode(false);
    await askTextMode(localParticipant, voiceAgent, false);
    try {
      await localParticipant.setMicrophoneEnabled(true);
    } catch (e) {
      console.warn('Mic on failed:', e);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Welcome view */}
        {!isConnected && (
          <MotionWelcomeView
            key="welcome"
            {...VIEW_MOTION_PROPS}
            startButtonText="Start call"
            onStartCall={startCall}
            onStartText={startText}
          />
        )}
        {/* Text chat view */}
        {isConnected && textMode && <TextChatView key="text-view" onVoice={switchToVoice} />}
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
      {isConnected && <JarvisStatus />}
      {/* Hold to talk, plus the noisy-room hint */}
      {isConnected && !textMode && <HoldToTalk />}
      {/* Switch a voice call to typing without hanging up */}
      {isConnected && !textMode && <TextToggle onText={switchToText} />}
      {/* Which Claude model Jarvis is using, always visible during a call */}
      {isConnected && <ModelPicker />}
    </>
  );
}
