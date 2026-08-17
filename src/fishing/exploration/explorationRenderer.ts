import { getItemImagePath } from '../../data/shopConfig';
import { drawWaterWarpPostEffect } from '../../render/waterWarp';
import { explorationConfig, type ExplorationCamera } from './explorationConfig';
import {
  getFishShadowScale,
  getFishShadowTier,
  getHookDrawPos,
  getHookShakeElapsed,
  getHookShakeFalloff,
  getHookShakeOffset,
  isHookInSenseRange,
  type FishShadowTier,
} from './explorationFish';
import type { ExplorationFish, ExplorationHook } from './explorationTypes';
import {
  drawUnderwaterBackground,
  drawUnderwaterForeground,
  drawUnderwaterParallaxForeground,
  type ExplorationUnderwaterState,
} from './explorationUnderwater';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export type ExplorationDrawContext = {
  shadowImages: Record<FishShadowTier, HTMLImageElement>;
  baitImage: HTMLImageElement | null;
  lureImage: HTMLImageElement | null;
};

export function loadFishShadowImages(): Record<FishShadowTier, HTMLImageElement> {
  const load = (src: string): HTMLImageElement => {
    const img = new Image();
    img.src = src;
    return img;
  };
  return {
    sm: load(explorationConfig.fishShadowPaths.sm),
    md: load(explorationConfig.fishShadowPaths.md),
    lg: load(explorationConfig.fishShadowPaths.lg),
  };
}

export function loadGearImage(itemId: string | null): HTMLImageElement | null {
  if (!itemId) return null;
  const path = getItemImagePath(itemId);
  if (!path) return null;
  const img = new Image();
  img.src = path;
  return img;
}

function drawFishSprite(
  ctx: CanvasRenderingContext2D,
  fish: ExplorationFish,
  img: HTMLImageElement | undefined,
  timeSec: number,
): void {
  const swayY =
    Math.sin(timeSec * 1.7 + fish.phase) * 2.5 +
    Math.sin(timeSec * 0.9 + fish.phase * 1.3) * 1.5;
  const flip = fish.facing === 'right';
  const breath =
    Math.sin(timeSec * 1.05 + fish.phase) * 0.7 +
    Math.sin(timeSec * 0.48 + fish.phase * 1.6) * 0.3;
  const pecking =
    fish.state === 'bite' &&
    fish.biteKind === 'feint' &&
    (fish.biteAnim === 'lunge' || fish.biteAnim === 'contact');
  const peckT =
    fish.biteAnim === 'contact'
      ? 1
      : Math.min(1, fish.biteAnimT / Math.max(0.001, explorationConfig.biteLungeDuration));
  const peckStretchX = pecking ? 1 + 0.05 * peckT : 1;
  const peckStretchY = pecking ? 1 - 0.04 * peckT : 1;
  const chewing = fish.state === 'hookWindow';
  const chew = chewing ? Math.sin(timeSec * 36 + fish.phase) : 0;
  const biteStretchX = chewing ? 1.05 + chew * 0.035 : 1;
  const biteStretchY = chewing ? 1.04 - chew * 0.03 : 1;
  const stretchX = (1 + breath * 0.045) * peckStretchX * biteStretchX;
  const stretchY = (1 - breath * 0.055) * peckStretchY * biteStretchY;
  const size = explorationConfig.fishShadowNativeSize * getFishShadowScale(fish.size);

  ctx.save();
  ctx.globalAlpha = fish.alpha;
  ctx.translate(fish.x, fish.y + swayY);
  ctx.rotate(flip ? -fish.pitch : fish.pitch);
  ctx.scale(flip ? -stretchX : stretchX, stretchY);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = 'rgba(36, 42, 58, 0.92)';
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.spriteSize * 0.48, fish.spriteSize * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function getSenseRect(fish: ExplorationFish): { x: number; y: number; w: number; h: number } {
  const facingSign = fish.facing === 'right' ? 1 : -1;
  const back = explorationConfig.senseBackTolerance;
  const forward = explorationConfig.senseForward;
  const halfH = explorationConfig.senseHalfHeight;
  const x0 = facingSign > 0 ? fish.x - back : fish.x - forward;
  return {
    x: x0,
    y: fish.y - halfH,
    w: forward + back,
    h: halfH * 2,
  };
}

function drawSenseAndAppealDebug(
  ctx: CanvasRenderingContext2D,
  fishes: ExplorationFish[],
  hook: ExplorationHook,
): void {
  const hookPos = getHookDrawPos(hook);
  ctx.save();
  ctx.imageSmoothingEnabled = true;

  for (const fish of fishes) {
    if (fish.alpha <= 0) continue;
    const inRange = isHookInSenseRange(fish, hookPos.x, hookPos.y);
    const rect = getSenseRect(fish);

    ctx.globalAlpha = fish.alpha * (inRange ? 0.28 : 0.14);
    ctx.fillStyle = inRange ? '#7cff9a' : '#7ecbff';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = fish.alpha * (inRange ? 0.95 : 0.7);
    ctx.strokeStyle = inRange ? '#b8ffd0' : '#c8ecff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    ctx.setLineDash([]);

    ctx.globalAlpha = fish.alpha;
    ctx.fillStyle = '#fff8c8';
    ctx.beginPath();
    ctx.arc(fish.x, fish.y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const ratio = fish.appealThreshold > 0 ? Math.min(1, fish.appeal / fish.appealThreshold) : 0;
    const barW = 52;
    const barH = 6;
    const barX = fish.x - barW / 2;
    const barY = fish.y - fish.spriteSize * 0.28 - 16;
    ctx.fillStyle = 'rgba(8, 18, 28, 0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#1b3348';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = inRange ? '#7dff8c' : '#ffd56a';
    ctx.fillRect(barX, barY, barW * ratio, barH);

    const label = `${Math.round(fish.appeal)}/${Math.round(fish.appealThreshold)}`;
    ctx.font = '11px "DotGothic16", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(8, 18, 28, 0.85)';
    ctx.fillStyle = '#fffef2';
    ctx.strokeText(label, fish.x, barY - 2);
    ctx.fillText(label, fish.x, barY - 2);
  }

  ctx.restore();
}

function drawLineAndHook(
  ctx: CanvasRenderingContext2D,
  hook: ExplorationHook,
  gear: ExplorationDrawContext,
  camera: ExplorationCamera,
): void {
  const pos = getHookDrawPos(hook);
  const taut = hook.tautT > 0;
  const surfaceY = camera.y - 16;
  const shake = getHookShakeOffset(hook);
  const elapsed = getHookShakeElapsed(hook);
  const lineFalloff = getHookShakeFalloff(hook);
  const lineWave =
    lineFalloff > 0
      ? Math.sin(elapsed * hook.shakeFreq * 0.82 + 0.9) * hook.shakeAmp * lineFalloff * (hook.shakeSustain ? 1.15 : 0.7)
      : 0;
  const leadX = (taut ? pos.x : hook.leadX) + shake.x * 0.28 + hook.lineShakeX * 0.35;
  const curveX =
    (taut ? pos.x : hook.lineCurveX) +
    shake.x * 0.75 +
    lineWave +
    hook.lineShakeX;
  const curveYOff = shake.y * 0.55 + hook.lineShakeY + lineWave * 0.25;
  const slack = taut ? 4 : 0;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = taut ? 'rgba(255, 252, 240, 0.95)' : 'rgba(210, 230, 245, 0.78)';
  ctx.lineWidth = taut ? 2.4 : 1.5;
  ctx.beginPath();
  ctx.moveTo(leadX, surfaceY);
  ctx.bezierCurveTo(
    leadX + slack,
    lerp(surfaceY, pos.y, 0.32) + curveYOff * 0.4,
    curveX,
    lerp(surfaceY, pos.y, 0.68) + curveYOff,
    pos.x,
    pos.y - 8,
  );
  ctx.stroke();

  const gearImg =
    (gear.lureImage && gear.lureImage.complete && gear.lureImage.naturalWidth > 0
      ? gear.lureImage
      : null) ??
    (gear.baitImage && gear.baitImage.complete && gear.baitImage.naturalWidth > 0
      ? gear.baitImage
      : null);

  if (gearImg) {
    const s = 28;
    ctx.drawImage(gearImg, pos.x - s / 2, pos.y - s / 2, s, s);
  } else {
    ctx.fillStyle = '#d7b15a';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, explorationConfig.hookRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#c9c9c9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x + 5, pos.y + 6, 6, -0.4, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

let warpBuffer: HTMLCanvasElement | null = null;
let warpBufferCtx: CanvasRenderingContext2D | null = null;

function getWarpBuffer(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const { canvasW, canvasH } = explorationConfig;
  if (!warpBuffer || !warpBufferCtx) {
    warpBuffer = document.createElement('canvas');
    warpBufferCtx = warpBuffer.getContext('2d');
  }
  if (warpBuffer.width !== canvasW) warpBuffer.width = canvasW;
  if (warpBuffer.height !== canvasH) warpBuffer.height = canvasH;
  if (!warpBufferCtx) {
    throw new Error('Failed to create exploration warp buffer');
  }
  return { canvas: warpBuffer, ctx: warpBufferCtx };
}

export function drawExplorationFrame(args: {
  ctx: CanvasRenderingContext2D;
  underwater: ExplorationUnderwaterState;
  fishes: ExplorationFish[];
  hook: ExplorationHook;
  gear: ExplorationDrawContext;
  camera: ExplorationCamera;
  timeSec: number;
}): void {
  const { ctx, underwater, fishes, hook, gear, camera, timeSec } = args;
  const { canvas: buffer, ctx: scene } = getWarpBuffer();
  const { canvasW, canvasH } = explorationConfig;

  scene.imageSmoothingEnabled = false;
  scene.clearRect(0, 0, canvasW, canvasH);

  scene.save();
  scene.translate(-camera.x, -camera.y);
  drawUnderwaterBackground(scene, underwater, camera, timeSec);

  const sorted = [...fishes].sort((a, b) => a.y - b.y);
  for (const fish of sorted) {
    drawFishSprite(scene, fish, gear.shadowImages[getFishShadowTier(fish.size)], timeSec);
  }

  drawLineAndHook(scene, hook, gear, camera);
  drawUnderwaterForeground(scene, underwater);
  drawUnderwaterParallaxForeground(scene, camera);
  if (explorationConfig.debugShowSenseAndAppeal) {
    drawSenseAndAppealDebug(scene, fishes, hook);
  }
  scene.restore();

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasW, canvasH);
  drawWaterWarpPostEffect(ctx, buffer, timeSec, {
    width: canvasW,
    height: canvasH,
  });
}
