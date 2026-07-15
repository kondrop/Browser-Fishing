# クエストタブ UI ブラッシュアップ 作業指示書

Book UI（統合ブック）の「Quests」タブを、実績タブの流用デザインから
「クエスト管理画面」として再設計するための実装指示書。
この文書の指示どおりに実装すれば、実装者（人間/AI）によらず同じ結果になることを目的とする。

---

## 0. ゴールとスコープ

### ゴール
- クエストタブを「受注中クエストの管理」と「完了履歴の確認」ができる画面にする
- 掲示板カード（`quest-card`）や HUD と情報表現を揃え、一目でクエストの種類・進捗・報酬が分かるようにする
- 実績タブからの class 流用をやめ、クエスト専用の構造・スタイルにする（ただし共有 JS フックは維持。§5.4 参照）

### スコープ（変更対象）
- `src/scenes/GameScene.ts` のクエストタブ関連メソッド（§3 に列挙）
- `src/style.css`（クエストタブ用セクションの新設）

### スコープ外（変更禁止）
- データ層: `src/data/quests.ts`, `src/data/questConfig.ts`, `src/data/questGenerator.ts`, `src/data/inventory.ts`
  （表示専用ヘルパーの追加も不可。表示整形は GameScene 側で行う）
- 掲示板モーダル（`createQuestBoardUI` / `updateQuestBoardContent` と `.quest-board-*`, `.quest-card` の CSS）
- クエスト HUD とそのポップオーバー（`updateQuestHudUI`, `showQuestHudPopover`, `buildQuestCardHTML`）
- 実績タブの見た目・挙動（`achievement-*` の既存 CSS を変更しないこと。§5.4 の方針で回避する）
- クエストの新機能追加（放棄・並び替え・日次リセット等はこの作業では実装しない）

---

## 1. 前提: クエストシステム仕様（コードから抽出済み。再調査不要）

| 項目 | 仕様 | 根拠 |
|------|------|------|
| 同時受注上限 | 3件（`MAX_ACTIVE_QUESTS`） | `src/data/questConfig.ts` |
| 掲示板の掲載数 | 常時9件を動的生成で補充（`BOARD_QUEST_COUNT`） | `src/data/questGenerator.ts` `ensureBoardQuests` |
| 受注方法 | ワールド上の掲示板に近づき F キー → 掲示板モーダルから受注。Book UI からは受注できない | `GameScene.ts` `openQuestBoard` / `isNearBulletinBoard` |
| 完了 | 進捗が目標に達すると**自動完了**。報酬（money / exp）が即時付与され、`completedQuestIds` に移動 | `src/data/quests.ts` `finalizeQuest` |
| 放棄・期限 | **存在しない**。受注したら完了するまで残る | 該当コードなし |
| 進捗の単位 | 種別ごとに `匹` / `個` / `G` / `回` / 空文字。`getQuestProgressDisplay()` が `{current, target, unit}` を返す（current は target でキャップ済み） | `src/data/quests.ts` |
| 進捗率 | `getQuestProgressRatio()` が 0〜1 を返す | 同上 |
| クエスト分類 | `getQuestGroup()`（GameScene 内 private）が `fishing(釣り)` / `collection(収集)` / `challenge(その他)` を返す | `GameScene.ts` |
| アイコン | `quest.thumbnailImage`（動的クエストは魚/ゴミ/道具画像）→ なければ `condition.fishId` の魚画像 → なければ `quest.emoji`。`buildQuestCardIcon()` がこのロジックを実装済み | `GameScene.ts` |
| 完了一覧の並び | 名前の日本語ロケール順（変更しない） | `src/data/quests.ts` `getCompletedQuests` |
| 動的クエスト | タイトル・説明・報酬は生成済みの文字列/数値。表示側で加工しない | `src/data/questGenerator.ts` |

**再描画のトリガー**（既存のまま。呼び出し箇所は変更しない）:
魚の売却・釣り上げ・掲示板での受注時に、クエストタブが開いていれば
`updateUnifiedBookList()` + `updateUnifiedBookDetail()` が呼ばれる。
したがって **既存メソッド名とシグネチャを維持すれば再描画対応は不要**。

---

## 2. 現状の構造と課題

### 現状の構造
- 左ペイン: `createQuestLogCategoryItem()` が「受注中」「完了」の2カテゴリカードを生成。
  class は実績タブと共通の `achievement-category-item book-ui-node ui-frame-box`。
- 右ペイン: `updateQuestLogDetail()` が `buildQuestCardHTML()` を使い、
  実績カード（`achievement-detail-item` 系）と同一レイアウトでクエストを列挙。
- 選択・キーボード操作は実績タブの仕組み（`achievementNavArea`,
  `achievementDetailSelectedIndex`, `handleAchievementRightPaneNavigation` 等）を共用。

### 課題（この作業で解消するもの）
1. **「完了」カードのセグメントが完了数ぶん無限に増える**
   （`segCount = Math.max(count, 1)`）。完了100件で100個並ぶ設計になっている。
2. **カードにアイコンがない**。掲示板カードや HUD ではサムネイル画像/絵文字を出しているのに、
   クエストタブのカードはテキストのみで連続性がない。
3. **クエスト分類（釣り/収集/その他）が表示されない**。掲示板ではリボンで表示している。
4. **受注枠（3枠）の空き状況が右ペインで分からない**。受注中0〜2件のとき、空き枠の存在と
   「掲示板で受注する」という導線が伝わらない。
5. **右ペインのプレースホルダーが図鑑用の「魚を釣り上げよう！」のまま**
   （`#book-detail-placeholder`。通常は初期カテゴリ自動選択で隠れるが、DOM 上は残っている）。
6. **完了一覧が受注中と同じ大型カード**で、件数が増えると一覧性が悪い。
7. class 名がすべて `achievement-*` で、クエスト固有のスタイル調整ができない。

---

## 3. 変更対象のコード一覧（`src/scenes/GameScene.ts`）

行番号は目安（ずれている可能性あり）。**関数名で検索して特定すること**。

| 関数 / 箇所 | 現状 | この作業での扱い |
|---|---|---|
| `createQuestLogCategoryItem(category, count, index)` (~L7431) | 実績流用のカテゴリカード生成 | **書き換え**（§4.2） |
| `selectQuestLogCategory(category, index)` (~L7472) | カテゴリ選択 | 変更不要 |
| `updateQuestLogDetail(category)` (~L7547) | 右ペイン描画 | **書き換え**（§4.3, §4.4） |
| `buildQuestCardHTML(quest, isCompleted, hideProgressUnit)` (~L7489) | カード HTML 生成。**HUD ポップオーバーと共用** | **変更禁止**。クエストタブ用に新関数を追加し、本関数の呼び出しを `updateQuestLogDetail` から外す（ポップオーバー用として残す） |
| `buildQuestCardIcon(quest)` (~L7799) | アイコン HTML 生成（掲示板用） | 変更せず **再利用** |
| `getQuestGroup(quest)` (~L7785) | 分類判定（掲示板用） | 変更せず **再利用** |
| `updateUnifiedBookList()` の `quest` 分岐 (~L6471) | カテゴリカード2枚を生成 | ロジック変更不要（`createQuestLogCategoryItem` の中身だけ変わる） |
| Book UI テンプレート内 `#book-detail-placeholder` (~L4464) | 「魚を釣り上げよう！」固定 | **タブ別テキスト対応**（§4.5） |
| `switchUnifiedBookTab(tab)` (~L4693) | `data-tab` 属性切替 | §4.5 のプレースホルダー切替を追記 |

キーボードナビ関連（`enterAchievementRightPane`, `handleAchievementRightPaneNavigation`,
`syncAchievementDetailKeyboardSelection`）は実績タブと共用のため**変更禁止**。
これらは `.achievement-detail-list .achievement-detail-item` セレクタで要素を探すので、
新 DOM でもこの2つの class を JS フックとして残す（§5.4）。

---

## 4. 新しい UI 仕様

### 4.1 全体レイアウト

2ペイン構成は維持する（Book UI の他タブと統一するため）。

```text
┌─ 左ペイン ──────────┐ ┌─ 右ペイン（スクロール） ──────────────┐
│ ┌─────────────────┐ │ │ [受注中選択時]                          │
│ │ 受注中     2/3  │ │ │  ┌ クエストカード（受注中1件目）┐      │
│ │ ▣ ▣ □          │ │ │  ┌ クエストカード（受注中2件目）┐      │
│ └─────────────────┘ │ │  ┌ 空きスロットカード          ┐      │
│ ┌─────────────────┐ │ │                                        │
│ │ 完了       8件  │ │ │ [完了選択時]                            │
│ └─────────────────┘ │ │  ┌ 完了行（コンパクト）┐ × 件数        │
└─────────────────────┘ └────────────────────────────────────────┘
```

### 4.2 左ペイン: カテゴリカード

`createQuestLogCategoryItem()` を以下の仕様に書き換える。

**共通**
- ルート要素 class: `quest-log-category book-ui-node ui-frame-box`
  （`achievement-category-item` は**付けない**。左ペインのキーボード選択は
  `unifiedBookListItems` 配列ベースなので class 依存はない）
- `data-category` / `data-index` 属性、click で `selectQuestLogCategory()` 呼び出しは現状維持
- 選択状態は既存同様 `.is-selected` の付け外し（`selectQuestLogCategory` 側は変更不要）

**「受注中」カード**

```html
<div class="quest-log-category book-ui-node ui-frame-box" data-category="active" data-index="0">
  <div class="quest-log-category__head">
    <span class="quest-log-category__name">受注中</span>
    <span class="quest-log-category__count"><b>2</b>/3</span>
  </div>
  <div class="quest-log-category__slots" role="img" aria-label="受注中 2/3">
    <!-- MAX_ACTIVE_QUESTS 個固定。受注済み = --on, 空き = --off -->
    <span class="quest-log-slot-seg quest-log-slot-seg--on"></span>
    <span class="quest-log-slot-seg quest-log-slot-seg--on"></span>
    <span class="quest-log-slot-seg quest-log-slot-seg--off"></span>
  </div>
</div>
```

- セグメントは常に `MAX_ACTIVE_QUESTS`（=3）個。既存の `.achievement-category-seg` の
  見た目を `quest-log-slot-seg` として複製する（CSS は新規セレクタで定義。§5.2）。

**「完了」カード**

```html
<div class="quest-log-category book-ui-node ui-frame-box" data-category="completed" data-index="1">
  <div class="quest-log-category__head">
    <span class="quest-log-category__name">完了</span>
    <span class="quest-log-category__count"><b>8</b>件</span>
  </div>
</div>
```

- **セグメント行は出さない**（課題1の解消）。件数のみ表示。
- 2枚のカードの高さは揃えなくてよい（内容に応じた高さで可）。

### 4.3 右ペイン:「受注中」ビュー

`updateQuestLogDetail('active')` の描画内容。

- リストコンテナ: `class="achievement-detail-list quest-log-list"`
  （`achievement-detail-list` はキーボードナビの JS フック。§5.4）
- **常に `MAX_ACTIVE_QUESTS`（=3）行を描画**する:
  受注中クエスト分は「クエストカード」、残りは「空きスロットカード」。
  これにより空き枠と受注導線が常に見える（課題4の解消）。

**クエストカード（1件分）**

新関数 `buildQuestLogItemHTML(quest: QuestConfig, isCompleted: boolean): string` を追加して生成する
（`buildQuestCardHTML` は触らない）。DOM 構造:

```html
<div class="achievement-detail-item quest-log-item ui-frame-box" data-quest-id="...">
  <div class="quest-log-item__inner">
    <div class="quest-log-item__icon ui-frame-box">
      <!-- this.buildQuestCardIcon(quest) の出力をそのまま挿入
           （.quest-card__icon-img / .quest-card__icon-emoji が入る） -->
    </div>
    <div class="quest-log-item__body">
      <div class="quest-log-item__top">
        <div class="quest-log-item__textcol">
          <div class="quest-log-item__titlerow">
            <span class="quest-log-chip quest-log-chip--fishing">釣り</span>
            <span class="quest-log-item__title">タイセイヨウサバが欲しい</span>
          </div>
          <p class="quest-log-item__desc">タイセイヨウサバを2匹釣り上げよう</p>
        </div>
        <div class="quest-log-item__reward">
          <!-- 既存の achievement-detail-reward ブロックと同じ構造を
               quest-log-reward__* に名前替えして流用（reward-label.svg も同じ） -->
        </div>
      </div>
      <div class="quest-log-item__progress">
        <div class="quest-log-item__track">
          <div class="quest-log-item__fill" style="width: 50%;"></div>
        </div>
        <div class="quest-log-item__meta">
          <span class="quest-log-item__progress-value">1 / 2 匹</span>
          <span class="quest-log-item__progress-value">50<span class="quest-log-item__progress-unit">%</span></span>
        </div>
      </div>
    </div>
  </div>
</div>
```

内容の決定ルール:

| 要素 | 値の出所 |
|---|---|
| 分類チップ | `this.getQuestGroup(quest)` → `label` を表示、`key` を modifier class（`--fishing` / `--collection` / `--challenge`）に使用 |
| アイコン | `this.buildQuestCardIcon(quest)` の返り値をそのまま挿入 |
| タイトル / 説明 | `quest.name` / `quest.description` |
| 報酬 | `quest.reward.money`（💰 nG）と `quest.reward.exp`（⭐ nEXP）。ない項目は行ごと省略。reward 自体が undefined ならブロックごと省略 |
| 進捗バー幅・% | `Math.round(getQuestProgressRatio(this.playerData, quest) * 100)` |
| 進捗テキスト | `getQuestProgressDisplay()` の `{current, target, unit}` → `current / target unit`（unit が空文字なら省略） |

**空きスロットカード**

```html
<div class="quest-log-slot-empty ui-frame-box" aria-label="空きクエストスロット">
  <span class="quest-log-slot-empty__label">空きスロット</span>
  <span class="quest-log-slot-empty__hint">マップの掲示板（Fキー）でクエストを受注できます</span>
</div>
```

- **`achievement-detail-item` class を付けない**こと。
  キーボードナビが `.achievement-detail-item` を検索するため、付けなければ
  空きスロットは自動的にナビ対象外になる（追加のナビ改修は不要）。
- click ハンドラなし（掲示板はワールド上の設置物なので、ここから開かない）。

**受注中0件のとき**: 空きスロットカード3枚のみを表示する。
現在の `quest-log-empty` テキスト表示は削除する（空きスロットのヒント文が導線を兼ねる）。
この場合キーボードナビ対象が0件になるため、既存コードと同様に
`this.achievementNavArea = 'left'` を設定すること（現在の空表示分岐と同じ処理）。

### 4.4 右ペイン:「完了」ビュー

`updateQuestLogDetail('completed')` の描画内容。件数が多くなる前提でコンパクトな行にする（課題6の解消）。

```html
<div class="achievement-detail-list quest-log-list quest-log-list--completed">
  <div class="achievement-detail-item quest-log-row ui-frame-box" data-quest-id="...">
    <div class="quest-log-row__icon"><!-- buildQuestCardIcon(quest) --></div>
    <div class="quest-log-row__textcol">
      <div class="quest-log-row__titlerow">
        <span class="quest-log-chip quest-log-chip--collection">収集</span>
        <span class="quest-log-row__title">環境美化</span>
      </div>
      <p class="quest-log-row__desc">ゴミを2個片付けよう</p>
    </div>
    <div class="quest-log-row__reward">
      <span class="quest-log-row__reward-line">💰 320G</span>
      <span class="quest-log-row__reward-line">⭐ 82EXP</span>
    </div>
    <img class="quest-log-row__clear" src="/images/ui/Book%20UI/clear.png" alt="クリア済み" decoding="async" />
  </div>
  <!-- × 完了件数分 -->
</div>
```

- 進捗バーは**表示しない**（完了＝常に100%のため）。
- 報酬は右端に小さくテキスト表示（受注中カードのようなラベル付きパネルは使わない）。
- `clear.png` は高さ 32px 程度に縮小して右端に表示（現状の中央大型スタンプはやめる）。
- 行全体をやや沈んだ表現にする: `quest-log-row` の `::before` / `::after` に
  `opacity: 0.6` を指定（実績の `unlocked` の 0.5 に準じた表現。本文テキストは不透明のまま）。
- 完了0件のとき: `quest-log-empty ui-frame-box` で
  「完了したクエストはまだありません。」を表示（既存の空表示を流用）。
  `this.achievementNavArea = 'left'` の設定も既存どおり。
- 並び順はデータ層のまま（名前順）。**ソートを追加しない**。

### 4.5 プレースホルダーのタブ対応（課題5）

`#book-detail-placeholder` のテキストが全タブ「魚を釣り上げよう！」固定なので、
`switchUnifiedBookTab(tab)` 内でタブに応じて差し替える処理を追加する:

- `tab === 'quest'` のとき: `クエストを選んでみよう！`
- `tab === 'achievement'` のとき: `カテゴリを選んでみよう！`
- それ以外: `魚を釣り上げよう！`（現状文言に戻す）

実装は `switchUnifiedBookTab` 内で
`this.unifiedBookDetailPlaceholderElement.textContent = ...` を設定するだけでよい。

---

## 5. スタイル指定（`src/style.css`）

### 5.1 追加場所と方針

- `style.css` 内の既存クエスト掲示板セクション（`.quest-board-*` / `.quest-card` 定義群、~L6800 付近）の
  直後に「クエストログ（Book UI クエストタブ）」セクションとして**新規追加**する。
- ルール（`.cursor/rules/book-ui-style-baseline.mdc` / `BOOK_UI_STYLE_GUIDE.md` 準拠）:
  - 枠は `ui-frame-box`。非選択 `uiframe.png` / 選択・hover・kb選択 `border.png`（`::after` の `border-image` 切替）
  - 選択表現は「枠切替 + `--frame-fill-color` の塗り」。`outline` 単体は使わない
  - **色の直値を新規追加しない**。下表の既存値・token のみ使用する

### 5.2 カラー・状態一覧（この値をそのまま使う）

| 対象 | 状態 | `--frame-fill-color` | 枠画像 |
|---|---|---|---|
| 左カテゴリカード `quest-log-category` | 非選択 | `#f2e2b6` | `border.png`（実績カテゴリと同じ扱い） |
| 〃 | 選択 `.is-selected` / hover | `#e8cfa6` | `border.png` |
| 〃 | キー操作中(`#book-ui.is-book-kb-input`)の hover 抑制 | `#cbb792` + `uiframe.png`（実績カテゴリの既存パターンを quest 用セレクタで複製） | |
| 受注中カード `quest-log-item` | 通常 | `var(--color-primitive-natural-sand-400)`（実績カードと同値） | `uiframe.png` |
| 〃 | キー選択 `.achievement-detail-item--kb-selected` | `#e8cfa6` | `border.png` |
| 空きスロット `quest-log-slot-empty` | 通常 | `var(--color-semantic-bg-nonactive)`（#d3cfbe） | `uiframe.png` |
| 完了行 `quest-log-row` | 通常 | `var(--color-primitive-natural-sand-400)` + 疑似要素 `opacity: 0.6` | `uiframe.png` |
| アイコン枠 `quest-log-item__icon` | 通常 | `#fffdf4`（掲示板 `.quest-card__icon` と同値） | `uiframe.png` |

補足:
- `quest-log-item` / `quest-log-row` には `--frame-scale: 4` を指定
  （`#book-ui .achievement-detail-item.ui-frame-box` の既存指定と同じ値。
  `achievement-detail-item` class 併用により継承されるが、明示しておく）。
- キー選択状態のセレクタは既存の
  `#book-ui .achievement-detail-item.ui-frame-box.achievement-detail-item--kb-selected` が
  そのまま効くため、**kb 選択用の新規 CSS は原則不要**。表示が崩れる場合のみ
  `quest-log-item` 側で上書きする。

### 5.3 各要素の寸法・タイポ

token を優先し、直値は下表の範囲のみ許可する。

| 要素 | 指定 |
|---|---|
| `quest-log-category` | `padding: 16px; display:flex; flex-direction:column; gap:8px;`（実績カテゴリと同じ） |
| `quest-log-category__name` | `font-size: var(--font-size-achievement-category-name); color: var(--color-semantic-text-primary);` |
| `quest-log-category__count` | `font-size: var(--font-size-achievement-category-count); color: var(--color-semantic-text-muted);` 数値部分(`b`)は `font-family: var(--font-family-display-numeric);` |
| `quest-log-slot-seg` | 既存 `.achievement-category-seg` / `--on` / `--off` の宣言をコピーして定義 |
| `quest-log-item__inner` | `display:flex; gap: var(--space-12); padding: var(--space-12);` |
| `quest-log-item__icon` | `width:64px; height:64px; flex-shrink:0;` 中央寄せ。内部 img は `width:48px; height:48px; object-fit:contain;` 絵文字は `font-size:28px;` |
| `quest-log-chip` | `font-size:11px; line-height:1; padding:3px 6px; color: var(--color-primitive-white);` modifier: `--fishing` → `background: var(--color-rarity-rare);` / `--collection` → `var(--color-primitive-green-600);` / `--challenge` → `var(--color-rarity-epic);`（掲示板リボンと同配色） |
| `quest-log-item__title` | 実績カードのタイトルと同じ token（`achievement-detail-item__title` の指定値を流用） |
| `quest-log-item__desc` | 同上（`__desc` 相当）。`color: var(--color-semantic-text-muted);` |
| `quest-log-item__track` / `__fill` | 既存 `.achievement-detail-item__track` / `__fill` と同値（高さ20px、`background: var(--color-semantic-bg-active)` 等）を新セレクタで複製 |
| 進捗・報酬の数値 | `font-family: var(--font-family-display-numeric);` |
| `quest-log-slot-empty` | `min-height: 72px;`（受注中カードとおおよそ高さを揃える）中央寄せ縦積み。`__label` は `color: var(--color-semantic-text-muted);`、`__hint` は `font-size: var(--font-size-body-sm);` |
| `quest-log-row` | `display:flex; align-items:center; gap: var(--space-8); padding: var(--space-8) var(--space-12);` |
| `quest-log-row__icon` | `width:40px; height:40px;` 内部 img `32px`、絵文字 `20px` |
| `quest-log-row__desc` | 1行省略: `overflow:hidden; text-overflow:ellipsis; white-space:nowrap;` |
| `quest-log-row__clear` | `height:32px; width:auto; image-rendering:pixelated; flex-shrink:0;` |

### 5.4 実績タブとの共存ルール（重要）

- キーボードナビの JS は `.achievement-detail-list` と `.achievement-detail-item` を
  セレクタとして使うため、**右ペインのナビ対象要素にはこの2 class を必ず残す**
  （§4.3, §4.4 の HTML 例のとおり）。これらは「JS フック」であり、
  クエストタブの**見た目の指定は必ず `quest-log-*` セレクタ側に書く**こと。
- 実績用 CSS（`achievement-detail-item__*` の子要素スタイル）は、新 DOM では
  子要素 class 名が `quest-log-*` になるため自然に適用されなくなる。
  `achievement-*` の既存宣言は**1行も変更しないこと**。
- 左ペインは `achievement-category-item` を外すため、`style.css` 内の
  `#book-ui[data-tab="quest"] ... .achievement-category-item` を含む既存セレクタ
  （~L3844, L3858 ほか）が空振りになる。これらの既存行から `[data-tab="quest"]` 側だけを
  消す変更は**しない**（実績側と同一宣言のため触らずに残してよい）。
  新規に `#book-ui[data-tab="quest"] #book-list-scroll .quest-log-category` 用の宣言を追加する。

---

## 6. 実装手順（この順で行う）

1. **左ペイン**: `createQuestLogCategoryItem()` を §4.2 の DOM に書き換え、
   §5.2 / §5.3 の CSS（`quest-log-category` 系）を追加する。
2. **右ペイン・受注中**: `buildQuestLogItemHTML()` を新設し、
   `updateQuestLogDetail('active')` を §4.3 の内容（クエストカード + 空きスロット3枠固定）に
   書き換える。CSS（`quest-log-item` / `quest-log-slot-empty` / `quest-log-chip` 系)を追加する。
3. **右ペイン・完了**: `updateQuestLogDetail('completed')` を §4.4 のコンパクト行に書き換え、
   CSS（`quest-log-row` 系）を追加する。
4. **プレースホルダー**: `switchUnifiedBookTab()` に §4.5 の文言切替を追加する。
5. **クリーンアップ**: `updateQuestLogDetail` から `buildQuestCardHTML` への参照が
   なくなったことを確認する（HUD ポップオーバー用の呼び出しは残る。削除しない）。
6. lint / `tsc` を通し、§7 の確認を実施する。

---

## 7. 受け入れ基準（すべて満たすこと）

### 機能
- [ ] 受注中 0/1/2/3 件の各状態で、右ペインに常に3枠（カード+空きスロット）が表示される
- [ ] 左「受注中」カードのセグメントが常に3個で、受注数ぶん点灯する
- [ ] 左「完了」カードにセグメントがなく、件数のみ表示される（完了数が増えても高さ不変）
- [ ] 受注中カードに アイコン / 分類チップ / タイトル / 説明 / 報酬 / 進捗バー+数値 が表示される
- [ ] 進捗の単位（匹/個/G/回/なし）が `getQuestProgressDisplay()` どおりに表示される
- [ ] `quest_earn_money`（目標300G等）のような大きい数値でもレイアウトが崩れない
- [ ] 完了ビューがコンパクト行で表示され、進捗バーが出ない
- [ ] 掲示板で受注→（Bookのクエストタブを開いた状態でも）タブ表示が即時更新される
- [ ] 魚を釣って進捗が進む/完了すると、開いているタブの表示が更新される
- [ ] 完了0件時に空メッセージが表示される

### 操作
- [ ] マウス: カテゴリ切替、hover 表現（塗り #e8cfa6 + border.png）が実績タブと同思想で動く
- [ ] キーボード: 左リスト ↑↓ でカテゴリ移動、→ で右ペインに入り ↑↓ でカード移動、← で左に戻る
- [ ] キーボード選択が**空きスロットに止まらない**（クエストカードのみ巡回する）
- [ ] キー選択中のカードが `#e8cfa6` + `border.png` でハイライトされる

### 回帰（壊していないこと）
- [ ] 実績タブの見た目・操作が変化していない
- [ ] クエスト HUD のポップオーバー（受注中スロットにホバー）が従来どおり表示される
- [ ] 掲示板モーダルの見た目・操作が変化していない
- [ ] Bag / Pedia / Skills / Status タブのプレースホルダー文言が「魚を釣り上げよう！」のまま
- [ ] `npx tsc --noEmit` がエラーなしで通る

### 確認手順の補足
- 動作確認: `npm run dev` → ゲーム内でマップ上部の掲示板に近づき F → クエスト受注 →
  Book UI（Bキー等で開く）→ Quests タブ。
- クエストを進める: 受注した条件に合う釣りを行う（`catch_junk` 系はゴミを釣ると進む）。

---

## 8. 判断に迷ったときの優先順位

1. この指示書の明記事項
2. `BOOK_UI_STYLE_GUIDE.md` と `.cursor/rules/book-ui-style-baseline.mdc`
3. 既存実績タブ / 掲示板カードの実装パターン（同じ思想に寄せる）

指示書に書かれていない新機能（放棄ボタン、ソート、フィルタ、掲示板を開くボタン等）は
**追加しない**こと。
