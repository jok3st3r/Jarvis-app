import { NextResponse } from 'next/server';
import {
  AccessToken,
  type AccessTokenOptions,
  RoomConfiguration,
  type VideoGrant,
} from 'livekit-server-sdk';
import { getSavedChat, summarizeChat } from '@/lib/conversations';
import { redis } from '@/lib/redis';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse room config from request body.
    const body = await req.json();
    const roomConfig = body?.room_config
      ? RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true })
      : new RoomConfiguration();

    // Generate participant token
    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${crypto.randomUUID()}`;
    const roomName = `voice_assistant_room_${crypto.randomUUID()}`;
    const resume = new URL(req.url).searchParams.get('resume');
    if (resume) {
      const chat = await getSavedChat(resume);
      if (!chat) return new NextResponse('Saved chat unavailable', { status: 404 });
      const summary = summarizeChat(chat);
      if (summary.full || summary.expired)
        return new NextResponse('Start a new chat to continue', { status: 409 });
      const result = await redis(['SET', `jarvis:resume:${roomName}`, chat.id, 'EX', '900']);
      if (result !== 'OK') return new NextResponse('Could not reopen chat', { status: 503 });
    }

    // Text chat or voice: the app sets a short-lived "jarvis_mode" cookie, and Jarvis reads it.
    const cookie = req.headers.get('cookie') ?? '';
    const mode = resume || /(?:^|;\s*)jarvis_mode=text(?:;|$)/.test(cookie) ? 'text' : 'voice';

    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
        metadata: mode,
        attributes: { jarvis_mode: mode },
      },
      roomName,
      roomConfig
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName,
      participantToken,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  roomConfig: RoomConfiguration | undefined
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (roomConfig) {
    at.roomConfig = roomConfig;
  }

  return at.toJwt();
}
