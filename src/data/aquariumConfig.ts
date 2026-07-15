// 🐠 アクアリウム設定ファイル
import { Habitat, Rarity } from './fishTypes';

export const AQUARIUM_CAPACITY = 3;

/** 成長段階（feedCount のしきい値昇順） */
export interface AquariumGrowthStage {
  level: number;        // 1〜5
  name: string;         // 稚魚/幼魚/若魚/成魚/ヌシ
  requiredFeeds: number; // 累計feedCount
  spriteScale: number;  // 水槽内の表示倍率
}

export const AQUARIUM_GROWTH_STAGES: AquariumGrowthStage[] = [
  { level: 1, name: '稚魚', requiredFeeds: 0,  spriteScale: 0.55 },
  { level: 2, name: '幼魚', requiredFeeds: 5,  spriteScale: 0.70 },
  { level: 3, name: '若魚', requiredFeeds: 15, spriteScale: 0.85 },
  { level: 4, name: '成魚', requiredFeeds: 35, spriteScale: 1.00 },
  { level: 5, name: 'ヌシ', requiredFeeds: 65, spriteScale: 1.15 },
];

/** 満腹時間（ms） */
export const AQUARIUM_SATIETY_DURATION_MS = 90_000;

/** 餌投下クールダウン（ms） */
export const AQUARIUM_FEED_COOLDOWN_MS = 1_500;

/** レア度ごとの成長Lv1あたりボーナス基礎値（ステータス加算値） */
export const AQUARIUM_RARITY_BONUS_BASE: Record<Rarity, number> = {
  [Rarity.COMMON]: 0.004,
  [Rarity.UNCOMMON]: 0.006,
  [Rarity.RARE]: 0.010,
  [Rarity.EPIC]: 0.014,
  [Rarity.LEGENDARY]: 0.020,
};

export type AquariumStatKey = 'power' | 'speed' | 'technique' | 'control';

/** 生息地→対象ステータスのデフォルト */
export const AQUARIUM_HABITAT_STAT: Record<Habitat, AquariumStatKey> = {
  [Habitat.FRESHWATER]: 'power',
  [Habitat.SALTWATER]: 'speed',
  [Habitat.STREAM]: 'control',
};

/** 魚単位の例外（テクニック枠など） */
export const AQUARIUM_STAT_OVERRIDES: Record<string, AquariumStatKey> = {
  fish_goldfish: 'technique',
  fish_koi: 'technique',
  fish_jellyfish: 'technique',
  fish_seahorse: 'technique',
};

// --- 水槽描画・遊泳 ---

export const AQUARIUM_CANVAS_W = 960;
export const AQUARIUM_CANVAS_H = 540;

/**
 * 素材が右向きに描かれている魚（既定は左向き）。
 * public/images/fish/ 全39種（ゴミ除く）を目視確認した結果、明確な右向きはなし。
 * イカ（上向き）・クラゲ（下向き）・タコ（正面向き）は左向き扱い。
 */
export const AQUARIUM_RIGHT_FACING_FISH: Set<string> = new Set([]);

/** 基準スプライトサイズ（px）。成魚の中型が水槽高の約1/4になるよう調整 */
export const AQUARIUM_FISH_BASE_SIZE = 150;

/** 種の最大サイズ(cm)→描画係数。10cm級=0.7、120cm級以上=1.3 */
export function getAquariumSpeciesScale(maxSizeCm: number): number {
  const t = Math.min(1, Math.max(0, (maxSizeCm - 10) / 110));
  return 0.7 + t * 0.6;
}

export const AQUARIUM_FACING_VX_THRESHOLD = 5;
export const AQUARIUM_PITCH_MAX = 0.5;
export const AQUARIUM_PITCH_STOP_SPEED = 8;
export const AQUARIUM_PITCH_LERP = 6;

export const AQUARIUM_SWIM_X_MIN = 60;
export const AQUARIUM_SWIM_X_MAX = 900;
export const AQUARIUM_SWIM_Y_MIN = 80;
export const AQUARIUM_SWIM_Y_MAX = 470;

export const AQUARIUM_HOME_Y_MIN = 120;
export const AQUARIUM_HOME_Y_RANGE = 280;

export const AQUARIUM_SPEED_MUL_MIN = 0.85;
export const AQUARIUM_SPEED_MUL_RANGE = 0.3;

export const AQUARIUM_CRUISE_DURATION_MIN = 2;
export const AQUARIUM_CRUISE_DURATION_MAX = 5;
export const AQUARIUM_IDLE_DURATION_MIN = 1;
export const AQUARIUM_IDLE_DURATION_MAX = 4;
export const AQUARIUM_DASH_DURATION_MIN = 0.5;
export const AQUARIUM_DASH_DURATION_MAX = 0.9;

export const AQUARIUM_CRUISE_TO_IDLE_P = 0.4;
export const AQUARIUM_CRUISE_TO_DASH_P = 0.1;
/** 満腹中は idle に寄りやすい */
export const AQUARIUM_CRUISE_TO_IDLE_SATIATED_P = 0.7;
export const AQUARIUM_IDLE_TO_DASH_P = 0.2;

export const AQUARIUM_ARRIVAL_SLOW_DIST = 120;
export const AQUARIUM_ARRIVAL_MIN_SPEED_FRAC = 0.25;
export const AQUARIUM_ARRIVAL_REACH_DIST = 18;

export const AQUARIUM_CRUISE_ACCEL = 40;
export const AQUARIUM_CRUISE_BASE_SPEED = 60;
export const AQUARIUM_DASH_ACCEL = 240;
export const AQUARIUM_DASH_MAX_SPEED = 150;
export const AQUARIUM_DASH_RANGE_MIN = 200;
export const AQUARIUM_DASH_RANGE_MAX = 400;
export const AQUARIUM_IDLE_DAMP = 2;

export const AQUARIUM_SEEK_ACCEL = 120;
export const AQUARIUM_SEEK_MAX_SPEED = 110;

export const AQUARIUM_PELLET_RADIUS = 6;
export const AQUARIUM_EAT_BASE_RADIUS = 14;
export const AQUARIUM_EAT_SIZE_FACTOR = 0.15;
