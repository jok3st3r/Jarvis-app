'use client';

import { useState } from 'react';
import { useLocalParticipant, useVoiceAssistant } from '@livekit/components-react';

// Pick which Claude model Jarvis thinks with. The agent publishes the current one as "jarvis_model".
const MODELS = [
  { key: 'haiku', name: 'Haiku', hint: 'Fast' },
  { key: 'sonnet', name: 'Sonnet', hint: 'Smart' },
  { key: 'opus', name: 'Opus', hint: 'Deep' },
  { key: 'fable', name: 'Fable', hint: 'Max' },
];

const CLS = {
  row: 'flex w-full items-center gap-2 pt-1 pb-2 pl-1',
  label: 'text-muted-foreground font-mono text-[10px] tracking-widest uppercase',
  track: 'bg-muted/70 flex flex-1 gap-1 rounded-full p-1',
  chip: 'flex flex-1 flex-col items-center rounded-full px-2 py-1 text-xs leading-tight transition-colors',
  on: 'bg-primary text-primary-foreground shadow-sm',
  off: 'text-foreground/80 hover:bg-background/70',
  hintOn: 'text-[10px] opacity-80',
  hintOff: 'text-muted-foreground text-[10px]',
};

export function ModelPicker() {
  const { agent, agentAttributes } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [pending, setPending] = useState<string | null>(null);
  const current = agentAttributes?.jarvis_model ?? 'haiku';

  const choose = async (key: string) => {
    if (!agent || key === current || pending) {
      return;
    }
    setPending(key);
    try {
      await localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'set_model',
        payload: key,
      });
    } catch (e) {
      console.warn('Model switch failed:', e);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={CLS.row}>
      <span className={CLS.label}>Brain</span>
      <div className={CLS.track}>
        {MODELS.map((m) => {
          const active = (pending ?? current) === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => choose(m.key)}
              disabled={!agent}
              title={`Switch Jarvis to Claude ${m.name}`}
              className={`${CLS.chip} ${active ? CLS.on : CLS.off}`}
            >
              <span className="font-semibold">{m.name}</span>
              <span className={active ? CLS.hintOn : CLS.hintOff}>
                {pending === m.key ? 'Switching' : m.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
