/* eslint-disable */
// Text chat vs voice. The app sets a short-lived cookie before starting a session, the token route
// reads it and tells Jarvis (participant attribute "jarvis_mode"), so a text chat starts silent.
export type ChatMode = 'voice' | 'text';

export function setChatMode(mode: ChatMode) {
  document.cookie = `jarvis_mode=${mode}; path=/; max-age=600; samesite=lax`;
}

// Ask Jarvis to switch his voice off ("on" = text only) or back on. Never throws.
export async function askTextMode(localParticipant: any, agent: any, on: boolean) {
  if (!agent || !localParticipant) {
    return false;
  }
  try {
    await localParticipant.performRpc({
      destinationIdentity: agent.identity,
      method: 'set_text_mode',
      payload: on ? 'on' : 'off',
    });
    return true;
  } catch (e) {
    console.warn('Text mode switch failed:', e);
    return false;
  }
}
