import * as THREE from 'three';
import { Avatar, EmoteType } from './Avatar';
import { buildWorld, InteractableItem, WorldData, ZONE_NAMES } from './WorldBuilder';
import { PlayerContext, SecretManager } from './SecretManager';
import { soundEngine } from '../audio/soundEngine';
import {
  ChatMessage,
  GameSettings,
  HudSnapshot,
  InspectContent,
  SecretDef,
  ZoneId,
} from '../types/game';

const SPAWN_POS = new THREE.Vector3(0, 0.5, 10);

export interface GameEngineHooks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onSecretUnlocked: (secret: SecretDef, total: number) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onClearChat: () => void;
  onInspect: (content: InspectContent) => void;
  onOpenPause: () => void;
  onToggleIndex: () => void;
  onFocusChat: (prefix?: string) => void;
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
  private avatarYaw = 0; // 0 = facing -Z
  private grounded = false;
  private coyoteTimer = 0;
  private jumpBuffer = 0;
  private peakFallY = 0;
  private currentZone: ZoneId = 'plaza';
  private activeTriggers = new Set<string>();
  private stepTimer = 0;

  // Camera state (Roblox style!)
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

  // Input & UI lock
  private keys = new Set<string>();
  public uiBlocked = false; // true when chat / pause / index / inspect open
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

  constructor(container: HTMLElement, initialSettings: GameSettings, hooks: GameEngineHooks) {
    this.container = container;
    this.hooks = hooks;
    this.settings = { ...initialSettings };

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1b33);
    this.scene.fog = new THREE.FogExp2(0x0c1b33, 0.0048);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      450
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    container.appendChild(this.renderer.domElement);

    // Lighting
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

    // Build World & Avatar
    this.world = buildWorld(this.scene);
    this.avatar = new Avatar();
    this.avatar.root.position.copy(this.position);
    this.scene.add(this.avatar.root);

    // Secret Manager
    this.secretManager = new SecretManager({
      onSecretUnlocked: (secret, total) => hooks.onSecretUnlocked(secret, total),
      onChatMessage: (msg) => hooks.onChatMessage(msg),
      onEmote: (em) => this.avatar.setEmote(em),
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
    });

    this.applyGraphicsSettings(this.settings.graphicsQuality);
    soundEngine.setVolumes(this.settings.sfxVolume, this.settings.musicVolume);
    this.bindEvents();
    this.secretManager.onGameStart();

    this.lastTime = performance.now();
    this.loop();
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
      // Level 5: Ultra
      this.renderer.setPixelRatio(Math.min(2.0, dpr));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.scene.fog = new THREE.FogExp2(0x081326, 0.0036);
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  public setUiBlocked(blocked: boolean): void {
    this.uiBlocked = blocked;
    if (blocked) {
      this.keys.clear();
      this.isMouseDragging = false;
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
    }
  }

  public toggleShiftLock(): void {
    if (!this.settings.shiftLockEnabled) return;
    this.setShiftLock(!this.shiftLockActive);
  }

  public setShiftLock(active: boolean): void {
    this.shiftLockActive = active;
    soundEngine.playClick();
    if (active && !this.uiBlocked) {
      try {
        this.renderer.domElement.requestPointerLock?.();
      } catch {
        // Fallback smoothly if pointer lock blocked
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

  public getPlayerContext(): PlayerContext {
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
    };
  }

  public triggerInteract(): void {
    if (!this.currentInteractable) return;
    const item = this.currentInteractable;

    if (item.requireFirstPerson && !this.isFirstPerson) {
      soundEngine.playError();
      this.secretManager.systemMsg(
        'Приблизь камеру в режим От первого лица (колёсико вверх / клавиша I), чтобы рассмотреть это вблизи!',
        'system'
      );
      return;
    }
    if (item.requireGraphics !== undefined && this.settings.graphicsQuality !== item.requireGraphics) {
      soundEngine.playError();
      this.secretManager.systemMsg(`Для взаимодействия нужен уровень Графики = ${item.requireGraphics}!`, 'system');
      return;
    }
    if (item.requireMinGraphics !== undefined && this.settings.graphicsQuality < item.requireMinGraphics) {
      soundEngine.playError();
      this.secretManager.systemMsg(`Слишком низкая детализация! Поставь Графику ≥ ${item.requireMinGraphics}.`, 'system');
      return;
    }
    if (item.requireMaxZoomOut && !this.isMaxZoomOut) {
      soundEngine.playError();
      this.secretManager.systemMsg('Отдали камеру на максимум!', 'system');
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
    if (this.uiBlocked) return;

    if (e.button === 2 || e.button === 0) {
      this.isMouseDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }

    if ((this.shiftLockActive || this.isFirstPerson) && !this.pointerLocked && e.button === 0) {
      try {
        this.renderer.domElement.requestPointerLock?.();
      } catch {
        // fallback drag works fine
      }
    }
  };

  private onMouseUp = (): void => {
    this.isMouseDragging = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.uiBlocked) return;

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
    if (this.uiBlocked) return;
    e.preventDefault();
    const step = e.deltaY > 0 ? 1.8 : -1.8;
    this.adjustZoom(step);
  };

  public adjustZoom(delta: number): void {
    this.targetCamDist = Math.max(0, Math.min(52, this.targetCamDist + delta));
    if (this.targetCamDist < 0.85 && delta < 0) {
      this.targetCamDist = 0;
    } else if (this.targetCamDist > 0 && this.targetCamDist < 2.2 && delta > 0) {
      this.targetCamDist = 3.0;
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    soundEngine.unlockAudio();

    // Always allow Konami tracking when not typing in an input
    const tag = (e.target as HTMLElement)?.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
    if (!isTyping) {
      this.secretManager.onKeyDown(e.code);
    }

    if (e.code === 'Escape') {
      if (!isTyping) {
        this.hooks.onOpenPause();
      }
      return;
    }

    if (isTyping) return;

    if (e.code === 'Tab') {
      e.preventDefault();
      this.hooks.onToggleIndex();
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

    // FPS counter
    this.frameCounter++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.frameCounter / this.fpsAccum);
      this.frameCounter = 0;
      this.fpsAccum = 0;
    }

    this.updatePhysics(dt);
    this.updateCamera(dt);
    this.updateInteractables();
    this.world.updateDynamicVisuals(
      this.elapsedTime,
      this.settings.graphicsQuality,
      this.isMaxZoomOut,
      this.secretManager.unlocked.size
    );
    this.secretManager.update(dt, this.getPlayerContext());

    // Aura ring feedback for timed rituals or ShiftLock
    if (this.statusBanner && (this.statusBanner.includes('сек') || this.statusBanner.includes('Алтарь'))) {
      this.avatar.setAura(0.55 + Math.sin(this.elapsedTime * 5) * 0.25, 0xfacc15);
    } else if (this.shiftLockActive) {
      this.avatar.setAura(0.28, 0x38bdf8);
    } else {
      this.avatar.setAura(0, 0x38bdf8);
    }

    this.renderer.render(this.scene, this.camera);

    // Emit HUD snapshot ~20fps for crisp UI without React overhead
    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  };

  private updatePhysics(dt: number): void {
    const moveSpeed = 10.6;
    const gravity = 34.0;
    const jumpVel = 13.8;

    // Input direction relative to camera yaw
    let inputForward = 0;
    let inputRight = 0;
    if (!this.uiBlocked) {
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

    // Avatar rotation: ShiftLock or First Person forces avatar to face camera yaw!
    if (this.shiftLockActive || this.isFirstPerson) {
      this.avatarYaw = this.camYaw;
    } else if (mag > 0.05) {
      const targetYaw = Math.atan2(-moveX, -moveZ);
      let diff = targetYaw - this.avatarYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.avatarYaw += diff * Math.min(1, dt * 14);
    }

    // Jump with coyote time & jump buffer
    if (this.grounded) {
      this.coyoteTimer = 0.12;
      this.peakFallY = this.position.y;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      if (this.position.y > this.peakFallY) this.peakFallY = this.position.y;
    }

    if (this.jumpBuffer > 0) {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.coyoteTimer > 0) {
        this.velocity.y = jumpVel;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        soundEngine.playJump();
        this.secretManager.onJump();
      }
    }

    // Gravity
    this.velocity.y -= gravity * dt;
    if (this.velocity.y < -42) this.velocity.y = -42;

    const prevX = this.position.x;
    const prevZ = this.position.z;

    const halfW = 0.42;
    const height = 2.25;

    // Resolve X
    this.position.x += this.velocity.x * dt;
    for (const c of this.world.colliders) {
      if (c.active === false) continue;
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
      if (c.active === false) continue;
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
    for (const c of this.world.colliders) {
      if (c.active === false) continue;
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
          this.secretManager.systemMsg('Ой! Горячая лава! Возврат на Площадь.', 'error');
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

    // Void fall detection
    if (this.position.y < -22) {
      this.secretManager.onVoidFall();
      this.respawn();
      return;
    }

    // Walk distance & footsteps
    const movedDist = Math.hypot(this.position.x - prevX, this.position.z - prevZ);
    this.secretManager.onWalk(movedDist);
    if (this.grounded && movedDist > 0.02) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.32) {
        this.stepTimer = 0;
        soundEngine.playStep();
      }
    }

    // Zone check
    const newZone = this.world.getZoneAt(this.position);
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.secretManager.onZoneEnter(newZone);
    }

    // Trigger volumes check
    this.activeTriggers.clear();
    for (const t of this.world.triggers) {
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

    // Update avatar transform & animation
    this.avatar.root.position.copy(this.position);
    this.avatar.root.rotation.y = this.avatarYaw;
    const horizSpeed = movedDist / Math.max(0.001, dt);
    this.avatar.update(dt, horizSpeed, this.grounded, this.velocity.y);
  }

  private updateCamera(dt: number): void {
    // Smooth follow mode gentle auto-align
    if (this.settings.cameraMode === 'follow' && !this.isMouseDragging && !this.shiftLockActive && !this.isFirstPerson) {
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

    const pivot = new THREE.Vector3(this.position.x, this.position.y + 2.02, this.position.z);

    // Classic Roblox ShiftLock shoulder offset!
    if (this.shiftLockActive && !this.isFirstPerson) {
      const rightX = Math.cos(this.camYaw);
      const rightZ = -Math.sin(this.camYaw);
      pivot.x += rightX * 1.25;
      pivot.z += rightZ * 1.25;
    }

    if (this.isFirstPerson) {
      this.camera.position.copy(pivot);
      const lookTarget = new THREE.Vector3(
        pivot.x - Math.sin(this.camYaw) * Math.cos(this.camPitch),
        pivot.y - Math.sin(this.camPitch),
        pivot.z - Math.cos(this.camYaw) * Math.cos(this.camPitch)
      );
      this.camera.lookAt(lookTarget);
    } else {
      const horizDist = Math.cos(this.camPitch) * this.camDist;
      const vertDist = Math.sin(this.camPitch) * this.camDist;
      const camX = pivot.x + Math.sin(this.camYaw) * horizDist;
      const camY = pivot.y + vertDist;
      const camZ = pivot.z + Math.cos(this.camYaw) * horizDist;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(pivot);
    }
  }

  private updateInteractables(): void {
    let best: InteractableItem | null = null;
    let bestDist = Infinity;

    for (const item of this.world.interactables) {
      // Skip hidden relics or graphics-gated items that aren't visible
      if (item.mesh && !item.mesh.visible) continue;
      const dist = this.position.distanceTo(item.position);
      if (dist <= item.radius && dist < bestDist) {
        best = item;
        bestDist = dist;
      }
    }
    this.currentInteractable = best;
  }

  private emitHud(): void {
    // Bubble chat projection
    let bubbleVisible = false;
    let bx = 0;
    let by = 0;
    if (this.bubbleText && Date.now() < this.bubbleExpiresAt && !this.isFirstPerson) {
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

    this.hooks.onHudUpdate({
      zone: this.currentZone,
      zoneName: ZONE_NAMES[this.currentZone],
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      fps: this.fps,
      shiftLockActive: this.shiftLockActive,
      cameraDistance: this.camDist,
      isFirstPerson: this.isFirstPerson,
      isMaxZoomOut: this.isMaxZoomOut,
      interactPrompt: this.currentInteractable ? this.currentInteractable.prompt : null,
      statusBanner: this.statusBanner,
      relicCount: this.secretManager.collectedRelics.size,
      raceTimeLeft: race.timeLeft,
      raceZonesCount: race.zonesCount,
      bubbleText: this.bubbleText,
      bubbleScreenPos: { x: bx, y: by, visible: bubbleVisible },
    });
  }
}
