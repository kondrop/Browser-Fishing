import { AQUARIUM_SEEK_ACCEL } from '../../data/aquariumConfig';
import { explorationConfig } from './explorationConfig';
import {
  createExplorationFish,
  decideBite,
  getBiteStandbyDistance,
  getBiteStopDistance,
  getHookDrawPos,
  getHookShakeOffset,
  isHookInSenseRange,
  isHookIntroPlaying,
  endHookIntro,
  updateHookVisualPose,
  randomBiteDelay,
} from './explorationFish';
import { applyPitch, getSwimBounds, steerToward, stepSwimmingFish } from './explorationSwim';
import type { ExplorationFish, ExplorationHook, ExplorationStartOptions } from './explorationTypes';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getActiveBiteFish(fishes: ExplorationFish[]): ExplorationFish | undefined {
  return fishes.find((f) => f.state === 'bite' || f.state === 'hookWindow');
}

function enterBiteMode(fish: ExplorationFish, hook: ExplorationHook): void {
  fish.state = 'bite';
  fish.biteAttemptCount = 0;
  fish.biteKind = null;
  fish.biteAnim = 'hold';
  fish.biteAnimT = 0;
  fish.biteDelay = explorationConfig.biteFirstDelaySec;
  fish.facing = hook.x >= fish.x ? 'right' : 'left';
}

function startBiteAttempt(fish: ExplorationFish, hook: ExplorationHook): void {
  fish.biteAttemptCount += 1;
  fish.biteKind = decideBite(fish.biteAttemptCount);
  fish.biteAnim = 'windup';
  fish.biteAnimT = 0;
  fish.biteAnchorX = fish.x;
  fish.biteAnchorY = fish.y;
  fish.facing = hook.x >= fish.x ? 'right' : 'left';
}

function holdDistanceTarget(fish: ExplorationFish, hookX: number, hookY: number): { x: number; y: number } {
  const side = hookX >= fish.x ? 1 : -1;
  return {
    x: hookX - side * getBiteStandbyDistance(fish),
    y: hookY,
  };
}

function lungeTarget(fish: ExplorationFish, hookX: number, hookY: number, dist: number): { x: number; y: number } {
  const dx = hookX - fish.biteAnchorX;
  const dy = hookY - fish.biteAnchorY;
  const len = Math.hypot(dx, dy) || 1;
  const travel = Math.max(0, len - dist);
  return {
    x: fish.biteAnchorX + (dx / len) * travel,
    y: fish.biteAnchorY + (dy / len) * travel,
  };
}

function keepBiteSpacing(
  fish: ExplorationFish,
  hookX: number,
  hookY: number,
  dist: number,
): { x: number; y: number } {
  const dx = hookX - fish.x;
  const dy = hookY - fish.y;
  const len = Math.hypot(dx, dy);
  if (len < 8) {
    const facingSign = fish.facing === 'right' ? 1 : -1;
    return { x: hookX - facingSign * dist, y: hookY };
  }
  return {
    x: hookX - (dx / len) * dist,
    y: hookY - (dy / len) * dist,
  };
}

function stepBiteFollow(fish: ExplorationFish, hookX: number, hookY: number, dt: number): void {
  const target = holdDistanceTarget(fish, hookX, hookY);
  const dx = target.x - fish.x;
  const dy = target.y - fish.y;
  const follow = 1 - Math.exp(-explorationConfig.biteFollowLerp * dt);
  fish.x += dx * follow;
  fish.y += dy * follow;
  fish.vx = dx * follow / Math.max(dt, 0.001);
  fish.vy = dy * follow / Math.max(dt, 0.001);
  fish.facing = hookX >= fish.x ? 'right' : 'left';
  applyPitch(fish, dt);
}

function beginEscape(fish: ExplorationFish, hook: ExplorationHook): void {
  fish.state = 'escaping';
  const away = fish.x >= hook.x ? 1 : -1;
  const angle = away * (0.15 + Math.random() * 0.4);
  fish.vx = Math.cos(angle) * explorationConfig.escapeSpeed * away;
  fish.vy = Math.sin(angle) * explorationConfig.escapeSpeed * 0.35;
  fish.facing = fish.vx >= 0 ? 'right' : 'left';
  fish.biteKind = null;
  fish.biteAnim = 'hold';
}

export function failFish(fish: ExplorationFish, hook: ExplorationHook): void {
  beginEscape(fish, hook);
}

export function succeedHook(fish: ExplorationFish, hook: ExplorationHook): void {
  fish.state = 'hooked';
  hook.tautT = explorationConfig.lineTautDuration;
  hook.pullT = explorationConfig.lineTautDuration;
}

function enterHookWindow(fish: ExplorationFish, hook: ExplorationHook): void {
  fish.state = 'hookWindow';
  fish.biteAnim = 'contact';
  fish.biteAnimT = 0;
  hook.pullT = explorationConfig.lineTautDuration;
  hook.tautT = explorationConfig.hookWindowDuration;
}

function stepBiteFish(fish: ExplorationFish, hook: ExplorationHook, dt: number): void {
  const draw = getHookDrawPos(hook);

  if (fish.state === 'hookWindow') {
    const dest = keepBiteSpacing(fish, draw.x, draw.y, getBiteStopDistance(fish, 'real'));
    fish.x = lerp(fish.x, dest.x, Math.min(1, dt * 12));
    fish.y = lerp(fish.y, dest.y, Math.min(1, dt * 12));
    fish.vx = 0;
    fish.vy = 0;
    fish.biteAnimT += dt;
    if (fish.biteAnimT >= explorationConfig.hookWindowDuration) {
      beginEscape(fish, hook);
    }
    return;
  }

  if (fish.biteAnim === 'hold') {
    const dist = Math.hypot(draw.x - fish.x, draw.y - fish.y);
    const inHoldRange = dist <= getBiteStandbyDistance(fish) + 8;
    if (!inHoldRange) {
      const hold = holdDistanceTarget(fish, draw.x, draw.y);
      steerToward(
        fish,
        hold.x,
        hold.y,
        explorationConfig.biteApproachSpeed,
        AQUARIUM_SEEK_ACCEL,
        dt,
      );
    } else {
      stepBiteFollow(fish, draw.x, draw.y, dt);
    }
    fish.biteDelay -= dt;
    if (inHoldRange && fish.biteDelay <= 0) startBiteAttempt(fish, hook);
    return;
  }

  if (fish.biteAnim === 'windup') {
    fish.biteAnimT += dt;
    const t = Math.min(1, fish.biteAnimT / explorationConfig.biteWindupDuration);
    const pre = lungeTarget(
      fish,
      draw.x,
      draw.y,
      getBiteStandbyDistance(fish) * (fish.biteKind === 'real' ? 0.78 : 0.92),
    );
    fish.x = lerp(fish.biteAnchorX, pre.x, t);
    fish.y = lerp(fish.biteAnchorY, pre.y, t * 0.85);
    fish.facing = draw.x >= fish.x ? 'right' : 'left';
    if (t >= 1) {
      fish.biteAnim = 'lunge';
      fish.biteAnimT = 0;
      fish.biteAnchorX = fish.x;
      fish.biteAnchorY = fish.y;
    }
    return;
  }

  if (fish.biteAnim === 'lunge') {
    fish.biteAnimT += dt;
    const t = Math.min(1, fish.biteAnimT / explorationConfig.biteLungeDuration);
    const ease = fish.biteKind === 'real' ? t * t : easeOutCubic(t);
    const dist = getBiteStopDistance(fish, fish.biteKind === 'real' ? 'real' : 'feint');
    const dest = lungeTarget(fish, draw.x, draw.y, dist);
    fish.x = lerp(fish.biteAnchorX, dest.x, ease);
    fish.y = lerp(fish.biteAnchorY, dest.y, ease);
    if (t >= 1) {
      fish.biteAnim = 'contact';
      fish.biteAnimT = 0;
      applyHookHit(hook, fish, fish.biteKind === 'real' ? 'bite' : 'feint');
      if (fish.biteKind === 'real') enterHookWindow(fish, hook);
    }
    return;
  }

  if (fish.biteAnim === 'contact') {
    fish.biteAnimT += dt;
    if (fish.biteKind === 'feint' && fish.biteAnimT >= explorationConfig.biteFeintContactDuration) {
      fish.biteAnim = 'recover';
      fish.biteAnimT = 0;
      fish.biteAnchorX = fish.x;
      fish.biteAnchorY = fish.y;
    }
    return;
  }

  if (fish.biteAnim === 'recover') {
    fish.biteAnimT += dt;
    const t = Math.min(1, fish.biteAnimT / explorationConfig.biteRecoverDuration);
    const ease = easeOutCubic(t);
    const dest = holdDistanceTarget(fish, draw.x, draw.y);
    fish.x = lerp(fish.biteAnchorX, dest.x, ease);
    fish.y = lerp(fish.biteAnchorY, dest.y, ease);
    if (t >= 1) {
      fish.biteAnim = 'hold';
      fish.biteKind = null;
      fish.biteDelay = randomBiteDelay();
    }
  }
}

function stepEscaping(fish: ExplorationFish, dt: number): boolean {
  fish.x += fish.vx * dt;
  fish.y += fish.vy * dt;
  fish.alpha = Math.max(0, fish.alpha - dt / explorationConfig.escapeFadeDuration);
  applyPitch(fish, dt);
  return fish.alpha <= 0;
}

function refillFish(
  fishes: ExplorationFish[],
  options: ExplorationStartOptions,
  timeSec: number,
): void {
  while (fishes.length < explorationConfig.minFishCount) {
    const spawn: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    fishes.push(
      createExplorationFish({
        rarityBonuses: options.rarityBonuses,
        junkWeightMultiplier: options.junkWeightMultiplier,
        castDistanceRatio: options.castDistanceRatio,
        spawn,
        timeSec,
        avoid: fishes,
      }),
    );
  }
}

export function stepExplorationWorld(args: {
  fishes: ExplorationFish[];
  hook: ExplorationHook;
  dt: number;
  timeSec: number;
  options: ExplorationStartOptions;
}): void {
  const { fishes, hook, dt, timeSec, options } = args;
  const draw = getHookDrawPos(hook);
  const biting = getActiveBiteFish(fishes);

  for (const fish of fishes) {
    if (fish.state === 'escaping') continue;
    if (fish.state === 'hooked') continue;
    if (fish.state === 'bite' || fish.state === 'hookWindow') {
      stepBiteFish(fish, hook, dt);
      continue;
    }

    stepSwimmingFish(fish, dt, timeSec);

    if (isHookIntroPlaying(hook)) continue;

    if (biting && biting !== fish) {
      fish.appeal = Math.max(0, fish.appeal - explorationConfig.appealDecayPerSecond * dt);
      continue;
    }

    if (isHookInSenseRange(fish, draw.x, draw.y)) {
      fish.appeal += explorationConfig.baseAppealPerSecond * dt;
      if (fish.appeal >= fish.appealThreshold && !getActiveBiteFish(fishes)) {
        enterBiteMode(fish, hook);
      }
    } else {
      fish.appeal = Math.max(0, fish.appeal - explorationConfig.appealDecayPerSecond * dt);
    }
  }

  for (let i = fishes.length - 1; i >= 0; i--) {
    const fish = fishes[i];
    if (fish.state !== 'escaping') continue;
    if (stepEscaping(fish, dt)) fishes.splice(i, 1);
  }

  refillFish(fishes, options, timeSec);
}

export function applySpaceAppeal(fishes: ExplorationFish[], hook: ExplorationHook): void {
  hook.twitchT = explorationConfig.appealMotionDuration;
  const draw = getHookDrawPos(hook);
  for (const fish of fishes) {
    if (fish.state !== 'swimming') continue;
    if (!isHookInSenseRange(fish, draw.x, draw.y)) continue;
    fish.appeal += explorationConfig.spaceAppealBonus;
    if (fish.appeal >= fish.appealThreshold && !getActiveBiteFish(fishes)) {
      enterBiteMode(fish, hook);
    }
  }
}

function applyHookHit(
  hook: ExplorationHook,
  fish: ExplorationFish,
  kind: 'feint' | 'bite',
): void {
  const dx = hook.x - fish.x;
  const dy = hook.y - fish.y;
  const len = Math.hypot(dx, dy);
  let nx: number;
  let ny: number;
  if (len < 4) {
    nx = fish.facing === 'right' ? 1 : -1;
    ny = -0.2;
    const nlen = Math.hypot(nx, ny);
    nx /= nlen;
    ny /= nlen;
  } else {
    nx = dx / len;
    ny = dy / len;
  }
  const amp = kind === 'bite' ? explorationConfig.hookHitShakeAmpBite : explorationConfig.hookHitShakeAmpFeint;
  const impulse = kind === 'bite' ? explorationConfig.hookHitImpulseBite : explorationConfig.hookHitImpulseFeint;
  const nudge = kind === 'bite' ? explorationConfig.hookHitNudgeBite : explorationConfig.hookHitNudgeFeint;
  const kick = kind === 'bite' ? explorationConfig.lineHitKickBite : explorationConfig.lineHitKickFeint;

  hook.shakeDur = kind === 'bite' ? explorationConfig.hookWindowDuration : explorationConfig.hookHitShakeDurFeint;
  hook.shakeT = hook.shakeDur;
  hook.shakeAmp = Math.max(hook.shakeAmp * 0.25, amp);
  hook.shakeFreq = kind === 'bite' ? explorationConfig.hookHitShakeFreqBite : explorationConfig.hookHitShakeFreqFeint;
  hook.shakeSustain = kind === 'bite';
  hook.shakeDirX = nx;
  hook.shakeDirY = ny;
  hook.vx += nx * impulse;
  hook.vy += ny * impulse;
  hook.leadVx += nx * impulse * (kind === 'bite' ? 0.38 : 0.22);
  hook.leadVy += ny * impulse * (kind === 'bite' ? 0.24 : 0.12);
  hook.x += nx * nudge;
  hook.y += ny * nudge;
  hook.lineCurveX += nx * kick;
  hook.lineShakeX = nx * kick;
  hook.lineShakeY = ny * kick * 0.55;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5;
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(target, current + maxDelta);
  return Math.max(target, current - maxDelta);
}

function clampHookAxis(
  pos: number,
  vel: number,
  min: number,
  max: number,
): { pos: number; vel: number } {
  if (pos < min) return { pos: min, vel: Math.max(0, vel) };
  if (pos > max) return { pos: max, vel: Math.min(0, vel) };
  return { pos, vel };
}

function syncLineToHook(hook: ExplorationHook): void {
  hook.leadX = hook.x;
  hook.leadY = hook.y;
  hook.leadVx = 0;
  hook.leadVy = 0;
  hook.vx = 0;
  hook.vy = 0;
  hook.lineCurveX = hook.x;
  hook.shakeT = 0;
  hook.shakeDur = 0;
  hook.shakeAmp = 0;
  hook.shakeSustain = false;
  hook.lineShakeX = 0;
  hook.lineShakeY = 0;
}

export function tickHookIntro(hook: ExplorationHook, dt: number): void {
  if (!isHookIntroPlaying(hook)) return;
  hook.introElapsed += dt;
  const delay = explorationConfig.hookIntroDelaySec;
  const duration = explorationConfig.hookIntroDurationSec;
  if (hook.introElapsed <= delay) {
    hook.y = explorationConfig.hookIntroStartY;
    updateHookVisualPose(hook, dt, 0, 0);
    syncLineToHook(hook);
    return;
  }
  const t = Math.min(1, (hook.introElapsed - delay) / Math.max(0.001, duration));
  const prevY = hook.y;
  hook.y =
    explorationConfig.hookIntroStartY +
    (hook.restY - explorationConfig.hookIntroStartY) * easeOutQuint(t);
  updateHookVisualPose(hook, dt, 0, (hook.y - prevY) / Math.max(dt, 0.001));
  syncLineToHook(hook);
}

export function moveHook(
  hook: ExplorationHook,
  input: { left: boolean; right: boolean; up: boolean; down: boolean },
  dt: number,
): void {
  const hasSteer = input.left || input.right || input.up || input.down;
  if (isHookIntroPlaying(hook)) {
    if (!hasSteer) return;
    endHookIntro(hook);
  }

  let ix = 0;
  let iy = 0;
  if (input.left) ix -= 1;
  if (input.right) ix += 1;
  if (input.up) iy -= 1;
  if (input.down) iy += 1;
  if (ix !== 0 && iy !== 0) {
    const inv = 1 / Math.sqrt(2);
    ix *= inv;
    iy *= inv;
  }

  const hasInput = ix !== 0 || iy !== 0;
  const rate = hasInput ? explorationConfig.hookAccel : explorationConfig.hookCoastDecel;
  const maxSpeed = explorationConfig.hookMaxSpeed;
  hook.leadVx = approach(hook.leadVx, ix * maxSpeed, rate * dt);
  hook.leadVy = approach(hook.leadVy, iy * maxSpeed, rate * dt);
  hook.leadX += hook.leadVx * dt;
  hook.leadY += hook.leadVy * dt;

  const bounds = getSwimBounds();
  const clampedX = clampHookAxis(hook.leadX, hook.leadVx, bounds.xMin, bounds.xMax);
  const clampedY = clampHookAxis(hook.leadY, hook.leadVy, bounds.yMin, bounds.yMax);
  hook.leadX = clampedX.pos;
  hook.leadVx = clampedX.vel;
  hook.leadY = clampedY.pos;
  hook.leadVy = clampedY.vel;

  const spring = hook.tautT > 0 ? explorationConfig.hookFollowSpring * 3.2 : explorationConfig.hookFollowSpring;
  const damp = hook.tautT > 0 ? explorationConfig.hookFollowDamp * 1.6 : explorationConfig.hookFollowDamp;
  hook.vx += ((hook.leadX - hook.x) * spring - hook.vx * damp) * dt;
  hook.vy += ((hook.leadY - hook.y) * spring - hook.vy * damp) * dt;
  hook.x += hook.vx * dt;
  hook.y += hook.vy * dt;

  const hookX = clampHookAxis(hook.x, hook.vx, bounds.xMin, bounds.xMax);
  const hookY = clampHookAxis(hook.y, hook.vy, bounds.yMin, bounds.yMax);
  hook.x = hookX.pos;
  hook.vx = hookX.vel;
  hook.y = hookY.pos;
  hook.vy = hookY.vel;

  const midX = lerp(hook.leadX, hook.x, 0.52);
  const curveFollow = 1 - Math.exp(-explorationConfig.lineCurveFollow * dt);
  hook.lineCurveX += (midX - hook.lineCurveX) * curveFollow;
  updateHookVisualPose(hook, dt);
}

export function tickHookFx(hook: ExplorationHook, dt: number): void {
  if (hook.twitchT > 0) hook.twitchT = Math.max(0, hook.twitchT - dt);
  if (hook.pullT > 0) hook.pullT = Math.max(0, hook.pullT - dt);
  if (hook.tautT > 0) hook.tautT = Math.max(0, hook.tautT - dt);
  if (hook.shakeT > 0) hook.shakeT = Math.max(0, hook.shakeT - dt);
  if (hook.shakeT <= 0) {
    hook.shakeAmp = 0;
    hook.shakeSustain = false;
  }
  if (hook.shakeSustain && hook.shakeT > 0) {
    const shake = getHookShakeOffset(hook);
    hook.lineShakeX = shake.x * 1.25;
    hook.lineShakeY = shake.y * 0.8;
  } else {
    const lineDecay = 1 - Math.exp(-11 * dt);
    hook.lineShakeX += (0 - hook.lineShakeX) * lineDecay;
    hook.lineShakeY += (0 - hook.lineShakeY) * lineDecay;
  }
}

export function getBitingFish(fishes: ExplorationFish[]): ExplorationFish | null {
  return getActiveBiteFish(fishes) ?? null;
}
