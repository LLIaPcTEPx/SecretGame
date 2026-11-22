import React from 'react';
import {
  BookOpen,
  Compass,
  Crosshair,
  Eye,
  Flag,
  Lock,
  Menu,
  Sparkles,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GameSettings, HudSnapshot } from '../types/game';

interface HUDProps {
  hud: HudSnapshot;
  unlockedCount: number;
  settings: GameSettings;
  onOpenIndex: () => void;
  onOpenPause: () => void;
  onToggleShiftLock: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onInteractClick: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  hud,
  unlockedCount,
  settings,
  onOpenIndex,
  onOpenPause,
  onToggleShiftLock,
  onZoomIn,
  onZoomOut,
  onInteractClick,
}) => {
  return (
    <div className="hud-layer">
      {/* 3D Projected Bubble Chat */}
      {hud.bubbleText && hud.bubbleScreenPos.visible && (
        <div
          className="bubble-chat"
          style={{
            left: `${hud.bubbleScreenPos.x}px`,
            top: `${hud.bubbleScreenPos.y}px`,
          }}
        >
          {hud.bubbleText}
        </div>
      )}

      {/* Center Crosshair when ShiftLock or First Person is active */}
      {(hud.shiftLockActive || hud.isFirstPerson) && (
        <div className={`center-reticle ${hud.isFirstPerson ? 'center-reticle--fp' : ''}`}>
          <div className="reticle-dot" />
          <div className="reticle-ring" />
        </div>
      )}

      {/* Top Center: Zone + Status / Race Banner */}
      <div className="hud-top-center">
        <div className="zone-pill">
          <Compass size={15} />
          <span>{hud.zoneName}</span>
          {hud.relicCount > 0 && (
            <span className="relic-badge">★ Реликвии: {hud.relicCount}/3</span>
          )}
        </div>

        {hud.raceTimeLeft !== null && (
          <div className="race-pill">
            <Flag size={14} />
            <span>
              СПИДРАН: {hud.raceZonesCount}/6 зон • {hud.raceTimeLeft.toFixed(1)}с
            </span>
          </div>
        )}

        {hud.statusBanner && <div className="status-banner">{hud.statusBanner}</div>}
      </div>

      {/* Top Right: Secret Counter, Index, Pause */}
      <div className="hud-top-right">
        <button className="hud-chip hud-chip--secrets" onClick={onOpenIndex} title="Открыть Index (Tab)">
          <Sparkles size={16} color="#facc15" />
          <span className="hud-secret-num">{unlockedCount} / 100</span>
        </button>

        <button className="hud-chip hud-chip--accent" onClick={onOpenIndex} title="Index всех секретов (Tab)">
          <BookOpen size={16} />
          <span>Index</span>
          <kbd>Tab</kbd>
        </button>

        <button className="hud-chip" onClick={onOpenPause} title="Пауза и Настройки (Esc)">
          <Menu size={17} />
          <span>Пауза</span>
        </button>
      </div>

      {/* Center Bottom: Interact Prompt [E] */}
      {hud.interactPrompt && (
        <button className="interact-prompt" onClick={onInteractClick}>
          <span className="interact-key">E</span>
          <span>{hud.interactPrompt.replace(/^\[E\]\s*/i, '')}</span>
        </button>
      )}

      {/* Bottom Left: Quick Controls Hint */}
      <div className="hud-bottom-left">
        <div className="mini-controls">
          <span>WASD — ход</span>
          <span>Space — прыжок</span>
          <span>ПКМ/ЛКМ — обзор</span>
          <span>Колёсико/I/O — зум</span>
          <span>Shift — ShiftLock</span>
          <span>/ — чат</span>
        </div>
      </div>

      {/* Bottom Right: ShiftLock, Camera Zoom/FP indicator, Coords */}
      <div className="hud-bottom-right">
        {settings.showCoords && (
          <div className="coords-chip">
            <span>
              X: <b>{hud.x.toFixed(1)}</b> Y: <b>{hud.y.toFixed(1)}</b> Z: <b>{hud.z.toFixed(1)}</b>
            </span>
            <span className="fps-tag">{hud.fps} FPS</span>
          </div>
        )}

        <div className="camera-controls-bar">
          {/* Camera Mode Badge */}
          <div className="cam-mode-chip">
            {hud.isFirstPerson ? (
              <>
                <Eye size={14} color="#38bdf8" />
                <span>1-е лицо</span>
              </>
            ) : hud.isMaxZoomOut ? (
              <>
                <Crosshair size={14} color="#facc15" />
                <span>Взгляд орла</span>
              </>
            ) : (
              <span>Зум: {Math.round(hud.cameraDistance)}м</span>
            )}
          </div>

          <button className="hud-icon-btn" onClick={onZoomIn} title="Приблизить камеру (I / Колёсико вверх)">
            <ZoomIn size={16} />
          </button>
          <button className="hud-icon-btn" onClick={onZoomOut} title="Отдалить камеру (O / Колёсико вниз)">
            <ZoomOut size={16} />
          </button>

          <button
            className={`shiftlock-btn ${hud.shiftLockActive ? 'shiftlock-btn--on' : ''}`}
            onClick={onToggleShiftLock}
            disabled={!settings.shiftLockEnabled}
            title="Переключить ShiftLock (Left Shift)"
          >
            {hud.shiftLockActive ? <Lock size={15} /> : <Unlock size={15} />}
            <span>ShiftLock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
