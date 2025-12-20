# モーダルインタラクション問題の調査結果

## 問題の症状
- 1枚目のモーダルを開く → 正常動作 ✅
- 2枚目のモーダルを開く → 正常動作 ✅
- 2枚目を閉じる → 1枚目に戻るが、ホバー・クリックが反応しない ❌

## 調査結果

### 1. `inert` 属性の解除が不完全 ⚠️

**問題箇所**: `updateModalStates()` (line 631-636)

```typescript
if (isTopmost) {
  element.classList.add('is-topmost');
  element.style.display = 'flex';
  element.setAttribute('aria-hidden', 'false');
  // 背面から復帰した場合は更新を再開
  this.resumeModalUpdates(id);
  // ❌ inert属性の解除が抜けている！
}
```

**問題**: 背面モーダルに `inert = true` を付与しているが、最上位に復帰した時に `inert = false` にしていない。

**現在のコード**:
- 背面モーダル: `inert = true` ✅
- 閉じたモーダル: `inert = false` ✅
- **最上位に復帰**: `inert` の解除なし ❌

### 2. `pointer-events` の明示的な設定がない ⚠️

**問題箇所**: `updateModalStates()` (line 631-636)

CSSで `pointer-events` を制御しているが、JS側で明示的に設定していない。
最上位に復帰した時に `pointer-events: auto` を明示的に設定する必要がある可能性。

**CSS側**:
```css
.modal.is-open.is-topmost {
  pointer-events: auto;
}
```

**JS側**: 明示的な設定なし

### 3. `topModalId` が `undefined` の場合の処理 ⚠️

**問題箇所**: `updateModalStates()` (line 610)

```typescript
const topModalId = this.modalStack[this.modalStack.length - 1];
```

スタックが空の場合、`topModalId` が `undefined` になる。
この場合、`isTopmost` の判定が正しく動作しない可能性。

### 4. イベントリスナーの問題（可能性低い） ✅

現在の実装では、モーダルのイベントリスナーは `createInventoryUI()` などで一度だけ追加されており、
モーダルが背面になっても削除されていない。これは正しい動作。

ただし、`inert` 属性が残っていると、イベントリスナーがあっても反応しない。

## 修正が必要な箇所

### 優先度: 高

1. **最上位モーダルに復帰した時に `inert` を解除**
   - `isTopmost` の分岐で `inert = false` を設定
   - `removeAttribute('inert')` も併用（安全のため）

2. **`pointer-events` を明示的に設定**
   - 最上位: `element.style.pointerEvents = 'auto'`
   - 背面: `element.style.pointerEvents = 'none'`

3. **`topModalId` が `undefined` の場合の処理**
   - スタックが空の場合の処理を追加

### 優先度: 中

4. **状態の完全リセット**
   - 最上位に復帰した時に、すべての状態属性を明示的にリセット

## 推奨される修正

```typescript
if (isTopmost) {
  element.classList.add('is-topmost');
  element.style.display = 'flex';
  element.style.pointerEvents = 'auto'; // 明示的に設定
  element.setAttribute('aria-hidden', 'false');
  
  // inert属性を確実に解除（両方の方法で）
  if ('inert' in element) {
    (element as any).inert = false;
  }
  element.removeAttribute('inert');
  
  this.resumeModalUpdates(id);
} else {
  element.classList.add('is-behind');
  element.style.pointerEvents = 'none'; // 明示的に設定
  element.setAttribute('aria-hidden', 'true');
  
  // inert属性を付与
  if ('inert' in element) {
    (element as any).inert = true;
  }
  element.setAttribute('inert', '');
  
  this.pauseModalUpdates(id);
}
```
