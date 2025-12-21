// 🐟 魚データ設定ファイル
// このファイルを編集して魚の追加・調整ができます

import { Rarity } from './fishTypes';

// ============================================
// 魚のパラメータ説明
// ============================================
// id: 一意のID（変更しないこと）
// name: 表示名
// emoji: 仮のアイコン
// rarity: レア度 (COMMON/UNCOMMON/RARE/EPIC/LEGENDARY)
// price: 売値 (G)
// weight: 出現しやすさ（同じレア度内での重み、大きいほど出やすい）
// 
// 【ファイト難易度パラメータ】
// catchDifficulty: 総合難易度 0.0〜1.0（参考値、現在は未使用）
// catchRate: 捕まえやすさ 0.0〜2.0（大きいほどゲージが速く増える、1.0が基準）
// escapeRate: 逃げやすさ 0.0〜2.0（大きいほどゲージが速く減る、1.0が基準）
// fishSpeed: 魚の移動速度 0.0〜1.0（大きいほど速く動く）
// fishErratic: 動きの激しさ 0.0〜1.0（大きいほど予測不能な動き）
// moveInterval: 方向転換の頻度 [最短, 最長] 秒（小さいほど頻繁に動く）

export interface FishConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: Rarity;
  price: number;
  weight: number;
  // ファイト難易度
  catchDifficulty: number;
  catchRate: number;        // 捕まえやすさ（ゲージ増加速度の倍率）
  escapeRate: number;       // 逃げやすさ（ゲージ減少速度の倍率）
  fishSpeed: number;
  fishErratic: number;
  moveInterval: [number, number];
}

// ============================================
// 魚データ一覧
// ============================================

export const fishConfigs: FishConfig[] = [
  // ============================
  // ★ COMMON (よく釣れる)
  // ============================
  {
    id: 'fish_goby',
    name: 'ハゼ',
    emoji: '🐟',
    description: '河口や浅瀬にいる小さな魚。初心者にぴったり。',
    rarity: Rarity.COMMON,
    price: 30,
    weight: 40,           // よく出る
    catchDifficulty: 0.05,
    catchRate: 1.5,       // 捕まえやすい（初心者向け）
    escapeRate: 0.5,      // 逃げにくい
    fishSpeed: 0.2,       // ゆっくり
    fishErratic: 0.1,     // おとなしい
    moveInterval: [2.0, 4.0], // 方向転換の間隔：[最短2.0秒, 最長4.0秒]（動きはゆっくり）
  },
  {
    id: 'fish_crucian_carp',
    name: 'フナ',
    emoji: '🐟',
    description: 'どこにでもいる淡水魚。',
    rarity: Rarity.COMMON,
    price: 50,
    weight: 35,
    catchDifficulty: 0.1,
    catchRate: 1.3,
    escapeRate: 0.6,
    fishSpeed: 0.25,
    fishErratic: 0.15,
    moveInterval: [1.8, 3.5],
  },
  {
    id: 'fish_carp',
    name: 'コイ',
    emoji: '🐟',
    description: '池や川に生息する大きな魚。',
    rarity: Rarity.COMMON,
    price: 80,
    weight: 30,
    catchDifficulty: 0.15,
    catchRate: 1.2,
    escapeRate: 0.7,
    fishSpeed: 0.3,
    fishErratic: 0.2,
    moveInterval: [1.5, 3.0],
  },
  {
    id: 'fish_sweetfish',
    name: 'アユ',
    emoji: '🐟',
    description: '清流に住む香り高い魚。',
    rarity: Rarity.COMMON,
    price: 100,
    weight: 25,
    catchDifficulty: 0.2,
    catchRate: 1.1,
    escapeRate: 0.8,
    fishSpeed: 0.4,       // 少し速い
    fishErratic: 0.25,
    moveInterval: [1.2, 2.5],
  },
  {
    id: 'fish_killifish',
    name: 'メダカ',
    emoji: '🐟',
    description: '小さくてかわいい日本の魚。絶滅危惧種。',
    rarity: Rarity.COMMON,
    price: 20,
    weight: 35,
    catchDifficulty: 0.05,
    catchRate: 1.6,
    escapeRate: 0.4,
    fishSpeed: 0.15,
    fishErratic: 0.1,
    moveInterval: [2.5, 4.5],
  },
  {
    id: 'fish_loach',
    name: 'ドジョウ',
    emoji: '🐟',
    description: '泥の中に潜む細長い魚。ヒゲがチャームポイント。',
    rarity: Rarity.COMMON,
    price: 40,
    weight: 30,
    catchDifficulty: 0.1,
    catchRate: 1.3,
    escapeRate: 0.6,
    fishSpeed: 0.2,
    fishErratic: 0.3,     // ぬるぬる動く
    moveInterval: [1.5, 3.0],
  },
  {
    id: 'fish_bluegill',
    name: 'ブルーギル',
    emoji: '🐟',
    description: '外来種だが各地に生息。青いエラが特徴。',
    rarity: Rarity.COMMON,
    price: 25,
    weight: 35,
    catchDifficulty: 0.1,
    catchRate: 1.4,
    escapeRate: 0.5,
    fishSpeed: 0.25,
    fishErratic: 0.2,
    moveInterval: [1.8, 3.5],
  },
  {
    id: 'fish_crucian_herabuna',
    name: 'ヘラブナ',
    emoji: '🐟',
    description: '釣り人に大人気の大型フナ。引きが強い。',
    rarity: Rarity.COMMON,
    price: 90,
    weight: 20,
    catchDifficulty: 0.2,
    catchRate: 1.1,
    escapeRate: 0.8,
    fishSpeed: 0.35,
    fishErratic: 0.25,
    moveInterval: [1.5, 3.0],
  },
  {
    id: 'fish_sea_bass',
    name: 'スズキ',
    emoji: '🐟',
    description: '海と川を行き来する出世魚。シーバスとも呼ばれる。',
    rarity: Rarity.COMMON,
    price: 120,
    weight: 20,
    catchDifficulty: 0.25,
    catchRate: 1.0,
    escapeRate: 0.9,
    fishSpeed: 0.45,
    fishErratic: 0.3,
    moveInterval: [1.0, 2.5],
  },
  {
    id: 'fish_goldfish',
    name: 'キンギョ',
    emoji: '🐠',
    description: '誰かが逃がした観賞魚...？なぜか釣れる。',
    rarity: Rarity.COMMON,
    price: 70,
    weight: 15,
    catchDifficulty: 0.1,
    catchRate: 1.3,
    escapeRate: 0.5,
    fishSpeed: 0.2,
    fishErratic: 0.15,
    moveInterval: [2.0, 4.0],
  },

  // ============================
  // ★★ UNCOMMON (たまに釣れる)
  // ============================
  {
    id: 'fish_catfish',
    name: 'ナマズ',
    emoji: '🐠',
    description: 'ヒゲが特徴的な夜行性の魚。',
    rarity: Rarity.UNCOMMON,
    price: 180,
    weight: 30,
    catchDifficulty: 0.25,
    catchRate: 1.0,
    escapeRate: 0.9,
    fishSpeed: 0.3,
    fishErratic: 0.4,     // 不規則な動き
    moveInterval: [1.5, 3.0],
  },
  {
    id: 'fish_black_bass',
    name: 'ブラックバス',
    emoji: '🐠',
    description: '引きが強い人気のゲームフィッシュ。',
    rarity: Rarity.UNCOMMON,
    price: 200,
    weight: 35,
    catchDifficulty: 0.3,
    catchRate: 1.0,
    escapeRate: 1.0,
    fishSpeed: 0.5,
    fishErratic: 0.35,
    moveInterval: [1.0, 2.5],
  },
  {
    id: 'fish_rainbow_trout',
    name: 'ニジマス',
    emoji: '🐠',
    description: '美しい虹色の模様を持つ。',
    rarity: Rarity.UNCOMMON,
    price: 250,
    weight: 25,
    catchDifficulty: 0.35,
    catchRate: 0.95,
    escapeRate: 1.1,
    fishSpeed: 0.55,
    fishErratic: 0.3,
    moveInterval: [0.8, 2.0],
  },
  {
    id: 'fish_eel',
    name: 'ウナギ',
    emoji: '🐍',
    description: '高級食材。ぬるぬるして捕まえにくい。',
    rarity: Rarity.UNCOMMON,
    price: 400,
    weight: 20,
    catchDifficulty: 0.4,
    catchRate: 0.9,
    escapeRate: 1.3,
    fishSpeed: 0.45,
    fishErratic: 0.6,     // かなり不規則
    moveInterval: [0.5, 1.5],
  },
  {
    id: 'fish_char',
    name: 'イワナ',
    emoji: '🐠',
    description: '渓流の王者。冷たく澄んだ水を好む。',
    rarity: Rarity.UNCOMMON,
    price: 300,
    weight: 25,
    catchDifficulty: 0.35,
    catchRate: 0.95,
    escapeRate: 1.1,
    fishSpeed: 0.5,
    fishErratic: 0.35,
    moveInterval: [1.0, 2.5],
  },
  {
    id: 'fish_yamame',
    name: 'ヤマメ',
    emoji: '🐠',
    description: '川の女王と呼ばれる美しい渓流魚。',
    rarity: Rarity.UNCOMMON,
    price: 280,
    weight: 25,
    catchDifficulty: 0.35,
    catchRate: 0.95,
    escapeRate: 1.1,
    fishSpeed: 0.55,
    fishErratic: 0.3,
    moveInterval: [0.8, 2.0],
  },
  {
    id: 'fish_snakehead',
    name: 'ライギョ',
    emoji: '🐠',
    description: '大きな口を持つ獰猛な淡水魚。別名カムルチー。',
    rarity: Rarity.UNCOMMON,
    price: 220,
    weight: 20,
    catchDifficulty: 0.4,
    catchRate: 0.9,
    escapeRate: 1.2,
    fishSpeed: 0.4,
    fishErratic: 0.5,     // 暴れる
    moveInterval: [0.8, 2.0],
  },
  {
    id: 'fish_rockfish',
    name: 'カサゴ',
    emoji: '🐠',
    description: 'トゲトゲした見た目の根魚。煮付けが美味。',
    rarity: Rarity.UNCOMMON,
    price: 180,
    weight: 25,
    catchDifficulty: 0.3,
    catchRate: 1.0,
    escapeRate: 1.0,
    fishSpeed: 0.3,
    fishErratic: 0.4,
    moveInterval: [1.5, 3.0],
  },
  {
    id: 'fish_flatfish',
    name: 'カレイ',
    emoji: '🐠',
    description: '砂に隠れる平たい魚。左向きが特徴。',
    rarity: Rarity.UNCOMMON,
    price: 220,
    weight: 25,
    catchDifficulty: 0.3,
    catchRate: 1.0,
    escapeRate: 0.9,
    fishSpeed: 0.25,
    fishErratic: 0.35,
    moveInterval: [1.5, 3.5],
  },
  {
    id: 'fish_amago',
    name: 'アマゴ',
    emoji: '🐠',
    description: 'ヤマメに似た朱点のある渓流魚。西日本に生息。',
    rarity: Rarity.UNCOMMON,
    price: 260,
    weight: 20,
    catchDifficulty: 0.35,
    catchRate: 0.95,
    escapeRate: 1.1,
    fishSpeed: 0.5,
    fishErratic: 0.35,
    moveInterval: [0.9, 2.2],
  },

  // ============================
  // ★★★ RARE (レア)
  // ============================
  {
    id: 'fish_salmon',
    name: 'サケ',
    emoji: '🐟',
    description: '川を遡上する力強い魚。',
    rarity: Rarity.RARE,
    price: 500,
    weight: 35,
    catchDifficulty: 0.5,
    catchRate: 0.85,
    escapeRate: 1.2,
    fishSpeed: 0.6,
    fishErratic: 0.4,
    moveInterval: [0.8, 2.0],
  },
  {
    id: 'fish_yellowtail',
    name: 'ブリ',
    emoji: '🐟',
    description: '出世魚。成長とともに名前が変わる。',
    rarity: Rarity.RARE,
    price: 700,
    weight: 30,
    catchDifficulty: 0.55,
    catchRate: 0.8,
    escapeRate: 1.3,
    fishSpeed: 0.65,
    fishErratic: 0.45,
    moveInterval: [0.6, 1.8],
  },
  {
    id: 'fish_sea_bream',
    name: 'タイ',
    emoji: '🐡',
    description: 'めでたい席に欠かせない高級魚。',
    rarity: Rarity.RARE,
    price: 800,
    weight: 25,
    catchDifficulty: 0.6,
    catchRate: 0.75,
    escapeRate: 1.4,
    fishSpeed: 0.55,
    fishErratic: 0.5,
    moveInterval: [0.7, 1.5],
  },
  {
    id: 'fish_horse_mackerel',
    name: 'アジ',
    emoji: '🐠',
    description: '群れで泳ぐ回遊魚。新鮮なものは刺身が絶品。',
    rarity: Rarity.RARE,
    price: 550,           // ブリ(700)より安く
    weight: 30,
    catchDifficulty: 0.5, // RAREらしく調整
    catchRate: 0.9,       // ブリ(0.8)より釣りやすい
    escapeRate: 1.1,      // ブリ(1.3)より逃げにくい
    fishSpeed: 0.6,       // RAREらしく調整
    fishErratic: 0.4,
    moveInterval: [0.8, 2.0],
  },
  {
    id: 'fish_koi',
    name: '錦鯉',
    emoji: '🎏',
    description: '美しい模様を持つ観賞魚の王様。泳ぐ宝石とも呼ばれる。',
    rarity: Rarity.EPIC,
    price: 1800,          // EPICらしく高価に
    weight: 25,
    catchDifficulty: 0.7, // EPICらしく難しく
    catchRate: 0.75,      // EPICらしく調整
    escapeRate: 1.5,      // EPICらしく逃げやすい
    fishSpeed: 0.55,      // EPICらしく調整
    fishErratic: 0.5,
    moveInterval: [0.6, 1.5],
  },

  // ============================
  // ★★★★ EPIC (超レア)
  // ============================
  {
    id: 'fish_tuna',
    name: 'マグロ',
    emoji: '🐟',
    description: '海の王者。とてつもない力で泳ぐ。',
    rarity: Rarity.EPIC,
    price: 2000,
    weight: 35,
    catchDifficulty: 0.75,
    catchRate: 0.65,
    escapeRate: 1.6,
    fishSpeed: 0.85,
    fishErratic: 0.55,
    moveInterval: [0.3, 1.0],
  },
  {
    id: 'fish_sturgeon',
    name: 'チョウザメ',
    emoji: '🐟',
    description: 'キャビアが取れる古代魚。',
    rarity: Rarity.EPIC,
    price: 3000,
    weight: 25,
    catchDifficulty: 0.65,
    catchRate: 0.75,
    escapeRate: 1.4,
    fishSpeed: 0.5,
    fishErratic: 0.7,     // 予測不能
    moveInterval: [0.5, 1.5],
  },

  // ============================
  // ★★★★★ LEGENDARY (伝説)
  // ============================
  {
    id: 'fish_golden_koi',
    name: '黄金の鯉',
    emoji: '✨',
    description: '伝説の金色に輝く鯉。見た者に幸運をもたらす。',
    rarity: Rarity.LEGENDARY,
    price: 10000,
    weight: 40,
    catchDifficulty: 0.85,
    catchRate: 0.6,
    escapeRate: 1.8,
    fishSpeed: 0.7,
    fishErratic: 0.8,
    moveInterval: [0.3, 0.8],
  },
  {
    id: 'fish_arowana',
    name: 'アロワナ',
    emoji: '🐉',
    description: '古代魚の生き残り。優雅に泳ぐ姿から龍魚とも呼ばれる。',
    rarity: Rarity.LEGENDARY,
    price: 15000,
    weight: 30,
    catchDifficulty: 0.95,
    catchRate: 0.5,
    escapeRate: 2.0,
    fishSpeed: 0.9,       // 超高速
    fishErratic: 0.9,     // 超不規則
    moveInterval: [0.2, 0.6],
  },

  // ============================
  // 🗑️ ゴミ（ハズレ）
  // ============================
  {
    id: 'junk_boot',
    name: '長靴',
    emoji: '👢',
    description: '誰かが捨てた長靴。なぜか釣れる。',
    rarity: Rarity.COMMON,
    price: 5,
    weight: 15,
    catchDifficulty: 0,
    catchRate: 2.0,       // 簡単に捕まえられる
    escapeRate: 0,
    fishSpeed: 0,
    fishErratic: 0,
    moveInterval: [10, 10],
  },
  {
    id: 'junk_can',
    name: '空き缶',
    emoji: '🥫',
    description: 'ゴミはちゃんと捨てましょう。',
    rarity: Rarity.COMMON,
    price: 2,
    weight: 10,
    catchDifficulty: 0,
    catchRate: 2.0,
    escapeRate: 0,
    fishSpeed: 0,
    fishErratic: 0,
    moveInterval: [10, 10],
  },
  {
    id: 'junk_tire',
    name: '古タイヤ',
    emoji: '⭕',
    description: '重い...なんでこんなものが。',
    rarity: Rarity.COMMON,
    price: 10,
    weight: 5,
    catchDifficulty: 0,
    catchRate: 2.0,
    escapeRate: 0,
    fishSpeed: 0,
    fishErratic: 0,
    moveInterval: [10, 10],
  },
];

// ============================================
// レア度設定
// ============================================
export const raritySettings = {
  [Rarity.COMMON]: {
    weight: 50,           // 出現率 50%
    color: 0xaaaaaa,      // グレー
    stars: '★',
  },
  [Rarity.UNCOMMON]: {
    weight: 30,           // 出現率 30%
    color: 0x55ff55,      // 緑
    stars: '★★',
  },
  [Rarity.RARE]: {
    weight: 14,           // 出現率 14%
    color: 0x5555ff,      // 青
    stars: '★★★',
  },
  [Rarity.EPIC]: {
    weight: 5,            // 出現率 5%
    color: 0xaa55ff,      // 紫
    stars: '★★★★',
  },
  [Rarity.LEGENDARY]: {
    weight: 1,            // 出現率 1%
    color: 0xffaa00,      // 金
    stars: '★★★★★',
  },
};

