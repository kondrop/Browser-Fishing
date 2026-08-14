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
  { level: 1, name: '稚魚', requiredFeeds: 0,  spriteScale: 0.45 },
  { level: 2, name: '幼魚', requiredFeeds: 5,  spriteScale: 0.47 },
  { level: 3, name: '若魚', requiredFeeds: 15, spriteScale: 0.50 },
  { level: 4, name: '成魚', requiredFeeds: 35, spriteScale: 0.53 },
  { level: 5, name: 'ヌシ', requiredFeeds: 65, spriteScale: 0.57 },
];

/** 成長Lvごとの売価ボーナス（Lv1=0%、Lv2=+50% … Lv5=+200%） */
export const AQUARIUM_LEVEL_SELL_PRICE_BONUS_PER_LEVEL = 0.5;

/** 通常エサの満腹時間（ms） */
export const AQUARIUM_SATIETY_DURATION_MS = 90_000;

/** 餌投下クールダウン（ms） */
export const AQUARIUM_FEED_COOLDOWN_MS = 1_500;

/** アクアリウムエサの段階 */
export type AquariumFoodTier = 'normal' | 'premium';

export interface AquariumFoodTierConfig {
  tier: AquariumFoodTier;
  toolId: string;
  icon: string;
  /** 1回の摂食で加算する成長値 */
  feedGain: number;
  /** 満腹時間（ms） */
  satietyMs: number;
  pelletColor: string;
}

export const AQUARIUM_FOOD_TIERS: Record<AquariumFoodTier, AquariumFoodTierConfig> = {
  normal: {
    tier: 'normal',
    toolId: 'tool_fish_food',
    icon: '🥫',
    feedGain: 1,
    satietyMs: AQUARIUM_SATIETY_DURATION_MS,
    pelletColor: '#e8c97a',
  },
  premium: {
    tier: 'premium',
    toolId: 'tool_fish_food_premium',
    icon: '🍱',
    feedGain: 3,
    satietyMs: AQUARIUM_SATIETY_DURATION_MS,
    pelletColor: '#f0a060',
  },
};

export function getAquariumFoodTierByToolId(toolId: string): AquariumFoodTierConfig | undefined {
  return Object.values(AQUARIUM_FOOD_TIERS).find((t) => t.toolId === toolId);
}

/** レア度ごとの成長Lv1あたりボーナス基礎値（ステータス加算値） */
export const AQUARIUM_RARITY_BONUS_BASE: Record<Rarity, number> = {
  [Rarity.COMMON]: 0.004,
  [Rarity.UNCOMMON]: 0.006,
  [Rarity.RARE]: 0.010,
  [Rarity.EPIC]: 0.015,
  [Rarity.LEGENDARY]: 0.025,
};

/** BIG個体（size/maxSize が閾値以上）の水槽ステータス倍率 */
export const AQUARIUM_BIG_STAT_BONUS_MUL = 1.25;

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
  fish_golden_koi: 'technique',
  fish_arowana: 'speed',
};

// --- 水槽描画・遊泳 ---

export const AQUARIUM_CANVAS_W = 960;
export const AQUARIUM_CANVAS_H = 540;

/** 背景ゆらぎ：枠を残す内側余白（canvas px） */
export const AQUARIUM_BG_WARP_INSET_L = 18;
export const AQUARIUM_BG_WARP_INSET_R = 18;
export const AQUARIUM_BG_WARP_INSET_T = 18;
export const AQUARIUM_BG_WARP_INSET_B = 44;
/** ゆらぎ振幅（px）。inset より十分小さくして枠を巻き込まない */
export const AQUARIUM_BG_WARP_AMP = 3.0;
export const AQUARIUM_BG_WARP_SPEED = 1.25;
export const AQUARIUM_BG_WARP_Y_FREQ = 0.05;
export const AQUARIUM_BG_WARP_STEP = 2;

/** 気泡の出現地点（前景の背後・左右の水草付近＋中央） */
export const AQUARIUM_BUBBLE_SPAWNS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 110, y: 468 },
  { x: 168, y: 492 },
  { x: 210, y: 478 },
  { x: 430, y: 486 },
  { x: 480, y: 500 },
  { x: 530, y: 482 },
  { x: 760, y: 480 },
  { x: 820, y: 494 },
  { x: 875, y: 470 },
];
/** 全地点合計の秒あたり出現期待数 */
export const AQUARIUM_BUBBLE_SPAWN_PER_SEC = 3.2;
export const AQUARIUM_BUBBLE_MAX = 48;
export const AQUARIUM_BUBBLE_RADIUS_MIN = 1.2;
export const AQUARIUM_BUBBLE_RADIUS_MAX = 4.2;
export const AQUARIUM_BUBBLE_RISE_MIN = 26;
export const AQUARIUM_BUBBLE_RISE_MAX = 58;
export const AQUARIUM_BUBBLE_SWAY_AMP_MIN = 5;
export const AQUARIUM_BUBBLE_SWAY_AMP_MAX = 14;
export const AQUARIUM_BUBBLE_SWAY_FREQ_MIN = 1.6;
export const AQUARIUM_BUBBLE_SWAY_FREQ_MAX = 3.2;
/** 水面付近で消える Y */
export const AQUARIUM_BUBBLE_DESPAWN_Y = 36;
/** 表示開始時に途中高度へ事前配置する気泡数 */
export const AQUARIUM_BUBBLE_SEED_COUNT = 18;
/** 魚投入時にその場へ出す単発気泡の数 */
export const AQUARIUM_INTRO_BUBBLE_COUNT = 14;
/** 投入気泡の散布半径（px） */
export const AQUARIUM_INTRO_BUBBLE_SPREAD = 36;
/** 投入気泡の上昇速度倍率（通常より少し速く） */
export const AQUARIUM_INTRO_BUBBLE_RISE_MUL = 1.35;

/** ゴッドレイ（斜め光柱） */
export const AQUARIUM_GODRAY_MAX = 5;
/** 秒あたり出現期待数 */
export const AQUARIUM_GODRAY_SPAWN_PER_SEC = 0.85;
export const AQUARIUM_GODRAY_SEED_COUNT = 3;
export const AQUARIUM_GODRAY_LIFE_MIN = 5;
export const AQUARIUM_GODRAY_LIFE_MAX = 11;
/** 根本の Y（クリップ上端より上に置き、根元が見切れる） */
export const AQUARIUM_GODRAY_TOP_Y = -48;
/** 出現・移動の基準 X（画面中央から 10% 右寄り） */
export const AQUARIUM_GODRAY_X_CENTER = AQUARIUM_CANVAS_W * 0.6;
/** 中心付近への出現ばらつき（±px） */
export const AQUARIUM_GODRAY_SPAWN_SPREAD = 90;
/** 左右端からの余白（ここより手前で止める） */
export const AQUARIUM_GODRAY_EDGE_INSET = 130;
/** 中心から端方向へ進む割合（0〜1） */
export const AQUARIUM_GODRAY_TRAVEL_FRAC_MIN = 0.55;
export const AQUARIUM_GODRAY_TRAVEL_FRAC_MAX = 0.88;
/** 鉛直下向きからの固定角（ラジアン）。左斜め 30° */
export const AQUARIUM_GODRAY_ANGLE = -Math.PI / 6;
/** 根元〜先端で共通の半幅（px） */
export const AQUARIUM_GODRAY_HALF_W_MIN = 14;
export const AQUARIUM_GODRAY_HALF_W_MAX = 42;
/** 先端が画面下端外まで届く長さ */
export const AQUARIUM_GODRAY_LENGTH_MIN = 780;
export const AQUARIUM_GODRAY_LENGTH_MAX = 1180;
/** ピーク時の不透明度（screen 合成前提） */
export const AQUARIUM_GODRAY_MAX_ALPHA = 0.24;
/** フェードイン / フェードアウトが寿命に占める割合 */
export const AQUARIUM_GODRAY_FADE_IN_FRAC = 0.18;
export const AQUARIUM_GODRAY_FADE_OUT_FRAC = 0.35;

/**
 * 素材が右向きに描かれている魚（既定は左向き）。
 * public/images/fish/ 全39種（ゴミ除く）を目視確認した結果、明確な右向きはなし。
 * イカ（上向き）・クラゲ（下向き）・タコ（正面向き）は左向き扱い。
 */
export const AQUARIUM_RIGHT_FACING_FISH: Set<string> = new Set([]);

/** 基準スプライトサイズ（px）。成魚の中型が水槽高の約1/2になるよう調整 */
export const AQUARIUM_FISH_BASE_SIZE = 300;

/** 種の最大サイズ(cm)→描画係数。差を抑えつつ種差は残す（10cm級=0.9、120cm級以上=1.15） */
export function getAquariumSpeciesScale(maxSizeCm: number): number {
  const t = Math.min(1, Math.max(0, (maxSizeCm - 10) / 110));
  return 0.9 + t * 0.25;
}

/**
 * 個体サイズ比率(size/maxSize)→描画係数。
 * 釣果は概ね 0.25〜1.0。同種でも差が分かるよう 0.82〜1.18 にマップ。
 */
export function getAquariumIndividualScale(sizeRatio: number): number {
  const t = Math.min(1, Math.max(0, (sizeRatio - 0.25) / 0.75));
  return 0.82 + t * 0.36;
}

export const AQUARIUM_FACING_VX_THRESHOLD = 5;
export const AQUARIUM_PITCH_MAX = 0.5;
export const AQUARIUM_PITCH_STOP_SPEED = 8;
export const AQUARIUM_PITCH_LERP = 6;

export const AQUARIUM_SWIM_X_MIN = 50;
export const AQUARIUM_SWIM_X_MAX = 910;
export const AQUARIUM_SWIM_Y_MIN = 80;
export const AQUARIUM_SWIM_Y_MAX = 390;

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

export const AQUARIUM_SEEK_ACCEL = 260;
export const AQUARIUM_SEEK_MAX_SPEED = 190;
/** 落下エサへの先行秒数の上限（予測狙い） */
export const AQUARIUM_SEEK_LEAD_MAX_SEC = 0.55;
export const AQUARIUM_PELLET_FALL_SPEED = 55;

export const AQUARIUM_PELLET_RADIUS = 6;
export const AQUARIUM_EAT_BASE_RADIUS = 22;
export const AQUARIUM_EAT_SIZE_FACTOR = 0.18;
