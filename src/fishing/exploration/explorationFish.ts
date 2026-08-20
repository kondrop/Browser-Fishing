import { getRandomFish, type RarityBonuses } from '../../data/fish';
import { generateRandomSize } from '../../data/inventory';
import {
  AQUARIUM_SPEED_MUL_MIN,
  AQUARIUM_SPEED_MUL_RANGE,
} from '../../data/aquariumConfig';
import type { FightSimFishParams } from '../../fight/fightSimulation';
import { explorationConfig } from './explorationConfig';
import { beginSwimMode, getSwimBounds, pickFishSpreadPoint } from './explorationSwim';
import type {
  BiteKind,
  ExplorationFish,
  ExplorationHook,
  HookInputResult,
} from './explorationTypes';

function nextId(): string {
  return `exp-fish-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type FishShadowTier = 'sm' | 'md' | 'lg';

const JUNK_SHADOW_TIER: Record<string, FishShadowTier> = {
  junk_can: 'sm',
  junk_boot: 'md',
  junk_tire: 'lg',
};

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

export function getFishShadowTier(sizeCm: number, fishId?: string): FishShadowTier {
  const junkTier = fishId ? JUNK_SHADOW_TIER[fishId] : undefined;
  if (junkTier) return junkTier;
  if (sizeCm < explorationConfig.fishShadowSmMaxCm) return 'sm';
  if (sizeCm < explorationConfig.fishShadowMdMaxCm) return 'md';
  return 'lg';
}

export function getFishShadowScale(sizeCm: number, fishId?: string): number {
  const tier = getFishShadowTier(sizeCm, fishId);
  const [min, max] = explorationConfig.fishShadowScale[tier];
  if (fishId && JUNK_SHADOW_TIER[fishId]) return (min + max) / 2;
  const { fishShadowSmMaxCm: smMax, fishShadowMdMaxCm: mdMax, fishShadowLgRefCm: lgRef } =
    explorationConfig;
  let t = 0;
  if (tier === 'sm') t = clamp01(sizeCm / Math.max(1, smMax));
  else if (tier === 'md') t = clamp01((sizeCm - smMax) / Math.max(1, mdMax - smMax));
  else t = clamp01((sizeCm - mdMax) / Math.max(1, lgRef - mdMax));
  return min + (max - min) * t;
}

export function getExplorationSpriteSize(_maxSize: number, sizeCm: number, fishId?: string): number {
  const tier = getFishShadowTier(sizeCm, fishId);
  return explorationConfig.fishShadowBodyW[tier] * getFishShadowScale(sizeCm, fishId);
}

export function createExplorationFish(options: {
  rarityBonuses: RarityBonuses;
  junkWeightMultiplier: number;
  castDistanceRatio: number;
  spawn: 'inside' | 'left' | 'right';
  timeSec: number;
  avoid?: Array<{ x: number; y: number }>;
}): ExplorationFish {
  const fish = getRandomFish(options.rarityBonuses, {
    junkWeightMultiplier: options.junkWeightMultiplier,
  });
  const size = generateRandomSize(fish.maxSize, options.castDistanceRatio);
  const bounds = getSwimBounds();
  const spread = pickFishSpreadPoint(40, options.avoid);
  const homeY = spread.y;
  const entering = options.spawn !== 'inside';
  let x = spread.x;
  if (options.spawn === 'left') x = bounds.xMin - explorationConfig.respawnMargin * 0.6;
  if (options.spawn === 'right') x = bounds.xMax + explorationConfig.respawnMargin * 0.6;
  const y = spread.y;
  const runtime: ExplorationFish = {
    id: nextId(),
    fish,
    size,
    x,
    y,
    vx: options.spawn === 'left' ? explorationConfig.respawnSwimInSpeed : options.spawn === 'right' ? -explorationConfig.respawnSwimInSpeed : 0,
    vy: 0,
    targetX: x,
    targetY: y,
    facing: options.spawn === 'right' ? 'left' : 'right',
    pitch: 0,
    phase: Math.random() * Math.PI * 2,
    speedMul: AQUARIUM_SPEED_MUL_MIN + Math.random() * AQUARIUM_SPEED_MUL_RANGE,
    homeY,
    swimMode: 'cruise',
    swimUntil: 0,
    state: 'swimming',
    appeal: 0,
    appealThreshold:
      explorationConfig.defaultAppealThreshold +
      (Math.random() - 0.5) * 2 * explorationConfig.appealThresholdJitter,
    biteAttemptCount: 0,
    biteKind: null,
    biteAnim: 'hold',
    biteAnimT: 0,
    biteDelay: 0,
    biteAnchorX: x,
    biteAnchorY: y,
    alpha: 1,
    spriteSize: getExplorationSpriteSize(fish.maxSize, size, fish.id),
    entering,
  };
  beginSwimMode(runtime, 'cruise', options.timeSec);
  if (entering) {
    runtime.targetX = pickFishSpreadPoint(80).x;
    runtime.targetY = y;
  }
  return runtime;
}

export function createInitialFish(options: {
  rarityBonuses: RarityBonuses;
  junkWeightMultiplier: number;
  castDistanceRatio: number;
  timeSec: number;
}): ExplorationFish[] {
  const list: ExplorationFish[] = [];
  for (let i = 0; i < explorationConfig.initialFishCount; i++) {
    list.push(
      createExplorationFish({
        ...options,
        spawn: 'inside',
        avoid: list,
      }),
    );
  }
  return list;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getHookIntroDuration(): number {
  return explorationConfig.hookIntroDelaySec + explorationConfig.hookIntroDurationSec;
}

export function isHookIntroPlaying(hook: ExplorationHook): boolean {
  return hook.introElapsed < getHookIntroDuration();
}

export function isHookIntroDropping(hook: ExplorationHook): boolean {
  return (
    hook.introElapsed > explorationConfig.hookIntroDelaySec && isHookIntroPlaying(hook)
  );
}

export function endHookIntro(hook: ExplorationHook): void {
  if (!isHookIntroPlaying(hook)) return;
  hook.introElapsed = getHookIntroDuration();
  const bounds = getSwimBounds();
  hook.y = Math.max(bounds.yMin, Math.min(bounds.yMax, hook.y));
  hook.x = Math.max(bounds.xMin, Math.min(bounds.xMax, hook.x));
  hook.leadX = hook.x;
  hook.leadY = hook.y;
  hook.leadVx = 0;
  hook.leadVy = 0;
  hook.vx = 0;
  hook.vy = 0;
  hook.lineCurveX = hook.x;
}

export function createHook(): ExplorationHook {
  const bounds = getSwimBounds();
  const restY = bounds.yMin + explorationConfig.hookStartOffsetY;
  const skipIntro = prefersReducedMotion();
  const x = (bounds.xMin + bounds.xMax) / 2;
  const y = skipIntro ? restY : explorationConfig.hookIntroStartY;
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    leadX: x,
    leadY: y,
    leadVx: 0,
    leadVy: 0,
    lineCurveX: x,
    shakeT: 0,
    shakeDur: 0,
    shakeAmp: 0,
    shakeFreq: explorationConfig.hookHitShakeFreqFeint,
    shakeSustain: false,
    shakeDirX: 0,
    shakeDirY: 1,
    lineShakeX: 0,
    lineShakeY: 0,
    twitchT: 0,
    pullT: 0,
    tautT: 0,
    introElapsed: skipIntro ? getHookIntroDuration() : 0,
    restY,
    facing: 'right',
    pitch: 0,
  };
}

export function updateHookVisualPose(
  hook: ExplorationHook,
  dt: number,
  vx = hook.leadVx,
  vy = hook.leadVy,
): void {
  const thresh = explorationConfig.hookFaceVxThreshold;
  if (vx > thresh) hook.facing = 'right';
  else if (vx < -thresh) hook.facing = 'left';

  const maxSpd = Math.max(1, explorationConfig.hookMaxSpeed);
  const face = hook.facing === 'right' ? 1 : -1;
  const target = Math.max(
    -explorationConfig.hookPitchMax,
    Math.min(
      explorationConfig.hookPitchMax,
      (vx / maxSpd) * face * explorationConfig.hookPitchFromX +
        (vy / maxSpd) * explorationConfig.hookPitchFromY,
    ),
  );
  const t = 1 - Math.exp(-explorationConfig.hookPitchFollow * dt);
  hook.pitch += (target - hook.pitch) * t;
}

export function getHookDrawPos(hook: ExplorationHook): { x: number; y: number } {
  const twitch =
    hook.twitchT > 0
      ? Math.sin((1 - hook.twitchT / explorationConfig.appealMotionDuration) * Math.PI) *
        explorationConfig.appealMotionAmp
      : 0;
  const pull =
    hook.pullT > 0
      ? Math.sin((hook.pullT / explorationConfig.lineTautDuration) * Math.PI) *
        explorationConfig.hookPullAmp
      : 0;
  const shake = getHookShakeOffset(hook);
  return { x: hook.x + pull + shake.x, y: hook.y - twitch + shake.y };
}

export function getBiteStopDistance(fish: ExplorationFish, kind: BiteKind): number {
  const mouth = fish.spriteSize * explorationConfig.biteMouthOffsetMul;
  const gap =
    kind === 'real' ? explorationConfig.biteRealMouthGap : explorationConfig.biteFeintMouthGap;
  return mouth + gap + explorationConfig.hookRadius * 0.35;
}

export function getBiteStandbyDistance(fish: ExplorationFish): number {
  return getBiteStopDistance(fish, 'feint') + explorationConfig.biteStandbyExtra;
}

export function getHookShakeFalloff(hook: ExplorationHook): number {
  if (hook.shakeT <= 0 || hook.shakeDur <= 0 || hook.shakeAmp <= 0) return 0;
  if (hook.shakeSustain) {
    const fade = Math.min(explorationConfig.hookHitSustainFadeSec, hook.shakeDur);
    return hook.shakeT > fade ? 1 : hook.shakeT / Math.max(0.001, fade);
  }
  return Math.min(1, hook.shakeT / hook.shakeDur);
}

export function getHookShakeElapsed(hook: ExplorationHook): number {
  return Math.max(0, hook.shakeDur - hook.shakeT);
}

export function getHookShakeOffset(hook: ExplorationHook): { x: number; y: number } {
  const falloff = getHookShakeFalloff(hook);
  if (falloff <= 0) return { x: 0, y: 0 };
  const elapsed = getHookShakeElapsed(hook);
  const freq = hook.shakeFreq;
  let wobble = Math.sin(elapsed * freq) * hook.shakeAmp * falloff;
  let side = Math.cos(elapsed * freq * 1.55) * hook.shakeAmp * falloff * 0.38;
  if (hook.shakeSustain) {
    wobble += Math.sin(elapsed * freq * 2.15) * hook.shakeAmp * 0.45 * falloff;
    side += Math.cos(elapsed * freq * 1.8 + 0.7) * hook.shakeAmp * 0.28 * falloff;
  }
  return {
    x: hook.shakeDirX * wobble + -hook.shakeDirY * side,
    y: hook.shakeDirY * wobble + hook.shakeDirX * side,
  };
}

export function isHookInSenseRange(fish: ExplorationFish, hookX: number, hookY: number): boolean {
  const facingSign = fish.facing === 'right' ? 1 : -1;
  const dx = hookX - fish.x;
  const dy = hookY - fish.y;
  const forward = dx * facingSign;
  if (forward < -explorationConfig.senseBackTolerance) return false;
  if (forward > explorationConfig.senseForward) return false;
  if (Math.abs(dy) > explorationConfig.senseHalfHeight) return false;
  return true;
}

export function decideBite(attempt: number): BiteKind {
  const rates = explorationConfig.biteRealRates;
  const index = Math.min(Math.max(attempt, 1), rates.length) - 1;
  const realRate = rates[index] ?? 1;
  return Math.random() < realRate ? 'real' : 'feint';
}

export function randomBiteDelay(): number {
  const { minBiteInterval, maxBiteInterval } = explorationConfig;
  return minBiteInterval + Math.random() * (maxBiteInterval - minBiteInterval);
}

export function getHookDepthRatio(hookY: number): number {
  const bounds = getSwimBounds();
  const span = Math.max(1, bounds.yMax - bounds.yMin);
  return Math.min(1, Math.max(0, (hookY - bounds.yMin) / span));
}

export function applyHookDepthToFightParams(
  params: FightSimFishParams,
  hookDepthRatio: number,
): FightSimFishParams {
  const t = Math.min(1, Math.max(0, hookDepthRatio));
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    ...params,
    catchRate: params.catchRate * lerp(explorationConfig.shallowCatchRateMul, explorationConfig.deepCatchRateMul),
    escapeRate: params.escapeRate * lerp(explorationConfig.shallowEscapeRateMul, explorationConfig.deepEscapeRateMul),
    fishSpeed: params.fishSpeed * lerp(explorationConfig.shallowFishSpeedMul, explorationConfig.deepFishSpeedMul),
  };
}

/**
 * フッキング入力の判定。将来の早合わせ無効スキルは canIgnoreFalseHook で拡張する。
 */
export function evaluateHookInput(options: {
  fish: ExplorationFish | null;
  canIgnoreFalseHook?: boolean;
}): HookInputResult {
  const fish = options.fish;
  if (!fish) return 'noop';
  if (fish.state === 'hookWindow') return 'success';
  const inFeint =
    fish.state === 'bite' &&
    fish.biteKind === 'feint' &&
    fish.biteAnim !== 'hold';
  if (inFeint) {
    if (options.canIgnoreFalseHook) return 'noop';
    return 'fail';
  }
  return 'noop';
}
