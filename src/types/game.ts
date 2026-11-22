export type DifficultyId = 'easy' | 'medium' | 'hard' | 'amazing' | 'okay' | 'best';

export type SecretCategory =
  | 'exploration'
  | 'camera'
  | 'chat'
  | 'command'
  | 'cipher'
  | 'sequence'
  | 'settings'
  | 'parkour'
  | 'meta'
  | 'time';

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  ruLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glow: string;
  order: number;
}

export interface SecretDef {
  id: number;
  title: string;
  difficulty: DifficultyId;
  category: SecretCategory;
  hint: string;
  lore: string;
  timeEstimate: string;
}

export type ZoneId = 'plaza' | 'forest' | 'library' | 'lab' | 'volcano' | 'sky' | 'void';

export interface GameSettings {
  graphicsQuality: 1 | 2 | 3 | 4 | 5;
  mouseSensitivity: number; // 0.2 to 3.0
  fov: number; // 50 to 110
  shiftLockEnabled: boolean;
  sfxVolume: number; // 0 to 100
  musicVolume: number; // 0 to 100
  showCoords: boolean;
  cameraMode: 'classic' | 'follow';
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'player' | 'system' | 'secret' | 'whisper' | 'error';
  color?: string;
  timestamp: number;
}

export interface InspectContent {
  title: string;
  subtitle?: string;
  body: string;
  code?: string;
  footer?: string;
  accentColor?: string;
}

export interface HudSnapshot {
  zone: ZoneId;
  zoneName: string;
  x: number;
  y: number;
  z: number;
  fps: number;
  shiftLockActive: boolean;
  cameraDistance: number;
  isFirstPerson: boolean;
  isMaxZoomOut: boolean;
  interactPrompt: string | null;
  statusBanner: string | null;
  relicCount: number;
  raceTimeLeft: number | null;
  raceZonesCount: number;
  bubbleText: string | null;
  bubbleScreenPos: { x: number; y: number; visible: boolean };
}
