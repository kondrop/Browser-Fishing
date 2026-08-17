import {
  AQUARIUM_BUBBLE_MAX,
  AQUARIUM_BUBBLE_RADIUS_MAX,
  AQUARIUM_BUBBLE_RADIUS_MIN,
  AQUARIUM_BUBBLE_RISE_MAX,
  AQUARIUM_BUBBLE_RISE_MIN,
  AQUARIUM_BUBBLE_SEED_COUNT,
  AQUARIUM_BUBBLE_SPAWN_PER_SEC,
  AQUARIUM_BUBBLE_SWAY_AMP_MAX,
  AQUARIUM_BUBBLE_SWAY_AMP_MIN,
  AQUARIUM_BUBBLE_SWAY_FREQ_MAX,
  AQUARIUM_BUBBLE_SWAY_FREQ_MIN,
  AQUARIUM_INTRO_BUBBLE_RISE_MUL,
  AQUARIUM_GODRAY_ANGLE,
  AQUARIUM_GODRAY_FADE_IN_FRAC,
  AQUARIUM_GODRAY_FADE_OUT_FRAC,
  AQUARIUM_GODRAY_HALF_W_MAX,
  AQUARIUM_GODRAY_HALF_W_MIN,
  AQUARIUM_GODRAY_LENGTH_MAX,
  AQUARIUM_GODRAY_LENGTH_MIN,
  AQUARIUM_GODRAY_LIFE_MAX,
  AQUARIUM_GODRAY_LIFE_MIN,
  AQUARIUM_GODRAY_MAX,
  AQUARIUM_GODRAY_MAX_ALPHA,
  AQUARIUM_GODRAY_SEED_COUNT,
  AQUARIUM_GODRAY_SPAWN_PER_SEC,
} from '../../data/aquariumConfig';
import {
  explorationConfig,
  getExplorationWorldSize,
  type ExplorationCamera,
} from './explorationConfig';

export type ExplorationBubble = {
  baseX: number;
  x: number;
  y: number;
  r: number;
  riseSpeed: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
};

export type ExplorationGodRay = {
  x: number;
  halfW: number;
  length: number;
  life: number;
  age: number;
  driftVx: number;
  maxAlpha: number;
};

type DecoFishLayer = 'bg' | 'far';
type DecoShadowTier = 'sm' | 'md' | 'lg';

export type ExplorationDecoFish = {
  layer: DecoFishLayer;
  x: number;
  y: number;
  vx: number;
  tier: DecoShadowTier;
  scale: number;
  phase: number;
};

export type ExplorationUnderwaterState = {
  bubbles: ExplorationBubble[];
  godRays: ExplorationGodRay[];
  decoFishes: ExplorationDecoFish[];
  hookBubbleAcc: number;
  hookIntroBurstDone: boolean;
};

export function createUnderwaterState(): ExplorationUnderwaterState {
  return {
    bubbles: [],
    godRays: [],
    decoFishes: [],
    hookBubbleAcc: 0,
    hookIntroBurstDone: false,
  };
}

function createBubble(camera: ExplorationCamera, yOverride?: number): ExplorationBubble {
  const { canvasW, canvasH } = explorationConfig;
  const baseX = camera.x - 40 + Math.random() * (canvasW + 80);
  const r =
    AQUARIUM_BUBBLE_RADIUS_MIN +
    Math.random() * (AQUARIUM_BUBBLE_RADIUS_MAX - AQUARIUM_BUBBLE_RADIUS_MIN);
  return {
    baseX,
    x: baseX,
    y: yOverride ?? camera.y + canvasH + 8 + Math.random() * 36,
    r,
    riseSpeed:
      AQUARIUM_BUBBLE_RISE_MIN +
      Math.random() * (AQUARIUM_BUBBLE_RISE_MAX - AQUARIUM_BUBBLE_RISE_MIN),
    swayAmp:
      AQUARIUM_BUBBLE_SWAY_AMP_MIN +
      Math.random() * (AQUARIUM_BUBBLE_SWAY_AMP_MAX - AQUARIUM_BUBBLE_SWAY_AMP_MIN),
    swayFreq:
      AQUARIUM_BUBBLE_SWAY_FREQ_MIN +
      Math.random() * (AQUARIUM_BUBBLE_SWAY_FREQ_MAX - AQUARIUM_BUBBLE_SWAY_FREQ_MIN),
    swayPhase: Math.random() * Math.PI * 2,
  };
}

function createBubbleAt(x: number, y: number, timeSec: number, riseMul = 1): ExplorationBubble {
  const bubble = createBubble({ x: 0, y: 0 }, y);
  const jitter = (Math.random() - 0.5) * 18;
  bubble.baseX = x + jitter;
  bubble.x = bubble.baseX + Math.sin(timeSec * bubble.swayFreq + bubble.swayPhase) * bubble.swayAmp;
  bubble.y = y + (Math.random() - 0.5) * 10;
  bubble.riseSpeed *= riseMul;
  bubble.r *= 0.85 + Math.random() * 0.4;
  return bubble;
}

export function spawnHookIntroBubbles(
  state: ExplorationUnderwaterState,
  x: number,
  y: number,
  dt: number,
  timeSec: number,
  dropping: boolean,
): void {
  if (!dropping) return;
  const maxBubbles = AQUARIUM_BUBBLE_MAX + 16;
  if (!state.hookIntroBurstDone) {
    state.hookIntroBurstDone = true;
    for (let i = 0; i < explorationConfig.hookIntroBurstCount; i++) {
      if (state.bubbles.length >= maxBubbles) break;
      state.bubbles.push(createBubbleAt(x, y, timeSec, AQUARIUM_INTRO_BUBBLE_RISE_MUL));
    }
  }
  state.hookBubbleAcc += explorationConfig.hookIntroBubblePerSec * dt;
  while (state.hookBubbleAcc >= 1) {
    state.hookBubbleAcc -= 1;
    if (state.bubbles.length >= maxBubbles) break;
    state.bubbles.push(createBubbleAt(x, y, timeSec, AQUARIUM_INTRO_BUBBLE_RISE_MUL));
  }
}

function createGodRay(camera: ExplorationCamera, ageOverride?: number): ExplorationGodRay {
  const { canvasW } = explorationConfig;
  const { worldW } = getExplorationWorldSize();
  const life =
    AQUARIUM_GODRAY_LIFE_MIN +
    Math.random() * (AQUARIUM_GODRAY_LIFE_MAX - AQUARIUM_GODRAY_LIFE_MIN);
  const halfW =
    AQUARIUM_GODRAY_HALF_W_MIN +
    Math.random() * (AQUARIUM_GODRAY_HALF_W_MAX - AQUARIUM_GODRAY_HALF_W_MIN);
  const length =
    AQUARIUM_GODRAY_LENGTH_MIN +
    Math.random() * (AQUARIUM_GODRAY_LENGTH_MAX - AQUARIUM_GODRAY_LENGTH_MIN);
  const startX = camera.x + canvasW * (0.2 + Math.random() * 0.6);
  const goRight = Math.random() < 0.5;
  const travel = (180 + Math.random() * 260) * (goRight ? 1 : -1);
  const targetX = Math.max(40, Math.min(worldW - 40, startX + travel));
  const driftVx = (targetX - startX) / life;
  const age = ageOverride ?? 0;
  return {
    x: startX + driftVx * age,
    halfW,
    length,
    life,
    age,
    driftVx,
    maxAlpha: AQUARIUM_GODRAY_MAX_ALPHA * (0.65 + Math.random() * 0.35),
  };
}

const DECO_SHADOW_TIERS: DecoShadowTier[] = ['sm', 'md', 'lg'];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function createDecoFish(layer: DecoFishLayer): ExplorationDecoFish {
  const { worldW, worldH } = getExplorationWorldSize();
  const cfg = explorationConfig.decoFish;
  const [scaleMin, scaleMax] = layer === 'bg' ? cfg.bgScale : cfg.farScale;
  const [spdMin, spdMax] = cfg.speed;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const speed = lerp(spdMin, spdMax, Math.random());
  const pad = cfg.yPadding;
  return {
    layer,
    x: Math.random() * worldW,
    y: pad + Math.random() * Math.max(8, worldH - pad * 2),
    vx: dir * speed,
    tier: DECO_SHADOW_TIERS[Math.floor(Math.random() * DECO_SHADOW_TIERS.length)] ?? 'sm',
    scale: lerp(scaleMin, scaleMax, Math.random()),
    phase: Math.random() * Math.PI * 2,
  };
}

export function seedUnderwater(
  state: ExplorationUnderwaterState,
  timeSec: number,
  camera: ExplorationCamera,
): void {
  state.bubbles = [];
  state.godRays = [];
  state.decoFishes = [];
  state.hookBubbleAcc = 0;
  state.hookIntroBurstDone = false;
  const { canvasH } = explorationConfig;
  for (let i = 0; i < AQUARIUM_BUBBLE_SEED_COUNT; i++) {
    const t = (i + Math.random()) / AQUARIUM_BUBBLE_SEED_COUNT;
    const y = camera.y + 24 + t * (canvasH - 32);
    const bubble = createBubble(camera, y);
    bubble.x = bubble.baseX + Math.sin(timeSec * bubble.swayFreq + bubble.swayPhase) * bubble.swayAmp;
    state.bubbles.push(bubble);
  }
  for (let i = 0; i < AQUARIUM_GODRAY_SEED_COUNT; i++) {
    const ray = createGodRay(camera);
    ray.age = ray.life * (0.15 + Math.random() * 0.45);
    state.godRays.push(ray);
  }
  const { bgCount, farCount } = explorationConfig.decoFish;
  for (let i = 0; i < bgCount; i++) state.decoFishes.push(createDecoFish('bg'));
  for (let i = 0; i < farCount; i++) state.decoFishes.push(createDecoFish('far'));
}

export function tickUnderwater(
  state: ExplorationUnderwaterState,
  dt: number,
  timeSec: number,
  camera: ExplorationCamera,
): void {
  const { canvasW } = explorationConfig;
  const { worldW } = getExplorationWorldSize();
  if (state.bubbles.length < AQUARIUM_BUBBLE_MAX && Math.random() < AQUARIUM_BUBBLE_SPAWN_PER_SEC * dt) {
    state.bubbles.push(createBubble(camera));
  }
  for (const b of state.bubbles) {
    b.y -= b.riseSpeed * dt;
    b.x = b.baseX + Math.sin(timeSec * b.swayFreq + b.swayPhase) * b.swayAmp;
  }
  const despawnY = Math.max(12, camera.y - 24);
  state.bubbles = state.bubbles.filter(
    (b) =>
      b.y + b.r > despawnY &&
      b.x > camera.x - 120 &&
      b.x < camera.x + canvasW + 120,
  );

  if (state.godRays.length < AQUARIUM_GODRAY_MAX && Math.random() < AQUARIUM_GODRAY_SPAWN_PER_SEC * dt) {
    state.godRays.push(createGodRay(camera));
  }
  for (const ray of state.godRays) {
    ray.age += dt;
    ray.x += ray.driftVx * dt;
  }
  state.godRays = state.godRays.filter((ray) => ray.age < ray.life);

  const wrapPad = 64;
  const xMin = -wrapPad;
  const xMax = worldW + wrapPad;
  const span = xMax - xMin;
  for (const fish of state.decoFishes) {
    fish.x += fish.vx * dt;
    if (fish.x > xMax) fish.x -= span;
    else if (fish.x < xMin) fish.x += span;
  }
}

function godRayAlpha(ray: ExplorationGodRay): number {
  const t = ray.age / ray.life;
  let fade = 1;
  if (t < AQUARIUM_GODRAY_FADE_IN_FRAC) fade = t / AQUARIUM_GODRAY_FADE_IN_FRAC;
  else if (t > 1 - AQUARIUM_GODRAY_FADE_OUT_FRAC) fade = (1 - t) / AQUARIUM_GODRAY_FADE_OUT_FRAC;
  const shimmer = 0.88 + 0.12 * Math.sin(ray.age * 2.4 + ray.x * 0.01);
  return ray.maxAlpha * fade * shimmer;
}

function drawGodRays(
  ctx: CanvasRenderingContext2D,
  rays: ExplorationGodRay[],
  camera: ExplorationCamera,
): void {
  if (rays.length === 0) return;
  const { canvasW, canvasH } = explorationConfig;
  const angle = AQUARIUM_GODRAY_ANGLE;
  const dirX = Math.sin(angle);
  const dirY = Math.cos(angle);
  const perpX = Math.cos(angle);
  const perpY = -Math.sin(angle);

  ctx.save();
  ctx.beginPath();
  ctx.rect(camera.x, camera.y, canvasW, canvasH);
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';

  for (const ray of rays) {
    const alpha = godRayAlpha(ray);
    if (alpha <= 0.004) continue;
    const ox = ray.x;
    const oy = -36;
    const far = ray.length;
    const hw = ray.halfW;
    const fx = ox + dirX * far;
    const fy = oy + dirY * far;
    const n0x = ox - perpX * hw;
    const n0y = oy - perpY * hw;
    const n1x = ox + perpX * hw;
    const n1y = oy + perpY * hw;
    const f0x = fx - perpX * hw;
    const f0y = fy - perpY * hw;
    const f1x = fx + perpX * hw;
    const f1y = fy + perpY * hw;
    const midX = ox + dirX * (far * 0.55);
    const midY = oy + dirY * (far * 0.55);

    ctx.beginPath();
    ctx.moveTo(n0x, n0y);
    ctx.lineTo(n1x, n1y);
    ctx.lineTo(f1x, f1y);
    ctx.lineTo(f0x, f0y);
    ctx.closePath();
    const grad = ctx.createLinearGradient(ox, oy, midX, midY);
    grad.addColorStop(0, `rgba(220, 240, 255, ${alpha})`);
    grad.addColorStop(0.35, `rgba(170, 215, 255, ${alpha * 0.55})`);
    grad.addColorStop(0.75, `rgba(140, 200, 245, ${alpha * 0.18})`);
    grad.addColorStop(1, 'rgba(120, 180, 230, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    const chw = hw * 0.3;
    ctx.beginPath();
    ctx.moveTo(ox - perpX * chw, oy - perpY * chw);
    ctx.lineTo(ox + perpX * chw, oy + perpY * chw);
    ctx.lineTo(fx + perpX * chw, fy + perpY * chw);
    ctx.lineTo(fx - perpX * chw, fy - perpY * chw);
    ctx.closePath();
    const coreGrad = ctx.createLinearGradient(ox, oy, midX, midY);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`);
    coreGrad.addColorStop(0.45, `rgba(230, 245, 255, ${alpha * 0.35})`);
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fill();
  }
  ctx.restore();
}

type FreshLayerId = keyof typeof explorationConfig.freshLayers;
type FreshLayerDef = (typeof explorationConfig.freshLayers)[FreshLayerId];

function freshLayerSrc(file: string): string {
  return `${explorationConfig.freshLayerDir}/${encodeURIComponent(file)}`;
}

function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

const freshLayerImages: Record<FreshLayerId, HTMLImageElement> = {
  bg: loadImage(freshLayerSrc(explorationConfig.freshLayers.bg.file)),
  far: loadImage(freshLayerSrc(explorationConfig.freshLayers.far.file)),
  mid: loadImage(freshLayerSrc(explorationConfig.freshLayers.mid.file)),
  fg: loadImage(freshLayerSrc(explorationConfig.freshLayers.fg.file)),
};

function isImageReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

const decoShadowImages: Record<DecoShadowTier, HTMLImageElement> = {
  sm: loadImage(explorationConfig.fishShadowPaths.sm),
  md: loadImage(explorationConfig.fishShadowPaths.md),
  lg: loadImage(explorationConfig.fishShadowPaths.lg),
};

function getLayerShift(camera: ExplorationCamera, layer: FreshLayerDef): { ox: number; oy: number } {
  const { worldH } = getExplorationWorldSize();
  const maxCamY = worldH - explorationConfig.canvasH;
  const t = maxCamY <= 0 ? 0 : Math.max(0, Math.min(1, (maxCamY - camera.y) / maxCamY));
  return {
    ox: camera.x * (1 - layer.parallaxX),
    oy: -t * layer.riseY,
  };
}

/** 縦横比固定・下揃え。横は parallaxX。底では揃い、上昇するほど riseY で上へ。 */
function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  camera: ExplorationCamera,
  layer: FreshLayerDef,
): void {
  if (!isImageReady(img)) return;
  const { canvasW } = explorationConfig;
  const { worldW, worldH } = getExplorationWorldSize();
  const maxCamX = worldW - canvasW;
  const destW = Math.max(worldW, canvasW + maxCamX * layer.parallaxX);
  const destH = destW * (img.naturalHeight / img.naturalWidth);
  const shift = getLayerShift(camera, layer);
  const y = worldH - destH + shift.oy;
  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, shift.ox, y, destW, destH);
  ctx.imageSmoothingEnabled = prevSmooth;
}

function drawDecoFishes(
  ctx: CanvasRenderingContext2D,
  fishes: ExplorationDecoFish[],
  camera: ExplorationCamera,
  layerId: DecoFishLayer,
  timeSec: number,
): void {
  const layer = explorationConfig.freshLayers[layerId];
  const shift = getLayerShift(camera, layer);
  const alpha = layerId === 'bg' ? explorationConfig.decoFish.bgAlpha : explorationConfig.decoFish.farAlpha;
  const native = explorationConfig.fishShadowNativeSize;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const fish of fishes) {
    if (fish.layer !== layerId) continue;
    const img = decoShadowImages[fish.tier];
    const size = native * fish.scale;
    const swayY = Math.sin(timeSec * 1.15 + fish.phase) * 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fish.x + shift.ox, fish.y + shift.oy + swayY);
    ctx.scale(fish.vx >= 0 ? -1 : 1, 1);
    if (isImageReady(img)) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = '#24304a';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.48, size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawWaterColumn(ctx: CanvasRenderingContext2D): void {
  const { worldW, worldH } = getExplorationWorldSize();
  const g = ctx.createLinearGradient(0, 0, 0, worldH);
  g.addColorStop(0, '#D8F4FF');
  g.addColorStop(0.16, '#8FDBF8');
  g.addColorStop(1, '#2D97E3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, worldW, worldH);
}

export function drawUnderwaterBackground(
  ctx: CanvasRenderingContext2D,
  state: ExplorationUnderwaterState,
  camera: ExplorationCamera,
  timeSec: number,
): void {
  drawWaterColumn(ctx);
  drawParallaxLayer(ctx, freshLayerImages.bg, camera, explorationConfig.freshLayers.bg);
  drawDecoFishes(ctx, state.decoFishes, camera, 'bg', timeSec);
  drawParallaxLayer(ctx, freshLayerImages.far, camera, explorationConfig.freshLayers.far);
  drawDecoFishes(ctx, state.decoFishes, camera, 'far', timeSec);
  drawParallaxLayer(ctx, freshLayerImages.mid, camera, explorationConfig.freshLayers.mid);
  drawGodRays(ctx, state.godRays, camera);
}

export function drawUnderwaterParallaxForeground(
  ctx: CanvasRenderingContext2D,
  camera: ExplorationCamera,
): void {
  drawParallaxLayer(ctx, freshLayerImages.fg, camera, explorationConfig.freshLayers.fg);
}

export function drawUnderwaterForeground(
  ctx: CanvasRenderingContext2D,
  state: ExplorationUnderwaterState,
): void {
  for (const b of state.bubbles) {
    const alpha = Math.min(0.75, 0.35 + b.r * 0.08);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(210, 235, 255, ${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.6, b.r * 0.28), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    ctx.fill();
  }
}
