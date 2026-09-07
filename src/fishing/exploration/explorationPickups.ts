import { explorationConfig, getExplorationViewSize, type ExplorationCamera } from './explorationConfig';
import { createHook, getHookDrawPos } from './explorationFish';
import { getSwimBounds } from './explorationSwim';
import type { ExplorationHook, ExplorationPickup, ExplorationPickupKind } from './explorationTypes';

type PickupKindConfig = (typeof explorationConfig.pickups)['exp'] | (typeof explorationConfig.pickups)['gold'];

let pickupSeq = 0;
const pickupImages: Partial<Record<ExplorationPickupKind, HTMLImageElement>> = {};

function getKindConfig(kind: ExplorationPickupKind): PickupKindConfig {
  return explorationConfig.pickups[kind];
}

export function loadPickupImages(): void {
  (['exp', 'gold'] as const).forEach((kind) => {
    if (pickupImages[kind]) return;
    const img = new Image();
    img.src = getKindConfig(kind).imagePath;
    pickupImages[kind] = img;
  });
}

function randRange(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function pickAmount(amounts: readonly number[]): number {
  return amounts[Math.floor(Math.random() * amounts.length)] ?? amounts[0] ?? 5;
}

function samplePickupPoint(
  avoid: Array<{ x: number; y: number }>,
  minSep: number,
  avoidHook: { x: number; y: number; dist: number },
): { x: number; y: number } {
  const bounds = getSwimBounds();
  const sample = () => ({
    x: randRange(bounds.xMin, bounds.xMax),
    y: randRange(bounds.yMin, bounds.yMax),
  });

  let best = sample();
  let bestScore = -Infinity;
  for (let i = 0; i < 14; i++) {
    const p = sample();
    const hookDist = Math.hypot(p.x - avoidHook.x, p.y - avoidHook.y);
    if (hookDist < avoidHook.dist) continue;
    let nearest = Infinity;
    for (const other of avoid) {
      nearest = Math.min(nearest, Math.hypot(p.x - other.x, p.y - other.y));
    }
    const score = Math.min(nearest, hookDist);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
    if (nearest >= minSep && hookDist >= avoidHook.dist) return p;
  }
  return best;
}

function spawnKind(
  kind: ExplorationPickupKind,
  avoid: Array<{ x: number; y: number }>,
  hookStart: { x: number; y: number },
): ExplorationPickup[] {
  const cfg = getKindConfig(kind);
  const list: ExplorationPickup[] = [];
  for (let i = 0; i < cfg.count; i++) {
    const p = samplePickupPoint(avoid, cfg.minSeparation, {
      x: hookStart.x,
      y: hookStart.y,
      dist: cfg.avoidHookStartDist,
    });
    avoid.push(p);
    pickupSeq += 1;
    list.push({
      id: `pickup-${kind}-${pickupSeq}`,
      kind,
      x: p.x,
      y: p.y,
      phase: Math.random() * Math.PI * 2,
      amount: pickAmount(cfg.amounts),
      radius: cfg.radius,
      collected: false,
      collectT: 0,
    });
  }
  return list;
}

export function createInitialPickups(): ExplorationPickup[] {
  loadPickupImages();
  const hook = createHook();
  const avoid: Array<{ x: number; y: number }> = [];
  const hookStart = { x: hook.x, y: hook.restY };
  return [
    ...spawnKind('exp', avoid, hookStart),
    ...spawnKind('gold', avoid, hookStart),
  ];
}

export function getPickupDrawPos(pickup: ExplorationPickup, timeSec: number): { x: number; y: number } {
  if (pickup.collected) return { x: pickup.x, y: pickup.y };
  const cfg = getKindConfig(pickup.kind);
  const bob =
    Math.sin(timeSec * cfg.bobFreq * Math.PI * 2 + pickup.phase) * cfg.bobAmp +
    Math.sin(timeSec * 0.7 + pickup.phase * 1.3) * (cfg.bobAmp * 0.35);
  return { x: pickup.x, y: pickup.y + bob };
}

export function tickPickups(pickups: ExplorationPickup[], dt: number): void {
  const animSec = explorationConfig.pickups.collectAnimSec;
  for (const p of pickups) {
    if (!p.collected) continue;
    p.collectT += dt;
    if (p.collectT > animSec) {
      p.collectT = animSec;
    }
  }
}

export function findCollectiblePickup(
  pickups: ExplorationPickup[],
  hook: ExplorationHook,
  timeSec: number,
): ExplorationPickup | null {
  const draw = getHookDrawPos(hook);
  const range = explorationConfig.pickups.collectRange;
  let best: ExplorationPickup | null = null;
  let bestDist: number = range;
  for (const p of pickups) {
    if (p.collected) continue;
    const pos = getPickupDrawPos(p, timeSec);
    const d = Math.hypot(pos.x - draw.x, pos.y - draw.y);
    if (d <= bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

export function markPickupCollected(pickup: ExplorationPickup): void {
  pickup.collected = true;
  pickup.collectT = 0;
}

export function pruneFinishedPickups(pickups: ExplorationPickup[]): ExplorationPickup[] {
  const animSec = explorationConfig.pickups.collectAnimSec;
  return pickups.filter((p) => !(p.collected && p.collectT >= animSec));
}

export function worldToExplorationScreen(
  worldX: number,
  worldY: number,
  camera: ExplorationCamera,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const { canvasW, canvasH } = getExplorationViewSize();
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.left + ((worldX - camera.x) / canvasW) * rect.width,
    y: rect.top + ((worldY - camera.y) / canvasH) * rect.height,
  };
}

export function drawPickups(
  ctx: CanvasRenderingContext2D,
  pickups: ExplorationPickup[],
  hook: ExplorationHook,
  timeSec: number,
): void {
  const hookPos = getHookDrawPos(hook);
  const range = explorationConfig.pickups.collectRange;
  const animSec = explorationConfig.pickups.collectAnimSec;

  for (const p of pickups) {
    const cfg = getKindConfig(p.kind);
    const img = pickupImages[p.kind];
    const pos = getPickupDrawPos(p, timeSec);
    const near = !p.collected && Math.hypot(pos.x - hookPos.x, pos.y - hookPos.y) <= range;
    let alpha = 1;
    let scale = 1;
    if (p.collected) {
      const t = Math.min(1, p.collectT / Math.max(0.001, animSec));
      alpha = 1 - t;
      scale = 1 + t * 0.85;
    }

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.globalAlpha = alpha;

    const size = cfg.drawSize * scale;

    if (!p.collected) {
      const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(timeSec * 3.2 + p.phase));
      const glowR = cfg.drawSize * (near ? 0.72 : 0.55) * pulse;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
      grad.addColorStop(0, `rgba(${cfg.glowRgb}, ${cfg.glowAlpha * (near ? 1.35 : 1)})`);
      grad.addColorStop(1, `rgba(${cfg.glowRgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    if (img && img.complete && img.naturalWidth > 0) {
      if (p.kind === 'gold') {
        // ゴールド.png は縦長キャンバス。コイン本体(約88x82)だけ切り出して歪みなく描く
        const sx = 3;
        const sy = 20;
        const sw = 88;
        const sh = 82;
        const fit = size / Math.max(sw, sh);
        const drawW = sw * fit;
        const drawH = sh * fit;
        ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const fit = size / Math.max(nw, nh);
        const drawW = nw * fit;
        const drawH = nh * fit;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    } else {
      ctx.fillStyle = cfg.fallbackFill;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    if (p.collected) {
      const t = Math.min(1, p.collectT / Math.max(0.001, animSec));
      ctx.globalAlpha = alpha;
      ctx.font = '42px "Jersey 10", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const label = p.kind === 'gold' ? `+${p.amount}G` : `+${p.amount}exp`;
      const labelY = -size * 0.55 - t * 18;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = 4; // 片側約2pxのフチ
      ctx.strokeStyle = '#3a2418';
      ctx.strokeText(label, 0, labelY);
      ctx.fillStyle = cfg.labelFill;
      ctx.fillText(label, 0, labelY);
    } else if (near) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = `rgba(${cfg.nearRingRgba})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, cfg.drawSize * 0.62 + Math.sin(timeSec * 8) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
