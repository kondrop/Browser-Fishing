import type { PlayerData } from '../data/inventory';
import {
  calculateDisplayStatIndices,
  resetBalanceDebugOverrides,
  resetSkillPointsToLevelGrant,
  resetUnlockedSkills,
  setDebugStatTargetIndex,
  setPlayerLevelForDebug,
  syncPlayerLevelFromExp,
  type BalanceDebugStatKey,
  type DisplayStatIndices,
} from './balanceDebug';
import { BalanceFightPreview } from './balanceFightPreview';

export interface BalanceDebugPanelHost {
  getPlayerData: () => PlayerData;
  getEquippedRodId: () => string;
  onPlayerDataChanged: () => void;
  onRequestClose: () => void;
  savePlayerData: () => void;
}

export interface BalanceDebugPanelHandle {
  element: HTMLElement;
  refresh: () => void;
  startFightPreview: () => void;
  stopFightPreview: () => void;
}

const STAT_LABELS: Record<BalanceDebugStatKey, string> = {
  power: 'パワー',
  speed: 'スピード',
  technique: 'テクニック',
  control: 'コントロール',
};

export function createBalanceDebugPanel(host: BalanceDebugPanelHost): BalanceDebugPanelHandle {
  const html = `
    <div id="balance-debug-modal" class="modal balance-debug-modal" style="display: none;" aria-hidden="true">
      <div class="modal-content balance-debug-modal__content nes-container with-rounded ui-frame-box">
        <div class="modal-header balance-debug-modal__header">
          <h2>バランス調整（デバッグ）</h2>
          <button type="button" class="modal-close ui-frame-box" id="balance-debug-close" aria-label="閉じる">×</button>
        </div>
        <div class="balance-debug-modal__layout">
          <aside class="balance-fight-preview ui-frame-box" id="balance-fight-preview" aria-label="テスト用ファイト"></aside>
          <div class="balance-debug-modal__main">
        <div class="modal-body balance-debug-modal__body">
          <p class="balance-debug-modal__note">
            左のテストファイトで操作感を確認しながら、能力値をリアルタイムで変更できます（基準100）。
          </p>
          <div class="balance-debug-modal__grid">
            <label class="balance-debug-modal__field">
              <span>レベル</span>
              <div class="balance-debug-modal__field-row">
                <input type="number" id="balance-debug-level" class="nes-input" min="1" step="1" />
                <button type="button" class="nes-btn is-small" data-level-delta="-1">−</button>
                <button type="button" class="nes-btn is-small" data-level-delta="1">+</button>
              </div>
            </label>
            <label class="balance-debug-modal__field">
              <span>経験値（累計）</span>
              <input type="number" id="balance-debug-exp" class="nes-input" min="0" step="1" />
            </label>
            <label class="balance-debug-modal__field">
              <span>スキルポイント（SP）</span>
              <input type="number" id="balance-debug-sp" class="nes-input" min="0" step="1" />
            </label>
            <p class="balance-debug-modal__skill-summary" id="balance-debug-skill-summary" aria-live="polite"></p>
          </div>
          <div class="balance-debug-modal__actions-inline balance-debug-modal__actions-inline--skills">
            <button type="button" id="balance-debug-reset-skills" class="nes-btn is-small">取得スキルをリセット</button>
            <button type="button" id="balance-debug-reset-sp" class="nes-btn is-small">SPをリセット</button>
          </div>
          <fieldset class="balance-debug-modal__fieldset">
            <legend>能力値（表示インデックス）</legend>
            <div class="balance-debug-modal__stats">
              ${(['power', 'speed', 'technique', 'control'] as BalanceDebugStatKey[])
                .map(
                  (key) => `
              <label class="balance-debug-modal__stat-row">
                <span class="balance-debug-modal__stat-label">${STAT_LABELS[key]}</span>
                <input type="number" class="nes-input balance-debug-stat-input" data-stat-key="${key}" min="0" step="1" />
                <span class="balance-debug-modal__stat-live" data-stat-live="${key}">—</span>
              </label>`,
                )
                .join('')}
            </div>
          </fieldset>
          <div class="balance-debug-modal__actions-inline">
            <button type="button" id="balance-debug-sync-exp" class="nes-btn is-small">EXPをLvに同期</button>
            <button type="button" id="balance-debug-reset-bonuses" class="nes-btn is-small">能力加算をリセット</button>
          </div>
        </div>
        <div class="modal-footer balance-debug-modal__footer">
          <button type="button" id="balance-debug-save" class="nes-btn is-primary">セーブ</button>
          <button type="button" id="balance-debug-cancel" class="nes-btn">閉じる</button>
        </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const temp = document.createElement('div');
  temp.innerHTML = html;
  const element = temp.firstElementChild as HTMLElement;
  document.body.appendChild(element);

  const levelInput = element.querySelector('#balance-debug-level') as HTMLInputElement;
  const expInput = element.querySelector('#balance-debug-exp') as HTMLInputElement;
  const spInput = element.querySelector('#balance-debug-sp') as HTMLInputElement;
  const statInputs = Array.from(element.querySelectorAll<HTMLInputElement>('.balance-debug-stat-input'));
  const statLiveEls = Array.from(element.querySelectorAll<HTMLElement>('[data-stat-live]'));
  const skillSummaryEl = element.querySelector('#balance-debug-skill-summary') as HTMLElement | null;
  const fightPreviewMount = element.querySelector('#balance-fight-preview') as HTMLElement | null;
  const fightPreview = new BalanceFightPreview();
  if (fightPreviewMount) {
    fightPreview.mount(fightPreviewMount, { getPlayerData: () => host.getPlayerData() });
  }

  let syncingInputs = false;

  const applyAndNotify = () => {
    host.onPlayerDataChanged();
    host.savePlayerData();
    refreshLiveStats();
  };

  const refreshLiveStats = (indices?: DisplayStatIndices) => {
    const display = indices ?? calculateDisplayStatIndices(host.getPlayerData(), host.getEquippedRodId());
    statLiveEls.forEach((el) => {
      const key = el.getAttribute('data-stat-live') as BalanceDebugStatKey | null;
      if (!key) return;
      el.textContent = `実効 ${display[key]}`;
    });
  };

  const syncInputsFromPlayer = () => {
    syncingInputs = true;
    const pd = host.getPlayerData();
    const indices = calculateDisplayStatIndices(pd, host.getEquippedRodId());
    levelInput.value = String(pd.level);
    expInput.value = String(Math.floor(pd.exp));
    spInput.value = String(pd.skillPoints);
    if (skillSummaryEl) {
      skillSummaryEl.textContent = `取得スキル ${pd.unlockedSkillNodes.size} 件`;
    }
    statInputs.forEach((input) => {
      const key = input.getAttribute('data-stat-key') as BalanceDebugStatKey | null;
      if (!key) return;
      input.value = String(indices[key]);
    });
    syncingInputs = false;
    refreshLiveStats(indices);
  };

  const refresh = () => {
    syncInputsFromPlayer();
  };

  levelInput.addEventListener('input', () => {
    if (syncingInputs) return;
    const level = Math.max(1, Math.floor(Number(levelInput.value) || 1));
    setPlayerLevelForDebug(host.getPlayerData(), level);
    syncingInputs = true;
    expInput.value = String(Math.floor(host.getPlayerData().exp));
    syncingInputs = false;
    applyAndNotify();
  });

  expInput.addEventListener('input', () => {
    if (syncingInputs) return;
    const pd = host.getPlayerData();
    pd.exp = Math.max(0, Math.floor(Number(expInput.value) || 0));
    syncPlayerLevelFromExp(pd);
    syncingInputs = true;
    levelInput.value = String(pd.level);
    syncingInputs = false;
    applyAndNotify();
  });

  spInput.addEventListener('input', () => {
    if (syncingInputs) return;
    host.getPlayerData().skillPoints = Math.max(0, Math.floor(Number(spInput.value) || 0));
    applyAndNotify();
  });

  statInputs.forEach((input) => {
    input.addEventListener('input', () => {
      if (syncingInputs) return;
      const key = input.getAttribute('data-stat-key') as BalanceDebugStatKey | null;
      if (!key) return;
      const target = Math.max(0, Math.floor(Number(input.value) || 0));
      setDebugStatTargetIndex(host.getPlayerData(), host.getEquippedRodId(), key, target);
      applyAndNotify();
    });
  });

  element.querySelectorAll<HTMLButtonElement>('[data-level-delta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const delta = Number(btn.getAttribute('data-level-delta') ?? 0);
      const pd = host.getPlayerData();
      setPlayerLevelForDebug(pd, pd.level + delta);
      syncingInputs = true;
      levelInput.value = String(pd.level);
      expInput.value = String(Math.floor(pd.exp));
      syncingInputs = false;
      applyAndNotify();
    });
  });

  element.querySelector('#balance-debug-sync-exp')?.addEventListener('click', () => {
    setPlayerLevelForDebug(host.getPlayerData(), host.getPlayerData().level);
    syncingInputs = true;
    expInput.value = String(Math.floor(host.getPlayerData().exp));
    syncingInputs = false;
    applyAndNotify();
  });

  element.querySelector('#balance-debug-reset-bonuses')?.addEventListener('click', () => {
    resetBalanceDebugOverrides();
    refresh();
    applyAndNotify();
  });

  element.querySelector('#balance-debug-reset-skills')?.addEventListener('click', () => {
    if (!confirm('解放済みスキルをすべて解除し、SPを現在レベル分に戻します。よろしいですか？')) return;
    resetUnlockedSkills(host.getPlayerData());
    refresh();
    applyAndNotify();
  });

  element.querySelector('#balance-debug-reset-sp')?.addEventListener('click', () => {
    resetSkillPointsToLevelGrant(host.getPlayerData());
    syncingInputs = true;
    spInput.value = String(host.getPlayerData().skillPoints);
    syncingInputs = false;
    applyAndNotify();
  });

  const handleClose = () => host.onRequestClose();
  element.querySelector('#balance-debug-close')?.addEventListener('click', handleClose);
  element.querySelector('#balance-debug-cancel')?.addEventListener('click', handleClose);

  element.querySelector('#balance-debug-save')?.addEventListener('click', () => {
    host.savePlayerData();
    alert('プレイヤーデータを保存しました。');
  });

  return {
    element,
    refresh,
    startFightPreview: () => fightPreview.start(),
    stopFightPreview: () => fightPreview.stop(),
  };
}
