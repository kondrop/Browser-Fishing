/** Book UI 配色のリアルタイムデバッグエディタ（モーダルスタック非依存） */

export type BookColorTokenDef = {
  cssVar: string;
  label: string;
  group: string;
  defaultHex: string;
};

/** 近い色はコアへ統合済み。薄塗りは border-soft / text-secondary の color-mix。 */
export const BOOK_COLOR_TOKENS: BookColorTokenDef[] = [
  /* 枠・面 */
  { group: '枠・面', cssVar: '--color-book-frame-idle', label: '非選択枠', defaultHex: '#cbb792' },
  { group: '枠・面', cssVar: '--color-book-frame-active', label: '選択枠 / Info面', defaultHex: '#f9deb3' },
  { group: '枠・面', cssVar: '--color-book-frame-surface', label: 'サーフェス / スキル列', defaultHex: '#eed3a5' },
  { group: '枠・面', cssVar: '--color-book-parchment', label: '羊皮紙 / ホバー', defaultHex: '#f5ce94' },
  { group: '枠・面', cssVar: '--color-book-pedia-idle', label: '中間クリーム', defaultHex: '#decda4' },
  { group: '枠・面', cssVar: '--color-book-quest-card-selected', label: 'ハイライト', defaultHex: '#fff6da' },
  { group: '枠・面', cssVar: '--color-primitive-natural-sand-300', label: '砂色 / キャンセル', defaultHex: '#b9a67e' },

  /* テキスト */
  { group: 'テキスト', cssVar: '--color-semantic-text-primary', label: '本文', defaultHex: '#320e0e' },
  { group: 'テキスト', cssVar: '--color-book-text-secondary', label: '補助茶（薄塗り元）', defaultHex: '#5c4030' },
  { group: 'テキスト', cssVar: '--color-semantic-text-muted', label: 'Muted', defaultHex: '#8a7060' },
  { group: 'テキスト', cssVar: '--color-semantic-text-detail', label: '詳細', defaultHex: '#212121' },
  { group: 'テキスト', cssVar: '--color-semantic-text-stat-value', label: '数値緑', defaultHex: '#2d6b2d' },

  /* アクセント */
  { group: 'アクセント', cssVar: '--color-primitive-orange-600', label: 'オレンジ', defaultHex: '#c2681f' },
  { group: 'アクセント', cssVar: '--color-semantic-bg-active', label: 'アクティブ緑', defaultHex: '#7cb86c' },
  { group: 'アクセント', cssVar: '--color-primitive-green-600', label: '緑600', defaultHex: '#4e8a42' },
  { group: 'アクセント', cssVar: '--color-book-stat-up', label: 'ステ上昇', defaultHex: '#4ea65e' },
  { group: 'アクセント', cssVar: '--color-book-stat-down', label: 'ステ下降', defaultHex: '#d35757' },
  { group: 'アクセント', cssVar: '--color-book-btn-muted', label: '無効ボタン', defaultHex: '#8a8a8a' },

  /* ボーダー */
  { group: 'ボーダー', cssVar: '--color-semantic-border-book', label: '枠茶', defaultHex: '#5e2e1c' },
  { group: 'ボーダー', cssVar: '--color-semantic-border-soft', label: 'ソフト茶（薄塗り元）', defaultHex: '#704a2b' },
  { group: 'ボーダー', cssVar: '--color-book-overlay', label: 'オーバーレイ', defaultHex: '#231c14' },
  { group: 'ボーダー', cssVar: '--color-book-scrim', label: 'スクリム', defaultHex: '#000000' },

  /* レアリティ */
  { group: 'レアリティ', cssVar: '--color-rarity-common', label: 'Common', defaultHex: '#b29a8c' },
  { group: 'レアリティ', cssVar: '--color-rarity-uncommon', label: 'Uncommon', defaultHex: '#60ca60' },
  { group: 'レアリティ', cssVar: '--color-rarity-rare', label: 'Rare', defaultHex: '#4599ff' },
  { group: 'レアリティ', cssVar: '--color-rarity-epic', label: 'Epic', defaultHex: '#aa55ff' },
  { group: 'レアリティ', cssVar: '--color-rarity-legendary', label: 'Legendary', defaultHex: '#ffaa00' },

  /* 生息地 */
  { group: '生息地', cssVar: '--color-habitat-freshwater', label: '淡水', defaultHex: '#383680' },
  { group: '生息地', cssVar: '--color-habitat-saltwater', label: '海水', defaultHex: '#19648b' },
  { group: '生息地', cssVar: '--color-habitat-stream', label: '渓流', defaultHex: '#327f75' },
];

const STORAGE_KEY = 'browser-fishing:book-color-debug';

/** 統合前トークン → 現行トークン */
const STORAGE_KEY_MIGRATE: Record<string, string> = {
  '--color-book-note': '--color-book-frame-active',
  '--color-book-skills-column': '--color-book-frame-surface',
  '--color-book-quest-card': '--color-book-frame-surface',
  '--color-book-quest-icon': '--color-book-quest-card-selected',
  '--color-book-detail-badge': '--color-book-pedia-idle',
  '--color-book-tab-soft': '--color-book-pedia-idle',
  '--color-book-panel-warm': '--color-book-pedia-idle',
  '--color-book-option-hover': '--color-book-parchment',
  '--color-book-close-press': '--color-book-frame-idle',
  '--color-book-image-well': '--color-book-frame-idle',
  '--color-book-btn-cancel': '--color-primitive-natural-sand-300',
  '--color-book-track-dark': '--color-book-text-secondary',
  '--color-book-progress-from': '--color-semantic-bg-active',
  '--color-book-progress-to': '--color-primitive-green-600',
  '--color-semantic-bg-nonactive': '--color-book-pedia-idle',
  '--color-primitive-natural-sand-400': '--color-book-frame-active',
};

function normalizeHex(input: string): string | null {
  const raw = input.trim();
  const hex = raw.match(/^#?([0-9a-fA-F]{6})$/);
  if (hex) return `#${hex[1]!.toLowerCase()}`;
  const rgb = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const to = (n: string) => Number(n).toString(16).padStart(2, '0');
    return `#${to(rgb[1]!)}${to(rgb[2]!)}${to(rgb[3]!)}`;
  }
  return null;
}

function readStoredRaw(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function migrateStored(input: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const hex = normalizeHex(value);
    if (!hex || !key.startsWith('--')) continue;
    const dest = STORAGE_KEY_MIGRATE[key] ?? key;
    // 現行キーの値がすでにあれば優先（古いキーで上書きしない）
    if (out[dest] && key !== dest) continue;
    out[dest] = hex;
  }
  return out;
}

function writeStored(map: Record<string, string>): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    // 直後に読み戻して確実に書けたか確認
    const roundtrip = readStoredRaw();
    for (const [k, v] of Object.entries(map)) {
      if (normalizeHex(roundtrip[k] ?? '') !== normalizeHex(v)) {
        return { ok: false, error: '保存の読み戻しに失敗' };
      }
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'localStorage に書けません';
    return { ok: false, error: message };
  }
}

function applyVar(cssVar: string, hex: string): void {
  document.documentElement.style.setProperty(cssVar, hex);
}

function clearVar(cssVar: string): void {
  document.documentElement.style.removeProperty(cssVar);
}

function currentHex(cssVar: string, fallback: string): string {
  const inline = document.documentElement.style.getPropertyValue(cssVar).trim();
  if (inline) {
    const n = normalizeHex(inline);
    if (n) return n;
  }
  const computed = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return normalizeHex(computed) ?? fallback;
}

function defaultHexFor(cssVar: string): string | null {
  return BOOK_COLOR_TOKENS.find((t) => t.cssVar === cssVar)?.defaultHex ?? null;
}

/** 起動直後に呼ぶ。GameScene より前でも可。 */
export function applyStoredBookColors(): number {
  const stored = migrateStored(readStoredRaw());
  // 移行後の形で書き戻し（次回から現行キーのみ）
  if (Object.keys(stored).length > 0) {
    writeStored(stored);
  }
  let applied = 0;
  for (const [cssVar, hex] of Object.entries(stored)) {
    const def = defaultHexFor(cssVar);
    if (def && def.toLowerCase() === hex.toLowerCase()) continue;
    applyVar(cssVar, hex);
    applied += 1;
  }
  return applied;
}

export type BookColorEditorHandle = {
  element: HTMLElement;
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  toggle: () => void;
};

export function createBookColorEditor(options?: { onClose?: () => void }): BookColorEditorHandle {
  applyStoredBookColors();

  const root = document.createElement('div');
  root.id = 'book-color-editor';
  root.className = 'book-color-editor';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');

  const groups = [...new Set(BOOK_COLOR_TOKENS.map((t) => t.group))];
  root.innerHTML = `
    <div class="book-color-editor__chrome ui-frame-box">
      <header class="book-color-editor__header">
        <div class="book-color-editor__titlewrap">
          <h2 class="book-color-editor__title">Book 配色</h2>
          <p class="book-color-editor__note">変更は即反映＋localStorage 保存。本採用は CSSコピー → チャットで依頼。</p>
          <p class="book-color-editor__status" data-status>保存: —</p>
        </div>
        <button type="button" class="book-color-editor__close nes-btn is-small" aria-label="閉じる">×</button>
      </header>
      <div class="book-color-editor__toolbar">
        <button type="button" class="nes-btn is-small" data-action="copy">CSSコピー</button>
        <button type="button" class="nes-btn is-small" data-action="reset">初期値に戻す</button>
      </div>
      <div class="book-color-editor__body">
        ${groups
          .map((group) => {
            const rows = BOOK_COLOR_TOKENS.filter((t) => t.group === group)
              .map((t) => {
                const hex = currentHex(t.cssVar, t.defaultHex);
                return `
                <label class="book-color-editor__row" data-var="${t.cssVar}">
                  <span class="book-color-editor__swatch-wrap">
                    <input type="color" class="book-color-editor__picker" value="${hex}" aria-label="${t.label}" />
                  </span>
                  <span class="book-color-editor__meta">
                    <span class="book-color-editor__label">${t.label}</span>
                    <code class="book-color-editor__var">${t.cssVar}</code>
                  </span>
                  <input type="text" class="book-color-editor__hex nes-input" value="${hex}" spellcheck="false" maxlength="7" />
                </label>`;
              })
              .join('');
            return `<section class="book-color-editor__group"><h3>${group}</h3>${rows}</section>`;
          })
          .join('')}
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const statusEl = root.querySelector('[data-status]') as HTMLElement | null;
  const setStatus = (text: string, isError = false): void => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('is-error', isError);
  };

  const refreshStatus = (extra?: string): void => {
    const count = Object.keys(migrateStored(readStoredRaw())).length;
    setStatus(extra ?? `保存済み ${count} 色（リロード後も保持）`);
  };
  refreshStatus();

  /** 触った1色だけを確実に追記／削除（全件再構築で消えないようにする） */
  const persistToken = (cssVar: string, hex: string): void => {
    const map = migrateStored(readStoredRaw());
    const def = defaultHexFor(cssVar);
    if (def && def.toLowerCase() === hex.toLowerCase()) {
      delete map[cssVar];
    } else {
      map[cssVar] = hex;
    }
    const result = writeStored(map);
    if (!result.ok) {
      setStatus(`保存失敗: ${result.error ?? '不明'}`, true);
      return;
    }
    refreshStatus(`保存しました（${Object.keys(map).length} 色）`);
  };

  const syncRow = (row: HTMLElement, hex: string): void => {
    const picker = row.querySelector('.book-color-editor__picker') as HTMLInputElement | null;
    const hexInput = row.querySelector('.book-color-editor__hex') as HTMLInputElement | null;
    if (picker) picker.value = hex;
    if (hexInput) hexInput.value = hex;
  };

  const setToken = (cssVar: string, hex: string): void => {
    applyVar(cssVar, hex);
    const row = root.querySelector(`.book-color-editor__row[data-var="${cssVar}"]`) as HTMLElement | null;
    if (row) syncRow(row, hex);
    persistToken(cssVar, hex);
  };

  root.querySelectorAll('.book-color-editor__row').forEach((node) => {
    const row = node as HTMLElement;
    const cssVar = row.dataset.var;
    if (!cssVar) return;
    const picker = row.querySelector('.book-color-editor__picker') as HTMLInputElement;
    const hexInput = row.querySelector('.book-color-editor__hex') as HTMLInputElement;

    picker.addEventListener('input', () => {
      const hex = normalizeHex(picker.value);
      if (!hex) return;
      setToken(cssVar, hex);
    });

    hexInput.addEventListener('change', () => {
      const hex = normalizeHex(hexInput.value);
      if (!hex) {
        hexInput.value = currentHex(cssVar, '#000000');
        return;
      }
      setToken(cssVar, hex);
    });
  });

  root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    for (const token of BOOK_COLOR_TOKENS) {
      clearVar(token.cssVar);
      const row = root.querySelector(`.book-color-editor__row[data-var="${token.cssVar}"]`) as HTMLElement | null;
      if (row) syncRow(row, token.defaultHex);
    }
    setStatus('初期値に戻しました（保存を消去）');
  });

  root.querySelector('[data-action="copy"]')?.addEventListener('click', async () => {
    const lines = BOOK_COLOR_TOKENS.map((t) => {
      const hex = currentHex(t.cssVar, t.defaultHex);
      return `  ${t.cssVar}: ${hex};`;
    });
    const cssText = `:root {\n${lines.join('\n')}\n}\n`;
    try {
      await navigator.clipboard.writeText(cssText);
    } catch {
      window.prompt('CSSをコピー:', cssText);
    }
  });

  const closeBtn = root.querySelector('.book-color-editor__close');
  closeBtn?.addEventListener('click', () => handle.close());

  const chrome = root.querySelector('.book-color-editor__chrome') as HTMLElement;
  const header = root.querySelector('.book-color-editor__header') as HTMLElement;
  let drag: { ox: number; oy: number; left: number; top: number } | null = null;
  header.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = chrome.getBoundingClientRect();
    drag = { ox: e.clientX, oy: e.clientY, left: rect.left, top: rect.top };
    header.setPointerCapture(e.pointerId);
  });
  header.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.ox;
    const dy = e.clientY - drag.oy;
    chrome.style.left = `${Math.max(8, drag.left + dx)}px`;
    chrome.style.top = `${Math.max(8, drag.top + dy)}px`;
    chrome.style.right = 'auto';
    chrome.style.bottom = 'auto';
  });
  header.addEventListener('pointerup', () => {
    drag = null;
  });

  const handle: BookColorEditorHandle = {
    element: root,
    open: () => {
      applyStoredBookColors();
      refreshStatus();
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('book-color-editor-open');
      for (const token of BOOK_COLOR_TOKENS) {
        const row = root.querySelector(`.book-color-editor__row[data-var="${token.cssVar}"]`) as HTMLElement | null;
        if (row) syncRow(row, currentHex(token.cssVar, token.defaultHex));
      }
    },
    close: () => {
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('book-color-editor-open');
      options?.onClose?.();
    },
    isOpen: () => !root.hidden,
    toggle: () => {
      if (handle.isOpen()) handle.close();
      else handle.open();
    },
  };

  return handle;
}
