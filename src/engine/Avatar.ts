import * as THREE from 'three';

export type EmoteType = 'none' | 'dance' | 'wave' | 'sit' | 'cheer' | 'laugh';

export interface AvatarOptions {
  torsoColor?: string;
  username?: string;
  isFriend?: boolean;
}

function createFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Classic sunny Roblox yellow head
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 256);

  // Cute glossy eyes
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(86, 112, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(170, 112, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(91, 104, 5, 0, Math.PI * 2);
  ctx.arc(175, 104, 5, 0, Math.PI * 2);
  ctx.fill();

  // Classic friendly smile
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(128, 134, 42, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTorsoTexture(baseHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const c = new THREE.Color(baseHex);
  const darker = c.clone().multiplyScalar(0.72);
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, `#${c.getHexString()}`);
  grad.addColorStop(1, `#${darker.getHexString()}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Secret Universe emblem "?" on chest
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(128, 128, 66, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 104px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 128, 136);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createNameplateTexture(username: string, isFriend: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 112);

  const label = isFriend ? `★ ${username}` : username;
  ctx.font = 'bold 40px Inter, sans-serif';
  const metrics = ctx.measureText(label);
  const padX = 34;
  const pillW = Math.min(480, Math.max(180, metrics.width + padX * 2));
  const pillH = 74;
  const x = (512 - pillW) / 2;
  const y = (112 - pillH) / 2;

  ctx.fillStyle = isFriend ? 'rgba(20, 28, 56, 0.88)' : 'rgba(15, 23, 42, 0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, 24);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = isFriend ? '#facc15' : 'rgba(148, 163, 184, 0.55)';
  ctx.stroke();

  ctx.fillStyle = isFriend ? '#fde047' : '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 58, pillW - 24);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBubbleTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 144);

  const trimmed = text.length > 42 ? `${text.slice(0, 41)}…` : text;
  ctx.font = 'bold 30px Inter, sans-serif';
  const w = Math.min(480, Math.max(150, ctx.measureText(trimmed).width + 52));
  const h = 82;
  const x = (512 - w) / 2;
  const y = 18;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.fill();

  // Speech pointer
  ctx.beginPath();
  ctx.moveTo(240, y + h - 2);
  ctx.lineTo(256, y + h + 22);
  ctx.lineTo(272, y + h - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(trimmed, 256, y + h / 2 + 2, w - 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Avatar {
  public root = new THREE.Group();
  private bodyGroup = new THREE.Group();
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArmPivot = new THREE.Group();
  private rightArmPivot = new THREE.Group();
  private leftLegPivot = new THREE.Group();
  private rightLegPivot = new THREE.Group();
  private auraRing: THREE.Mesh;

  private nameplateSprite: THREE.Sprite | null = null;
  private bubbleSprite: THREE.Sprite | null = null;
  private bubbleExpiresAt = 0;
  private usernameLabel = '';
  private friendFlag = false;

  private walkCycle = 0;
  public emote: EmoteType = 'none';
  private emoteTime = 0;
  public isFirstPerson = false;

  constructor(options: AvatarOptions = {}) {
    const torsoHex = options.torsoColor || '#2563eb';
    const torsoColorObj = new THREE.Color(torsoHex);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
    const faceMat = new THREE.MeshStandardMaterial({ map: createFaceTexture(), roughness: 0.4 });
    const torsoFrontMat = new THREE.MeshStandardMaterial({
      map: createTorsoTexture(torsoHex),
      roughness: 0.5,
    });
    const torsoSideMat = new THREE.MeshStandardMaterial({ color: torsoColorObj, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
    const capAccentMat = new THREE.MeshStandardMaterial({
      color: torsoColorObj,
      roughness: 0.35,
      emissive: torsoColorObj,
      emissiveIntensity: 0.35,
    });

    // Legs (0.78 tall, bottom at y=0)
    const legGeo = new THREE.BoxGeometry(0.36, 0.78, 0.38);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.y = -0.39;
    leftLeg.castShadow = true;
    this.leftLegPivot.position.set(-0.2, 0.78, 0);
    this.leftLegPivot.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.y = -0.39;
    rightLeg.castShadow = true;
    this.rightLegPivot.position.set(0.2, 0.78, 0);
    this.rightLegPivot.add(rightLeg);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.84, 0.88, 0.44);
    this.torso = new THREE.Mesh(torsoGeo, [
      torsoSideMat,
      torsoSideMat,
      torsoSideMat,
      torsoSideMat,
      torsoSideMat,
      torsoFrontMat, // -Z is forward
    ]);
    this.torso.position.y = 1.22;
    this.torso.castShadow = true;

    // Arms
    const armGeo = new THREE.BoxGeometry(0.32, 0.82, 0.36);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.y = -0.36;
    leftArm.castShadow = true;
    this.leftArmPivot.position.set(-0.58, 1.6, 0);
    this.leftArmPivot.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.y = -0.36;
    rightArm.castShadow = true;
    this.rightArmPivot.position.set(0.58, 1.6, 0);
    this.rightArmPivot.add(rightArm);

    // Head (classic blocky head with front on -Z)
    const headGeo = new THREE.BoxGeometry(0.62, 0.62, 0.62);
    this.head = new THREE.Mesh(headGeo, [
      skinMat,
      skinMat,
      skinMat,
      skinMat,
      skinMat,
      faceMat, // -Z faces forward
    ]);
    this.head.position.y = 2.02;
    this.head.castShadow = true;

    // Stylish explorer visor cap
    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.68), capMat);
    capTop.position.set(0, 0.34, 0);
    capTop.castShadow = true;
    const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.28), capAccentMat);
    capBrim.position.set(0, 0.26, -0.4);
    this.head.add(capTop, capBrim);

    this.bodyGroup.add(
      this.leftLegPivot,
      this.rightLegPivot,
      this.torso,
      this.leftArmPivot,
      this.rightArmPivot,
      this.head
    );
    this.root.add(this.bodyGroup);

    // Subtle ground aura ring (shown during rituals, ShiftLock, or High-Five)
    const ringGeo = new THREE.RingGeometry(0.58, 0.78, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    this.auraRing = new THREE.Mesh(ringGeo, ringMat);
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.position.y = 0.05;
    this.root.add(this.auraRing);

    if (options.username) {
      this.usernameLabel = options.username;
      this.friendFlag = Boolean(options.isFriend);
      const npMat = new THREE.SpriteMaterial({
        map: createNameplateTexture(this.usernameLabel, this.friendFlag),
        transparent: true,
        depthTest: true,
      });
      this.nameplateSprite = new THREE.Sprite(npMat);
      this.nameplateSprite.position.set(0, 3.05, 0);
      this.nameplateSprite.scale.set(2.8, 0.62, 1);
      this.root.add(this.nameplateSprite);

      const bubMat = new THREE.SpriteMaterial({
        transparent: true,
        depthTest: false,
      });
      this.bubbleSprite = new THREE.Sprite(bubMat);
      this.bubbleSprite.position.set(0, 3.85, 0);
      this.bubbleSprite.scale.set(3.4, 0.96, 1);
      this.bubbleSprite.visible = false;
      this.root.add(this.bubbleSprite);
    }
  }

  public setFriendBadge(isFriend: boolean): void {
    if (!this.nameplateSprite || this.friendFlag === isFriend) return;
    this.friendFlag = isFriend;
    const mat = this.nameplateSprite.material as THREE.SpriteMaterial;
    mat.map?.dispose();
    mat.map = createNameplateTexture(this.usernameLabel, isFriend);
    mat.needsUpdate = true;
  }

  public showBubble(text: string): void {
    if (!this.bubbleSprite) return;
    const mat = this.bubbleSprite.material as THREE.SpriteMaterial;
    mat.map?.dispose();
    mat.map = createBubbleTexture(text);
    mat.needsUpdate = true;
    this.bubbleSprite.visible = true;
    this.bubbleExpiresAt = Date.now() + 5500;
  }

  public setEmote(emote: EmoteType): void {
    this.emote = emote;
    this.emoteTime = 0;
  }

  public setFirstPerson(fp: boolean): void {
    if (this.isFirstPerson !== fp) {
      this.isFirstPerson = fp;
      this.bodyGroup.visible = !fp;
    }
  }

  public setAura(opacity: number, colorHex = 0x38bdf8): void {
    const mat = this.auraRing.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity;
    mat.color.setHex(colorHex);
  }

  public update(dt: number, horizontalSpeed: number, grounded: boolean, verticalVel: number): void {
    if (this.bubbleSprite && this.bubbleSprite.visible && Date.now() >= this.bubbleExpiresAt) {
      this.bubbleSprite.visible = false;
    }

    // Cancel active non-sit emote if moving
    if (horizontalSpeed > 0.6 && this.emote !== 'none') {
      this.emote = 'none';
    }

    // Reset transforms
    this.bodyGroup.position.y = 0;
    this.torso.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.leftArmPivot.rotation.set(0, 0, 0);
    this.rightArmPivot.rotation.set(0, 0, 0);
    this.leftLegPivot.rotation.set(0, 0, 0);
    this.rightLegPivot.rotation.set(0, 0, 0);

    if (this.emote !== 'none') {
      this.emoteTime += dt;
      if (this.emote === 'sit') {
        this.bodyGroup.position.y = -0.35;
        this.leftLegPivot.rotation.x = -Math.PI / 2.2;
        this.rightLegPivot.rotation.x = -Math.PI / 2.2;
        this.leftArmPivot.rotation.x = -0.25;
        this.rightArmPivot.rotation.x = -0.25;
      } else if (this.emote === 'dance') {
        const t = this.emoteTime * 7;
        this.bodyGroup.position.y = Math.abs(Math.sin(t)) * 0.22;
        this.torso.rotation.z = Math.sin(t) * 0.16;
        this.leftArmPivot.rotation.z = 1.9 + Math.sin(t) * 0.7;
        this.rightArmPivot.rotation.z = -1.9 + Math.sin(t) * 0.7;
        this.leftLegPivot.rotation.x = Math.sin(t) * 0.45;
        this.rightLegPivot.rotation.x = -Math.sin(t) * 0.45;
        this.head.rotation.y = Math.sin(t * 0.5) * 0.3;
      } else if (this.emote === 'wave') {
        const t = this.emoteTime * 9;
        this.rightArmPivot.rotation.z = -2.6 + Math.sin(t) * 0.45;
        this.head.rotation.z = 0.12;
        if (this.emoteTime > 3.2) this.emote = 'none';
      } else if (this.emote === 'cheer') {
        const t = this.emoteTime * 10;
        this.bodyGroup.position.y = Math.abs(Math.sin(t)) * 0.34;
        this.leftArmPivot.rotation.z = 2.75;
        this.rightArmPivot.rotation.z = -2.75;
        if (this.emoteTime > 3.2) this.emote = 'none';
      } else if (this.emote === 'laugh') {
        const t = this.emoteTime * 14;
        this.torso.rotation.x = -0.18 + Math.sin(t) * 0.12;
        this.head.rotation.x = -0.25 + Math.sin(t) * 0.15;
        this.leftArmPivot.rotation.x = -0.8;
        this.rightArmPivot.rotation.x = -0.8;
        if (this.emoteTime > 3.0) this.emote = 'none';
      }
      return;
    }

    if (!grounded) {
      const lift = verticalVel > 0 ? 2.4 : 1.7;
      this.leftArmPivot.rotation.z = lift;
      this.rightArmPivot.rotation.z = -lift;
      this.leftLegPivot.rotation.x = 0.25;
      this.rightLegPivot.rotation.x = -0.25;
    } else if (horizontalSpeed > 0.25) {
      this.walkCycle += dt * Math.min(14, horizontalSpeed * 1.65);
      const swing = Math.sin(this.walkCycle) * 0.78;
      this.leftLegPivot.rotation.x = swing;
      this.rightLegPivot.rotation.x = -swing;
      this.leftArmPivot.rotation.x = -swing * 0.85;
      this.rightArmPivot.rotation.x = swing * 0.85;
      this.bodyGroup.position.y = Math.abs(Math.cos(this.walkCycle)) * 0.08;
    } else {
      this.walkCycle += dt * 2.2;
      this.leftArmPivot.rotation.z = 0.05 + Math.sin(this.walkCycle) * 0.03;
      this.rightArmPivot.rotation.z = -0.05 - Math.sin(this.walkCycle) * 0.03;
    }
  }

  public dispose(): void {
    if (this.nameplateSprite) {
      (this.nameplateSprite.material as THREE.SpriteMaterial).map?.dispose();
      this.nameplateSprite.material.dispose();
    }
    if (this.bubbleSprite) {
      (this.bubbleSprite.material as THREE.SpriteMaterial).map?.dispose();
      this.bubbleSprite.material.dispose();
    }
  }
}
