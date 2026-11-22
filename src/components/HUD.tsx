import React from 'react';
import {
  Blocks,
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
import { UI_TEXT } from '../i18n/translations';

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
  const lang = settings.language;
  const inCutscene = hud.cutsceneTitle !== null;

  return (
    <div className="hud-layer">
      {/* Cinematic Letterbox Bars & Banner during Lego Construction Cutscene */}
      {inCutscene && (
        <>
          <div className="cutscene-bar cutscene-bar--top" />
          <div className="cutscene-bar cutscene-bar--bottom">
            <div className="cutscene-pill">
              <Blocks size={18} color="#fde047" />
              <span className="cutscene-kicker">{UI_TEXT.buildingStructure[lang]}:</span>
              <span className="cutscene-name">{hud.cutsceneTitle}</span>
            </div>
          </div>
        </>
      )}

      {/* 3D Projected Bubble Chat */}
      {!inCutscene && hud.bubbleText && hud.bubbleScreenPos.visible && (
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
      {!inCutscene && (hud.shiftLockActive || hud.isFirstPerson) && (
        <div className={`center-reticle ${hud.isFirstPerson ? 'center-reticle--fp' : ''}`}>
          <div className="reticle-dot" />
          <div className="reticle-ring" />
        </div>
      )}

      {/* Top Center: Zone + Status / Race Banner */}
      {!inCutscene && (
        <div className="hud-top-center">
          <div className="zone-pill">
            <Compass size={15} />
            <span>{hud.zoneName}</span>
            {hud.relicCount > 0 && (
              <span className="relic-badge">
                ★ {UI_TEXT.relics[lang]}: {hud.relicCount}/3
              </span>
            )}
          </div>

          {hud.raceTimeLeft !== null && (
            <div className="race-pill">
              <Flag size={14} />
              <span>
                {UI_TEXT.speedrun[lang]}: {hud.raceZonesCount}/6 {UI_TEXT.zonesShort[lang]} •{' '}
                {hud.raceTimeLeft.toFixed(1)}
                {UI_TEXT.secShort[lang]}
              </span>
            </div>
          )}

          {hud.statusBanner && <div className="status-banner">{hud.statusBanner}</div>}
        </div>
      )}

      {/* Top Right: Secret Counter, Index, Pause */}
      {!inCutscene && (
        <div className="hud-top-right">
          <button className="hud-chip hud-chip--secrets" onClick={onOpenIndex}>
            <Sparkles size={16} color="#facc15" />
            <span className="hud-secret-num">{unlockedCount} / 100</span>
          </button>

          <button className="hud-chip hud-chip--accent" onClick={onOpenIndex}>
            <BookOpen size={16} />
            <span>{UI_TEXT.index[lang]}</span>
            <kbd>Tab</kbd>
          </button>

          <button className="hud-chip" onClick={onOpenPause}>
            <Menu size={17} />
            <span>{UI_TEXT.pause[lang]}</span>
          </button>
        </div>
      )}

      {/* Center Bottom: Interact Prompt [E] */}
      {!inCutscene && hud.interactPrompt && (
        <button className="interact-prompt" onClick={onInteractClick}>
          <span className="interact-key">E</span>
          <span>{hud.interactPrompt.replace(/^\[E\]\s*/i, '')}</span>
        </button>
      )}

      {/* Bottom Left: Quick Controls Hint */}
      {!inCutscene && (
        <div className="hud-bottom-left">
          <div className="mini-controls">
            <span>{UI_TEXT.miniMove[lang]}</span>
            <span>{UI_TEXT.miniJump[lang]}</span>
            <span>{UI_TEXT.miniLook[lang]}</span>
            <span>{UI_TEXT.miniZoom[lang]}</span>
            <span>{UI_TEXT.miniShift[lang]}</span>
            <span>{UI_TEXT.miniChat[lang]}</span>
          </div>
        </div>
      )}

      {/* Bottom Right: ShiftLock, Camera Zoom/FP indicator, Coords */}
      {!inCutscene && (
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
            <div className="cam-mode-chip">
              {hud.isFirstPerson ? (
                <>
                  <Eye size={14} color="#38bdf8" />
                  <span>{UI_TEXT.firstPerson[lang]}</span>
                </>
              ) : hud.isMaxZoomOut ? (
                <>
                  <Crosshair size={14} color="#facc15" />
                  <span>{UI_TEXT.eagleEye[lang]}</span>
                </>
              ) : (
                <span>
                  {UI_TEXT.zoom[lang]}: {Math.round(hud.cameraDistance)}m
                </span>
              )}
            </div>

            <button className="hud-icon-btn" onClick={onZoomIn} title="Zoom In (I)">
              <ZoomIn size={16} />
            </button>
            <button className="hud-icon-btn" onClick={onZoomOut} title="Zoom Out (O)">
              <ZoomOut size={16} />
            </button>

            <button
              className={`shiftlock-btn ${hud.shiftLockActive ? 'shiftlock-btn--on' : ''}`}
              onClick={onToggleShiftLock}
              disabled={!settings.shiftLockEnabled}
              title="Toggle ShiftLock (Left Shift)"
            >
              {hud.shiftLockActive ? <Lock size={15} /> : <Unlock size={15} />}
              <span>ShiftLock</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
