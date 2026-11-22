import * as THREE from 'three';
import { Avatar, EmoteType } from './Avatar';
import { buildWorld, InteractableItem, WorldData, WorldStructure } from './WorldBuilder';
import { NearbyFriendInfo, PlayerContext, SecretManager } from './SecretManager';
import { soundEngine } from '../audio/soundEngine';
import { UI_TEXT, ZONE_NAMES_I18N } from '../i18n/translations';
import {
  AuthUser,
  ChatMessage,
  GameSettings,
  HighFiveEvent,
  HudSnapshot,
  InspectContent,
  RemotePlayerData,
  SecretDef,
  ZoneId,
} from '../types/game';

const SPAWN_POS = new THREE.Vector3(0, 0.5, 10);

type CutscenePhase = 'focus' | 'build' | 'flash' | 'hold' | 'return';

interface ActiveCutscene {
  structure: WorldStructure;
  phase: CutscenePhase;
  phaseTime: number;
  buildDuration: number;
  startCamPos: THREE.Vector3;
  startCamLook: THREE.Vector3;
  lastSnapSoundTime: number;
  snappedIndices: Set<number>;
}

interface RemotePlayerEntity {
  userId: string;
  username: string;
  avatarColor: string;
  avatar: Avatar;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  yaw: number;
  targetYaw: number;
  speed: number;
  grounded: boolean;
  velY: number;
  zone: ZoneId;
  secretCount: number;
  lastDanceAt: number;
}

export interface GameEngineHooks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onSecretUnlocked: (secret: SecretDef, total: number) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onClearChat: () => void;
  onInspect: (content: InspectContent) => void;
  onOpenPause: () => void;
  onToggleIndex: () => void;
  onToggleSocial: () => void;
  onFocusChat: (prefix?: string) => void;
  onSendState: (state: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    speed: number;
    grounded: boolean;
    velY: number;
    zone: ZoneId;
    secretCount: number;
  }) => void;
  onSendEmote: (emote: EmoteType) => void;
  onSendChat: (text: string) => void;
  onSendHighFive: (targetUserId: string) => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export class GameEngine {
  private container: HTMLElement;
  private hooks: GameEngineHooks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private avatar: Avatar;
  private world: WorldData;
  public secretManager: SecretManager;

  // Player state
  private position = SPAWN_POS.clone();
  private velocity = new THREE.Vector3();
  private avatarYaw = 0;
  private grounded = false;
  private coyoteTimer = 0;
  private jumpBuffer = 0;
  private peakFallY = 0;
  private currentZone: ZoneId = 'plaza';
  private activeTriggers = new Set<string>();
  private stepTimer = 0;

  // Camera state
  private camYaw = 0;
  private camPitch = 0.28;
  private targetCamDist = 11;
  private camDist = 11;
  public shiftLockActive = false;
  private isFirstPerson = false;
  private isMaxZoomOut = false;
  private isMouseDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private pointerLocked = false;

  // Cutscene state
  private cutsceneQueue: string[] = [];
  private activeCutscene: ActiveCutscene | null = null;
  private modalOpen = false; // tracks Pause / Index / Inspect modals so cutscenes wait until visible!

  // Multiplayer state
  private authUser: AuthUser;
  private remotePlayers = new Map<string, RemotePlayerEntity>();
  private friendIds = new Set<string>();
  private highFivedFriendIds = new Set<string>();
  private standingOnPlayerId: string | null = null;
  private nearbyHighFiveTarget: RemotePlayerEntity | null = null;
  private highFiveGlowUntil = 0;

  // Input & UI lock
  private keys = new Set<string>();
  public uiBlocked = false;
  private settings: GameSettings;
  private currentInteractable: InteractableItem | null = null;
  private statusBanner: string | null = null;
  private bubbleText: string | null = null;
  private bubbleExpiresAt = 0;

  // Loop
  private rafId = 0;
  private lastTime = performance.now();
  private elapsedTime = 0;
  private frameCounter = 0;
  private fpsAccum = 0;
  private fps = 60;
  private hudEmitAccum = 0;
  private disposed = false;

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    authUser: AuthUser,
    hooks: GameEngineHooks
  ) {
    this.container = container;
    this.authUser = authUser;
    this.hooks = hooks;
    this.settings = { ...initialSettings };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1b33);
    this.scene.fog = new THREE.FogExp2(0x0c1b33, 0.0048);

    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      450
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    container.appendChild(this.renderer.domElement);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    this.sunLight.position.set(45, 78, 36);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 220;
    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Build World (ALL structures start completely hidden / unbuilt!)
    this.world = buildWorld(this.scene, this.settings.language);
    this.avatar = new Avatar({ torsoColor: this.authUser.avatarColor });
    this.avatar.root.position.copy(this.position);
    this.scene.add(this.avatar.root);

    this.secretManager = new SecretManager(
      {
        onSecretUnlocked: (secret, total) => hooks.onSecretUnlocked(secret, total),
        onStructureUnlocked: (structureId) => this.enqueueStructureBuild(structureId),
        onResetWorld: () => {
          this.cutsceneQueue = [];
          if (this.activeCutscene) {
            this.world.setStructureFlashWhite(this.activeCutscene.structure.id, false);
            this.activeCutscene = null;
          }
          this.world.resetAllStructures();
          Object.values(this.world.relicMeshes).forEach((m) => (m.visible = true));
          this.respawn();
        },
        onChatMessage: (msg) => hooks.onChatMessage(msg),
        onPublicChat: (text) => hooks.onSendChat(text),
        onEmote: (em) => {
          this.avatar.setEmote(em);
          hooks.onSendEmote(em);
        },
        onHighFiveNearest: () => this.tryHighFiveNearest(),
        onTeleport: (pos) => this.teleport(pos),
        onRespawn: () => this.respawn(),
        onGravityBoost: () => {
          this.velocity.y = 22;
          this.grounded = false;
          soundEngine.playBounce();
        },
        onClearChat: () => hooks.onClearChat(),
        onVisualUpdate: (event, payload) => this.handleWorldVisualUpdate(event, payload),
        onStatusBanner: (text) => {
          this.statusBanner = text;
        },
      },
      this.settings.language,
      this.authUser.id,
      this.authUser.username
    );

    // Restore already-unlocked structures immediately from saved progress (no cutscene replay on reload)
    for (const structId of this.secretManager.getInitiallyBuiltStructures()) {
      this.world.setStructureBuiltImmediate(structId, true);
    }

    this.applyGraphicsSettings(this.settings.graphicsQuality);
    soundEngine.setVolumes(this.settings.sfxVolume, this.settings.musicVolume);
    this.bindEvents();
    this.secretManager.onGameStart();

    this.lastTime = performance.now();
    this.loop();
  }

  private enqueueStructureBuild(structureId: string): void {
    const st = this.world.structures[structureId];
    if (!st || st.built || st.animating) return;
    if (!this.cutsceneQueue.includes(structureId)) {
      this.cutsceneQueue.push(structureId);
    }
  }

  private startNextCutsceneIfReady(): void {
    if (this.activeCutscene || this.modalOpen || this.cutsceneQueue.length === 0) return;
    const nextId = this.cutsceneQueue.shift()!;
    const structure = this.world.structures[nextId];
    if (!structure || structure.built) {
      this.startNextCutsceneIfReady();
      return;
    }

    // Stop player motion cleanly when cutscene begins
    this.keys.clear();
    this.velocity.x = 0;
    this.velocity.z = 0;
    this.isMouseDragging = false;

    // Prepare Lego pieces hidden above target
    structure.animating = true;
    structure.group.visible = true;
    for (const p of structure.pieces) {
      p.obj.visible = false;
      p.obj.position.set(p.targetPos.x, p.targetPos.y + p.dropHeight, p.targetPos.z);
      p.obj.rotation.set(p.targetRot.x + p.tiltX, p.targetRot.y, p.targetRot.z + p.tiltZ);
      p.obj.scale.set(0.25, 0.25, 0.25);
    }

    const { pos: curCamPos, look: curCamLook } = this.computePlayerCameraPose();
    const pieceCount = structure.pieces.length;
    const buildDuration = Math.max(1.15, Math.min(2.2, 0.9 + pieceCount * 0.045));

    this.activeCutscene = {
      structure,
      phase: 'focus',
      phaseTime: 0,
      buildDuration,
      startCamPos: curCamPos,
      startCamLook: curCamLook,
      lastSnapSoundTime: -1,
      snappedIndices: new Set(),
    };
  }

  private updateCutscene(dt: number): void {
    const cs = this.activeCutscene;
    if (!cs) return;

    cs.phaseTime += dt;
    const st = cs.structure;
    const focusDur = 0.75;
    const flashDur = 0.16;
    const holdDur = 0.5; // Exact half-second after white flash!
    const returnDur = 0.7;

    if (cs.phase === 'focus') {
      const t = Math.min(1, cs.phaseTime / focusDur);
      const e = easeInOutCubic(t);
      const pos = new THREE.Vector3().lerpVectors(cs.startCamPos, st.camPos, e);
      const look = new THREE.Vector3().lerpVectors(cs.startCamLook, st.camLookAt, e);
      this.camera.position.copy(pos);
      this.camera.lookAt(look);
      if (t >= 1) {
        cs.phase = 'build';
        cs.phaseTime = 0;
      }
      return;
    }

    if (cs.phase === 'build') {
      this.camera.position.copy(st.camPos);
      this.camera.lookAt(st.camLookAt);

      const pieces = st.pieces;
      const n = pieces.length;
      const pieceDur = Math.min(0.32, cs.buildDuration * 0.45);
      const spread = Math.max(0.01, cs.buildDuration - pieceDur);

      for (let i = 0; i < n; i++) {
        const p = pieces[i];
        const startT = n <= 1 ? 0 : (i / (n - 1)) * spread;
        const localT = (cs.phaseTime - startT) / pieceDur;
        if (localT <= 0) {
          p.obj.visible = false;
          continue;
        }
        p.obj.visible = true;
        const clamped = Math.min(1, localT);
        const dropEase = easeOutBack(clamped);

        // Snap from above like Lego bricks clicking together!
        const yOffset = (1 - dropEase) * p.dropHeight;
        p.obj.position.set(p.targetPos.x, p.targetPos.y + Math.max(-0.18, yOffset), p.targetPos.z);

        const rotEase = easeInOutCubic(clamped);
        p.obj.rotation.set(
          p.targetRot.x + p.tiltX * (1 - rotEase),
          p.targetRot.y,
          p.targetRot.z + p.tiltZ * (1 - rotEase)
        );

        const sEase = Math.min(1.06, 0.25 + dropEase * 0.75);
        const finalScaleFactor = clamped >= 1 ? 1 : sEase;
        p.obj.scale.set(
          p.targetScale.x * finalScaleFactor,
          p.targetScale.y * finalScaleFactor,
          p.targetScale.z * finalScaleFactor
        );

        if (clamped >= 0.85 && !cs.snappedIndices.has(i)) {
          cs.snappedIndices.add(i);
          if (cs.phaseTime - cs.lastSnapSoundTime >= 0.06) {
            cs.lastSnapSoundTime = cs.phaseTime;
            soundEngine.playLegoSnap(i / Math.max(1, n - 1));
          }
        }
      }

      if (cs.phaseTime >= cs.buildDuration + 0.05) {
        // Snap every piece to exact final transform
        for (const p of pieces) {
          p.obj.visible = true;
          p.obj.position.copy(p.targetPos);
          p.obj.rotation.copy(p.targetRot);
          p.obj.scale.copy(p.targetScale);
        }
        // Trigger the SINGLE PURE WHITE FLASH!
        this.world.setStructureFlashWhite(st.id, true, 1.0);
        soundEngine.playBuildComplete();
        cs.phase = 'flash';
        cs.phaseTime = 0;
      }
      return;
    }

    if (cs.phase === 'flash') {
      this.camera.position.copy(st.camPos);
      this.camera.lookAt(st.camLookAt);
      if (cs.phaseTime < flashDur) {
        // Crisp solid pure-white single flash
        this.world.setStructureFlashWhite(st.id, true, 1.0);
      } else {
        // Restore original materials cleanly and begin exact 0.5s hold!
        this.world.setStructureFlashWhite(st.id, false);
        if (st.id === 'plaza_base') {
          this.world.clouds.visible = true;
        }
        cs.phase = 'hold';
        cs.phaseTime = 0;
      }
      return;
    }

    if (cs.phase === 'hold') {
      // Wait half a second (0.5s) admiring the completed structure!
      this.camera.position.copy(st.camPos);
      this.camera.lookAt(st.camLookAt);
      if (cs.phaseTime >= holdDur) {
        cs.phase = 'return';
        cs.phaseTime = 0;
      }
      return;
    }

    if (cs.phase === 'return') {
      const t = Math.min(1, cs.phaseTime / returnDur);
      const e = easeInOutCubic(t);
      const { pos: playerCamPos, look: playerCamLook } = this.computePlayerCameraPose();
      const pos = new THREE.Vector3().lerpVectors(st.camPos, playerCamPos, e);
      const look = new THREE.Vector3().lerpVectors(st.camLookAt, playerCamLook, e);
      this.camera.position.copy(pos);
      this.camera.lookAt(look);

      if (t >= 1) {
        st.built = true;
        st.animating = false;
        this.activeCutscene = null;
        // If another structure is queued, play it next; otherwise player can walk again!
        this.startNextCutsceneIfReady();
      }
    }
  }

  private computePlayerCameraPose(): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const pivot = new THREE.Vector3(this.position.x, this.position.y + 2.02, this.position.z);

    if (this.shiftLockActive && !this.isFirstPerson) {
      const rightX = Math.cos(this.camYaw);
      const rightZ = -Math.sin(this.camYaw);
      pivot.x += rightX * 1.25;
      pivot.z += rightZ * 1.25;
    }

    if (this.isFirstPerson) {
      const look = new THREE.Vector3(
        pivot.x - Math.sin(this.camYaw) * Math.cos(this.camPitch),
        pivot.y - Math.sin(this.camPitch),
        pivot.z - Math.cos(this.camYaw) * Math.cos(this.camPitch)
      );
      return { pos: pivot.clone(), look };
    }

    const horizDist = Math.cos(this.camPitch) * this.camDist;
    const vertDist = Math.sin(this.camPitch) * this.camDist;
    const pos = new THREE.Vector3(
      pivot.x + Math.sin(this.camYaw) * horizDist,
      pivot.y + vertDist,
      pivot.z + Math.cos(this.camYaw) * horizDist
    );
    return { pos, look: pivot };
  }

  private handleWorldVisualUpdate(event: string, payload?: string): void {
    if (event === 'rainbow_on' && payload && this.world.pillarMaterials[payload]) {
      this.world.pillarMaterials[payload].emissiveIntensity = 1.4;
    } else if (event === 'rainbow_reset') {
      Object.values(this.world.pillarMaterials).forEach((m) => (m.emissiveIntensity = 0.25));
    } else if (event === 'vcrystal_on' && payload && this.world.crystalMaterials[payload]) {
      this.world.crystalMaterials[payload].emissiveIntensity = 1.6;
    } else if (event === 'vcrystal_reset') {
      Object.values(this.world.crystalMaterials).forEach((m) => (m.emissiveIntensity = 0.4));
    } else if (event === 'torch_on' && payload && this.world.torchFlames[payload]) {
      const m = (this.world.torchFlames[payload] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      m.color.setHex(0xf97316);
      m.emissiveIntensity = 1.8;
    } else if (event === 'torch_reset') {
      Object.values(this.world.torchFlames).forEach((f) => {
        const m = (f as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.color.setHex(0x94a3b8);
        m.emissiveIntensity = 0.15;
      });
    } else if (event === 'plate_on' && payload) {
      const key = payload.replace('plate_', 'p');
      const mesh = this.world.plateMeshes[key];
      if (mesh) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.color.setHex(0x22c55e);
        m.emissive.setHex(0x16a34a);
        m.emissiveIntensity = 1.0;
      }
    } else if (event === 'relic_taken' && payload && this.world.relicMeshes[payload]) {
      this.world.relicMeshes[payload].visible = false;
    }
  }

  public updateSettings(next: GameSettings): void {
    const prev = { ...this.settings };
    this.settings = { ...next };

    if (prev.language !== next.language) {
      this.world.setLanguage(next.language);
      this.secretManager.setLanguage(next.language);
    }
    if (prev.graphicsQuality !== next.graphicsQuality) {
      this.applyGraphicsSettings(next.graphicsQuality);
    }
    if (prev.fov !== next.fov) {
      this.camera.fov = next.fov;
      this.camera.updateProjectionMatrix();
    }
    if (!next.shiftLockEnabled && this.shiftLockActive) {
      this.setShiftLock(false);
    }
    soundEngine.setVolumes(next.sfxVolume, next.musicVolume);
    this.secretManager.onSettingsChanged(prev, next, this.getPlayerContext());
  }

  private applyGraphicsSettings(level: 1 | 2 | 3 | 4 | 5): void {
    const dpr = window.devicePixelRatio || 1;
    if (level === 1) {
      this.renderer.setPixelRatio(0.75);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.scene.fog = new THREE.FogExp2(0x152847, 0.0022);
    } else if (level === 2) {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.scene.fog = new THREE.FogExp2(0x0f203d, 0.0042);
    } else if (level === 3) {
      this.renderer.setPixelRatio(Math.min(1.25, dpr));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.scene.fog = new THREE.FogExp2(0x0c1b33, 0.0048);
    } else if (level === 4) {
      this.renderer.setPixelRatio(Math.min(1.5, dpr));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.scene.fog = new THREE.FogExp2(0x0a172e, 0.0042);
    } else {
      this.renderer.setPixelRatio(Math.min(2.0, dpr));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.scene.fog = new THREE.FogExp2(0x081326, 0.0036);
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  public setUiBlocked(blocked: boolean, isModal = false): void {
    this.uiBlocked = blocked;
    this.modalOpen = isModal;
    if (blocked) {
      this.keys.clear();
      this.isMouseDragging = false;
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
    }
    if (!isModal) {
      this.startNextCutsceneIfReady();
    }
  }

  public toggleShiftLock(): void {
    if (!this.settings.shiftLockEnabled || this.activeCutscene) return;
    this.setShiftLock(!this.shiftLockActive);
  }

  public setShiftLock(active: boolean): void {
    this.shiftLockActive = active;
    soundEngine.playClick();
    if (active && !this.uiBlocked && !this.activeCutscene) {
      try {
        this.renderer.domElement.requestPointerLock?.();
      } catch {
        // fallback
      }
    } else if (!active && !this.isFirstPerson) {
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
    }
    this.secretManager.onShiftLockToggle(active, this.getPlayerContext());
  }

  public sendChat(text: string): void {
    if (!text.trim()) return;
    this.bubbleText = text.trim().slice(0, 64);
    this.bubbleExpiresAt = Date.now() + 4200;
    this.secretManager.handleChatInput(text, this.getPlayerContext());
  }

  public teleport(pos: THREE.Vector3): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.peakFallY = pos.y;
  }

  public respawn(): void {
    this.teleport(SPAWN_POS);
    this.avatar.setEmote('none');
  }

  public setRemotePlayers(players: RemotePlayerData[]): void {
    const incomingIds = new Set(players.map((p) => p.userId));
    for (const uid of [...this.remotePlayers.keys()]) {
      if (!incomingIds.has(uid)) {
        this.removeRemotePlayer(uid);
      }
    }
    for (const p of players) {
      if (p.userId === this.authUser.id) continue;
      if (!this.remotePlayers.has(p.userId)) {
        this.addRemotePlayer(p);
      } else {
        this.updateRemotePlayerState(p);
      }
    }
  }

  public addRemotePlayer(player: RemotePlayerData): void {
    if (player.userId === this.authUser.id) return;
    if (this.remotePlayers.has(player.userId)) {
      this.updateRemotePlayerState(player);
      return;
    }
    const avatar = new Avatar({
      torsoColor: player.avatarColor,
      username: player.username,
      isFriend: this.friendIds.has(player.userId),
    });
    const pos = new THREE.Vector3(player.x, player.y, player.z);
    avatar.root.position.copy(pos);
    avatar.root.rotation.y = player.yaw;
    this.scene.add(avatar.root);

    this.remotePlayers.set(player.userId, {
      userId: player.userId,
      username: player.username,
      avatarColor: player.avatarColor,
      avatar,
      pos: pos.clone(),
      targetPos: pos.clone(),
      yaw: player.yaw,
      targetYaw: player.yaw,
      speed: player.speed,
      grounded: player.grounded,
      velY: player.velY,
      zone: player.zone,
      secretCount: player.secretCount,
      lastDanceAt: 0,
    });
  }

  public removeRemotePlayer(userId: string): void {
    const ent = this.remotePlayers.get(userId);
    if (!ent) return;
    this.scene.remove(ent.avatar.root);
    ent.avatar.dispose();
    this.remotePlayers.delete(userId);
    if (this.standingOnPlayerId === userId) this.standingOnPlayerId = null;
    if (this.nearbyHighFiveTarget?.userId === userId) this.nearbyHighFiveTarget = null;
  }

  public updateRemotePlayerState(state: {
    userId: string;
    x: number;
    y: number;
    z: number;
    yaw: number;
    speed: number;
    grounded: boolean;
    velY: number;
    zone: ZoneId;
    secretCount: number;
  }): void {
    const ent = this.remotePlayers.get(state.userId);
    if (!ent) return;
    ent.targetPos.set(state.x, state.y, state.z);
    ent.targetYaw = state.yaw;
    ent.speed = state.speed;
    ent.grounded = state.grounded;
    ent.velY = state.velY;
    ent.zone = state.zone;
    ent.secretCount = state.secretCount;
  }

  public handleRemotePlayerEmote(userId: string, emote: string): void {
    const ent = this.remotePlayers.get(userId);
    if (!ent) return;
    if (emote === 'dance' || emote === 'wave' || emote === 'sit' || emote === 'cheer' || emote === 'laugh') {
      ent.avatar.setEmote(emote);
    }
    if (emote === 'dance') {
      ent.lastDanceAt = Date.now();
    }
    const dist = this.position.distanceTo(ent.pos);
    this.secretManager.onRemoteEmote(userId, emote, dist, this.friendIds.has(userId));
  }

  public handleRemotePlayerChat(userId: string, text: string): void {
    const ent = this.remotePlayers.get(userId);
    if (ent) {
      ent.avatar.showBubble(text);
    }
  }

  public handleHighFive(ev: HighFiveEvent): void {
    const isSender = ev.fromUserId === this.authUser.id;
    const otherId = isSender ? ev.toUserId : ev.fromUserId;
    const otherName = isSender ? ev.toUsername : ev.fromUsername;

    soundEngine.playBuildComplete();
    this.avatar.setEmote('wave');
    this.highFiveGlowUntil = Date.now() + 2600;

    const remote = this.remotePlayers.get(otherId);
    if (remote) {
      remote.avatar.setEmote('wave');
    }

    if (this.friendIds.has(otherId)) {
      this.highFivedFriendIds.add(otherId);
    }

    const isRu = this.settings.language === 'ru';
    this.secretManager.systemMsg(
      isRu
        ? `🙌 Вы дали Пять игроку ${otherName}!`
        : `🙌 You High-Fived ${otherName}!`,
      'whisper'
    );
  }

  public setFriendIds(friendIds: Set<string>): void {
    this.friendIds = new Set(friendIds);
    for (const ent of this.remotePlayers.values()) {
      ent.avatar.setFriendBadge(this.friendIds.has(ent.userId));
    }
  }

  public teleportToPlayer(userId: string): boolean {
    const ent = this.remotePlayers.get(userId);
    if (!ent) return false;
    // Place slightly beside the friend
    const dest = ent.pos.clone().add(new THREE.Vector3(1.8, 0.5, 1.8));
    this.teleport(dest);
    soundEngine.playPortal();
    return true;
  }

  public tryHighFiveNearest(): void {
    let best: RemotePlayerEntity | null = null;
    let bestDist = 5.5;
    for (const ent of this.remotePlayers.values()) {
      const d = this.position.distanceTo(ent.pos);
      if (d < bestDist) {
        best = ent;
        bestDist = d;
      }
    }
    if (!best) {
      soundEngine.playError();
      const isRu = this.settings.language === 'ru';
      this.secretManager.systemMsg(
        isRu
          ? 'Рядом нет других игроков, чтобы дать Пять! Подойди ближе к игроку.'
          : 'No other player nearby to High-Five! Walk closer to another player.',
        'system'
      );
      return;
    }
    this.hooks.onSendHighFive(best.userId);
  }

  public getPlayerContext(): PlayerContext {
    const nearbyFriends: NearbyFriendInfo[] = [];
    for (const ent of this.remotePlayers.values()) {
      if (this.friendIds.has(ent.userId)) {
        nearbyFriends.push({
          userId: ent.userId,
          username: ent.username,
          distance: this.position.distanceTo(ent.pos),
          lastDanceAt: ent.lastDanceAt,
        });
      }
    }

    return {
      position: this.position.clone(),
      zone: this.currentZone,
      shiftLockActive: this.shiftLockActive,
      isFirstPerson: this.isFirstPerson,
      isMaxZoomOut: this.isMaxZoomOut,
      isSitting: this.avatar.emote === 'sit',
      activeTriggers: this.activeTriggers,
      settings: this.settings,
      peakFallY: this.peakFallY,
      isMovingBackwards: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      founderStatueBuilt: this.world.isStructureBuilt('founder_statue'),
      standingOnPlayerId: this.standingOnPlayerId,
      nearbyFriends,
      highFivedFriendIds: this.highFivedFriendIds,
    };
  }

  public triggerInteract(): void {
    if (this.activeCutscene) return;
    if (!this.currentInteractable && this.nearbyHighFiveTarget) {
      this.hooks.onSendHighFive(this.nearbyHighFiveTarget.userId);
      return;
    }
    if (!this.currentInteractable) return;
    const item = this.currentInteractable;
    const isRu = this.settings.language === 'ru';

    if (item.requireFirstPerson && !this.isFirstPerson) {
      soundEngine.playError();
      this.secretManager.systemMsg(
        isRu
          ? 'Приблизь камеру в режим От первого лица (колёсико вверх / клавиша I), чтобы рассмотреть это вблизи!'
          : 'Zoom all the way into First Person (scroll up / key I) to inspect this up close!',
        'system'
      );
      return;
    }
    if (item.requireGraphics !== undefined && this.settings.graphicsQuality !== item.requireGraphics) {
      soundEngine.playError();
      this.secretManager.systemMsg(
        isRu
          ? `Для взаимодействия нужен уровень Графики = ${item.requireGraphics}!`
          : `Requires Graphics Quality = ${item.requireGraphics}!`,
        'system'
      );
      return;
    }
    if (item.requireMinGraphics !== undefined && this.settings.graphicsQuality < item.requireMinGraphics) {
      soundEngine.playError();
      this.secretManager.systemMsg(
        isRu
          ? `Слишком низкая детализация! Поставь Графику ≥ ${item.requireMinGraphics}.`
          : `Detail too low! Set Graphics Quality ≥ ${item.requireMinGraphics}.`,
        'system'
      );
      return;
    }
    if (item.requireMaxZoomOut && !this.isMaxZoomOut) {
      soundEngine.playError();
      this.secretManager.systemMsg(
        isRu ? 'Отдали камеру на максимум!' : 'Zoom the camera all the way out!',
        'system'
      );
      return;
    }

    if (item.inspect) {
      soundEngine.playInteract();
      this.hooks.onInspect(item.inspect);
    }
    if (item.onInteractKey) {
      this.secretManager.onInteract(item.onInteractKey, this.getPlayerContext());
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    dom.addEventListener('wheel', this.onWheel, { passive: false });
    dom.addEventListener('contextmenu', this.onContextMenu);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);

    const dom = this.renderer.domElement;
    dom.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    dom.removeEventListener('wheel', this.onWheel);
    dom.removeEventListener('contextmenu', this.onContextMenu);

    for (const ent of this.remotePlayers.values()) {
      this.scene.remove(ent.avatar.root);
      ent.avatar.dispose();
    }
    this.remotePlayers.clear();

    this.renderer.dispose();
    if (dom.parentElement) dom.parentElement.removeChild(dom);
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent): void => {
    soundEngine.unlockAudio();
    if (this.uiBlocked || this.activeCutscene) return;

    if (e.button === 2 || e.button === 0) {
      this.isMouseDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }

    if ((this.shiftLockActive || this.isFirstPerson) && !this.pointerLocked && e.button === 0) {
      try {
        this.renderer.domElement.requestPointerLock?.();
      } catch {
        // fallback
      }
    }
  };

  private onMouseUp = (): void => {
    this.isMouseDragging = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.uiBlocked || this.activeCutscene) return;

    const sens = 0.0032 * this.settings.mouseSensitivity;
    let dx = 0;
    let dy = 0;

    if (this.pointerLocked) {
      dx = e.movementX;
      dy = e.movementY;
    } else if (this.isMouseDragging) {
      dx = e.clientX - this.lastMouseX;
      dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    } else {
      return;
    }

    this.camYaw -= dx * sens;
    this.camPitch = Math.max(-1.32, Math.min(1.38, this.camPitch + dy * sens));
  };

  private onWheel = (e: WheelEvent): void => {
    if (this.uiBlocked || this.activeCutscene) return;
    e.preventDefault();
    const step = e.deltaY > 0 ? 1.8 : -1.8;
    this.adjustZoom(step);
  };

  public adjustZoom(delta: number): void {
    if (this.activeCutscene) return;
    this.targetCamDist = Math.max(0, Math.min(52, this.targetCamDist + delta));
    if (this.targetCamDist < 0.85 && delta < 0) {
      this.targetCamDist = 0;
    } else if (this.targetCamDist > 0 && this.targetCamDist < 2.2 && delta > 0) {
      this.targetCamDist = 3.0;
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    soundEngine.unlockAudio();

    const tag = (e.target as HTMLElement)?.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
    if (!isTyping) {
      this.secretManager.onKeyDown(e.code);
    }

    if (e.code === 'Escape') {
      if (!isTyping && !this.activeCutscene) {
        this.hooks.onOpenPause();
      }
      return;
    }

    if (isTyping || this.activeCutscene) return;

    if (e.code === 'Tab') {
      e.preventDefault();
      this.hooks.onToggleIndex();
      return;
    }

    if (e.code === 'KeyP' && !this.uiBlocked) {
      e.preventDefault();
      this.hooks.onToggleSocial();
      return;
    }

    if (this.uiBlocked) return;

    if (e.key === '/') {
      e.preventDefault();
      this.hooks.onFocusChat('/');
      return;
    }

    if (e.code === 'Enter') {
      e.preventDefault();
      this.hooks.onFocusChat('');
      return;
    }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
      this.toggleShiftLock();
      return;
    }

    if (e.code === 'KeyI' || e.code === 'Equal') {
      this.adjustZoom(-3.2);
      return;
    }

    if (e.code === 'KeyO' || e.code === 'Minus') {
      this.adjustZoom(3.2);
      return;
    }

    if (e.code === 'KeyE') {
      this.triggerInteract();
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      this.jumpBuffer = 0.14;
    }

    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private loop = (): void => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.elapsedTime += dt;

    this.frameCounter++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.frameCounter / this.fpsAccum);
      this.frameCounter = 0;
      this.fpsAccum = 0;
    }

    // Start queued Lego cutscene if player isn't inside a modal
    this.startNextCutsceneIfReady();

    this.updatePhysics(dt);
    this.updateRemotePlayers(dt);

    if (this.activeCutscene) {
      this.updateCutscene(dt);
    } else {
      this.updateCamera(dt);
    }

    this.updateInteractables();

    let unityBeamActive = this.secretManager.unlocked.has(100);
    if (!unityBeamActive) {
      for (const ent of this.remotePlayers.values()) {
        if (this.friendIds.has(ent.userId) && Math.hypot(ent.pos.x, ent.pos.z) <= 13) {
          unityBeamActive = true;
          break;
        }
      }
    }

    this.world.updateDynamicVisuals(
      this.elapsedTime,
      this.settings.graphicsQuality,
      this.isMaxZoomOut,
      unityBeamActive
    );

    if (!this.activeCutscene) {
      this.secretManager.update(dt, this.getPlayerContext());
    }

    if (Date.now() < this.highFiveGlowUntil) {
      this.avatar.setAura(0.75, 0xfde047);
    } else if (this.statusBanner && (this.statusBanner.includes('s') || this.statusBanner.includes('сек'))) {
      this.avatar.setAura(0.55 + Math.sin(this.elapsedTime * 5) * 0.25, 0xfacc15);
    } else if (this.shiftLockActive) {
      this.avatar.setAura(0.28, 0x38bdf8);
    } else {
      this.avatar.setAura(0, 0x38bdf8);
    }

    // Stream local state to multiplayer server (~20Hz throttled inside MultiplayerClient)
    this.hooks.onSendState({
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      yaw: this.avatarYaw,
      speed: Math.hypot(this.velocity.x, this.velocity.z),
      grounded: this.grounded,
      velY: this.velocity.y,
      zone: this.currentZone,
      secretCount: this.secretManager.unlocked.size,
    });

    this.renderer.render(this.scene, this.camera);

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  };

  private updateRemotePlayers(dt: number): void {
    const lerpFactor = Math.min(1, dt * 14);
    for (const ent of this.remotePlayers.values()) {
      const prevX = ent.pos.x;
      const prevZ = ent.pos.z;
      ent.pos.lerp(ent.targetPos, lerpFactor);
      let diff = ent.targetYaw - ent.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ent.yaw += diff * lerpFactor;

      ent.avatar.root.position.copy(ent.pos);
      ent.avatar.root.rotation.y = ent.yaw;
      const visualSpeed = Math.max(
        ent.speed,
        Math.hypot(ent.pos.x - prevX, ent.pos.z - prevZ) / Math.max(0.001, dt)
      );
      ent.avatar.update(dt, visualSpeed, ent.grounded, ent.velY);
    }
  }

  private updatePhysics(dt: number): void {
    const moveSpeed = 10.6;
    const gravity = 34.0;
    const jumpVel = 13.8;

    // Walking is completely disabled during Lego construction cutscenes OR when UI is blocking!
    let inputForward = 0;
    let inputRight = 0;
    const movementLocked = this.uiBlocked || this.activeCutscene !== null;

    if (!movementLocked) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) inputForward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) inputForward -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) inputRight += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) inputRight -= 1;
    }

    const forwardX = -Math.sin(this.camYaw);
    const forwardZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    let moveX = forwardX * inputForward + rightX * inputRight;
    let moveZ = forwardZ * inputForward + rightZ * inputRight;
    const mag = Math.hypot(moveX, moveZ);
    if (mag > 0.001) {
      moveX /= mag;
      moveZ /= mag;
    }

    this.velocity.x = moveX * moveSpeed;
    this.velocity.z = moveZ * moveSpeed;

    if (this.shiftLockActive || this.isFirstPerson) {
      this.avatarYaw = this.camYaw;
    } else if (mag > 0.05) {
      const targetYaw = Math.atan2(-moveX, -moveZ);
      let diff = targetYaw - this.avatarYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.avatarYaw += diff * Math.min(1, dt * 14);
    }

    if (this.grounded) {
      this.coyoteTimer = 0.12;
      this.peakFallY = this.position.y;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      if (this.position.y > this.peakFallY) this.peakFallY = this.position.y;
    }

    if (this.jumpBuffer > 0 && !movementLocked) {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.coyoteTimer > 0) {
        this.velocity.y = jumpVel;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        soundEngine.playJump();
        this.secretManager.onJump();
      }
    } else if (movementLocked) {
      this.jumpBuffer = 0;
    }

    this.velocity.y -= gravity * dt;
    if (this.velocity.y < -42) this.velocity.y = -42;

    const prevX = this.position.x;
    const prevZ = this.position.z;
    const halfW = 0.42;
    const height = 2.25;

    // Resolve X (only built structures!)
    this.position.x += this.velocity.x * dt;
    for (const c of this.world.colliders) {
      if (c.active === false || !this.world.isStructureBuilt(c.structureId)) continue;
      if (
        this.position.y + height > c.minY + 0.05 &&
        this.position.y < c.maxY - 0.12 &&
        this.position.z + halfW > c.minZ &&
        this.position.z - halfW < c.maxZ &&
        this.position.x + halfW > c.minX &&
        this.position.x - halfW < c.maxX
      ) {
        if (this.velocity.x > 0) this.position.x = c.minX - halfW;
        else if (this.velocity.x < 0) this.position.x = c.maxX + halfW;
      }
    }

    // Resolve Z
    this.position.z += this.velocity.z * dt;
    for (const c of this.world.colliders) {
      if (c.active === false || !this.world.isStructureBuilt(c.structureId)) continue;
      if (
        this.position.y + height > c.minY + 0.05 &&
        this.position.y < c.maxY - 0.12 &&
        this.position.x + halfW > c.minX &&
        this.position.x - halfW < c.maxX &&
        this.position.z + halfW > c.minZ &&
        this.position.z - halfW < c.maxZ
      ) {
        if (this.velocity.z > 0) this.position.z = c.minZ - halfW;
        else if (this.velocity.z < 0) this.position.z = c.maxZ + halfW;
      }
    }

    // Resolve Y
    this.position.y += this.velocity.y * dt;
    this.grounded = false;
    this.standingOnPlayerId = null;
    for (const c of this.world.colliders) {
      if (c.active === false || !this.world.isStructureBuilt(c.structureId)) continue;
      if (
        this.position.x + halfW > c.minX &&
        this.position.x - halfW < c.maxX &&
        this.position.z + halfW > c.minZ &&
        this.position.z - halfW < c.maxZ &&
        this.position.y + height > c.minY &&
        this.position.y < c.maxY
      ) {
        if (c.hazard) {
          soundEngine.playError();
          this.secretManager.systemMsg(
            this.settings.language === 'ru'
              ? 'Ой! Горячая лава! Возврат на Площадь.'
              : 'Ouch! Molten lava! Returning to Spawn Plaza.',
            'error'
          );
          this.respawn();
          return;
        }
        if (this.velocity.y <= 0 && this.position.y >= c.maxY - 0.9) {
          this.position.y = c.maxY;
          if (c.bounce) {
            this.velocity.y = c.bounce;
            this.grounded = false;
            soundEngine.playBounce();
          } else {
            this.velocity.y = 0;
            this.grounded = true;
          }
        } else if (this.velocity.y > 0) {
          this.position.y = c.minY - height;
          this.velocity.y = 0;
        }
      }
    }

    // Player-on-Player head-stacking collision (enables Secret #97: Sky Riders!)
    if (this.velocity.y <= 0) {
      for (const ent of this.remotePlayers.values()) {
        const horiz = Math.hypot(this.position.x - ent.pos.x, this.position.z - ent.pos.z);
        const headTopY = ent.pos.y + 2.42;
        if (horiz <= 0.85 && this.position.y <= headTopY + 0.16 && this.position.y >= headTopY - 0.72) {
          this.position.y = headTopY;
          this.velocity.y = 0;
          this.grounded = true;
          this.standingOnPlayerId = ent.userId;
          break;
        }
      }
    }

    if (this.position.y < -22) {
      this.secretManager.onVoidFall();
      this.respawn();
      return;
    }

    const movedDist = Math.hypot(this.position.x - prevX, this.position.z - prevZ);
    if (!movementLocked) {
      this.secretManager.onWalk(movedDist);
    }
    if (this.grounded && movedDist > 0.02) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.32) {
        this.stepTimer = 0;
        soundEngine.playStep();
      }
    }

    const newZone = this.world.getZoneAt(this.position);
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.secretManager.onZoneEnter(newZone);
    }

    this.activeTriggers.clear();
    for (const t of this.world.triggers) {
      if (!this.world.isStructureBuilt(t.structureId)) continue;
      if (
        this.position.x >= t.minX &&
        this.position.x <= t.maxX &&
        this.position.y >= t.minY &&
        this.position.y <= t.maxY &&
        this.position.z >= t.minZ &&
        this.position.z <= t.maxZ
      ) {
        this.activeTriggers.add(t.id);
      }
    }

    this.avatar.root.position.copy(this.position);
    this.avatar.root.rotation.y = this.avatarYaw;
    const horizSpeed = movedDist / Math.max(0.001, dt);
    this.avatar.update(dt, horizSpeed, this.grounded, this.velocity.y);
  }

  private updateCamera(dt: number): void {
    if (
      this.settings.cameraMode === 'follow' &&
      !this.isMouseDragging &&
      !this.shiftLockActive &&
      !this.isFirstPerson
    ) {
      const horiz = Math.hypot(this.velocity.x, this.velocity.z);
      if (horiz > 1.0) {
        let diff = this.avatarYaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * Math.min(1, dt * 1.8);
      }
    }

    this.camDist += (this.targetCamDist - this.camDist) * Math.min(1, dt * 12);

    const nowFirstPerson = this.camDist <= 0.75;
    const nowMaxZoomOut = this.camDist >= 46;

    if (nowFirstPerson !== this.isFirstPerson || nowMaxZoomOut !== this.isMaxZoomOut) {
      this.isFirstPerson = nowFirstPerson;
      this.isMaxZoomOut = nowMaxZoomOut;
      this.avatar.setFirstPerson(this.isFirstPerson);
      this.secretManager.onCameraStateChange(this.isFirstPerson, this.isMaxZoomOut, this.getPlayerContext());
    }

    const { pos, look } = this.computePlayerCameraPose();
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
  }

  private updateInteractables(): void {
    if (this.activeCutscene) {
      this.currentInteractable = null;
      this.nearbyHighFiveTarget = null;
      return;
    }

    let best: InteractableItem | null = null;
    let bestDist = Infinity;

    for (const item of this.world.interactables) {
      if (!this.world.isStructureBuilt(item.structureId)) continue;
      if (item.mesh && !item.mesh.visible) continue;
      const dist = this.position.distanceTo(item.position);
      if (dist <= item.radius && dist < bestDist) {
        best = item;
        bestDist = dist;
      }
    }
    this.currentInteractable = best;

    let bestPlayer: RemotePlayerEntity | null = null;
    let bestPlayerDist = 3.8;
    for (const ent of this.remotePlayers.values()) {
      const d = this.position.distanceTo(ent.pos);
      if (d <= bestPlayerDist) {
        bestPlayer = ent;
        bestPlayerDist = d;
      }
    }
    this.nearbyHighFiveTarget = bestPlayer;
  }

  private emitHud(): void {
    const lang = this.settings.language;
    let bubbleVisible = false;
    let bx = 0;
    let by = 0;
    if (this.bubbleText && Date.now() < this.bubbleExpiresAt && !this.isFirstPerson && !this.activeCutscene) {
      const headWorld = new THREE.Vector3(this.position.x, this.position.y + 3.05, this.position.z);
      headWorld.project(this.camera);
      if (headWorld.z < 1) {
        bx = (headWorld.x * 0.5 + 0.5) * this.container.clientWidth;
        by = (-headWorld.y * 0.5 + 0.5) * this.container.clientHeight;
        bubbleVisible = true;
      }
    } else if (this.bubbleText && Date.now() >= this.bubbleExpiresAt) {
      this.bubbleText = null;
    }

    const race = this.secretManager.getRaceStatus();

    const interactPrompt = this.currentInteractable
      ? this.currentInteractable.prompt[lang]
      : this.nearbyHighFiveTarget
        ? `[E] ${UI_TEXT.highFivePrompt[lang]} ${this.nearbyHighFiveTarget.username}`
        : null;

    this.hooks.onHudUpdate({
      zone: this.currentZone,
      zoneName: ZONE_NAMES_I18N[this.currentZone][lang],
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      fps: this.fps,
      shiftLockActive: this.shiftLockActive,
      cameraDistance: this.camDist,
      isFirstPerson: this.isFirstPerson,
      isMaxZoomOut: this.isMaxZoomOut,
      interactPrompt,
      statusBanner: this.statusBanner,
      cutsceneTitle: this.activeCutscene ? this.activeCutscene.structure.name[lang] : null,
      relicCount: this.secretManager.collectedRelics.size,
      raceTimeLeft: race.timeLeft,
      raceZonesCount: race.zonesCount,
      bubbleText: this.bubbleText,
      bubbleScreenPos: { x: bx, y: by, visible: bubbleVisible },
    });
  }
}
