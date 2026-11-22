export type Language = 'en' | 'ru';

export interface LocalizedText {
  en: string;
  ru: string;
}

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
  | 'time'
  | 'multiplayer';

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  label: LocalizedText;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glow: string;
  order: number;
}

export interface SecretDef {
  id: number;
  title: LocalizedText;
  difficulty: DifficultyId;
  category: SecretCategory;
  hint: LocalizedText;
  lore: LocalizedText;
  timeEstimate: LocalizedText;
  buildsStructure?: string;
}

export type ZoneId = 'plaza' | 'forest' | 'library' | 'lab' | 'volcano' | 'sky' | 'void';

export interface GameSettings {
  language: Language;
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
  title: LocalizedText;
  subtitle?: LocalizedText;
  body: LocalizedText;
  code?: string;
  footer?: LocalizedText;
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
  cutsceneTitle: string | null;
  relicCount: number;
  raceTimeLeft: number | null;
  raceZonesCount: number;
  bubbleText: string | null;
  bubbleScreenPos: { x: number; y: number; visible: boolean };
}

export interface AuthUser {
  id: string;
  username: string;
  avatarColor: string;
  createdAt?: number;
}

export interface RemotePlayerData {
  userId: string;
  username: string;
  avatarColor: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  grounded: boolean;
  velY: number;
  zone: ZoneId;
  secretCount: number;
}

export interface FriendInfo {
  id: string;
  username: string;
  avatarColor: string;
  online: boolean;
  zone: ZoneId | null;
  secretCount: number;
}

export interface FriendRequestInfo {
  id: string;
  userId: string;
  username: string;
  avatarColor: string;
  createdAt: number;
}

export interface FriendsState {
  friends: FriendInfo[];
  incoming: FriendRequestInfo[];
  outgoing: FriendRequestInfo[];
}

export interface HighFiveEvent {
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  ts: number;
}

