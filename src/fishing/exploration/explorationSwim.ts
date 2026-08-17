import {
  AQUARIUM_ARRIVAL_MIN_SPEED_FRAC,
  AQUARIUM_ARRIVAL_REACH_DIST,
  AQUARIUM_ARRIVAL_SLOW_DIST,
  AQUARIUM_CRUISE_ACCEL,
  AQUARIUM_CRUISE_BASE_SPEED,
  AQUARIUM_CRUISE_DURATION_MAX,
  AQUARIUM_CRUISE_DURATION_MIN,
  AQUARIUM_CRUISE_TO_DASH_P,
  AQUARIUM_CRUISE_TO_IDLE_P,
  AQUARIUM_DASH_ACCEL,
  AQUARIUM_DASH_DURATION_MAX,
  AQUARIUM_DASH_DURATION_MIN,
  AQUARIUM_DASH_MAX_SPEED,
  AQUARIUM_DASH_RANGE_MAX,
  AQUARIUM_DASH_RANGE_MIN,
  AQUARIUM_FACING_VX_THRESHOLD,
  AQUARIUM_IDLE_DAMP,
  AQUARIUM_IDLE_DURATION_MAX,
  AQUARIUM_IDLE_DURATION_MIN,
  AQUARIUM_IDLE_TO_DASH_P,
  AQUARIUM_PITCH_LERP,
  AQUARIUM_PITCH_MAX,
  AQUARIUM_PITCH_STOP_SPEED,
} from '../../data/aquariumConfig';
import { explorationConfig, getExplorationWorldSize } from './explorationConfig';
import type { ExplorationFish, SwimMode } from './explorationTypes';

export function getSwimBounds() {
  const { worldW, worldH } = getExplorationWorldSize();
  return {
    xMin: 60,
    xMax: worldW - 60,
    yMin: 70,
    yMax: worldH - 50,
  };
}

function pickCruiseTarget(fish: ExplorationFish): void {
  const bounds = getSwimBounds();
  const randY = bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin);
  fish.targetX = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
  fish.targetY = (randY + fish.homeY) / 2;
}

function pickDashTarget(fish: ExplorationFish): void {
  const bounds = getSwimBounds();
  const range =
    AQUARIUM_DASH_RANGE_MIN + Math.random() * (AQUARIUM_DASH_RANGE_MAX - AQUARIUM_DASH_RANGE_MIN);
  const angle = Math.random() * Math.PI * 2;
  fish.targetX = Math.max(
    bounds.xMin,
    Math.min(bounds.xMax, fish.x + Math.cos(angle) * range),
  );
  fish.targetY = Math.max(
    bounds.yMin,
    Math.min(bounds.yMax, fish.y + Math.sin(angle) * range * 0.55),
  );
}

export function beginSwimMode(fish: ExplorationFish, mode: SwimMode, timeSec: number): void {
  fish.swimMode = mode;
  if (mode === 'cruise') {
    pickCruiseTarget(fish);
    fish.swimUntil =
      timeSec +
      AQUARIUM_CRUISE_DURATION_MIN +
      Math.random() * (AQUARIUM_CRUISE_DURATION_MAX - AQUARIUM_CRUISE_DURATION_MIN);
  } else if (mode === 'idle') {
    fish.swimUntil =
      timeSec +
      AQUARIUM_IDLE_DURATION_MIN +
      Math.random() * (AQUARIUM_IDLE_DURATION_MAX - AQUARIUM_IDLE_DURATION_MIN);
  } else {
    pickDashTarget(fish);
    fish.swimUntil =
      timeSec +
      AQUARIUM_DASH_DURATION_MIN +
      Math.random() * (AQUARIUM_DASH_DURATION_MAX - AQUARIUM_DASH_DURATION_MIN);
  }
}

function transitionFromCruise(fish: ExplorationFish, timeSec: number): void {
  const r = Math.random();
  if (r < AQUARIUM_CRUISE_TO_IDLE_P) beginSwimMode(fish, 'idle', timeSec);
  else if (r < AQUARIUM_CRUISE_TO_IDLE_P + AQUARIUM_CRUISE_TO_DASH_P) beginSwimMode(fish, 'dash', timeSec);
  else beginSwimMode(fish, 'cruise', timeSec);
}

function clampToSwimBounds(fish: ExplorationFish, allowOffscreen: boolean): void {
  const bounds = getSwimBounds();
  const margin = explorationConfig.respawnMargin;
  const xMin = allowOffscreen ? bounds.xMin - margin : bounds.xMin;
  const xMax = allowOffscreen ? bounds.xMax + margin : bounds.xMax;
  fish.x = Math.max(xMin, Math.min(xMax, fish.x));
  fish.y = Math.max(bounds.yMin, Math.min(bounds.yMax, fish.y));
}

export function stepSwimmingFish(fish: ExplorationFish, dt: number, timeSec: number): void {
  let accel = AQUARIUM_CRUISE_ACCEL;
  let maxSpeed = AQUARIUM_CRUISE_BASE_SPEED * fish.speedMul;

  if (timeSec >= fish.swimUntil) {
    if (fish.swimMode === 'cruise') transitionFromCruise(fish, timeSec);
    else if (fish.swimMode === 'idle') {
      if (Math.random() < AQUARIUM_IDLE_TO_DASH_P) beginSwimMode(fish, 'dash', timeSec);
      else beginSwimMode(fish, 'cruise', timeSec);
    } else {
      beginSwimMode(fish, 'cruise', timeSec);
    }
  }

  if (fish.swimMode === 'idle') {
    const damp = 1 - Math.min(1, dt * AQUARIUM_IDLE_DAMP);
    fish.vx *= damp;
    fish.vy *= damp;
    if (Math.random() < 0.002) fish.facing = fish.facing === 'right' ? 'left' : 'right';
  } else if (fish.swimMode === 'dash') {
    accel = AQUARIUM_DASH_ACCEL;
    maxSpeed = AQUARIUM_DASH_MAX_SPEED * fish.speedMul;
  } else {
    const distToTarget = Math.hypot(fish.targetX - fish.x, fish.targetY - fish.y);
    if (distToTarget < AQUARIUM_ARRIVAL_REACH_DIST) {
      transitionFromCruise(fish, timeSec);
    } else if (distToTarget < AQUARIUM_ARRIVAL_SLOW_DIST) {
      maxSpeed *= Math.max(AQUARIUM_ARRIVAL_MIN_SPEED_FRAC, distToTarget / AQUARIUM_ARRIVAL_SLOW_DIST);
    }
  }

  if (fish.swimMode !== 'idle') {
    const dx = fish.targetX - fish.x;
    const dy = fish.targetY - fish.y;
    const dist = Math.hypot(dx, dy) || 1;
    fish.vx += (dx / dist) * accel * dt;
    fish.vy += (dy / dist) * accel * dt;
    const speed = Math.hypot(fish.vx, fish.vy);
    if (speed > maxSpeed) {
      fish.vx = (fish.vx / speed) * maxSpeed;
      fish.vy = (fish.vy / speed) * maxSpeed;
    }
  }

  fish.x += fish.vx * dt;
  fish.y += fish.vy * dt;
  clampToSwimBounds(fish, fish.entering);

  if (fish.entering) {
    const bounds = getSwimBounds();
    if (fish.x >= bounds.xMin && fish.x <= bounds.xMax) {
      fish.entering = false;
    }
  }

  if (Math.abs(fish.vx) > AQUARIUM_FACING_VX_THRESHOLD) {
    fish.facing = fish.vx > 0 ? 'right' : 'left';
  }

  applyPitch(fish, dt);
}

export function applyPitch(fish: ExplorationFish, dt: number): void {
  const speedNow = Math.hypot(fish.vx, fish.vy);
  let targetPitch = 0;
  if (speedNow >= AQUARIUM_PITCH_STOP_SPEED) {
    targetPitch = Math.atan2(-fish.vy, Math.abs(fish.vx));
    targetPitch = Math.max(-AQUARIUM_PITCH_MAX, Math.min(AQUARIUM_PITCH_MAX, targetPitch));
  }
  fish.pitch += (targetPitch - fish.pitch) * Math.min(1, dt * AQUARIUM_PITCH_LERP);
}

export function steerToward(
  fish: ExplorationFish,
  targetX: number,
  targetY: number,
  maxSpeed: number,
  accel: number,
  dt: number,
): void {
  const dx = targetX - fish.x;
  const dy = targetY - fish.y;
  const dist = Math.hypot(dx, dy) || 1;
  const desiredVx = (dx / dist) * maxSpeed;
  const desiredVy = (dy / dist) * maxSpeed;
  const steer = Math.min(1, (accel / Math.max(1, maxSpeed)) * dt * 1.8);
  fish.vx += (desiredVx - fish.vx) * steer;
  fish.vy += (desiredVy - fish.vy) * steer;
  const speed = Math.hypot(fish.vx, fish.vy);
  if (speed > maxSpeed) {
    fish.vx = (fish.vx / speed) * maxSpeed;
    fish.vy = (fish.vy / speed) * maxSpeed;
  }
  fish.x += fish.vx * dt;
  fish.y += fish.vy * dt;
  if (Math.abs(fish.vx) > AQUARIUM_FACING_VX_THRESHOLD) {
    fish.facing = fish.vx > 0 ? 'right' : 'left';
  }
  applyPitch(fish, dt);
}
