'use client';

import { type PointerEvent, useCallback, useRef, useState } from 'react';
import { useLocalParticipant, useVoiceAssistant } from '@livekit/components-react';

// Hold to talk: while the button is held, Jarvis stops talking, listens only for you,
// and answers even in noisy mode (no need to say "Jarvis"). Letting go sends what you said.
const WRAPPER_STYLE = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 150,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  pointerEvents: 'none',
} as const;

const CHIP_STYLE = {
  padding: '4px 10px',
  borderRadius: 999,
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  fontSize: 12,
} as const;

function buttonStyle(held: boolean) {
  return {
    pointerEvents: 'auto',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    padding: '14px 26px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: held ? 'var(--primary)' : 'var(--popover)',
    color: held ? 'var(--primary-foreground)' : 'var(--popover-foreground)',
    fontSize: 15,
    fontWeight: 600,
    boxShadow: held ? '0 0 0 6px rgba(127, 127, 127, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.12)',
    transform: held ? 'scale(1.06)' : 'scale(1)',
    transition: 'all 120ms ease',
  } as const;
}

export function HoldToTalk() {
  const { agent, agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [held, setHeld] = useState(false);
  const holding = useRef(false);
  const noisy = agentAttributes?.jarvis_noisy === '1';

  const tell = useCallback(
    async (method: string) => {
      if (!agent) {
        return;
      }
      try {
        await localParticipant.performRpc({
          destinationIdentity: agent.identity,
          method,
          payload: '',
        });
      } catch (e) {
        console.warn('Hold to talk:', method, e);
      }
    },
    [agent, localParticipant]
  );

  const press = useCallback(
    async (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      // Keep the hold even if a thumb slides a little off the button.
      e.currentTarget.setPointerCapture(e.pointerId);
      if (holding.current) {
        return;
      }
      holding.current = true;
      setHeld(true);
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
      if (!localParticipant.isMicrophoneEnabled) {
        await localParticipant.setMicrophoneEnabled(true);
      }
      await tell('ptt_start');
    },
    [localParticipant, tell]
  );

  const release = useCallback(async () => {
    if (!holding.current) {
      return;
    }
    holding.current = false;
    setHeld(false);
    await tell('ptt_end');
  }, [tell]);

  if (!agent) {
    return null;
  }

  return (
    <div style={WRAPPER_STYLE}>
      {noisy && !held && <span style={CHIP_STYLE}>Noisy room: start with &quot;Jarvis&quot;</span>}
      <button
        type="button"
        style={buttonStyle(held)}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        {held ? 'Listening... let go to send' : 'Hold to talk'}
      </button>
    </div>
  );
}
