import * as THREE from 'three';
import { SECRET_TO_STRUCTURE, SECRETS_BY_ID } from '../data/secrets';
import { soundEngine } from '../audio/soundEngine';
import { ChatMessage, GameSettings, Language, SecretDef, ZoneId } from '../types/game';
import { EmoteType } from './Avatar';
import { UI_TEXT } from '../i18n/translations';

const STORAGE_KEY = 'secret_universe_unlocked_v1';

export interface EngineCallbacks {
  onSecretUnlocked: (secret: SecretDef, totalUnlocked: number) => void;
  onStructureUnlocked: (structureId: string) => void;
  onResetWorld: () => void;
  onChatMessage: (msg: ChatMessage) => void;
  onEmote: (emote: EmoteType) => void;
  onTeleport: (pos: THREE.Vector3) => void;
  onRespawn: () => void;
  onGravityBoost: () => void;
  onClearChat: () => void;
  onVisualUpdate: (event: string, payload?: string) => void;
  onStatusBanner: (text: string | null) => void;
}

export interface PlayerContext {
  position: THREE.Vector3;
  zone: ZoneId;
  shiftLockActive: boolean;
  isFirstPerson: boolean;
  isMaxZoomOut: boolean;
  isSitting: boolean;
  activeTriggers: Set<string>;
  settings: GameSettings;
  peakFallY: number;
  isMovingBackwards: boolean;
}

export class SecretManager {
  public unlocked = new Set<number>();
  public language: Language = 'en';
  private cb: EngineCallbacks;

  private distanceWalked = 0;
  private jumpCount = 0;
  private voidFalls = 0;
  private abyssWhispered = false;
  private campfireTime = 0;
  private stillTime = 0;
  private chronoAltarTime = 0;
  private monkSitTime = 0;
  private sessionStartTime = Date.now();

  private graphicsHistory: number[] = [];
  private volcanoGraphicsHistory: number[] = [];
  private rainbowProgress = 0;
  private volcanoCrystalProgress = 0;
  private torchProgress = 0;
  private elementProgress = 0;
  private platesPressed = new Set<string>();
  private emoteChain: Array<{ cmd: string; time: number }> = [];
  private timeLeverChain: Array<{ key: string; time: number }> = [];
  private konamiBuffer: string[] = [];
  private sevenSealsStep = 0;

  private tripleStep = 0;
  private tripleStart = 0;
  private mirrorReadyUntil = 0;
  private backwardsActive = false;

  private raceStartTime: number | null = null;
  private raceZones = new Set<ZoneId>();
  private architectStep = 0;
  public collectedRelics = new Set<string>();

  constructor(callbacks: EngineCallbacks, initialLang: Language = 'en') {
    this.cb = callbacks;
    this.language = initialLang;
    this.loadProgress();
  }

  public setLanguage(lang: Language): void {
    this.language = lang;
  }

  private msg(en: string, ru: string): string {
    return this.language === 'ru' ? ru : en;
  }

  private loadProgress(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((n) => {
            if (typeof n === 'number' && SECRETS_BY_ID[n]) this.unlocked.add(n);
          });
        }
      }
    } catch {
      // ignore
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.unlocked]));
    } catch {
      // ignore
    }
  }

  public getInitiallyBuiltStructures(): string[] {
    const built: string[] = [];
    for (const id of this.unlocked) {
      const st = SECRET_TO_STRUCTURE[id];
      if (st) built.push(st);
    }
    return built;
  }

  public resetProgress(): void {
    this.unlocked.clear();
    this.platesPressed.clear();
    this.collectedRelics.clear();
    this.distanceWalked = 0;
    this.jumpCount = 0;
    this.voidFalls = 0;
    this.abyssWhispered = false;
    this.sevenSealsStep = 0;
    this.architectStep = 0;
    this.rainbowProgress = 0;
    this.volcanoCrystalProgress = 0;
    this.torchProgress = 0;
    this.elementProgress = 0;
    this.graphicsHistory = [];
    this.volcanoGraphicsHistory = [];
    this.saveProgress();
    this.cb.onResetWorld();
    // Re-award #1 Welcome! after a short moment so player sees empty void -> Lego plaza build!
    setTimeout(() => {
      this.unlock(1);
    }, 650);
  }

  public systemMsg(text: string, type: ChatMessage['type'] = 'system', color?: string): void {
    this.cb.onChatMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: type === 'whisper' ? '???' : UI_TEXT.systemSender[this.language],
      text,
      type,
      color,
      timestamp: Date.now(),
    });
  }

  public unlock(id: number): boolean {
    if (this.unlocked.has(id)) return false;
    const def = SECRETS_BY_ID[id];
    if (!def) return false;

    this.unlocked.add(id);
    this.saveProgress();
    soundEngine.playSecretUnlock(def.difficulty);
    this.cb.onSecretUnlocked(def, this.unlocked.size);

    const title = def.title[this.language];
    this.systemMsg(
      this.msg(
        `Secret #${def.id} unlocked: "${title}" [${def.difficulty.toUpperCase()}]! (${this.unlocked.size}/100)`,
        `Найден секрет #${def.id}: «${title}» [${def.difficulty.toUpperCase()}]! (${this.unlocked.size}/100)`
      ),
      'secret'
    );

    // Trigger Lego construction animation if this secret builds a structure!
    const structId = SECRET_TO_STRUCTURE[id];
    if (structId) {
      this.cb.onStructureUnlocked(structId);
    }

    // Milestone secrets (#96 at 50, #97 at 90)
    if (this.unlocked.size >= 50 && !this.unlocked.has(96)) {
      setTimeout(() => this.unlock(96), 700);
    }
    if (this.unlocked.size >= 90 && !this.unlocked.has(97)) {
      setTimeout(() => this.unlock(97), 700);
    }
    if (this.unlocked.size === 99 && !this.unlocked.has(100)) {
      this.systemMsg(
        this.msg(
          '✨ 99/100 SECRETS! A golden beam ignited at the center of Spawn Plaza! Stand on the Pedestal and type /universe!',
          '✨ 99/100 СЕКРЕТОВ! В центре Площади Спавна зажёгся золотой луч! Встань на Пьедестал и введи /universe!'
        ),
        'whisper'
      );
    }
    return true;
  }

  public onGameStart(): void {
    // Secret #1: Welcome! Auto-granted on first entry (triggers first Lego build!)
    if (!this.unlocked.has(1)) {
      setTimeout(() => {
        this.unlock(1);
      }, 750);
    }
  }

  public onWalk(dist: number): void {
    if (dist > 0.005) {
      this.stillTime = 0;
      this.distanceWalked += dist;
      if (this.distanceWalked >= 15) this.unlock(2);
    }
  }

  public onJump(): void {
    this.stillTime = 0;
    this.jumpCount++;
    if (this.jumpCount >= 10) this.unlock(3);
  }

  public onVoidFall(): void {
    this.unlock(14);
    this.voidFalls++;
    if (this.voidFalls === 5 && !this.abyssWhispered) {
      this.abyssWhispered = true;
      this.systemMsg(
        this.msg(
          'The Abyss whispers to you: "...nullvoid... say it in chat..."',
          'Бездна шепчет тебе: «...nullvoid... скажи это в чат...»'
        ),
        'whisper'
      );
    } else if (this.voidFalls < 5 && !this.unlocked.has(78)) {
      this.systemMsg(
        this.msg(
          `The void remembers your fall (${this.voidFalls}/5)...`,
          `Пустота запомнила твоё падение (${this.voidFalls}/5)...`
        ),
        'whisper'
      );
    }
  }

  public onZoneEnter(zone: ZoneId): void {
    if (zone === 'forest') this.unlock(16);
    if (zone === 'library') this.unlock(17);
    if (zone === 'volcano') this.unlock(18);
    if (zone === 'lab') this.unlock(19);
    if (zone === 'sky') this.unlock(33);

    if (this.raceStartTime !== null && zone !== 'void') {
      const elapsed = (Date.now() - this.raceStartTime) / 1000;
      if (elapsed <= 90) {
        this.raceZones.add(zone);
        if (this.raceZones.size >= 6) {
          this.raceStartTime = null;
          this.unlock(83);
          this.systemMsg(
            this.msg(
              `Speedrun finished in ${elapsed.toFixed(1)}s!`,
              `Финиш спидрана за ${elapsed.toFixed(1)} сек!`
            ),
            'system'
          );
        }
      } else {
        this.raceStartTime = null;
        this.systemMsg(
          this.msg(
            '/race time limit (90s) expired! Try again.',
            'Время забега /race (90 сек) истекло! Попробуй снова.'
          ),
          'error'
        );
      }
    }
  }

  public onShiftLockToggle(active: boolean, ctx: PlayerContext): void {
    if (active) {
      this.unlock(11);
      if (this.sevenSealsStep === 1) {
        this.sevenSealsStep = 2;
        this.systemMsg(
          this.msg('Seal #2/7 (ShiftLock) activated!', 'Печать #2/7 (ShiftLock) активирована!'),
          'whisper'
        );
      }
      if (ctx.activeTriggers.has('triple_circle') && this.tripleStep === 1 && Date.now() - this.tripleStart < 10000) {
        this.tripleStep = 2;
        this.systemMsg(
          this.msg(
            'Triple Perspective 2/3: now zoom out to maximum!',
            'Тройная перспектива 2/3: теперь отдали камеру на максимум!'
          ),
          'whisper'
        );
      }
    }
  }

  public onCameraStateChange(isFirstPerson: boolean, isMaxZoomOut: boolean, ctx: PlayerContext): void {
    if (isFirstPerson) {
      this.unlock(12);
      if (ctx.activeTriggers.has('triple_circle') && this.tripleStep === 0) {
        this.tripleStep = 1;
        this.tripleStart = Date.now();
        this.systemMsg(
          this.msg(
            'Triple Perspective 1/3: now toggle ShiftLock ON!',
            'Тройная перспектива 1/3: теперь включи ShiftLock!'
          ),
          'whisper'
        );
      }
    }
    if (isMaxZoomOut) {
      this.unlock(13);
      if (ctx.activeTriggers.has('triple_circle') && this.tripleStep === 2 && Date.now() - this.tripleStart < 10000) {
        this.tripleStep = 0;
        this.unlock(67);
      }
      if (Date.now() < this.mirrorReadyUntil && ctx.activeTriggers.has('void_mirror')) {
        this.mirrorReadyUntil = 0;
        this.unlock(91);
      }
    }
  }

  public onOpenIndex(): void {
    this.unlock(9);
  }

  public onOpenPause(): void {
    this.unlock(10);
  }

  public onIndexSearch(query: string): void {
    if (query.trim().toLowerCase() === 'findme') {
      this.unlock(46);
    }
  }

  public onIndexCounterClicks(count: number): void {
    if (count >= 7) {
      this.unlock(73);
    }
  }

  public onHiddenPiClick(): void {
    this.unlock(72);
  }

  public onArchitectIndexBadge(): void {
    if (this.architectStep === 0) {
      this.architectStep = 1;
      soundEngine.playInteract();
      this.systemMsg(
        this.msg(
          'Architect (1/3): First mark inside Index accepted...',
          'Архитектор (1/3): Первый знак в Индексе принят...'
        ),
        'whisper'
      );
    }
  }

  public onArchitectSettingsTitle(): void {
    if (this.architectStep === 1) {
      this.architectStep = 2;
      soundEngine.playInteract();
      this.systemMsg(
        this.msg(
          'Architect (2/3): Settings mark accepted... Now type /architect in chat!',
          'Архитектор (2/3): Знак в Настройках принят... Теперь /architect в чат!'
        ),
        'whisper'
      );
    }
  }

  public onKeyDown(code: string): void {
    const expected = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'KeyB',
      'KeyA',
    ];
    this.konamiBuffer.push(code);
    if (this.konamiBuffer.length > expected.length) this.konamiBuffer.shift();
    if (
      this.konamiBuffer.length === expected.length &&
      expected.every((k, i) => this.konamiBuffer[i] === k)
    ) {
      this.konamiBuffer = [];
      this.unlock(62);
    }
  }

  public onSettingsChanged(prev: GameSettings, next: GameSettings, ctx: PlayerContext): void {
    if (next.sfxVolume === 0 && next.musicVolume === 0) this.unlock(35);
    if (next.fov >= 110) this.unlock(36);
    if (next.fov <= 50) this.unlock(37);
    if (next.mouseSensitivity >= 2.99) this.unlock(38);
    if (next.mouseSensitivity <= 0.21) this.unlock(39);
    if (Math.abs(next.mouseSensitivity - 1.35) < 0.008 && next.fov === 77) this.unlock(66);

    if (prev.graphicsQuality !== next.graphicsQuality) {
      const g = next.graphicsQuality;
      this.graphicsHistory.push(g);
      if (this.graphicsHistory.length > 12) this.graphicsHistory.shift();

      if (this.matchesTail(this.graphicsHistory, [1, 5, 2, 4, 3])) this.unlock(47);
      if (this.matchesTail(this.graphicsHistory, [5, 1, 4, 2, 3, 5, 3, 1])) this.unlock(92);

      if (ctx.zone === 'volcano') {
        this.volcanoGraphicsHistory.push(g);
        if (this.volcanoGraphicsHistory.length > 8) this.volcanoGraphicsHistory.shift();
        if (this.matchesTail(this.volcanoGraphicsHistory, [1, 5, 1, 5, 1])) this.unlock(75);
      } else {
        this.volcanoGraphicsHistory = [];
      }

      if (this.sevenSealsStep === 3 && g === 5) {
        this.sevenSealsStep = 4;
        this.systemMsg(
          this.msg('Seal #4/7 (Ultra Graphics) activated!', 'Печать #4/7 (Ультра-графика) активирована!'),
          'whisper'
        );
      }
    }
  }

  private matchesTail(arr: number[], pattern: number[]): boolean {
    if (arr.length < pattern.length) return false;
    const offset = arr.length - pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      if (arr[offset + i] !== pattern[i]) return false;
    }
    return true;
  }

  public onInteract(key: string, ctx: PlayerContext): void {
    soundEngine.playInteract();

    if (key === 'red_button') {
      this.unlock(15);
      if (this.sevenSealsStep === 2) {
        this.sevenSealsStep = 3;
        this.systemMsg(
          this.msg('Seal #3/7 (Red Button) activated!', 'Печать #3/7 (Красная кнопка) активирована!'),
          'whisper'
        );
      }
      return;
    }
    if (key === 'bench_sit') {
      this.cb.onEmote('sit');
      this.unlock(8);
      return;
    }
    if (key === 'behind_tree') {
      this.unlock(24);
      return;
    }
    if (key === 'illusion_crystal') {
      this.unlock(25);
      return;
    }
    if (key === 'potato_cube') {
      if (ctx.settings.graphicsQuality === 1) this.unlock(40);
      return;
    }
    if (key === 'ultra_runes') {
      if (ctx.settings.graphicsQuality === 5) this.unlock(41);
      return;
    }
    if (key === 'volcano_chest') {
      this.unlock(34);
      return;
    }
    if (key === 'phantom_sphere') {
      this.unlock(69);
      return;
    }
    if (key === 'sky_glitch_cube') {
      if (ctx.settings.graphicsQuality === 1 && ctx.isMaxZoomOut) this.unlock(88);
      return;
    }
    if (key === 'black_obelisk') {
      this.unlock(95);
      return;
    }
    if (key === 'portal:to_void') {
      soundEngine.playPortal();
      this.cb.onTeleport(new THREE.Vector3(-105, 7.2, -62));
      this.unlock(63);
      return;
    }
    if (key === 'portal:to_plaza') {
      soundEngine.playPortal();
      this.cb.onTeleport(new THREE.Vector3(0, 1.2, 10));
      return;
    }
    if (key === 'final_pedestal') {
      if (this.unlocked.size >= 99) {
        this.unlock(100);
      } else {
        this.systemMsg(
          this.msg(
            `The Central Pedestal slumbers. Secrets found: ${this.unlocked.size} / 99 needed to awaken the finale.`,
            `Центральный Пьедестал спит. Собрано секретов: ${this.unlocked.size} / 99 для пробуждения финала.`
          ),
          'system'
        );
      }
      return;
    }

    if (key.startsWith('rainbow:')) {
      const col = key.split(':')[1];
      const order = ['red', 'orange', 'yellow', 'green', 'blue'];
      if (col === order[this.rainbowProgress]) {
        this.rainbowProgress++;
        this.cb.onVisualUpdate('rainbow_on', col);
        this.systemMsg(
          this.msg(`Rainbow: ${this.rainbowProgress}/5 correct!`, `Радуга: ${this.rainbowProgress}/5 верно!`),
          'system'
        );
        if (this.rainbowProgress === order.length) {
          this.rainbowProgress = 0;
          this.unlock(48);
        }
      } else {
        this.rainbowProgress = 0;
        this.cb.onVisualUpdate('rainbow_reset');
        soundEngine.playError();
        this.systemMsg(
          this.msg('Wrong rainbow color! Order reset.', 'Неверный цвет радуги! Порядок сброшен.'),
          'error'
        );
      }
      return;
    }

    if (key.startsWith('vcrystal:')) {
      const rom = key.split(':')[1];
      const order = ['III', 'I', 'IV', 'II'];
      if (rom === order[this.volcanoCrystalProgress]) {
        this.volcanoCrystalProgress++;
        this.cb.onVisualUpdate('vcrystal_on', rom);
        this.systemMsg(
          this.msg(
            `Crystal ${rom} resonates (${this.volcanoCrystalProgress}/4)!`,
            `Кристалл ${rom} резонирует (${this.volcanoCrystalProgress}/4)!`
          ),
          'system'
        );
        if (this.volcanoCrystalProgress === order.length) {
          this.volcanoCrystalProgress = 0;
          this.unlock(55);
        }
      } else {
        this.volcanoCrystalProgress = 0;
        this.cb.onVisualUpdate('vcrystal_reset');
        soundEngine.playError();
        this.systemMsg(
          this.msg(
            'The crystals went dark! Check the Roman numeral order on the plaque.',
            'Кристаллы погасли! Проверь римский порядок на табличке.'
          ),
          'error'
        );
      }
      return;
    }

    if (key.startsWith('torch:')) {
      const zone = key.split(':')[1];
      const order = ['plaza', 'forest', 'library', 'lab', 'volcano'];
      if (zone === order[this.torchProgress]) {
        this.torchProgress++;
        this.cb.onVisualUpdate('torch_on', zone);
        this.systemMsg(
          this.msg(
            `Chameleon Torch ${this.torchProgress}/5 lit!`,
            `Факел Хамелеона ${this.torchProgress}/5 зажжён!`
          ),
          'system'
        );
        if (this.torchProgress === order.length) {
          this.torchProgress = 0;
          this.unlock(65);
        }
      } else {
        this.torchProgress = 0;
        this.cb.onVisualUpdate('torch_reset');
        soundEngine.playError();
        this.systemMsg(
          this.msg(
            'Wrong torch! Chameleon order reset (check the Library poem).',
            'Неверный факел! Порядок Хамелеона сброшен (ищи стих в Библиотеке).'
          ),
          'error'
        );
      }
      return;
    }

    if (key.startsWith('element:')) {
      const el = key.split(':')[1];
      if (el === 'fire' && this.sevenSealsStep === 5) {
        this.sevenSealsStep = 6;
        this.systemMsg(
          this.msg(
            'Seal #6/7 (Fire Altar) activated! One last step on Sky Observatory: type /seal!',
            'Печать #6/7 (Алтарь Огня) активирована! Остался шаг 7 на Обсерватории (/seal)!'
          ),
          'whisper'
        );
      }

      const order = ['fire', 'water', 'earth', 'cosmos', 'tech', 'knowledge'];
      if (el === order[this.elementProgress]) {
        this.elementProgress++;
        this.systemMsg(
          this.msg(
            `Elemental Altar ${this.elementProgress}/6 synchronized!`,
            `Алтарь Стихий: ${this.elementProgress}/6 синхронизирован!`
          ),
          'system'
        );
        if (this.elementProgress === order.length) {
          this.elementProgress = 0;
          this.unlock(81);
        }
      } else {
        this.elementProgress = 0;
        soundEngine.playError();
        this.systemMsg(
          this.msg(
            'Elemental order broken! Follow numbers #1 through #6 on the altars.',
            'Нарушен порядок стихий! Проверь номера #1..#6 на алтарях.'
          ),
          'error'
        );
      }
      return;
    }

    if (key.startsWith('timelever:')) {
      const tkey = key.split(':')[1];
      const now = Date.now();
      this.timeLeverChain = this.timeLeverChain.filter((e) => now - e.time < 45000);
      this.timeLeverChain.push({ key: tkey, time: now });
      const seq = ['future', 'present', 'past'];
      if (tkey === 'future') {
        this.timeLeverChain = [{ key: 'future', time: now }];
        this.systemMsg(
          this.msg(
            'Time Lever: Future (1/3) — 45 seconds started!',
            'Рычаг Времени: Будущее (1/3) — 45 секунд пошло!'
          ),
          'system'
        );
      } else if (this.timeLeverChain.length === 2 && this.timeLeverChain[0].key === 'future' && tkey === 'present') {
        this.systemMsg(
          this.msg(
            'Time Lever: Present (2/3) — run to Past (Forest)!',
            'Рычаг Времени: Настоящее (2/3) — беги в Прошлое (Лес)!'
          ),
          'system'
        );
      } else if (
        this.timeLeverChain.length >= 3 &&
        this.timeLeverChain.slice(-3).every((e, i) => e.key === seq[i])
      ) {
        this.timeLeverChain = [];
        this.unlock(87);
      } else {
        this.systemMsg(
          this.msg(
            'Pull levers in reverse chronological order: Future → Present → Past!',
            'Нужен обратный порядок времени: Будущее → Настоящее → Прошлое!'
          ),
          'error'
        );
      }
      return;
    }

    if (key.startsWith('relic:')) {
      const r = key.split(':')[1];
      if (!this.collectedRelics.has(r)) {
        this.collectedRelics.add(r);
        this.cb.onVisualUpdate('relic_taken', r);
        this.systemMsg(
          this.msg(
            `Ancient Relic collected (${this.collectedRelics.size}/3)! ${
              this.collectedRelics.size === 3
                ? 'Stand before the Golden Founder Statue in First Person and type /eternity!'
                : ''
            }`,
            `Собрана Древняя Реликвия (${this.collectedRelics.size}/3)! ${
              this.collectedRelics.size === 3
                ? 'Иди к Золотой Статуе на Площади, перейди в First Person и введи /eternity!'
                : ''
            }`
          ),
          'whisper'
        );
      }
    }
  }

  public update(dt: number, ctx: PlayerContext): void {
    let statusBanner: string | null = null;

    if (ctx.activeTriggers.has('fountain')) {
      if (!this.unlocked.has(4)) {
        soundEngine.playSplash();
        this.unlock(4);
      }
      if (ctx.peakFallY >= 20) this.unlock(77);
      if (this.sevenSealsStep === 0 && !this.unlocked.has(94)) {
        this.sevenSealsStep = 1;
      }
    }

    if (ctx.activeTriggers.has('pavilion_roof')) this.unlock(20);
    if (ctx.activeTriggers.has('bounce_pad')) this.unlock(23);
    if (ctx.activeTriggers.has('clocktower_peak')) this.unlock(32);
    if (ctx.activeTriggers.has('under_bridge')) this.unlock(45);

    for (const pid of ['plate_1', 'plate_2', 'plate_3']) {
      if (ctx.activeTriggers.has(pid) && !this.platesPressed.has(pid)) {
        this.platesPressed.add(pid);
        soundEngine.playClick();
        this.cb.onVisualUpdate('plate_on', pid);
        this.systemMsg(
          this.msg(
            `Pressure plate pressed (${this.platesPressed.size}/3)!`,
            `Нажимная плита нажата (${this.platesPressed.size}/3)!`
          ),
          'system'
        );
        if (this.platesPressed.size === 3) this.unlock(42);
      }
    }

    if (ctx.activeTriggers.has('shiftlock_gauntlet_end')) {
      if (ctx.shiftLockActive) {
        this.unlock(54);
      } else if (!this.unlocked.has(54)) {
        statusBanner = this.msg(
          'ShiftLock must be ON to claim the Gauntlet Orb!',
          'Для сферы испытания нужен включённый ShiftLock!'
        );
      }
    }

    if (ctx.activeTriggers.has('campfire')) {
      this.campfireTime = Math.min(6, this.campfireTime + dt);
      if (this.campfireTime < 5 && !this.unlocked.has(31)) {
        statusBanner = this.msg(
          `Warming by the campfire... ${Math.ceil(5 - this.campfireTime)}s`,
          `Греемся у костра... ${Math.ceil(5 - this.campfireTime)} сек`
        );
      } else if (!this.unlocked.has(31)) {
        statusBanner = this.msg(
          'Nice and warm! Type "warm" (or "тепло") in chat',
          'У костра тепло! Напиши в чат «тепло» или «warm»'
        );
      }
    } else {
      this.campfireTime = Math.max(0, this.campfireTime - dt * 2);
    }

    this.stillTime += dt;
    if (
      this.stillTime >= 8 &&
      this.stillTime < 30 &&
      !this.unlocked.has(59) &&
      !ctx.activeTriggers.has('clocktower_peak') &&
      !ctx.activeTriggers.has('ruins_center')
    ) {
      statusBanner = this.msg(
        `Statue stillness... ${Math.floor(this.stillTime)} / 30s`,
        `Спокойствие статуи... ${Math.floor(this.stillTime)} / 30 сек`
      );
    }
    if (this.stillTime >= 30) this.unlock(59);

    if (ctx.activeTriggers.has('clocktower_peak')) {
      this.chronoAltarTime += dt;
      if (!this.unlocked.has(74)) {
        statusBanner = this.msg(
          `Time Altar: ${Math.floor(this.chronoAltarTime)} / 45s`,
          `Алтарь Времени: ${Math.floor(this.chronoAltarTime)} / 45 сек`
        );
      }
      if (this.chronoAltarTime >= 45) this.unlock(74);
    } else {
      this.chronoAltarTime = 0;
    }

    if (ctx.activeTriggers.has('ruins_center') && ctx.isSitting && this.stillTime > 0.2) {
      this.monkSitTime += dt;
      if (!this.unlocked.has(90)) {
        statusBanner = this.msg(
          `Monk's Meditation: ${Math.floor(this.monkSitTime)} / 60s`,
          `Медитация Монаха: ${Math.floor(this.monkSitTime)} / 60 сек`
        );
      }
      if (this.monkSitTime >= 60) this.unlock(90);
    } else {
      this.monkSitTime = 0;
    }

    if (ctx.activeTriggers.has('backwards_start') && ctx.shiftLockActive) {
      this.backwardsActive = true;
    }
    if (this.backwardsActive) {
      if (!ctx.shiftLockActive || ctx.position.z < 13.5 || ctx.position.z > 18.5 || ctx.position.x < 39) {
        this.backwardsActive = false;
      } else {
        if (!this.unlocked.has(79)) {
          statusBanner = this.msg(
            'Backwards track: keep ShiftLock ON and walk backwards (S) to the purple pad!',
            'Полоса задом наперёд: держи ShiftLock и иди спиной (S) до фиолетовой плиты!'
          );
        }
        if (ctx.activeTriggers.has('backwards_finish') && ctx.isMovingBackwards) {
          this.backwardsActive = false;
          this.unlock(79);
        }
      }
    }

    if (this.raceStartTime !== null) {
      const left = 90 - (Date.now() - this.raceStartTime) / 1000;
      if (left <= 0) {
        this.raceStartTime = null;
        this.systemMsg(
          this.msg('/race time expired!', 'Время забега /race истекло!'),
          'error'
        );
      }
    }

    if (this.tripleStep > 0 && Date.now() - this.tripleStart > 10000) {
      this.tripleStep = 0;
    }

    this.cb.onStatusBanner(statusBanner);
  }

  public getRaceStatus(): { timeLeft: number | null; zonesCount: number } {
    if (this.raceStartTime === null) return { timeLeft: null, zonesCount: 0 };
    const left = Math.max(0, 90 - (Date.now() - this.raceStartTime) / 1000);
    return { timeLeft: left, zonesCount: this.raceZones.size };
  }

  public handleChatInput(rawInput: string, ctx: PlayerContext): void {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    soundEngine.playChat();
    this.cb.onChatMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: UI_TEXT.playerSender[this.language],
      text: trimmed,
      type: 'player',
      timestamp: Date.now(),
    });

    const lower = trimmed.toLowerCase();

    if (lower.startsWith('/')) {
      const parts = lower.split(/\s+/);
      const cmd = parts[0];
      const arg = parts.slice(1).join(' ');

      switch (cmd) {
        case '/help':
          this.unlock(6);
          this.systemMsg(
            this.msg(
              'Commands: /help, /dance, /wave, /sit, /cheer, /laugh, /pos, /time, /reset, /secrets, /race, /clear. (Hint: dozens of hidden /commands await discovery!)',
              'Команды: /help, /dance, /wave, /sit, /cheer, /laugh, /pos, /time, /reset, /secrets, /race, /clear. (Подсказка: в мире спрятано множество тайных /команд!)'
            )
          );
          return;

        case '/clear':
          this.cb.onClearChat();
          return;

        case '/secrets':
          this.systemMsg(
            this.msg(
              `Secrets found: ${this.unlocked.size} / 100. Press Tab to open the Index!`,
              `Найдено секретов: ${this.unlocked.size} / 100. Нажми Tab для Index!`
            )
          );
          return;

        case '/reset':
        case '/respawn':
          this.cb.onRespawn();
          this.unlock(21);
          this.systemMsg(this.msg('Teleported back to spawn.', 'Телепортация на точку спавна.'));
          return;

        case '/pos':
        case '/coords':
          this.unlock(22);
          this.systemMsg(
            this.msg(
              `Coords: X=${ctx.position.x.toFixed(1)}, Y=${ctx.position.y.toFixed(1)}, Z=${ctx.position.z.toFixed(1)} | Zone: ${ctx.zone}`,
              `Координаты: X=${ctx.position.x.toFixed(1)}, Y=${ctx.position.y.toFixed(1)}, Z=${ctx.position.z.toFixed(1)} | Зона: ${ctx.zone}`
            )
          );
          return;

        case '/time': {
          if (arg === '0345' || arg === '03:45') {
            this.unlock(58);
          } else {
            const mins = Math.floor((Date.now() - this.sessionStartTime) / 60000);
            const secs = Math.floor(((Date.now() - this.sessionStartTime) % 60000) / 1000);
            this.systemMsg(
              this.msg(
                `Session time: ${mins}m ${secs}s. (The Clocktower stopped at a different time...)`,
                `Время в игре: ${mins}м ${secs}с. (Часы на башне замерли на другом времени...)`
              )
            );
          }
          return;
        }

        case '/dance':
          this.cb.onEmote('dance');
          this.unlock(7);
          this.recordEmoteChain('/dance');
          return;

        case '/sit':
          this.cb.onEmote('sit');
          this.unlock(8);
          this.recordEmoteChain('/sit');
          return;

        case '/wave':
          this.cb.onEmote('wave');
          this.recordEmoteChain('/wave');
          if (ctx.position.distanceTo(new THREE.Vector3(0, 1, -14)) < 7.5 && this.unlocked.has(5)) {
            this.unlock(43);
          }
          return;

        case '/cheer':
          this.cb.onEmote('cheer');
          this.recordEmoteChain('/cheer');
          if (Math.hypot(ctx.position.x - -30, ctx.position.z - 30) < 5.5) {
            this.unlock(57);
          }
          return;

        case '/laugh':
          this.cb.onEmote('laugh');
          if (ctx.zone === 'volcano') this.unlock(44);
          return;

        case '/code':
          this.unlock(30);
          return;

        case '/star':
          this.unlock(49);
          return;

        case '/underworld':
          this.unlock(51);
          return;

        case '/481516':
          this.unlock(52);
          return;

        case '/echo':
          if (arg === 'echoes') {
            this.unlock(53);
          } else {
            this.systemMsg(
              this.msg(`The echo answers: "${arg || '...'}"`, `Эхо отвечает: «${arg || '...'}»`)
            );
          }
          return;

        case '/unlock':
          if (arg === 'secret_lab') {
            this.unlock(56);
          } else {
            this.systemMsg(this.msg('Invalid access key for /unlock.', 'Неверный ключ доступа для /unlock.'), 'error');
          }
          return;

        case '/gravity':
          this.cb.onGravityBoost();
          this.unlock(60);
          this.systemMsg(
            this.msg(
              'Experimental anti-gravity pulse activated!',
              'Экспериментальный антигравитационный импульс активирован!'
            )
          );
          return;

        case '/fly':
        case '/noclip':
          this.systemMsg(
            this.msg(
              '🚨 Secret Universe Anti-Cheat: Haha, nice try! Flying is forbidden, so take a secret instead!',
              '🚨 Античит Secret Universe: Ха-ха, хитрец! Полёты запрещены, но за попытку держи секрет!'
            ),
            'whisper'
          );
          this.unlock(61);
          return;

        case '/void':
          if (ctx.zone === 'void') {
            this.unlock(64);
          } else {
            this.systemMsg(
              this.msg('You must speak /void on Glitch Void Island!', 'Команду /void нужно произнести на Острове Бездны!'),
              'error'
            );
          }
          return;

        case '/prism':
          this.unlock(70);
          return;

        case '/tome':
          if (arg.replace(/[-\s]/g, '') === 'k9a7m4x2') {
            this.unlock(76);
          } else {
            this.systemMsg(
              this.msg('Wrong Four Tomes code! Combine them bottom-to-top.', 'Неверный код четырёх томов! Складывай снизу вверх.'),
              'error'
            );
          }
          return;

        case '/vigenere':
          if (arg === 'universe') {
            this.unlock(80);
          } else {
            this.systemMsg(this.msg('Wrong Vigenère decryption.', 'Неверная расшифровка Виженера.'), 'error');
          }
          return;

        case '/omega': {
          const s = ctx.settings;
          const ok =
            s.graphicsQuality === 3 &&
            s.fov === 90 &&
            Math.abs(s.mouseSensitivity - 1.0) < 0.02 &&
            s.musicVolume === 0 &&
            s.showCoords &&
            ctx.shiftLockActive;
          if (ok) {
            this.unlock(82);
          } else {
            this.systemMsg(
              this.msg(
                'Omega Protocol rejected! Required: Graphics=3, FOV=90, Sens=1.00, Music=0%, Coords=ON, ShiftLock=ON.',
                'Протокол Омега отклонён! Нужно: Графика=3, FOV=90, Sens=1.00, Музыка=0%, Координаты=ВКЛ, ShiftLock=ВКЛ.'
              ),
              'error'
            );
          }
          return;
        }

        case '/race':
          this.raceStartTime = Date.now();
          this.raceZones.clear();
          if (ctx.zone !== 'void') this.raceZones.add(ctx.zone);
          this.systemMsg(
            this.msg(
              '🏁 Speedrun started! Visit all 6 main zones in under 90 seconds!',
              '🏁 Спидран начат! Посети все 6 главных зон за 90 секунд!'
            ),
            'system'
          );
          return;

        case '/okay?':
        case '/okay':
          if (cmd === '/okay?') {
            this.unlock(85);
          } else {
            this.systemMsg(
              this.msg("Almost! Don't forget the question mark at the end...", 'Почти! Не забудь вопросительный знак в конце команды...'),
              'whisper'
            );
          }
          return;

        case '/astra':
          this.unlock(89);
          return;

        case '/quad':
          if (arg === 'apex') {
            this.unlock(93);
          } else {
            this.systemMsg(this.msg('Quad Layer Cipher mismatch!', 'Четырёхслойный шифр не совпал!'), 'error');
          }
          return;

        case '/seal':
          if (this.sevenSealsStep === 6 && ctx.zone === 'sky') {
            this.sevenSealsStep = 0;
            this.unlock(94);
          } else {
            this.systemMsg(
              this.msg(
                `Seven Seals not ready (current step: ${this.sevenSealsStep}/6, zone: ${ctx.zone}).`,
                `Семь Печатей не готовы (текущий этап: ${this.sevenSealsStep}/6, зона: ${ctx.zone}).`
              ),
              'error'
            );
          }
          return;

        case '/architect':
          if (this.architectStep >= 2) {
            this.unlock(98);
          } else {
            this.systemMsg(
              this.msg(
                'Complete the hidden marks in Index (#1) and Settings first!',
                'Сначала выполни скрытые знаки в Index (#1) и в Настройках!'
              ),
              'error'
            );
          }
          return;

        case '/eternity': {
          const nearStatue = ctx.position.distanceTo(new THREE.Vector3(0, 1, -14)) < 7.5;
          if (this.collectedRelics.size >= 3 && nearStatue && ctx.isFirstPerson) {
            this.unlock(99);
          } else {
            this.systemMsg(
              this.msg(
                `For /eternity you need: 3 relics (${this.collectedRelics.size}/3), near Founder Statue (${nearStatue ? 'YES' : 'NO'}), First Person (${ctx.isFirstPerson ? 'YES' : 'NO'}).`,
                `Для /eternity нужно: 3 реликвии (${this.collectedRelics.size}/3), стоять у Статуи Основателя (${nearStatue ? 'ДА' : 'НЕТ'}), First Person (${ctx.isFirstPerson ? 'ДА' : 'НЕТ'}).`
              ),
              'error'
            );
          }
          return;
        }

        case '/universe':
          if (this.unlocked.size >= 99) {
            this.unlock(100);
          } else {
            this.systemMsg(
              this.msg(
                `Too soon! Unlock all 99 other secrets first (${this.unlocked.size}/99) to awaken SECRET UNIVERSE!`,
                `Ещё рано! Собери все 99 остальных секретов (сейчас ${this.unlocked.size}/99), чтобы пробудить SECRET UNIVERSE!`
              ),
              'whisper'
            );
          }
          return;

        default:
          this.systemMsg(
            this.msg(
              `Unknown command "${cmd}". Type /help for basic commands.`,
              `Неизвестная команда «${cmd}». Введи /help для списка базовых команд.`
            ),
            'error'
          );
          return;
      }
    }

    // Plain chat word secrets (accept both English and Russian where applicable)
    if (lower === 'привет' || lower === 'hello' || lower === 'hi' || lower.startsWith('привет ') || lower.startsWith('hello ')) {
      this.unlock(5);
    }
    if (lower === 'skyeye') this.unlock(26);
    if (lower === '7492') this.unlock(27);
    if (lower === 'secret') this.unlock(28);
    if (lower === 'world') this.unlock(29);
    if ((lower === 'тепло' || lower === 'warm') && this.campfireTime >= 4.5) this.unlock(31);
    if (lower === 'moon') this.unlock(50);
    if (lower === '03:45' || lower === '0345') this.unlock(58);
    if (lower === 'secret universe' && ctx.zone === 'sky') this.unlock(68);
    if (lower === 'nullvoid' && this.voidFalls >= 5) this.unlock(78);
    if (
      lower === '...' &&
      ctx.settings.sfxVolume === 0 &&
      ctx.settings.musicVolume === 0 &&
      ctx.isFirstPerson &&
      ctx.activeTriggers.has('observatory_peak')
    ) {
      this.unlock(84);
    }
    if (lower === 'xray99') this.unlock(86);
    if (lower === 'esrevinu' && ctx.activeTriggers.has('void_mirror') && ctx.isFirstPerson) {
      this.mirrorReadyUntil = Date.now() + 8000;
      this.systemMsg(
        this.msg(
          'The mirror trembles! Quickly zoom the camera out to maximum!',
          'Зеркало задрожало! Быстро отдали камеру до максимума!'
        ),
        'whisper'
      );
    }
    if (lower === 'ignis' && ctx.zone === 'library' && this.sevenSealsStep === 4) {
      this.sevenSealsStep = 5;
      this.systemMsg(
        this.msg(
          'Seal #5/7 ("ignis" in Library) activated! Run to the Fire Altar in Volcano!',
          'Печать #5/7 («ignis» в Библиотеке) активирована! Беги к Алтарю Огня в Вулкане!'
        ),
        'whisper'
      );
    }
  }

  private recordEmoteChain(cmd: string): void {
    const now = Date.now();
    this.emoteChain = this.emoteChain.filter((e) => now - e.time <= 20000);
    this.emoteChain.push({ cmd, time: now });
    const target = ['/wave', '/dance', '/cheer', '/sit'];
    if (
      this.emoteChain.length >= 4 &&
      this.emoteChain.slice(-4).every((e, i) => e.cmd === target[i])
    ) {
      this.emoteChain = [];
      this.unlock(71);
    }
  }
}
