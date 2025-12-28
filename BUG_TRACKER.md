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
- `src/style.css`: BUG-UI-001

### キーワード別
- `gridTemplateColumns`: BUG-UI-001
- `インラインスタイル`: BUG-UI-001
- `タブ切り替え`: BUG-UI-001
- `スタイルリセット`: BUG-UI-001

---

## 📌 注意事項

- 「不具合記載して」と依頼されたときにのみ、このドキュメントに記録する
- 解決法だけでなく、「なぜ起きたのか」「どう防ぐか」も記録する
- 関連する他の不具合があれば、相互参照を追加する

