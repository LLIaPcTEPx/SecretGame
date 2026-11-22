import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { AuthScreen } from './components/AuthScreen';
import { HUD } from './components/HUD';
import { ChatBox } from './components/ChatBox';
import { IndexModal } from './components/IndexModal';
import { PauseMenu } from './components/PauseMenu';
import { SocialModal } from './components/SocialModal';
import { SecretToast } from './components/SecretToast';
import { InspectModal } from './components/InspectModal';
import { authApi, friendsApi, MultiplayerClient } from './network/MultiplayerClient';
import { soundEngine } from './audio/soundEngine';
import { UI_TEXT, ZONE_NAMES_I18N } from './i18n/translations';
import {
  AuthUser,
  ChatMessage,
  FriendsState,
  GameSettings,
  HudSnapshot,
  InspectContent,
  Language,
  RemotePlayerData,
  SecretDef,
} from './types/game';

const SETTINGS_STORAGE_KEY = 'secret_universe_settings_v2';
const TOKEN_STORAGE_KEY = 'secret_universe_session_token_v1';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'en', // English by default!
  graphicsQuality: 3,
  mouseSensitivity: 1.0,
  fov: 75,
  shiftLockEnabled: true,
  sfxVolume: 70,
  musicVolume: 35,
  showCoords: false,
  cameraMode: 'classic',
};

function loadInitialSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        language: parsed.language === 'ru' ? 'ru' : 'en',
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

const EMPTY_FRIENDS: FriendsState = {
  friends: [],
  incoming: [],
  outgoing: [],
};

export const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const mpRef = useRef<MultiplayerClient | null>(null);

  const [settings, setSettings] = useState<GameSettings>(loadInitialSettings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Auth state (per-tab sessionStorage so first visit always prompts Register/Login, and multi-tab testing works!)
  const [authChecking, setAuthChecking] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Multiplayer & Friends state
  const [serverConnected, setServerConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerData[]>([]);
  const [friendsState, setFriendsState] = useState<FriendsState>(EMPTY_FRIENDS);

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    zone: 'plaza',
    zoneName: ZONE_NAMES_I18N.plaza[loadInitialSettings().language],
    x: 0,
    y: 0.5,
    z: 10,
    fps: 60,
    shiftLockActive: false,
    cameraDistance: 11,
    isFirstPerson: false,
    isMaxZoomOut: false,
    interactPrompt: null,
    statusBanner: null,
    cutsceneTitle: null,
    relicCount: 0,
    raceTimeLeft: null,
    raceZonesCount: 0,
    bubbleText: null,
    bubbleScreenPos: { x: 0, y: 0, visible: false },
  }));

  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [indexOpen, setIndexOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [inspectContent, setInspectContent] = useState<InspectContent | null>(null);
  const [chatFocused, setChatFocused] = useState(false);
  const [chatFocusTrigger, setChatFocusTrigger] = useState<{ seq: number; prefix: string } | null>(null);

  const [toastQueue, setToastQueue] = useState<Array<{ secret: SecretDef; total: number }>>([]);
  const [activeToast, setActiveToast] = useState<{ secret: SecretDef; total: number } | null>(null);

  // Restore session token on tab reload if valid
  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!saved) {
      setAuthChecking(false);
      return;
    }
    authApi
      .me(saved)
      .then((res) => {
        setAuthToken(saved);
        setAuthUser(res.user);
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  // Keep page <title> synchronized with active language
  useEffect(() => {
    document.title = UI_TEXT.appTitle[settings.language];
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Sync UI-blocked & modal-open state to engine
  useEffect(() => {
    const isModal = indexOpen || pauseOpen || socialOpen || inspectContent !== null;
    const blocked = isModal || chatFocused;
    engineRef.current?.setUiBlocked(blocked, isModal);
  }, [indexOpen, pauseOpen, socialOpen, inspectContent, chatFocused]);

  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      const [next, ...rest] = toastQueue;
      setActiveToast(next);
      setToastQueue(rest);
    }
  }, [activeToast, toastQueue]);

  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 4200);
    return () => clearTimeout(t);
  }, [activeToast]);

  // Mount GameEngine + Multiplayer WebSocket immediately once authenticated!
  useEffect(() => {
    if (!authUser || !authToken) return;
    const container = mountRef.current;
    if (!container) return;

    const lang = settingsRef.current.language;
    setMessages([
      {
        id: 'welcome-sys',
        sender: UI_TEXT.systemSender[lang],
        text: UI_TEXT.welcomeChat[lang],
        type: 'system',
        timestamp: Date.now(),
      },
    ]);
    setToastQueue([]);
    setActiveToast(null);
    setRemotePlayers([]);
    setOnlineCount(1);
    setFriendsState(EMPTY_FRIENDS);

    const mp = new MultiplayerClient({
      onConnectionChange: (connected) => setServerConnected(connected),
      onWelcome: (players, count) => {
        setRemotePlayers(players);
        setOnlineCount(count);
        engineRef.current?.setRemotePlayers(players);
      },
      onPlayerJoin: (player, count) => {
        setOnlineCount(count);
        setRemotePlayers((prev) => [...prev.filter((p) => p.userId !== player.userId), player]);
        engineRef.current?.addRemotePlayer(player);
        const curLang = settingsRef.current.language;
        setMessages((prev) => [
          ...prev.slice(-60),
          {
            id: `join-${Date.now()}-${player.userId}`,
            sender: UI_TEXT.systemSender[curLang],
            text:
              curLang === 'ru'
                ? `${player.username} зашёл на сервер!`
                : `${player.username} joined the server!`,
            type: 'system',
            timestamp: Date.now(),
          },
        ]);
      },
      onPlayerLeave: (userId, username, count) => {
        setOnlineCount(count);
        setRemotePlayers((prev) => prev.filter((p) => p.userId !== userId));
        engineRef.current?.removeRemotePlayer(userId);
        const curLang = settingsRef.current.language;
        setMessages((prev) => [
          ...prev.slice(-60),
          {
            id: `leave-${Date.now()}-${userId}`,
            sender: UI_TEXT.systemSender[curLang],
            text:
              curLang === 'ru'
                ? `${username} покинул сервер.`
                : `${username} left the server.`,
            type: 'system',
            timestamp: Date.now(),
          },
        ]);
      },
      onPlayerState: (st) => {
        engineRef.current?.updateRemotePlayerState(st);
        setRemotePlayers((prev) => {
          let changed = false;
          const next = prev.map((p) => {
            if (p.userId !== st.userId) return p;
            if (p.zone !== st.zone || p.secretCount !== st.secretCount) {
              changed = true;
              return { ...p, zone: st.zone, secretCount: st.secretCount };
            }
            return p;
          });
          return changed ? next : prev;
        });
      },
      onPlayerEmote: (pkt) => {
        engineRef.current?.handleRemotePlayerEmote(pkt.userId, pkt.emote);
      },
      onRemoteChat: (pkt) => {
        soundEngine.playChat();
        engineRef.current?.handleRemotePlayerChat(pkt.userId, pkt.text);
        setMessages((prev) => [
          ...prev.slice(-60),
          {
            id: pkt.id,
            sender: pkt.sender,
            text: pkt.text,
            type: 'player',
            color: pkt.avatarColor,
            timestamp: pkt.timestamp,
          },
        ]);
      },
      onHighFive: (ev) => {
        engineRef.current?.handleHighFive(ev);
      },
      onFriendsUpdated: (state) => {
        setFriendsState(state);
        engineRef.current?.setFriendIds(new Set(state.friends.map((f) => f.id)));
      },
      onFriendNotification: (kind, username) => {
        soundEngine.playInteract();
        const curLang = settingsRef.current.language;
        const text =
          kind === 'request'
            ? curLang === 'ru'
              ? `💌 ${username} отправил тебе заявку в друзья! Открой меню Друзей (P).`
              : `💌 ${username} sent you a friend request! Open Friends (P) to accept.`
            : curLang === 'ru'
              ? `⭐ ${username} теперь в твоём списке друзей!`
              : `⭐ ${username} is now your friend!`;
        setMessages((prev) => [
          ...prev.slice(-60),
          {
            id: `fnotif-${Date.now()}`,
            sender: UI_TEXT.systemSender[curLang],
            text,
            type: 'whisper',
            timestamp: Date.now(),
          },
        ]);
      },
    });
    mpRef.current = mp;

    const engine = new GameEngine(container, settingsRef.current, authUser, {
      onHudUpdate: (snap) => setHud(snap),
      onSecretUnlocked: (secret, total) => {
        setUnlockedIds(new Set(engine.secretManager.unlocked));
        setToastQueue((q) => [...q, { secret, total }]);
      },
      onChatMessage: (msg) => {
        setMessages((prev) => [...prev.slice(-60), msg]);
      },
      onClearChat: () => setMessages([]),
      onInspect: (content) => setInspectContent(content),
      onOpenPause: () => {
        setInspectContent((cur) => {
          if (cur) return null;
          setSocialOpen((socOpen) => {
            if (socOpen) return false;
            setIndexOpen((idxOpen) => {
              if (idxOpen) return false;
              setPauseOpen((p) => {
                const next = !p;
                if (next) engine.secretManager.onOpenPause();
                return next;
              });
              return false;
            });
            return false;
          });
          return null;
        });
      },
      onToggleIndex: () => {
        setInspectContent(null);
        setPauseOpen(false);
        setSocialOpen(false);
        setIndexOpen((prev) => {
          const next = !prev;
          if (next) engine.secretManager.onOpenIndex();
          return next;
        });
      },
      onToggleSocial: () => {
        setInspectContent(null);
        setPauseOpen(false);
        setIndexOpen(false);
        setSocialOpen((prev) => !prev);
      },
      onFocusChat: (prefix = '') => {
        setChatFocusTrigger({ seq: Date.now(), prefix });
      },
      onSendState: (st) => mp.sendState(st),
      onSendEmote: (em) => mp.sendEmote(em),
      onSendChat: (text) => mp.sendChat(text),
      onSendHighFive: (targetId) => mp.sendHighFive(targetId),
    });

    engineRef.current = engine;
    setUnlockedIds(new Set(engine.secretManager.unlocked));

    // Connect live WebSocket immediately after engine mounts
    mp.connect(authToken);

    return () => {
      mp.disconnect();
      mpRef.current = null;
      engine.dispose();
      engineRef.current = null;
    };
  }, [authUser, authToken]);

  const handleAuthenticated = useCallback((token: string, user: AuthUser) => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    setAuthUser(user);
  }, []);

  const handleLogout = useCallback(async () => {
    const token = authToken;
    setPauseOpen(false);
    setIndexOpen(false);
    setSocialOpen(false);
    setInspectContent(null);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setAuthUser(null);
    if (token) {
      authApi.logout(token).catch(() => {});
    }
  }, [authToken]);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    engineRef.current?.updateSettings(next);
  }, []);

  const handleChangeLanguage = useCallback(
    (language: Language) => {
      handleSettingsChange({ ...settings, language });
    },
    [settings, handleSettingsChange]
  );

  const handleOpenIndex = useCallback(() => {
    setPauseOpen(false);
    setSocialOpen(false);
    setInspectContent(null);
    setIndexOpen(true);
    engineRef.current?.secretManager.onOpenIndex();
  }, []);

  const handleOpenPause = useCallback(() => {
    setIndexOpen(false);
    setSocialOpen(false);
    setInspectContent(null);
    setPauseOpen(true);
    engineRef.current?.secretManager.onOpenPause();
  }, []);

  const handleOpenSocial = useCallback(() => {
    setIndexOpen(false);
    setPauseOpen(false);
    setInspectContent(null);
    setSocialOpen(true);
  }, []);

  const handleSendChat = useCallback((text: string) => {
    engineRef.current?.sendChat(text);
  }, []);

  const handleResetProgress = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.secretManager.resetProgress();
    setUnlockedIds(new Set());
  }, []);

  // Friends API actions
  const handleSendFriendRequest = useCallback(
    async (username: string) => {
      if (!authToken) throw new Error('No token');
      const res = await friendsApi.sendRequest(authToken, username);
      setFriendsState({ friends: res.friends, incoming: res.incoming, outgoing: res.outgoing });
      engineRef.current?.setFriendIds(new Set(res.friends.map((f) => f.id)));
      return res.status;
    },
    [authToken]
  );

  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      if (!authToken) return;
      const res = await friendsApi.accept(authToken, requestId);
      setFriendsState(res);
      engineRef.current?.setFriendIds(new Set(res.friends.map((f) => f.id)));
    },
    [authToken]
  );

  const handleDeclineRequest = useCallback(
    async (requestId: string) => {
      if (!authToken) return;
      const res = await friendsApi.decline(authToken, requestId);
      setFriendsState(res);
      engineRef.current?.setFriendIds(new Set(res.friends.map((f) => f.id)));
    },
    [authToken]
  );

  const handleRemoveFriend = useCallback(
    async (friendId: string) => {
      if (!authToken) return;
      const res = await friendsApi.remove(authToken, friendId);
      setFriendsState(res);
      engineRef.current?.setFriendIds(new Set(res.friends.map((f) => f.id)));
    },
    [authToken]
  );

  const handleTeleportToFriend = useCallback((friendId: string) => {
    engineRef.current?.teleportToPlayer(friendId);
  }, []);

  if (authChecking) {
    return (
      <div className="auth-screen">
        <div className="auth-loading">{UI_TEXT.authConnecting[settings.language]}</div>
      </div>
    );
  }

  if (!authUser || !authToken) {
    return (
      <AuthScreen
        language={settings.language}
        onChangeLanguage={handleChangeLanguage}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const inCutscene = hud.cutsceneTitle !== null;

  return (
    <div className="game-root">
      <div className="canvas-container" ref={mountRef} />

      <HUD
        hud={hud}
        unlockedCount={unlockedIds.size}
        settings={settings}
        username={authUser.username}
        onlineCount={onlineCount}
        serverConnected={serverConnected}
        pendingRequestsCount={friendsState.incoming.length}
        onOpenIndex={handleOpenIndex}
        onOpenPause={handleOpenPause}
        onOpenSocial={handleOpenSocial}
        onToggleShiftLock={() => engineRef.current?.toggleShiftLock()}
        onZoomIn={() => engineRef.current?.adjustZoom(-4.5)}
        onZoomOut={() => engineRef.current?.adjustZoom(4.5)}
        onInteractClick={() => engineRef.current?.triggerInteract()}
      />

      {!inCutscene && (
        <ChatBox
          messages={messages}
          language={settings.language}
          onSend={handleSendChat}
          focusTrigger={chatFocusTrigger}
          onInputFocusChange={setChatFocused}
        />
      )}

      <SecretToast
        secret={activeToast?.secret ?? null}
        totalUnlocked={activeToast?.total ?? unlockedIds.size}
        language={settings.language}
      />

      {indexOpen && (
        <IndexModal
          unlockedIds={unlockedIds}
          language={settings.language}
          onClose={() => setIndexOpen(false)}
          onSearchChange={(q) => engineRef.current?.secretManager.onIndexSearch(q)}
          onCounterClicks={(c) => engineRef.current?.secretManager.onIndexCounterClicks(c)}
          onWelcomeBadgeClick={() => engineRef.current?.secretManager.onArchitectIndexBadge()}
        />
      )}

      {socialOpen && (
        <SocialModal
          selfUser={authUser}
          selfZone={hud.zone}
          selfSecretsCount={unlockedIds.size}
          remotePlayers={remotePlayers}
          friendsState={friendsState}
          language={settings.language}
          onClose={() => setSocialOpen(false)}
          onSendFriendRequest={handleSendFriendRequest}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          onRemoveFriend={handleRemoveFriend}
          onTeleportToFriend={handleTeleportToFriend}
        />
      )}

      {pauseOpen && (
        <PauseMenu
          settings={settings}
          username={authUser.username}
          onChangeSettings={handleSettingsChange}
          onResume={() => setPauseOpen(false)}
          onRespawn={() => engineRef.current?.respawn()}
          onResetProgress={handleResetProgress}
          onLogout={handleLogout}
          onHiddenPiClick={() => engineRef.current?.secretManager.onHiddenPiClick()}
          onSettingsTitleTripleClick={() => engineRef.current?.secretManager.onArchitectSettingsTitle()}
          unlockedCount={unlockedIds.size}
        />
      )}

      <InspectModal
        content={inspectContent}
        language={settings.language}
        onClose={() => setInspectContent(null)}
      />
    </div>
  );
};

export default App;
