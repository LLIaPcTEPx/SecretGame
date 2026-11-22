import React, { useState } from 'react';
import {
  Gamepad2,
  Globe,
  LogOut,
  Play,
  RotateCcw,
  Settings,
  Sliders,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { GameSettings } from '../types/game';
import { GRAPHICS_LABELS_I18N, UI_TEXT } from '../i18n/translations';

interface PauseMenuProps {
  settings: GameSettings;
  username: string;
  onChangeSettings: (next: GameSettings) => void;
  onResume: () => void;
  onRespawn: () => void;
  onResetProgress: () => void;
  onLogout: () => void;
  onHiddenPiClick: () => void;
  onSettingsTitleTripleClick: () => void;
  unlockedCount: number;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  settings,
  username,
  onChangeSettings,
  onResume,
  onRespawn,
  onResetProgress,
  onLogout,
  onHiddenPiClick,
  onSettingsTitleTripleClick,
  unlockedCount,
}) => {
  const [tab, setTab] = useState<'settings' | 'controls'>('settings');
  const [confirmReset, setConfirmReset] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);

  const lang = settings.language;

  const patch = (partial: Partial<GameSettings>) => {
    onChangeSettings({ ...settings, ...partial });
  };

  const setGraphics = (lvl: number) => {
    const clamped = Math.max(1, Math.min(5, lvl)) as 1 | 2 | 3 | 4 | 5;
    patch({ graphicsQuality: clamped });
  };

  const handleTitleClick = () => {
    const next = titleClicks + 1;
    setTitleClicks(next);
    if (next >= 3) {
      onSettingsTitleTripleClick();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onResume}>
      <div className="pause-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pause-header">
          <div className="pause-title-group">
            <Settings size={22} className="spin-slow" />
            <div>
              <h2>{UI_TEXT.pauseTitle[lang]}</h2>
              <p>
                @{username} • {UI_TEXT.secretsCountLabel[lang]}: {unlockedCount} / 100
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onResume}>
            <X size={20} />
          </button>
        </div>

        <div className="pause-tabs">
          <button
            className={`pause-tab ${tab === 'settings' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <Sliders size={16} />
            <span onClick={handleTitleClick}>{UI_TEXT.tabSettings[lang]}</span>
          </button>
          <button
            className={`pause-tab ${tab === 'controls' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('controls')}
          >
            <Gamepad2 size={16} />
            <span>{UI_TEXT.tabControls[lang]}</span>
          </button>
        </div>

        <div className="pause-body">
          {tab === 'settings' ? (
            <div className="settings-list">
              {/* Language Switcher (English / Русский) */}
              <div className="setting-row setting-row--lang">
                <div className="setting-info">
                  <div className="setting-label">
                    <Globe size={14} style={{ display: 'inline', marginRight: 6 }} />
                    {UI_TEXT.languageLabel[lang]}
                  </div>
                  <div className="setting-desc">{UI_TEXT.languageDesc[lang]}</div>
                </div>
                <div className="segmented-btn">
                  <button
                    className={lang === 'en' ? 'active' : ''}
                    onClick={() => patch({ language: 'en' })}
                  >
                    English
                  </button>
                  <button
                    className={lang === 'ru' ? 'active' : ''}
                    onClick={() => patch({ language: 'ru' })}
                  >
                    Русский
                  </button>
                </div>
              </div>

              {/* Graphics Quality (1-5) */}
              <div className="setting-row setting-row--graphics">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.graphicsLabel[lang]}</div>
                  <div className="setting-desc">
                    {UI_TEXT.graphicsCurrent[lang]}{' '}
                    <strong>{GRAPHICS_LABELS_I18N[settings.graphicsQuality][lang]}</strong>.{' '}
                    {UI_TEXT.graphicsHint[lang]}
                  </div>
                </div>
                <div className="graphics-control">
                  <button
                    className="step-btn"
                    onClick={() => setGraphics(settings.graphicsQuality - 1)}
                    disabled={settings.graphicsQuality <= 1}
                  >
                    −
                  </button>
                  <div className="graphics-bars">
                    {([1, 2, 3, 4, 5] as const).map((lvl) => (
                      <button
                        key={lvl}
                        className={`gfx-bar ${settings.graphicsQuality >= lvl ? 'gfx-bar--on' : ''} ${
                          settings.graphicsQuality === lvl ? 'gfx-bar--current' : ''
                        }`}
                        onClick={() => setGraphics(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <button
                    className="step-btn"
                    onClick={() => setGraphics(settings.graphicsQuality + 1)}
                    disabled={settings.graphicsQuality >= 5}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Mouse Sensitivity */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.sensLabel[lang]}</div>
                  <div className="setting-desc">{UI_TEXT.sensDesc[lang]}</div>
                </div>
                <div className="slider-control">
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.05}
                    value={settings.mouseSensitivity}
                    onChange={(e) => patch({ mouseSensitivity: Number(e.target.value) })}
                  />
                  <span className="slider-val">{settings.mouseSensitivity.toFixed(2)}</span>
                </div>
              </div>

              {/* FOV */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.fovLabel[lang]}</div>
                  <div className="setting-desc">{UI_TEXT.fovDesc[lang]}</div>
                </div>
                <div className="slider-control">
                  <input
                    type="range"
                    min={50}
                    max={110}
                    step={1}
                    value={settings.fov}
                    onChange={(e) => patch({ fov: Number(e.target.value) })}
                  />
                  <span className="slider-val">{settings.fov}°</span>
                </div>
              </div>

              {/* ShiftLock Switch */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.shiftLockLabel[lang]}</div>
                  <div className="setting-desc">{UI_TEXT.shiftLockDesc[lang]}</div>
                </div>
                <button
                  className={`toggle-btn ${settings.shiftLockEnabled ? 'toggle-btn--on' : ''}`}
                  onClick={() => patch({ shiftLockEnabled: !settings.shiftLockEnabled })}
                >
                  {settings.shiftLockEnabled ? UI_TEXT.on[lang] : UI_TEXT.off[lang]}
                </button>
              </div>

              {/* Camera Mode */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.cameraModeLabel[lang]}</div>
                  <div className="setting-desc">{UI_TEXT.cameraModeDesc[lang]}</div>
                </div>
                <div className="segmented-btn">
                  <button
                    className={settings.cameraMode === 'classic' ? 'active' : ''}
                    onClick={() => patch({ cameraMode: 'classic' })}
                  >
                    {UI_TEXT.camClassic[lang]}
                  </button>
                  <button
                    className={settings.cameraMode === 'follow' ? 'active' : ''}
                    onClick={() => patch({ cameraMode: 'follow' })}
                  >
                    {UI_TEXT.camFollow[lang]}
                  </button>
                </div>
              </div>

              {/* SFX Volume */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">
                    <Volume2 size={14} style={{ display: 'inline', marginRight: 5 }} />
                    {UI_TEXT.sfxLabel[lang]}
                  </div>
                  <div className="setting-desc">{UI_TEXT.sfxDesc[lang]}</div>
                </div>
                <div className="slider-control">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.sfxVolume}
                    onChange={(e) => patch({ sfxVolume: Number(e.target.value) })}
                  />
                  <span className="slider-val">{settings.sfxVolume}%</span>
                </div>
              </div>

              {/* Music Volume */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.musicLabel[lang]}</div>
                  <div className="setting-desc">{UI_TEXT.musicDesc[lang]}</div>
                </div>
                <div className="slider-control">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.musicVolume}
                    onChange={(e) => patch({ musicVolume: Number(e.target.value) })}
                  />
                  <span className="slider-val">{settings.musicVolume}%</span>
                </div>
              </div>

              {/* Show Coords / FPS */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">{UI_TEXT.coordsLabel[lang]}</div>
                  <div className="setting-desc">{UI_TEXT.coordsDesc[lang]}</div>
                </div>
                <button
                  className={`toggle-btn ${settings.showCoords ? 'toggle-btn--on' : ''}`}
                  onClick={() => patch({ showCoords: !settings.showCoords })}
                >
                  {settings.showCoords ? UI_TEXT.on[lang] : UI_TEXT.off[lang]}
                </button>
              </div>
            </div>
          ) : (
            <div className="controls-grid">
              <div className="control-card">
                <kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd>
                <span>{UI_TEXT.ctrlMove[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>{UI_TEXT.ctrlSpace[lang]}</kbd>
                <span>{UI_TEXT.ctrlJump[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>{UI_TEXT.ctrlMouse[lang]}</kbd>
                <span>{UI_TEXT.ctrlOrbit[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>{UI_TEXT.ctrlZoomKey[lang]}</kbd> / <kbd>I</kbd> <kbd>O</kbd>
                <span>{UI_TEXT.ctrlZoomDesc[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>Shift</kbd>
                <span>{UI_TEXT.ctrlShiftDesc[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>E</kbd>
                <span>{UI_TEXT.ctrlInteract[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>/</kbd> {UI_TEXT.ctrlChatKey[lang]}
                <span>{UI_TEXT.ctrlChatDesc[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>Tab</kbd>
                <span>{UI_TEXT.ctrlIndexDesc[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>P</kbd>
                <span>{UI_TEXT.ctrlSocialDesc[lang]}</span>
              </div>
              <div className="control-card">
                <kbd>Esc</kbd>
                <span>{UI_TEXT.ctrlPauseDesc[lang]}</span>
              </div>
            </div>
          )}
        </div>

        <div className="pause-footer">
          <button className="btn-primary" onClick={onResume}>
            <Play size={16} /> {UI_TEXT.resumeBtn[lang]}
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              onRespawn();
              onResume();
            }}
          >
            <RotateCcw size={15} /> {UI_TEXT.respawnBtn[lang]}
          </button>

          {!confirmReset ? (
            <button className="btn-danger-ghost" onClick={() => setConfirmReset(true)}>
              <Trash2 size={15} /> {UI_TEXT.resetBtn[lang]}
            </button>
          ) : (
            <button
              className="btn-danger"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
                onResume();
              }}
            >
              {UI_TEXT.resetConfirm[lang]}
            </button>
          )}

          <button className="btn-secondary" onClick={onLogout}>
            <LogOut size={15} /> {UI_TEXT.logoutBtn[lang]}
          </button>

          {tab === 'settings' && (
            <button
              className="hidden-pi-btn"
              onClick={onHiddenPiClick}
              title="3.14159..."
              aria-label="pi"
            >
              π
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
