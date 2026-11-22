import { Language, LocalizedText, SecretCategory, ZoneId } from '../types/game';

export function pick(text: LocalizedText, lang: Language): string {
  return text[lang];
}

export const ZONE_NAMES_I18N: Record<ZoneId, LocalizedText> = {
  plaza: { en: 'Spawn Plaza', ru: 'Площадь Спавна' },
  forest: { en: 'Whispering Forest', ru: 'Шепчущий Лес' },
  library: { en: 'Cipher Library', ru: 'Библиотека Шифров' },
  lab: { en: 'Tech Lab', ru: 'Техно-Лаборатория' },
  volcano: { en: 'Volcanic Cavern', ru: 'Вулканическая Пещера' },
  sky: { en: 'Sky Observatory', ru: 'Небесная Обсерватория' },
  void: { en: 'Glitch Void Island', ru: 'Остров Бездны' },
};

export const CATEGORY_LABELS_I18N: Record<SecretCategory, LocalizedText> = {
  exploration: { en: 'Exploration', ru: 'Исследование' },
  camera: { en: 'Camera', ru: 'Камера' },
  chat: { en: 'Chat', ru: 'Чат' },
  command: { en: 'Command /', ru: 'Команда /' },
  cipher: { en: 'Cipher', ru: 'Шифр' },
  sequence: { en: 'Sequence', ru: 'Порядок' },
  settings: { en: 'Settings', ru: 'Настройки' },
  parkour: { en: 'Parkour', ru: 'Паркур' },
  meta: { en: 'Meta', ru: 'Мета' },
  time: { en: 'Time', ru: 'Время' },
};

export const GRAPHICS_LABELS_I18N: Record<1 | 2 | 3 | 4 | 5, LocalizedText> = {
  1: { en: '1 — Minimum', ru: '1 — Минимум' },
  2: { en: '2 — Low', ru: '2 — Низкая' },
  3: { en: '3 — Medium', ru: '3 — Средняя' },
  4: { en: '4 — High', ru: '4 — Высокая' },
  5: { en: '5 — Ultra', ru: '5 — Ультра' },
};

export const UI_TEXT = {
  appTitle: { en: 'Secret Universe 3D — Find 100 Secrets', ru: 'Secret Universe 3D — Найди 100 Секретов' },
  welcomeChat: {
    en: 'Welcome to Secret Universe 3D! Find all 100 secrets to build the entire world. Type /help or press Tab for the Index.',
    ru: 'Добро пожаловать в Secret Universe 3D! Найди все 100 секретов, чтобы построить весь мир. Введи /help или нажми Tab для Index.',
  },
  playerSender: { en: 'Player', ru: 'Игрок' },
  systemSender: { en: 'System', ru: 'Система' },

  // HUD
  relics: { en: 'Relics', ru: 'Реликвии' },
  speedrun: { en: 'SPEEDRUN', ru: 'СПИДРАН' },
  zonesShort: { en: 'zones', ru: 'зон' },
  secShort: { en: 's', ru: 'с' },
  pause: { en: 'Pause', ru: 'Пауза' },
  index: { en: 'Index', ru: 'Index' },
  firstPerson: { en: '1st Person', ru: '1-е лицо' },
  eagleEye: { en: 'Eagle Eye', ru: 'Взгляд орла' },
  zoom: { en: 'Zoom', ru: 'Зум' },
  buildingStructure: { en: 'Building Structure', ru: 'Строительство' },
  miniMove: { en: 'WASD — Move', ru: 'WASD — ход' },
  miniJump: { en: 'Space — Jump', ru: 'Space — прыжок' },
  miniLook: { en: 'RMB/LMB — Look', ru: 'ПКМ/ЛКМ — обзор' },
  miniZoom: { en: 'Scroll/I/O — Zoom', ru: 'Колёсико/I/O — зум' },
  miniShift: { en: 'Shift — ShiftLock', ru: 'Shift — ShiftLock' },
  miniChat: { en: '/ — Chat', ru: '/ — чат' },

  // Chat
  chatCollapsed: { en: 'Chat', ru: 'Чат' },
  chatHeader: { en: 'Chat • Type a word or /command', ru: 'Чат • Введи слово или /команду' },
  chatPlaceholder: { en: 'Press / or Enter to chat...', ru: 'Нажми / или Enter для чата...' },
  chatCollapseTitle: { en: 'Hide chat', ru: 'Свернуть чат' },
  chatOpenTitle: { en: 'Open chat (Enter or /)', ru: 'Открыть чат (Enter или /)' },
  chatSendTitle: { en: 'Send', ru: 'Отправить' },

  // Toast
  secretFound: { en: 'SECRET FOUND!', ru: 'СЕКРЕТ НАЙДЕН!' },

  // Index
  indexSubtitle: { en: 'Difficulty Chart • 100 unique secrets', ru: 'Difficulty Chart • 100 уникальных секретов' },
  all: { en: 'All', ru: 'Все' },
  found: { en: 'Found', ru: 'Найденные' },
  unfound: { en: 'Missing', ru: 'Не найденные' },
  searchPlaceholder: {
    en: 'Search by title, hint, number...',
    ru: 'Поиск по названию, подсказке, номеру...',
  },
  noResults: { en: 'No secrets match your search.', ru: 'По твоему запросу секретов не найдено.' },
  secretLabel: { en: 'SECRET', ru: 'СЕКРЕТ' },
  unlockedLabel: { en: 'Unlocked!', ru: 'Открыто!' },
  lockedLabel: { en: 'Not found yet', ru: 'Ещё не найдено' },
  hintLabel: { en: 'HINT', ru: 'ПОДСКАЗКА' },
  loreLabel: { en: "KEEPER'S NOTE", ru: 'ЗАПИСЬ ХРАНИТЕЛЯ' },
  lockedLore: {
    en: 'Find this secret in the world to unlock its story!',
    ru: 'Найди этот секрет в мире, чтобы открыть его историю!',
  },
  buildsTag: { en: 'Builds a structure!', ru: 'Строит локацию!' },

  // Pause & Settings
  pauseTitle: { en: 'PAUSE', ru: 'ПАУЗА' },
  secretsCountLabel: { en: 'Secrets', ru: 'Секретов' },
  tabSettings: { en: 'SETTINGS', ru: 'НАСТРОЙКИ' },
  tabControls: { en: 'CONTROLS', ru: 'УПРАВЛЕНИЕ' },
  languageLabel: { en: 'Language / Язык', ru: 'Язык / Language' },
  languageDesc: {
    en: 'Switch all game text between English and Russian',
    ru: 'Переключение всего текста игры между английским и русским',
  },
  graphicsLabel: { en: 'Graphics Quality (Detail)', ru: 'Настройка графики (Детализация)' },
  graphicsCurrent: { en: 'Current mode:', ru: 'Текущий режим:' },
  graphicsHint: {
    en: 'Affects shadows, fog, and hidden objects!',
    ru: 'Влияет на тени, туман и скрытые объекты!',
  },
  sensLabel: { en: 'Mouse Sensitivity', ru: 'Чувствительность мыши' },
  sensDesc: { en: 'Camera rotation speed (step 0.05)', ru: 'Скорость вращения камеры (шаг 0.05)' },
  fovLabel: { en: 'Field of View (FOV)', ru: 'Поле зрения (FOV)' },
  fovDesc: { en: 'Camera viewing angle in degrees', ru: 'Угол обзора камеры в градусах' },
  shiftLockLabel: { en: 'ShiftLock Switch', ru: 'Переключатель ShiftLock' },
  shiftLockDesc: {
    en: 'Allow over-the-shoulder camera lock with Left Shift',
    ru: 'Разрешить фиксацию камеры за плечом клавишей Shift',
  },
  cameraModeLabel: { en: 'Camera Mode', ru: 'Режим камеры' },
  cameraModeDesc: {
    en: 'Classic (free orbit) or Follow behind character',
    ru: 'Классическая (свободная) или Следящая за спиной',
  },
  camClassic: { en: 'Classic', ru: 'Классическая' },
  camFollow: { en: 'Follow', ru: 'Следящая' },
  sfxLabel: { en: 'Sound Effects (SFX)', ru: 'Громкость звуков (SFX)' },
  sfxDesc: {
    en: 'Footsteps, jumps, Lego building snaps, and secret fanfares',
    ru: 'Звуки шагов, прыжков, сборки Лего и секретов',
  },
  musicLabel: { en: 'Music Volume', ru: 'Громкость музыки' },
  musicDesc: { en: 'Cosmic ambient soundtrack', ru: 'Космический эмбиент Secret Universe' },
  coordsLabel: { en: 'Coordinates (X, Y, Z) & FPS', ru: 'Координаты (X, Y, Z) и FPS' },
  coordsDesc: { en: 'Show exact coordinates on screen', ru: 'Отображать точные координаты на экране' },
  on: { en: 'ON', ru: 'ВКЛ' },
  off: { en: 'OFF', ru: 'ВЫКЛ' },
  resumeBtn: { en: 'Resume Game', ru: 'Продолжить игру' },
  respawnBtn: { en: 'Respawn', ru: 'Респавн' },
  resetBtn: { en: 'Reset Progress', ru: 'Сбросить прогресс' },
  resetConfirm: { en: 'Confirm reset all secrets?', ru: 'Точно сбросить все секреты?' },
  closeGotIt: { en: 'Got it (Esc)', ru: 'Понятно (Esc)' },
  copyTooltip: { en: 'Copy', ru: 'Скопировать' },

  // Controls guide
  ctrlMove: { en: 'Character movement', ru: 'Движение персонажа' },
  ctrlJump: { en: 'Jump', ru: 'Прыжок' },
  ctrlSpace: { en: 'Space', ru: 'Пробел' },
  ctrlMouse: { en: 'RMB / LMB + Mouse', ru: 'ПКМ / ЛКМ + мышь' },
  ctrlOrbit: { en: 'Rotate camera around character', ru: 'Вращение камеры вокруг персонажа' },
  ctrlZoomKey: { en: 'Scroll', ru: 'Колёсико' },
  ctrlZoomDesc: {
    en: 'Zoom in (First Person) / Zoom out (Eagle Eye)',
    ru: 'Приблизить (First Person) / Отдалить камеру (Взгляд орла)',
  },
  ctrlShiftDesc: {
    en: 'Toggle ShiftLock (just like Roblox!)',
    ru: 'Включить / выключить ShiftLock (как в Роблоксе!)',
  },
  ctrlInteract: {
    en: 'Interact with buttons, notes, altars, portals',
    ru: 'Взаимодействие с кнопками, записками, алтарями, порталами',
  },
  ctrlChatKey: { en: 'or Enter', ru: 'или Enter' },
  ctrlChatDesc: { en: 'Open chat to type words or /commands', ru: 'Открыть чат и ввести слово или /команду' },
  ctrlIndexDesc: { en: 'Open / close Index (100 secrets)', ru: 'Открыть / закрыть Index (100 секретов)' },
  ctrlPauseDesc: { en: 'Pause menu & Settings', ru: 'Пауза и Настройки' },
} as const;
