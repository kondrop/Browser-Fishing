# Book UI Style Guide

このプロジェクトの UI 基準は、`Book UI`（タブ内カードデザイン）です。  
新規 UI（特にショップ/一覧/カード）は、明示指示がなくてもこのガイドを踏襲します。

## 1) ビジュアル原則
- 9-slice 枠を基本にする: 非選択は `uiframe.png`、選択/アクティブは `border.png`
- 塗り色はトークン経由で管理し、ベースは落ち着いたベージュ系
- 選択状態は「枠 + 塗り」で表現し、強い `outline` 単体は使わない
- テキストは可読性優先（主文言は濃色、補助文言は muted）

## 2) 実装ルール（必須）
- カード/タブ/リスト行は原則 `ui-frame-box` を使う
- 状態はクラスで切り替える（例: `.selected`, `.active`）
- 色や余白は既存 token を優先し、直値を増やさない
- 既存コンポーネントの見た目を崩す新規ルールは避ける

## 3) トークン運用
- まず semantic token を使う（例: `--color-semantic-*`）
- semantic で不足する場合のみ primitive token を使用
- primitive の直参照は最小限にし、将来的に semantic へ吸収する

## 4) 参照ポイント
- 主要トークン: `src/style.css` の `:root`（Figma sync tokens）
- 9-slice 共通: `src/style.css` の `.ui-frame-box` 定義
- Book UI 既存スタイル: `src/style.css` の「統合BookUI」セクション

## 5) 新規UI作成チェックリスト
- 非選択/選択/hover の 3 状態を Book UI と同じ思想で実装したか
- 9-slice 枠の切り替え（uiframe/border）を使っているか
- token ベースで配色し、新しい色の直値追加を避けたか
- 既存タブ（Book/Shop/Achievement）と並べても違和感がないか
