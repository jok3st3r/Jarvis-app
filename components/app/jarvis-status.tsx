'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useVoiceAssistant } from '@livekit/components-react';

// Shows what Jarvis is doing ("Thinking...", "Checking your calendar...") so a pause never looks frozen.
// The agent publishes its current step as the "jarvis_status" participant attribute.
const WRAPPER_STYLE = {
  position: 'fixed',
  top: 24,
  left: 0,
  right: 0,
  zIndex: 50,
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
} as const;

const PILL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 999,
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  fontSize: 14,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
} as const;

const DOT_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: 'currentColor',
  display: 'inline-block',
} as const;

export function JarvisStatus() {
  const { state, agentAttributes } = useVoiceAssistant();
  let text = agentAttributes?.jarvis_status ?? '';
  if (!text && state === 'thinking') {
    text = 'Thinking';
  }
  if (!text && (state === 'connecting' || state === 'initializing')) {
    text = 'Getting Jarvis ready';
  }
  const show = text.length > 0 && state !== 'speaking';

  return (
    <div style={WRAPPER_STYLE}>
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={PILL_STYLE}
          >
            <motion.span
              style={DOT_STYLE}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span>{text}...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
