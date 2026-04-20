// 🏪 ショップ設定ファイル

// ============================================
// サオの定義
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
  controlStatAdd: number;    // バー操作安定性に効くコントロール加算
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
    name: '木のサオ',
    description: '初心者用の基本的なサオ。',
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
    name: '竹のサオ',
    description: 'しなやかで扱いやすいサオ。',
    price: 500,
    icon: '🎋',
    powerStatAdd: 0.04,
    speedStatAdd: 0.04,
    techniqueStatAdd: 0.01,
    controlStatAdd: 0.05,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.01, rare: 0.01, epic: 0.0, legendary: 0.0 },
  },
  {
    id: 'rod_carbon',
    name: 'カーボンロッド',
    description: '軽くて丈夫な高性能サオ。',
    price: 2000,
    icon: '⚡',
    powerStatAdd: 0.09,
    speedStatAdd: 0.09,
    techniqueStatAdd: 0.02,
    controlStatAdd: 0.1,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.02, rare: 0.03, epic: 0.02, legendary: 0.01 },
  },
  {
    id: 'rod_master',
    name: '名人のサオ',
    description: '伝説の釣り師が使っていたサオ。',
    price: 8000,
    icon: '👑',
    powerStatAdd: 0.14,
    speedStatAdd: 0.14,
    techniqueStatAdd: 0.04,
    controlStatAdd: 0.16,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.03, rare: 0.06, epic: 0.05, legendary: 0.03 },
  },
  {
    id: 'rod_legendary',
    name: '達人のサオ',
    description: '釣りの達人だけが扱える究極のサオ。',
    price: 30000,
    icon: '🏆',
    powerStatAdd: 0.2,
    speedStatAdd: 0.2,
    techniqueStatAdd: 0.06,
    controlStatAdd: 0.22,
    rarityHitRateAdd: { common: 0.0, uncommon: 0.04, rare: 0.09, epic: 0.08, legendary: 0.06 },
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
    commonBonus: 1.25,
    uncommonBonus: 1.05,
    rareBonus: 0.98,
    epicBonus: 0.95,
    legendaryBonus: 0.92,
  },
  {
    id: 'bait_shrimp',
    name: '小エビ',
    description: '中型魚に効果的。UNCOMMONが釣れやすい。',
    price: 80,
    icon: '🦐',
    quantity: 15,
    commonBonus: 0.92,
    uncommonBonus: 1.22,
    rareBonus: 1.08,
    epicBonus: 0.98,
    legendaryBonus: 0.94,
  },
  {
    id: 'bait_minnow',
    name: '小魚',
    description: '大型魚を狙える生きエサ。RARE以上が釣れやすい。',
    price: 200,
    icon: '🐟',
    quantity: 10,
    commonBonus: 0.82,
    uncommonBonus: 0.92,
    rareBonus: 1.25,
    epicBonus: 1.15,
    legendaryBonus: 1.08,
  },
  {
    id: 'bait_golden',
    name: '黄金虫',
    description: '伝説の魚も引き寄せる究極のエサ。',
    price: 500,
    icon: '✨',
    quantity: 5,
    commonBonus: 0.72,
    uncommonBonus: 0.82,
    rareBonus: 1.22,
    epicBonus: 1.35,
    legendaryBonus: 1.55,
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
    uncommonBonus: 1.05,
    rareBonus: 1.08,
    epicBonus: 1.03,
    legendaryBonus: 1.0,
  },
  {
    id: 'lure_minnow',
    name: 'ミノー',
    description: '小魚を模したルアー。中〜大型魚に効果的。',
    price: 3000,
    icon: '🎣',
    commonBonus: 0.97,
    uncommonBonus: 1.08,
    rareBonus: 1.14,
    epicBonus: 1.1,
    legendaryBonus: 1.06,
  },
  {
    id: 'lure_popper',
    name: 'ポッパー',
    description: '水面で音を立てて魚を誘うトップウォータールアー。',
    price: 5000,
    icon: '💦',
    commonBonus: 0.94,
    uncommonBonus: 1.1,
    rareBonus: 1.18,
    epicBonus: 1.14,
    legendaryBonus: 1.1,
  },
  {
    id: 'lure_legendary',
    name: 'スピナー',
    description: '回転するブレードで光を反射。全体的に効果UP。',
    price: 10000,
    icon: '💎',
    commonBonus: 0.9,
    uncommonBonus: 1.12,
    rareBonus: 1.22,
    epicBonus: 1.18,
    legendaryBonus: 1.14,
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

// 次のサオを取得
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
