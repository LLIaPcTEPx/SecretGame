import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { HUD } from './components/HUD';
import { ChatBox } from './components/ChatBox';
import { IndexModal } from './components/IndexModal';
import { PauseMenu } from './components/PauseMenu';
import { SecretToast } from './components/SecretToast';
import { InspectModal } from './components/InspectModal';
import { ChatMessage, GameSettings, HudSnapshot, InspectContent, SecretDef } from './types/game';

const SETTINGS_STORAGE_KEY = 'secret_universe_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 3,
  mouseSensitivity: 1.0,
  fov: 75,
  shiftLockEnabled: true,
  sfxVolume: 70,
  musicVolume: 35,
  showCoords: false,
  cameraMode: 'classic',
};

const INITIAL_HUD: HudSnapshot = {
  zone: 'plaza',
  zoneName: 'Площадь Спавна',
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
  relicCount: 0,
  raceTimeLeft: null,
  raceZonesCount: 0,
  bubbleText: null,
  bubbleScreenPos: { x: 0, y: 0, visible: false },
};

function loadInitialSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [settings, setSettings] = useState<GameSettings>(loadInitialSettings);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-sys',
      sender: 'Система',
      text: 'Добро пожаловать в Secret Universe 3D! Найди все 100 секретов. Введи /help или нажми Tab для Index.',
      type: 'system',
      timestamp: Date.now(),
    },
  ]);

  const [indexOpen, setIndexOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [inspectContent, setInspectContent] = useState<InspectContent | null>(null);
  const [chatFocused, setChatFocused] = useState(false);
  const [chatFocusTrigger, setChatFocusTrigger] = useState<{ seq: number; prefix: string } | null>(null);

  // Toast queue for secret unlocks
  const [toastQueue, setToastQueue] = useState<Array<{ secret: SecretDef; total: number }>>([]);
  const [activeToast, setActiveToast] = useState<{ secret: SecretDef; total: number } | null>(null);

  // Sync UI-blocked state to engine
  useEffect(() => {
    const blocked = indexOpen || pauseOpen || inspectContent !== null || chatFocused;
    engineRef.current?.setUiBlocked(blocked);
  }, [indexOpen, pauseOpen, inspectContent, chatFocused]);

  // Process toast queue
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

  // Mount Three.js engine once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, settings, {
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
          setIndexOpen((idxOpen) => {
            if (idxOpen) return false;
            setPauseOpen((p) => {
              const next = !p;
              if (next) engine.secretManager.onOpenPause();
              return next;
            });
            return false;
          });
          return null;
        });
      },
      onToggleIndex: () => {
        setInspectContent(null);
        setPauseOpen(false);
        setIndexOpen((prev) => {
          const next = !prev;
          if (next) engine.secretManager.onOpenIndex();
          return next;
        });
      },
      onFocusChat: (prefix = '') => {
        setChatFocusTrigger({ seq: Date.now(), prefix });
      },
    });

    engineRef.current = engine;
    setUnlockedIds(new Set(engine.secretManager.unlocked));

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    engineRef.current?.updateSettings(next);
  }, []);

  const handleOpenIndex = useCallback(() => {
    setPauseOpen(false);
    setInspectContent(null);
    setIndexOpen(true);
    engineRef.current?.secretManager.onOpenIndex();
  }, []);

  const handleOpenPause = useCallback(() => {
    setIndexOpen(false);
    setInspectContent(null);
    setPauseOpen(true);
    engineRef.current?.secretManager.onOpenPause();
  }, []);

  const handleSendChat = useCallback((text: string) => {
    engineRef.current?.sendChat(text);
  }, []);

  const handleResetProgress = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.secretManager.resetProgress();
    setUnlockedIds(new Set(engineRef.current.secretManager.unlocked));
    engineRef.current.respawn();
  }, []);

  return (
    <div className="game-root">
      {/* 3D WebGL Viewport */}
      <div className="canvas-container" ref={mountRef} />

      {/* Main HUD Overlay */}
      <HUD
        hud={hud}
        unlockedCount={unlockedIds.size}
        settings={settings}
        onOpenIndex={handleOpenIndex}
        onOpenPause={handleOpenPause}
        onToggleShiftLock={() => engineRef.current?.toggleShiftLock()}
        onZoomIn={() => engineRef.current?.adjustZoom(-4.5)}
        onZoomOut={() => engineRef.current?.adjustZoom(4.5)}
        onInteractClick={() => engineRef.current?.triggerInteract()}
      />

      {/* Roblox-style Chat Box */}
      <ChatBox
        messages={messages}
        onSend={handleSendChat}
        focusTrigger={chatFocusTrigger}
        onInputFocusChange={setChatFocused}
      />

      {/* Secret Unlocked Toast */}
      <SecretToast
        secret={activeToast?.secret ?? null}
        totalUnlocked={activeToast?.total ?? unlockedIds.size}
      />

      {/* Index Modal (100 Secrets + Difficulty Chart) */}
      {indexOpen && (
        <IndexModal
          unlockedIds={unlockedIds}
          onClose={() => setIndexOpen(false)}
          onSearchChange={(q) => engineRef.current?.secretManager.onIndexSearch(q)}
          onCounterClicks={(c) => engineRef.current?.secretManager.onIndexCounterClicks(c)}
          onWelcomeBadgeClick={() => engineRef.current?.secretManager.onArchitectIndexBadge()}
        />
      )}

      {/* Pause & Settings Modal */}
      {pauseOpen && (
        <PauseMenu
          settings={settings}
          onChangeSettings={handleSettingsChange}
          onResume={() => setPauseOpen(false)}
          onRespawn={() => engineRef.current?.respawn()}
          onResetProgress={handleResetProgress}
          onHiddenPiClick={() => engineRef.current?.secretManager.onHiddenPiClick()}
          onSettingsTitleTripleClick={() => engineRef.current?.secretManager.onArchitectSettingsTitle()}
          unlockedCount={unlockedIds.size}
        />
      )}

      {/* Inspect Modal for 3D Plaques, Books, Keyholes, Ciphers */}
      <InspectModal content={inspectContent} onClose={() => setInspectContent(null)} />
    </div>
  );
};

export default App;
