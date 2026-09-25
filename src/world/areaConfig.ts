import { Habitat } from '../data/fishTypes';

export const AREA_IDS = ['freshwater', 'saltwater', 'stream'] as const;
export type AreaId = (typeof AREA_IDS)[number];

export type WaterShape =
  | { type: 'ellipse'; x: number; y: number; width: number; height: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number };

export type WorldRect = { x: number; y: number; width: number; height: number };

export type AreaExit = {
  to: AreaId;
  side: 'left' | 'right';
  zone: WorldRect;
  arriveAt: { x: number; y: number };
};

export type AreaSign = {
  x: number;
  y: number;
  label: string;
};

export type AreaConfig = {
  id: AreaId;
  name: string;
  habitat: Habitat;
  mapWidth: number;
  mapHeight: number;
  spawn: { x: number; y: number };
  waterAreas: WaterShape[];
  walkableOverWater: WorldRect[];
  exits: AreaExit[];
  signs: AreaSign[];
  bulletinBoard?: WorldRect;
};

export const DEFAULT_AREA_ID: AreaId = 'freshwater';

export const PLACEHOLDER_MAP = {
  width: 1200,
  height: 900,
} as const;

const PATH_Y = 450;
const PATH_H = 72;
const PATH_TOP = PATH_Y - PATH_H / 2;
const LEFT_ZONE: WorldRect = { x: 0, y: PATH_TOP, width: 88, height: PATH_H };
const RIGHT_ZONE: WorldRect = { x: 1112, y: PATH_TOP, width: 88, height: PATH_H };
const LEFT_ARRIVE = { x: 118, y: PATH_Y };
const RIGHT_ARRIVE = { x: 1082, y: PATH_Y };

const SHARED_WATER: WaterShape[] = [
  { type: 'ellipse', x: 600, y: 200, width: 850, height: 300 },
  { type: 'ellipse', x: 150, y: 700, width: 220, height: 170 },
  { type: 'rect', x: 1060, y: 150, width: 80, height: 500 },
];

/** 右の川を横断する仮の橋。水域判定は残し、歩行だけ許可する */
const SHARED_BRIDGE: WorldRect[] = [{ x: 1036, y: PATH_TOP, width: 164, height: PATH_H }];

const SHARED_LAYOUT = {
  mapWidth: PLACEHOLDER_MAP.width,
  mapHeight: PLACEHOLDER_MAP.height,
  spawn: { x: 600, y: 500 },
  waterAreas: SHARED_WATER,
  walkableOverWater: SHARED_BRIDGE,
} as const;

export const areaConfigs: Record<AreaId, AreaConfig> = {
  freshwater: {
    ...SHARED_LAYOUT,
    id: 'freshwater',
    name: '淡水',
    habitat: Habitat.FRESHWATER,
    exits: [
      { to: 'saltwater', side: 'left', zone: LEFT_ZONE, arriveAt: RIGHT_ARRIVE },
      { to: 'stream', side: 'right', zone: RIGHT_ZONE, arriveAt: LEFT_ARRIVE },
    ],
    signs: [
      { x: 58, y: PATH_TOP - 28, label: '← 海水' },
      { x: 1136, y: PATH_TOP - 28, label: '渓流 →' },
    ],
    bulletinBoard: { x: 750, y: 480, width: 70, height: 60 },
  },
  saltwater: {
    ...SHARED_LAYOUT,
    id: 'saltwater',
    name: '海水',
    habitat: Habitat.SALTWATER,
    exits: [{ to: 'freshwater', side: 'right', zone: RIGHT_ZONE, arriveAt: LEFT_ARRIVE }],
    signs: [{ x: 1136, y: PATH_TOP - 28, label: '淡水 →' }],
  },
  stream: {
    ...SHARED_LAYOUT,
    id: 'stream',
    name: '渓流',
    habitat: Habitat.STREAM,
    exits: [{ to: 'freshwater', side: 'left', zone: LEFT_ZONE, arriveAt: RIGHT_ARRIVE }],
    signs: [{ x: 58, y: PATH_TOP - 28, label: '← 淡水' }],
  },
};

export function isAreaId(value: unknown): value is AreaId {
  return value === 'freshwater' || value === 'saltwater' || value === 'stream';
}

export function getAreaConfig(id: AreaId): AreaConfig {
  return areaConfigs[id];
}

export function parseAreaId(value: unknown): AreaId {
  return isAreaId(value) ? value : DEFAULT_AREA_ID;
}

export function rectContains(rect: WorldRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function isWalkableOverWater(area: AreaConfig, x: number, y: number): boolean {
  return area.walkableOverWater.some((rect) => rectContains(rect, x, y));
}

export function isPointInWater(area: AreaConfig, x: number, y: number): boolean {
  for (const water of area.waterAreas) {
    if (water.type === 'ellipse') {
      const dx = (x - water.x) / (water.width / 2);
      const dy = (y - water.y) / (water.height / 2);
      if (dx * dx + dy * dy <= 1) return true;
    } else if (
      x >= water.x &&
      x <= water.x + water.width &&
      y >= water.y &&
      y <= water.y + water.height
    ) {
      return true;
    }
  }
  return false;
}

export function findAreaExit(area: AreaConfig, x: number, y: number): AreaExit | undefined {
  return area.exits.find((exit) => rectContains(exit.zone, x, y));
}

export function resolveAreaSpawn(
  area: AreaConfig,
  savedX: number | undefined,
  savedY: number | undefined,
): { x: number; y: number } {
  if (typeof savedX !== 'number' || typeof savedY !== 'number' || !Number.isFinite(savedX) || !Number.isFinite(savedY)) {
    return { ...area.spawn };
  }
  const x = PhaserMathClamp(savedX, 16, area.mapWidth - 16);
  const y = PhaserMathClamp(savedY, 16, area.mapHeight - 16);
  if (isPointInWater(area, x, y) && !isWalkableOverWater(area, x, y)) {
    return { ...area.spawn };
  }
  return { x, y };
}

function PhaserMathClamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
