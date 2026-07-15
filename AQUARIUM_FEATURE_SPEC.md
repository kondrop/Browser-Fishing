# アクアリウム機能 実装仕様書・作業手順書

ショップの「バッグ」カテゴリーを「どうぐ」に改称し、新アイテム「アクアリウム」と
それに紐づくアクアリウム機能（魚の飼育・成長・ステータスボーナス・水槽鑑賞・餌やり）を追加するための実装指示書。
この文書の指示どおりに実装すれば、実装者（人間/AI）によらず同じ結果になることを目的とする。

関連文書: `BOOK_UI_STYLE_GUIDE.md`（UI規約） / `QUEST_TAB_UI_SPEC.md`（Book UIタブ改修の前例）

---

## 0. ゴールとスコープ

### ゴール
- ショップに「どうぐ」カテゴリーを設け、「アクアリウム」（買い切り）と「アクアリウムフード」（消費）を販売する
- アクアリウム所持中は Book UI に「Aquarium」タブが出現し、水槽内の魚（最大3匹）の管理・確認ができる
- 水槽ビュー（専用モーダル）で、魚の透過PNGがアニメーションしながら泳ぎ、狙った横位置に餌を投下して魚を育てられる
- 水槽内の魚は「種類（生息地/レア度）」に応じたステータスボーナスをプレイヤーに与え、成長段階とともにボーナスが上昇する

### スコープ（変更・追加対象）
| 対象 | 内容 |
|---|---|
| `src/data/shopConfig.ts` | どうぐ（tool）定義の追加、画像マップ追記 |
| `src/data/aquariumConfig.ts` | **新規**。バランス数値・成長テーブル・ボーナステーブル |
| `src/data/aquarium.ts` | **新規**。アクアリウムの純粋ロジック（出し入れ/成長/ボーナス計算） |
| `src/data/inventory.ts` | `PlayerData` 拡張、セーブ/ロード互換 |
| `src/data/skills.ts` | `getSkillStatBonuses` へのアクアリウムボーナス合算（§7） |
| `src/scenes/GameScene.ts` | ショップUI変更、Book UIタブ追加、水槽ビューモーダル追加 |
| `src/style.css` | 「アクアリウムタブ」「水槽ビュー」セクションの新設 |
| `public/images/` | 水槽背景・タブアイコン・アイテムアイコン（§8.4。用意できない場合の代替も規定） |

### スコープ外（この作業ではやらない）
- 実績・クエストのアクアリウム連携（新実績/新クエスト種別の追加）
- 水槽の複数所持・拡張（3匹固定。将来拡張は §12）
- 魚同士の相互作用（繁殖・ケンカ等）
- 釣りゲームプレイ本体（キャスト/ファイト）のロジック変更。ボーナス値が既存経路で反映されるのみ
- マルチプレイヤー対応（`MULTIPLAYER_WORK_SPEC.md` とは独立）

---

## 1. 前提: 既存コードの事実（調査済み。再調査不要）

| 項目 | 事実 | 根拠 |
|---|---|---|
| 構成 | Phaser 3 + Vite + TS。シーンは `GameScene` 1つ。UIモーダルは全て DOM オーバーレイ | `src/main.ts` |
| ショップタブ | `shopTab: 'rod' \| 'bait' \| 'lure' \| 'inventory'`。`data-tab="inventory"` のラベルが「バッグ」 | `GameScene.ts` L311付近, `createShopUI()` |
| ショップ描画 | `updateShopContent()` がタブごとに `items` 配列を構築 → DOM生成。購入は `purchaseOrEquipItem()` → `handleXxxPurchase()` | `GameScene.ts` L9656〜 |
| ショップアイコン | `this.textures.exists(item.id)` なら canvas 描画、なければ `item.icon`（絵文字）にフォールバック | `GameScene.ts` L9806〜9820 |
| Book UIタブ | `unifiedBookTab` 型ユニオン + `unifiedBookTabOrder` 配列 + HTMLテンプレの `.book-tab-button[data-tab]` + `switchUnifiedBookTab()` | `GameScene.ts` L211, L4299〜, L4693〜 |
| Book UI再描画 | `updateUnifiedBookList()`（左ペイン）/ `updateUnifiedBookDetail()`（右ペイン）がタブごとに分岐 | `GameScene.ts` L6365, L6817 |
| モーダル管理 | `MODAL_IDS` 定数 + `openModal()` / `closeModal()` のスタック方式 | `GameScene.ts` L346〜 |
| 魚データ | `fishConfigs`（39魚+ゴミ3）。`rarity`（5段階）、`habitat`（freshwater/saltwater/stream）、`maxSize`、`price` | `src/data/fishConfig.ts` |
| 魚画像 | `/images/fish/{日本語名}.png`（128×128 透過PNG）。`getFishImagePath(fishId)`。Phaser には `load.image(fishId, ...)` 済み | `src/data/fish.ts` |
| バッグ | `PlayerData.inventory: InventoryEntry[]`（`{fishId, size?}`）。上限 `maxInventorySlots` | `src/data/inventory.ts` |
| ステータス | パワー/スピード/テクニック/コントロールの4種。**竿加算 + スキル加算** で決まり、表示は `calculateDisplayStatIndices()`（基準100の指数） | `src/debug/balanceDebug.ts` |
| スキルボーナス集約 | `getSkillStatBonuses(playerData): SkillStatBonuses`（skills.ts）。呼び出し元: `balanceDebug.getEffectiveSkillStatBonuses`（GameScene全域）と `fightSimulation.resolveSkillBonuses` | `src/data/skills.ts` L239 |
| `SkillStatBonuses` | `castDistSkillAdd`(パワー) / `gaugeSpeedSkillAdd`(スピード) / `barRangeSkillAdd`(テクニック) / `fightBarDragSkillAdd`(コントロール) / `sellPriceSkillMul` / `junkRateSkillMul` | `src/data/skills.ts` L39 |
| セーブ | localStorage キー `fishingGame_playerData`。`loadPlayerData()` は `{...initial, ...parsed, 個別デフォルト補完}` パターン。専用マイグレーターなし | `src/data/inventory.ts` L347〜 |
| 釣りエサ | `bait_*` は「釣りのレア度ブースト用消費アイテム」として**既に存在**。アクアリウムの餌とは別概念（命名衝突に注意 → 本機能では `food` を使う） | `src/data/shopConfig.ts` |
| UI規約 | 枠は `ui-frame-box`、非選択 `uiframe.png` / 選択 `border.png`、選択状態は枠切替+塗り（`--frame-fill-color`）。詳細は `BOOK_UI_STYLE_GUIDE.md` | `.cursor/rules/book-ui-style-baseline.mdc` |
| 竿の相場 | 3,000 / 15,000 / 30,000 / 70,000G。最上位竿は4ステ各 +0.09〜0.28 加算 | `src/data/shopConfig.ts` |

---

## 2. ゲームデザイン仕様（決定事項）

体験の狙い: **「釣る」以外の長期目標**を作る。お気に入りの魚を手元に置いて育てる愛着ループと、
育成の成果が釣り本体のステータスに還元される成長ループを接続する。
餌やりは「眺めているだけで楽しい水槽」に対する軽い介入操作とし、作業感を出さない
（連打・張り付きで加速しないよう満腹クールダウンで律速する）。

### 2.1 アイテムと入手

| アイテム | id | 種別 | 価格 | 効果 |
|---|---|---|---|---|
| アクアリウム | `tool_aquarium` | 買い切り（1点物） | 12,000G | 所持で全アクアリウム機能が解禁 |
| アクアリウムフード | `tool_fish_food` | 消費（10個パック） | 300G | 水槽で餌やり1回につき1個消費 |

- 価格の意図: アクアリウムは中型バッグ(5,000)と大型バッグ(15,000)の間の中盤目標。フードはランニングコストとして安価
- どちらもショップ「どうぐ」タブで販売（§4）
- フードはアクアリウム未所持でも購入できてしまわないよう、**アクアリウム未所持時はフード行を「要: アクアリウム」表示で購入不可**にする

### 2.2 水槽への出し入れ

- 水槽スロットは **3枠固定**
- 入れられるのはバッグ内の魚のみ（`junk_*` は不可）。同種の重複は**許可**（ボーナスも重複加算。§11で調整余地として明記）
- 入れる: バッグの該当 `InventoryEntry` を `playerData.inventory` から取り除き、`playerData.aquarium` に移す（`size` を引き継ぐ）
- 取り出す: バッグに空きがある場合のみ可。`aquarium` から除去し `inventory` 末尾に `{fishId, size}` を戻す。
  **成長状態（feedCount）は破棄**する。取り出し前に確認ダイアログ（既存の確認UIがなければ `confirm()` は使わず、右ペイン内に「もう一度押すと確定」の2段階ボタンで実装）で
  「水槽から出すと成長がリセットされます」と警告する
- 水槽内の魚は売却・クエスト納品の対象外（`inventory` に存在しないため既存ロジックは自然に対象外となる。追加対応不要であることを確認する）

### 2.3 成長システム

- 成長は**餌を食べた累計回数 `feedCount`** だけで決まる（時間経過では成長しない）
- 成長段階は5段階。しきい値（累計回数）:

| 成長Lv | 名称 | 必要累計feedCount | スプライト表示倍率 |
|---|---|---|---|
| 1 | 稚魚 | 0 | 0.55 |
| 2 | 幼魚 | 5 | 0.70 |
| 3 | 若魚 | 15 | 0.85 |
| 4 | 成魚 | 35 | 1.00 |
| 5 | ヌシ | 65 | 1.15 |

- 満腹システム: 餌を食べた魚は `lastFedAt`（`Date.now()`）から **90秒間「満腹」**となり、餌に反応しない（食べられない）。
  ゲームを閉じても実時間で解消される（タイムスタンプ比較のみ。バックグラウンド処理は不要）
- `feedCount` / `lastFedAt` はセーブに含める（§3.3）
- 魚の `size`（cm）は成長で**変化させない**（`fishSizes` の記録やサイズ系クエストに影響させないため）。見た目の大きさは表示倍率で表現する

### 2.4 ステータスボーナス

- 水槽内の各魚が、**魚ごとに決まる1種類のステータス**へ加算ボーナスを与える。3匹の合計が常時パッシブで効く
- 対象ステータスの決定: 生息地によるデフォルト + 例外テーブル（§3.1 の `AQUARIUM_STAT_OVERRIDES`）

| 生息地 | デフォルト対象ステータス |
|---|---|
| freshwater（淡水） | パワー（`castDistSkillAdd`） |
| saltwater（海水） | スピード（`gaugeSpeedSkillAdd`） |
| stream（渓流） | コントロール（`fightBarDragSkillAdd`） |

例外（テクニック枠を作るための初期割り当て。`aquariumConfig.ts` で定義）:

| fishId | 対象 |
|---|---|
| `fish_goldfish` | テクニック |
| `fish_koi` | テクニック |
| `fish_jellyfish` | テクニック |
| `fish_seahorse` | テクニック |

- ボーナス量 = `レア度基礎値 × 成長Lv`（加算値。Book UI の表示指数では ×100 したポイントになる）

| レア度 | 基礎値/Lv | Lv5時 | Lv5時の表示 |
|---|---|---|---|
| common | 0.004 | 0.020 | +2pt |
| uncommon | 0.006 | 0.030 | +3pt |
| rare | 0.010 | 0.050 | +5pt |
| epic | 0.014 | 0.070 | +7pt |
| legendary | 0.020 | 0.100 | +10pt |

- バランスの目安: 最上位竿（70,000G）の1ステ加算が +0.26。伝説魚をヌシまで育てても +0.10（1ステのみ）なので、
  「便利だが竿を置き換えない」水準。3匹すべて伝説ヌシで合計 +0.30（分散 or 1点集中はプレイヤーの選択）
- テクニックへの加算は既存コードと同様に上限 1.0 のクランプに従う（`fightSimulation.ts` / `balanceDebug.ts` の `Math.min(1.0, ...)` が既にあるため追加対応不要）

### 2.5 餌やり（水槽ビュー内のみで実施）

- 餌やりは**水槽ビュー（§6）でのみ**行える。Book UIの管理画面からワンタップで餌やりはできない
  （「投下位置を狙う」ゲーム性を成立させるため）
- 1回の投下で `aquariumFoodCount` を1消費。所持0なら投下不可（HUDに「ショップで購入」の案内）
- 餌は水槽上端の選択した**横位置 x** から投下され、ゆらゆら沈む
- 反応できる魚 = 満腹でない魚。反応した魚は餌に向かって泳ぎ、**最初に到達した1匹**が食べる
  （投下位置に近い魚ほど先に到達しやすい = 狙って育てる、が成立する）
- 誰も食べずに餌が底に到達したら消滅（餌は消費されたまま。無駄撃ちのリスクで狙う意味を強化）
- 食べた魚: `feedCount++`、`lastFedAt = Date.now()`、ハート演出。成長Lvが上がった瞬間は専用演出+トースト（§6.5）
- 連続投下のクールダウン: 1.5秒（餌の同時多発による狙いの無意味化を防ぐ）

---

## 3. データ設計

### 3.1 新規ファイル `src/data/aquariumConfig.ts`

バランス数値をすべてここに集約する（コードにマジックナンバーを書かない）。

```typescript
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
```

注意: `fishTypes.ts` の enum は `Rarity.COMMON〜LEGENDARY` / `Habitat.FRESHWATER, SALTWATER, STREAM`（値は小文字文字列）であることを確認済み。上記コードはそのまま使える。

### 3.2 新規ファイル `src/data/aquarium.ts`（純粋ロジック）

**依存ルール: `inventory.ts` からは `import type` のみ**（`skills.ts` → `aquarium.ts` → `inventory.ts`(runtime) → `skills.ts` の循環を作らないため）。
`fishConfig.ts` / `aquariumConfig.ts` の runtime import は可。

```typescript
import type { PlayerData } from './inventory';
import { getFishById } from './fish';
import {
  AQUARIUM_CAPACITY, AQUARIUM_GROWTH_STAGES, AQUARIUM_SATIETY_DURATION_MS,
  AQUARIUM_RARITY_BONUS_BASE, AQUARIUM_HABITAT_STAT, AQUARIUM_STAT_OVERRIDES,
  type AquariumStatKey,
} from './aquariumConfig';

/** 水槽内の1匹 */
export interface AquariumFishEntry {
  fishId: string;
  size?: number;      // バッグから引き継いだcm。表示用
  feedCount: number;  // 累計摂食回数
  addedAt: number;    // Date.now()
  lastFedAt: number;  // Date.now()。0 = 未摂食
}

/** 実装する関数（シグネチャ確定。中身は素直に書く） */
export function hasAquarium(playerData: PlayerData): boolean;            // ownedTools に 'tool_aquarium'
export function getGrowthStage(feedCount: number): AquariumGrowthStage;  // しきい値を降順に探す
export function getNextGrowthStage(feedCount: number): AquariumGrowthStage | null;
export function isSatiated(entry: AquariumFishEntry, now: number): boolean;
export function getSatietyRemainingMs(entry: AquariumFishEntry, now: number): number;
export function getAquariumStatKeyForFish(fishId: string): AquariumStatKey; // override → habitat の順
export function getAquariumBonusForEntry(entry: AquariumFishEntry): { stat: AquariumStatKey; value: number };
/** 4ステ合計。skills.ts から呼ばれる（§7） */
export function getAquariumStatBonuses(playerData: PlayerData): {
  powerAdd: number; speedAdd: number; techniqueAdd: number; controlAdd: number;
};

/** バッグ→水槽。inventoryIndex は playerData.inventory の添字（同種同サイズ個体を区別するため添字指定） */
export function addFishToAquarium(playerData: PlayerData, inventoryIndex: number): boolean;
// 失敗条件: 水槽満員 / 添字不正 / junk_*。成功時は inventory.splice で1件除去し aquarium に push

/** 水槽→バッグ。バッグ満杯なら false。成長は破棄して {fishId, size} だけ戻す */
export function removeFishFromAquarium(playerData: PlayerData, aquariumIndex: number): boolean;

/** 餌を1匹に与える（水槽ビューから呼ぶ）。フード残数チェック＋消費もここで行う */
export function feedAquariumFish(
  playerData: PlayerData, aquariumIndex: number, now: number,
): { ok: boolean; leveledUp: boolean };
```

`getAquariumStatBonuses` は `playerData.aquarium` が空・未所持なら全て0を返す（毎フレーム呼ばれても軽いが、
念のためループのみでオブジェクト生成以外のアロケーションをしない実装にする）。

### 3.3 `PlayerData` 拡張とセーブ互換（`src/data/inventory.ts`）

```typescript
export interface PlayerData {
  // ...既存フィールドは変更しない...
  ownedTools: string[];              // 所持どうぐID（'tool_aquarium' 等）
  aquariumFoodCount: number;         // アクアリウムフード残数
  aquarium: AquariumFishEntry[];     // 水槽内の魚（最大3）
}
```

- `AquariumFishEntry` 型は `aquarium.ts` から `import type` する（`inventory.ts` → `aquarium.ts` は型のみなので循環しない）
- `createInitialPlayerData()`: `ownedTools: []`, `aquariumFoodCount: 0`, `aquarium: []`
- `savePlayerData()`: 3フィールドとも plain な配列/数値なので **追記不要**（スプレッドで自動的に含まれる）。ただし動作確認はすること
- `loadPlayerData()` に既存パターンで補完を追加:

```typescript
ownedTools: Array.isArray(parsed.ownedTools) ? parsed.ownedTools : initial.ownedTools,
aquariumFoodCount: typeof parsed.aquariumFoodCount === 'number' ? parsed.aquariumFoodCount : 0,
aquarium: Array.isArray(parsed.aquarium)
  ? parsed.aquarium.map((e: any) => ({
      fishId: e.fishId,
      ...(e.size !== undefined ? { size: e.size } : {}),
      feedCount: e.feedCount || 0,
      addedAt: e.addedAt || 0,
      lastFedAt: e.lastFedAt || 0,
    }))
  : [],
```

---

## 4. ショップ変更仕様

### 4.1 カテゴリー改称

- **内部ID `'inventory'` は変更しない**（`shopTab` 型、`data-tab` 属性、分岐すべて既存のまま。改名による広範囲 diff とリグレッションを避けるため）
- 表示ラベルのみ変更: `createShopUI()` のタブボタン `data-tab="inventory"` のテキストを「バッグ」→**「どうぐ」**にする

### 4.2 どうぐ定義の追加（`src/data/shopConfig.ts`）

```typescript
// ============================================
// どうぐの定義（バッグ拡張以外の特殊アイテム）
// ============================================
export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  consumable: boolean;   // true: 何度でも購入（個数加算）
  quantity?: number;     // consumable のパック個数
  requiresToolId?: string; // このどうぐを所持していないと購入不可
}

export const toolConfigs: ToolConfig[] = [
  {
    id: 'tool_aquarium',
    name: 'アクアリウム',
    description: '釣った魚を3匹まで飼える水槽。育てるとステータスボーナス！',
    price: 12000,
    icon: '🐠',
    consumable: false,
  },
  {
    id: 'tool_fish_food',
    name: 'アクアリウムフード',
    description: '水槽の魚のごはん。あげると魚が成長する。',
    price: 300,
    icon: '🥫',
    consumable: true,
    quantity: 10,
    requiresToolId: 'tool_aquarium',
  },
];

export function getToolById(id: string): ToolConfig | undefined {
  return toolConfigs.find(t => t.id === id);
}
```

- `itemImageFileNames` に追記: `tool_aquarium: 'アクアリウム'`, `tool_fish_food: 'アクアリウムフード'`
  （画像が用意できない場合でもショップは絵文字フォールバックで動く。§8.4）

### 4.3 どうぐタブの表示（`GameScene.updateShopContent()`）

`this.shopTab === 'inventory'` 分岐で、`items` を **バッグ拡張（既存4件）+ どうぐ（2件）** の連結にする。

```typescript
} else if (this.shopTab === 'inventory') {
  const bagItems = inventoryUpgradeConfigs.map(inv => ({ /* 既存のまま */ }));
  const toolItems = toolConfigs.map(tool => ({
    id: tool.id,
    name: tool.name,
    icon: tool.icon,
    price: tool.price,
    packQuantity: tool.consumable ? tool.quantity : undefined,
    info: tool.consumable
      ? `所持: ${this.playerData.aquariumFoodCount}個 [消費]`
      : tool.description,
    owned: !tool.consumable && this.playerData.ownedTools.includes(tool.id),
    equipped: false,
    // 追加プロパティ（items 型に optional で足す）
    locked: !!tool.requiresToolId && !this.playerData.ownedTools.includes(tool.requiresToolId),
  }));
  items = [...bagItems, ...toolItems];
}
```

表示仕様:
- どうぐ行の `noteText` は `tool.description`
- `locked` の行は購入ボタンを `is-disabled` にし、ボタンテキストを「要: アクアリウム」にする
- `consumable` の行は bait と同様に `×10` の個数表示（既存の `shop-item-name-qty` を流用。判定を「`shopTab === 'bait'` または `packQuantity != null`」に緩める）
- `owned`（アクアリウム購入済み）は既存の「購入済み」表示に乗せる
- キーボードナビの `itemCount`（`handleShopNavigation` 内 `else if (this.shopTab === 'inventory') itemCount = inventoryUpgradeConfigs.length;`）を
  `inventoryUpgradeConfigs.length + toolConfigs.length` に更新する

### 4.4 購入処理（`GameScene.purchaseOrEquipItem()` 系）

`handleInventoryUpgrade()` を改修する（`shopSelectedIndex` が連結後の添字になる点に注意）:

```typescript
handleInventoryUpgrade() {
  const idx = this.shopSelectedIndex;
  if (idx < inventoryUpgradeConfigs.length) {
    // 既存のバッグ拡張処理（変更なし）
    return;
  }
  const tool = toolConfigs[idx - inventoryUpgradeConfigs.length];
  if (!tool) return;
  this.handleToolPurchase(tool);
}
```

新設 `handleToolPurchase(tool: ToolConfig)`:
1. `requiresToolId` 未所持なら `showResult('先にアクアリウムを購入しよう', 1500)` で終了
2. 非消費かつ購入済みなら何もしない
3. `money < price` なら `showResult('お金が足りません...', 1500)`
4. 購入成立:
   - `money -= price`
   - 非消費: `ownedTools.push(tool.id)`。`tool_aquarium` の場合は Book UI タブ表示を更新（§5.1）し、
     `showResult('アクアリウムを購入！ Bookに「Aquarium」タブが追加された！', 2500)`
   - 消費（`tool_fish_food`）: `aquariumFoodCount += tool.quantity`、`showResult(\`${tool.name}を${tool.quantity}個購入！\`, 1500)`
   - `savePlayerData` → `updateStatusUI` → `updateShopContent`（既存パターン踏襲）
   - `checkAchievements(this.playerData, ['equipment'])` も既存パターンに合わせて呼ぶ（新実績の追加はしない）

---

## 5. Book UI「Aquarium」タブ仕様

### 5.1 タブの追加と表示条件

- `unifiedBookTab` 型ユニオンと関連する型注釈すべてに `'aquarium'` を追加
- `unifiedBookTabOrder` の並び: `['inventory', 'status', 'skills', 'achievement', 'quest', 'aquarium', 'pedia']`（Quests と Pedia の間）
- HTMLテンプレ（`createUnifiedBookUI()`）にタブボタンを追加:

```html
<button class="book-tab-button ui-frame-box" data-tab="aquarium" aria-label="Aquarium" hidden>
  <span class="book-tab-button-inner">
    <img class="book-tab-icon" src="/images/ui/icon/icon_aquarium.png" alt="" aria-hidden="true" />
    <span class="book-tab-label">Aquarium</span>
  </span>
</button>
```

- **表示条件**: `hasAquarium(this.playerData)` が true のときだけ表示。
  - 新設 `private updateAquariumTabVisibility()`: タブボタンの `hidden` 属性をトグルする。
    呼び出しタイミング: `create()` 内のBook UI生成直後 / アクアリウム購入成立時
  - **キーボード巡回対応**: `unifiedBookTabOrder` を直接参照している箇所（Q/Eキー巡回、タブ行の左右移動、
    リスト端での左右タブ遷移など計8箇所前後）を、新設の
    `private getVisibleUnifiedBookTabOrder()`（未所持なら `'aquarium'` を除いた配列を返す）経由に置き換える。
    `rg "unifiedBookTabOrder" src/scenes/GameScene.ts` で全箇所を洗い出して漏れなく置換すること
- `switchUnifiedBookTab()` の型と、タブボタン click ハンドラ内の型キャストのユニオンにも `'aquarium'` を追加

### 5.2 レイアウト（2ペイン構成は他タブと統一）

```text
┌─ 左ペイン ────────────┐ ┌─ 右ペイン ──────────────────────────┐
│ ┌───────────────────┐ │ │ [魚スロット選択時]                    │
│ │ 🐟 コイ            │ │ │  魚画像（大）＋名前＋サイズ            │
│ │ Lv3 若魚   +3.0pt │ │ │  成長: Lv3 若魚  ▓▓▓▓▓░░░ 21/35     │
│ └───────────────────┘ │ │  ボーナス: パワー +3.0pt              │
│ ┌───────────────────┐ │ │  状態: おなかがすいている / 満腹(あと45秒)│
│ │ 🐠 クマノミ        │ │ │  [バッグに戻す]（2段階確認）           │
│ │ Lv1 稚魚   +0.4pt │ │ │                                      │
│ └───────────────────┘ │ │ [空きスロット選択時]                  │
│ ┌───────────────────┐ │ │  バッグの魚一覧（ゴミ除外）            │
│ │ ＋ 空きスロット    │ │ │  行クリック → [水槽に入れる]           │
│ └───────────────────┘ │ │                                      │
│ ┌───────────────────┐ │ │                                      │
│ │ 🫧 水槽を眺める     │ │ │（フッター共通）フード所持: 12個        │
│ └───────────────────┘ │ │  合計ボーナス: P+3.0 S+0.4            │
└───────────────────────┘ └──────────────────────────────────────┘
```

### 5.3 左ペイン（`updateUnifiedBookList()` に `aquarium` 分岐を追加）

- カードは常に4枚: 水槽スロット3枚（魚 or 空き）+「水槽を眺める」ボタンカード1枚
- class 構成は既存踏襲: `book-ui-node ui-frame-box` をベースに、アクアリウム専用 class `aquarium-slot-item` を併記
  （クエストタブ改修の教訓に従い、**他タブの class を流用しない**。キーボードナビ共通フックが必要な場合のみ既存 class を併記）
- 魚カードの内容: サムネ（既存のリストサムネと同じ canvas 描画方式）/ 魚名 / `Lv{n} {成長名}` / `+{pt}pt`
- 満腹中の魚カードには小さく `満腹` バッジを表示
- 「水槽を眺める」カードは `hasAquarium` かつ水槽に1匹以上いなくても押せる（空の水槽も鑑賞できる）
- 選択インデックス管理は既存の `unifiedBookSelectedIndex` 系の仕組みに乗せる

### 5.4 右ペイン（`updateUnifiedBookDetail()` に `aquarium` 分岐を追加）

- **魚スロット選択時**: 魚画像（`#book-detail-image` と同じ canvas 白フチ描画を流用可）、名前、サイズ(cm)、
  成長ゲージ（`現在feedCount - 現Lvしきい値` / `次Lvしきい値 - 現Lvしきい値`。Lv5は「MAX」表示）、
  ボーナス表記（例: `パワー +3.0pt`。値は `getAquariumBonusForEntry` の value×100、小数1桁）、
  満腹状態（`getSatietyRemainingMs` から残秒。空腹なら「おなかがすいている」）、
  「バッグに戻す」ボタン（1回目押下で「成長がリセットされます。もう一度押して確定」に変化、5秒で復帰。
  バッグ満杯時は disabled + 「バッグがいっぱい」）
- **空きスロット選択時**: バッグ内の非ゴミ魚を行リストで表示（魚名+サイズ+レア度）。行を選択 → 「水槽に入れる」ボタンで
  `addFishToAquarium` を呼び、成功したら左右ペイン再描画 + `savePlayerData`
- **プレースホルダー**: 水槽が空で空きスロット未選択時は「バッグの魚を水槽に入れてみよう！」
  （`#book-detail-placeholder` のタブ別テキスト切替は QUEST_TAB_UI_SPEC §4.5 と同じ方式）
- 満腹残り時間はタブ表示中のみ 1秒間隔の `setInterval` で該当テキストだけ更新（タブ切替・Book close で必ず `clearInterval`）

### 5.5 「水槽を眺める」→ 水槽ビューへの遷移

- クリック（またはキーボード決定）で水槽ビュー（§6）を開く。Book UI は**閉じずに**モーダルスタックに積む
  （`openModal(this.MODAL_IDS.AQUARIUM)`。ESCで水槽ビューだけ閉じて Book に戻れる）

---

## 6. 水槽ビュー（鑑賞・餌やり）仕様

### 6.1 モーダル構造

- `MODAL_IDS` に `AQUARIUM: 'aquarium-modal'` を追加
- `createAquariumUI()` を新設し、`create()` から他モーダルと同様に一度だけ DOM 生成:

```html
<div id="aquarium-modal" class="aquarium-modal">
  <div class="aquarium-frame ui-frame-box">
    <div class="aquarium-header">
      <span class="aquarium-title">アクアリウム</span>
      <span class="aquarium-food-count">🥫 ×<span id="aquarium-food-count-value">0</span></span>
      <button id="aquarium-close-button" class="aquarium-close-button">✕</button>
    </div>
    <div class="aquarium-canvas-wrap">
      <canvas id="aquarium-canvas"></canvas>
    </div>
    <div class="aquarium-footer">
      <span class="aquarium-hint">クリック / Z: エサを投下　←→ / マウス: ねらう位置　ESC: 閉じる</span>
    </div>
  </div>
</div>
```

- canvas 内部解像度は **960×540 固定**。CSS で `aquarium-canvas-wrap` にフィット（`image-rendering: pixelated`）。
  座標計算は内部解像度基準で行い、マウス座標は `getBoundingClientRect` でスケール変換する
- 開く: `openAquariumView()` = `openModal(AQUARIUM)` + フード数表示更新 + RAFループ開始
- 閉じる: `closeAquariumView()` = `cancelAnimationFrame` + `closeModal(AQUARIUM)` + `savePlayerData`。
  ✕ボタン・ESC（既存のモーダルESC処理に乗せる）両対応。**RAFループの止め忘れがないこと**（受け入れ基準）

### 6.2 描画（毎フレーム、2D context）

1. `ctx.imageSmoothingEnabled = false`（pixelArt 統一）
2. 背景: `/images/ui/aquarium-bg.png`（§8.4。未用意の場合は上から `#173e5e→#0b2036` の縦グラデ + 半透明の泡円を数個描画）
3. 水面ライン（上端から24px、白の半透明波線 or 単純な明るい帯）
4. 餌ペレット（沈降中のもの）
5. 魚（後述のスプライト描画）
6. 各魚の頭上ラベル: `名前 Lv{n}`（小フォント、白＋黒縁取り）。満腹中は右に `💤`
7. 照準: 上端に `▼` マーカーを現在の狙いx位置に描画。投下クールダウン中は半透明

魚スプライト描画:
- `new Image()` で `getFishImagePath(fishId)` をロード（モーダル初回オープン時にプリロードし `Map<fishId, HTMLImageElement>` にキャッシュ）
- サイズ: 基準 96px 四方 × `growthStage.spriteScale`
- 進行方向が左向きなら `ctx.scale(-1, 1)` で水平反転（元画像の向きを1枚確認し、正方向を合わせる）
- 遊泳の揺れ: `y += sin(time * 2 + 個体位相) * 3`
- 餌に向かっている魚はわずかに傾ける（`ctx.rotate` ±0.15rad 程度）

### 6.3 魚の遊泳AI（フレームレート非依存。`dt` 秒で積分）

各魚のランタイム状態（セーブしない。モーダルオープン時に初期化）:

```typescript
interface AquariumFishRuntime {
  aquariumIndex: number;
  x: number; y: number;        // 現在位置
  vx: number; vy: number;      // 速度
  targetX: number; targetY: number;
  nextWanderAt: number;        // 次に目的地を変える時刻
  mode: 'wander' | 'seek';     // seek = 餌に向かっている
  phase: number;               // 揺れ用の個体位相（乱数）
}
```

- 遊泳領域: x ∈ [60, 900], y ∈ [80, 470]（水面と底・左右壁からマージン）
- wander: 2〜5秒ごとに領域内のランダム点を `target` に設定。`target` へ向かう方向へ加速（最大速度 60px/s、加速 40px/s²、
  ヌシほど少し遅く: `最大速度 × (1.1 - 0.05 × growthLevel)` で重量感を出す）
- seek（餌あり時）: 満腹でない魚は最寄りの餌ペレットを `target` にし、最大速度 110px/s で直行
- 到達判定: 魚中心と餌の距離 < 14px で「食べた」。同フレームに複数居たら距離最小の1匹
- 食べた後: その魚は満腹になり `wander` に戻る。他の seek 中の魚は残りの餌がなければ `wander` に戻る

### 6.4 餌の投下と落下

```typescript
interface FoodPellet { x: number; y: number; swayPhase: number; }
```

- 入力: マウス移動 or ←→キー（キーは 300px/s で照準移動）で `aimX` を更新（範囲 [60, 900] にクランプ）
- 投下: クリック or Z/Space。条件: `aquariumFoodCount > 0` かつ前回投下から `AQUARIUM_FEED_COOLDOWN_MS` 経過
  - 成立時: `aquariumFoodCount--`（即時セーブはせず、食べた時と close 時にまとめて `savePlayerData`）、
    ペレットを `{x: aimX, y: 30}` で生成、ヘッダーのフード数表示更新
  - フード0で投下しようとしたら、フッターのヒントを一時的に「フードがない！ショップの「どうぐ」で買える」に差し替え（3秒）
- 落下: `y += 55 * dt`、`x += sin(time*3 + swayPhase) * 12 * dt`（ゆらゆら）。`y > 500`（底）で消滅
- 同時に存在できるペレットは最大3（それ以上は投下不可。狙い撃ちの体験を保つ）

### 6.5 摂食演出と成長

食べた瞬間（`feedAquariumFish` が `ok: true`）:
- 魚の頭上にハート `♥` を1秒フロート表示（canvas 描画でよい）
- `leveledUp: true` の場合: 魚を中心に白いリング拡大エフェクト（0.5秒）＋
  既存のトースト（`showResult`）で「コイが 若魚 に成長した！ パワーボーナス +1.0pt」
- Book UI のアクアリウムタブが背後で開いている場合は、閉じて戻ったときに最新化されるよう
  `switchUnifiedBookTab('aquarium')` 経由の再描画に任せる（水槽ビュー close 時に
  `unifiedBookTab === 'aquarium'` なら `updateUnifiedBookList()` + `updateUnifiedBookDetail()` を呼ぶ）

### 6.6 パフォーマンス・ライフサイクル

- RAF ループは水槽ビュー表示中のみ。魚3匹+ペレット3個の 2D 描画なので最適化は不要だが、
  `document.hidden` 時は `dt` を 50ms にクランプして復帰時のワープを防ぐ
- 画像ロード失敗時（パス不備等）: その魚は絵文字 `fish.emoji` を `ctx.fillText`（48px）で代替描画（機能を止めない）

---

## 7. ステータスボーナス統合

**統合ポイントは1箇所**にする。`src/data/skills.ts` の `getSkillStatBonuses()` の返却直前で合算する:

```typescript
// skills.ts（既存の集計ループの後に追記）
import { getAquariumStatBonuses } from './aquarium';

const aq = getAquariumStatBonuses(playerData);
bonuses.castDistSkillAdd += aq.powerAdd;
bonuses.gaugeSpeedSkillAdd += aq.speedAdd;
bonuses.barRangeSkillAdd += aq.techniqueAdd;
bonuses.fightBarDragSkillAdd += aq.controlAdd;
```

これにより追加変更なしで以下すべてに反映される（呼び出しグラフ調査済み）:
- キャスト距離（`GameScene` L2958 付近: `getEffectiveSkillStatBonuses` → `getSkillStatBonuses`）
- ファイトの判定帯/ゲージ速度/バー追従（`fightSimulation.resolveSkillBonuses`）
- Book Status タブの4能力表示（`calculateDisplayStatIndices`）

注意:
- `import` の循環を作らない（§3.2 の依存ルールを厳守。`aquarium.ts` は `skills.ts` を import しないこと）
- 実装後、Statusタブの表示値が「水槽に魚を入れる前後」で変わることを確認する（受け入れ基準）
- `sellPriceSkillMul` / `junkRateSkillMul` には触れない（アクアリウムは4ステのみ）
- デバッグパネル（`balanceDebug.ts` の `setDisplayStatIndexTarget`）は `getSkillStatBonuses` 基準で逆算しているため、
  アクアリウム込みの値で逆算される。挙動として一貫するので追加対応不要

---

## 8. スタイル指定

### 8.1 共通ルール（`.cursor/rules/book-ui-style-baseline.mdc` 準拠）

- 新規UIの枠は `ui-frame-box` を基本にし、非選択 `uiframe.png` / 選択・active は `border.png`
- 選択状態は outline 単体ではなく「枠切り替え + `--frame-fill-color` 塗り」で表現
- 色・余白・文字サイズは `src/style.css` の既存 token（`:root` 変数）を優先し、直値追加は最小限
- `src/style.css` の末尾に `/* ===== アクアリウム ===== */` セクションを新設し、
  タブ用（`aquarium-slot-item` 等）と水槽ビュー用（`aquarium-modal` 等）をまとめる

### 8.2 アクアリウムタブ

- 左ペインのスロットカードは Bag タブのカード寸法感に合わせる（高さ・余白は既存 token 流用）
- 空きスロットは破線風の控えめ表現（`opacity: 0.7` + 中央に `＋`）。ただし枠画像は `uiframe.png` のまま
- 成長ゲージは既存のゲージ表現（クエスト進捗バー）と同系の見た目にする

### 8.3 水槽ビュー

- モーダルの重なり順・背景暗転は既存モーダル群（shop 等）の実装に合わせる（`openModal` のスタック機構が処理する）
- `aquarium-canvas-wrap` は `image-rendering: pixelated`、`aquarium-frame` は `ui-frame-box`
- 最大幅 min(90vw, 1100px)、canvas は 16:9 を維持

### 8.4 画像アセット（新規。**用意できない場合の代替を必ず実装**）

| パス | 内容 | 代替（アセットなしでも機能すること） |
|---|---|---|
| `public/images/ui/aquarium-bg.png` | 水槽内背景 960×540 目安（水中、ピクセルアート調） | 縦グラデ + 泡の手続き描画（§6.2） |
| `public/images/ui/icon/icon_aquarium.png` | Bookタブアイコン（既存 icon_*.png と同寸） | 暫定で `icon_bag.png` を指定し `// TODO: アイコン差し替え` |
| `public/images/items/アクアリウム.png` | ショップ用アイテム画像 | 絵文字 🐠 フォールバック（既存機構） |
| `public/images/items/アクアリウムフード.png` | 同上 | 絵文字 🥫 フォールバック（既存機構） |

画像生成が可能な環境なら、既存アイテム画像（`public/images/items/*.png`）とトーンを揃えたピクセルアートで作成する。

---

## 9. 実装手順（この順で進める。各フェーズ末尾の確認を通してから次へ）

### Phase 1: データ層
1. `src/data/aquariumConfig.ts` 新規作成（§3.1。`fishTypes.ts` の実際の enum 定義を確認して合わせる）
2. `src/data/aquarium.ts` 新規作成（§3.2。全関数を実装）
3. `inventory.ts`: `PlayerData` 拡張 + `createInitialPlayerData` + `loadPlayerData` 補完（§3.3）
4. **確認**: `npx tsc --noEmit`（または `npm run build`）が通る。旧セーブ（3フィールドなし）を localStorage に入れた状態でロードして例外が出ない

### Phase 2: ショップ
1. タブラベル「バッグ」→「どうぐ」（§4.1）
2. `shopConfig.ts` に `ToolConfig` / `toolConfigs` / `getToolById` / 画像マップ追記（§4.2）
3. `updateShopContent()` の inventory 分岐拡張 + `handleInventoryUpgrade` 分岐 + `handleToolPurchase` 新設 +
   キーボードナビの itemCount 更新（§4.3, §4.4）
4. **確認**: どうぐタブに6行並ぶ / フードはアクアリウム未所持だと買えない / アクアリウムは一度買うと「購入済み」/
   フードは繰り返し買え所持数が増える / 金額不足メッセージ / キーボード上下で6行目まで到達できる

### Phase 3: Book UI アクアリウムタブ
1. 型ユニオン・`unifiedBookTabOrder`・HTMLテンプレにタブ追加（§5.1）
2. `getVisibleUnifiedBookTabOrder()` 新設と `unifiedBookTabOrder` 参照箇所の置換（`rg` で全箇所確認）
3. `updateAquariumTabVisibility()` 新設、購入時と起動時に呼ぶ
4. `updateUnifiedBookList()` / `updateUnifiedBookDetail()` に `aquarium` 分岐（§5.3, §5.4）と CSS 追加
5. 出し入れ操作（`addFishToAquarium` / `removeFishFromAquarium` 呼び出し + 再描画 + セーブ）
6. **確認**: 未所持だとタブ非表示かつ Q/E 巡回でスキップされる / 購入直後にタブ出現 /
   バッグ→水槽→バッグの往復で魚が消えたり増えたりしない（サイズ維持・成長リセット）/ ゴミは入れられない /
   水槽3匹で「入れる」導線が塞がる / バッグ満杯時は取り出せない

### Phase 4: 水槽ビュー
1. `MODAL_IDS.AQUARIUM` + `createAquariumUI()` + open/close（§6.1）
2. 描画ループ（背景・魚・ラベル・照準）と遊泳AI（§6.2, §6.3）
3. 餌の投下・落下・摂食判定・満腹（§6.4）と演出（§6.5）
4. **確認**: 魚が滑らかに泳ぎ端で外に出ない / 反転が自然 / 餌が狙った x に落ちる / 近い魚が先に食べる /
   満腹の魚は無反応 / フード0で投下できず案内が出る / レベルアップ演出とトースト /
   ESC・✕で閉じて Book に戻り、RAF が止まっている（DevTools Performance で確認）/ 閉じたあとセーブされている

### Phase 5: ステータス統合
1. `skills.ts` の `getSkillStatBonuses` に合算追記（§7）
2. **確認**: 水槽に魚を入れると Status タブの該当ステ表示が上がる / 成長Lvが上がるとさらに上がる /
   取り出すと戻る / キャスト距離・ファイト挙動に反映（体感確認でよい）

### Phase 6: 仕上げ
1. `ReadLints`（リンター）と `npx tsc --noEmit` を通す
2. §10 の受け入れ基準を全チェック
3. 旧セーブ読み込み回帰の再確認

---

## 10. 受け入れ基準

### 機能
- [ ] ショップ第4タブのラベルが「どうぐ」で、バッグ拡張4種+アクアリウム+フードの6行が表示される
- [ ] アクアリウム購入で Book UI に Aquarium タブが即時出現する（リロード後も維持）
- [ ] 水槽に魚を最大3匹入れられ、ゴミは入れられない
- [ ] 餌やりで `feedCount` が増え、しきい値到達で成長Lvと表示倍率・ボーナスが上がる
- [ ] 満腹（90秒）中の魚は餌に反応しない。残り時間がタブ右ペインに表示される
- [ ] ボーナスが Status タブの数値・キャスト距離・ファイトに反映される
- [ ] 取り出しで成長リセットの2段階確認が出る。バッグ満杯時は取り出せない
- [ ] フード購入はアクアリウム所持が前提。所持数はショップとタブと水槽ビューで一致する

### 操作・体験
- [ ] 水槽ビューで魚が常時アニメーションして泳ぐ（静止しない、壁抜けしない、進行方向を向く）
- [ ] 餌は狙った横位置に投下され、最も近い（満腹でない）魚が先に到達して食べる
- [ ] マウスとキーボード（←→ + Z/Space + ESC）の両方で餌やりが完結できる
- [ ] Book UI のタブQ/E巡回・左右端遷移がアクアリウムタブ表示/非表示の両状態で破綻しない

### 回帰
- [ ] 旧セーブ（新フィールドなし）が例外なく読み込め、既存の所持品・進行が保持される
- [ ] ショップの竿/エサ/ルアータブ、バッグ拡張の購入が従来どおり動く
- [ ] アクアリウム未所持のプレイヤーで、既存の全タブ・全モーダルが従来どおり動く
- [ ] 水槽ビューを閉じたあと RAF・setInterval がリークしていない
- [ ] 水槽内の魚が売却（まとめ売り含む）・クエスト納品の対象にならない

---

## 11. バランス初期値と調整方針

- 本文中の数値（価格12,000G/フード300G、満腹90秒、成長しきい値 5/15/35/65、レア度基礎値）はすべて **初期値**。
  `aquariumConfig.ts` に集約してあるので、プレイテスト後はこのファイルだけで調整する
- フル成長のコスト感（設計意図）: 1匹をヌシにするには餌65回 ≒ フード代 約2,000G + 実時間 約100分（満腹90秒律速）。
  「毎日少しずつ世話をする」ペース配分を狙っている。速すぎる/遅すぎるはしきい値と満腹時間で調整
- 同種スタック（同じ伝説魚×3）が強すぎる場合は、`getAquariumStatBonuses` に「同一 fishId の2匹目以降は50%」の
  逓減を入れる（初期実装ではやらない。調整フックとしてコメントを残す）
- 経済への影響: ボーナスは4ステのみで、売値・レア度出現率には影響させない（釣りエサ/ルアーの役割を侵食しない）

---

## 12. スコープ外・将来拡張（実装しないが設計で閉ざさない）

- 水槽の装飾・背景テーマ切替（`ToolConfig` に非消費どうぐを足すだけで拡張可能な構造にしてある）
- 水槽容量拡張（`AQUARIUM_CAPACITY` を定数化済み。UIはスロット数可変で書けるなら可変に）
- アクアリウム連携の実績・クエスト（「魚をヌシに育てる」等）
- 餌の種類追加（成長効率が違う高級フード等。`tool_*` の追加 + `feedAquariumFish` の引数拡張で対応可能）
- 魚のなつき度・鑑賞ボーナス等の情緒的要素

---

## 13. 実装時の判断優先順位

1. **既存機能を壊さない**（回帰基準 §10 を最優先）
2. 本仕様書の明記事項
3. `BOOK_UI_STYLE_GUIDE.md` / 既存画面（Book UI・Shop UI）との一貫性
4. 判断に迷う細部（演出の微調整・色味など）は既存画面の類例に寄せ、独自判断で先に進めてよい。
   ただしデータ構造・セーブ形式・関数シグネチャは本仕様書から変えない（変える場合は理由をコミットメッセージに残す）
