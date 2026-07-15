# アクアリウム機能 修正指示書

`feature/aquarium` ブランチのアクアリウム実装（`AQUARIUM_FEATURE_SPEC.md` ベース、
水槽ビューはモーダルではなく **Book UI アクアリウムタブ内の常時表示** に変更済み）に対する修正指示書。
実装レビューと実機動作確認（dev サーバー + ブラウザ操作）で発見した問題の修正と、UI改善を指示する。

---

## 0. 前提・スコープ

### 対象コード
- `src/scenes/GameScene.ts`（アクアリウム関連: `renderAquariumBookList` / `updateAquariumBookDetail` /
  `startAquariumTankLoop` / `tickAquariumView` / `drawAquariumView` / `tryDropAquariumFood` / `createAquariumUI` 等）
- `src/data/aquarium.ts` / `src/data/aquariumConfig.ts`
- `src/style.css` の「アクアリウム」セクション
- `public/images/ui/icon/`（タブアイコン。§3-1）

### スコープ外（触らないこと）
- データ構造・セーブ形式（`PlayerData.ownedTools / aquariumFoodCount / aquarium`、`AquariumFishEntry`）は変更しない
- ショップの購入ロジック（`handleToolPurchase` / `handleInventoryUpgrade`）は §3-2 の表示改善以外変更しない
- `skills.ts` のボーナス合算、`getVisibleUnifiedBookTabOrder` によるタブ巡回は**動作確認済み**。変更しない
- 既存タブ（Bag/Status/Skills/Achievements/Quests/Pedia）と釣りゲームプレイ本体
- `src/data/fishTypes.ts` の enum に対する既存の `tsc` エラー（`erasableSyntaxOnly`）は**既存問題**。修正しない

### 動作確認済み（壊さないこと。修正後の回帰チェック対象）
- どうぐタブ表示（バッグ4種+アクアリウム+フード）、フード購入で所持数加算・所持金減算
- アクアリウム未所持時のタブ非表示と、タブ巡回順からの除外（`getVisibleUnifiedBookTabOrder`）
- 水槽への魚追加 / 2段階確認つき取り出し（成長リセット）/ ゴミ除外
- 餌投下 → 魚が寄って食べる → feedCount増加・レベルアップトースト・満腹バッジ・リスト更新
- タブ切替・Book閉時の RAF / satiety interval / confirm timer の停止（リークなし確認済み）
- 旧セーブ互換（`loadPlayerData` のデフォルト補完）

---

## 1. 修正必須バグ（P0）

### FIX-1: 魚が進行方向と逆を向いて泳ぐ（向き反転ロジックの前提が逆）＋ 上下の傾き表現がない

**現象**: 水槽内で魚が右に移動しているとき左を向く（後ろ向きに泳ぐ）。実機で確認済み
（クマノミが `vx=+49` で移動中に左向きで描画された）。

**原因**: `drawAquariumView()` が「魚素材は右向き」前提で `vx < 0` のとき水平反転しているが、
実素材（`public/images/fish/*.png`）は **大半が左向き**。
目視確認済み: クマノミ・錦鯉・マグロ・メダカ・ハゼ・サケ = 左向き。アユは右向きに見える（例外あり）。

**修正方法**:
1. `aquariumConfig.ts` に右向き素材の例外リストを追加する:

```typescript
/** 素材が右向きに描かれている魚（既定は左向き） */
export const AQUARIUM_RIGHT_FACING_FISH: Set<string> = new Set([
  // 全素材を目視確認して追加すること（下記手順）
]);
```

2. **全魚素材の向きを確認する**: `public/images/fish/` の全PNG（ゴミ3種除く39枚）を1枚ずつ開いて
   頭の向きを確認し、右向きのものだけを上記 Set に `fishId` で追加する
   （`fishImageFileNames` の逆引きで fishId を特定）。判断が難しい正面向き等は「左向き扱い」でよい。
3. `AquariumFishRuntime` に `facing: -1 | 1` を追加（-1=左向き表示, 1=右向き表示。初期値 -1）。
   `tickAquariumView` で `Math.abs(runtime.vx) > 5` のときのみ `runtime.facing = runtime.vx > 0 ? 1 : -1` に更新する
   （微速時に向きがパタパタ切り替わるのを防ぐ）。
4. `drawAquariumView` の反転判定を差し替える:

```typescript
const baseFacesLeft = !AQUARIUM_RIGHT_FACING_FISH.has(entry.fishId);
// 素材の向きと表示したい向きが一致しないときだけ反転
const flip = baseFacesLeft ? runtime.facing === 1 : runtime.facing === -1;
if (flip) ctx.scale(-1, 1);
```

5. seek 時の傾き `tilt` は「表示上の進行方向に頭が下がる」ように符号を合わせ直す
   （`runtime.facing` 基準で計算。flip の中で描くなら符号反転に注意）。
6. **上下移動の傾き表現を追加する**（seek 時だけでなく常時）。魚は上下にも泳ぐため、
   進行方向に合わせて頭が上／下を向くように回転させる:
   - `AquariumFishRuntime` に `pitch: number`（現在の表示傾き。rad）を追加
   - 目標傾き: `targetPitch = Math.atan2(runtime.vy, Math.abs(runtime.vx))` を **±0.5rad にクランプ**
     （真上・真下を向くと不自然なので上限を設ける。ほぼ停止中 `speed < 8` のときは `targetPitch = 0`）
   - 急に折れ曲がらないよう毎フレーム補間する: `runtime.pitch += (targetPitch - runtime.pitch) * Math.min(1, dt * 6)`
   - 描画時は `ctx.rotate(...)` に渡す。**flip（水平反転）との合成順に注意**:
     反転を先に適用すると回転の符号が逆になるため、
     `ctx.scale(flip ? -1 : 1, 1)` → `ctx.rotate(runtime.pitch)` の順で適用し、
     「上に泳ぐとき頭が上がる」ことを左右両方の向きで目視確認すること
   - 既存の seek 用固定 `tilt`（±0.15rad）はこの pitch に**置き換えて廃止**する（二重回転にしない）

**受け入れ基準**: 左右どちらに移動していても頭が進行方向を向く。餌に向かうときも同様。
アユ等の右向き素材も正しい向きになる。微速時に向きが高速で振動しない。
上昇中は頭が上、下降中（餌へ向かう降下含む）は頭が下を向き、左右反転時も傾きの向きが正しい。

---

### FIX-2: 餌やりの進行がセーブされない（リロードで巻き戻る）

**現象**: 餌を与えて成長させたあとページをリロードすると、フード消費・feedCount・満腹状態が
タブを離れる前の状態に巻き戻る。

**原因**: `savePlayerData` が `stopAquariumTankLoop()`（タブ離脱/Book閉時）でしか呼ばれない。
`tickAquariumView` の摂食成立時と `tryDropAquariumFood` のフード消費時に保存がない
（`AQUARIUM_FEATURE_SPEC.md` §6.4 は「食べた時と close 時に保存」と規定）。

**修正方法**: `tickAquariumView` 内で `feedAquariumFish` が `ok: true` を返した直後に
`savePlayerData(this.playerData)` を追加する。摂食はクールダウン1.5秒で律速されるため毎回保存で問題ない。
`tryDropAquariumFood` のフード減算直後にも保存を追加する
（投下したまま誰も食べずタブを閉じた場合のフード消費も確定させる。これは現仕様どおり「無駄撃ちは消費」）。

**受け入れ基準**: 餌を1回与えた直後にページをリロードしても、フード残数と feedCount・満腹状態が保持されている。

---

### FIX-3: 水槽 canvas のアスペクト比が歪む（魚が横に伸びる）

**現象**: canvas 内部解像度は 960×540（16:9）だが、表示サイズが実測 650×304（2.14:1）で
横に約20%引き伸ばされて描画される。魚のドット絵が横長に歪む。

**原因**: `.aquarium-canvas-wrap` が `flex: 1` で親の残り高さに従うため `aspect-ratio: 16/9` が効かず、
canvas が `width:100%; height:100%` で追従して歪む。

**修正方法**（object-fit 方式。JSリサイズより簡単で確実）:
1. `src/style.css`:

```css
.aquarium-canvas-wrap canvas {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  cursor: crosshair;
  object-fit: contain;   /* 追加。レターボックスは wrap の背景色 #0b2036 が見える */
}
```

2. `createAquariumUI()` のマウス座標変換をレターボックス込みに修正する
   （click 側で座標を使う場合も同じ変換を通す。共通ヘルパーにしてよい）:

```typescript
const rect = this.aquariumCanvasEl.getBoundingClientRect();
const scale = Math.min(rect.width / 960, rect.height / 540);
const contentW = 960 * scale;
const offsetX = (rect.width - contentW) / 2;
const x = ((e.clientX - rect.left - offsetX) / contentW) * 960;
this.aquariumAimX = Math.max(60, Math.min(900, x));
```

**受け入れ基準**: ウィンドウサイズをいくつか変えても、表示中の canvas 描画領域が常に16:9
（魚の縦横比が素材どおり）。マウス位置と照準▼・餌の落下位置が一致する（レターボックスの左右余白でずれない）。

---

### FIX-4: 「バッグに戻す」ボタンが詳細枠からはみ出して見切れる

**現象**: 魚スロット選択時の詳細ボックス（`#aquarium-manage-detail`）で、コンテンツ高
（実測234px）が `max-height: 200px` を超え、「バッグに戻す」ボタンが枠線の外にはみ出して
下の要素に重なって描画される。実機スクリーンショットで確認済み。

**原因**: `.aquarium-manage-detail` は `overflow: auto` だが、`ui-frame-box` の枠画像（`::after`）が
要素境界に重なって描かれるため、スクロール末端のコンテンツが枠を突き抜けて見える。
そもそも詳細の情報量が 200px に収まっていない。

**修正方法**（情報を枠に収める方向で対応。スクロール前提にしない）:
1. `max-height: 200px` を撤廃し、`.aquarium-manage-top`（grid, `align-items: stretch`）の行高に任せる。
   左のスロット3枚（52px×3 + gap）と同程度の高さになるため、その中に収まるよう詳細をコンパクト化する:
   - `.aquarium-detail-thumb` を 56px → 40px
   - `.aquarium-detail-panel` の gap を 8px → 4px、`.aquarium-manage-detail` の padding を `8px 10px`
   - 「成長:」行とゲージを1行にまとめる（テキストの右にゲージを inline 配置してよい）
   - アクションボタンをコンパクト化: `font-size: 12px; padding: 4px 10px; min-height: 0;`
2. 保険として `overflow-y: auto` は残すが、枠と干渉しないよう内側に `padding-bottom: 10px` を確保し、
   1280×800 の標準ウィンドウでスクロールなしに全要素が収まることを必須とする。
3. 空きスロット選択時（バッグ魚リスト + 「水槽に入れる」ボタン）も同様に枠内に収まることを確認する。
   `.aquarium-bag-pick-list` の `max-height: 90px` は残してよい（こちらはリスト内スクロールで完結している）。

**受け入れ基準**: 魚スロット選択時・空きスロット選択時とも、ボタンを含む全要素が枠内に表示される。
どの状態でも枠線の外に要素が描画されない。2段階確認の長文ボタン
（「成長リセット。もう一度で確定」）でもはみ出さない。

---

## 2. 推奨修正（P1）

### IMP-1: Aquarium タブのアイコンが Bag タブと同一

現状 `icon_bag.png` を流用しており（TODOコメント残存）、タブ列に同じアイコンが2つ並ぶ。
**対応**: 専用アイコン `public/images/ui/icon/icon_aquarium.png` を用意する。
ピクセルアートを新規作成できない場合の暫定として、タブボタンの `<img>` の src を
`/images/fish/キンギョ.png` に差し替える（既存の `.book-tab-icon` のサイズ指定で縮小表示される。
透過PNGなのでそのまま使える）。TODOコメントは残す。

### IMP-2: ショップのフード行に所持数が表示されない

`updateShopContent()` で tool 行の `noteText` を `tool.description` で上書きしているため、
組み立て時に用意した「所持: n個 [消費]」が表示に出ない。エサタブは所持数が見えるのに、フードだけ見えない。
**対応**: どうぐタブの tool 行にも stat チップを出す。
- `const showStatRow = this.shopTab !== 'inventory';` を「inventory タブでも tool 行（`index >= inventoryUpgradeConfigs.length`）ならtrue」に変更
- tool 行のチップ: 消費型は `{ label: '所持', value: `${this.playerData.aquariumFoodCount}個` }` と
  `{ label: '分類', value: '消費' }`、非消費型は `{ label: '分類', value: 'どうぐ' }`
- `noteText` は `tool.description` のままでよい

### IMP-3: 満腹表示が時間経過で更新されない

リストの「満腹」バッジと詳細の「満腹（あと n 秒）」のうち、詳細テキストは1秒 interval で更新されるが、
**リストのバッジは再描画イベントが起きるまで残り続ける**（満腹が明けても表示されたまま）。
**対応**: 既存の `aquariumSatietyIntervalId` の callback（`updateAquariumBookDetail` 内で登録）を
タブ単位の interval に昇格し、以下を1秒ごとに実行する:
1. 詳細の満腹テキスト更新（現行どおり）
2. 各スロットのバッジ表示切替: `#aquarium-slots` の各 `.aquarium-slot-card` に対して
   `isSatiated` を再評価し、バッジ要素の追加/削除（もしくは `hidden` 切替）を行う。
   リスト全体の `renderAquariumBookList()` を毎秒呼び直すのは選択状態のチラつきの原因になるため**不可**。
   バッジ要素のみをトグルすること。
- interval の開始は `switchUnifiedBookTab('aquarium')` 時、停止は既存のタブ離脱/Book閉処理
  （`clearAquariumSatietyInterval` の呼び出し箇所は現行のまま）。

### IMP-4: 餌ペレットが小さすぎて見えない

内部半径4px は表示上 約3px になり、実機ではほぼ視認できない。狙って投下するゲーム性の要なのに
餌がどこにあるか分からない。
**対応**: `drawAquariumView` のペレット描画を半径 6px にし、視認性を上げる:

```typescript
ctx.fillStyle = '#e8c97a';
ctx.strokeStyle = 'rgba(255,255,255,0.8)';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.arc(pellet.x, pellet.y, 6, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();
```

到達判定の 14px は変更しない。

### IMP-5: 魚の動きが単調な周期運動で生き物らしくない

現状の遊泳は「2〜5秒ごとにランダムな目標点へ等加速で向かう + 常時サイン波の上下揺れ」のみで、
常に同じ調子で泳ぎ続けるため機械的に見える。停止→発進などの緩急と個体差を入れて有機的にする。

**対応**: `tickAquariumView` の wander を小さなステートマシンに置き換える。
`AquariumFishRuntime` に `state: 'cruise' | 'idle' | 'dash'`、`stateUntil: number`（状態終了時刻）、
`speedMul: number`（個体差係数）を追加する。seek（餌追跡）は現行のまま最優先。

| 状態 | 内容 | 継続時間 | 遷移 |
|---|---|---|---|
| cruise | 現行の目標点移動。ただし**到着減速**を入れる: 目標までの距離 `dist < 120` のとき目標速度を `maxSpeed * Math.max(0.25, dist / 120)` に落とす | 目標到達 or 2〜5秒 | 終了時に 40% で idle、10% で dash、50% で新目標の cruise |
| idle | その場で漂う。速度を毎フレーム減衰（`v *= 1 - Math.min(1, dt * 2)`）し、上下揺れのみ継続。まれに向きだけ反転してよい | 1〜4秒（乱数） | 終了時に 20% で dash、80% で cruise |
| dash | 短い加速で素早く泳ぎ出す。新目標を現在位置から 200〜400px 先に取り、加速 240px/s²・最大速度 150px/s | 0.5〜0.9秒 | 終了時に cruise |

- **個体差**: `initAquariumRuntimes` で `speedMul = 0.85 + Math.random() * 0.3` を設定し、
  cruise/dash の最大速度に掛ける（同じ魚種でも泳ぎに差が出る）
- **上下揺れの脱・単調化**: 現行の単一サイン波 `sin(t*2 + phase) * 3` を、周波数の異なる2波の合成
  `sin(t*1.7 + phase) * 2.5 + sin(t*0.9 + phase*1.3) * 1.5` に変更する（規則的な見た目を崩す）
- **目標点の深さ癖**: `initAquariumRuntimes` で個体ごとに `homeY = 120 + Math.random() * 280` を決め、
  cruise の目標 y を「乱数と homeY の中間」（`(rand + homeY) / 2`）にする。
  上層を好む個体・底を好む個体が生まれ、水槽全体に散らばる
- 満腹中の魚は idle になりやすくしてよい（idle 遷移確率を 40%→70%。任意）
- 数値はすべて `aquariumConfig.ts` に定数として置き、調整可能にする

**受け入れ基準**: 3匹入れて30秒眺めたとき、(1) 全員が同じテンポで泳ぎ続けない
（止まる個体・急に泳ぎ出す個体が観察できる）、(2) 目標付近で急停止せず減速して止まる、
(3) 泳ぐ速さに個体差がある、(4) FIX-1/pitch と組み合わせて挙動が破綻しない（餌への反応は現行どおり機敏）。

### IMP-6: 魚の表示スケールが水槽に対して小さすぎる + 種類差がない

現状は基準 96px ×成長倍率（0.55〜1.15）で、canvas 960×540 に対して小さく寂しい
（実表示ではさらに縮小される）。また 9cm のクマノミと 55cm の錦鯉がほぼ同じ大きさで描かれ、
種の体格差もない。

**対応**:
1. 基準サイズを **96px → 150px** に引き上げる（`aquariumConfig.ts` に `AQUARIUM_FISH_BASE_SIZE = 150` として定数化）
2. 種類差の係数関数を追加し、描画サイズに掛ける:

```typescript
/** 種の最大サイズ(cm)→描画係数。10cm級=0.7、120cm級以上=1.3 */
export function getAquariumSpeciesScale(maxSizeCm: number): number {
  const t = Math.min(1, Math.max(0, (maxSizeCm - 10) / 110));
  return 0.7 + t * 0.6;
}
```

3. `drawAquariumView` で
   `const size = AQUARIUM_FISH_BASE_SIZE * stage.spriteScale * getAquariumSpeciesScale(fish?.maxSize ?? 50);`
4. サイズ上限の確認: 最大ケース（ヌシ1.15 × 種係数1.3 × 150 ≒ 224px）が水槽高 540px に対して
   過大でないか実機で確認し、大きすぎる場合は基準サイズ側（150）を 130〜140 に下げて調整する
5. 遊泳領域のマージン（x: 60〜900, y: 80〜470）は、大型個体が水面・底に食い込まない程度に
   スプライト半径ぶん広げる/狭める調整をしてよい（`size/2` を考慮したクランプにするのが理想）
6. ラベル位置は `size/2` 基準の現行計算のままで追従する。到達判定 14px は変更しない
   （魚が大きくなるぶん体の中心まで近づく必要があるのが不自然なら、判定を `14 + size * 0.15` 程度に
   緩めてよい。任意）

**受け入れ基準**: 成魚（Lv4）の中型魚が水槽の高さの 1/4〜1/3 程度の存在感で表示される。
クマノミ（小型種）と錦鯉（大型種）で明確に大きさが違う。大型個体が壁・水面にめり込まない。

---

## 3. 任意改善（P2。時間があれば）

### OPT-1: 成長ゲージの数値表記が直感的でない

「成長: Lv3 若魚 16/35」（累計feed数/次Lvしきい値）に対し、バーは現Lv区間内の相対進捗
（16なら 1/20 = 5%）で、数値とバーの見た目が一致せず誤解しやすい。
**対応案**: テキストを「成長: Lv3 若魚（次まで あと19回）」に変更。バーは現行の相対進捗のまま。

### OPT-2: 魚がいない水槽への案内

水槽が空でも餌を投下でき、確実に無駄になる。
**対応案**: `playerData.aquarium.length === 0` のとき、
`drawAquariumView` で canvas 中央に「バッグの魚を水槽に入れよう」を描画し、
`tryDropAquariumFood` は投下せずヒント差し替え（フード0のときと同じ仕組み）で案内する。

### OPT-3: キーボードのみで餌やり・魚追加が完結しない

- 餌の照準がマウス専用（←→での照準移動が未実装。ヒント文言は「マウスでねらう」で整合は取れている）
- 空きスロット選択時のバッグ魚リスト（`.aquarium-bag-pick-row`）と「水槽に入れる」ボタンに
  キーボードで到達できない（Enter は `aquariumPendingBagIndex` 設定済みの場合のみ機能）

**対応案**（実装する場合）: 水槽ループの `bindAquariumKeys` に ArrowLeft/ArrowRight で
`aquariumAimX` を移動する処理を追加（300px/s 相当。keydown リピートで十分）。
ただし左スロットナビの←→（タブ移動）と競合するため、「最後にマウス/キーで触った領域」での
切替が必要になり複雑化する。工数対効果が低ければ**見送りでよい**（見送る場合はこの項目を報告に明記）。

---

## 4. 実装手順

1. **FIX-1**（向き反転 + 上下傾き）: 素材の目視確認 → `AQUARIUM_RIGHT_FACING_FISH` 作成 → facing/pitch 実装 → 実機で左右・上下移動を確認
2. **FIX-2**（セーブ）: 2行追加 → 給餌→リロードで保持確認
3. **FIX-3**（歪み）: CSS + 座標変換 → リサイズして比率と照準ズレ確認
4. **FIX-4**（はみ出し）: CSS/DOM調整 → 両選択状態で枠内収まり確認
5. **IMP-6**（表示スケール）を先に実施（IMP-5 の動きの調整はサイズ確定後のほうが手戻りがない）
6. **IMP-5**（有機的な遊泳）: ステートマシン実装 → 30秒鑑賞して受け入れ基準を確認
7. **IMP-1〜4** を順に実施
8. **OPT-1〜3** は任意。実施しなかったものは報告に明記
9. 最後に §5 の回帰チェックをすべて実施

各修正は独立性が高いため、1項目ずつ動作確認しながら進めること。

## 5. 受け入れ・回帰チェックリスト

### 修正確認
- [ ] 魚が常に進行方向を向いて泳ぐ（全所持魚で確認。最低でも左向き素材と右向き素材を1匹ずつ水槽に入れて確認）
- [ ] 上昇/下降時に頭が上/下に傾き、左右反転時も傾きの向きが正しい
- [ ] 魚の動きに緩急がある（停止→発進・個体差が観察できる）。単調なサイン波往復に見えない
- [ ] 魚の表示サイズが水槽に見合い、小型種と大型種で大きさが異なる
- [ ] 給餌直後のリロードでフード残数・成長・満腹が保持される
- [ ] canvas の描画が16:9を維持し、照準・餌落下位置がマウスと一致する（ウィンドウ幅を変えて確認）
- [ ] 詳細ボックスの全要素が枠内に収まる（魚選択時/空きスロット選択時/2段階確認表示時）
- [ ] タブアイコンが Bag と区別できる
- [ ] ショップのフード行に所持数が表示される
- [ ] 満腹バッジが満腹解除後ほどなく（1秒粒度で）消える
- [ ] 餌ペレットが視認できる

### 回帰（§0 の「動作確認済み」を再確認）
- [ ] フード購入・アクアリウム購入済み表示・「要: アクアリウム」ロック（未所持セーブで確認）
- [ ] 未所持時のタブ非表示とQ/E巡回スキップ
- [ ] 魚の出し入れ（成長リセット2段階確認、バッグ満杯時の抑止、ゴミ除外）
- [ ] 給餌→成長→レベルアップトースト→リスト/詳細更新→Statusタブのステータス数値反映
- [ ] タブ切替/Book閉で `aquariumRafId` と `aquariumSatietyIntervalId` が null になる（コンソールで確認）
- [ ] 他タブ（Bag/Status/Skills/Achievements/Quests/Pedia）の表示・操作が従来どおり
- [ ] `npx tsc --noEmit` で新規エラーが増えていない（`fishTypes.ts` の既存2件は無視）

## 6. 判断優先順位

1. §0 の「動作確認済み」項目を壊さない
2. P0（FIX-1〜4）を本指示どおりに修正する
3. P1（IMP-1〜6）は本指示の方針に従いつつ、細部は既存UI（Book UI/Shop UI）の一貫性に寄せる。
   IMP-5 の動きの数値（速度・確率・継続時間）は `aquariumConfig.ts` に定数化したうえで、
   「生き物らしく見える」ことを優先して微調整してよい
4. P2（OPT-1〜3）は任意。実施可否と理由を最終報告に含める
5. データ構造・セーブ形式は変更しない。変更が必要と判断した場合は作業を止めて報告する
