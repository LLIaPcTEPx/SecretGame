import React, { useState } from 'react';
import {
  Gamepad2,
  Play,
  RotateCcw,
  Settings,
  Sliders,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { GameSettings } from '../types/game';

interface PauseMenuProps {
  settings: GameSettings;
  onChangeSettings: (next: GameSettings) => void;
  onResume: () => void;
  onRespawn: () => void;
  onResetProgress: () => void;
  onHiddenPiClick: () => void;
  onSettingsTitleTripleClick: () => void;
  unlockedCount: number;
}

const GRAPHICS_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '1 — Минимум',
  2: '2 — Низкая',
  3: '3 — Средняя',
  4: '4 — Высокая',
  5: '5 — Ультра',
};

export const PauseMenu: React.FC<PauseMenuProps> = ({
  settings,
  onChangeSettings,
  onResume,
  onRespawn,
  onResetProgress,
  onHiddenPiClick,
  onSettingsTitleTripleClick,
  unlockedCount,
}) => {
  const [tab, setTab] = useState<'settings' | 'controls'>('settings');
  const [confirmReset, setConfirmReset] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);

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
        {/* Top bar */}
        <div className="pause-header">
          <div className="pause-title-group">
            <Settings size={22} className="spin-slow" />
            <div>
              <h2>ПАУЗА</h2>
              <p>Secret Universe 3D • Секретов: {unlockedCount} / 100</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onResume} title="Продолжить (Esc)">
            <X size={20} />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="pause-tabs">
          <button
            className={`pause-tab ${tab === 'settings' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <Sliders size={16} />
            <span onClick={handleTitleClick}>НАСТРОЙКИ</span>
          </button>
          <button
            className={`pause-tab ${tab === 'controls' ? 'pause-tab--active' : ''}`}
            onClick={() => setTab('controls')}
          >
            <Gamepad2 size={16} />
            <span>УПРАВЛЕНИЕ</span>
          </button>
        </div>

        {/* Content */}
        <div className="pause-body">
          {tab === 'settings' ? (
            <div className="settings-list">
              {/* Graphics Quality (1-5) — Used for multiple secrets! */}
              <div className="setting-row setting-row--graphics">
                <div className="setting-info">
                  <div className="setting-label">Настройка графики (Детализация)</div>
                  <div className="setting-desc">
                    Текущий режим: <strong>{GRAPHICS_LABELS[settings.graphicsQuality]}</strong>.
                    Влияет на тени, туман и скрытые объекты!
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
                        title={`Поставить уровень графики ${lvl}`}
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
                  <div className="setting-label">Чувствительность мыши</div>
                  <div className="setting-desc">Скорость вращения камеры (шаг 0.05)</div>
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
                  <div className="setting-label">Поле зрения (FOV)</div>
                  <div className="setting-desc">Угол обзора камеры в градусах</div>
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
                  <div className="setting-label">Переключатель ShiftLock</div>
                  <div className="setting-desc">Разрешить фиксацию камеры за плечом клавишей Shift</div>
                </div>
                <button
                  className={`toggle-btn ${settings.shiftLockEnabled ? 'toggle-btn--on' : ''}`}
                  onClick={() => patch({ shiftLockEnabled: !settings.shiftLockEnabled })}
                >
                  {settings.shiftLockEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>

              {/* Camera Mode */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Режим камеры</div>
                  <div className="setting-desc">Классическая (свободная) или Следящая за спиной</div>
                </div>
                <div className="segmented-btn">
                  <button
                    className={settings.cameraMode === 'classic' ? 'active' : ''}
                    onClick={() => patch({ cameraMode: 'classic' })}
                  >
                    Классическая
                  </button>
                  <button
                    className={settings.cameraMode === 'follow' ? 'active' : ''}
                    onClick={() => patch({ cameraMode: 'follow' })}
                  >
                    Следящая
                  </button>
                </div>
              </div>

              {/* SFX Volume */}
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">
                    <Volume2 size={14} style={{ display: 'inline', marginRight: 5 }} />
                    Громкость звуков (SFX)
                  </div>
                  <div className="setting-desc">Звуки шагов, прыжков, секретов и кнопок</div>
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
                  <div className="setting-label">Громкость музыки</div>
                  <div className="setting-desc">Космический эмбиент Secret Universe</div>
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
                  <div className="setting-label">Координаты (X, Y, Z) и FPS</div>
                  <div className="setting-desc">Отображать точные координаты на экране</div>
                </div>
                <button
                  className={`toggle-btn ${settings.showCoords ? 'toggle-btn--on' : ''}`}
                  onClick={() => patch({ showCoords: !settings.showCoords })}
                >
                  {settings.showCoords ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>
            </div>
          ) : (
            <div className="controls-grid">
              <div className="control-card">
                <kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd>
                <span>Движение персонажа</span>
              </div>
              <div className="control-card">
                <kbd>Пробел</kbd>
                <span>Прыжок</span>
              </div>
              <div className="control-card">
                <kbd>ПКМ / ЛКМ + мышь</kbd>
                <span>Вращение камеры вокруг персонажа</span>
              </div>
              <div className="control-card">
                <kbd>Колёсико</kbd> / <kbd>I</kbd> <kbd>O</kbd>
                <span>Приблизить (First Person) / Отдалить камеру (Eagle Eye)</span>
              </div>
              <div className="control-card">
                <kbd>Shift</kbd>
                <span>Включить / выключить ShiftLock (как в Роблоксе!)</span>
              </div>
              <div className="control-card">
                <kbd>E</kbd>
                <span>Взаимодействие с кнопками, записками, алтарями, порталами</span>
              </div>
              <div className="control-card">
                <kbd>/</kbd> или <kbd>Enter</kbd>
                <span>Открыть чат и ввести слово или /команду</span>
              </div>
              <div className="control-card">
                <kbd>Tab</kbd>
                <span>Открыть / закрыть Index (100 секретов)</span>
              </div>
              <div className="control-card">
                <kbd>Esc</kbd>
                <span>Пауза и Настройки</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pause-footer">
          <button className="btn-primary" onClick={onResume}>
            <Play size={16} /> Продолжить игру
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              onRespawn();
              onResume();
            }}
          >
            <RotateCcw size={15} /> Респавн
          </button>

          {!confirmReset ? (
            <button className="btn-danger-ghost" onClick={() => setConfirmReset(true)}>
              <Trash2 size={15} /> Сбросить прогресс
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
              Точно сбросить все секреты?
            </button>
          )}

          {/* Hidden Secret #72 Pixel Button ("π") in bottom-right of settings! */}
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
