import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { HUD } from './components/HUD';
import { ChatBox } from './components/ChatBox';
import { IndexModal } from './components/IndexModal';
import { PauseMenu } from './components/PauseMenu';
import { SecretToast } from './components/SecretToast';
import { InspectModal } from './components/InspectModal';
import { UI_TEXT, ZONE_NAMES_I18N } from './i18n/translations';
import { ChatMessage, GameSettings, HudSnapshot, InspectContent, SecretDef } from './types/game';

const SETTINGS_STORAGE_KEY = 'secret_universe_settings_v2';

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

export const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [settings, setSettings] = useState<GameSettings>(loadInitialSettings);
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const lang = loadInitialSettings().language;
    return [
      {
        id: 'welcome-sys',
        sender: UI_TEXT.systemSender[lang],
        text: UI_TEXT.welcomeChat[lang],
        type: 'system',
        timestamp: Date.now(),
      },
    ];
  });

  const [indexOpen, setIndexOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [inspectContent, setInspectContent] = useState<InspectContent | null>(null);
  const [chatFocused, setChatFocused] = useState(false);
  const [chatFocusTrigger, setChatFocusTrigger] = useState<{ seq: number; prefix: string } | null>(null);

  const [toastQueue, setToastQueue] = useState<Array<{ secret: SecretDef; total: number }>>([]);
  const [activeToast, setActiveToast] = useState<{ secret: SecretDef; total: number } | null>(null);

  // Keep page <title> synchronized with active language
  useEffect(() => {
    document.title = UI_TEXT.appTitle[settings.language];
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Sync UI-blocked & modal-open state to engine
  useEffect(() => {
    const isModal = indexOpen || pauseOpen || inspectContent !== null;
    const blocked = isModal || chatFocused;
    engineRef.current?.setUiBlocked(blocked, isModal);
  }, [indexOpen, pauseOpen, inspectContent, chatFocused]);

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
    setUnlockedIds(new Set());
  }, []);

  const inCutscene = hud.cutsceneTitle !== null;

  return (
    <div className="game-root">
      <div className="canvas-container" ref={mountRef} />

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

      <InspectModal
        content={inspectContent}
        language={settings.language}
        onClose={() => setInspectContent(null)}
      />
    </div>
  );
};

export default App;
