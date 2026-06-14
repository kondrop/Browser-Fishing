import type { PlayerData } from '../data/inventory';
import { hasSkillAbility } from '../data/skills';
import { getEffectiveSkillStatBonuses } from './balanceDebug';
import {
  balanceReferenceFishParams,
  createFightSimState,
  getFightBarHeight,
  stepFightSimulation,
  type FightSimState,
} from '../fight/fightSimulation';
import { FishingGaugeOverlay } from '../ui/fishingGaugeOverlay';

export interface BalanceFightPreviewHost {
  getPlayerData: () => PlayerData;
}

export class BalanceFightPreview {
  private overlay = new FishingGaugeOverlay();
  private host: BalanceFightPreviewHost | null = null;

  private rafId: number | null = null;
  private lastTs = 0;
  private keys = { left: false, right: false, up: false, down: false };
  private sim!: FightSimState;
  private skillTriggers = { lockOn: false, stagger: false, smoothDrag: false };

  mount(container: HTMLElement, host: BalanceFightPreviewHost): void {
    this.host = host;
    this.overlay.mountPreview(container);
    this.resetState();
    this.render();
  }

  start(): void {
    if (this.rafId !== null) return;
    this.resetState();
    this.lastTs = performance.now();
    this.bindKeys(true);
    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this.step(dt);
      this.render();
      this.skillTriggers = { lockOn: false, stagger: false, smoothDrag: false };
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.bindKeys(false);
  }

  unmount(): void {
    this.stop();
    this.overlay.unmount();
    this.host = null;
  }

  private resetState(): void {
    if (!this.host) return;
    this.sim = createFightSimState(this.host.getPlayerData());
  }

  private bindKeys(on: boolean): void {
    const add = on ? window.addEventListener.bind(window) : window.removeEventListener.bind(window);
    add('keydown', this.onKeyDown);
    add('keyup', this.onKeyUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (this.shouldIgnoreKeyTarget(e.target)) return;
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      this.keys.left = true;
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      this.keys.right = true;
    }
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      this.keys.up = true;
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      this.keys.down = true;
    }
    if (e.code === 'KeyZ' && !e.repeat) {
      e.preventDefault();
      this.skillTriggers.lockOn = true;
    }
    if (e.code === 'KeyX' && !e.repeat) {
      e.preventDefault();
      this.skillTriggers.stagger = true;
    }
    if (e.code === 'KeyC' && !e.repeat) {
      e.preventDefault();
      this.skillTriggers.smoothDrag = true;
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft') this.keys.left = false;
    if (e.code === 'ArrowRight') this.keys.right = false;
    if (e.code === 'ArrowUp') this.keys.up = false;
    if (e.code === 'ArrowDown') this.keys.down = false;
  };

  private shouldIgnoreKeyTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  private getHost(): BalanceFightPreviewHost {
    if (!this.host) throw new Error('BalanceFightPreview host is not set');
    return this.host;
  }

  private step(dt: number): void {
    const pd = this.getHost().getPlayerData();
    stepFightSimulation(this.sim, {
      dt,
      leftHeld: this.keys.left,
      rightHeld: this.keys.right,
      tensionUpHeld: this.keys.up,
      tensionDownHeld: this.keys.down,
      playerData: pd,
      equippedRodId: pd.equippedRodId,
      fish: balanceReferenceFishParams(),
      skillBonuses: getEffectiveSkillStatBonuses(pd),
      sandbox: true,
      triggerLockOn: this.skillTriggers.lockOn,
      triggerStagger: this.skillTriggers.stagger,
      triggerSmoothDrag: this.skillTriggers.smoothDrag,
    });
  }

  private render(): void {
    const pd = this.getHost().getPlayerData();
    const skillBonuses = getEffectiveSkillStatBonuses(pd);
    const barHeight = getFightBarHeight(this.sim, pd, pd.equippedRodId, skillBonuses);
    const playerHitBarCenter = this.sim.playerBarPosition + barHeight / 2;

    this.overlay.updateFight({
      fishBarPosition: this.sim.fishBarPosition,
      playerBarPosition: this.sim.playerBarPosition,
      barHeight,
      catchProgress: this.sim.catchProgress,
      isCatching: this.sim.isCatching,
      criticalZoneHeight: 0,
      playerHitBarCenter,
      fishDriftVelocity: this.sim.fishDriftVelocity,
      tension: this.sim.tension,
      fishState: this.sim.fishState,
    });
    this.overlay.updateFightSkillIcons({
      z: {
        learned: hasSkillAbility(pd, 'abil_control_lock_on'),
        used: this.sim.fightLockOnUsed,
        remainingSec: this.sim.lockOnRemainingSec,
      },
      x: {
        learned: hasSkillAbility(pd, 'abil_power_fight_steady'),
        used: this.sim.fightStaggerUsed,
        remainingSec: this.sim.fishFreezeRemainingSec,
      },
      c: {
        learned: hasSkillAbility(pd, 'abil_control_smooth_drag'),
        used: this.sim.fightSmoothDragUsed,
        remainingSec: this.sim.smoothDragRemainingSec,
      },
    });
  }
}
