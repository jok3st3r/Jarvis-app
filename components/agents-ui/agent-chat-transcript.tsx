'use client';

import { type ComponentProps, useEffect, useRef } from 'react';
import { Streamdown } from 'streamdown';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import { Message, MessageContent } from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from '@/components/ui/message-scroller';
import type { SavedMessage } from '@/lib/conversations';

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps
  extends ComponentProps<'div'>,
    ComponentProps<typeof MessageScrollerProvider>,
    ComponentProps<typeof MessageScrollerViewport>,
    ComponentProps<typeof MessageScrollerContent> {
  /**
   * Whether to automatically scroll to the bottom of the transcript when new messages are added.
   * Sending a message also jumps to the bottom, even if the reader had scrolled up, unless
   * `scrollAnchor` already anchors local messages.
   * @defaultValue true
   */
  autoScroll?: boolean;
  /**
   * Which messages to use as scroll anchors when auto-scrolling.
   * `true` and `'any'` anchor every message; `false` leaves messages unanchored.
   * `'user'` anchors local messages; `'other'` anchors non-local messages.
   * @defaultValue false
   */
  scrollAnchor?: boolean | 'user' | 'other' | 'any';
  /**
   * The scroll button render function
   */
  scrollButtonRender?: ComponentProps<typeof MessageScrollerButton>['render'];
  /**
   * The scroll button behavior
   */
  scrollButtonBehavior?: ComponentProps<typeof MessageScrollerButton>['behavior'];
  /**
   * The scroll button direction
   */
  scrollButtonDirection?: ComponentProps<typeof MessageScrollerButton>['direction'];
  /**
   * The current state of the agent. When 'thinking', displays a loading indicator.
   */
  agentState?: AgentState;
  /**
   * Array of messages to display in the transcript.
   * @defaultValue []
   */
  messages?: ReceivedMessage[];
  /**
   * Additional CSS class names to apply to the conversation container.
   */
  className?: string;
  /** Render the agent's replies as full-width Markdown in text chat. */
  wideReplies?: boolean;
  savedMessages?: SavedMessage[];
}

function ScrollToEndOnLocalMessage({ messages }: { messages: ReceivedMessage[] }) {
  const { scrollToEnd } = useMessageScroller();
  const lastMessage = messages.at(-1);
  const lastLocalMessageId = lastMessage?.from?.isLocal ? lastMessage.id : undefined;
  // Seeded with the current message so mounting doesn't scroll; `defaultScrollPosition` covers that
  const handledMessageIdRef = useRef(lastLocalMessageId);

  useEffect(() => {
    if (!lastLocalMessageId || lastLocalMessageId === handledMessageIdRef.current) return;
    handledMessageIdRef.current = lastLocalMessageId;
    scrollToEnd();
  }, [lastLocalMessageId, scrollToEnd]);

  return null;
}

/**
 * A chat transcript component that displays a conversation between the user and agent.
 * Shows messages with timestamps and origin indicators, plus a thinking indicator
 * when the agent is processing.
 *
 * @extends ComponentProps<'div'>, ComponentProps<typeof MessageScrollerProvider>, ComponentProps<typeof MessageScrollerViewport>, ComponentProps<typeof MessageScrollerContent>
 *
 *
 * @example
 * ```tsx
 * <AgentChatTranscript
 *   agentState={agentState}
 *   messages={chatMessages}
 * />
 * ```
 */
export function AgentChatTranscript({
  scrollAnchor,
  autoScroll = true,
  scrollMargin,
  scrollEdgeThreshold,
  preserveScrollOnPrepend,
  scrollPreviousItemPeek,
  defaultScrollPosition = 'last-anchor',
  scrollButtonRender,
  scrollButtonBehavior,
  scrollButtonDirection,
  spacerClassName,
  agentState,
  messages = [],
  className,
  wideReplies = false,
  savedMessages = [],
  ...props
}: AgentChatTranscriptProps) {
  const anchorsLocalMessages =
    scrollAnchor === true || scrollAnchor === 'any' || scrollAnchor === 'user';
  const transcript = [
    ...savedMessages.map((m, index) => ({
      id: `saved-${index}`,
      message: m.text,
      isUser: m.role === 'user',
      timestamp: undefined,
    })),
    ...messages.map((m) => ({
      id: m.id,
      message: m.message,
      isUser: Boolean(m.from?.isLocal),
      timestamp: m.timestamp,
    })),
  ];

  return (
    <MessageScrollerProvider
      autoScroll={autoScroll}
      scrollMargin={scrollMargin}
      defaultScrollPosition={defaultScrollPosition}
      scrollEdgeThreshold={scrollEdgeThreshold}
      scrollPreviousItemPeek={scrollPreviousItemPeek}
    >
      {autoScroll && !anchorsLocalMessages && <ScrollToEndOnLocalMessage messages={messages} />}
      <MessageScroller className={className} {...props}>
        <MessageScrollerViewport preserveScrollOnPrepend={preserveScrollOnPrepend}>
          <MessageScrollerContent
            className={wideReplies ? 'gap-6 px-4 py-4 sm:px-6' : undefined}
            spacerClassName={spacerClassName}
            aria-busy={agentState === 'thinking'}
          >
            {transcript.map(({ id, timestamp, isUser, message }) => {
              const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
              const title =
                timestamp === undefined
                  ? undefined
                  : new Date(timestamp).toLocaleTimeString(locale, { timeStyle: 'full' });
              let _scrollAnchor = false;

              if (
                scrollAnchor === true ||
                scrollAnchor === 'any' ||
                (scrollAnchor === 'user' && isUser) ||
                (scrollAnchor === 'other' && !isUser)
              ) {
                _scrollAnchor = true;
              }

              return (
                <MessageScrollerItem key={id} messageId={id} scrollAnchor={_scrollAnchor}>
                  <Message align={isUser ? 'end' : 'start'} title={title}>
                    <MessageContent>
                      {wideReplies && !isUser ? (
                        <article
                          aria-label="Jarvis reply"
                          className="w-full min-w-0 text-base leading-7 wrap-break-word"
                        >
                          <Streamdown className="[&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-5 [&_h3]:mt-4 [&_li]:leading-7 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_strong]:font-bold">
                            {message}
                          </Streamdown>
                        </article>
                      ) : (
                        <Bubble
                          align={isUser ? 'end' : 'start'}
                          variant={isUser ? 'secondary' : 'ghost'}
                        >
                          <BubbleContent>
                            <Streamdown>{message}</Streamdown>
                          </BubbleContent>
                        </Bubble>
                      )}
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}

            {/* Agent is thinking indicator */}
            {agentState === 'thinking' && (
              <MessageScrollerItem>
                <Marker role="status">
                  <MarkerIcon>
                    <AgentChatIndicator size="sm" />
                  </MarkerIcon>
                  <MarkerContent className="shimmer">Thinking...</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        {/* Scroll to bottom button */}
        <MessageScrollerButton
          variant="outline"
          className="rounded-full"
          render={scrollButtonRender}
          behavior={scrollButtonBehavior}
          direction={scrollButtonDirection}
        />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
