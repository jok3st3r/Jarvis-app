import { App } from '@/components/app/app';
import { getRecentChats, getSavedChat, summarizeChat } from '@/lib/conversations';

// Token source, in order of precedence: the LiveKit Cloud development token server
// (LIVEKIT_TOKEN_SERVER_ID), the included token endpoint (LIVEKIT_URL, LIVEKIT_API_KEY,
// LIVEKIT_API_SECRET), or the LiveKit homepage agent, which takes voice and text input only.
const tokenServerId = process.env.LIVEKIT_TOKEN_SERVER_ID;
const isHomepageAgent = !tokenServerId && !process.env.LIVEKIT_URL;
const tokenEndpoint = isHomepageAgent
  ? 'https://livekit.com/api/homepage-agent/token'
  : '/api/token';

export default async function Page({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const { chat } = await searchParams;
  const [recents, savedChat] = await Promise.all([
    getRecentChats().catch(() => []),
    typeof chat === 'string' ? getSavedChat(chat).catch(() => null) : null,
  ]);
  return (
    <App
      key={savedChat?.id ?? 'new'}
      tokenServerId={tokenServerId}
      tokenEndpoint={tokenEndpoint}
      agentName={process.env.AGENT_NAME}
      isVideoInputSupported={!isHomepageAgent}
      recentChats={recents}
      savedChat={savedChat}
      savedSummary={savedChat ? summarizeChat(savedChat) : null}
      requestedChat={Boolean(chat)}
    />
  );
}
