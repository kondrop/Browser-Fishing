// 🏪 ショップ設定ファイル

// ============================================
// 釣り竿の定義
// ============================================
export interface RodConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  // 効果（ステータスはすべて「基準値への加算」）
  powerStatAdd: number;      // 投擲距離に効くパワー加算
  speedStatAdd: number;      // 捕獲ゲージ上昇に効くスピード加算
  techniqueStatAdd: number;  // 判定帯の広さに効くテクニック加算
  controlStatAdd: number;    // 目標速度への追従速度（レスポンス）に効くコントロール加算
  // レアリティ別ヒット率加算（1.0に対する加算値。例: 0.06 => +6%）
  rarityHitRateAdd: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

export const rodConfigs: RodConfig[] = [
  {
    id: 'rod_basic',
    name: '木の釣り竿',
    description: '初心者用の基本的な釣り竿。',
    price: 0,  // 初期装備
    icon: '🎣',
    powerStatAdd: 0.0,
    speedStatAdd: 0.0,
    techniqueStatAdd: 0.0,
    controlStatAdd: 0.0,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.0, rare: 0.0, epic: 0.0, legendary: 0.0 },
  },
  {
    id: 'rod_bamboo',
    name: '竹の釣り竿',
    description: 'しなやかで扱いやすい釣り竿。',
    price: 500,
    icon: '🎋',
    powerStatAdd: 0.06,
    speedStatAdd: 0.06,
    techniqueStatAdd: 0.02,
    controlStatAdd: 0.07,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.05, rare: 0.05, epic: 0.02, legendary: 0.0 },
  },
  {
    id: 'rod_carbon',
    name: 'カーボンロッド',
    description: '軽くて丈夫な高性能釣り竿。',
    price: 2000,
    icon: '⚡',
    powerStatAdd: 0.12,
    speedStatAdd: 0.12,
    techniqueStatAdd: 0.03,
    controlStatAdd: 0.13,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.08, rare: 0.11, epic: 0.08, legendary: 0.05 },
  },
  {
    id: 'rod_master',
    name: '名人の釣り竿',
    description: '伝説の釣り師が使っていた釣り竿。',
    price: 8000,
    icon: '👑',
    powerStatAdd: 0.18,
    speedStatAdd: 0.18,
    techniqueStatAdd: 0.06,
    controlStatAdd: 0.2,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.12, rare: 0.19, epic: 0.15, legendary: 0.11 },
  },
  {
    id: 'rod_legendary',
    name: '達人の釣り竿',
    description: '釣りの達人だけが扱える究極の釣り竿。',
    price: 30000,
    icon: '🏆',
    powerStatAdd: 0.26,
    speedStatAdd: 0.26,
    techniqueStatAdd: 0.09,
    controlStatAdd: 0.28,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.16, rare: 0.26, epic: 0.22, legendary: 0.18 },
  },
];

// ============================================
// エサの定義（消費アイテム・効果高め・安価）
// ============================================
export interface BaitConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  quantity: number;            // 購入時の個数
  // 効果（どのレア度の出現率を上げるか）
  commonBonus: number;
  uncommonBonus: number;
  rareBonus: number;
  epicBonus: number;
  legendaryBonus: number;
}

export const baitConfigs: BaitConfig[] = [
  {
    id: 'bait_worm',
    name: 'ミミズ',
    description: '基本的なエサ。よく釣れる魚が増える。',
    price: 30,
    icon: '🪱',
    quantity: 20,
    commonBonus: 1.45,
    uncommonBonus: 1.2,
    rareBonus: 1.0,
    epicBonus: 1.0,
    legendaryBonus: 1.0,
  },
  {
    id: 'bait_shrimp',
    name: '小エビ',
    description: '中型魚に効果的。UNCOMMONが釣れやすい。',
    price: 80,
    icon: '🦐',
    quantity: 15,
    commonBonus: 1.0,
    uncommonBonus: 1.48,
    rareBonus: 1.3,
    epicBonus: 1.0,
    legendaryBonus: 1.0,
  },
  {
    id: 'bait_minnow',
    name: '小魚',
    description: '大型魚を狙える生きエサ。RARE以上が釣れやすい。',
    price: 200,
    icon: '🐟',
    quantity: 10,
    commonBonus: 1.0,
    uncommonBonus: 1.0,
    rareBonus: 1.55,
    epicBonus: 1.42,
    legendaryBonus: 1.28,
  },
  {
    id: 'bait_golden',
    name: '黄金虫',
    description: '伝説の魚も引き寄せる究極のエサ。',
    price: 500,
    icon: '✨',
    quantity: 5,
    commonBonus: 1.0,
    uncommonBonus: 1.0,
    rareBonus: 1.6,
    epicBonus: 1.85,
    legendaryBonus: 2.4,
  },
];

// ============================================
// ルアーの定義（非消費・効果控えめ・高価）
// ============================================
export interface LureConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  // 効果（どのレア度の出現率を上げるか）
  commonBonus: number;
  uncommonBonus: number;
  rareBonus: number;
  epicBonus: number;
  legendaryBonus: number;
}

export const lureConfigs: LureConfig[] = [
  {
    id: 'lure_basic',
    name: 'スプーン',
    description: '基本的なルアー。少しだけレアが出やすい。',
    price: 800,
    icon: '🥄',
    commonBonus: 1.0,
    uncommonBonus: 1.2,
    rareBonus: 1.28,
    epicBonus: 1.18,
    legendaryBonus: 1.0,
  },
  {
    id: 'lure_minnow',
    name: 'ミノー',
    description: '小魚を模したルアー。中〜大型魚に効果的。',
    price: 3000,
    icon: '🎣',
    commonBonus: 1.0,
    uncommonBonus: 1.25,
    rareBonus: 1.4,
    epicBonus: 1.34,
    legendaryBonus: 1.24,
  },
  {
    id: 'lure_popper',
    name: 'ポッパー',
    description: '水面で音を立てて魚を誘うトップウォータールアー。',
    price: 5000,
    icon: '💦',
    commonBonus: 1.0,
    uncommonBonus: 1.3,
    rareBonus: 1.5,
    epicBonus: 1.42,
    legendaryBonus: 1.32,
  },
  {
    id: 'lure_legendary',
    name: 'スピナー',
    description: '回転するブレードで光を反射。全体的に効果UP。',
    price: 10000,
    icon: '💎',
    commonBonus: 1.0,
    uncommonBonus: 1.38,
    rareBonus: 1.62,
    epicBonus: 1.5,
    legendaryBonus: 1.42,
  },
];

// ============================================
// インベントリ拡張の定義
// ============================================
export interface InventoryUpgradeConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  slotCount: number;           // 拡張後のスロット数
}

export const inventoryUpgradeConfigs: InventoryUpgradeConfig[] = [
  {
    id: 'inv_9',
    name: '基本バッグ',
    description: '9スロットの基本的なバッグ。',
    price: 0,  // 初期装備
    icon: '🎒',
    slotCount: 9,
  },
  {
    id: 'inv_12',
    name: '中型バッグ',
    description: '12スロットのしっかりしたバッグ。',
    price: 1000,
    icon: '👜',
    slotCount: 12,
  },
  {
    id: 'inv_15',
    name: '大型バッグ',
    description: '15スロットの大容量バッグ。',
    price: 3000,
    icon: '🧳',
    slotCount: 15,
  },
  {
    id: 'inv_18',
    name: '釣り師のリュック',
    description: '18スロットのプロ仕様。',
    price: 8000,
    icon: '🎽',
    slotCount: 18,
  },
];

// ============================================
// ヘルパー関数
// ============================================
export function getRodById(id: string): RodConfig | undefined {
  return rodConfigs.find(rod => rod.id === id);
}

export function getBaitById(id: string): BaitConfig | undefined {
  return baitConfigs.find(bait => bait.id === id);
}

export function getLureById(id: string): LureConfig | undefined {
  return lureConfigs.find(lure => lure.id === id);
}

export function getInventoryUpgradeById(id: string): InventoryUpgradeConfig | undefined {
  return inventoryUpgradeConfigs.find(upgrade => upgrade.id === id);
}

// 次の釣り竿を取得
export function getNextRod(currentRodId: string): RodConfig | undefined {
  const currentIndex = rodConfigs.findIndex(rod => rod.id === currentRodId);
  if (currentIndex === -1 || currentIndex >= rodConfigs.length - 1) {
    return undefined;
  }
  return rodConfigs[currentIndex + 1];
}

// 次のインベントリ拡張を取得
export function getNextInventoryUpgrade(currentSlotCount: number): InventoryUpgradeConfig | undefined {
  return inventoryUpgradeConfigs.find(upgrade => upgrade.slotCount > currentSlotCount);
}
