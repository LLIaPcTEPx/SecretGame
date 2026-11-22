import * as THREE from 'three';
import { InspectContent, ZoneId } from '../types/game';

export interface ColliderBox {
  id?: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  bounce?: number; // upward velocity when stepped on
  hazard?: boolean; // lava -> respawn
  active?: boolean; // conditional colliders (default true)
}

export interface InteractableItem {
  id: string;
  position: THREE.Vector3;
  radius: number;
  prompt: string;
  requireFirstPerson?: boolean;
  requireGraphics?: number;
  requireMinGraphics?: number;
  requireMaxZoomOut?: boolean;
  inspect?: InspectContent;
  mesh?: THREE.Object3D;
  onInteractKey?: string; // dispatched to SecretManager
}

export interface TriggerVolume {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface WorldData {
  colliders: ColliderBox[];
  interactables: InteractableItem[];
  triggers: TriggerVolume[];
  animatedObjects: Array<{ mesh: THREE.Object3D; kind: 'bob' | 'spin' | 'morse' | 'pulse' | 'cloud'; baseY: number; speed: number; phase: number }>;
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
  updateDynamicVisuals: (time: number, graphics: number, isMaxZoomOut: boolean, secretCount: number) => void;
  getZoneAt: (pos: THREE.Vector3) => ZoneId;
}

export const ZONE_NAMES: Record<ZoneId, string> = {
  plaza: 'Площадь Спавна',
  forest: 'Шепчущий Лес',
  library: 'Библиотека Шифров',
  lab: 'Техно-Лаборатория',
  volcano: 'Вулканическая Пещера',
  sky: 'Небесная Обсерватория',
  void: 'Остров Бездны',
};

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

  // Hour ticks & numbers
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

  // Hands showing 03:45
  // Minute hand at 45 (pointing left, angle PI)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 - 140, 256);
  ctx.stroke();

  // Hour hand at 3.75 (pointing right + slightly down)
  const hrAng = ((3 + 45 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(256 + Math.cos(hrAng) * 105, 256 + Math.sin(hrAng) * 105);
  ctx.stroke();

  // Digital sub-display for crisp clarity
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(176, 326, 160, 48);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 34px JetBrains Mono, monospace';
  ctx.fillText('03:45', 256, 352);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildWorld(scene: THREE.Scene): WorldData {
  const colliders: ColliderBox[] = [];
  const interactables: InteractableItem[] = [];
  const triggers: TriggerVolume[] = [];
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

  // Helper to create a box mesh + optional solid collider
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
      parent?: THREE.Object3D;
      colliderId?: string;
      activeCollider?: boolean;
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
    (opts.parent ?? scene).add(mesh);

    let collider: ColliderBox | undefined;
    if (opts.solid !== false) {
      collider = {
        id: opts.colliderId,
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

  const addPlaque = (
    id: string,
    x: number,
    y: number,
    z: number,
    rotY: number,
    title: string,
    lines: string[],
    inspect: InspectContent,
    opts: {
      bg?: string;
      fg?: string;
      border?: string;
      prompt?: string;
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

    const boardMat = new THREE.MeshStandardMaterial({
      map: makeTextTexture(lines, {
        bg: opts.bg ?? '#0f172a',
        fg: opts.fg ?? '#f8fafc',
        border: opts.border ?? '#38bdf8',
        fontSize: 38,
        mono: true,
      }),
      roughness: 0.3,
    });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8 * sc, 1.0 * sc, 0.12 * sc), boardMat);
    board.position.y = 1.55 * sc;
    board.castShadow = true;

    group.add(stand, board);
    scene.add(group);

    interactables.push({
      id,
      position: new THREE.Vector3(x, y + 1.3 * sc, z),
      radius: 3.1,
      prompt: opts.prompt ?? `[E] Прочитать: ${title}`,
      requireFirstPerson: opts.requireFirstPerson,
      requireMinGraphics: opts.requireMinGraphics,
      inspect,
      mesh: group,
      onInteractKey: opts.onInteractKey,
    });
    return group;
  };

  const addTorch = (key: string, x: number, y: number, z: number, label: string) => {
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
    scene.add(group);
    torchFlames[key] = flame;
    animatedObjects.push({ mesh: flame, kind: 'bob', baseY: 2.0, speed: 2.5, phase: x });

    interactables.push({
      id: `torch_${key}`,
      position: new THREE.Vector3(x, y + 1.4, z),
      radius: 2.8,
      prompt: `[E] Зажечь Факел (${label})`,
      onInteractKey: `torch:${key}`,
      mesh: group,
    });
  };

  const addElementalAltar = (
    elementKey: string,
    x: number,
    y: number,
    z: number,
    label: string,
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

    // Small clue plate on altar pedestal showing its elemental order number
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.48),
      new THREE.MeshBasicMaterial({
        map: makeTextTexture([`${label}`, `#${clueNumber}`], {
          bg: '#09090d',
          fg: '#fde047',
          border: '#facc15',
          fontSize: 44,
          w: 256,
          h: 128,
        }),
      })
    );
    sign.position.set(0, 0.5, 1.02);
    group.add(sign);

    scene.add(group);
    animatedObjects.push({ mesh: orb, kind: 'spin', baseY: 1.65, speed: 1.8, phase: clueNumber });

    interactables.push({
      id: `altar_${elementKey}`,
      position: new THREE.Vector3(x, y + 1.2, z),
      radius: 2.9,
      prompt: `[E] Алтарь Стихии: ${label} (#${clueNumber})`,
      onInteractKey: `element:${elementKey}`,
      mesh: group,
    });
  };

  const addTimeLever = (key: string, x: number, y: number, z: number, label: string) => {
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
    scene.add(group);

    interactables.push({
      id: `lever_${key}`,
      position: new THREE.Vector3(x, y + 1, z),
      radius: 2.8,
      prompt: `[E] Рычаг Времени: ${label}`,
      onInteractKey: `timelever:${key}`,
      mesh: group,
    });
  };

  const addRelic = (key: string, x: number, y: number, z: number, label: string) => {
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
    scene.add(mesh);
    relicMeshes[key] = mesh;
    animatedObjects.push({ mesh, kind: 'bob', baseY: y, speed: 2.8, phase: x });

    interactables.push({
      id: `relic_${key}`,
      position: new THREE.Vector3(x, y, z),
      radius: 2.6,
      prompt: `[E] Взять Древнюю Реликвию (${label})`,
      onInteractKey: `relic:${key}`,
      mesh,
    });
  };

  // =========================================================================
  // SKY: STARS & FLOATING CLOUDS & SKY DOME CIPHER (#52)
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

  // Decorative floating clouds
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, transparent: true, opacity: 0.9 });
  const cloudCoords = [
    [-40, 36, -30],
    [45, 40, -15],
    [-20, 44, 45],
    [35, 38, 38],
    [-70, 34, 10],
    [0, 46, -65],
    [70, 35, -45],
    [-85, 32, -50],
  ];
  cloudCoords.forEach(([cx, cy, cz], idx) => {
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

  // SKY DOME CIPHER (#52) high above center plaza, readable when zoomed out & looking up
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
  scene.add(skyCipherPlane);

  // =========================================================================
  // ZONE 1: ПЛОЩАДЬ СПАВНА (PLAZA) — x: -22..22, z: -22..22, top y = 0
  // =========================================================================
  addBox(0, -1.5, 0, 44, 3, 44, 0x4ade80, { roughness: 0.85 }); // lush grass top slab
  addBox(0, -6.5, 0, 40, 7, 40, 0x334155, { solid: false }); // floating island rock underside
  // Stone plaza tiles in center
  addBox(0, 0.04, 0, 26, 0.08, 26, 0xe2e8f0, { solid: false, roughness: 0.6 });
  addBox(0, 0.05, 0, 6, 0.08, 44, 0xcbd5e1, { solid: false }); // N-S road
  addBox(0, 0.05, 0, 44, 0.08, 6, 0xcbd5e1, { solid: false }); // E-W road

  // UNDER-ISLAND BOTTOM SIGN (#51 & #92 Fragment 1) facing downward under Plaza!
  const underSign = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 7),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(['Изнанка мира:', '/underworld', 'GPU Frag #1: 5-1-4'], {
        bg: '#09090d',
        fg: '#c084fc',
        border: '#a855f7',
        fontSize: 40,
        mono: true,
      }),
      side: THREE.DoubleSide,
    })
  );
  underSign.position.set(0, -10.1, 4);
  underSign.rotation.x = Math.PI / 2;
  scene.add(underSign);

  // SEALED X-RAY ROOM (#86) embedded under north edge of Plaza (no door — peek via camera zoom!)
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
  scene.add(xrayGroup);

  // Central Fountain (0, 0, 0) — Secret #4 & #77 & #100
  const fountainRimColor = 0xcbd5e1;
  addBox(0, 0.45, -4.3, 9.2, 0.9, 0.7, fountainRimColor);
  addBox(0, 0.45, 4.3, 9.2, 0.9, 0.7, fountainRimColor);
  addBox(-4.3, 0.45, 0, 0.7, 0.9, 8.2, fountainRimColor);
  addBox(4.3, 0.45, 0, 0.7, 0.9, 8.2, fountainRimColor);
  // Water surface
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
  scene.add(waterMesh);
  // Central spire
  addBox(0, 1.4, 0, 1.6, 2.8, 1.6, 0xf1f5f9);
  const fountainCrown = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.2 })
  );
  fountainCrown.position.set(0, 3.6, 0);
  scene.add(fountainCrown);
  animatedObjects.push({ mesh: fountainCrown, kind: 'bob', baseY: 3.6, speed: 2.2, phase: 0 });

  // Trigger for stepping into fountain (#4, #77, #94 step 1)
  triggers.push({ id: 'fountain', minX: -4, maxX: 4, minY: -0.5, maxY: 2.5, minZ: -4, maxZ: 4 });

  // Final #100 Golden Beam (appears when player has 99 secrets!)
  const finalBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 80, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    })
  );
  finalBeam.position.set(0, 40, 0);
  finalBeam.visible = false;
  scene.add(finalBeam);

  interactables.push({
    id: 'final_pedestal',
    position: new THREE.Vector3(0, 1.8, 0),
    radius: 3.8,
    prompt: '[E] Центральный Пьедестал Secret Universe',
    onInteractKey: 'final_pedestal',
    mesh: fountainCrown,
  });

  // Welcome Arch at (0, 0, 14) + Big Red Button (#15) behind left pillar
  addBox(-4.2, 3.2, 14, 1.2, 6.4, 1.2, 0x3b82f6);
  addBox(4.2, 3.2, 14, 1.2, 6.4, 1.2, 0x3b82f6);
  addBox(0, 6.5, 14, 10.4, 1.6, 1.4, 0x1d4ed8);
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 1.3),
    new THREE.MeshBasicMaterial({
      map: makeTextTexture(['SECRET UNIVERSE — 100 СЕКРЕТОВ'], {
        bg: '#1e3a8a',
        fg: '#fde047',
        border: '#60a5fa',
        fontSize: 34,
        w: 768,
        h: 128,
      }),
      side: THREE.DoubleSide,
    })
  );
  archSign.position.set(0, 6.5, 13.25);
  scene.add(archSign);

  // Big Red Button behind Arch left pillar (#15 & #94 step 3)
  const redBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, 0.25, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.65 })
  );
  redBtn.rotation.x = Math.PI / 2;
  redBtn.position.set(-4.2, 1.4, 14.7);
  scene.add(redBtn);
  interactables.push({
    id: 'red_button',
    position: new THREE.Vector3(-4.2, 1.4, 15.0),
    radius: 2.6,
    prompt: '[E] Нажать Большую Красную Кнопку',
    onInteractKey: 'red_button',
    mesh: redBtn,
  });

  // Bench near Fountain (#8)
  addBox(7.2, 0.5, 3, 2.6, 0.25, 0.9, 0x92400e);
  addBox(7.2, 0.95, 3.35, 2.6, 0.7, 0.2, 0x78350f);
  interactables.push({
    id: 'plaza_bench',
    position: new THREE.Vector3(7.2, 0.8, 2.7),
    radius: 2.4,
    prompt: '[E] Присесть на скамейку',
    onInteractKey: 'bench_sit',
  });

  // Golden Founder Statue at (0, 0, -14) (#43, #99)
  addBox(0, 0.6, -14, 3.2, 1.2, 3.2, 0x475569);
  addBox(0, 2.4, -14, 1.4, 2.4, 0.9, 0xfacc15, { metalness: 0.8, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.2 });
  addBox(0, 4.1, -14, 1.0, 1.0, 1.0, 0xfde047, { metalness: 0.8, roughness: 0.2 });

  // Difficulty Chart Monument at (-14, 0, -14)
  const chartColors = [0x22c55e, 0xeab308, 0xf97316, 0xef4444, 0xa855f7, 0x111118];
  const chartLabels = ['Easy', 'Medium', 'Hard', 'Amazing', 'Okay?', 'Best'];
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
    'Difficulty Chart',
    ['DIFFICULTY CHART', 'Easy • Medium • Hard', 'Amazing • Okay? • Best'],
    {
      title: 'Таблица Сложности (Difficulty Chart)',
      subtitle: '6 уровней • 100 уникальных секретов',
      body:
        'Все 100 секретов разделены на 6 уровней сложности:\n• Easy (Зелёный) — 24 секрета\n• Medium (Жёлтый) — 22 секрета\n• Hard (Оранжевый) — 18 секретов\n• Amazing (Красный) — 15 секретов\n• Okay? (Фиолетовый) — 12 секретов\n• Best (Чёрный) — 9 секретов\n\nОткрой Index (Tab), чтобы следить за прогрессом и читать подсказки!',
      accentColor: '#22c55e',
    }
  );
  void chartLabels;

  // Gazebo / Pavilion at (14, 0, 12) — Low Roof (#20) & Emote Chain Plaque (#71)
  addBox(14, 0.25, 12, 6.4, 0.5, 6.4, 0xf1f5f9);
  addBox(11.3, 2.2, 9.3, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(16.7, 2.2, 9.3, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(11.3, 2.2, 14.7, 0.5, 3.6, 0.5, 0x94a3b8);
  addBox(16.7, 2.2, 14.7, 0.5, 3.6, 0.5, 0x94a3b8);
  // Stepping ledges to climb onto roof
  addBox(10.2, 1.3, 12, 1.4, 0.4, 1.6, 0x64748b);
  addBox(10.2, 2.6, 10.6, 1.4, 0.4, 1.6, 0x64748b);
  // Pavilion Roof (y = 4.2)
  addBox(14, 4.15, 12, 7.2, 0.6, 7.2, 0xef4444);
  triggers.push({ id: 'pavilion_roof', minX: 10.5, maxX: 17.5, minY: 4.1, maxY: 6.5, minZ: 8.5, maxZ: 15.5 });

  // Emote Chain Clue inside Pavilion (#71)
  addPlaque(
    'emote_clue',
    14,
    0.5,
    14.2,
    Math.PI,
    'Танец Порядка',
    ['EMOTE CHAIN (20s)', '1. /wave  2. /dance', '3. /cheer  4. /sit'],
    {
      title: 'Скрижаль Эмоций',
      subtitle: 'Подсказка к секрету #71',
      body: 'Выполни четыре команды эмоций в чате в точном порядке за 20 секунд:',
      code: '/wave  →  /dance  →  /cheer  →  /sit',
      accentColor: '#ef4444',
    }
  );

  // Clocktower at (-15, 0, 8) — Peak (#32), 03:45 (#58), Chrono Altar 45s (#74), GPU Frag #3 (#92)
  addBox(-15, 9, 8, 5, 18, 5, 0x78716c);
  addBox(-15, 18.4, 8, 6.2, 0.8, 6.2, 0xd6d3d1); // Top platform y = 18.8
  // Clock faces on all 4 sides
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
    scene.add(face);
  });
  // Spiral climbing steps around the Clocktower!
  const spiralSteps = [
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
  ];
  spiralSteps.forEach(([sx, sy, sz]) => {
    addBox(sx, sy, sz, 2.2, 0.4, 2.2, 0xf59e0b);
  });
  // Chrono Altar glowing ring on top of Clocktower
  const chronoRing = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  chronoRing.rotation.x = -Math.PI / 2;
  chronoRing.position.set(-15, 18.85, 8);
  scene.add(chronoRing);
  triggers.push({ id: 'clocktower_peak', minX: -18, maxX: -12, minY: 18.4, maxY: 22, minZ: 5, maxZ: 11 });

  addPlaque(
    'clocktower_frag',
    -15,
    18.8,
    6.1,
    0,
    'Записка Часовщика',
    ['GPU FRAG #3:', '3 - 1', '(Итого 8 цифр)'],
    {
      title: 'Третий Фрагмент Графики',
      subtitle: 'Финальный кусок 8-шагового кода (#92)',
      body: 'Соедини все 3 фрагмента из разных уголков мира:\n1) Под дном Площади (5-1-4)\n2) Замочная скважина Острова Бездны (2-3-5)\n3) Вершина Башни Часов (3-1)',
      code: 'FRAG #3: 3 - 1',
      accentColor: '#eab308',
    },
    { scale: 0.85 }
  );

  // ULTRA RUNES on Plaza (0, 0.08, 6) — ONLY visible at Graphics = 5 (#41)
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
  scene.add(ultraRuneGroup);
  ultraOnlyObjects.push(ultraRuneGroup);
  animatedObjects.push({ mesh: runeCore, kind: 'bob', baseY: 0.8, speed: 3, phase: 1 });
  interactables.push({
    id: 'ultra_runes',
    position: new THREE.Vector3(0, 0.8, 6.8),
    radius: 2.8,
    prompt: '[E] Активировать Ультра-Руны',
    requireGraphics: 5,
    onInteractKey: 'ultra_runes',
    mesh: ultraRuneGroup,
  });

  // Plaza Pressure Plate #1 (#42), Torch #1 (#65), Water Altar (#81), Present Time Lever (#87)
  const p1 = addBox(17, 0.12, -15, 2.0, 0.24, 2.0, 0xfacc15, { emissive: 0xca8a04, emissiveIntensity: 0.4 });
  plateMeshes['p1'] = p1.mesh;
  triggers.push({ id: 'plate_1', minX: 15.8, maxX: 18.2, minY: -0.2, maxY: 1.6, minZ: -16.2, maxZ: -13.8 });
  addTorch('plaza', -10, 0, -9, 'Площадь');
  addElementalAltar('water', 0, 0, -6.2, 'Вода', 0x38bdf8, 2);
  addTimeLever('present', -11, 0, 8, 'Настоящее');

  // Direction Signpost near spawn
  addPlaque(
    'hub_guide',
    4.5,
    0,
    9.5,
    -0.4,
    'Путеводитель',
    ['← Лес   ↑ Библиотека', '→ Лаб.  ↓ Вулкан', '↗ Небесный Обби'],
    {
      title: 'Карта Островов Secret Universe',
      subtitle: 'Ориентиры от Площади Спавна',
      body:
        '• Запад (←): Шепчущий Лес и Древние Руины\n• Север (↑): Библиотека Шифров\n• Восток (→): Техно-Лаборатория\n• Юг (↓): Вулканическая Пещера\n• Северо-Восток (↗): Батут на Небесную Обсерваторию\n• ???: Тайный Остров Бездны (ищи портал в Руинах!)',
      accentColor: '#38bdf8',
    },
    { scale: 0.9 }
  );

  // =========================================================================
  // ZONE 2: ШЕПЧУЩИЙ ЛЕС И РУИНЫ (FOREST) — x: -74..-34, z: -24..24
  // =========================================================================
  // Wooden Bridge (-22 to -34) + Under-Bridge Ledge (#45)
  addBox(-28, -0.1, 0, 12.2, 0.5, 5.6, 0x92400e);
  addBox(-28, 0.7, -2.7, 12, 0.9, 0.25, 0x78350f);
  addBox(-28, 0.7, 2.7, 12, 0.9, 0.25, 0x78350f);
  // Hidden ledge under the bridge (#45) with easy side drop step
  addBox(-25.5, -1.6, 3.8, 2.2, 0.4, 2.2, 0x78350f);
  addBox(-28, -2.8, 0, 4.5, 0.5, 4.5, 0x78350f);
  const underBridgeGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.8 })
  );
  underBridgeGem.position.set(-28, -1.9, 0);
  scene.add(underBridgeGem);
  animatedObjects.push({ mesh: underBridgeGem, kind: 'bob', baseY: -1.9, speed: 2.5, phase: 2 });
  triggers.push({ id: 'under_bridge', minX: -30.5, maxX: -25.5, minY: -3.2, maxY: -0.6, minZ: -2.5, maxZ: 2.5 });

  // Forest Island Base
  addBox(-54, -1.5, 0, 40, 3, 48, 0x16a34a, { roughness: 0.9 });
  addBox(-54, -6.5, 0, 36, 7, 44, 0x1e293b, { solid: false });

  // Stylized Trees
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
  // GIANT ANCIENT TREE at (-44, 0, -11) — Hidden Glowing Cube behind it (#24)
  addTree(-44, -11, 1.85);
  const behindTreeCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.85, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 })
  );
  behindTreeCube.position.set(-44, 0.7, -13.6);
  scene.add(behindTreeCube);
  animatedObjects.push({ mesh: behindTreeCube, kind: 'spin', baseY: 0.7, speed: 1.5, phase: 0 });
  interactables.push({
    id: 'behind_tree_cube',
    position: new THREE.Vector3(-44, 0.7, -13.6),
    radius: 2.5,
    prompt: '[E] Взять Светящийся Куб за деревом',
    onInteractKey: 'behind_tree',
    mesh: behindTreeCube,
  });

  // Campfire at (-44, 0, 8) (#31)
  addBox(-44, 0.2, 8, 1.6, 0.3, 0.4, 0x78350f, { solid: false });
  addBox(-44, 0.2, 8, 0.4, 0.3, 1.6, 0x78350f, { solid: false });
  const fireMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.2 })
  );
  fireMesh.position.set(-44, 0.85, 8);
  scene.add(fireMesh);
  animatedObjects.push({ mesh: fireMesh, kind: 'pulse', baseY: 0.85, speed: 6, phase: 0 });
  triggers.push({ id: 'campfire', minX: -48, maxX: -40, minY: -0.5, maxY: 3, minZ: 4, maxZ: 12 });

  // ANCIENT RUINS at (-60, 0, -4)
  addBox(-60, 0.1, -4, 14, 0.2, 14, 0x94a3b8, { solid: false });
  // Meditation circle for Monk's Patience (#90)
  const medCircle = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.1, 24),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide })
  );
  medCircle.rotation.x = -Math.PI / 2;
  medCircle.position.set(-60, 0.24, -4);
  scene.add(medCircle);
  triggers.push({ id: 'ruins_center', minX: -62.5, maxX: -57.5, minY: -0.5, maxY: 3, minZ: -6.5, maxZ: -1.5 });

  // Stone Ruin walls (north, south, and FAKE ILLUSION WEST WALL at x = -67!)
  addBox(-60, 2.2, -10.8, 13.6, 4.4, 0.9, 0x64748b);
  addBox(-60, 2.2, 2.8, 13.6, 4.4, 0.9, 0x64748b);
  // FAKE ILLUSION WALL (#25) — solid: false!! Slightly shimmering
  addBox(-67, 2.2, -4, 0.8, 4.4, 12.8, 0x64748b, {
    solid: false,
    opacity: 0.82,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.12,
  });
  // Secret chamber behind fake wall (-73.5..-67.5, z: -10..2)
  addBox(-73.5, 2.2, -4, 0.8, 4.4, 13.6, 0x475569);
  addBox(-70.2, 2.2, -10.8, 7, 4.4, 0.9, 0x475569);
  addBox(-70.2, 2.2, 2.8, 7, 4.4, 0.9, 0x475569);

  // Illusion Crystal (#25)
  const illusionCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.6, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.95 })
  );
  illusionCrystal.position.set(-70, 1.5, -1);
  scene.add(illusionCrystal);
  animatedObjects.push({ mesh: illusionCrystal, kind: 'bob', baseY: 1.5, speed: 2.6, phase: 1 });
  interactables.push({
    id: 'illusion_crystal',
    position: new THREE.Vector3(-70, 1.5, -1),
    radius: 2.5,
    prompt: '[E] Коснуться Кристалла Иллюзий',
    onInteractKey: 'illusion_crystal',
    mesh: illusionCrystal,
  });

  // HIDDEN VOID PORTAL behind Illusion Wall (#63) -> teleports to Glitch Void Island!
  const voidPortal = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.25, 12, 28),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 1.3 })
  );
  voidPortal.position.set(-71.2, 2.1, -6.5);
  voidPortal.rotation.y = Math.PI / 2;
  scene.add(voidPortal);
  animatedObjects.push({ mesh: voidPortal, kind: 'spin', baseY: 2.1, speed: 1.5, phase: 0 });
  interactables.push({
    id: 'portal_to_void',
    position: new THREE.Vector3(-71.2, 2.1, -6.5),
    radius: 2.6,
    prompt: '[E] Войти в Портал Бездны',
    onInteractKey: 'portal:to_void',
    mesh: voidPortal,
  });

  // Caesar Cipher Plaque (#29) & Coordinate Cache Plaque (#57)
  addPlaque(
    'caesar_1',
    -54,
    0,
    -8,
    Math.PI / 2,
    'Шифр Цезаря I',
    ['CAESAR (+3)', 'ZRUOG', 'Напиши в чат'],
    {
      title: 'Древняя Табличка Цезаря',
      subtitle: 'Сдвиг алфавита +3 (#29)',
      body: 'Каждая буква в слове сдвинута на 3 позиции вперёд по английскому алфавиту. Расшифруй и напиши ответ в чат!',
      code: 'ZRUOG  (сдвиг -3)',
      accentColor: '#eab308',
    }
  );

  addPlaque(
    'coord_clue',
    -42,
    0,
    -2,
    Math.PI / 2,
    'Записка Искателя',
    ['КООРДИНАТЫ КЛАДА', 'X ≈ -30, Z ≈ 30', 'Встань и введи /cheer'],
    {
      title: 'Карта Координат',
      subtitle: 'Подсказка к секрету #57',
      body: 'Включи отображение координат в Настройках (или введи /pos). Доберись до тайного каменного островка в точке X ≈ -30, Z ≈ 30 и похлопай командой /cheer!',
      code: 'X ≈ -30, Z ≈ 30  →  /cheer',
      accentColor: '#f97316',
    }
  );

  // Coordinate Cache stone island at (-30, 0, 30) connected by stepping stones from south Forest!
  addBox(-36, -0.3, 25.5, 3, 0.6, 3, 0x64748b);
  addBox(-33, -0.3, 28, 3, 0.6, 3, 0x64748b);
  addBox(-30, -0.5, 30, 6.5, 1, 6.5, 0x475569);
  addBox(-30, 0.1, 30, 2.2, 0.2, 2.2, 0xfacc15, { solid: false }); // Golden X marks the spot!

  // 5 Rainbow Pillars at (-56..-64, 0, -17) (#48)
  const rainbowDefs = [
    { key: 'yellow', label: 'Жёлтый', color: 0xeab308, x: -55 },
    { key: 'blue', label: 'Синий', color: 0x3b82f6, x: -57.5 },
    { key: 'red', label: 'Красный', color: 0xef4444, x: -60 },
    { key: 'green', label: 'Зелёный', color: 0x22c55e, x: -62.5 },
    { key: 'orange', label: 'Оранжевый', color: 0xf97316, x: -65 },
  ];
  rainbowDefs.forEach((p) => {
    const mat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.25, roughness: 0.4 });
    pillarMaterials[p.key] = mat;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.0, 1.1), mat);
    mesh.position.set(p.x, 1.5, -17);
    mesh.castShadow = true;
    scene.add(mesh);
    colliders.push({
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
      position: new THREE.Vector3(p.x, 1.6, -17),
      radius: 2.3,
      prompt: `[E] Столб Радуги: ${p.label}`,
      onInteractKey: `rainbow:${p.key}`,
      mesh,
    });
  });

  // POTATO MODE PHANTOM CUBE at (-50, 0, 16) (#40) — Hidden inside dense fog dome when graphics > 1!
  const fogDome = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.96, roughness: 1 })
  );
  fogDome.position.set(-50, 1.8, 16);
  scene.add(fogDome);
  potatoFogObjects.push(fogDome);

  const phantomCube = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.0, 1.0),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 1.0 })
  );
  phantomCube.position.set(-50, 1.4, 16);
  scene.add(phantomCube);
  potatoRevealObjects.push(phantomCube);
  animatedObjects.push({ mesh: phantomCube, kind: 'bob', baseY: 1.4, speed: 3, phase: 2 });
  interactables.push({
    id: 'potato_cube',
    position: new THREE.Vector3(-50, 1.4, 16),
    radius: 3.0,
    prompt: '[E] Активировать Призрачный Куб (Графика 1)',
    requireGraphics: 1,
    onInteractKey: 'potato_cube',
    mesh: phantomCube,
  });

  // Secret Well at (-66, 0, 15) holding Eternity Relic #2 (#99)
  addBox(-66, 0.7, 13.2, 4.0, 1.4, 0.5, 0x64748b);
  addBox(-66, 0.7, 16.8, 4.0, 1.4, 0.5, 0x64748b);
  addBox(-67.8, 0.7, 15, 0.5, 1.4, 3.6, 0x64748b);
  addBox(-64.2, 0.7, 15, 0.5, 1.4, 3.6, 0x64748b);
  addRelic('forest', -66, 1.0, 15, 'Лесной Колодец');

  // Forest Plate #2 (#42), Torch #2 (#65), Earth Altar (#81), Past Lever (#87)
  const p2 = addBox(-38, 0.12, 18, 2.0, 0.24, 2.0, 0xfacc15, { emissive: 0xca8a04, emissiveIntensity: 0.4 });
  plateMeshes['p2'] = p2.mesh;
  triggers.push({ id: 'plate_2', minX: -39.2, maxX: -36.8, minY: -0.2, maxY: 1.6, minZ: 16.8, maxZ: 19.2 });
  addTorch('forest', -50, 0, 4, 'Лес');
  addElementalAltar('earth', -60, 0, 11, 'Земля', 0x22c55e, 3);
  addTimeLever('past', -57, 0, -9, 'Прошлое');

  // =========================================================================
  // ZONE 3: БИБЛИОТЕКА ШИФРОВ (LIBRARY) — x: -22..22, z: -72..-34
  // =========================================================================
  addBox(0, -0.1, -28, 6.2, 0.5, 12.2, 0xe2e8f0); // Marble North Bridge
  addBox(0, -1.5, -53, 44, 3, 38, 0x475569);
  addBox(0, -6.5, -53, 40, 7, 34, 0x1e293b, { solid: false });
  // Carpet inside Library
  addBox(0, 0.05, -52, 26, 0.08, 22, 0x7f1d1d, { solid: false });

  // Library Columns & Walls & Roof (y = 10)
  addBox(-14, 5, -53, 1.2, 10, 24, 0xfef3c7);
  addBox(14, 5, -53, 1.2, 10, 24, 0xfef3c7);
  addBox(0, 5, -64.5, 29, 10, 1.2, 0xfef3c7);
  // Front arch columns (open entrance facing south)
  addBox(-10, 5, -41, 1.4, 10, 1.4, 0xfde68a);
  addBox(10, 5, -41, 1.4, 10, 1.4, 0xfde68a);
  // Roof slab at y = 10.2
  addBox(0, 10.2, -53, 31, 0.8, 26, 0x312e81);

  // ROOFTOP GIANT TEXT (#26): SKYEYE — readable by zooming camera out high above Library!
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
  scene.add(rooftopSign);

  // Bookshelves along side walls
  [-58, -52, -46].forEach((bz) => {
    addBox(-12.2, 2.5, bz, 1.6, 5, 4.4, 0x78350f);
    addBox(12.2, 2.5, bz, 1.6, 5, 4.4, 0x78350f);
  });

  // 4 Colored Tomes (#76) at ascending shelf heights on West Bookshelves!
  const tomes = [
    { id: 'tome1', label: 'Том I (Нижняя полка)', y: 1.0, z: -46, color: 0xef4444, code: 'K9' },
    { id: 'tome2', label: 'Том II (Вторая полка)', y: 2.0, z: -50, color: 0x3b82f6, code: 'A7' },
    { id: 'tome3', label: 'Том III (Третья полка)', y: 3.0, z: -54, color: 0x22c55e, code: 'M4' },
    { id: 'tome4', label: 'Том IV (Верхняя полка)', y: 4.0, z: -58, color: 0xa855f7, code: 'X2' },
  ];
  tomes.forEach((t, idx) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.72, 0.45),
      new THREE.MeshStandardMaterial({ color: t.color, emissive: t.color, emissiveIntensity: 0.45 })
    );
    book.position.set(-11.2, t.y, t.z);
    scene.add(book);
    interactables.push({
      id: t.id,
      position: new THREE.Vector3(-11.0, Math.min(2.2, t.y), t.z),
      radius: 2.8,
      prompt: `[E] Осмотреть ${t.label}`,
      inspect: {
        title: t.label,
        subtitle: `Высота полки: уровень #${idx + 1} снизу`,
        body: 'На золотом корешке выгравирован фрагмент кода. Сложи все 4 кода снизу вверх и введи /tome КОД в чат!',
        code: `ФРАГМЕНТ: ${t.code}`,
        accentColor: '#ef4444',
      },
      mesh: book,
    });
  });

  // Microscopic Gold Book Spine on East shelf (#53) — requires First Person!
  const microBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.45, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfacc15, emissiveIntensity: 0.9 })
  );
  microBook.position.set(11.3, 1.65, -52);
  scene.add(microBook);
  interactables.push({
    id: 'micro_book',
    position: new THREE.Vector3(11.1, 1.65, -52),
    radius: 2.4,
    prompt: '[E] Прочитать микро-текст на корешке (Нужен First Person)',
    requireFirstPerson: true,
    inspect: {
      title: 'Микроскопический Корешок',
      subtitle: 'Видно только в режиме От первого лица (#53)',
      body: 'Крошечными золотыми буквами выведено одно слово. Введи в чат команду /echo <слово>!',
      code: 'echoes',
      accentColor: '#facc15',
    },
    mesh: microBook,
  });

  // Library Cipher Plaques (#28, #48 clue, #50, #65 poem, #70 double-layer)
  addPlaque(
    'mirror_note',
    -6.5,
    0,
    -45,
    0.4,
    'Зеркальная Записка',
    ['ЗЕРКАЛО СЛОВ:', 'TERCES', 'Напиши в чат'],
    {
      title: 'Зеркальная Записка (#28)',
      body: 'Прочти слово задом наперёд и напиши правильный вариант в чат!',
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
    'Плита Атбаш',
    ['ATBASH (A↔Z)', 'NLLM', 'Напиши ответ в чат'],
    {
      title: 'Реликвия Атбаш (#50)',
      subtitle: 'Алфавит наоборот: A↔Z, B↔Y, C↔X ... M↔N, L↔O',
      body: 'Расшифруй 4 буквы по шифру Атбаш и напиши английское слово в чат!',
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
    'Стих Хамелеона',
    ['ПУТЬ ФАКЕЛОВ:', 'Площадь→Лес→Библ.', '→Лаб.→Вулкан'],
    {
      title: 'Путь Хамелеона (#65)',
      subtitle: 'Порядок 5 факелов по всему миру',
      body:
        '«[П]уть [Л]ежит [Б]лиз [Л]аборатории [В]улкана»\nЗажги 5 факелов строго в этом порядке:\n1. Площадь Спавна\n2. Шепчущий Лес\n3. Библиотека Шифров\n4. Техно-Лаборатория\n5. Вулканическая Пещера',
      accentColor: '#ef4444',
    }
  );

  addPlaque(
    'double_cipher',
    6.5,
    0,
    -55,
    -0.3,
    'Матрёшка-шифр',
    ['DOUBLE CIPHER:', '=02cpJHc', '1.Reverse 2.Base64'],
    {
      title: 'Матрёшка-шифр (#70)',
      subtitle: 'Двухслойная шифрограмма',
      body: 'Шаг 1: Переверни строку задом наперёд.\nШаг 2: Расшифруй полученную строку Base64.\nШаг 3: Введи /результат в чат!',
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
    'Подсказка Радуги',
    ['ПОРЯДОК РАДУГИ:', 'Красный→Оранжевый→', 'Жёлтый→Зелёный→Синий'],
    {
      title: 'Закон Спектра (#48)',
      body: '«Каждый Охотник Желает Знать Где Сидит Фазан».\nАктивируй 5 цветных столбов в Лесных Руинах в порядке:\nКрасный → Оранжевый → Жёлтый → Зелёный → Синий.',
      accentColor: '#f97316',
    }
  );

  addTorch('library', -11, 0, -42, 'Библиотека');
  addElementalAltar('knowledge', 0, 0, -61, 'Знание', 0xc084fc, 6);

  // =========================================================================
  // ZONE 4: ТЕХНО-ЛАБОРАТОРИЯ (LAB) — x: 34..74, z: -24..24
  // =========================================================================
  addBox(28, -0.1, 0, 12.2, 0.5, 5.6, 0x0ea5e9, { emissive: 0x0284c7, emissiveIntensity: 0.25 }); // Neon East Bridge
  addBox(54, -1.5, 0, 40, 3, 48, 0xe2e8f0);
  addBox(54, -6.5, 0, 36, 7, 44, 0x0f172a, { solid: false });
  // Neon trim strips
  addBox(54, 0.04, 0, 38, 0.08, 2, 0x38bdf8, { solid: false, emissive: 0x0284c7, emissiveIntensity: 0.4 });

  // Lab Keyhole Room at (58, 0, -12) (#27) — Locked steel chamber with glowing keyhole!
  addBox(58, 2.5, -12, 6, 5, 6, 0x334155, { metalness: 0.6, roughness: 0.35 });
  const keyhole = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 12),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  keyhole.position.set(54.96, 1.6, -12);
  keyhole.rotation.y = -Math.PI / 2;
  scene.add(keyhole);
  interactables.push({
    id: 'lab_keyhole',
    position: new THREE.Vector3(54.6, 1.6, -12),
    radius: 2.3,
    prompt: '[E] Заглянуть в замочную скважину (Нужен First Person)',
    requireFirstPerson: true,
    inspect: {
      title: 'Внутри Запертой Камеры',
      subtitle: 'Взгляд сквозь замочную скважину (#27)',
      body: 'В темноте за стальной дверью светится экран с четырёхзначным кодом. Напиши его в чат!',
      code: '7492',
      accentColor: '#22d3ee',
    },
    mesh: keyhole,
  });

  // GPU Protocol Screen (#47) — Graphics quality sequence!
  addPlaque(
    'gpu_protocol',
    46,
    0,
    -8,
    0,
    'GPU Protocol',
    ['GPU PROTOCOL', 'Нажми Графику:', '1 → 5 → 2 → 4 → 3'],
    {
      title: 'Терминал GPU Protocol (#47)',
      subtitle: 'Секретная последовательность Настроек Графики',
      body: 'Открой Пауза → Настройки и переключи уровень Графики строго в этом порядке (можно кликать по полоскам 1..5):',
      code: '1  →  5  →  2  →  4  →  3',
      accentColor: '#f97316',
    },
    { bg: '#020617', fg: '#38bdf8', border: '#0ea5e9' }
  );

  // Binary Monitor (#30)
  addPlaque(
    'binary_mon',
    46,
    0,
    2,
    Math.PI,
    'Binary Monitor',
    ['01000011 01001111', '01000100 01000101', 'Введи /слово'],
    {
      title: 'Двоичный Монитор (#30)',
      subtitle: 'ASCII Binary → команда в чат',
      body: 'Переведи 4 байта ASCII в 4 английские буквы и введи результат как /команду в чат!',
      code: '01000011  01001111  01000100  01000101',
      accentColor: '#eab308',
    },
    { bg: '#020617', fg: '#4ade80', border: '#22c55e' }
  );

  // Base64 Terminal (#56)
  addPlaque(
    'base64_term',
    56,
    0,
    2,
    Math.PI,
    'Base64 Терминал',
    ['BASE64 LOCK:', 'c2VjcmV0X2xhYg==', '/unlock <ответ>'],
    {
      title: 'Терминал Base64 (#56)',
      body: 'Расшифруй Base64-строку и введи команду /unlock <результат> в чат!',
      code: 'c2VjcmV0X2xhYg==',
      accentColor: '#f97316',
    },
    { bg: '#020617', fg: '#fb923c', border: '#f97316' }
  );

  // Gravity & Anti-cheat Whiteboard (#60, #61)
  addPlaque(
    'lab_board',
    64,
    0,
    -6,
    -Math.PI / 2,
    'Доска Экспериментов',
    ['ЭКСПЕРИМЕНТЫ:', 'Тест 1: /gravity', 'Запрещено: /fly !'],
    {
      title: 'Лабораторная Доска (#60 & #61)',
      body: '1. Экспериментальная команда гравитации: /gravity\n2. ВНИМАНИЕ: Использование чит-команд /fly и /noclip строго отслеживается системой!',
      accentColor: '#38bdf8',
    }
  );

  // Precision Blueprint (#66) — Requires First Person + Graphics >= 4!
  addPlaque(
    'precision_bp',
    68,
    0,
    -14,
    -Math.PI / 2,
    'Чертёж Калибровки',
    ['КАЛИБРОВКА', '(First Person', '+ Графика ≥ 4)'],
    {
      title: 'Секретный Чертёж Оптики (#66)',
      subtitle: 'Ювелирная настройка в меню Пауза → Настройки',
      body: 'Выстави одновременно два точных значения в Настройках:',
      code: 'Чувствительность = 1.35  |  FOV = 77°',
      accentColor: '#ef4444',
    },
    { requireFirstPerson: true, requireMinGraphics: 4, prompt: '[E] Осмотреть Чертёж (First Person + Графика ≥ 4)' }
  );

  // Vigenère Vault (#80) at (66, 0, 5) + Micro Key Plaque nearby
  addPlaque(
    'vigenere_vault',
    66,
    0,
    5,
    -Math.PI / 2,
    'Шифр Виженера',
    ['VIGENERE VAULT:', 'ERGFIPCI', '/vigenere <ответ>'],
    {
      title: 'Хранилище Виженера (#80)',
      subtitle: 'Найди 3-буквенный ключ рядом в режиме First Person!',
      body: 'Расшифруй слово по шифру Виженера (вычитая буквы ключа) и введи /vigenere <слово> в чат!',
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
    'Микро-ключ',
    ['[First Person]', 'Ключ Виженера'],
    {
      title: 'Скрытый Ключ Виженера',
      body: 'Используй этот ключ для расшифровки ERGFIPCI:',
      code: 'KEY',
      accentColor: '#a855f7',
    },
    { requireFirstPerson: true, scale: 0.65, prompt: '[E] Прочесть микро-ключ (Нужен First Person)' }
  );

  // Backwards ShiftLock Track along South Terrace (x: 40..66, z: 16) (#79)
  addBox(53, 0.08, 16, 26, 0.16, 3.2, 0x334155, { solid: false });
  addBox(41, 0.14, 16, 2.5, 0.2, 3.2, 0x22c55e, { solid: false, emissive: 0x16a34a, emissiveIntensity: 0.4 });
  addBox(65, 0.14, 16, 2.5, 0.2, 3.2, 0xa855f7, { solid: false, emissive: 0x9333ea, emissiveIntensity: 0.5 });
  triggers.push({ id: 'backwards_start', minX: 39.5, maxX: 42.5, minY: -0.5, maxY: 2.5, minZ: 14.3, maxZ: 17.7 });
  triggers.push({ id: 'backwards_finish', minX: 63.5, maxX: 66.5, minY: -0.5, maxY: 2.5, minZ: 14.3, maxZ: 17.7 });

  // Lab Plate #3 (#42), Torch #4 (#65), Tech Altar (#81), Future Lever (#87)
  const p3 = addBox(38, 0.12, -18, 2.0, 0.24, 2.0, 0xfacc15, { emissive: 0xca8a04, emissiveIntensity: 0.4 });
  plateMeshes['p3'] = p3.mesh;
  triggers.push({ id: 'plate_3', minX: 36.8, maxX: 39.2, minY: -0.2, maxY: 1.6, minZ: -19.2, maxZ: -16.8 });
  addTorch('lab', 42, 0, 8, 'Лаборатория');
  addElementalAltar('tech', 52, 0, 9, 'Технология', 0x38bdf8, 5);
  addTimeLever('future', 49, 0, -15, 'Будущее');

  // =========================================================================
  // ZONE 5: ВУЛКАНИЧЕСКАЯ ПЕЩЕРА (VOLCANO) — x: -22..22, z: 34..74
  // =========================================================================
  addBox(0, -0.1, 28, 6.2, 0.5, 12.2, 0x44403c); // Basalt South Bridge
  // Outer rim around central lava pit
  addBox(0, -1.5, 39, 44, 3, 12, 0x292524); // North ledge (z: 33..45)
  addBox(0, -1.5, 69, 44, 3, 10, 0x292524); // South ledge (z: 64..74)
  addBox(-17, -1.5, 54, 10, 3, 20, 0x292524); // West rim
  addBox(17, -1.5, 54, 10, 3, 20, 0x292524); // East rim

  // Glowing Lava Lake in center (x: -12..12, z: 45..64)
  addBox(0, -1.6, 54.5, 24, 1.0, 19, 0xf97316, {
    emissive: 0xea580c,
    emissiveIntensity: 1.1,
    hazard: true,
    roughness: 0.3,
  });

  // Lava Parkour Stepping Stones (#34) leading to Golden Volcanic Chest at (0, 0.5, 63)
  [
    [0, -0.2, 47.5],
    [-2.5, 0.0, 50.8],
    [1.8, 0.15, 54.0],
    [-1.6, 0.25, 57.4],
    [0, 0.35, 60.8],
  ].forEach(([sx, sy, sz]) => {
    addBox(sx, sy, sz, 2.8, 0.7, 2.8, 0x57534e);
  });

  // Golden Volcanic Chest at (0, 0.6, 66.2) (#34)
  const chest = addBox(0, 0.65, 66.2, 2.0, 1.3, 1.3, 0xfacc15, { metalness: 0.75, roughness: 0.25, emissive: 0xca8a04, emissiveIntensity: 0.35 });
  interactables.push({
    id: 'volcano_chest',
    position: new THREE.Vector3(0, 1.1, 66.2),
    radius: 2.8,
    prompt: '[E] Открыть Золотой Сундук Вулкана',
    onInteractKey: 'volcano_chest',
    mesh: chest.mesh,
  });

  // 4 Volcanic Crystal Sequence Pillars (I, II, III, IV) (#55) — Order: III -> I -> IV -> II
  const crystalDefs = [
    { key: 'I', label: 'Кристалл I', x: -14, z: 49, color: 0xf43f5e },
    { key: 'II', label: 'Кристалл II', x: -14, z: 59, color: 0xfb923c },
    { key: 'III', label: 'Кристалл III', x: 14, z: 49, color: 0xfacc15 },
    { key: 'IV', label: 'Кристалл IV', x: 14, z: 59, color: 0xe879f9 },
  ];
  crystalDefs.forEach((c) => {
    const mat = new THREE.MeshStandardMaterial({ color: c.color, emissive: c.color, emissiveIntensity: 0.4, roughness: 0.2 });
    crystalMaterials[c.key] = mat;
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), mat);
    mesh.position.set(c.x, 1.6, c.z);
    scene.add(mesh);
    animatedObjects.push({ mesh, kind: 'bob', baseY: 1.6, speed: 2.2, phase: c.x });
    interactables.push({
      id: `vcrystal_${c.key}`,
      position: new THREE.Vector3(c.x, 1.6, c.z),
      radius: 2.8,
      prompt: `[E] ${c.label}`,
      onInteractKey: `vcrystal:${c.key}`,
      mesh,
    });
  });

  // Roman Numeral Wall Clues for #55
  addPlaque(
    'volcano_order',
    -13,
    0,
    42,
    0.3,
    'Древние Руны Лавы',
    ['ПОРЯДОК КРИСТАЛЛОВ:', 'III → I → IV → II'],
    {
      title: 'Высечено на Базальте (#55)',
      body: 'Активируй 4 вулканических кристалла строго в римском порядке:',
      code: 'III  →  I  →  IV  →  II',
      accentColor: '#f97316',
    }
  );

  // Hidden Illusion Wall on East Volcano wall -> Eternity Relic #1 (#99)
  addBox(19.5, 2.5, 54, 0.8, 5, 7, 0x44403c, { solid: false, opacity: 0.8 });
  addBox(23.5, -1.5, 54, 7, 3, 9, 0x292524);
  addRelic('volcano', 23.5, 1.3, 54, 'Тайник Вулкана');

  // Shadow Altar hint (#75)
  addPlaque(
    'shadow_altar_clue',
    10,
    0,
    40,
    -0.3,
    'Теневой Алтарь',
    ['СВЕТ И ТЬМА:', 'Внутри Вулкана:', 'Графика 1→5→1→5→1'],
    {
      title: 'Теневой Алтарь Вулкана (#75)',
      body: 'Стоя в Вулканической Пещере, заставь тени мигать: переключи Графику в Настройках 1 → 5 → 1 → 5 → 1!',
      code: '1 → 5 → 1 → 5 → 1',
      accentColor: '#ef4444',
    }
  );

  addTorch('volcano', -15, 0, 66, 'Вулкан');
  addElementalAltar('fire', 14, 0, 66, 'Огонь', 0xef4444, 1);

  // =========================================================================
  // ZONE 6: НЕБЕСНЫЙ ОББИ И ОБСЕРВАТОРИЯ (SKY) — y = 24
  // =========================================================================
  // Green Bounce Pad on NE Plaza (16, 0.15, -10) (#23)
  addBox(16, 0.18, -10, 3.2, 0.36, 3.2, 0x22c55e, {
    emissive: 0x16a34a,
    emissiveIntensity: 0.75,
    bounce: 21.5,
    colliderId: 'bounce_main',
  });
  triggers.push({ id: 'bounce_pad', minX: 14.2, maxX: 17.8, minY: -0.2, maxY: 1.5, minZ: -11.8, maxZ: -8.2 });

  // Colorful Roblox Sky Obby platforms ascending smoothly to Observatory (y=24)
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
  const obbyColors = [0x38bdf8, 0x818cf8, 0xc084fc, 0xf472b6, 0xfb7185, 0xfb923c, 0xfacc15, 0x4ade80];
  obbyPlatforms.forEach(([px, py, pz, pw, ph, pd], idx) => {
    addBox(px, py, pz, pw, ph, pd, obbyColors[idx % obbyColors.length], {
      emissive: obbyColors[idx % obbyColors.length],
      emissiveIntensity: 0.18,
    });
  });

  // Main Sky Observatory Island centered at (18, 24, -34) (22 x 22, top y = 24.5)
  addBox(18, 23.5, -34, 22, 2, 22, 0xe0f2fe);
  addBox(18, 21.8, -34, 18, 1.5, 18, 0x93c5fd, { solid: false });

  // Diving Board for Leap of Faith (#77) extending toward Spawn Fountain (0, 0, 0)!
  addBox(9.5, 24.4, -22.5, 3.2, 0.5, 5.5, 0x38bdf8);
  addBox(6.5, 24.4, -17.5, 3.2, 0.5, 6.5, 0x0ea5e9);
  addBox(3.5, 24.4, -11.5, 3.0, 0.5, 6.5, 0xfacc15, { emissive: 0xeab308, emissiveIntensity: 0.35 });

  // Observatory Upper Deck (y = 28.5) with steps + Telescope (#84, #89)
  addBox(18, 26.2, -39, 9, 4, 8, 0x1e3a8a);
  // Stairs up to upper deck
  addBox(12.2, 25.4, -38, 2.6, 0.5, 2.4, 0x60a5fa);
  addBox(12.2, 26.8, -40.5, 2.6, 0.5, 2.4, 0x60a5fa);
  addBox(14.5, 28.0, -40.5, 2.6, 0.5, 2.4, 0x60a5fa);
  triggers.push({ id: 'observatory_peak', minX: 13.5, maxX: 22.5, minY: 27.8, maxY: 32, minZ: -43, maxZ: -35 });

  // Telescope on Observatory Peak (#89)
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
  scene.add(telescope);
  interactables.push({
    id: 'telescope',
    position: new THREE.Vector3(18, 29.2, -40),
    radius: 2.8,
    prompt: '[E] Посмотреть в Телескоп (Нужен First Person)',
    requireFirstPerson: true,
    inspect: {
      title: 'Окуляр Телескопа — Созвездие',
      subtitle: 'Пять ярчайших звёзд образуют слово (#89)',
      body: 'Ты видишь 5 сияющих звёзд с выгравированными буквами. Введи /слово в чат!',
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
  scene.add(morseLamp);
  addBox(25, 25.3, -32, 1.0, 2.0, 1.0, 0x334155);
  animatedObjects.push({ mesh: morseLamp, kind: 'morse', baseY: 26.8, speed: 1, phase: 0 });
  addPlaque(
    'morse_note',
    25,
    24.5,
    -29.5,
    Math.PI,
    'Сигнал Морзе',
    ['MORSE BEACON:', '... - .- .-.', 'Введи /слово'],
    {
      title: 'Маяк Азбуки Морзе (#49)',
      body: 'Расшифруй 4 буквы Морзе и введи /слово в чат!\n... = S | - = T | .- = A | .-. = R',
      code: '...  -  .-  .-.',
      accentColor: '#f97316',
    }
  );

  // Ancient Oracle Statue on Sky Island (#68)
  addBox(12, 26.2, -34, 2.2, 3.4, 2.2, 0xc084fc, { emissive: 0x7e22ce, emissiveIntensity: 0.35 });
  addPlaque(
    'oracle_plaque',
    12,
    24.5,
    -31.2,
    0,
    'Древний Оракул',
    ['CAESAR (+5):', 'XJHWJY ZSNAJWXJ', 'Скажи мне ответ'],
    {
      title: 'Загадка Древнего Оракула (#68)',
      subtitle: 'Шифр Цезаря (+5) — произнеси ответ рядом со статуей!',
      body: 'Сдвинь каждую букву на 5 позиций НАЗАД по английскому алфавиту и напиши фразу из двух слов в чат, стоя на Небесном Острове!',
      code: 'XJHWJY ZSNAJWXJ',
      accentColor: '#ef4444',
    }
  );

  // ShiftLock Gauntlet Beam extending East from Sky Island (#54)
  addBox(36, 24.3, -34, 15, 0.5, 1.1, 0xf97316);
  const slOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.0 })
  );
  slOrb.position.set(43, 25.8, -34);
  scene.add(slOrb);
  animatedObjects.push({ mesh: slOrb, kind: 'bob', baseY: 25.8, speed: 3, phase: 0 });
  triggers.push({ id: 'shiftlock_gauntlet_end', minX: 41.2, maxX: 44.8, minY: 24, maxY: 28, minZ: -35.8, maxZ: -32.2 });

  // Sky Glitch Cube (#88) — Bounce pad on Observatory peak -> invisible platform visible ONLY at Graphics=1 + Max Zoom Out!
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
  scene.add(skyGlitchCube);
  skyGlitchObjects.push(skyGlitchPlat.mesh, skyGlitchCube);
  animatedObjects.push({ mesh: skyGlitchCube, kind: 'spin', baseY: 36.1, speed: 3, phase: 0 });
  interactables.push({
    id: 'sky_glitch_cube',
    position: new THREE.Vector3(21.2, 36.1, -33.5),
    radius: 3.0,
    prompt: '[E] Забрать Небесный Глитч-Куб',
    requireGraphics: 1,
    requireMaxZoomOut: true,
    onInteractKey: 'sky_glitch_cube',
    mesh: skyGlitchCube,
  });

  // Distant Sky Relic Isle West of Sky Island -> Eternity Relic #3 (#99)
  addBox(4, 24.2, -34, 3.5, 0.7, 3.5, 0xf8fafc);
  addBox(-2, 24.4, -34, 3.5, 0.7, 3.5, 0xf8fafc);
  addBox(-9, 24.4, -34, 6.5, 1.2, 6.5, 0xe0f2fe);
  addRelic('sky', -9, 26.2, -34, 'Небесное Облако');

  // Cosmos Elemental Altar (#81)
  addElementalAltar('cosmos', 24, 24.5, -26, 'Космос', 0x818cf8, 4);

  // =========================================================================
  // ZONE 7: ОСТРОВ БЕЗДНЫ / GLITCH VOID (VOID) — center (-105, 6, -70)
  // =========================================================================
  addBox(-105, 5.0, -70, 26, 2, 26, 0x09090d, { roughness: 0.4, metalness: 0.4 });
  addBox(-105, 6.03, -70, 24, 0.06, 24, 0x1e1b4b, { solid: false });

  // Return Portal back to Spawn Plaza
  const returnPortal = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.22, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 })
  );
  returnPortal.position.set(-105, 8.0, -59);
  scene.add(returnPortal);
  animatedObjects.push({ mesh: returnPortal, kind: 'spin', baseY: 8.0, speed: 1.5, phase: 2 });
  interactables.push({
    id: 'portal_to_plaza',
    position: new THREE.Vector3(-105, 8.0, -59),
    radius: 2.8,
    prompt: '[E] Вернуться на Площадь Спавна',
    onInteractKey: 'portal:to_plaza',
    mesh: returnPortal,
  });

  // Triple Perspective Rune Circle in center of Void Island (#67)
  const tripleRing = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.7, 32),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  tripleRing.rotation.x = -Math.PI / 2;
  tripleRing.position.set(-105, 6.1, -70);
  scene.add(tripleRing);
  triggers.push({ id: 'triple_circle', minX: -108, maxX: -102, minY: 5.5, maxY: 9, minZ: -73, maxZ: -67 });

  // A1Z26 Tablet (#64)
  addPlaque(
    'a1z26_tablet',
    -98,
    6,
    -64,
    -0.6,
    'Табличка Бездны',
    ['A=1 ... Z=26', '22 - 15 - 9 - 4', 'Введи /слово здесь'],
    {
      title: 'Числовой Алфавит Бездны (#64)',
      body: 'Замени числа буквами английского алфавита (A=1..Z=26) и введи /слово, стоя на Острове Бездны!',
      code: '22 - 15 - 9 - 4',
      accentColor: '#f97316',
    }
  );

  // Omega Protocol Terminal (#82)
  addPlaque(
    'omega_term',
    -112,
    6,
    -64,
    0.6,
    'Протокол Омега',
    ['OMEGA MATRIX:', 'G=3 FOV=90 Sens=1.0', 'Mus=0 Coords+SL=ON'],
    {
      title: 'Протокол Омега (#82)',
      subtitle: 'Выстави все 6 параметров одновременно и введи /omega!',
      body:
        '• Графика: 3 (Средняя)\n• FOV: 90°\n• Чувствительность мыши: 1.00\n• Громкость музыки: 0%\n• Показать координаты: ВКЛ\n• ShiftLock: ВКЛ (нажми Shift)\n\nЗатем введи команду /omega в чат!',
      code: '/omega',
      accentColor: '#a855f7',
    }
  );

  // Mirror of Truth (#91) at (-115, 6, -70)
  addBox(-115.5, 8.2, -70, 0.5, 4.4, 4.2, 0x334155);
  const mirrorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.8),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.95, roughness: 0.05, emissive: 0x38bdf8, emissiveIntensity: 0.25 })
  );
  mirrorGlass.position.set(-115.2, 8.2, -70);
  mirrorGlass.rotation.y = Math.PI / 2;
  scene.add(mirrorGlass);
  triggers.push({ id: 'void_mirror', minX: -115.5, maxX: -111, minY: 5.5, maxY: 10, minZ: -73, maxZ: -67 });

  // Void Keyhole (#92 Fragment #2: 2-3-5)
  addBox(-113, 7.6, -78, 3.2, 3.2, 3.2, 0x1e293b);
  const voidKeyhole = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 12),
    new THREE.MeshBasicMaterial({ color: 0xa855f7 })
  );
  voidKeyhole.position.set(-113, 7.5, -76.38);
  scene.add(voidKeyhole);
  interactables.push({
    id: 'void_keyhole',
    position: new THREE.Vector3(-113, 7.5, -75.8),
    radius: 2.5,
    prompt: '[E] Замочная скважина Бездны (First Person)',
    requireFirstPerson: true,
    inspect: {
      title: 'Второй Фрагмент Графики (#92)',
      subtitle: 'Скрыто внутри куба Бездны',
      body: 'Средние 3 цифры 8-шаговой последовательности Графики:',
      code: 'FRAG #2: 2 - 3 - 5',
      accentColor: '#a855f7',
    },
    mesh: voidKeyhole,
  });

  // Quad Cipher Chamber (#93)
  addPlaque(
    'quad_cipher',
    -98,
    6,
    -77,
    -2.5,
    'Четырёхслойный Шифр',
    ['-.-- ..-. --.- -...', '1.Morse 2.Caesar(-1)', '3.Reverse → /quad'],
    {
      title: 'Четырёхслойный Шифр (#93 — Best)',
      subtitle: 'Тройная дешифровка + команда',
      body: 'Шаг 1: Переведи Морзе в 4 латинские буквы.\nШаг 2: Сдвинь каждую букву на 1 назад (Цезарь -1).\nШаг 3: Переверни полученное слово задом наперёд.\nШаг 4: Введи /quad <ответ> в чат!',
      code: '-.--  ..-.  --.-  -...',
      accentColor: '#f8fafc',
    },
    { bg: '#050508', fg: '#f8fafc', border: '#e2e8f0' }
  );

  // Invisible Sparkle Bridge extending North from Void Island (#69)
  // Solid invisible collider + faint sparkles visible ONLY at Graphics = 5!
  addBox(-105, 5.7, -94, 2.6, 0.5, 22, 0xffffff, { opacity: 0.01, shadow: false });
  for (let bz = -84; bz >= -104; bz -= 2.2) {
    const sp = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshBasicMaterial({ color: 0xe879f9 })
    );
    sp.position.set(-105 + Math.sin(bz) * 0.4, 6.2, bz);
    scene.add(sp);
    ultraOnlyObjects.push(sp);
    animatedObjects.push({ mesh: sp, kind: 'bob', baseY: 6.2, speed: 3.5, phase: bz });
  }
  addBox(-105, 5.5, -108, 6.5, 1.2, 6.5, 0x1e1b4b);
  const phantomSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.2 })
  );
  phantomSphere.position.set(-105, 7.4, -108);
  scene.add(phantomSphere);
  animatedObjects.push({ mesh: phantomSphere, kind: 'bob', baseY: 7.4, speed: 2.8, phase: 0 });
  interactables.push({
    id: 'phantom_sphere',
    position: new THREE.Vector3(-105, 7.4, -108),
    radius: 3.0,
    prompt: '[E] Коснуться Призрачной Сферы',
    onInteractKey: 'phantom_sphere',
    mesh: phantomSphere,
  });

  // THE BLACK OBBY (#95 — Best) ascending East from Void Island (-91.. -71, y: 7.5 .. 17.5)
  const blackObbySteps: Array<[number, number, number]> = [
    [-90.5, 7.2, -70],
    [-87.5, 8.6, -68],
    [-84.5, 10.0, -71],
    [-81.5, 11.4, -68.5],
    [-78.5, 12.8, -71.5],
    [-75.5, 14.2, -69],
    [-72.5, 15.6, -70],
  ];
  blackObbySteps.forEach(([bx, by, bz]) => {
    addBox(bx, by, bz, 1.85, 0.45, 1.85, 0x09090d, { emissive: 0xfacc15, emissiveIntensity: 0.16 });
  });
  addBox(-68, 16.5, -70, 5.2, 1.0, 5.2, 0x09090d, { emissive: 0x334155, emissiveIntensity: 0.25 });
  // Black Obelisk (#95)
  const obelisk = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 3.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x050508, emissive: 0xfacc15, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.1 })
  );
  obelisk.position.set(-68, 19.0, -70);
  scene.add(obelisk);
  animatedObjects.push({ mesh: obelisk, kind: 'spin', baseY: 19.0, speed: 0.8, phase: 0 });
  interactables.push({
    id: 'black_obelisk',
    position: new THREE.Vector3(-68, 18.2, -70),
    radius: 3.2,
    prompt: '[E] Активировать Чёрный Обелиск Абсолюта',
    onInteractKey: 'black_obelisk',
    mesh: obelisk,
  });

  // =========================================================================
  // DYNAMIC VISUALS & ZONE DETECTOR
  // =========================================================================
  const skyGlitchCollider = skyGlitchPlat.collider!;

  const updateDynamicVisuals = (time: number, graphics: number, isMaxZoomOut: boolean, secretCount: number) => {
    // Animate bobbing / spinning / pulsing / Morse beacon
    for (const item of animatedObjects) {
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
        // Real Morse loop for STAR: ... - .- .-.
        const seq = [1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
        const idx = Math.floor(time * 4) % seq.length;
        const on = seq[idx] === 1;
        const mat = (item.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = on ? 1.8 : 0.1;
      }
    }

    // Graphics=5 Ultra objects (Ultra Runes + Invisible Bridge Sparkles)
    const showUltra = graphics === 5;
    for (const o of ultraOnlyObjects) {
      o.visible = showUltra;
    }

    // Graphics=1 Potato Mode (Fog disappears, Phantom Cube appears)
    const isPotato = graphics === 1;
    for (const o of potatoFogObjects) {
      o.visible = !isPotato;
    }
    for (const o of potatoRevealObjects) {
      o.visible = isPotato;
    }

    // Sky Glitch Cube (#88) ONLY appears when Graphics = 1 AND Max Zoom Out!
    const showGlitch = graphics === 1 && isMaxZoomOut;
    skyGlitchCollider.active = showGlitch;
    for (const o of skyGlitchObjects) {
      o.visible = showGlitch;
    }

    // Final golden beam at 99+ secrets
    finalBeam.visible = secretCount >= 99;
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
    updateDynamicVisuals,
    getZoneAt,
  };
}
