import {
  AuthUser,
  FriendsState,
  HighFiveEvent,
  RemotePlayerData,
  ZoneId,
} from '../types/game';

export interface RemoteChatPacket {
  id: string;
  userId: string;
  sender: string;
  avatarColor: string;
  text: string;
  timestamp: number;
}

export interface RemoteEmotePacket {
  userId: string;
  username: string;
  emote: string;
  x: number;
  y: number;
  z: number;
  ts: number;
}

export interface MultiplayerCallbacks {
  onConnectionChange: (connected: boolean) => void;
  onWelcome: (players: RemotePlayerData[], onlineCount: number) => void;
  onPlayerJoin: (player: RemotePlayerData, onlineCount: number) => void;
  onPlayerLeave: (userId: string, username: string, onlineCount: number) => void;
  onPlayerState: (state: {
    userId: string;
    x: number;
    y: number;
    z: number;
    yaw: number;
    speed: number;
    grounded: boolean;
    velY: number;
    zone: ZoneId;
    secretCount: number;
  }) => void;
  onPlayerEmote: (packet: RemoteEmotePacket) => void;
  onRemoteChat: (packet: RemoteChatPacket) => void;
  onHighFive: (event: HighFiveEvent) => void;
  onFriendsUpdated: (state: FriendsState) => void;
  onFriendNotification: (kind: 'request' | 'accepted', username: string) => void;
}

export class ApiError extends Error {
  public readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function apiJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError('NETWORK_ERROR');
  }

  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new ApiError(typeof data.errorCode === 'string' ? data.errorCode : 'SERVER_ERROR');
  }
  return data as T;
}

export const authApi = {
  register(username: string, password: string, avatarColor: string) {
    return apiJson<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, avatarColor }),
    });
  },
  login(username: string, password: string) {
    return apiJson<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  me(token: string) {
    return apiJson<{ user: AuthUser }>('/api/auth/me', { method: 'GET' }, token);
  },
  logout(token: string) {
    return apiJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }, token);
  },
};

export const friendsApi = {
  getAll(token: string) {
    return apiJson<FriendsState>('/api/friends', { method: 'GET' }, token);
  },
  sendRequest(token: string, username: string) {
    return apiJson<{ status: 'sent' | 'accepted' } & FriendsState>(
      '/api/friends/request',
      {
        method: 'POST',
        body: JSON.stringify({ username }),
      },
      token
    );
  },
  accept(token: string, requestId: string) {
    return apiJson<FriendsState>(
      '/api/friends/accept',
      {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      },
      token
    );
  },
  decline(token: string, requestId: string) {
    return apiJson<FriendsState>(
      '/api/friends/decline',
      {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      },
      token
    );
  },
  remove(token: string, friendId: string) {
    return apiJson<FriendsState>(
      '/api/friends/remove',
      {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      },
      token
    );
  },
};

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private cb: MultiplayerCallbacks;
  private shouldReconnect = false;
  private reconnectTimer: number | null = null;
  private lastStateSent = 0;

  constructor(callbacks: MultiplayerCallbacks) {
    this.cb = callbacks;
  }

  public connect(token: string): void {
    this.token = token;
    this.shouldReconnect = true;
    this.openSocket();
  }

  private openSocket(): void {
    if (!this.token) return;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws?token=${encodeURIComponent(this.token)}`;
    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.cb.onConnectionChange(true);
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      switch (msg.type) {
        case 'welcome':
          this.cb.onWelcome(
            (msg.players as RemotePlayerData[]) || [],
            Number(msg.onlineCount) || 1
          );
          break;
        case 'player_join':
          this.cb.onPlayerJoin(
            msg.player as RemotePlayerData,
            Number(msg.onlineCount) || 1
          );
          break;
        case 'player_leave':
          this.cb.onPlayerLeave(
            String(msg.userId),
            String(msg.username),
            Number(msg.onlineCount) || 1
          );
          break;
        case 'player_state':
          this.cb.onPlayerState({
            userId: String(msg.userId),
            x: Number(msg.x) || 0,
            y: Number(msg.y) || 0,
            z: Number(msg.z) || 0,
            yaw: Number(msg.yaw) || 0,
            speed: Number(msg.speed) || 0,
            grounded: Boolean(msg.grounded),
            velY: Number(msg.velY) || 0,
            zone: (msg.zone as ZoneId) || 'plaza',
            secretCount: Number(msg.secretCount) || 0,
          });
          break;
        case 'player_emote':
          this.cb.onPlayerEmote(msg as unknown as RemoteEmotePacket);
          break;
        case 'chat':
          this.cb.onRemoteChat(msg as unknown as RemoteChatPacket);
          break;
        case 'high_five':
          this.cb.onHighFive(msg as unknown as HighFiveEvent);
          break;
        case 'friends_updated':
          this.cb.onFriendsUpdated({
            friends: (msg.friends as FriendsState['friends']) || [],
            incoming: (msg.incoming as FriendsState['incoming']) || [],
            outgoing: (msg.outgoing as FriendsState['outgoing']) || [],
          });
          break;
        case 'friend_notification':
          this.cb.onFriendNotification(
            msg.kind === 'accepted' ? 'accepted' : 'request',
            String(msg.username || '')
          );
          break;
      }
    };

    ws.onclose = (ev) => {
      this.cb.onConnectionChange(false);
      // 4000 means replaced by another tab of same account; do not loop aggressively
      if (this.shouldReconnect && ev.code !== 4000 && ev.code !== 1000) {
        this.reconnectTimer = window.setTimeout(() => {
          this.openSocket();
        }, 1800);
      }
    };

    ws.onerror = () => {
      // handled by onclose
    };
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnect');
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public sendState(state: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    speed: number;
    grounded: boolean;
    velY: number;
    zone: ZoneId;
    secretCount: number;
  }): void {
    const now = performance.now();
    if (now - this.lastStateSent < 50) return; // ~20Hz
    this.lastStateSent = now;
    this.send({ type: 'state', ...state });
  }

  public sendEmote(emote: string): void {
    this.send({ type: 'emote', emote });
  }

  public sendChat(text: string): void {
    this.send({ type: 'chat', text });
  }

  public sendHighFive(targetUserId: string): void {
    this.send({ type: 'high_five', targetUserId });
  }
}
