# 🐛 不具合トラッカー

このドキュメントは、プロジェクトで発生した不具合をカテゴリ別に整理し、症状・原因・解決法を記録するためのものです。

## 📋 目次

- [UI/スタイル関連](#uiスタイル関連)
- [状態管理関連](#状態管理関連)
- [イベント処理関連](#イベント処理関連)
- [パフォーマンス関連](#パフォーマンス関連)
- [データ整合性関連](#データ整合性関連)
- [その他](#その他)

---

## UI/スタイル関連

### BUG-UI-001: 実績タブ開閉後のグリッド列数が変わる問題

**発生日**: 2024年（記録時点）  
**重要度**: 中

#### 症状
- 初めからバッグまたは図鑑タブを開いた場合は正常に動作する
- 実績タブを一度開いてから、バッグまたは図鑑タブに戻ると、グリッドの列数が2列のままになる（本来は3列であるべき）
- グリッドレイアウトが崩れて表示される

#### 原因
`src/scenes/GameScene.ts` の `updateUnifiedBookList()` 関数において：

1. 実績タブ表示時にインラインスタイルで `gridTemplateColumns: 'repeat(2, 1fr)'` と `gridTemplateRows: 'repeat(4, 1fr)'` を設定していた
2. 実績タブ以外のタブ（バッグ・図鑑）に戻る際、これらのインラインスタイルがリセットされていなかった
3. インラインスタイルが残存していたため、CSSで定義されている `grid-template-columns: repeat(3, 1fr)` が適用されなかった

**問題箇所**: `src/scenes/GameScene.ts` 2246-2253行目

```typescript
// 実績タブ以外の場合は、実績タブ用のスタイルをリセット
if (this.unifiedBookTab !== 'achievement') {
  this.unifiedBookListScrollElement.classList.remove('achievement-list-container');
  this.unifiedBookListScrollElement.style.display = '';
  this.unifiedBookListScrollElement.style.flexDirection = '';
  this.unifiedBookListScrollElement.style.gap = '';
  this.unifiedBookListScrollElement.style.padding = '';
  // ❌ gridTemplateColumns と gridTemplateRows のリセットが抜けていた
}
```

#### 解決法
実績タブ以外に切り替える際のリセット処理に、`gridTemplateColumns` と `gridTemplateRows` のリセットを追加した。

**修正箇所**: `src/scenes/GameScene.ts` 2250-2251行目

```typescript
// 実績タブ以外の場合は、実績タブ用のスタイルをリセット
if (this.unifiedBookTab !== 'achievement') {
  this.unifiedBookListScrollElement.classList.remove('achievement-list-container');
  this.unifiedBookListScrollElement.style.display = '';
  this.unifiedBookListScrollElement.style.flexDirection = '';
  this.unifiedBookListScrollElement.style.gridTemplateColumns = '';  // ✅ 追加
  this.unifiedBookListScrollElement.style.gridTemplateRows = '';     // ✅ 追加
  this.unifiedBookListScrollElement.style.gap = '';
  this.unifiedBookListScrollElement.style.padding = '';
}
```

#### 教訓・対策
- **インラインスタイルを動的に設定する場合は、切り替え時に必ずリセットする**
- **スタイルリセット処理では、設定した全てのプロパティを網羅的にリセットする**
- **タブ切り替えなどの状態変更時は、前の状態のスタイルが残らないよう注意する**
- 同様の問題を防ぐため、スタイルリセット処理を関数化して一元管理することを検討

#### 関連ファイル
- `src/scenes/GameScene.ts`: `updateUnifiedBookList()` 関数
- `src/style.css`: `.book-list-scroll` クラス（906行目）

#### 関連事象: バッグ・図鑑タブ切り替えで詳細欄のスタイルが変わる
- **症状**: バッグと図鑑タブを行き来すると、右側の詳細欄の見た目（枠・余白など）が変わってしまう。
- **原因**: 実績タブから戻る際に呼ばれる `restoreBookDetailStructure()` の復元HTMLが、初期表示（`createUnifiedBookUI`）と異なり、`.book-detail-rarity-badge` や `.book-detail-stat-item` などに `ui-frame-box` が付与されていなかった。その結果、復元後の詳細欄だけ枠スタイルが欠けていた。
- **対応**: `restoreBookDetailStructure()` の復元テンプレートを初期HTMLと完全に同一にし、該当要素に `ui-frame-box` を付与。あわせて未選択時（プレースホルダー表示時）に画像コンテナのインライン背景スタイルをリセットするようにした。

---

### BUG-UI-002: 図鑑詳細の価格・サイズ表示のフォントスタイルが適用されない問題

**発生日**: 2024年（記録時点）  
**重要度**: 低

#### 症状
- 図鑑詳細画面の価格（`#book-detail-price`）とサイズ（`#book-detail-size`）のフォントスタイルが期待通りに適用されない
- `font-family: "Jersey 10"` と `font-size: 24px` が反映されず、デフォルトのスタイルが表示される
- ブラウザの開発者ツールで確認すると、IDセレクタのスタイルがクラスセレクタに上書きされている

#### 原因
`src/style.css` において：

1. `.book-detail-stat-value` クラスが `#book-detail-price` と `#book-detail-size` の両方に適用されている
2. IDセレクタ（`#book-detail-price`, `#book-detail-size`）を追加したが、CSSの読み込み順序や特異性の問題で、クラスセレクタ（`.book-detail-stat-value`）のスタイルが優先されていた
3. 最初は `!important` なしでIDセレクタを追加したが、ブラウザのキャッシュや他のスタイルの影響で適用されなかった

**問題箇所**: `src/style.css` 1422-1426行目

```css
.book-detail-stat-value {
  font-size: 28px;
  color: #212121;
  font-family: 'Jersey 10', 'DotGothic16', sans-serif;
}
/* ❌ IDセレクタを追加したが、!importantがないと適用されない場合がある */
```

#### 解決法
IDセレクタに `!important` を追加して、確実にスタイルが適用されるようにした。

**修正箇所**: `src/style.css` 1428-1436行目

```css
#book-detail-price {
  font-family: "Jersey 10" !important;
  font-size: 24px !important;
}

#book-detail-size {
  font-family: "Jersey 10" !important;
  font-size: 24px !important;
}
```

#### 教訓・対策
- **CSSの特異性（specificity）を理解する**: IDセレクタはクラスセレクタより特異性が高いが、読み込み順序や他の要因で期待通りに動作しない場合がある
- **`!important` は慎重に使用する**: 可能な限り避けるべきだが、既存のスタイルを上書きする必要がある場合は使用を検討する
- **ブラウザのキャッシュを考慮する**: スタイル変更後は、ハードリロード（Ctrl+Shift+R / Cmd+Shift+R）で確認する
- **開発者ツールで確認する**: 実際にどのスタイルが適用されているか、開発者ツールで確認する習慣をつける

#### 関連ファイル
- `src/style.css`: `.book-detail-stat-value` クラス（1422行目）、`#book-detail-price` IDセレクタ（1428行目）、`#book-detail-size` IDセレクタ（1433行目）
- `src/scenes/GameScene.ts`: 図鑑詳細表示の実装部分

---

### BUG-UI-003: 選択枠だけ差し替えるつもりが全体の枠画像も変わる

**発生日**: 2026-03-20  
**重要度**: 中

#### 症状
- 統合BookUI（`#book-ui`）左リストで、選択中以外のカード枠まで `border.png`（または別枠画像）になってしまった
- 「選択中だけ初期枠（border画像）にしたい」という意図と表示が一致しない

#### 原因
- `src/style.css` の `#book-ui #book-list-scroll .ui-frame-box::after` に対して、`border-image` を差し替えるルールを追加したが、当該セレクタが **リスト全体** にマッチしていた
- その後、`book-list-item.selected` に対する **上書き（override）** が十分に適用されず、結果的に非選択にも枠画像が反映された

#### 解決法
- ベースの差し替えルールは `uiframe.png` に戻し、影響範囲をリスト全体から限定
- `#book-ui #book-list-scroll .book-list-item.selected.ui-frame-box::after` のみを `border.png` にすることで、選択中カードだけ枠画像を変更

**修正箇所**: `src/style.css`（`#book-ui #book-list-scroll .ui-frame-box::after` 周辺）

#### 教訓・対策
- 「特定状態（selectedなど）だけに効かせたい」場合、差し替えは **最小セレクタ** で書く（まず“全体”に効かせない）
- 上書きが必要な場合は、読み込み順序/特異性が期待通りか（devtoolsで）必ず確認する
- 9スライス（`::before`塗り + `::after`枠）など多層構造は、どの擬似要素へ当てているかを意識して差分適用する

#### 関連ファイル
- `src/style.css`: `#book-ui #book-list-scroll .ui-frame-box::after`、`.book-list-item.selected.ui-frame-box::after`

---

### BUG-UI-004: Figma準拠の新規ラベルでフォントが反映されない（再発）

**発生日**: 2026-04-16  
**重要度**: 中

#### 症状
- Figmaを見て作成した小ラベル（例: 釣果ポップアップ右上のEXPチップ）で、指定した書体が表示されず既存フォントに見える
- 見た目調整時にサイズや色は合っているのに、文字だけ別フォントになる

#### 原因
- `font-family: inherit` で親から継承する実装にすると、既存の広いセレクタやコンポーネント側スタイルの影響で意図した書体が外れるケースがある
- UI追加時に `font-family` の明示指定と `!important` が不足し、既存スタイルに上書きされる

#### 解決法
- 新規ラベル系UIは、**要素自身（ラッパー・ラベル・値）に直接** `font-family: "Jersey 10", "DotGothic16", sans-serif !important;` を付与する
- `font-weight` も明示（`400`）して差異を減らす
- `inherit` 依存で済ませない

#### 教訓・対策
- Figma実装時のチェックリストに「書体は各要素へ直指定（必要なら `!important`）」を入れる
- 実装後にDevToolsで `Computed > font-family` を確認し、意図フォントが最終適用されているか確認する

#### 関連ファイル
- `src/style.css`: `.catch-result-exp-chip`, `.catch-result-exp-label`, `.catch-result-exp-value`

---
## 状態管理関連

<!-- 今後、状態管理関連の不具合が発生した場合はここに追記 -->

---

## イベント処理関連

<!-- 今後、イベント処理関連の不具合が発生した場合はここに追記 -->

---

## パフォーマンス関連

<!-- 今後、パフォーマンス関連の不具合が発生した場合はここに追記 -->

---

## データ整合性関連

<!-- 今後、データ整合性関連の不具合が発生した場合はここに追記 -->

---

## その他

<!-- 上記のカテゴリに当てはまらない不具合はここに追記 -->

---

## 📝 記録フォーマット

新しい不具合を記録する際は、以下のフォーマットを使用してください：

```markdown
### BUG-[カテゴリ]-[番号]: [不具合の簡潔な説明]

**発生日**: YYYY-MM-DD  
**重要度**: [高 / 中 / 低]

#### 症状
- [具体的な症状を箇条書きで記載]

#### 原因
[原因の説明]

**問題箇所**: [ファイルパス] [行番号]

```言語
// 問題のあるコード（必要に応じて）
```

#### 解決法
[解決法の説明]

**修正箇所**: [ファイルパス] [行番号]

```言語
// 修正後のコード（必要に応じて）
```

#### 教訓・対策
- [再発防止のための対策や気をつけるべき点]

#### 関連ファイル
- [ファイルパス]: [説明]
```

---

## 🔍 検索用インデックス

### ファイル別
- `src/scenes/GameScene.ts`: BUG-UI-001
- `src/style.css`: BUG-UI-001, BUG-UI-002

### キーワード別
- `gridTemplateColumns`: BUG-UI-001
- `インラインスタイル`: BUG-UI-001
- `タブ切り替え`: BUG-UI-001
- `スタイルリセット`: BUG-UI-001
- `CSS特異性`: BUG-UI-002
- `!important`: BUG-UI-002
- `book-detail-price`: BUG-UI-002
- `book-detail-size`: BUG-UI-002

---

## 📌 注意事項

- 「不具合記載して」と依頼されたときにのみ、このドキュメントに記録する
- 解決法だけでなく、「なぜ起きたのか」「どう防ぐか」も記録する
- 関連する他の不具合があれば、相互参照を追加する

