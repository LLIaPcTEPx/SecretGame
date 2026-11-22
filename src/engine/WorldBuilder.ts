import * as THREE from 'three';
import { InspectContent, Language, LocalizedText, ZoneId } from '../types/game';

export interface ColliderBox {
  id?: string;
  structureId?: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  bounce?: number;
  hazard?: boolean;
  active?: boolean;
}

export interface InteractableItem {
  id: string;
  structureId?: string;
  position: THREE.Vector3;
  radius: number;
  prompt: LocalizedText;
  requireFirstPerson?: boolean;
  requireGraphics?: number;
  requireMinGraphics?: number;
  requireMaxZoomOut?: boolean;
  inspect?: InspectContent;
  mesh?: THREE.Object3D;
  onInteractKey?: string;
}

export interface TriggerVolume {
  id: string;
  structureId?: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface LegoPiece {
  obj: THREE.Object3D;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  targetScale: THREE.Vector3;
  dropHeight: number;
  tiltX: number;
  tiltZ: number;
}

export interface WorldStructure {
  id: string;
  name: LocalizedText;
  group: THREE.Group;
  pieces: LegoPiece[];
  camPos: THREE.Vector3;
  camLookAt: THREE.Vector3;
  built: boolean;
  animating: boolean;
  flashMeshes: Array<{
    mesh: THREE.Mesh;
    origMat: THREE.Material | THREE.Material[];
  }>;
}

interface LocalizedSignEntry {
  mat: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
  lines: { en: string[]; ru: string[] };
  opts: {
    bg?: string;
    fg?: string;
    border?: string;
    fontSize?: number;
    w?: number;
    h?: number;
    mono?: boolean;
  };
}

export interface WorldData {
  colliders: ColliderBox[];
  interactables: InteractableItem[];
  triggers: TriggerVolume[];
  structures: Record<string, WorldStructure>;
  animatedObjects: Array<{
    mesh: THREE.Object3D;
    structureId?: string;
    kind: 'bob' | 'spin' | 'morse' | 'pulse' | 'cloud';
    baseY: number;
    speed: number;
    phase: number;
  }>;
  ultraOnlyObjects: THREE.Object3D[];
  potatoFogObjects: THREE.Object3D[];
  potatoRevealObjects: THREE.Object3D[];
  skyGlitchObjects: THREE.Object3D[];
  skyGlitchCollider: ColliderBox;
  finalBeam: THREE.Object3D;
  torchFlames: Record<string, THREE.Object3D>;
  pillarMaterials: Record<string, THREE.MeshStandardMaterial>;
  crystalMaterials: Record<string, THREE.MeshStandardMaterial>;
  plateMeshes: Record<string, THREE.Mesh>;
  relicMeshes: Record<string, THREE.Object3D>;
  stars: THREE.Points;
  clouds: THREE.Group;
  isStructureBuilt: (id?: string) => boolean;
  setStructureBuiltImmediate: (id: string, built: boolean) => void;
  setStructureFlashWhite: (id: string, active: boolean, opacity?: number) => void;
  resetAllStructures: () => void;
  setLanguage: (lang: Language) => void;
  updateDynamicVisuals: (
    time: number,
    graphics: number,
    isMaxZoomOut: boolean,
    unityBeamActive: boolean
  ) => void;
  getZoneAt: (pos: THREE.Vector3) => ZoneId;
}

function makeTextTexture(
  lines: string[],
  opts: {
    bg?: string;
    fg?: string;
    border?: string;
    fontSize?: number;
    w?: number;
    h?: number;
    mono?: boolean;
  } = {}
): THREE.CanvasTexture {
  const w = opts.w ?? 512;
  const h = opts.h ?? 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = opts.bg ?? '#0f172a';
  ctx.fillRect(0, 0, w, h);

  if (opts.border) {
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  }

  ctx.fillStyle = opts.fg ?? '#f8fafc';
  const size = opts.fontSize ?? 42;
  ctx.font = `bold ${size}px ${opts.mono ? 'JetBrains Mono, monospace' : 'Fredoka, Inter, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = size * 1.28;
  const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, startY + i * lineHeight);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeClockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 38px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = 256 + Math.cos(ang) * 185;
    const y = 256 + Math.sin(ang) * 185;
    ctx.fillText(String(i), x, y);
  }

  // Minute hand at 45
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 - 140, 256);
  ctx.stroke();

  // Hour hand at 3:45
  const hrAng = ((3 + 45 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 + Math.cos(hrAng) * 105, 256 + Math.sin(hrAng) * 105);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(176, 326, 160, 48);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 34px JetBrains Mono, monospace';
  ctx.fillText('03:45', 256, 352);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildWorld(scene: THREE.Scene, initialLang: Language = 'en'): WorldData {
  const colliders: ColliderBox[] = [];
  const interactables: InteractableItem[] = [];
  const triggers: TriggerVolume[] = [];
  const structures: Record<string, WorldStructure> = {};
  const animatedObjects: WorldData['animatedObjects'] = [];
  const ultraOnlyObjects: THREE.Object3D[] = [];
  const potatoFogObjects: THREE.Object3D[] = [];
  const potatoRevealObjects: THREE.Object3D[] = [];
  const skyGlitchObjects: THREE.Object3D[] = [];
  const torchFlames: Record<string, THREE.Object3D> = {};
  const pillarMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  const crystalMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  const plateMeshes: Record<string, THREE.Mesh> = {};
  const relicMeshes: Record<string, THREE.Object3D> = {};
  const localizedSigns: LocalizedSignEntry[] = [];

  // Shared bright opaque white flash material for the single white flash at end of Lego construction
  const flashWhiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  let currentStructure: WorldStructure | null = null;
  let currentLang: Language = initialLang;

  const beginStructure = (
    id: string,
    name: LocalizedText,
    camPos: [number, number, number],
    camLookAt: [number, number, number]
  ) => {
    const group = new THREE.Group();
    group.name = `struct_${id}`;
    group.visible = false;
    scene.add(group);
    currentStructure = {
      id,
      name,
      group,
      pieces: [],
      camPos: new THREE.Vector3(...camPos),
      camLookAt: new THREE.Vector3(...camLookAt),
      built: false,
      animating: false,
      flashMeshes: [],
    };
    structures[id] = currentStructure;
  };

  const registerPiece = (obj: THREE.Object3D) => {
    if (!currentStructure) return;
    currentStructure.group.add(obj);
    currentStructure.pieces.push({
      obj,
      targetPos: obj.position.clone(),
      targetRot: obj.rotation.clone(),
      targetScale: obj.scale.clone(),
      dropHeight: 3.5 + Math.random() * 4.5,
      tiltX: (Math.random() - 0.5) * 0.55,
      tiltZ: (Math.random() - 0.5) * 0.55,
    });
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        currentStructure!.flashMeshes.push({ mesh: m, origMat: m.material });
      }
    });
  };

  const endStructure = () => {
    if (!currentStructure) return;
    const center = currentStructure.camLookAt;
    // Sort pieces bottom-to-top, then center-outward for crisp Lego assembly!
    currentStructure.pieces.sort((a, b) => {
      const yDiff = a.targetPos.y - b.targetPos.y;
      if (Math.abs(yDiff) > 0.35) return yDiff;
      const da = Math.hypot(a.targetPos.x - center.x, a.targetPos.z - center.z);
      const db = Math.hypot(b.targetPos.x - center.x, b.targetPos.z - center.z);
      return da - db;
    });
    currentStructure = null;
  };

  const makeLocalizedSignMat = (
    lines: { en: string[]; ru: string[] },
    opts: LocalizedSignEntry['opts'] = {},
    basic = true
  ): THREE.MeshBasicMaterial | THREE.MeshStandardMaterial => {
    const tex = makeTextTexture(lines[currentLang], opts);
    const mat = basic
      ? new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 });
    localizedSigns.push({ mat, lines, opts });
    return mat;
  };

  const addTrigger = (t: Omit<TriggerVolume, 'structureId'>) => {
    triggers.push({ ...t, structureId: currentStructure?.id });
  };

  const addBox = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number | THREE.Material,
    opts: {
      solid?: boolean;
      bounce?: number;
      hazard?: boolean;
      shadow?: boolean;
      roughness?: number;
      metalness?: number;
      emissive?: number;
      emissiveIntensity?: number;
      opacity?: number;
      colliderId?: string;
      activeCollider?: boolean;
      skipStructure?: boolean;
    } = {}
  ): { mesh: THREE.Mesh; collider?: ColliderBox } => {
    const mat =
      typeof color === 'number'
        ? new THREE.MeshStandardMaterial({
            color,
            roughness: opts.roughness ?? 0.65,
            metalness: opts.metalness ?? 0.08,
            emissive: opts.emissive ?? 0x000000,
            emissiveIntensity: opts.emissiveIntensity ?? 0,
            transparent: opts.opacity !== undefined && opts.opacity < 1,
            opacity: opts.opacity ?? 1,
          })
        : color;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = opts.shadow ?? true;

    if (currentStructure && !opts.skipStructure) {
      registerPiece(mesh);
    } else {
      scene.add(mesh);
    }

    let collider: ColliderBox | undefined;
    if (opts.solid !== false) {
      collider = {
        id: opts.colliderId,
        structureId: opts.skipStructure ? undefined : currentStructure?.id,
        minX: x - w / 2,
        maxX: x + w / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        bounce: opts.bounce,
        hazard: opts.hazard,
        active: opts.activeCollider ?? true,
      };
      colliders.push(collider);
    }
    return { mesh, collider };
  };

  const addMeshPiece = (mesh: THREE.Object3D) => {
    if (currentStructure) {
      registerPiece(mesh);
    } else {
      scene.add(mesh);
    }
    return mesh;
  };

  const addPlaque = (
    id: string,
    x: number,
    y: number,
    z: number,
    rotY: number,
    title: LocalizedText,
    lines: { en: string[]; ru: string[] },
    inspect: InspectContent,
    opts: {
      bg?: string;
      fg?: string;
      border?: string;
      prompt?: LocalizedText;
      requireFirstPerson?: boolean;
      requireMinGraphics?: number;
      scale?: number;
      onInteractKey?: string;
    } = {}
  ) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;
    const sc = opts.scale ?? 1;

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.18 * sc, 1.3 * sc, 0.18 * sc),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
    );
    stand.position.y = 0.65 * sc;
    stand.castShadow = true;

    const boardMat = makeLocalizedSignMat(
      lines,
      {
        bg: opts.bg ?? '#0f172a',
        fg: opts.fg ?? '#f8fafc',
        border: opts.border ?? '#38bdf8',
        fontSize: 36,
        mono: true,
      },
      false
    );
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8 * sc, 1.0 * sc, 0.12 * sc), boardMat);
    board.position.y = 1.55 * sc;
    board.castShadow = true;

    group.add(stand, board);
    addMeshPiece(group);

    interactables.push({
      id,
      structureId: currentStructure?.id,
      position: new THREE.Vector3(x, y + 1.3 * sc, z),
      radius: 3.1,
      prompt: opts.prompt ?? {
        en: `[E] Read: ${title.en}`,
        ru: `[E] Прочитать: ${title.ru}`,
      },
      requireFirstPerson: opts.requireFirstPerson,
      requireMinGraphics: opts.requireMinGraphics,
      inspect,
      mesh: group,
      onInteractKey: opts.onInteractKey,
    });
    return group;
  };

  const addTorch = (key: string, x: number, y: number, z: number, label: LocalizedText) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.38, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    base.position.y = 0.8;
    base.castShadow = true;

    const flame = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 0),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        emissive: 0xf97316,
        emissiveIntensity: 0.15,
        roughness: 0.3,
      })
    );
    flame.position.y = 2.0;
    group.add(base, flame);
    addMeshPiece(group);

    torchFlames[key] = flame;
    animatedObjects.push({
      mesh: flame,
      structureId: currentStructure?.id,
      kind: 'bob',
      baseY: 2.0,
      speed: 2.5,
      phase: x,
    });

    interactables.push({
      id: `torch_${key}`,
      structureId: currentStructure?.id,
      position: new THREE.Vector3(x, y + 1.4, z),
      radius: 2.8,
      prompt: {
        en: `[E] Light Torch (${label.en})`,
        ru: `[E] Зажечь Факел (${label.ru})`,
      },
      onInteractKey: `torch:${key}`,
      mesh: group,
    });
  };

  const addElementalAltar = (
    elementKey: string,
    x: number,
    y: number,
    z: number,
    label: LocalizedText,
    colorHex: number,
    clueNumber: number
  ) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.15, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 })
    );
    ped.position.y = 0.45;
    ped.castShadow = true;

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 0),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.75,
        roughness: 0.2,
      })
    );
    orb.position.y = 1.65;
    group.add(ped, orb);

    const signMat = makeLocalizedSignMat(
      { en: [label.en, `#${clueNumber}`], ru: [label.ru, `#${clueNumber}`] },
      { bg: '#09090d', fg: '#fde047', border: '#facc15', fontSize: 42, w: 256, h: 128 },
      true
    );
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.48), signMat);
    sign.position.set(0, 0.5, 1.02);
    group.add(sign);

    addMeshPiece(group);
    animatedObjects.push({
      mesh: orb,
      structureId: currentStructure?.id,
      kind: 'spin',
      baseY: 1.65,
      speed: 1.8,
      phase: clueNumber,
    });

    interactables.push({
      id: `altar_${elementKey}`,
      structureId: currentStructure?.id,
      position: new THREE.Vector3(x, y + 1.2, z),
      radius: 2.9,
      prompt: {
        en: `[E] Elemental Altar: ${label.en} (#${clueNumber})`,
        ru: `[E] Алтарь Стихии: ${label.ru} (#${clueNumber})`,
      },
      onInteractKey: `element:${elementKey}`,
      mesh: group,
    });
  };

  const addTimeLever = (key: string, x: number, y: number, z: number, label: LocalizedText) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.4 })
    );
    box.position.y = 0.55;
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 })
    );
    handle.position.set(0, 1.35, 0);
    handle.rotation.z = 0.4;
    group.add(box, handle);
    addMeshPiece(group);

    interactables.push({
      id: `lever_${key}`,
      structureId: currentStructure?.id,
      position: new THREE.Vector3(x, y + 1, z),
      radius: 2.8,
      prompt: {
        en: `[E] Time Lever: ${label.en}`,
        ru: `[E] Рычаг Времени: ${label.ru}`,
      },
      onInteractKey: `timelever:${key}`,
      mesh: group,
    });
  };

  const addRelic = (key: string, x: number, y: number, z: number, label: LocalizedText) => {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
        metalness: 0.7,
        roughness: 0.15,
      })
    );
    mesh.position.set(x, y, z);
    addMeshPiece(mesh);
    relicMeshes[key] = mesh;
    animatedObjects.push({
      mesh,
      structureId: currentStructure?.id,
      kind: 'bob',
      baseY: y,
      speed: 2.8,
      phase: x,
    });

    interactables.push({
      id: `relic_${key}`,
      structureId: currentStructure?.id,
      position: new THREE.Vector3(x, y, z),
      radius: 2.6,
      prompt: {
        en: `[E] Take Ancient Relic (${label.en})`,
        ru: `[E] Взять Древнюю Реликвию (${label.ru})`,
      },
      onInteractKey: `relic:${key}`,
      mesh,
    });
  };

  // =========================================================================
  // ALWAYS PRESENT: EMPTY STARFIELD + TINY FLOATING STARTER SPAWN PAD ONLY!
  // =========================================================================
  const starGeo = new THREE.BufferGeometry();
  const starPositions: number[] = [];
  for (let i = 0; i < 650; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.15);
    const r = 165 + Math.random() * 35;
    starPositions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xe0f2fe, size: 1.1, transparent: true, opacity: 0.85 })
  );
  scene.add(stars);

  // Subtle decorative clouds (kept empty at 0 secrets — only appear once Plaza is built)
  const clouds = new THREE.Group();
  clouds.visible = false;
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, transparent: true, opacity: 0.88 });
  [
    [-40, 36, -30],
    [45, 40, -15],
    [-20, 44, 45],
    [35, 38, 38],
    [-70, 34, 10],
    [0, 46, -65],
    [70, 35, -45],
    [-85, 32, -50],
  ].forEach(([cx, cy, cz], idx) => {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 6), cloudMat);
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 5), cloudMat);
    m2.position.set(2.5, 1.3, 0.5);
    cg.add(m1, m2);
    clouds.add(cg);
    animatedObjects.push({ mesh: cg, kind: 'cloud', baseY: cy, speed: 0.4 + idx * 0.05, phase: idx });
  });
  scene.add(clouds);

  // Minimal floating spawn tile right under the player so you stand in the empty void at 0 secrets!
  addBox(0, -0.25, 10, 4.4, 0.5, 4.4, 0xf8fafc, {
    skipStructure: true,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.25,
    roughness: 0.35,
  });

  // =========================================================================
  // STRUCTURE 1: plaza_base (#1 Welcome!) — Spawn Plaza, Roads, Arch, Red Button
  // =========================================================================
  beginStructure(
    'plaza_base',
    { en: 'Spawn Plaza & Welcome Arch', ru: 'Площадь Спавна и Арка' },
    [22, 16, 30],
    [0, 2, 4]
  );
  // Build plaza out of Lego-like modular slabs so the assembly looks AWESOME!
  const plazaQuadrants: Array<[number, number]> = [
    [-11, -11],
    [11, -11],
    [-11, 11],
    [11, 11],
  ];
  plazaQuadrants.forEach(([qx, qz]) => {
    addBox(qx, -6.5, qz, 19.6, 7, 19.6, 0x334155, { solid: false });
    addBox(qx, -1.5, qz, 22, 3, 22, 0x4ade80, { roughness: 0.85 });
  });
  addBox(0, 0.04, 0, 26, 0.08, 26, 0xe2e8f0, { solid: false, roughness: 0.6 });
  addBox(0, 0.05, -11, 6, 0.08, 22, 0xcbd5e1, { solid: false });
  addBox(0, 0.05, 11, 6, 0.08, 22, 0xcbd5e1, { solid: false });
  addBox(-11, 0.05, 0, 22, 0.08, 6, 0xcbd5e1, { solid: false });
  addBox(11, 0.05, 0, 22, 0.08, 6, 0xcbd5e1, { solid: false });

  // Welcome Arch at (0, 0, 14) built in stacked Lego segments!
  addBox(-4.2, 1.6, 14, 1.2, 3.2, 1.2, 0x2563eb);
  addBox(-4.2, 4.8, 14, 1.2, 3.2, 1.2, 0x3b82f6);
  addBox(4.2, 1.6, 14, 1.2, 3.2, 1.2, 0x2563eb);
  addBox(4.2, 4.8, 14, 1.2, 3.2, 1.2, 0x3b82f6);
  addBox(0, 6.5, 14, 10.4, 1.6, 1.4, 0x1d4ed8);
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 1.3),
    makeLocalizedSignMat(
      { en: ['SECRET UNIVERSE — 100 SECRETS'], ru: ['SECRET UNIVERSE — 100 СЕКРЕТОВ'] },
      { bg: '#1e3a8a', fg: '#fde047', border: '#60a5fa', fontSize: 34, w: 768, h: 128 },
      true
    )
  );
  archSign.position.set(0, 6.5, 13.25);
  addMeshPiece(archSign);

  // Big Red Button behind Arch left pillar (#15)
  const redBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, 0.25, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.65 })
  );
  redBtn.rotation.x = Math.PI / 2;
  redBtn.position.set(-4.2, 1.4, 14.7);
  addMeshPiece(redBtn);
  interactables.push({
    id: 'red_button',
    structureId: 'plaza_base',
    position: new THREE.Vector3(-4.2, 1.4, 15.0),
    radius: 2.6,
    prompt: { en: '[E] Press the Big Red Button', ru: '[E] Нажать Большую Красную Кнопку' },
    onInteractKey: 'red_button',
    mesh: redBtn,
  });

  // Hub Guide Signpost
  addPlaque(
    'hub_guide',
    4.5,
    0,
    9.5,
    -0.4,
    { en: 'World Map Guide', ru: 'Путеводитель' },
    {
      en: ['← Forest   ↑ Library', '→ Tech Lab ↓ Volcano', '↗ Sky Obby'],
      ru: ['← Лес   ↑ Библиотека', '→ Лаб.  ↓ Вулкан', '↗ Небесный Обби'],
    },
    {
      title: { en: 'Secret Universe Map', ru: 'Карта Островов Secret Universe' },
      subtitle: { en: 'Every secret builds new parts of the world!', ru: 'Каждый секрет строит новые части мира!' },
      body: {
        en: '• West (←): Whispering Forest (built by #6 /help)\n• North (↑): Cipher Library (built by #9 Index)\n• East (→): Tech Lab (built by #10 Pause)\n• South (↓): Volcanic Cavern (built by #14 Void)\n• Northeast (↗): Sky Obby (built by #7 /dance)\n• ???: Glitch Void Island (find portal in Ruins!)',
        ru: '• Запад (←): Шепчущий Лес (строится за #6 /help)\n• Север (↑): Библиотека Шифров (строится за #9 Index)\n• Восток (→): Техно-Лаборатория (строится за #10 Пауза)\n• Юг (↓): Вулканическая Пещера (строится за #14 Пустота)\n• Северо-Восток (↗): Небесный Обби (строится за #7 /dance)\n• ???: Остров Бездны (ищи портал в Руинах!)',
      },
      accentColor: '#38bdf8',
    },
    { scale: 0.9 }
  );
  endStructure();

  // =========================================================================
  // STRUCTURE 2: fountain (#2 First Steps) — Central Fountain, Bench, Water Altar
  // =========================================================================
  beginStructure(
    'fountain',
    { en: 'Central Fountain & Bench', ru: 'Центральный Фонтан и Скамейка' },
    [11, 7.5, 11],
    [0, 1.5, 0]
  );
  const fountainRimColor = 0xcbd5e1;
  addBox(0, 0.45, -4.3, 9.2, 0.9, 0.7, fountainRimColor);
  addBox(0, 0.45, 4.3, 9.2, 0.9, 0.7, fountainRimColor);
  addBox(-4.3, 0.45, 0, 0.7, 0.9, 8.2, fountainRimColor);
  addBox(4.3, 0.45, 0, 0.7, 0.9, 8.2, fountainRimColor);
  const waterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.45, 8),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
    })
  );
  waterMesh.position.set(0, 0.35, 0);
  addMeshPiece(waterMesh);
  addBox(0, 0.9, 0, 1.8, 1.8, 1.8, 0xe2e8f0);
  addBox(0, 2.3, 0, 1.2, 1.2, 1.2, 0xf1f5f9);
  const fountainCrown = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.2 })
  );
  fountainCrown.position.set(0, 3.6, 0);
  addMeshPiece(fountainCrown);
  animatedObjects.push({ mesh: fountainCrown, structureId: 'fountain', kind: 'bob', baseY: 3.6, speed: 2.2, phase: 0 });
  addTrigger({ id: 'fountain', minX: -4, maxX: 4, minY: -0.5, maxY: 2.5, minZ: -4, maxZ: 4 });

  // Final #100 Golden Beam
  const finalBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 80, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
  );
  finalBeam.position.set(0, 40, 0);
  finalBeam.visible = false;
  scene.add(finalBeam);

  interactables.push({
    id: 'final_pedestal',
    structureId: 'fountain',
    position: new THREE.Vector3(0, 1.8, 0),
    radius: 3.8,
    prompt: { en: '[E] Secret Universe Pedestal', ru: '[E] Центральный Пьедестал Secret Universe' },
    onInteractKey: 'final_pedestal',
    mesh: fountainCrown,
  });

  // Bench (#8)
  addBox(7.2, 0.5, 3, 2.6, 0.25, 0.9, 0x92400e);
  addBox(7.2, 0.95, 3.35, 2.6, 0.7, 0.2, 0x78350f);
  interactables.push({
    id: 'plaza_bench',
    structureId: 'fountain',
    position: new THREE.Vector3(7.2, 0.8, 2.7),
    radius: 2.4,
    prompt: { en: '[E] Sit on the Bench', ru: '[E] Присесть на скамейку' },
    onInteractKey: 'bench_sit',
  });

  addElementalAltar('water', 0, 0, -6.2, { en: 'Water', ru: 'Вода' }, 0x38bdf8, 2);
  endStructure();

  // =========================================================================
  // STRUCTURE 3: difficulty_monument (#3 Hopper)
  // =========================================================================
  beginStructure(
    'difficulty_monument',
    { en: 'Difficulty Chart Monument', ru: 'Монумент Таблицы Сложности' },
    [-6, 7, -4],
    [-13.5, 2.5, -14]
  );
  const chartColors = [0x22c55e, 0xeab308, 0xf97316, 0xef4444, 0xa855f7, 0x111118];
  chartColors.forEach((col, i) => {
    const h = 1.2 + i * 0.9;
    addBox(-17 + i * 1.4, h / 2, -14, 1.2, h, 1.2, col, {
      emissive: col === 0x111118 ? 0x334155 : col,
      emissiveIntensity: 0.2,
    });
  });
  addPlaque(
    'chart_sign',
    -13.5,
    0,
    -11.5,
    0,
    { en: 'Difficulty Chart', ru: 'Таблица Сложности' },
    {
      en: ['DIFFICULTY CHART', 'Easy • Medium • Hard', 'Amazing • Okay? • Best'],
      ru: ['DIFFICULTY CHART', 'Easy • Medium • Hard', 'Amazing • Okay? • Best'],
    },
    {
      title: { en: 'Difficulty Chart', ru: 'Таблица Сложности (Difficulty Chart)' },
      subtitle: { en: '6 tiers • 100 unique secrets', ru: '6 уровней • 100 уникальных секретов' },
      body: {
        en: 'All 100 secrets span 6 difficulty tiers:\n• Easy (Green) — 24 secrets\n• Medium (Yellow) — 22 secrets\n• Hard (Orange) — 18 secrets\n• Amazing (Red) — 15 secrets\n• Okay? (Purple) — 12 secrets\n• Best (Black) — 9 secrets\n\nOpen the Index (Tab) to track progress and read hints!',
        ru: 'Все 100 секретов разделены на 6 уровней сложности:\n• Easy (Зелёный) — 24 секрета\n• Medium (Жёлтый) — 22 секрета\n• Hard (Оранжевый) — 18 секретов\n• Amazing (Красный) — 15 секретов\n• Okay? (Фиолетовый) — 12 секретов\n• Best (Чёрный) — 9 секретов\n\nОткрой Index (Tab), чтобы следить за прогрессом и читать подсказки!',
      },
      accentColor: '#22c55e',
    }
  );
  endStructure();

  // =========================================================================
  // STRUCTURE 4: pavilion (#4 Fountain Splash)
  // =========================================================================
  beginStructure(
    'pavilion',
    { en: 'Plaza Pavilion', ru: 'Павильон Площади' },
    [4, 7.5, 4],
    [14, 2.5, 12]
  );
  addBox(14, 0.25, 12, 6.4, 0.5, 6.4, 0xf1f5f9);
  addBox(11.3, 2.2, 9.3, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(16.7, 2.2, 9.3, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(11.3, 2.2, 14.7, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(16.7, 2.2, 14.7, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(10.2, 1.3, 12, 1.4, 0.4, 1.6, 0x64748b);
  addBox(10.2, 2.6, 10.6, 1.4, 0.4, 1.6, 0x64748b);
  addBox(14, 4.15, 12, 7.2, 0.6, 7.2, 0xef4444);
  addBox(14, 4.7, 12, 4.4, 0.5, 4.4, 0xdc2626, { solid: false });
  addTrigger({ id: 'pavilion_roof', minX: 10.5, maxX: 17.5, minY: 4.1, maxY: 6.5, minZ: 8.5, maxZ: 15.5 });

  addPlaque(
    'emote_clue',
    14,
    0.5,
    14.2,
    Math.PI,
    { en: 'Emote Order', ru: 'Танец Порядка' },
    {
      en: ['EMOTE CHAIN (20s)', '1. /wave  2. /dance', '3. /cheer  4. /sit'],
      ru: ['ЦЕПОЧКА ЭМОЦИЙ (20с)', '1. /wave  2. /dance', '3. /cheer  4. /sit'],
    },
    {
      title: { en: 'Tablet of Emotes', ru: 'Скрижаль Эмоций' },
      subtitle: { en: 'Clue for Secret #71', ru: 'Подсказка к секрету #71' },
      body: {
        en: 'Perform all four emote commands in chat in this exact order within 20 seconds:',
        ru: 'Выполни четыре команды эмоций в чате в точном порядке за 20 секунд:',
      },
      code: '/wave  →  /dance  →  /cheer  →  /sit',
      accentColor: '#ef4444',
    }
  );
  endStructure();

  // =========================================================================
  // STRUCTURE 5: founder_statue (#5 Hello World)
  // =========================================================================
  beginStructure(
    'founder_statue',
    { en: 'Golden Founder Statue', ru: 'Золотая Статуя Основателя' },
    [6, 5.5, -6],
    [0, 2.6, -14]
  );
  addBox(0, 0.6, -14, 3.2, 1.2, 3.2, 0x475569);
  addBox(-0.4, 1.8, -14, 0.55, 1.2, 0.6, 0xeab308, { metalness: 0.8, roughness: 0.2 });
  addBox(0.4, 1.8, -14, 0.55, 1.2, 0.6, 0xeab308, { metalness: 0.8, roughness: 0.2 });
  addBox(0, 3.0, -14, 1.4, 1.4, 0.9, 0xfacc15, { metalness: 0.8, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.2 });
  addBox(-1.0, 3.0, -14, 0.45, 1.3, 0.55, 0xfacc15, { metalness: 0.8, roughness: 0.2 });
  addBox(1.0, 3.0, -14, 0.45, 1.3, 0.55, 0xfacc15, { metalness: 0.8, roughness: 0.2 });
  addBox(0, 4.3, -14, 1.0, 1.0, 1.0, 0xfde047, { metalness: 0.8, roughness: 0.2 });
  endStructure();

  // =========================================================================
  // STRUCTURE 6: clocktower (#15 Big Red Button)
  // =========================================================================
  beginStructure(
    'clocktower',
    { en: 'The Clocktower', ru: 'Башня Часов' },
    [2, 16, 22],
    [-15, 11, 8]
  );
  // Build clocktower in 5 stacked Lego tiers!
  for (let tier = 0; tier < 5; tier++) {
    addBox(-15, 1.8 + tier * 3.6, 8, 5, 3.6, 5, tier % 2 === 0 ? 0x78716c : 0x57534e);
  }
  addBox(-15, 18.4, 8, 6.2, 0.8, 6.2, 0xd6d3d1);

  const clockTex = makeClockTexture();
  const clockMat = new THREE.MeshBasicMaterial({ map: clockTex });
  [
    [0, 14.5, 2.56, 0],
    [0, 14.5, -2.56, Math.PI],
    [2.56, 14.5, 0, Math.PI / 2],
    [-2.56, 14.5, 0, -Math.PI / 2],
  ].forEach(([ox, oy, oz, ry]) => {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), clockMat);
    face.position.set(-15 + ox, oy, 8 + oz);
    face.rotation.y = ry;
    addMeshPiece(face);
  });

  [
    [-11.8, 1.5, 8],
    [-11.8, 3.2, 5.2],
    [-15, 4.9, 4.8],
    [-18.2, 6.6, 5.2],
    [-18.2, 8.3, 8],
    [-18.2, 10.0, 10.8],
    [-15, 11.7, 11.2],
    [-11.8, 13.4, 10.8],
    [-11.8, 15.1, 8],
    [-11.8, 16.8, 5.6],
    [-14.2, 18.1, 4.8],
  ].forEach(([sx, sy, sz]) => {
    addBox(sx, sy, sz, 2.2, 0.4, 2.2, 0xf59e0b);
  });

  const chronoRing = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  chronoRing.rotation.x = -Math.PI / 2;
  chronoRing.position.set(-15, 18.85, 8);
  addMeshPiece(chronoRing);
  addTrigger({ id: 'clocktower_peak', minX: -18, maxX: -12, minY: 18.4, maxY: 22, minZ: 5, maxZ: 11 });

  addPlaque(
    'clocktower_frag',
    -15,
    18.8,
    6.1,
    0,
    { en: "Clockmaker's Note", ru: 'Записка Часовщика' },
    { en: ['GPU FRAG #3:', '3 - 1', '(Total: 8 digits)'], ru: ['GPU FRAG #3:', '3 - 1', '(Итого 8 цифр)'] },
    {
      title: { en: 'Third Graphics Fragment', ru: 'Третий Фрагмент Графики' },
      subtitle: { en: 'Final piece of the 8-step code (#92)', ru: 'Финальный кусок 8-шагового кода (#92)' },
      body: {
        en: 'Combine all 3 fragments from across the world:\n1) Beneath Spawn Plaza (5-1-4)\n2) Void Island Keyhole (2-3-5)\n3) Clocktower Peak (3-1)',
        ru: 'Соедини все 3 фрагмента из разных уголков мира:\n1) Под дном Площади (5-1-4)\n2) Замочная скважина Острова Бездны (2-3-5)\n3) Вершина Башни Часов (3-1)',
      },
      code: 'FRAG #3: 3 - 1',
      accentColor: '#eab308',
    },
    { scale: 0.85 }
  );

  addTimeLever('present', -11, 0, 8, { en: 'Present', ru: 'Настоящее' });
  endStructure();

  // =========================================================================
  // STRUCTURE 7: plaza_mysteries (#12 First Person) — Ultra Runes, Plate #1, Plaza Torch
  // =========================================================================
  beginStructure(
    'plaza_mysteries',
    { en: 'Plaza Runes & Flame', ru: 'Руны и Факел Площади' },
    [8, 7, 14],
    [0, 1.2, 2]
  );
  const ultraRuneGroup = new THREE.Group();
  ultraRuneGroup.position.set(0, 0.1, 6.8);
  const runeRing = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.9, 32),
    new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  runeRing.rotation.x = -Math.PI / 2;
  const runeCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xa855f7, emissiveIntensity: 1.2 })
  );
  runeCore.position.y = 0.8;
  ultraRuneGroup.add(runeRing, runeCore);
  addMeshPiece(ultraRuneGroup);
  ultraOnlyObjects.push(ultraRuneGroup);
  animatedObjects.push({ mesh: runeCore, structureId: 'plaza_mysteries', kind: 'bob', baseY: 0.8, speed: 3, phase: 1 });
  interactables.push({
    id: 'ultra_runes',
    structureId: 'plaza_mysteries',
    position: new THREE.Vector3(0, 0.8, 6.8),
    radius: 2.8,
    prompt: { en: '[E] Activate Ultra Runes', ru: '[E] Активировать Ультра-Руны' },
    requireGraphics: 5,
    onInteractKey: 'ultra_runes',
    mesh: ultraRuneGroup,
  });

  const p1 = addBox(17, 0.12, -15, 2.0, 0.24, 2.0, 0xfacc15, { emissive: 0xca8a04, emissiveIntensity: 0.4 });
  plateMeshes['p1'] = p1.mesh;
  addTrigger({ id: 'plate_1', minX: 15.8, maxX: 18.2, minY: -0.2, maxY: 1.6, minZ: -16.2, maxZ: -13.8 });
  addTorch('plaza', -10, 0, -9, { en: 'Plaza', ru: 'Площадь' });
  endStructure();

  // =========================================================================
  // STRUCTURE 8: plaza_sky_under (#13 Eagle Eye) — Sky Cipher, Underworld Sign, X-Ray Vault
  // =========================================================================
  beginStructure(
    'plaza_sky_under',
    { en: 'Sky Cipher & Underground Vault', ru: 'Небесный Шифр и Подземелье' },
    [22, 12, -32],
    [0, 6, -8]
  );
  const skyCipherPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 7),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(['SKY CIPHER', '/481516'], {
        bg: '#090d1f',
        fg: '#7dd3fc',
        border: '#38bdf8',
        fontSize: 56,
        mono: true,
      }),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    })
  );
  skyCipherPlane.position.set(0, 50, 0);
  skyCipherPlane.rotation.x = Math.PI / 2;
  addMeshPiece(skyCipherPlane);

  const underSign = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 7),
    makeLocalizedSignMat(
      {
        en: ['Beneath the World:', '/underworld', 'GPU Frag #1: 5-1-4'],
        ru: ['Изнанка мира:', '/underworld', 'GPU Frag #1: 5-1-4'],
      },
      { bg: '#09090d', fg: '#c084fc', border: '#a855f7', fontSize: 38, mono: true },
      true
    )
  );
  underSign.position.set(0, -10.1, 4);
  underSign.rotation.x = Math.PI / 2;
  addMeshPiece(underSign);

  const xrayGroup = new THREE.Group();
  xrayGroup.position.set(0, -4.5, -17.5);
  const xrayBack = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 4),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(['X-RAY CODE:', 'XRAY99'], {
        bg: '#020617',
        fg: '#22d3ee',
        border: '#06b6d4',
        fontSize: 56,
        mono: true,
      }),
      side: THREE.DoubleSide,
    })
  );
  xrayBack.position.set(0, 0, -1.8);
  const xrayFrame = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4.8, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, side: THREE.BackSide, roughness: 0.7 })
  );
  xrayGroup.add(xrayBack, xrayFrame);
  addMeshPiece(xrayGroup);
  endStructure();

  // =========================================================================
  // STRUCTURE 9: forest_island (#6 /help) — West Bridge & Whispering Forest
  // =========================================================================
  beginStructure(
    'forest_island',
    { en: 'Whispering Forest & Bridge', ru: 'Шепчущий Лес и Мост' },
    [-22, 18, 28],
    [-48, 2, 0]
  );
  addBox(-28, -0.1, 0, 12.2, 0.5, 5.6, 0x92400e);
  addBox(-28, 0.7, -2.7, 12, 0.9, 0.25, 0x78350f);
  addBox(-28, 0.7, 2.7, 12, 0.9, 0.25, 0x78350f);
  addBox(-25.5, -1.6, 3.8, 2.2, 0.4, 2.2, 0x78350f);
  addBox(-28, -2.8, 0, 4.5, 0.5, 4.5, 0x78350f);
  const underBridgeGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.8 })
  );
  underBridgeGem.position.set(-28, -1.9, 0);
  addMeshPiece(underBridgeGem);
  animatedObjects.push({ mesh: underBridgeGem, structureId: 'forest_island', kind: 'bob', baseY: -1.9, speed: 2.5, phase: 2 });
  addTrigger({ id: 'under_bridge', minX: -30.5, maxX: -25.5, minY: -3.2, maxY: -0.6, minZ: -2.5, maxZ: 2.5 });

  // Forest Island modular slabs
  addBox(-44, -6.5, -12, 18, 7, 22, 0x1e293b, { solid: false });
  addBox(-64, -6.5, -12, 18, 7, 22, 0x1e293b, { solid: false });
  addBox(-44, -6.5, 12, 18, 7, 22, 0x1e293b, { solid: false });
  addBox(-64, -6.5, 12, 18, 7, 22, 0x1e293b, { solid: false });
  addBox(-44, -1.5, -12, 20, 3, 24, 0x16a34a, { roughness: 0.9 });
  addBox(-64, -1.5, -12, 20, 3, 24, 0x16a34a, { roughness: 0.9 });
  addBox(-44, -1.5, 12, 20, 3, 24, 0x16a34a, { roughness: 0.9 });
  addBox(-64, -1.5, 12, 20, 3, 24, 0x16a34a, { roughness: 0.9 });

  const addTree = (tx: number, tz: number, scale = 1) => {
    addBox(tx, 2.2 * scale, tz, 1.1 * scale, 4.4 * scale, 1.1 * scale, 0x78350f);
    addBox(tx, 5.2 * scale, tz, 3.8 * scale, 2.8 * scale, 3.8 * scale, 0x15803d, { solid: false });
    addBox(tx, 7.2 * scale, tz, 2.4 * scale, 2.0 * scale, 2.4 * scale, 0x22c55e, { solid: false });
  };
  addTree(-40, -16, 1.0);
  addTree(-48, -18, 1.1);
  addTree(-38, 10, 0.9);
  addTree(-56, 18, 1.05);
  addTree(-68, -18, 1.0);
  addTree(-44, -11, 1.85);

  const behindTreeCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.85, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 })
  );
  behindTreeCube.position.set(-44, 0.7, -13.6);
  addMeshPiece(behindTreeCube);
  animatedObjects.push({ mesh: behindTreeCube, structureId: 'forest_island', kind: 'spin', baseY: 0.7, speed: 1.5, phase: 0 });
  interactables.push({
    id: 'behind_tree_cube',
    structureId: 'forest_island',
    position: new THREE.Vector3(-44, 0.7, -13.6),
    radius: 2.5,
    prompt: { en: '[E] Take Glowing Cube behind Tree', ru: '[E] Взять Светящийся Куб за деревом' },
    onInteractKey: 'behind_tree',
    mesh: behindTreeCube,
  });

  // Campfire (#31)
  addBox(-44, 0.2, 8, 1.6, 0.3, 0.4, 0x78350f, { solid: false });
  addBox(-44, 0.2, 8, 0.4, 0.3, 1.6, 0x78350f, { solid: false });
  const fireMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.2 })
  );
  fireMesh.position.set(-44, 0.85, 8);
  addMeshPiece(fireMesh);
  animatedObjects.push({ mesh: fireMesh, structureId: 'forest_island', kind: 'pulse', baseY: 0.85, speed: 6, phase: 0 });
  addTrigger({ id: 'campfire', minX: -48, maxX: -40, minY: -0.5, maxY: 3, minZ: 4, maxZ: 12 });

  // Coordinate Cache Plaque & Island (#57)
  addPlaque(
    'coord_clue',
    -42,
    0,
    -2,
    Math.PI / 2,
    { en: "Explorer's Note", ru: 'Записка Искателя' },
    {
      en: ['CACHE COORDS', 'X ≈ -30, Z ≈ 30', 'Stand & type /cheer'],
      ru: ['КООРДИНАТЫ КЛАДА', 'X ≈ -30, Z ≈ 30', 'Встань и введи /cheer'],
    },
    {
      title: { en: 'Coordinate Map (#57)', ru: 'Карта Координат (#57)' },
      subtitle: { en: 'Enable Coords in Settings or use /pos', ru: 'Включи Координаты в Настройках или /pos' },
      body: {
        en: 'Reach the small stone island at X ≈ -30, Z ≈ 30 south of Whispering Forest and type /cheer!',
        ru: 'Доберись до тайного каменного островка в точке X ≈ -30, Z ≈ 30 и похлопай командой /cheer!',
      },
      code: 'X ≈ -30, Z ≈ 30  →  /cheer',
      accentColor: '#f97316',
    }
  );
  addBox(-36, -0.3, 25.5, 3, 0.6, 3, 0x64748b);
  addBox(-33, -0.3, 28, 3, 0.6, 3, 0x64748b);
  addBox(-30, -0.5, 30, 6.5, 1, 6.5, 0x475569);
  addBox(-30, 0.1, 30, 2.2, 0.2, 2.2, 0xfacc15, { solid: false });

  // Potato Mode Fog Dome & Phantom Cube (#40)
  const fogDome = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.96, roughness: 1 })
  );
  fogDome.position.set(-50, 1.8, 16);
  addMeshPiece(fogDome);
  potatoFogObjects.push(fogDome);

  const phantomCube = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.0, 1.0),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 1.0 })
  );
  phantomCube.position.set(-50, 1.4, 16);
  addMeshPiece(phantomCube);
  potatoRevealObjects.push(phantomCube);
  animatedObjects.push({ mesh: phantomCube, structureId: 'forest_island', kind: 'bob', baseY: 1.4, speed: 3, phase: 2 });
  interactables.push({
    id: 'potato_cube',
    structureId: 'forest_island',
    position: new THREE.Vector3(-50, 1.4, 16),
    radius: 3.0,
    prompt: { en: '[E] Activate Phantom Cube (Graphics 1)', ru: '[E] Активировать Призрачный Куб (Графика 1)' },
    requireGraphics: 1,
    onInteractKey: 'potato_cube',
    mesh: phantomCube,
  });

  // Secret Well & Relic #2 (#99)
  addBox(-66, 0.7, 13.2, 4.0, 1.4, 0.5, 0x64748b);
  addBox(-66, 0.7, 16.8, 4.0, 1.4, 0.5, 0x64748b);
  addBox(-67.8, 0.7, 15, 0.5, 1.4, 3.6, 0x64748b);
  addBox(-64.2, 0.7, 15, 0.5, 1.4, 3.6, 0x64748b);
  addRelic('forest', -66, 1.0, 15, { en: 'Forest Well', ru: 'Лесной Колодец' });

  const p2 = addBox(-38, 0.12, 18, 2.0, 0.24, 2.0, 0xfacc15, { emissive: 0xca8a04, emissiveIntensity: 0.4 });
  plateMeshes['p2'] = p2.mesh;
  addTrigger({ id: 'plate_2', minX: -39.2, maxX: -36.8, minY: -0.2, maxY: 1.6, minZ: 16.8, maxZ: 19.2 });
  addTorch('forest', -50, 0, 4, { en: 'Forest', ru: 'Лес' });
  addElementalAltar('earth', -60, 0, 11, { en: 'Earth', ru: 'Земля' }, 0x22c55e, 3);
  endStructure();

  // =========================================================================
  // STRUCTURE 10: forest_ruins (#16 Forest Wanderer) — Ruins, Fake Wall, Caesar, Past Lever
  // =========================================================================
  beginStructure(
    'forest_ruins',
    { en: 'Ancient Stone Ruins', ru: 'Древние Каменные Руины' },
    [-46, 10, 8],
    [-63, 2, -4]
  );
  addBox(-60, 0.1, -4, 14, 0.2, 14, 0x94a3b8, { solid: false });
  const medCircle = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.1, 24),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide })
  );
  medCircle.rotation.x = -Math.PI / 2;
  medCircle.position.set(-60, 0.24, -4);
  addMeshPiece(medCircle);
  addTrigger({ id: 'ruins_center', minX: -62.5, maxX: -57.5, minY: -0.5, maxY: 3, minZ: -6.5, maxZ: -1.5 });

  addBox(-60, 2.2, -10.8, 13.6, 4.4, 0.9, 0x64748b);
  addBox(-60, 2.2, 2.8, 13.6, 4.4, 0.9, 0x64748b);
  // Fake Illusion Wall (#25)
  addBox(-67, 2.2, -4, 0.8, 4.4, 12.8, 0x64748b, {
    solid: false,
    opacity: 0.82,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.12,
  });
  addBox(-73.5, 2.2, -4, 0.8, 4.4, 13.6, 0x475569);
  addBox(-70.2, 2.2, -10.8, 7, 4.4, 0.9, 0x475569);
  addBox(-70.2, 2.2, 2.8, 7, 4.4, 0.9, 0x475569);

  const illusionCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.6, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.95 })
  );
  illusionCrystal.position.set(-70, 1.5, -1);
  addMeshPiece(illusionCrystal);
  animatedObjects.push({ mesh: illusionCrystal, structureId: 'forest_ruins', kind: 'bob', baseY: 1.5, speed: 2.6, phase: 1 });
  interactables.push({
    id: 'illusion_crystal',
    structureId: 'forest_ruins',
    position: new THREE.Vector3(-70, 1.5, -1),
    radius: 2.5,
    prompt: { en: '[E] Touch Illusion Crystal', ru: '[E] Коснуться Кристалла Иллюзий' },
    onInteractKey: 'illusion_crystal',
    mesh: illusionCrystal,
  });

  addPlaque(
    'caesar_1',
    -54,
    0,
    -8,
    Math.PI / 2,
    { en: 'Caesar Cipher I', ru: 'Шифр Цезаря I' },
    { en: ['CAESAR (+3)', 'ZRUOG', 'Type in chat'], ru: ['CAESAR (+3)', 'ZRUOG', 'Напиши в чат'] },
    {
      title: { en: 'Ancient Caesar Plaque (#29)', ru: 'Древняя Табличка Цезаря (#29)' },
      subtitle: { en: 'Alphabet shift +3', ru: 'Сдвиг алфавита +3' },
      body: {
        en: 'Each letter is shifted 3 positions forward in the English alphabet. Decode and type the answer in chat!',
        ru: 'Каждая буква сдвинута на 3 позиции вперёд по английскому алфавиту. Расшифруй и напиши ответ в чат!',
      },
      code: 'ZRUOG  (shift -3)',
      accentColor: '#eab308',
    }
  );
  addTimeLever('past', -57, 0, -9, { en: 'Past', ru: 'Прошлое' });
  endStructure();

  // =========================================================================
  // STRUCTURE 11: rainbow_pillars (#24 Behind Great Tree)
  // =========================================================================
  beginStructure(
    'rainbow_pillars',
    { en: 'Five Rainbow Pillars', ru: 'Пять Столбов Радуги' },
    [-60, 6.5, -8],
    [-60, 1.8, -17]
  );
  const rainbowDefs = [
    { key: 'yellow', label: { en: 'Yellow', ru: 'Жёлтый' }, color: 0xeab308, x: -55 },
    { key: 'blue', label: { en: 'Blue', ru: 'Синий' }, color: 0x3b82f6, x: -57.5 },
    { key: 'red', label: { en: 'Red', ru: 'Красный' }, color: 0xef4444, x: -60 },
    { key: 'green', label: { en: 'Green', ru: 'Зелёный' }, color: 0x22c55e, x: -62.5 },
    { key: 'orange', label: { en: 'Orange', ru: 'Оранжевый' }, color: 0xf97316, x: -65 },
  ];
  rainbowDefs.forEach((p) => {
    const mat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.25, roughness: 0.4 });
    pillarMaterials[p.key] = mat;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.0, 1.1), mat);
    mesh.position.set(p.x, 1.5, -17);
    mesh.castShadow = true;
    addMeshPiece(mesh);
    colliders.push({
      structureId: 'rainbow_pillars',
      minX: p.x - 0.55,
      maxX: p.x + 0.55,
      minY: 0,
      maxY: 3.0,
      minZ: -17.55,
      maxZ: -16.45,
      active: true,
    });
    interactables.push({
      id: `rainbow_${p.key}`,
      structureId: 'rainbow_pillars',
      position: new THREE.Vector3(p.x, 1.6, -17),
      radius: 2.3,
      prompt: {
        en: `[E] Rainbow Pillar: ${p.label.en}`,
        ru: `[E] Столб Радуги: ${p.label.ru}`,
      },
      onInteractKey: `rainbow:${p.key}`,
      mesh,
    });
  });
  endStructure();

  // =========================================================================
  // STRUCTURE 12: library_island (#9 Index Explorer) — North Bridge & Cipher Library
  // =========================================================================
  beginStructure(
    'library_island',
    { en: 'Cipher Library & Marble Bridge', ru: 'Библиотека Шифров и Мост' },
    [26, 20, -24],
    [0, 5, -52]
  );
  addBox(0, -0.1, -28, 6.2, 0.5, 12.2, 0xe2e8f0);
  addBox(-11, -6.5, -53, 19, 7, 34, 0x1e293b, { solid: false });
  addBox(11, -6.5, -53, 19, 7, 34, 0x1e293b, { solid: false });
  addBox(-11, -1.5, -53, 22, 3, 38, 0x475569);
  addBox(11, -1.5, -53, 22, 3, 38, 0x475569);
  addBox(0, 0.05, -52, 26, 0.08, 22, 0x7f1d1d, { solid: false });

  addBox(-14, 5, -53, 1.2, 10, 24, 0xfef3c7);
  addBox(14, 5, -53, 1.2, 10, 24, 0xfef3c7);
  addBox(0, 5, -64.5, 29, 10, 1.2, 0xfef3c7);
  addBox(-10, 5, -41, 1.4, 10, 1.4, 0xfde68a);
  addBox(10, 5, -41, 1.4, 10, 1.4, 0xfde68a);
  addBox(0, 10.2, -53, 31, 0.8, 26, 0x312e81);

  const rooftopSign = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 8),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(['ROOFTOP CODE:', 'SKYEYE'], {
        bg: '#1e1b4b',
        fg: '#fde047',
        border: '#facc15',
        fontSize: 64,
        mono: true,
      }),
    })
  );
  rooftopSign.rotation.x = -Math.PI / 2;
  rooftopSign.position.set(0, 10.65, -53);
  addMeshPiece(rooftopSign);

  [-58, -52, -46].forEach((bz) => {
    addBox(-12.2, 2.5, bz, 1.6, 5, 4.4, 0x78350f);
    addBox(12.2, 2.5, bz, 1.6, 5, 4.4, 0x78350f);
  });

  // 4 Colored Tomes (#76)
  [
    { id: 'tome1', label: { en: 'Tome I (Bottom Shelf)', ru: 'Том I (Нижняя полка)' }, y: 1.0, z: -46, color: 0xef4444, code: 'K9' },
    { id: 'tome2', label: { en: 'Tome II (Second Shelf)', ru: 'Том II (Вторая полка)' }, y: 2.0, z: -50, color: 0x3b82f6, code: 'A7' },
    { id: 'tome3', label: { en: 'Tome III (Third Shelf)', ru: 'Том III (Третья полка)' }, y: 3.0, z: -54, color: 0x22c55e, code: 'M4' },
    { id: 'tome4', label: { en: 'Tome IV (Top Shelf)', ru: 'Том IV (Верхняя полка)' }, y: 4.0, z: -58, color: 0xa855f7, code: 'X2' },
  ].forEach((t, idx) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.72, 0.45),
      new THREE.MeshStandardMaterial({ color: t.color, emissive: t.color, emissiveIntensity: 0.45 })
    );
    book.position.set(-11.2, t.y, t.z);
    addMeshPiece(book);
    interactables.push({
      id: t.id,
      structureId: 'library_island',
      position: new THREE.Vector3(-11.0, Math.min(2.2, t.y), t.z),
      radius: 2.8,
      prompt: { en: `[E] Inspect ${t.label.en}`, ru: `[E] Осмотреть ${t.label.ru}` },
      inspect: {
        title: t.label,
        subtitle: {
          en: `Shelf height level #${idx + 1} from bottom`,
          ru: `Высота полки: уровень #${idx + 1} снизу`,
        },
        body: {
          en: 'A code fragment is engraved on the golden spine. Combine all 4 fragments bottom-to-top and type /tome CODE in chat!',
          ru: 'На золотом корешке выгравирован фрагмент кода. Сложи все 4 кода снизу вверх и введи /tome КОД в чат!',
        },
        code: `FRAGMENT: ${t.code}`,
        accentColor: '#ef4444',
      },
      mesh: book,
    });
  });

  // Micro book (#53)
  const microBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.45, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfacc15, emissiveIntensity: 0.9 })
  );
  microBook.position.set(11.3, 1.65, -52);
  addMeshPiece(microBook);
  interactables.push({
    id: 'micro_book',
    structureId: 'library_island',
    position: new THREE.Vector3(11.1, 1.65, -52),
    radius: 2.4,
    prompt: {
      en: '[E] Read micro-text on spine (First Person)',
      ru: '[E] Прочитать микро-текст на корешке (Нужен First Person)',
    },
    requireFirstPerson: true,
    inspect: {
      title: { en: 'Microscopic Book Spine', ru: 'Микроскопический Корешок' },
      subtitle: { en: 'Only readable in First Person (#53)', ru: 'Видно только в режиме От первого лица (#53)' },
      body: {
        en: 'Tiny golden letters spell a single word. Type /echo <word> in chat!',
        ru: 'Крошечными золотыми буквами выведено одно слово. Введи в чат команду /echo <слово>!',
      },
      code: 'echoes',
      accentColor: '#facc15',
    },
    mesh: microBook,
  });

  addPlaque(
    'mirror_note',
    -6.5,
    0,
    -45,
    0.4,
    { en: 'Mirrored Note', ru: 'Зеркальная Записка' },
    { en: ['MIRROR WORDS:', 'TERCES', 'Type in chat'], ru: ['ЗЕРКАЛО СЛОВ:', 'TERCES', 'Напиши в чат'] },
    {
      title: { en: 'Mirrored Note (#28)', ru: 'Зеркальная Записка (#28)' },
      body: {
        en: 'Read the word backwards and type the decoded word in chat!',
        ru: 'Прочти слово задом наперёд и напиши правильный вариант в чат!',
      },
      code: 'TERCES',
      accentColor: '#eab308',
    }
  );

  addPlaque(
    'atbash_plaque',
    6.5,
    0,
    -45,
    -0.4,
    { en: 'Atbash Tablet', ru: 'Плита Атбаш' },
    { en: ['ATBASH (A↔Z)', 'NLLM', 'Type in chat'], ru: ['ATBASH (A↔Z)', 'NLLM', 'Напиши ответ в чат'] },
    {
      title: { en: 'Atbash Relic (#50)', ru: 'Реликвия Атбаш (#50)' },
      subtitle: { en: 'Reversed alphabet: A↔Z, B↔Y ... M↔N, L↔O', ru: 'Алфавит наоборот: A↔Z, B↔Y ... M↔N, L↔O' },
      body: {
        en: 'Decode the 4 letters using Atbash and type the English word in chat!',
        ru: 'Расшифруй 4 буквы по шифру Атбаш и напиши английское слово в чат!',
      },
      code: 'NLLM',
      accentColor: '#f97316',
    }
  );

  addPlaque(
    'chameleon_poem',
    -6.5,
    0,
    -55,
    0.3,
    { en: 'Chameleon Poem', ru: 'Стих Хамелеона' },
    {
      en: ['TORCH PATH:', 'Plaza→Forest→Lib', '→Lab→Volcano'],
      ru: ['ПУТЬ ФАКЕЛОВ:', 'Площадь→Лес→Библ.', '→Лаб.→Вулкан'],
    },
    {
      title: { en: 'Chameleon Path (#65)', ru: 'Путь Хамелеона (#65)' },
      subtitle: { en: 'Exact order of 5 torches worldwide', ru: 'Порядок 5 факелов по всему миру' },
      body: {
        en: 'Light the 5 torches across the world in this exact order:\n1. Spawn Plaza\n2. Whispering Forest\n3. Cipher Library\n4. Tech Lab\n5. Volcanic Cavern',
        ru: 'Зажги 5 факелов строго в этом порядке:\n1. Площадь Спавна\n2. Шепчущий Лес\n3. Библиотека Шифров\n4. Техно-Лаборатория\n5. Вулканическая Пещера',
      },
      accentColor: '#ef4444',
    }
  );

  addPlaque(
    'double_cipher',
    6.5,
    0,
    -55,
    -0.3,
    { en: 'Double Layer Cipher', ru: 'Матрёшка-шифр' },
    {
      en: ['DOUBLE CIPHER:', '=02cpJHc', '1.Reverse 2.Base64'],
      ru: ['DOUBLE CIPHER:', '=02cpJHc', '1.Reverse 2.Base64'],
    },
    {
      title: { en: 'Double Layer Cipher (#70)', ru: 'Матрёшка-шифр (#70)' },
      subtitle: { en: 'Two-stage encoding', ru: 'Двухслойная шифрограмма' },
      body: {
        en: 'Step 1: Reverse the string.\nStep 2: Base64-decode the result.\nStep 3: Type /result in chat!',
        ru: 'Шаг 1: Переверни строку задом наперёд.\nШаг 2: Расшифруй полученную строку Base64.\nШаг 3: Введи /результат в чат!',
      },
      code: '=02cpJHc',
      accentColor: '#ef4444',
    }
  );

  addPlaque(
    'rainbow_clue',
    0,
    0,
    -49,
    0,
    { en: 'Rainbow Law', ru: 'Подсказка Радуги' },
    {
      en: ['RAINBOW ORDER:', 'Red→Orange→Yellow', '→Green→Blue'],
      ru: ['ПОРЯДОК РАДУГИ:', 'Красный→Оранжевый→', 'Жёлтый→Зелёный→Синий'],
    },
    {
      title: { en: 'Law of the Spectrum (#48)', ru: 'Закон Спектра (#48)' },
      body: {
        en: 'Activate the 5 colorful pillars in Forest in true rainbow order:\nRed → Orange → Yellow → Green → Blue.',
        ru: 'Активируй 5 цветных столбов в Лесу в порядке радуги:\nКрасный → Оранжевый → Жёлтый → Зелёный → Синий.',
      },
      accentColor: '#f97316',
    }
  );

  addTorch('library', -11, 0, -42, { en: 'Library', ru: 'Библиотека' });
  addElementalAltar('knowledge', 0, 0, -61, { en: 'Knowledge', ru: 'Знание' }, 0xc084fc, 6);
  endStructure();

  // =========================================================================
  // STRUCTURE 13: lab_island (#10 Coffee Break / Pause) — East Bridge & Tech Lab
  // =========================================================================
  beginStructure(
    'lab_island',
    { en: 'Tech Lab & Neon Bridge', ru: 'Техно-Лаборатория и Мост' },
    [24, 18, 28],
    [52, 2.5, 0]
  );
  addBox(28, -0.1, 0, 12.2, 0.5, 5.6, 0x0ea5e9, { emissive: 0x0284c7, emissiveIntensity: 0.25 });
  addBox(44, -6.5, -12, 18, 7, 22, 0x0f172a, { solid: false });
  addBox(64, -6.5, -12, 18, 7, 22, 0x0f172a, { solid: false });
  addBox(44, -6.5, 12, 18, 7, 22, 0x0f172a, { solid: false });
  addBox(64, -6.5, 12, 18, 7, 22, 0x0f172a, { solid: false });
  addBox(44, -1.5, -12, 20, 3, 24, 0xe2e8f0);
  addBox(64, -1.5, -12, 20, 3, 24, 0xe2e8f0);
  addBox(44, -1.5, 12, 20, 3, 24, 0xe2e8f0);
  addBox(64, -1.5, 12, 20, 3, 24, 0xe2e8f0);
  addBox(54, 0.04, 0, 38, 0.08, 2, 0x38bdf8, { solid: false, emissive: 0x0284c7, emissiveIntensity: 0.4 });

  // Keyhole Room (#27)
  addBox(58, 2.5, -12, 6, 5, 6, 0x334155, { metalness: 0.6, roughness: 0.35 });
  const keyhole = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 12),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  keyhole.position.set(54.96, 1.6, -12);
  keyhole.rotation.y = -Math.PI / 2;
  addMeshPiece(keyhole);
  interactables.push({
    id: 'lab_keyhole',
    structureId: 'lab_island',
    position: new THREE.Vector3(54.6, 1.6, -12),
    radius: 2.3,
    prompt: {
      en: '[E] Peek through Keyhole (First Person)',
      ru: '[E] Заглянуть в замочную скважину (Нужен First Person)',
    },
    requireFirstPerson: true,
    inspect: {
      title: { en: 'Inside the Steel Vault', ru: 'Внутри Запертой Камеры' },
      subtitle: { en: 'Peeking through the keyhole (#27)', ru: 'Взгляд сквозь замочную скважину (#27)' },
      body: {
        en: 'Inside the dark chamber glows a 4-digit security code. Type it in chat!',
        ru: 'В темноте за стальной дверью светится экран с четырёхзначным кодом. Напиши его в чат!',
      },
      code: '7492',
      accentColor: '#22d3ee',
    },
    mesh: keyhole,
  });

  addPlaque(
    'gpu_protocol',
    46,
    0,
    -8,
    0,
    { en: 'GPU Protocol', ru: 'GPU Protocol' },
    {
      en: ['GPU PROTOCOL', 'Click Graphics:', '1 → 5 → 2 → 4 → 3'],
      ru: ['GPU PROTOCOL', 'Нажми Графику:', '1 → 5 → 2 → 4 → 3'],
    },
    {
      title: { en: 'GPU Protocol Terminal (#47)', ru: 'Терминал GPU Protocol (#47)' },
      subtitle: { en: 'Secret Graphics Settings sequence', ru: 'Секретная последовательность Настроек Графики' },
      body: {
        en: 'Open Pause → Settings and click the Graphics Quality bars in this exact order:',
        ru: 'Открой Пауза → Настройки и переключи уровень Графики строго в этом порядке:',
      },
      code: '1  →  5  →  2  →  4  →  3',
      accentColor: '#f97316',
    },
    { bg: '#020617', fg: '#38bdf8', border: '#0ea5e9' }
  );

  addPlaque(
    'binary_mon',
    46,
    0,
    2,
    Math.PI,
    { en: 'Binary Monitor', ru: 'Двоичный Монитор' },
    {
      en: ['01000011 01001111', '01000100 01000101', 'Type /word'],
      ru: ['01000011 01001111', '01000100 01000101', 'Введи /слово'],
    },
    {
      title: { en: 'Binary Monitor (#30)', ru: 'Двоичный Монитор (#30)' },
      subtitle: { en: 'ASCII Binary → chat command', ru: 'ASCII Binary → команда в чат' },
      body: {
        en: 'Convert these 4 ASCII bytes into 4 English letters and type /word in chat!',
        ru: 'Переведи 4 байта ASCII в 4 английские буквы и введи результат как /команду в чат!',
      },
      code: '01000011  01001111  01000100  01000101',
      accentColor: '#eab308',
    },
    { bg: '#020617', fg: '#4ade80', border: '#22c55e' }
  );

  addPlaque(
    'base64_term',
    56,
    0,
    2,
    Math.PI,
    { en: 'Base64 Terminal', ru: 'Base64 Терминал' },
    {
      en: ['BASE64 LOCK:', 'c2VjcmV0X2xhYg==', '/unlock <answer>'],
      ru: ['BASE64 LOCK:', 'c2VjcmV0X2xhYg==', '/unlock <ответ>'],
    },
    {
      title: { en: 'Base64 Terminal (#56)', ru: 'Терминал Base64 (#56)' },
      body: {
        en: 'Decode this Base64 string and enter /unlock <result> in chat!',
        ru: 'Расшифруй Base64-строку и введи команду /unlock <результат> в чат!',
      },
      code: 'c2VjcmV0X2xhYg==',
      accentColor: '#f97316',
    },
    { bg: '#020617', fg: '#fb923c', border: '#f97316' }
  );

  addPlaque(
    'lab_board',
    64,
    0,
    -6,
    -Math.PI / 2,
    { en: 'Experiment Board', ru: 'Доска Экспериментов' },
    {
      en: ['EXPERIMENTS:', 'Test 1: /gravity', 'Forbidden: /fly !'],
      ru: ['ЭКСПЕРИМЕНТЫ:', 'Тест 1: /gravity', 'Запрещено: /fly !'],
    },
    {
      title: { en: 'Lab Whiteboard (#60 & #61)', ru: 'Лабораторная Доска (#60 & #61)' },
      body: {
        en: '1. Experimental anti-gravity command: /gravity\n2. WARNING: Using cheat commands /fly or /noclip is strictly monitored!',
        ru: '1. Экспериментальная команда гравитации: /gravity\n2. ВНИМАНИЕ: Использование чит-команд /fly и /noclip строго отслеживается!',
      },
      accentColor: '#38bdf8',
    }
  );

  addPlaque(
    'precision_bp',
    68,
    0,
    -14,
    -Math.PI / 2,
    { en: 'Calibration Blueprint', ru: 'Чертёж Калибровки' },
    {
      en: ['CALIBRATION', '(First Person', '+ Graphics ≥ 4)'],
      ru: ['КАЛИБРОВКА', '(First Person', '+ Графика ≥ 4)'],
    },
    {
      title: { en: 'Optical Blueprint (#66)', ru: 'Секретный Чертёж Оптики (#66)' },
      subtitle: { en: 'Precision tuning in Pause → Settings', ru: 'Ювелирная настройка в Пауза → Настройки' },
      body: {
        en: 'Set both exact parameters in Settings simultaneously:',
        ru: 'Выстави одновременно два точных значения в Настройках:',
      },
      code: 'Sensitivity = 1.35  |  FOV = 77°',
      accentColor: '#ef4444',
    },
    {
      requireFirstPerson: true,
      requireMinGraphics: 4,
      prompt: {
        en: '[E] Inspect Blueprint (First Person + Graphics ≥ 4)',
        ru: '[E] Осмотреть Чертёж (First Person + Графика ≥ 4)',
      },
    }
  );

  addPlaque(
    'vigenere_vault',
    66,
    0,
    5,
    -Math.PI / 2,
    { en: 'Vigenère Vault', ru: 'Шифр Виженера' },
    {
      en: ['VIGENERE VAULT:', 'ERGFIPCI', '/vigenere <word>'],
      ru: ['VIGENERE VAULT:', 'ERGFIPCI', '/vigenere <ответ>'],
    },
    {
      title: { en: 'Vigenère Vault (#80)', ru: 'Хранилище Виженера (#80)' },
      subtitle: { en: 'Find the 3-letter key nearby in First Person!', ru: 'Найди 3-буквенный ключ рядом в First Person!' },
      body: {
        en: 'Decrypt this Vigenère ciphertext (subtracting key letters) and enter /vigenere <word> in chat!',
        ru: 'Расшифруй слово по шифру Виженера (вычитая буквы ключа) и введи /vigenere <слово> в чат!',
      },
      code: 'ERGFIPCI',
      accentColor: '#a855f7',
    }
  );
  addPlaque(
    'vigenere_key',
    66,
    0,
    8.5,
    -Math.PI / 2,
    { en: 'Micro-Key', ru: 'Микро-ключ' },
    { en: ['[First Person]', 'Vigenere Key'], ru: ['[First Person]', 'Ключ Виженера'] },
    {
      title: { en: 'Hidden Vigenère Key', ru: 'Скрытый Ключ Виженера' },
      body: {
        en: 'Use this key to decrypt ERGFIPCI:',
        ru: 'Используй этот ключ для расшифровки ERGFIPCI:',
      },
      code: 'KEY',
      accentColor: '#a855f7',
    },
    {
      requireFirstPerson: true,
      scale: 0.65,
      prompt: {
        en: '[E] Read micro-key (First Person)',
        ru: '[E] Прочесть микро-ключ (Нужен First Person)',
      },
    }
  );

  addBox(53, 0.08, 16, 26, 0.16, 3.2, 0x334155, { solid: false });
  addBox(41, 0.14, 16, 2.5, 0.2, 3.2, 0x22c55e, { solid: false, emissive: 0x16a34a, emissiveIntensity: 0.4 });
  addBox(65, 0.14, 16, 2.5, 0.2, 3.2, 0xa855f7, { solid: false, emissive: 0x9333ea, emissiveIntensity: 0.5 });
  addTrigger({ id: 'backwards_start', minX: 39.5, maxX: 42.5, minY: -0.5, maxY: 2.5, minZ: 14.3, maxZ: 17.7 });
  addTrigger({ id: 'backwards_finish', minX: 63.5, maxX: 66.5, minY: -0.5, maxY: 2.5, minZ: 14.3, maxZ: 17.7 });

  const p3 = addBox(38, 0.12, -18, 2.0, 0.24, 2.0, 0xfacc15, { emissive: 0xca8a04, emissiveIntensity: 0.4 });
  plateMeshes['p3'] = p3.mesh;
  addTrigger({ id: 'plate_3', minX: 36.8, maxX: 39.2, minY: -0.2, maxY: 1.6, minZ: -19.2, maxZ: -16.8 });
  addTorch('lab', 42, 0, 8, { en: 'Tech Lab', ru: 'Лаборатория' });
  addElementalAltar('tech', 52, 0, 9, { en: 'Tech', ru: 'Технология' }, 0x38bdf8, 5);
  addTimeLever('future', 49, 0, -15, { en: 'Future', ru: 'Будущее' });
  endStructure();

  // =========================================================================
  // STRUCTURE 14: volcano_island (#14 Into the Void) — South Bridge & Volcanic Cavern
  // =========================================================================
  beginStructure(
    'volcano_island',
    { en: 'Volcanic Cavern & Basalt Bridge', ru: 'Вулканическая Пещера и Мост' },
    [26, 18, 28],
    [0, 1, 54]
  );
  addBox(0, -0.1, 28, 6.2, 0.5, 12.2, 0x44403c);
  addBox(0, -1.5, 39, 44, 3, 12, 0x292524);
  addBox(0, -1.5, 69, 44, 3, 10, 0x292524);
  addBox(-17, -1.5, 54, 10, 3, 20, 0x292524);
  addBox(17, -1.5, 54, 10, 3, 20, 0x292524);
  addBox(0, -1.6, 54.5, 24, 1.0, 19, 0xf97316, {
    emissive: 0xea580c,
    emissiveIntensity: 1.1,
    hazard: true,
    roughness: 0.3,
  });

  [
    [0, -0.2, 47.5],
    [-2.5, 0.0, 50.8],
    [1.8, 0.15, 54.0],
    [-1.6, 0.25, 57.4],
    [0, 0.35, 60.8],
  ].forEach(([sx, sy, sz]) => {
    addBox(sx, sy, sz, 2.8, 0.7, 2.8, 0x57534e);
  });

  const chest = addBox(0, 0.65, 66.2, 2.0, 1.3, 1.3, 0xfacc15, { metalness: 0.75, roughness: 0.25, emissive: 0xca8a04, emissiveIntensity: 0.35 });
  interactables.push({
    id: 'volcano_chest',
    structureId: 'volcano_island',
    position: new THREE.Vector3(0, 1.1, 66.2),
    radius: 2.8,
    prompt: { en: '[E] Open Golden Volcanic Chest', ru: '[E] Открыть Золотой Сундук Вулкана' },
    onInteractKey: 'volcano_chest',
    mesh: chest.mesh,
  });

  // Hidden East Wall -> Eternity Relic #1 (#99)
  addBox(19.5, 2.5, 54, 0.8, 5, 7, 0x44403c, { solid: false, opacity: 0.8 });
  addBox(23.5, -1.5, 54, 7, 3, 9, 0x292524);
  addRelic('volcano', 23.5, 1.3, 54, { en: 'Volcano Vault', ru: 'Тайник Вулкана' });

  addPlaque(
    'shadow_altar_clue',
    10,
    0,
    40,
    -0.3,
    { en: 'Shadow Altar', ru: 'Теневой Алтарь' },
    {
      en: ['LIGHT & SHADOW:', 'Inside Volcano:', 'Graphics 1→5→1→5→1'],
      ru: ['СВЕТ И ТЬМА:', 'Внутри Вулкана:', 'Графика 1→5→1→5→1'],
    },
    {
      title: { en: 'Shadow Altar of Volcano (#75)', ru: 'Теневой Алтарь Вулкана (#75)' },
      body: {
        en: 'While standing in Volcanic Cavern, make shadows flicker: toggle Graphics in Settings 1 → 5 → 1 → 5 → 1!',
        ru: 'Стоя в Вулканической Пещере, заставь тени мигать: переключи Графику в Настройках 1 → 5 → 1 → 5 → 1!',
      },
      code: '1 → 5 → 1 → 5 → 1',
      accentColor: '#ef4444',
    }
  );

  addTorch('volcano', -15, 0, 66, { en: 'Volcano', ru: 'Вулкан' });
  addElementalAltar('fire', 14, 0, 66, { en: 'Fire', ru: 'Огонь' }, 0xef4444, 1);
  endStructure();

  // =========================================================================
  // STRUCTURE 15: volcano_crystals (#18 Fiery Breath) — 4 Volcanic Sequence Crystals
  // =========================================================================
  beginStructure(
    'volcano_crystals',
    { en: 'Four Volcanic Crystals', ru: 'Четыре Кристалла Вулкана' },
    [0, 12, 34],
    [0, 1.8, 54]
  );
  [
    { key: 'I', label: { en: 'Crystal I', ru: 'Кристалл I' }, x: -14, z: 49, color: 0xf43f5e },
    { key: 'II', label: { en: 'Crystal II', ru: 'Кристалл II' }, x: -14, z: 59, color: 0xfb923c },
    { key: 'III', label: { en: 'Crystal III', ru: 'Кристалл III' }, x: 14, z: 49, color: 0xfacc15 },
    { key: 'IV', label: { en: 'Crystal IV', ru: 'Кристалл IV' }, x: 14, z: 59, color: 0xe879f9 },
  ].forEach((c) => {
    const mat = new THREE.MeshStandardMaterial({ color: c.color, emissive: c.color, emissiveIntensity: 0.4, roughness: 0.2 });
    crystalMaterials[c.key] = mat;
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), mat);
    mesh.position.set(c.x, 1.6, c.z);
    addMeshPiece(mesh);
    animatedObjects.push({ mesh, structureId: 'volcano_crystals', kind: 'bob', baseY: 1.6, speed: 2.2, phase: c.x });
    interactables.push({
      id: `vcrystal_${c.key}`,
      structureId: 'volcano_crystals',
      position: new THREE.Vector3(c.x, 1.6, c.z),
      radius: 2.8,
      prompt: { en: `[E] ${c.label.en}`, ru: `[E] ${c.label.ru}` },
      onInteractKey: `vcrystal:${c.key}`,
      mesh,
    });
  });

  addPlaque(
    'volcano_order',
    -13,
    0,
    42,
    0.3,
    { en: 'Ancient Lava Runes', ru: 'Древние Руны Лавы' },
    { en: ['CRYSTAL ORDER:', 'III → I → IV → II'], ru: ['ПОРЯДОК КРИСТАЛЛОВ:', 'III → I → IV → II'] },
    {
      title: { en: 'Carved in Basalt (#55)', ru: 'Высечено на Базальте (#55)' },
      body: {
        en: 'Activate the 4 volcanic crystals in this exact Roman numeral order:',
        ru: 'Активируй 4 вулканических кристалла строго в римском порядке:',
      },
      code: 'III  →  I  →  IV  →  II',
      accentColor: '#f97316',
    }
  );
  endStructure();

  // =========================================================================
  // STRUCTURE 16: sky_obby (#7 /dance) — Bounce Pad & Colorful Sky Obby
  // =========================================================================
  beginStructure(
    'sky_obby',
    { en: 'Bounce Pad & Sky Obby', ru: 'Батут и Небесный Обби' },
    [34, 18, -4],
    [17, 11, -19]
  );
  addBox(16, 0.18, -10, 3.2, 0.36, 3.2, 0x22c55e, {
    emissive: 0x16a34a,
    emissiveIntensity: 0.75,
    bounce: 21.5,
    colliderId: 'bounce_main',
  });
  addTrigger({ id: 'bounce_pad', minX: 14.2, maxX: 17.8, minY: -0.2, maxY: 1.5, minZ: -11.8, maxZ: -8.2 });

  const obbyPlatforms: Array<[number, number, number, number, number, number]> = [
    [16, 4.6, -14.2, 4.4, 0.7, 4.4],
    [20.5, 6.8, -15.5, 4.0, 0.7, 4.0],
    [23.5, 9.0, -19.2, 4.0, 0.7, 4.0],
    [20.0, 11.2, -22.5, 4.0, 0.7, 4.0],
    [15.5, 13.4, -21.0, 4.0, 0.7, 4.0],
    [11.8, 15.6, -23.5, 4.0, 0.7, 4.0],
    [11.5, 17.8, -27.8, 4.0, 0.7, 4.0],
    [14.8, 20.0, -29.2, 4.2, 0.7, 4.2],
    [17.5, 22.2, -25.8, 4.4, 0.7, 4.4],
  ];
  const obbyColors = [0x38bdf8, 0x818cf8, 0xc084fc, 0xf472b6, 0xfb7185, 0xfb923c, 0xfacc15, 0x4ade80, 0x22d3ee];
  obbyPlatforms.forEach(([px, py, pz, pw, ph, pd], idx) => {
    addBox(px, py, pz, pw, ph, pd, obbyColors[idx % obbyColors.length], {
      emissive: obbyColors[idx % obbyColors.length],
      emissiveIntensity: 0.18,
    });
  });
  endStructure();

  // =========================================================================
  // STRUCTURE 17: sky_observatory (#23 Boing!) — Sky Observatory Island
  // =========================================================================
  beginStructure(
    'sky_observatory',
    { en: 'Sky Observatory Island', ru: 'Небесный Остров и Обсерватория' },
    [36, 36, -12],
    [18, 26, -34]
  );
  addBox(18, 21.8, -34, 18, 1.5, 18, 0x93c5fd, { solid: false });
  addBox(18, 23.5, -34, 22, 2, 22, 0xe0f2fe);
  // Diving Board (#77)
  addBox(9.5, 24.4, -22.5, 3.2, 0.5, 5.5, 0x38bdf8);
  addBox(6.5, 24.4, -17.5, 3.2, 0.5, 6.5, 0x0ea5e9);
  addBox(3.5, 24.4, -11.5, 3.0, 0.5, 6.5, 0xfacc15, { emissive: 0xeab308, emissiveIntensity: 0.35 });

  // Upper Observatory Deck + Telescope (#84, #89)
  addBox(18, 26.2, -39, 9, 4, 8, 0x1e3a8a);
  addBox(12.2, 25.4, -38, 2.6, 0.5, 2.4, 0x60a5fa);
  addBox(12.2, 26.8, -40.5, 2.6, 0.5, 2.4, 0x60a5fa);
  addBox(14.5, 28.0, -40.5, 2.6, 0.5, 2.4, 0x60a5fa);
  addTrigger({ id: 'observatory_peak', minX: 13.5, maxX: 22.5, minY: 27.8, maxY: 32, minZ: -43, maxZ: -35 });

  const telescope = new THREE.Group();
  telescope.position.set(18, 28.2, -40);
  const tBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.45, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 })
  );
  tBase.position.y = 0.7;
  const tTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 2.4, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
  );
  tTube.position.set(0, 1.55, -0.3);
  tTube.rotation.x = Math.PI / 3;
  telescope.add(tBase, tTube);
  addMeshPiece(telescope);
  interactables.push({
    id: 'telescope',
    structureId: 'sky_observatory',
    position: new THREE.Vector3(18, 29.2, -40),
    radius: 2.8,
    prompt: {
      en: '[E] Look through Telescope (First Person)',
      ru: '[E] Посмотреть в Телескоп (Нужен First Person)',
    },
    requireFirstPerson: true,
    inspect: {
      title: { en: 'Telescope Eyepiece — Constellation', ru: 'Окуляр Телескопа — Созвездие' },
      subtitle: { en: 'Five bright stars spell a word (#89)', ru: 'Пять ярчайших звёзд образуют слово (#89)' },
      body: {
        en: 'You spot 5 glowing stars engraved with letters. Type /word in chat!',
        ru: 'Ты видишь 5 сияющих звёзд с выгравированными буквами. Введи /слово в чат!',
      },
      code: '★ A  —  ★ S  —  ★ T  —  ★ R  —  ★ A',
      accentColor: '#a855f7',
    },
    mesh: telescope,
  });

  // Morse Beacon (#49)
  const morseLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.0 })
  );
  morseLamp.position.set(25, 26.8, -32);
  addMeshPiece(morseLamp);
  addBox(25, 25.3, -32, 1.0, 2.0, 1.0, 0x334155);
  animatedObjects.push({ mesh: morseLamp, structureId: 'sky_observatory', kind: 'morse', baseY: 26.8, speed: 1, phase: 0 });
  addPlaque(
    'morse_note',
    25,
    24.5,
    -29.5,
    Math.PI,
    { en: 'Morse Beacon', ru: 'Сигнал Морзе' },
    { en: ['MORSE BEACON:', '... - .- .-.', 'Type /word'], ru: ['MORSE BEACON:', '... - .- .-.', 'Введи /слово'] },
    {
      title: { en: 'Morse Code Beacon (#49)', ru: 'Маяк Азбуки Морзе (#49)' },
      body: {
        en: 'Decode these 4 Morse letters and type /word in chat!\n... = S | - = T | .- = A | .-. = R',
        ru: 'Расшифруй 4 буквы Морзе и введи /слово в чат!\n... = S | - = T | .- = A | .-. = R',
      },
      code: '...  -  .-  .-.',
      accentColor: '#f97316',
    }
  );

  // Ancient Oracle (#68)
  addBox(12, 26.2, -34, 2.2, 3.4, 2.2, 0xc084fc, { emissive: 0x7e22ce, emissiveIntensity: 0.35 });
  addPlaque(
    'oracle_plaque',
    12,
    24.5,
    -31.2,
    0,
    { en: 'Ancient Oracle', ru: 'Древний Оракул' },
    {
      en: ['CAESAR (+5):', 'XJHWJY ZSNAJWXJ', 'Speak the answer'],
      ru: ['CAESAR (+5):', 'XJHWJY ZSNAJWXJ', 'Скажи мне ответ'],
    },
    {
      title: { en: 'Riddle of the Ancient Oracle (#68)', ru: 'Загадка Древнего Оракула (#68)' },
      subtitle: { en: 'Caesar (+5) — speak the answer on Sky Island!', ru: 'Шифр Цезаря (+5) — произнеси ответ на Небесном Острове!' },
      body: {
        en: 'Shift every letter 5 positions BACK in the alphabet and say the two-word phrase in chat while on Sky Observatory!',
        ru: 'Сдвинь каждую букву на 5 позиций НАЗАД и напиши фразу из двух слов в чат, стоя на Небесном Острове!',
      },
      code: 'XJHWJY ZSNAJWXJ',
      accentColor: '#ef4444',
    }
  );

  // Distant Sky Relic Isle (#99)
  addBox(4, 24.2, -34, 3.5, 0.7, 3.5, 0xf8fafc);
  addBox(-2, 24.4, -34, 3.5, 0.7, 3.5, 0xf8fafc);
  addBox(-9, 24.4, -34, 6.5, 1.2, 6.5, 0xe0f2fe);
  addRelic('sky', -9, 26.2, -34, { en: 'Sky Cloud', ru: 'Небесное Облако' });

  addElementalAltar('cosmos', 24, 24.5, -26, { en: 'Cosmos', ru: 'Космос' }, 0x818cf8, 4);
  endStructure();

  // =========================================================================
  // STRUCTURE 18: sky_gauntlet (#33 Sky Observatory) — ShiftLock Beam & Sky Glitch Pad
  // =========================================================================
  beginStructure(
    'sky_gauntlet',
    { en: 'ShiftLock Gauntlet & Sky Glitch', ru: 'Испытание ShiftLock и Небесный Глитч' },
    [34, 32, -20],
    [34, 26, -34]
  );
  addBox(36, 24.3, -34, 15, 0.5, 1.1, 0xf97316);
  const slOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.0 })
  );
  slOrb.position.set(43, 25.8, -34);
  addMeshPiece(slOrb);
  animatedObjects.push({ mesh: slOrb, structureId: 'sky_gauntlet', kind: 'bob', baseY: 25.8, speed: 3, phase: 0 });
  addTrigger({ id: 'shiftlock_gauntlet_end', minX: 41.2, maxX: 44.8, minY: 24, maxY: 28, minZ: -35.8, maxZ: -32.2 });

  addBox(21.2, 28.4, -37.5, 2.4, 0.35, 2.4, 0xa855f7, { emissive: 0x9333ea, emissiveIntensity: 0.8, bounce: 23.5 });
  const skyGlitchPlat = addBox(21.2, 34.5, -33.5, 4.4, 0.6, 4.4, 0x22d3ee, {
    emissive: 0x06b6d4,
    emissiveIntensity: 0.9,
    opacity: 0.85,
    activeCollider: false,
    colliderId: 'sky_glitch_plat',
  });
  const skyGlitchCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.95, 0.95),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 1.1 })
  );
  skyGlitchCube.position.set(21.2, 36.1, -33.5);
  addMeshPiece(skyGlitchCube);
  skyGlitchObjects.push(skyGlitchPlat.mesh, skyGlitchCube);
  animatedObjects.push({ mesh: skyGlitchCube, structureId: 'sky_gauntlet', kind: 'spin', baseY: 36.1, speed: 3, phase: 0 });
  interactables.push({
    id: 'sky_glitch_cube',
    structureId: 'sky_gauntlet',
    position: new THREE.Vector3(21.2, 36.1, -33.5),
    radius: 3.0,
    prompt: { en: '[E] Claim Sky Glitch Cube', ru: '[E] Забрать Небесный Глитч-Куб' },
    requireGraphics: 1,
    requireMaxZoomOut: true,
    onInteractKey: 'sky_glitch_cube',
    mesh: skyGlitchCube,
  });
  endStructure();

  // =========================================================================
  // STRUCTURE 19: void_island (#25 Illusion Wall) — Void Portal + Glitch Void Island
  // =========================================================================
  beginStructure(
    'void_island',
    { en: 'Void Portal & Glitch Void Island', ru: 'Портал и Остров Бездны' },
    [-85, 22, -46],
    [-105, 8, -70]
  );
  // Portal inside Forest Illusion Chamber
  const voidPortal = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.25, 12, 28),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 1.3 })
  );
  voidPortal.position.set(-71.2, 2.1, -6.5);
  voidPortal.rotation.y = Math.PI / 2;
  addMeshPiece(voidPortal);
  animatedObjects.push({ mesh: voidPortal, structureId: 'void_island', kind: 'spin', baseY: 2.1, speed: 1.5, phase: 0 });
  interactables.push({
    id: 'portal_to_void',
    structureId: 'void_island',
    position: new THREE.Vector3(-71.2, 2.1, -6.5),
    radius: 2.6,
    prompt: { en: '[E] Enter Portal to Glitch Void', ru: '[E] Войти в Портал Бездны' },
    onInteractKey: 'portal:to_void',
    mesh: voidPortal,
  });

  // Void Island Platform
  addBox(-105, 5.0, -70, 26, 2, 26, 0x09090d, { roughness: 0.4, metalness: 0.4 });
  addBox(-105, 6.03, -70, 24, 0.06, 24, 0x1e1b4b, { solid: false });

  const returnPortal = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.22, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 })
  );
  returnPortal.position.set(-105, 8.0, -59);
  addMeshPiece(returnPortal);
  animatedObjects.push({ mesh: returnPortal, structureId: 'void_island', kind: 'spin', baseY: 8.0, speed: 1.5, phase: 2 });
  interactables.push({
    id: 'portal_to_plaza',
    structureId: 'void_island',
    position: new THREE.Vector3(-105, 8.0, -59),
    radius: 2.8,
    prompt: { en: '[E] Return to Spawn Plaza', ru: '[E] Вернуться на Площадь Спавна' },
    onInteractKey: 'portal:to_plaza',
    mesh: returnPortal,
  });

  const tripleRing = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.7, 32),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  tripleRing.rotation.x = -Math.PI / 2;
  tripleRing.position.set(-105, 6.1, -70);
  addMeshPiece(tripleRing);
  addTrigger({ id: 'triple_circle', minX: -108, maxX: -102, minY: 5.5, maxY: 9, minZ: -73, maxZ: -67 });

  addPlaque(
    'a1z26_tablet',
    -98,
    6,
    -64,
    -0.6,
    { en: 'Void Tablet', ru: 'Табличка Бездны' },
    { en: ['A=1 ... Z=26', '22 - 15 - 9 - 4', 'Type /word here'], ru: ['A=1 ... Z=26', '22 - 15 - 9 - 4', 'Введи /слово здесь'] },
    {
      title: { en: 'Number Alphabet of the Void (#64)', ru: 'Числовой Алфавит Бездны (#64)' },
      body: {
        en: 'Convert numbers to English letters (A=1..Z=26) and type /word while standing on Void Island!',
        ru: 'Замени числа буквами английского алфавита (A=1..Z=26) и введи /слово, стоя на Острове Бездны!',
      },
      code: '22 - 15 - 9 - 4',
      accentColor: '#f97316',
    }
  );

  addPlaque(
    'omega_term',
    -112,
    6,
    -64,
    0.6,
    { en: 'Omega Protocol', ru: 'Протокол Омега' },
    {
      en: ['OMEGA MATRIX:', 'G=3 FOV=90 Sens=1.0', 'Mus=0 Coords+SL=ON'],
      ru: ['OMEGA MATRIX:', 'G=3 FOV=90 Sens=1.0', 'Муз=0 Коорд+SL=ВКЛ'],
    },
    {
      title: { en: 'Omega Protocol (#82)', ru: 'Протокол Омега (#82)' },
      subtitle: { en: 'Set all 6 parameters simultaneously & type /omega!', ru: 'Выстави все 6 параметров одновременно и введи /omega!' },
      body: {
        en: '• Graphics: 3 (Medium)\n• FOV: 90°\n• Mouse Sensitivity: 1.00\n• Music Volume: 0%\n• Show Coordinates: ON\n• ShiftLock: ON (press Shift)\n\nThen type /omega in chat!',
        ru: '• Графика: 3 (Средняя)\n• FOV: 90°\n• Чувствительность мыши: 1.00\n• Громкость музыки: 0%\n• Показать координаты: ВКЛ\n• ShiftLock: ВКЛ (нажми Shift)\n\nЗатем введи команду /omega в чат!',
      },
      code: '/omega',
      accentColor: '#a855f7',
    }
  );

  addBox(-115.5, 8.2, -70, 0.5, 4.4, 4.2, 0x334155);
  const mirrorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.8),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.95, roughness: 0.05, emissive: 0x38bdf8, emissiveIntensity: 0.25 })
  );
  mirrorGlass.position.set(-115.2, 8.2, -70);
  mirrorGlass.rotation.y = Math.PI / 2;
  addMeshPiece(mirrorGlass);
  addTrigger({ id: 'void_mirror', minX: -115.5, maxX: -111, minY: 5.5, maxY: 10, minZ: -73, maxZ: -67 });

  addBox(-113, 7.6, -78, 3.2, 3.2, 3.2, 0x1e293b);
  const voidKeyhole = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 12),
    new THREE.MeshBasicMaterial({ color: 0xa855f7 })
  );
  voidKeyhole.position.set(-113, 7.5, -76.38);
  addMeshPiece(voidKeyhole);
  interactables.push({
    id: 'void_keyhole',
    structureId: 'void_island',
    position: new THREE.Vector3(-113, 7.5, -75.8),
    radius: 2.5,
    prompt: { en: '[E] Void Keyhole (First Person)', ru: '[E] Замочная скважина Бездны (First Person)' },
    requireFirstPerson: true,
    inspect: {
      title: { en: 'Second Graphics Fragment (#92)', ru: 'Второй Фрагмент Графики (#92)' },
      subtitle: { en: 'Hidden inside the Void cube', ru: 'Скрыто внутри куба Бездны' },
      body: {
        en: 'Middle 3 digits of the 8-step Master Graphics sequence:',
        ru: 'Средние 3 цифры 8-шаговой последовательности Графики:',
      },
      code: 'FRAG #2: 2 - 3 - 5',
      accentColor: '#a855f7',
    },
    mesh: voidKeyhole,
  });

  addPlaque(
    'quad_cipher',
    -98,
    6,
    -77,
    -2.5,
    { en: 'Quad Layer Cipher', ru: 'Четырёхслойный Шифр' },
    {
      en: ['-.-- ..-. --.- -...', '1.Morse 2.Caesar(-1)', '3.Reverse → /quad'],
      ru: ['-.-- ..-. --.- -...', '1.Morse 2.Caesar(-1)', '3.Reverse → /quad'],
    },
    {
      title: { en: 'Quad Layer Cipher (#93 — Best)', ru: 'Четырёхслойный Шифр (#93 — Best)' },
      subtitle: { en: 'Three decryption layers + command', ru: 'Тройная дешифровка + команда' },
      body: {
        en: 'Step 1: Decode Morse into 4 letters.\nStep 2: Shift each letter back by 1 (Caesar -1).\nStep 3: Reverse the word.\nStep 4: Enter /quad <answer> in chat!',
        ru: 'Шаг 1: Переведи Морзе в 4 латинские буквы.\nШаг 2: Сдвинь каждую букву на 1 назад (Цезарь -1).\nШаг 3: Переверни слово задом наперёд.\nШаг 4: Введи /quad <ответ> в чат!',
      },
      code: '-.--  ..-.  --.-  -...',
      accentColor: '#f8fafc',
    },
    { bg: '#050508', fg: '#f8fafc', border: '#e2e8f0' }
  );
  endStructure();

  // =========================================================================
  // STRUCTURE 20: void_extensions (#63 Portal to Void) — Invisible Bridge & Black Obby
  // =========================================================================
  beginStructure(
    'void_extensions',
    { en: 'Invisible Bridge & The Black Obby', ru: 'Невидимый Мост и Чёрный Обби' },
    [-76, 22, -52],
    [-86, 12, -78]
  );
  addBox(-105, 5.7, -94, 2.6, 0.5, 22, 0xffffff, { opacity: 0.01, shadow: false });
  for (let bz = -84; bz >= -104; bz -= 2.2) {
    const sp = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshBasicMaterial({ color: 0xe879f9 })
    );
    sp.position.set(-105 + Math.sin(bz) * 0.4, 6.2, bz);
    addMeshPiece(sp);
    ultraOnlyObjects.push(sp);
    animatedObjects.push({ mesh: sp, structureId: 'void_extensions', kind: 'bob', baseY: 6.2, speed: 3.5, phase: bz });
  }
  addBox(-105, 5.5, -108, 6.5, 1.2, 6.5, 0x1e1b4b);
  const phantomSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.2 })
  );
  phantomSphere.position.set(-105, 7.4, -108);
  addMeshPiece(phantomSphere);
  animatedObjects.push({ mesh: phantomSphere, structureId: 'void_extensions', kind: 'bob', baseY: 7.4, speed: 2.8, phase: 0 });
  interactables.push({
    id: 'phantom_sphere',
    structureId: 'void_extensions',
    position: new THREE.Vector3(-105, 7.4, -108),
    radius: 3.0,
    prompt: { en: '[E] Touch Phantom Sphere', ru: '[E] Коснуться Призрачной Сферы' },
    onInteractKey: 'phantom_sphere',
    mesh: phantomSphere,
  });

  [
    [-90.5, 7.2, -70],
    [-87.5, 8.6, -68],
    [-84.5, 10.0, -71],
    [-81.5, 11.4, -68.5],
    [-78.5, 12.8, -71.5],
    [-75.5, 14.2, -69],
    [-72.5, 15.6, -70],
  ].forEach(([bx, by, bz]) => {
    addBox(bx, by, bz, 1.85, 0.45, 1.85, 0x09090d, { emissive: 0xfacc15, emissiveIntensity: 0.16 });
  });
  addBox(-68, 16.5, -70, 5.2, 1.0, 5.2, 0x09090d, { emissive: 0x334155, emissiveIntensity: 0.25 });
  const obelisk = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 3.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x050508, emissive: 0xfacc15, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.1 })
  );
  obelisk.position.set(-68, 19.0, -70);
  addMeshPiece(obelisk);
  animatedObjects.push({ mesh: obelisk, structureId: 'void_extensions', kind: 'spin', baseY: 19.0, speed: 0.8, phase: 0 });
  interactables.push({
    id: 'black_obelisk',
    structureId: 'void_extensions',
    position: new THREE.Vector3(-68, 18.2, -70),
    radius: 3.2,
    prompt: { en: '[E] Activate Black Obelisk of Absolute', ru: '[E] Активировать Чёрный Обелиск Абсолюта' },
    onInteractKey: 'black_obelisk',
    mesh: obelisk,
  });
  endStructure();

  // =========================================================================
  // 12 BONUS TROPHY / LANDMARK LEGO STRUCTURES (Rewarding further secrets!)
  // =========================================================================

  // 21: plaza_lanterns (#8 Take a Seat)
  beginStructure(
    'plaza_lanterns',
    { en: 'Plaza Glow Lanterns', ru: 'Фонари Площади' },
    [14, 7, 16],
    [0, 2.5, 0]
  );
  [
    [-8, -8],
    [8, -8],
    [-8, 8],
    [8, 8],
  ].forEach(([lx, lz]) => {
    addBox(lx, 1.8, lz, 0.32, 3.6, 0.32, 0x1e293b);
    addBox(lx, 3.9, lz, 0.72, 0.72, 0.72, 0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 0.95, solid: false });
  });
  endStructure();

  // 22: spawn_crystal_arch (#21 /reset)
  beginStructure(
    'spawn_crystal_arch',
    { en: 'Spawn Crystal Archway', ru: 'Кристальная Арка Спавна' },
    [8, 6, 17],
    [0, 3.5, 10]
  );
  addBox(-3.2, 2.2, 10, 0.7, 4.4, 0.7, 0x38bdf8, { emissive: 0x0284c7, emissiveIntensity: 0.5 });
  addBox(3.2, 2.2, 10, 0.7, 4.4, 0.7, 0x38bdf8, { emissive: 0x0284c7, emissiveIntensity: 0.5 });
  addBox(0, 4.7, 10, 7.2, 0.7, 0.7, 0x7dd3fc, { emissive: 0x38bdf8, emissiveIntensity: 0.6, solid: false });
  endStructure();

  // 23: library_spire (#26 SKYEYE)
  beginStructure(
    'library_spire',
    { en: 'Library Golden Spire', ru: 'Золотой Шпиль Библиотеки' },
    [16, 20, -34],
    [0, 14, -53]
  );
  addBox(0, 12.2, -62, 2.4, 3.2, 2.4, 0x4338ca, { solid: false });
  addBox(0, 15.2, -62, 1.4, 3.2, 1.4, 0x6366f1, { solid: false });
  const spireCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.9 })
  );
  spireCrystal.position.set(0, 18.2, -62);
  addMeshPiece(spireCrystal);
  animatedObjects.push({ mesh: spireCrystal, structureId: 'library_spire', kind: 'spin', baseY: 18.2, speed: 1.5, phase: 0 });
  endStructure();

  // 24: forest_rune_arch (#29 Caesar I)
  beginStructure(
    'forest_rune_arch',
    { en: 'Ancient Forest Rune Arch', ru: 'Рунная Арка Леса' },
    [-34, 7, 9],
    [-46, 3.5, 0]
  );
  addBox(-46, 2.4, -4, 1.0, 4.8, 1.0, 0x475569);
  addBox(-46, 2.4, 4, 1.0, 4.8, 1.0, 0x475569);
  addBox(-46, 5.2, 0, 1.2, 1.0, 9.2, 0x22c55e, { emissive: 0x16a34a, emissiveIntensity: 0.5, solid: false });
  endStructure();

  // 25: clocktower_gears (#32 Clocktower Peak)
  beginStructure(
    'clocktower_gears',
    { en: 'Floating Golden Gears', ru: 'Парящие Золотые Шестерни' },
    [-4, 21, 20],
    [-15, 16, 8]
  );
  [12, 15.5, 19.5].forEach((gy, i) => {
    const gear = new THREE.Mesh(
      new THREE.TorusGeometry(4.2 - i * 0.5, 0.22, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.55, metalness: 0.8 })
    );
    gear.rotation.x = Math.PI / 2;
    gear.position.set(-15, gy, 8);
    addMeshPiece(gear);
    animatedObjects.push({ mesh: gear, structureId: 'clocktower_gears', kind: 'spin', baseY: gy, speed: (i % 2 === 0 ? 1 : -1) * 1.1, phase: i });
  });
  endStructure();

  // 26: volcano_pillars (#34 Lava Hopper)
  beginStructure(
    'volcano_pillars',
    { en: 'Obsidian Magma Spires', ru: 'Обсидиановые Шпили Вулкана' },
    [22, 12, 38],
    [0, 4, 56]
  );
  [
    [-18, 42],
    [18, 42],
    [-18, 70],
    [18, 70],
  ].forEach(([vx, vz]) => {
    addBox(vx, 3.2, vz, 2.2, 6.4, 2.2, 0x1c1917);
    addBox(vx, 7.0, vz, 1.4, 1.4, 1.4, 0xf97316, { emissive: 0xea580c, emissiveIntensity: 1.1, solid: false });
  });
  endStructure();

  // 27: lab_gpu_monolith (#47 GPU Protocol)
  beginStructure(
    'lab_gpu_monolith',
    { en: 'Holographic GPU Core', ru: 'Голографическое Ядро GPU' },
    [40, 10, 12],
    [54, 4.5, 0]
  );
  addBox(54, 1.2, 0, 2.6, 2.4, 2.6, 0x0f172a);
  const gpuCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.1, wireframe: true })
  );
  gpuCore.position.set(54, 4.5, 0);
  addMeshPiece(gpuCore);
  animatedObjects.push({ mesh: gpuCore, structureId: 'lab_gpu_monolith', kind: 'spin', baseY: 4.5, speed: 1.8, phase: 0 });
  endStructure();

  // 28: forest_rainbow_arch (#48 Rainbow Order)
  beginStructure(
    'forest_rainbow_arch',
    { en: 'Giant Forest Rainbow Arch', ru: 'Гигантская Радужная Арка Леса' },
    [-36, 15, 16],
    [-60, 8, -14]
  );
  const rbCols = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6];
  rbCols.forEach((col, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(9.5 - i * 0.65, 0.3, 8, 28, Math.PI),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.65 })
    );
    arc.position.set(-60, 1.5, -17);
    addMeshPiece(arc);
  });
  endStructure();

  // 29: plaza_flame_crown (#65 Chameleon Path)
  beginStructure(
    'plaza_flame_crown',
    { en: 'Crown of Five Flames', ru: 'Корона Пяти Огней' },
    [14, 14, 14],
    [0, 9.5, 0]
  );
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const fx = Math.cos(ang) * 5.2;
    const fz = Math.sin(ang) * 5.2;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65, 0),
      new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.2 })
    );
    gem.position.set(fx, 9.5, fz);
    addMeshPiece(gem);
    animatedObjects.push({ mesh: gem, structureId: 'plaza_flame_crown', kind: 'bob', baseY: 9.5, speed: 2.5, phase: i });
  }
  endStructure();

  // 30: fountain_elemental_orbit (#81 Elemental Order)
  beginStructure(
    'fountain_elemental_orbit',
    { en: 'Orbit of Six Elements', ru: 'Орбита Шести Стихий' },
    [12, 9, 12],
    [0, 5.2, 0]
  );
  const elCols = [0xef4444, 0x38bdf8, 0x22c55e, 0x818cf8, 0x06b6d4, 0xc084fc];
  elCols.forEach((col, i) => {
    const ang = (i / 6) * Math.PI * 2;
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.0 })
    );
    orb.position.set(Math.cos(ang) * 3.8, 5.4, Math.sin(ang) * 3.8);
    addMeshPiece(orb);
    animatedObjects.push({ mesh: orb, structureId: 'fountain_elemental_orbit', kind: 'bob', baseY: 5.4, speed: 3.0, phase: i });
  });
  endStructure();

  // 31: void_victory_spires (#95 The Black Obby)
  beginStructure(
    'void_victory_spires',
    { en: 'Twin Obsidian Spires', ru: 'Обсидиановые Шпили Победы' },
    [-82, 22, -54],
    [-105, 13, -70]
  );
  [
    [-116, -59],
    [-94, -59],
    [-116, -81],
    [-94, -81],
  ].forEach(([sx, sz]) => {
    addBox(sx, 11.5, sz, 1.8, 11, 1.8, 0x09090d, { emissive: 0xfacc15, emissiveIntensity: 0.25, solid: false });
    addBox(sx, 17.8, sz, 1.1, 1.1, 1.1, 0xfde047, { emissive: 0xfacc15, emissiveIntensity: 1.2, solid: false });
  });
  endStructure();

  // 32: celestial_crown_temple (#100 SECRET UNIVERSE!)
  beginStructure(
    'celestial_crown_temple',
    { en: 'Celestial Crown of Secret Universe', ru: 'Небесная Корона Secret Universe' },
    [22, 24, 22],
    [0, 14, 0]
  );
  const crownRing = new THREE.Mesh(
    new THREE.TorusGeometry(9.5, 0.55, 12, 36),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.9, metalness: 0.9 })
  );
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.set(0, 14.5, 0);
  addMeshPiece(crownRing);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    addBox(Math.cos(ang) * 9.5, 16.5, Math.sin(ang) * 9.5, 1.2, 3.6, 1.2, 0xfacc15, {
      emissive: 0xfde047,
      emissiveIntensity: 0.85,
      solid: false,
    });
  }
  const grandGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(2.2, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfde047, emissiveIntensity: 1.3 })
  );
  grandGem.position.set(0, 18.5, 0);
  addMeshPiece(grandGem);
  animatedObjects.push({ mesh: grandGem, structureId: 'celestial_crown_temple', kind: 'spin', baseY: 18.5, speed: 1.0, phase: 0 });
  endStructure();

  // =========================================================================
  // STRUCTURE STATE HELPERS & DYNAMIC VISUALS
  // =========================================================================
  const skyGlitchCollider = skyGlitchPlat.collider!;

  const isStructureBuilt = (id?: string): boolean => {
    if (!id) return true;
    const s = structures[id];
    return s ? s.built : true;
  };

  const setStructureBuiltImmediate = (id: string, built: boolean) => {
    const s = structures[id];
    if (!s) return;
    s.built = built;
    s.animating = false;
    s.group.visible = built;
    for (const p of s.pieces) {
      p.obj.visible = true;
      p.obj.position.copy(p.targetPos);
      p.obj.rotation.copy(p.targetRot);
      p.obj.scale.copy(p.targetScale);
    }
    // Restore original materials in case flash was active
    for (const fm of s.flashMeshes) {
      fm.mesh.material = fm.origMat;
    }
    if (id === 'plaza_base') {
      clouds.visible = built;
    }
  };

  const setStructureFlashWhite = (id: string, active: boolean, opacity = 1.0) => {
    const s = structures[id];
    if (!s) return;
    if (active) {
      flashWhiteMat.opacity = opacity;
      for (const fm of s.flashMeshes) {
        fm.mesh.material = flashWhiteMat;
      }
    } else {
      for (const fm of s.flashMeshes) {
        fm.mesh.material = fm.origMat;
      }
    }
  };

  const resetAllStructures = () => {
    Object.keys(structures).forEach((id) => setStructureBuiltImmediate(id, false));
    clouds.visible = false;
  };

  const setLanguage = (lang: Language) => {
    if (currentLang === lang) return;
    currentLang = lang;
    for (const entry of localizedSigns) {
      const oldTex = entry.mat.map;
      entry.mat.map = makeTextTexture(entry.lines[lang], entry.opts);
      entry.mat.needsUpdate = true;
      oldTex?.dispose();
    }
  };

  const updateDynamicVisuals = (
    time: number,
    graphics: number,
    isMaxZoomOut: boolean,
    unityBeamActive: boolean
  ) => {
    for (const item of animatedObjects) {
      if (item.structureId) {
        const s = structures[item.structureId];
        if (!s || !s.built || s.animating) continue;
      }
      if (item.kind === 'bob') {
        item.mesh.position.y = item.baseY + Math.sin(time * item.speed + item.phase) * 0.22;
        item.mesh.rotation.y = time * 0.8 + item.phase;
      } else if (item.kind === 'spin') {
        item.mesh.rotation.y = time * item.speed + item.phase;
      } else if (item.kind === 'pulse') {
        const s = 1 + Math.sin(time * item.speed) * 0.14;
        item.mesh.scale.set(s, 1 + Math.cos(time * item.speed) * 0.18, s);
      } else if (item.kind === 'cloud') {
        item.mesh.position.y = item.baseY + Math.sin(time * item.speed + item.phase) * 0.6;
      } else if (item.kind === 'morse') {
        const seq = [1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
        const idx = Math.floor(time * 4) % seq.length;
        const mat = (item.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if ('emissiveIntensity' in mat) {
          mat.emissiveIntensity = seq[idx] === 1 ? 1.8 : 0.1;
        }
      }
    }

    const showUltra = graphics === 5;
    for (const o of ultraOnlyObjects) {
      o.visible = showUltra;
    }

    const isPotato = graphics === 1;
    for (const o of potatoFogObjects) {
      o.visible = !isPotato;
    }
    for (const o of potatoRevealObjects) {
      o.visible = isPotato;
    }

    const showGlitch = graphics === 1 && isMaxZoomOut && isStructureBuilt('sky_gauntlet');
    skyGlitchCollider.active = showGlitch;
    for (const o of skyGlitchObjects) {
      o.visible = showGlitch;
    }

    finalBeam.visible = unityBeamActive && isStructureBuilt('fountain');
  };

  const getZoneAt = (pos: THREE.Vector3): ZoneId => {
    if (pos.x < -80 && pos.z < -45) return 'void';
    if (pos.y > 16 && pos.x > -16 && pos.z < -5) return 'sky';
    if (pos.x < -30) return 'forest';
    if (pos.x > 30) return 'lab';
    if (pos.z < -30) return 'library';
    if (pos.z > 30) return 'volcano';
    return 'plaza';
  };

  return {
    colliders,
    interactables,
    triggers,
    structures,
    animatedObjects,
    ultraOnlyObjects,
    potatoFogObjects,
    potatoRevealObjects,
    skyGlitchObjects,
    skyGlitchCollider,
    finalBeam,
    torchFlames,
    pillarMaterials,
    crystalMaterials,
    plateMeshes,
    relicMeshes,
    stars,
    clouds,
    isStructureBuilt,
    setStructureBuiltImmediate,
    setStructureFlashWhite,
    resetAllStructures,
    setLanguage,
    updateDynamicVisuals,
    getZoneAt,
  };
}
