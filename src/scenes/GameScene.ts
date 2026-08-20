import Phaser from 'phaser';
import { config } from '../config';
import type { FishConfig } from '../data/fishConfig';
import { rarityStars, getFishById, fishDatabase, rarityStarCount, rarityWeights, rarityColors, Habitat, Rarity, fishImageFileNames, getFishImagePath, type RarityBonuses } from '../data/fish';
import type { PlayerData } from '../data/inventory';
import { loadPlayerData, savePlayerData, addFishToInventory, applyCatchRewards, swapCaughtFishIntoInventory, getInventoryCount, getInventoryDisplayOrder, sellAllFish, addBait, consumeBait, getBaitCount, getExpProgress, getExpByRarity, generateRandomSize, getCastDistanceRatio, calculatePriceWithSizeBonus, getInventoryEntryBaseSellPrice, checkAchievements, getAchievementProgress, getAchievementProgressDisplay, incrementConsecutiveSuccess, resetConsecutiveSuccess, getRequiredExp, isBigSizeRatio } from '../data/inventory';
import {
  SKILL_TREE_IDS,
  SKILL_TREE_LABELS,
  canRevealFightFishRarity,
  canUnlockSkillNode,
  getExpMultiplierForFish,
  getSellPriceMultiplier,
  getSkillNodeDef,
  getSkillNodesForTree,
  hasSkillAbility,
  tryUnlockSkillNode,
  type SkillNodeId,
  type SkillTreeId,
} from '../data/skills';
import {
  displayAchievementEmoji,
  getAllCategories,
  getAchievementsByCategory,
  type AchievementConfig,
} from '../data/achievementConfig';
import {
  MAX_ACTIVE_QUESTS,
  type QuestConfig,
} from '../data/questConfig';
import {
  acceptQuest,
  abandonQuest,
  getActiveQuests,
  getAvailableQuests,
  getCompletedQuests,
  getQuestProgressDisplay,
  getQuestProgressRatio,
  migrateBoardQuestsIfNeeded,
  resetBoardQuests,
  onQuestConsecutiveSuccess,
  onQuestFishCaught,
  onQuestFishSold,
  onQuestLevelUp,
  resolveQuest,
  type QuestCatchContext,
} from '../data/quests';
import { rodConfigs, baitConfigs, lureConfigs, inventoryUpgradeConfigs, toolConfigs, getRodById, getBaitById, getLureById, getItemImagePath, itemImageFileNames, type ToolConfig } from '../data/shopConfig';
import {
  hasAquarium,
  getGrowthStage,
  getNextGrowthStage,
  isSatiated,
  isAquariumMaxGrowth,
  getSatietyRemainingMs,
  getAquariumBonusForEntry,
  getAquariumStatBonuses,
  addFishToAquarium,
  removeFishFromAquarium,
  swapAquariumFish,
  feedAquariumFish,
  getAquariumFoodCount,
  addAquariumFoodCount,
} from '../data/aquarium';
import {
  AQUARIUM_CAPACITY,
  AQUARIUM_FEED_COOLDOWN_MS,
  AQUARIUM_FOOD_TIERS,
  AQUARIUM_RIGHT_FACING_FISH,
  AQUARIUM_FISH_BASE_SIZE,
  AQUARIUM_CANVAS_W,
  AQUARIUM_CANVAS_H,
  AQUARIUM_BG_WARP_INSET_L,
  AQUARIUM_BG_WARP_INSET_R,
  AQUARIUM_BG_WARP_INSET_T,
  AQUARIUM_BG_WARP_INSET_B,
  AQUARIUM_BUBBLE_SPAWNS,
  AQUARIUM_BUBBLE_SPAWN_PER_SEC,
  AQUARIUM_BUBBLE_MAX,
  AQUARIUM_BUBBLE_RADIUS_MIN,
  AQUARIUM_BUBBLE_RADIUS_MAX,
  AQUARIUM_BUBBLE_RISE_MIN,
  AQUARIUM_BUBBLE_RISE_MAX,
  AQUARIUM_BUBBLE_SWAY_AMP_MIN,
  AQUARIUM_BUBBLE_SWAY_AMP_MAX,
  AQUARIUM_BUBBLE_SWAY_FREQ_MIN,
  AQUARIUM_BUBBLE_SWAY_FREQ_MAX,
  AQUARIUM_BUBBLE_DESPAWN_Y,
  AQUARIUM_BUBBLE_SEED_COUNT,
  AQUARIUM_INTRO_BUBBLE_COUNT,
  AQUARIUM_INTRO_BUBBLE_SPREAD,
  AQUARIUM_INTRO_BUBBLE_RISE_MUL,
  AQUARIUM_GODRAY_MAX,
  AQUARIUM_GODRAY_SPAWN_PER_SEC,
  AQUARIUM_GODRAY_SEED_COUNT,
  AQUARIUM_GODRAY_LIFE_MIN,
  AQUARIUM_GODRAY_LIFE_MAX,
  AQUARIUM_GODRAY_TOP_Y,
  AQUARIUM_GODRAY_X_CENTER,
  AQUARIUM_GODRAY_SPAWN_SPREAD,
  AQUARIUM_GODRAY_EDGE_INSET,
  AQUARIUM_GODRAY_TRAVEL_FRAC_MIN,
  AQUARIUM_GODRAY_TRAVEL_FRAC_MAX,
  AQUARIUM_GODRAY_ANGLE,
  AQUARIUM_GODRAY_HALF_W_MIN,
  AQUARIUM_GODRAY_HALF_W_MAX,
  AQUARIUM_GODRAY_LENGTH_MIN,
  AQUARIUM_GODRAY_LENGTH_MAX,
  AQUARIUM_GODRAY_MAX_ALPHA,
  AQUARIUM_GODRAY_FADE_IN_FRAC,
  AQUARIUM_GODRAY_FADE_OUT_FRAC,
  AQUARIUM_FACING_VX_THRESHOLD,
  AQUARIUM_PITCH_MAX,
  AQUARIUM_PITCH_STOP_SPEED,
  AQUARIUM_PITCH_LERP,
  AQUARIUM_SWIM_X_MIN,
  AQUARIUM_SWIM_X_MAX,
  AQUARIUM_SWIM_Y_MIN,
  AQUARIUM_SWIM_Y_MAX,
  AQUARIUM_HOME_Y_MIN,
  AQUARIUM_HOME_Y_RANGE,
  AQUARIUM_SPEED_MUL_MIN,
  AQUARIUM_SPEED_MUL_RANGE,
  AQUARIUM_CRUISE_DURATION_MIN,
  AQUARIUM_CRUISE_DURATION_MAX,
  AQUARIUM_IDLE_DURATION_MIN,
  AQUARIUM_IDLE_DURATION_MAX,
  AQUARIUM_DASH_DURATION_MIN,
  AQUARIUM_DASH_DURATION_MAX,
  AQUARIUM_CRUISE_TO_IDLE_P,
  AQUARIUM_CRUISE_TO_DASH_P,
  AQUARIUM_CRUISE_TO_IDLE_SATIATED_P,
  AQUARIUM_IDLE_TO_DASH_P,
  AQUARIUM_ARRIVAL_SLOW_DIST,
  AQUARIUM_ARRIVAL_MIN_SPEED_FRAC,
  AQUARIUM_ARRIVAL_REACH_DIST,
  AQUARIUM_CRUISE_ACCEL,
  AQUARIUM_CRUISE_BASE_SPEED,
  AQUARIUM_DASH_ACCEL,
  AQUARIUM_DASH_MAX_SPEED,
  AQUARIUM_DASH_RANGE_MIN,
  AQUARIUM_DASH_RANGE_MAX,
  AQUARIUM_IDLE_DAMP,
  AQUARIUM_SEEK_ACCEL,
  AQUARIUM_SEEK_MAX_SPEED,
  AQUARIUM_SEEK_LEAD_MAX_SEC,
  AQUARIUM_PELLET_FALL_SPEED,
  AQUARIUM_PELLET_RADIUS,
  AQUARIUM_EAT_BASE_RADIUS,
  AQUARIUM_EAT_SIZE_FACTOR,
  getAquariumSpeciesScale,
  getAquariumIndividualScale,
  getAquariumFoodTierByToolId,
  type AquariumFoodTier,
  type AquariumStatKey,
} from '../data/aquariumConfig';

type UnifiedBookTab = 'inventory' | 'pedia' | 'skills' | 'achievement' | 'quest' | 'status' | 'aquarium';

type AquariumSwimState = 'cruise' | 'idle' | 'dash';

interface AquariumFishRuntime {
  aquariumIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  mode: 'wander' | 'seek';
  phase: number;
  /** -1=左向き表示, 1=右向き表示 */
  facing: -1 | 1;
  /** 上下の傾き（rad） */
  pitch: number;
  state: AquariumSwimState;
  stateUntil: number;
  speedMul: number;
  homeY: number;
}

interface AquariumFoodPellet {
  x: number;
  y: number;
  swayPhase: number;
  tier: AquariumFoodTier;
}

interface AquariumFx {
  kind: 'heart' | 'ring';
  x: number;
  y: number;
  bornAt: number;
  aquariumIndex?: number;
}

interface AquariumBubble {
  /** ゆらぎの中心 X */
  baseX: number;
  x: number;
  y: number;
  r: number;
  riseSpeed: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
}

/** 水面から差し込む光帯（ゴッドレイ） */
interface AquariumGodRay {
  /** 根本の X（水平移動する） */
  x: number;
  /** 根元〜先端で共通の半幅（px） */
  halfW: number;
  length: number;
  life: number;
  age: number;
  /** 水平移動速度（px/秒）。符号で左右 */
  driftVx: number;
  maxAlpha: number;
}
import { characterConfigs, getCharacterById, getDefaultCharacterId } from '../data/characterConfig';
import { calculateDisplayStatIndices, getEffectiveSkillStatBonuses } from '../debug/balanceDebug';
import { createBalanceDebugPanel, type BalanceDebugPanelHandle } from '../debug/balanceDebugPanel';
import {
  FIGHT_TRACK_CENTER,
  fishParamsFromConfig,
  getFightBarHeight,
  resolveFightStartBarLayout,
  stepFightSimulation,
  type FightSimState,
} from '../fight/fightSimulation';
import {
  FishingGaugeOverlay,
  FIGHT_SKILL_DURATIONS,
  FISHING_GAUGE_UI_SCALE,
} from '../ui/fishingGaugeOverlay';
import { PLAYER_HINTS, type PlayerHintContent } from '../ui/playerHintTexts';
import { HudMoneyDisplay, TextMoneyDisplay } from '../ui/moneyDisplayCounter';
import { ExplorationController } from '../fishing/exploration/explorationController';
import { explorationConfig } from '../fishing/exploration/explorationConfig';
import { applyHookDepthToFightParams } from '../fishing/exploration/explorationFish';
import type { ExplorationResult } from '../fishing/exploration/explorationTypes';
import { drawWaterWarpPostEffect } from '../render/waterWarp';

const FishingState = {
  IDLE: 0,
  CASTING: 1,
  WAITING: 2,
  BITE: 3,
  FIGHTING: 4,
  SUCCESS: 5,
  FAIL: 6,
  EXPLORING: 7,
} as const;
type FishingStateValue = typeof FishingState[keyof typeof FishingState];
const CATCH_RESULT_FADE_MS = 300;
/** リザルトUI調整用: true で開始時にサンプルを出しっぱなし。終わったら false */
const DEBUG_CATCH_RESULT_PINNED = false;

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  /** 背面に担いだ竿（Graphics） */
  private fishingRodGfx!: Phaser.GameObjects.Graphics;
  /** 糸・浮き（キャラ手前） */
  private fishingLineGfx!: Phaser.GameObjects.Graphics;
  private fishingRig = {
    anchor: { x: 0, y: 0 },
    /** しなりなしの竿先（直線区間の終点） */
    rodStraightTip: { x: 0, y: 0 },
    /** しなった先端（糸の出どころ） */
    rodTip: { x: 0, y: 0 },
    float: { x: 0, y: 0 },
    targetFloat: { x: 0, y: 0 },
    castDistance: 0,
    phase: 0,
    castPullback: 0,
    rodBend: 0,
    castSnapT: 1,
    /** 左右移動時の糸・浮き慣性オフセット */
    floatInertiaX: 0,
    floatInertiaY: 0,
  };
  
  // プレイヤーの向き（'up', 'down', 'left', 'right'）
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'up';
  // 上下移動時も維持する左右の向き（スプライトの反転用）
  private lastHorizontalFacing: 'left' | 'right' = 'right';

  private state: FishingStateValue = FishingState.IDLE;
  private biteTimer?: Phaser.Time.TimerEvent;
  private biteTimeout?: Phaser.Time.TimerEvent;
  // 結果表示テキスト（HTML/CSS）
  private resultTextElement!: HTMLElement;
  private resultTextTimer?: Phaser.Time.TimerEvent;
  private catchResultElement!: HTMLElement;
  private catchResultDimmerElement!: HTMLElement;
  private catchResultTimer?: Phaser.Time.TimerEvent;
  private catchResultHideTimer?: Phaser.Time.TimerEvent;
  /** バッグ満杯時: 放流／入れかえ待ちの釣果情報 */
  private catchBagDecisionPending: {
    fish: FishConfig;
    fishSize?: number;
    stars: string;
    price: number;
    exp: number;
    leveledUp: boolean;
    isNewSpecies: boolean;
    level: number;
    duration: number;
    sizeRatio?: number;
  } | null = null;
  private catchBagDecisionPhase: 'choice' | 'pick' | null = null;
  private catchBagDecisionFocus: 'release' | 'swap' = 'swap';
  private catchBagPickNavIndex = 0;
  private catchBagPickFocus: 'grid' | 'cancel' = 'grid';
  private catchBagFullUIElement: HTMLElement | null = null;
  private catchBagPickGridElement: HTMLElement | null = null;
  private catchBagPickFadeTopElement: HTMLElement | null = null;
  private catchBagPickFadeBottomElement: HTMLElement | null = null;
  private catchBagPickScrollFadeObserver: ResizeObserver | null = null;
  private playerHintElement!: HTMLElement;
  private hudEquipHoverType: 'rod' | 'lure' | null = null;
  private hudEquipHoverPointerX = 0;
  private hudEquipHoverPointerY = 0;
  /** 装備ホバーヒントのフェードアウト中もポインター位置を維持する */
  private playerHintFollowPointer = false;
  private playerHintPointerFadeTimer: number | null = null;
  private biteMarkElement!: HTMLElement;

  // 投擲用
  private castPower: number = 0;
  private castDirection: number = 1;
  private castMaxHoldRemainingSec = 0;
  /** 直近キャストの投擲距離比率（0〜1）。サイズ抽選に使用 */
  private lastCastDistanceRatio = 0;
  private fishingGaugeOverlay!: FishingGaugeOverlay;
  /** 合わせ成功〜ファイトHUD導入中はシミュレーションを止める */
  private fightIntroPlaying = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // ファイトミニゲーム用
  private fishBarPosition: number = 0.5;
  private fishTargetPosition: number = 0.5;
  private fishMoveTimer: number = 0;
  private fishDriftIntent: number = 0;
  private fishDriftVelocity: number = 0;
  
  private playerBarPosition: number = 0.5;
  private playerBarVelocity: number = 0;
  private playerBarPrevRange: number = config.fighting['5-9_バー判定範囲'];
  private catchProgress: number = 0.3;
  private fightTension: number = 0;
  private fightTensionVelocity: number = 0;
  private fightElapsedSec: number = 0;
  private fightPeakTension: number = 0;
  private fishFatigue: number = 0;
  private fishFightState: 'running' | 'tired' = 'running';
  private fightSkillZKey!: Phaser.Input.Keyboard.Key;
  private fightSkillXKey!: Phaser.Input.Keyboard.Key;
  private fightSkillCKey!: Phaser.Input.Keyboard.Key;

  private explorationController: ExplorationController | null = null;
  /** フッキング時の深度比率（0=浅, 1=深）。探索成功時にセット */
  private hookDepthRatio = 0.5;
  private pendingExploration: { bonuses: RarityBonuses; junkWeightMultiplier: number } | null = null;
  private explorationAwaitingSplash = false;
  private explorationSplashTimer?: Phaser.Time.TimerEvent;

  // 現在釣っている魚
  private currentFish: FishConfig | null = null;
  private currentFishSize: number | undefined = undefined; // 現在釣っている魚のサイズ（ファイト開始時に生成）
  /** ファイト中アクティブ（Z/X/C 割当）— スキルごとに1回まで */
  private fightStaggerUsedThisFight: boolean = false;
  private fightSmoothDragUsedThisFight: boolean = false;
  private fightLockOnUsedThisFight: boolean = false;
  private fishFreezeRemainingSec: number = 0;
  private lockOnRemainingSec: number = 0;
  private smoothDragRemainingSec: number = 0;
  private speedComboMultiplier: number = 0;
  private skillSelectedNodeId: SkillNodeId | null = null;
  /** スキル解放確認モーダルで確定待ちのノード（null で未表示） */
  private skillUnlockConfirmPendingNodeId: SkillNodeId | null = null;
  /** 確認ダイアログのキーボード選択（左右・Enter と同期） */
  private skillUnlockConfirmFocus: 'cancel' | 'ok' = 'cancel';
  /** クエスト破棄確認モーダルで確定待ちのクエストID（null で未表示） */
  private questAbandonConfirmPendingQuestId: string | null = null;
  /** クエスト破棄確認ダイアログのキーボード選択 */
  private questAbandonConfirmFocus: 'cancel' | 'ok' = 'cancel';
  // プレイヤーデータ
  private playerData!: PlayerData;

  // ステータスUI（HTML/CSS）
  private statusUIElement!: HTMLElement;
  private readonly hudMoneyDisplay = new HudMoneyDisplay();
  private readonly shopMoneyDisplay = new TextMoneyDisplay();

  // インベントリUI（HTML/CSS）
  private inventoryUIElement!: HTMLElement;
  private inventorySlots: HTMLElement[] = [];
  private inventorySlotElements: Array<{
    slot: HTMLElement;
    bg: HTMLElement;
    image: HTMLCanvasElement;
    emoji: HTMLElement;
    name: HTMLElement;
    price: HTMLElement;
  }> = [];
  private inventoryOpen: boolean = false;
  private selectedSlotIndex: number = 0;

  // 詳細モーダル（HTML/CSS）
  private detailModalElement!: HTMLElement;
  private detailModalOpen: boolean = false;

  // 図鑑UI（HTML/CSS）
  private bookUIElement!: HTMLElement;
  private bookSlots: HTMLElement[] = [];
  private bookSlotElements: Array<{
    slot: HTMLElement;
    bg: HTMLElement;
    image: HTMLCanvasElement;
    emoji: HTMLElement;
    name: HTMLElement;
    rarity: HTMLElement;
  }> = [];
  private bookProgressElement!: HTMLElement;
  private bookPageTextElement!: HTMLElement;
  private bookOpen: boolean = false;
  private bookPage: number = 0;
  private bookSelectedIndex: number = 0;
  private bookDetailElement!: HTMLElement;
  private bookDetailOpen: boolean = false;

  // 統合BookUI（2ペイン）
  private unifiedBookUIElement!: HTMLElement;
  private unifiedBookOpen: boolean = false;
  private unifiedBookTab: UnifiedBookTab = 'inventory';
  private readonly unifiedBookTabOrder: UnifiedBookTab[] = [
    'inventory',
    'aquarium',
    'status',
    'skills',
    'quest',
    'achievement',
    'pedia',
  ];
  private aquariumRemoveConfirmIndex: number | null = null;
  private aquariumRemoveConfirmTimer: number | null = null;
  private aquariumSatietyIntervalId: number | null = null;
  private aquariumPendingBagIndex: number | null = null;
  /** バッグから魚を選ぶモーダル（追加 / 入れかえ） */
  private aquariumBagPickMode: 'add' | 'swap' | null = null;
  private aquariumBagPickNavIndex = 0;
  private aquariumBagPickFocus: 'grid' | 'cancel' = 'grid';
  private aquariumBagPickGridElement: HTMLElement | null = null;
  private aquariumBagPickFadeTopElement: HTMLElement | null = null;
  private aquariumBagPickFadeBottomElement: HTMLElement | null = null;
  private aquariumBagPickScrollFadeObserver: ResizeObserver | null = null;
  /** アクアリウムタブ: スロット行 / 詳細パネル / エサ選択 / 水槽投下 */
  private aquariumNavArea: 'slots' | 'detail' | 'food' | 'tank' = 'slots';
  private aquariumDetailNavIndex = 0;
  private readonly aquariumAimStepPx = 48;
  // 水槽ビュー
  private aquariumRafId: number | null = null;
  private aquariumLastFrameAt = 0;
  private aquariumAimX = 480;
  private aquariumLastFeedAt = 0;
  private aquariumFishRuntimes: AquariumFishRuntime[] = [];
  private aquariumPellets: AquariumFoodPellet[] = [];
  private aquariumFishImages = new Map<string, HTMLImageElement>();
  private aquariumBgImage: HTMLImageElement | null = null;
  private aquariumBgCache: HTMLCanvasElement | null = null;
  private aquariumBgFailed = false;
  private aquariumFgCache: HTMLCanvasElement | null = null;
  private aquariumFgFailed = false;
  private aquariumFx: AquariumFx[] = [];
  private aquariumBubbles: AquariumBubble[] = [];
  private aquariumGodRays: AquariumGodRay[] = [];
  private aquariumKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private aquariumCanvasEl: HTMLCanvasElement | null = null;
  private aquariumUIElement: HTMLElement | null = null;
  private aquariumCanvasBound = false;
  /** マウスが水槽キャンバス上にあるときだけ投下マーカーを出す */
  private aquariumPointerOverCanvas = false;
  private aquariumSelectedFoodTier: AquariumFoodTier = 'normal';
  private aquariumFoodSelectBound = false;
  private unifiedBookSelectedId: string | null = null;
  private unifiedBookSelectedIndex: number | null = null;
  private unifiedBookNavRepeatDir: 'up' | 'down' | 'left' | 'right' | null = null;
  private unifiedBookNavNextMoveAt: number = 0; // Phaser time (ms)
  private unifiedBookNavInitialDelayMs: number = 220;
  private unifiedBookNavRepeatIntervalMs: number = 70;
  /** 上部 Book タブ行をキー操作中（左リスト先頭から↑で入る） */
  private unifiedBookMainTabsNavActive: boolean = false;
  /** 選択が端でこれ以上動けないとき、上下キーでスクロールさせる量（px） */
  private readonly BOOK_EDGE_SCROLL_STEP_PX = 56;
  private unifiedBookListItems: HTMLElement[] = [];
  /** 図鑑左リストの並び（レアリティ / 生息地） */
  private unifiedBookPediaSortMode: 'rarity' | 'waters' = 'rarity';
  /** 図鑑タブ: ソート行と魚リストのどちらをキー操作しているか */
  private pediaNavArea: 'sort' | 'list' = 'list';
  private unifiedBookListScrollElement!: HTMLElement;
  private unifiedBookListScrollFadeBottomElement: HTMLElement | null = null;
  private unifiedBookListScrollFadeTopElement: HTMLElement | null = null;
  private bookListScrollFadeObserver: ResizeObserver | null = null;
  private unifiedBookRightPaneScrollElement!: HTMLElement;
  private unifiedBookRightPaneFadeTopElement: HTMLElement | null = null;
  private unifiedBookRightPaneFadeBottomElement: HTMLElement | null = null;
  private bookRightPaneScrollFadeObserver: ResizeObserver | null = null;
  private bookSkillTreeScrollElement!: HTMLElement;
  private bookSkillTreeFadeTopElement!: HTMLElement;
  private bookSkillTreeFadeBottomElement!: HTMLElement;
  private bookSkillTreeScrollFadeObserver: ResizeObserver | null = null;
  private unifiedBookDetailElement!: HTMLElement;
  private unifiedBookDetailPlaceholderElement!: HTMLElement;
  private skillNavArea: 'category' | 'tree' | 'unlock' = 'tree';
  /** 実績タブ: 左＝カテゴリ一覧 / 右＝実績詳細リスト */
  private achievementNavArea: 'left' | 'right' = 'left';
  private achievementDetailSelectedIndex: number = 0;
  private questHudElement!: HTMLElement;
  private questBoardOpen: boolean = false;
  private questBoardUIElement!: HTMLElement;
  private questBoardSelectedIndex: number = 0;
  private questBoardCardsScrollElement: HTMLElement | null = null;
  private questBoardScrollFadeTopElement: HTMLElement | null = null;
  private questBoardScrollFadeBottomElement: HTMLElement | null = null;
  private questBoardScrollFadeObserver: ResizeObserver | null = null;
  private readonly questBoardGridCols = 3;
  private questBoardDocumentKeyHandler = (e: KeyboardEvent) => {
    if (!this.questBoardOpen) return;
    const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    const dir = dirMap[e.key];
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    this.noteUiMenuKeyboardNavigation();
    const moved = this.moveQuestBoardSelection(dir);
    if (!moved && (dir === 'up' || dir === 'down')) {
      this.nudgeQuestBoardScrollOnVerticalEdge(dir);
    }
  };
  private readonly bulletinBoardZone = { x: 750, y: 480, width: 70, height: 60 };
  /** キー選択行の右下に表示する指し示しアイコン（body 直下・fixed） */
  private kbSelectionPointerEl: HTMLDivElement | null = null;
  /** 指マーカーが表示中か（初回表示・再表示はスナップ、移動のみイージング） */
  private kbSelectionPointerVisible = false;
  /** 直前に指を付けていたホスト（変わったときだけ移動イージング） */
  private kbSelectionPointerLastHost: HTMLElement | null = null;
  /** この時刻までは left/top の CSS transition を有効にする */
  private kbSelectionPointerEaseUntilMs = 0;
  /** メニュー操作の直近入力（キー時のみ実カーソルを隠す） */
  private uiMenuNavInputChannel: 'mouse' | 'keyboard' = 'mouse';
  private selectedStatusStatKey: 'power' | 'speed' | 'technique' | 'control' = 'power';
  private readonly statusStatOrder: Array<'power' | 'speed' | 'technique' | 'control'> = ['power', 'speed', 'technique', 'control'];
  private statusEquipmentSelectorType: 'rod' | 'lure' | null = null;
  private statusNavArea: 'stats' | 'equipmentButtons' | 'equipmentOptions' = 'stats';
  private statusNavButtonType: 'rod' | 'lure' = 'rod';
  private statusLastInteractedButtonType: 'rod' | 'lure' = 'rod';
  private statusNavEquipOptionIndex: number = 0;
  private statusPreviewEquipmentType: 'rod' | 'bait' | 'lure' | null = null;
  private statusPreviewEquipmentId: string | null = null;

  // ショップUI（HTML/CSS）
  private shopUIElement!: HTMLElement;

  // 実績UI（HTML/CSS）
  private achievementUIElement!: HTMLElement;
  private achievementNotificationElement!: HTMLElement;
  private achievementOpen: boolean = false;
  private shopItemsScrollWrapElement: HTMLElement | null = null;
  private shopItemsScrollFadeTopElement: HTMLElement | null = null;
  private shopItemsScrollFadeBottomElement: HTMLElement | null = null;
  private shopItemsScrollFadeObserver: ResizeObserver | null = null;
  private shopItemsListElement!: HTMLElement;
  private shopMoneyElement!: HTMLElement;
  private shopOpen: boolean = false;

  private shopSelectedIndex: number = -1;
  private shopTab: 'rod' | 'bait' | 'lure' | 'inventory' = 'rod';
  private shopNavArea: 'tabs' | 'items' = 'items';

  // 操作説明テキスト（HTML/CSS）
  private controlsTextElement!: HTMLElement;

  // デバッグ用FPS表示（HTML/CSS）
  private debugFpsElement!: HTMLElement;

  // パフォーマンス最適化用
  private static readonly CAMERA_TRANSITION_MS = 450;
  private static readonly CAMERA_FOLLOW_LERP = 0.1;
  private cameraFocusTarget: 'player' | 'float' = 'player';
  private cameraTransitionProgress = 1;
  private cameraTransitionFrom = { scrollX: 0, scrollY: 0 };
  /** キャスト着水位置（ウキの揺れに追従しない固定センター） */
  private fixedFloatCenter: { x: number; y: number } | null = null;
  private lastCameraX: number = 0;
  private lastCameraY: number = 0;
  private lastCameraWidth: number = 0;
  private lastCameraHeight: number = 0;
  private lastCanvasRect: DOMRect | null = null;
  
  // Canvas描画キャッシュ（画像のスケール済みデータを保持）
  private canvasImageCache: Map<string, { canvas: HTMLCanvasElement; width: number; height: number }> = new Map();
  // 輪郭白フチ描画用の一時Canvas（再利用）
  private outlineTempCanvas: HTMLCanvasElement | null = null;
  private outlineTempCtx: CanvasRenderingContext2D | null = null;

  // モーダルスタック管理
  private modalStack: string[] = [];
  private modalOverlayElement!: HTMLElement;
  private scrollLockCount: number = 0;
  
  // モーダルID定義
  private readonly MODAL_IDS = {
    INVENTORY: 'inventory-modal',
    DETAIL: 'detail-modal',
    BOOK: 'book-modal',
    BOOK_DETAIL: 'book-detail-modal',
    SHOP: 'shop-modal',
    UNIFIED_BOOK: 'book-ui',
    QUEST_BOARD: 'quest-board-modal',
    CHARACTER: 'character-settings',
    BALANCE_DEBUG: 'balance-debug-modal',
  } as const;

  // デバッグ用キャラクター設定UI
  private characterSettingsElement!: HTMLElement;
  private balanceDebugPanel!: BalanceDebugPanelHandle;
  private characterPreviewIntervalId: number | null = null;
  private characterColorTemp: string = '#ffffff';
  private readonly CHARACTER_COLORS: { value: string; label?: string }[] = [
    { value: '#ffffff', label: 'なし' },
    { value: '#F27F7F' },
    { value: '#F8AB63' },
    { value: '#F7D764' },
    { value: '#C5E178' },
    { value: '#789FD9' },
    { value: '#B28CDB' },
    { value: '#E087AE' },
  ];

  constructor() {
    super('GameScene');
  }

  // --- キャラクター設定ヘルパー ---

  private getSelectedCharacterId(): string {
    if (typeof window === 'undefined') return getDefaultCharacterId();
    const stored = window.localStorage.getItem('bf_character_id');
    if (!stored) return getDefaultCharacterId();
    return getCharacterById(stored) ? stored : getDefaultCharacterId();
  }

  private getSelectedPlayerName(): string {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('bf_player_name') ?? '';
  }

  private getSelectedColor(): string {
    if (typeof window === 'undefined') return '#ffffff';
    return window.localStorage.getItem('bf_character_color') ?? '#ffffff';
  }

  private renderStatusCharacterIcon(characterId?: string, colorHex?: string) {
    if (!this.statusUIElement) return;
    const canvas = this.statusUIElement.querySelector('#status-character-icon-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    this.renderCharacterIconToCanvas(canvas, characterId, colorHex);
  }

  private renderCharacterIconToCanvas(canvas: HTMLCanvasElement, characterId?: string, colorHex?: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const tintColor = (colorHex ?? this.getSelectedColor()).toLowerCase();
    const displaySize = canvas.width;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, displaySize, displaySize);

    // メインcanvas上のプレイヤーと同じ見た目に寄せるため、
    // 可能なら現在のプレイヤーフレームを直接転写する。
    let drewFromPlayerFrame = false;
    // アイコンは常にスプライト先頭フレーム（アイドル1コマ目）のみ。プレイヤーアニメに同期しない。
    if (this.player?.texture) {
      const frame = this.player.texture.get(0);
      const sourceImage = frame?.source?.image as CanvasImageSource | undefined;
      if (sourceImage) {
        ctx.drawImage(
          sourceImage,
          frame.cutX,
          frame.cutY,
          frame.cutWidth,
          frame.cutHeight,
          0,
          0,
          displaySize,
          displaySize
        );
        drewFromPlayerFrame = true;
      }
    }

    // 初期化直後などで player が未生成の場合は、従来どおりスプライト先頭フレームでフォールバック。
    if (!drewFromPlayerFrame) {
      const id = characterId ?? this.getSelectedCharacterId();
      const character = getCharacterById(id);
      if (!character) return;
      const frameSize = 24;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/' + character.sheetPath;
      img.onload = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, displaySize, displaySize);
        ctx.drawImage(img, 0, 0, frameSize, frameSize, 0, 0, displaySize, displaySize);
        this.applyStatusIconTint(ctx, displaySize, tintColor);
      };
      return;
    }

    this.applyStatusIconTint(ctx, displaySize, tintColor);
  }

  private applyStatusIconTint(ctx: CanvasRenderingContext2D, size: number, tintColor: string) {
    // Phaser の setTint に近い挙動: 各ピクセルに乗算
    if (!tintColor || tintColor === '#ffffff') return;
    const m = tintColor.match(/^#([0-9a-f]{6})$/);
    if (!m) return;
    const tint = parseInt(m[1], 16);
    const tr = (tint >> 16) & 0xff;
    const tg = (tint >> 8) & 0xff;
    const tb = tint & 0xff;
    const rf = tr / 255;
    const gf = tg / 255;
    const bf = tb / 255;

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;
      data[i] = data[i] * rf;
      data[i + 1] = data[i + 1] * gf;
      data[i + 2] = data[i + 2] * bf;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private getRarityColorCssValue(rarity: string): string {
    switch (rarity) {
      case 'common':
        return 'var(--color-rarity-common)';
      case 'uncommon':
        return 'var(--color-rarity-uncommon)';
      case 'rare':
        return 'var(--color-rarity-rare)';
      case 'epic':
        return 'var(--color-rarity-epic)';
      case 'legendary':
        return 'var(--color-rarity-legendary)';
      default:
        return 'var(--color-rarity-common)';
    }
  }

  /** 図鑑左リスト・詳細ヘッダ共通: 5段固定（点灯＝レア色、消灯＝#bababa） */
  private buildBookRarityStarsInnerHtml(rarity: string): string {
    const starCount = rarityStarCount[rarity as Rarity] ?? rarityStarCount[Rarity.COMMON];
    const colorVal = this.getRarityColorCssValue(rarity);
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < starCount) {
        html += `<span class="book-rarity-star book-rarity-star--on" style="color: ${colorVal}">★</span>`;
      } else {
        html += `<span class="book-rarity-star book-rarity-star--off" style="color: #bababa">★</span>`;
      }
    }
    return html;
  }

  private saveCharacterSettings(id: string, name: string, color: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('bf_character_id', id);
    window.localStorage.setItem('bf_player_name', name);
    window.localStorage.setItem('bf_character_color', color);
  }

  preload() {
    // プレイヤーキャラクターのスプライトシート（characterConfig から取得）
    // 1行目: アイドル, 2行目: 移動（1コマ24x24）
    const characterId = this.getSelectedCharacterId();
    const character = getCharacterById(characterId);
    const spriteSheetPath = character?.sheetPath ?? characterConfigs[0]?.sheetPath ?? 'images/character/Basic character v1.png';

    this.load.spritesheet('player', spriteSheetPath, {
      frameWidth: 24,
      frameHeight: 24
    });

    // プレイヤーの足元の影
    this.load.image('player-shadow', 'images/character/Shadow.png');

    for (const [fishId, fileName] of Object.entries(fishImageFileNames)) {
      this.load.image(fishId, `/images/fish/${fileName}.png`);
    }

    // ショップアイテムの画像を読み込み（IDと日本語ファイル名のマッピング）
    for (const [itemId, fileName] of Object.entries(itemImageFileNames)) {
      this.load.image(itemId, `/images/items/${fileName}.png`);
    }
  }

  /** 白フチ用シャドウ: 真下方向オフセット X（px） */
  private static readonly OUTLINE_SHADOW_OFFSET_X = 0;
  /** 白フチ用シャドウ: 真下方向オフセット Y（px）、距離を2増やして 5 */
  private static readonly OUTLINE_SHADOW_OFFSET_Y = 5;
  /** 白フチ用シャドウ: 黒 25% */
  private static readonly OUTLINE_SHADOW_STYLE = 'rgba(0,0,0,0.35)';

  /**
   * 切り抜き形状に沿った白フチ（輪郭ストローク）＋真下方向のシャドウを付けて魚画像を描画する。
   * 画像のアルファ形状に沿ったアウトラインになり、四角い枠にはならない。
   */
  private drawFishImageWithOutline(
    ctx: CanvasRenderingContext2D,
    sourceImage: HTMLImageElement,
    frame: { cutX: number; cutY: number; cutWidth: number; cutHeight: number },
    destX: number,
    destY: number,
    destW: number,
    destH: number,
    outlineWidth: number = 2,
    outlineColor: string = '#ffffff'
  ): void {
    const needWidth = Math.ceil(destW) + outlineWidth * 4;
    const needHeight = Math.ceil(destH) + outlineWidth * 4;
    if (!this.outlineTempCanvas || this.outlineTempCanvas.width < needWidth || this.outlineTempCanvas.height < needHeight) {
      this.outlineTempCanvas = document.createElement('canvas');
      this.outlineTempCanvas.width = Math.max(needWidth, 256);
      this.outlineTempCanvas.height = Math.max(needHeight, 256);
      this.outlineTempCtx = this.outlineTempCanvas.getContext('2d');
    }
    const temp = this.outlineTempCtx;
    if (!temp) return;

    const tw = Math.ceil(destW);
    const th = Math.ceil(destH);
    const sox = GameScene.OUTLINE_SHADOW_OFFSET_X;
    const soy = GameScene.OUTLINE_SHADOW_OFFSET_Y;

    // シャドウ・白フチをぼかしなしで描画（スムージング無効）
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    temp.save();
    temp.imageSmoothingEnabled = false;

    // 1. シャドウ（真下方向・黒25%）をシルエットで描画（ぼかしなし）
    temp.clearRect(0, 0, tw, th);
    temp.fillStyle = GameScene.OUTLINE_SHADOW_STYLE;
    temp.fillRect(0, 0, tw, th);
    temp.globalCompositeOperation = 'destination-in';
    temp.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, tw, th);
    temp.restore();
    ctx.drawImage(this.outlineTempCanvas, 0, 0, tw, th, destX + sox, destY + soy, tw, th);

    // 2. 白フチ（8方向オフセット）
    temp.save();
    temp.clearRect(0, 0, tw, th);
    temp.fillStyle = outlineColor;
    temp.fillRect(0, 0, tw, th);
    temp.globalCompositeOperation = 'destination-in';
    temp.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, tw, th);
    temp.restore();
    const offsets: [number, number][] = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
    ];
    for (const [ox, oy] of offsets) {
      ctx.drawImage(this.outlineTempCanvas, 0, 0, tw, th, destX + ox * outlineWidth, destY + oy * outlineWidth, tw, th);
    }

    // 3. 元画像
    ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, destX, destY, destW, destH);

    ctx.restore();
  }

  create() {
    // プレイヤーデータを読み込み
    this.playerData = loadPlayerData();
    this.aquariumSelectedFoodTier = this.playerData.aquariumSelectedFoodTier ?? 'normal';
    if (migrateBoardQuestsIfNeeded(this.playerData)) {
      savePlayerData(this.playerData);
    }
    // セーブデータと魚種定義のズレで未解除のまま残った実績を補正
    if (checkAchievements(this.playerData).length > 0) {
      savePlayerData(this.playerData);
    }

    const mainCfg = config.main;

    // マップサイズ（キャンバスより大きい）
    const mapWidth = 1200;
    const mapHeight = 900;

    // カメラの背景色（マップ外の部分）
    this.cameras.main.setBackgroundColor('#2d5a1a');

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // ============================================
    // マップデザイン
    // ============================================
    
    // 背景（草地）
    this.add.rectangle(0, 0, mapWidth, mapHeight, 0x5a9f3a).setOrigin(0);
    
    // 草地のテクスチャ風装飾（ランダムな濃い草）
    for (let i = 0; i < 100; i++) {
        const x = Phaser.Math.Between(0, mapWidth);
        const y = Phaser.Math.Between(250, mapHeight);
        const size = Phaser.Math.Between(20, 50);
        this.add.circle(x, y, size, 0x4a8f2a, 0.3);
    }

    // === 中央の大きな池 ===
    // 池の外枠（砂浜）
    this.add.ellipse(600, 200, 900, 350, 0xc2b280).setOrigin(0.5);
    // 池本体（水）
    this.add.ellipse(600, 200, 850, 300, 0x4fa4f4).setOrigin(0.5);
    // 池の深い部分
    this.add.ellipse(600, 190, 650, 200, 0x3d8bd4).setOrigin(0.5);
    // 水面のキラキラ
    for (let i = 0; i < 15; i++) {
        const x = Phaser.Math.Between(250, 950);
        const y = Phaser.Math.Between(80, 280);
        this.add.ellipse(x, y, 8, 4, 0xffffff, 0.4);
    }

    // === 左下の小さな池 ===
    this.add.ellipse(150, 700, 250, 200, 0xc2b280).setOrigin(0.5);
    this.add.ellipse(150, 700, 220, 170, 0x4fa4f4).setOrigin(0.5);
    this.add.ellipse(150, 695, 150, 100, 0x3d8bd4).setOrigin(0.5);

    // === 右側の川 ===
    // 川の流れ
    this.add.rectangle(1100, 400, 120, 500, 0xc2b280).setOrigin(0.5);
    this.add.rectangle(1100, 400, 80, 500, 0x4fa4f4).setOrigin(0.5);
    this.add.rectangle(1100, 400, 50, 500, 0x3d8bd4, 0.5).setOrigin(0.5);

    // === 装飾：木 ===
    const treePositions = [
        { x: 100, y: 450 }, { x: 50, y: 520 }, { x: 180, y: 480 },
        { x: 300, y: 600 }, { x: 350, y: 700 }, { x: 280, y: 800 },
        { x: 900, y: 500 }, { x: 950, y: 600 }, { x: 850, y: 700 },
        { x: 500, y: 750 }, { x: 700, y: 800 }, { x: 600, y: 850 },
    ];
    for (const pos of treePositions) {
        // 木の幹
        this.add.rectangle(pos.x, pos.y + 20, 16, 30, 0x8b5a2b).setOrigin(0.5);
        // 木の葉
        this.add.circle(pos.x, pos.y - 10, 28, 0x2d5a1d);
        this.add.circle(pos.x - 12, pos.y, 20, 0x3d6a2d);
        this.add.circle(pos.x + 12, pos.y, 20, 0x3d6a2d);
    }

    // === 装飾：岩 ===
    const rockPositions = [
        { x: 400, y: 450 }, { x: 750, y: 550 }, { x: 200, y: 850 },
        { x: 1000, y: 750 }, { x: 550, y: 650 },
    ];
    for (const pos of rockPositions) {
        this.add.ellipse(pos.x, pos.y, 40, 25, 0x666666).setOrigin(0.5);
        this.add.ellipse(pos.x - 5, pos.y - 5, 30, 18, 0x888888).setOrigin(0.5);
    }

    // === 装飾：花 ===
    for (let i = 0; i < 30; i++) {
        const x = Phaser.Math.Between(50, mapWidth - 150);
        const y = Phaser.Math.Between(400, mapHeight - 50);
        const colors = [0xff6b6b, 0xffd93d, 0xffffff, 0xff9ff3];
        const color = colors[Phaser.Math.Between(0, colors.length - 1)];
        this.add.circle(x, y, 4, color);
    }

    // === 掲示板（クエスト受注） ===
    const bb = this.bulletinBoardZone;
    this.add.rectangle(bb.x, bb.y + 8, 12, 50, 0x8b5a2b).setOrigin(0.5).setDepth(5);
    this.add.rectangle(bb.x, bb.y - 18, 72, 52, 0xc9a66b).setOrigin(0.5).setDepth(5);
    this.add.rectangle(bb.x - 14, bb.y - 22, 18, 14, 0xfff8e7).setOrigin(0.5).setDepth(6);
    this.add.rectangle(bb.x + 10, bb.y - 14, 16, 12, 0xfff8e7).setOrigin(0.5).setDepth(6);
    this.add.rectangle(bb.x + 2, bb.y - 6, 20, 14, 0xfff8e7).setOrigin(0.5).setDepth(6);
    // ============================================
    // プレイヤー
    // ============================================
    const playerSize = mainCfg['1-1_プレイヤーサイズ'];
    const baseFrameHeight = 24;
    const playerScale = (playerSize / baseFrameHeight) * 2;

    this.player = this.physics.add
      .sprite(600, 500, 'player', 0)
      .setScale(playerScale);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.fishingRodGfx = this.add.graphics().setDepth(11);
    this.fishingLineGfx = this.add.graphics().setDepth(12);
    this.initCarriedRodRig();

    // 足元の影（プレイヤーに追従）
    const shadowOffsetY = playerSize * playerScale * 0.38;
    this.playerShadow = this.add
      .image(this.player.x, this.player.y + shadowOffsetY, 'player-shadow')
      .setDepth(this.player.depth - 1)
      .setScale(playerScale*0.85);

    this.events.on('update', () => {
      this.playerShadow.setPosition(this.player.x, this.player.y + shadowOffsetY);
    });

    // キャラカラーを適用（白以外ならtint）
    const colorHex = this.getSelectedColor().toLowerCase();
    if (colorHex && colorHex !== '#ffffff' && /^#([0-9a-f]{6})$/.test(colorHex)) {
      const tint = parseInt(colorHex.slice(1), 16);
      this.player.setTint(tint);
    } else {
      this.player.clearTint();
    }

    // プレイヤーアニメーション（1行目=アイドル 0-7, 2行目=移動 10-12）
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('player', { start: 9, end: 12 }),
      frameRate: 8,
      repeat: -1
    });

    this.player.anims.play('player-idle');

    // HTML/CSSで結果表示を作成
    const resultHTML = `
      <div id="result-text" class="result-text" style="display: none;"></div>
    `;
    const tempDiv1 = document.createElement('div');
    tempDiv1.innerHTML = resultHTML;
    this.resultTextElement = tempDiv1.firstElementChild as HTMLElement;
    document.body.appendChild(this.resultTextElement);

    const catchResultHTML = `
      <div id="catch-result-dimmer" class="catch-result-dimmer" style="display: none;" aria-hidden="true"></div>
      <div id="catch-result-popup" class="catch-result-popup" style="display: none;">
        <img class="catch-result-bg" src="/images/ui/result-bg.png" alt="" draggable="false" />
        <div class="catch-result-exp-chip">
          <span class="catch-result-exp-value"></span>
          <span class="catch-result-exp-label">exp.</span>
        </div>
        <img class="catch-result-big-label" src="/images/Fishing Result UI/Big-label.svg" alt="Big" />
        <div class="catch-result-content">
          <div class="catch-result-main-block">
            <div class="catch-result-fish-wrap">
              <img class="catch-result-fish-image" alt="fish" />
              <div class="catch-result-fish-emoji"></div>
            </div>
            <div class="catch-result-rarity-line"></div>
            <div class="catch-result-text-wrap">
              <div class="catch-result-main-line"></div>
            </div>
          </div>
          <div class="catch-result-meta-row">
            <div class="catch-result-meta-chip">
              <img src="/images/ui/ゴールド.png" alt="売値" class="catch-result-meta-icon-image book-detail-stat-label-icon" />
              <span class="catch-result-meta-value catch-result-price-value"></span>
              <span class="catch-result-meta-unit">g</span>
            </div>
            <div class="catch-result-meta-chip">
              <img src="/images/ui/サイズ.png" alt="サイズ" class="catch-result-meta-icon-image book-detail-stat-label-icon" />
              <span class="catch-result-meta-value catch-result-size-value"></span>
              <span class="catch-result-meta-unit">cm</span>
            </div>
          </div>
        </div>
      </div>
    `;
    const tempDivResult = document.createElement('div');
    tempDivResult.innerHTML = catchResultHTML;
    this.catchResultDimmerElement = tempDivResult.children[0] as HTMLElement;
    this.catchResultElement = tempDivResult.children[1] as HTMLElement;
    document.body.appendChild(this.catchResultDimmerElement);
    document.body.appendChild(this.catchResultElement);
    if (DEBUG_CATCH_RESULT_PINNED) {
      this.debugPinCatchResultPopup();
    }

    this.createCatchBagFullUI();

    this.createGameWorldTextUI();

    // 投擲・ファイトゲージ（HTML オーバーレイ）
    this.fishingGaugeOverlay = new FishingGaugeOverlay();
    this.fishingGaugeOverlay.mountGame();

    // グローバルoverlayを作成（1枚だけ）
    this.createModalOverlay();

    // ステータスUI
    this.createStatusUI();

    // インベントリUI
    this.createInventoryUI();

    // 詳細モーダル
    this.createDetailModal();

    // 図鑑UI
    this.createBookUI();

    // 統合BookUI（2ペイン）
    this.createUnifiedBookUI();
    this.createAquariumUI();
    this.updateAquariumTabVisibility();

    // ショップUI
    this.createShopUI();
    this.createQuestBoardUI();

    // 実績UI
    this.createAchievementUI();

    // デバッグ用キャラクター設定UI（起動時に一度生成）
    this.createCharacterSettingsUI();
    this.createBalanceDebugUI();

    const markUiMenuMousePointer = (e?: PointerEvent) => {
      if (e && e.type === 'pointermove' && e.movementX === 0 && e.movementY === 0) return;
      this.applyUiMenuNavInputChannel('mouse');
    };
    document.addEventListener('pointerdown', () => markUiMenuMousePointer(), { capture: true });
    document.addEventListener('pointermove', (ev) => markUiMenuMousePointer(ev as PointerEvent), { capture: true });
    document.addEventListener('wheel', () => markUiMenuMousePointer(), { capture: true, passive: true });

    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.fightSkillZKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.fightSkillXKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.fightSkillCKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        
        // Eキーで全て売却（統合BookUIでは E = 次タブのため無効）
        this.input.keyboard.on('keydown-E', () => {
            if (this.catchBagDecisionPending) return;
            if (this.unifiedBookOpen) return;
            if (this.state === FishingState.IDLE) {
                this.sellAll();
            }
        });

        // Iキーでインベントリ表示（統合BookUI）
        this.input.keyboard.on('keydown-I', () => {
            if (this.catchBagDecisionPending) return;
            if (this.state === FishingState.EXPLORING) return;
            if (this.unifiedBookOpen) {
                if (this.unifiedBookTab === 'inventory') {
                    this.closeUnifiedBook();
                } else {
                    this.switchUnifiedBookTab('inventory');
                }
            } else {
                this.openUnifiedBook('inventory');
            }
        });

        // Aキーで実績表示（統合BookUI）
        this.input.keyboard.on('keydown-A', () => {
            if (this.catchBagDecisionPending) return;
            if (this.state === FishingState.EXPLORING) return;
            if (this.unifiedBookOpen) {
                if (this.unifiedBookTab === 'achievement') {
                    this.closeUnifiedBook();
                } else {
                    this.switchUnifiedBookTab('achievement');
                }
            } else {
                this.openUnifiedBook('achievement');
            }
        });

        // ESCキーで閉じる（最上位モーダルのみ）
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.explorationController?.isActive()) {
                this.explorationController.cancel();
                return;
            }
            if (this.state === FishingState.EXPLORING) {
                this.cancelFishing('探索をやめた');
                return;
            }
            if (this.catchBagDecisionPhase === 'pick') {
                this.closeCatchBagPickToChoice();
                return;
            }
            if (this.catchBagDecisionPhase === 'choice') {
                // 選択必須のため ESC では閉じない（放流は明示選択）
                return;
            }
            // 実績モーダルが開いている場合は閉じる
            if (this.achievementOpen) {
                this.closeAchievementModal();
                return;
            }
            // 統合BookUIが開いている場合は閉じる（スキル解放確認中は確認だけ閉じる）
            if (this.unifiedBookOpen) {
                if (this.skillUnlockConfirmPendingNodeId) {
                  this.closeSkillUnlockConfirm();
                  return;
                }
                if (this.questAbandonConfirmPendingQuestId) {
                  this.closeQuestAbandonConfirm();
                  return;
                }
                if (this.aquariumBagPickMode) {
                  this.closeAquariumBagPick();
                  return;
                }
                this.closeUnifiedBook();
                return;
            }

            const topModalId = this.modalStack[this.modalStack.length - 1];
            if (!topModalId) return;

            // 最上位モーダルを閉じる
            if (topModalId === this.MODAL_IDS.DETAIL) {
                this.closeDetailModal();
            } else if (topModalId === this.MODAL_IDS.INVENTORY) {
                this.closeInventory();
            } else if (topModalId === this.MODAL_IDS.BOOK_DETAIL) {
                this.closeBookDetail();
            } else if (topModalId === this.MODAL_IDS.BOOK) {
                this.closeBook();
            } else if (topModalId === this.MODAL_IDS.SHOP) {
                this.closeShop();
            } else if (topModalId === this.MODAL_IDS.QUEST_BOARD) {
                this.closeQuestBoard();
            }
        });

        // エンターキーで詳細を開く/購入
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.catchBagDecisionPhase === 'choice') {
              this.applyCatchBagDecisionChoice();
              return;
            }
            if (this.catchBagDecisionPhase === 'pick') {
              this.triggerCatchBagPickKeyboardAction();
              return;
            }
            if (this.unifiedBookOpen) {
                if (this.skillUnlockConfirmPendingNodeId) {
                  if (this.skillUnlockConfirmFocus === 'cancel') {
                    this.closeSkillUnlockConfirm();
                  } else {
                    this.applySkillUnlockConfirm();
                  }
                  return;
                }
                if (this.questAbandonConfirmPendingQuestId) {
                  if (this.questAbandonConfirmFocus === 'cancel') {
                    this.closeQuestAbandonConfirm();
                  } else {
                    this.applyQuestAbandonConfirm();
                  }
                  return;
                }
                if (this.aquariumBagPickMode) {
                  this.triggerAquariumBagPickKeyboardAction();
                  return;
                }
                if (this.unifiedBookTab === 'skills' && this.skillNavArea === 'unlock') {
                    this.triggerSkillDetailAction();
                } else if (this.unifiedBookTab === 'status') {
                    this.triggerStatusKeyboardAction();
                } else if (this.unifiedBookTab === 'aquarium') {
                    this.triggerAquariumKeyboardAction();
                } else if (
                  (this.unifiedBookTab === 'achievement' || this.unifiedBookTab === 'quest') &&
                  this.achievementNavArea === 'left'
                ) {
                    this.noteUiMenuKeyboardNavigation();
                    this.tryEnterAchievementRightPane();
                } else if (
                  this.unifiedBookTab === 'quest' &&
                  this.achievementNavArea === 'right' &&
                  this.unifiedBookSelectedId === 'active'
                ) {
                    this.noteUiMenuKeyboardNavigation();
                    this.triggerQuestLogAbandonKeyboardAction();
                }
            } else if (this.inventoryOpen && !this.detailModalOpen) {
                this.openDetailModal();
            } else if (this.bookOpen && !this.bookDetailOpen) {
                this.openBookDetail();
            } else if (this.shopOpen) {
                if (this.shopNavArea === 'tabs') {
                    this.updateShopTabs();
                } else {
                    this.purchaseOrEquipItem();
                }
            } else if (this.questBoardOpen) {
                this.acceptSelectedQuestFromBoard();
            } else if (this.state === FishingState.IDLE && this.isNearBulletinBoard()) {
                this.openQuestBoard();
            }
        });

        // Fキーで掲示板
        this.input.keyboard.on('keydown-F', () => {
            if (this.state !== FishingState.IDLE) return;
            if (this.unifiedBookOpen) return;
            if (this.questBoardOpen) {
                this.closeQuestBoard();
                return;
            }
            if (this.isNearBulletinBoard()) {
                this.openQuestBoard();
            }
        });

        const toggleBalanceDebugPanel = () => {
          if (this.modalStack.length > 0 && !this.modalStack.includes(this.MODAL_IDS.BALANCE_DEBUG)) return;
          if (!this.balanceDebugPanel?.element) {
            this.createBalanceDebugUI();
          }
          const isOpen = this.modalStack.includes(this.MODAL_IDS.BALANCE_DEBUG);
          if (isOpen) {
            this.closeBalanceDebug();
          } else {
            this.openBalanceDebug();
          }
        };
        this.input.keyboard.on('keydown-BACK_QUOTE', toggleBalanceDebugPanel);

        // Bキーで図鑑表示（統合BookUI）
        this.input.keyboard.on('keydown-B', () => {
            if (this.state === FishingState.EXPLORING) return;
            if (this.unifiedBookOpen) {
                if (this.unifiedBookTab === 'pedia') {
                    this.closeUnifiedBook();
                } else {
                    this.switchUnifiedBookTab('pedia');
                }
            } else {
                this.openUnifiedBook('pedia');
            }
        });

        // Sキーでショップ表示
        this.input.keyboard.on('keydown-S', () => {
            if (this.state === FishingState.IDLE) {
                this.toggleShop();
                if (this.shopOpen) this.noteUiMenuKeyboardNavigation();
            }
        });

        // Qキーで前のページ（統合BookUIが開いている時は handleUnifiedBookNavigation が Q/E でタブ循環）
        this.input.keyboard.on('keydown-Q', () => {
            if (this.unifiedBookOpen) return;
            if (this.bookOpen && !this.bookDetailOpen) {
                this.bookPrevPage();
            }
        });

        // Wキーで次のページ（統合BookUIが開いている時は handleUnifiedBookNavigation が Q/E でタブ循環）
        this.input.keyboard.on('keydown-W', () => {
            if (this.unifiedBookOpen) return;
            if (this.bookOpen && !this.bookDetailOpen) {
                this.bookNextPage();
            }
        });

        this.spaceKey.on('down', () => {
            if (this.dismissCatchResultPopupByUser()) {
                return;
            }
            if (this.state === FishingState.IDLE) {
                if (!this.isNearWater()) {
                    this.showResult("水辺に近づいてください", 1500);
                } else if (!this.canCastTowardWater()) {
                    this.showResult("水の方を向いてください", 1500);
                } else {
                    this.startCasting();
                }
            } else if (this.state === FishingState.CASTING) {
                this.finishCasting();
            } else if (this.state === FishingState.EXPLORING) {
                this.explorationController?.handleSpace();
            } else if (this.state === FishingState.BITE) {
                this.startFighting();
            }
        });

    }

    // カメラ設定（プレイヤーを画面中央に配置。追従は updateCameraFollow で補間）
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.scrollX = this.player.x - cam.width / 2;
    cam.scrollY = this.player.y - cam.height / 2;
    this.cameraFocusTarget = 'player';
    this.cameraTransitionProgress = 1;
    
    // HTML/CSSで操作説明を作成
    const controlsHTML = `
      <div id="controls-text" class="controls-text">移動: 矢印 | 釣り: SPACE | ファイト中: ←↑→でスキル | 売却: E | 持ち物/図鑑: I/B | ショップ: S</div>
    `;
    const tempDiv2 = document.createElement('div');
    tempDiv2.innerHTML = controlsHTML;
    this.controlsTextElement = tempDiv2.firstElementChild as HTMLElement;
    document.body.appendChild(this.controlsTextElement);

    // HTML/CSSでFPS表示を作成（画面左下、最前面に表示）
    const debugFpsHTML = `
      <div id="debug-fps" style="position: fixed; bottom: 10px; left: 10px; color: #00ff00; font-family: 'DotGothic16', sans-serif; font-size: 22px; background: rgba(0, 0, 0, 0.7); padding: 5px 10px; border-radius: 4px; z-index: 3000; user-select: none; pointer-events: none;">
        FPS: <span id="fps-value">0</span> | Delta: <span id="delta-value">0</span>ms
      </div>
    `;
    const tempDiv3 = document.createElement('div');
    tempDiv3.innerHTML = debugFpsHTML;
    this.debugFpsElement = tempDiv3.firstElementChild as HTMLElement;
    document.body.appendChild(this.debugFpsElement);

    // UI位置を画面サイズに合わせて初期化
    this.updateUIPositions();

    // 画面リサイズ時にUI位置を更新
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        // カメラサイズを更新
        this.cameras.main.setSize(gameSize.width, gameSize.height);
        // UI位置を更新（カメラサイズが変わったので強制更新）
        this.lastCameraWidth = gameSize.width;
        this.lastCameraHeight = gameSize.height;
        this.lastCanvasRect = null; // キャッシュをクリアして強制更新
        this.updateUIPositions();
        // モーダル位置も更新（リサイズ時のみ）
        this.updateModalPositionsIfNeeded();
    });

    // モーダル位置の更新は必要時のみ（リサイズ時とモーダル表示時）
  }

  createModalOverlay() {
    // グローバルoverlayを1つだけ作成
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'global-modal-overlay';
    document.body.appendChild(overlay);
    this.modalOverlayElement = overlay;
  }

  // モーダルスタック管理
  private openModal(modalId: string) {
    // スタックに追加
    if (!this.modalStack.includes(modalId)) {
      this.modalStack.push(modalId);
    }

    // スクロールロック（0→1の時だけ）
    if (this.scrollLockCount === 0) {
      document.body.style.overflow = 'hidden';
    }
    this.scrollLockCount++;

    // すべてのモーダルの状態を更新
    this.updateModalStates();
  }

  private closeModal(modalId: string) {
    // スタックから削除
    const index = this.modalStack.indexOf(modalId);
    if (index !== -1) {
      this.modalStack.splice(index, 1);
    }

    // スクロールロック解除（1→0の時だけ）
    this.scrollLockCount--;
    if (this.scrollLockCount === 0) {
      document.body.style.overflow = '';
    } else if (this.scrollLockCount < 0) {
      this.scrollLockCount = 0; // 安全のため
    }

    // すべてのモーダルの状態を更新
    this.updateModalStates();
  }

  private updateModalStates() {
    const topModalId = this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : undefined;
    
    // すべてのモーダル要素を取得
    const allModals = [
      { id: this.MODAL_IDS.INVENTORY, element: this.inventoryUIElement },
      { id: this.MODAL_IDS.DETAIL, element: this.detailModalElement },
      { id: this.MODAL_IDS.BOOK, element: this.bookUIElement },
      { id: this.MODAL_IDS.BOOK_DETAIL, element: this.bookDetailElement },
      { id: this.MODAL_IDS.SHOP, element: this.shopUIElement },
      { id: this.MODAL_IDS.UNIFIED_BOOK, element: this.unifiedBookUIElement },
      { id: this.MODAL_IDS.QUEST_BOARD, element: this.questBoardUIElement },
      { id: this.MODAL_IDS.CHARACTER, element: this.characterSettingsElement },
      { id: this.MODAL_IDS.BALANCE_DEBUG, element: this.balanceDebugPanel?.element },
    ];

    allModals.forEach(({ id, element }) => {
      if (!element) return;

      const isOpen = this.modalStack.includes(id);
      const isTopmost = topModalId !== undefined && id === topModalId;

      // クラスを更新（毎回全適用で確実にリセット）
      element.classList.remove('is-open', 'is-topmost', 'is-behind');
      
      if (isOpen) {
        element.classList.add('is-open');
        if (isTopmost) {
          // 最上位モーダル：アクティブ状態
          element.classList.add('is-topmost');
          element.style.display = 'flex';
          element.style.pointerEvents = 'auto'; // 明示的に設定
          element.setAttribute('aria-hidden', 'false');
          
          // inert属性を確実に解除（両方の方法で）
          if ('inert' in element) {
            (element as any).inert = false;
          }
          element.removeAttribute('inert');
          
          // アニメーションを確実に動作させるため、transformとopacityをリセットしてからアニメーション開始
          const content = element.querySelector('.modal-content') || element.querySelector('.book-container');
          if (content) {
            // まず初期位置と不透明度を設定
            (content as HTMLElement).style.transform = 'translateY(50px)';
            (content as HTMLElement).style.opacity = '0';
            // 次のフレームでアニメーション開始（requestAnimationFrameを使用）
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                (content as HTMLElement).style.transform = 'translateY(0)';
                (content as HTMLElement).style.opacity = '1';
              });
            });
          }
          
          // 背面から復帰した場合は更新を再開
          this.resumeModalUpdates(id);
        } else {
          // 背面モーダル：非アクティブ状態
          element.classList.add('is-behind');
          element.style.pointerEvents = 'none'; // 明示的に設定
          element.setAttribute('aria-hidden', 'true');
          
          // inert属性を付与（両方の方法で）
          if ('inert' in element) {
            (element as any).inert = true;
          }
          element.setAttribute('inert', '');
          
          // 背面モーダルの更新を停止
          this.pauseModalUpdates(id);
        }
      } else {
        // 閉じたモーダル：完全に非表示
        element.style.pointerEvents = 'none';
        element.setAttribute('aria-hidden', 'true');
        
        // inert属性を確実に解除
        if ('inert' in element) {
          (element as any).inert = false;
        }
        element.removeAttribute('inert');
        
        // display: noneは使わず、visibilityとopacityで制御（transformの状態を維持）
        // アニメーション完了後にtransformとopacityをリセット
        setTimeout(() => {
          if (!this.modalStack.includes(id)) {
            // transformとopacityをリセットして次回のアニメーションが正しく動作するようにする
            const content = element.querySelector('.modal-content') || element.querySelector('.book-container');
            if (content) {
              (content as HTMLElement).style.transform = 'translateY(50px)';
              (content as HTMLElement).style.opacity = '0';
              // トランジションを一時的に無効化してリセット
              (content as HTMLElement).style.transition = 'none';
              // 次のフレームでトランジションを再有効化
              requestAnimationFrame(() => {
                (content as HTMLElement).style.transition = '';
              });
            }
          }
        }, 300);
      }
    });

    // overlayの表示/非表示（モーダルが1枚でも開いていれば表示）
    // 毎回確実に状態を更新（差分更新ではなく全適用）
    if (this.modalOverlayElement) {
      // クラスを一旦削除してから追加（確実に状態をリセット）
      this.modalOverlayElement.classList.remove('is-active');
      if (this.modalStack.length > 0) {
        this.modalOverlayElement.classList.add('is-active');
      }
      // visibilityとopacityで制御するため、displayの設定は不要
    }

    this.syncUiMenuKeyboardPointerSuppression();

    // Phaser側の入力制御
    this.updatePhaserInputState();
  }


  private pauseModalUpdates(_modalId: string) {
    // 背面モーダルの更新処理を停止
    // 必要に応じてタイマーやObserverを停止
    // 現在は特にタイマーやObserverは使用していないため、将来の拡張用
  }

  private resumeModalUpdates(_modalId: string) {
    // 背面から復帰した場合の更新処理を再開
    // 必要に応じてタイマーやObserverを再開
  }

  private updatePhaserInputState() {
    // モーダルが1枚でも開いている間はPhaserの入力を無効化
    const hasOpenModal = this.modalStack.length > 0;
    if (this.input && this.input.keyboard) {
      // 入力は無効化しない（ESCキーなどは必要）
      // 代わりにゲーム操作のみを無効化
      if (hasOpenModal) {
        // モーダル中はプレイヤー移動などのゲーム操作を無効化
        // これは既にupdate()内で処理されている
      }
    }
  }

  createStatusUI() {
    // HTML/CSSでステータスUIを作成（画面固定）
    const characterId = this.getSelectedCharacterId();
    const character = getCharacterById(characterId);
    if (!character) return;
    const playerName = this.getSelectedPlayerName() || 'Player';
    const statusHTML = `
      <div id="status-ui" style="position: fixed; pointer-events: none; z-index: 1000; top: 0; left: 0; width: 100%; height: 100%;">
        <!-- 上部UI（重なり防止のため2段構成） -->
        <div id="top-ui">
          <div id="top-row">
            <div id="level-section">
              <div id="level-text" class="level-label-box">
                <div class="level-character-icon" aria-hidden="true">
                  <div class="level-character-icon__inner">
                    <canvas id="status-character-icon-canvas" width="56" height="56" class="level-character-icon__canvas"></canvas>
                  </div>
                </div>
                <div class="level-info">
                  <div id="player-name" class="player-name">${playerName}</div>
                  <div class="level-row" aria-label="level">
                    <span class="level-label-prefix">Lv.</span>
                    <span class="level-label-value">1</span>
                  </div>
                </div>
              </div>
            </div>

            <div id="top-right-col">
              <div id="exp-bar-bg" aria-label="exp">
                <div id="exp-bar-ticks" aria-hidden="true">
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                  <div class="exp-tick exp-tick--thick"></div>
                  <div class="exp-tick exp-tick--thin"></div>
                </div>
                <div id="exp-bar-fill"></div>
                <div id="exp-bar-text"></div>
              </div>
              <div id="money-display" class="money-display" aria-label="所持金">
                <div id="money-digits" class="money-display__digits" aria-hidden="true">
                  <span class="money-display__digit"></span>
                  <span class="money-display__digit"></span>
                  <span class="money-display__digit"></span>
                  <span class="money-display__digit"></span>
                  <span class="money-display__digit"></span>
                  <span class="money-display__digit"></span>
                  <span class="money-display__digit">0</span>
                </div>
              </div>
              <div class="hud-equip-bag-row">
                <div class="equip-display-group" aria-label="装備">
                  <button type="button" id="equip-display-rod" class="equip-display" aria-label="竿を変更">
                    <img id="hud-equip-rod" class="equip-display__icon" alt="" draggable="false" />
                  </button>
                  <button type="button" id="equip-display-bait" class="equip-display" aria-label="エサ・ルアーを変更">
                    <img id="hud-equip-bait" class="equip-display__icon" alt="" draggable="false" />
                    <span id="hud-equip-bait-count" class="equip-display__count" hidden></span>
                  </button>
                </div>
                <div id="bag-count-display" class="bag-count-display" aria-label="バッグ">
                  <div class="bag-count-display__inner" aria-hidden="true">
                    <img id="hud-bag-icon" class="bag-count-display__icon" alt="" draggable="false" />
                    <span id="hud-bag-count" class="bag-count-display__count">0/9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 左下: デバッグ用ボタン -->
        <div id="debug-settings-btn-wrap" style="position: absolute; bottom: 16px; left: 16px; pointer-events: auto; display: flex; flex-direction: column; gap: 8px;">
          <button type="button" id="character-settings-btn" class="nes-btn is-small">キャラ設定</button>
          <button type="button" id="balance-debug-btn" class="nes-btn is-small">バランス</button>
        </div>

        <div id="quest-hud" class="quest-hud" aria-label="進行中クエスト">
          ${this.buildQuestHudSlotsHTML()}
          <div id="quest-hud-popover" class="quest-hud-popover" aria-hidden="true"></div>
        </div>
      </div>
    `;
    
    // DOM要素を直接bodyに追加（画面固定）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = statusHTML;
    this.statusUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.statusUIElement);
    this.questHudElement = this.statusUIElement.querySelector('#quest-hud') as HTMLElement;
    this.bindQuestHudPopoverEvents();

    // デバッグボタン
    const charBtn = document.getElementById('character-settings-btn');
    if (charBtn) {
      charBtn.addEventListener('click', () => {
        if (!this.characterSettingsElement) {
          this.createCharacterSettingsUI();
        }
        if (this.characterSettingsElement) {
          this.openCharacterSettings();
        }
      });
    }
    const balanceBtn = document.getElementById('balance-debug-btn');
    if (balanceBtn) {
      balanceBtn.addEventListener('click', () => {
        if (!this.balanceDebugPanel?.element) {
          this.createBalanceDebugUI();
        }
        this.openBalanceDebug();
      });
    }

    this.renderStatusCharacterIcon(characterId, this.getSelectedColor());
    this.bindHudEquipmentShortcuts();
    this.hudMoneyDisplay.attach(this.statusUIElement);
    this.updateStatusUI();
    this.updateQuestHudUI();
  }

  private bindHudEquipmentShortcuts() {
    if (!this.statusUIElement) return;
    const rodSlot = this.statusUIElement.querySelector('#equip-display-rod') as HTMLElement | null;
    const baitSlot = this.statusUIElement.querySelector('#equip-display-bait') as HTMLElement | null;
    rodSlot?.addEventListener('click', () => this.openHudEquipmentShortcut('rod'));
    baitSlot?.addEventListener('click', () => this.openHudEquipmentShortcut('lure'));
    rodSlot?.addEventListener('pointerenter', (e) => this.setHudEquipHover('rod', e));
    rodSlot?.addEventListener('pointerleave', () => this.clearHudEquipHover('rod'));
    rodSlot?.addEventListener('pointermove', (e) => this.updateHudEquipHoverPointer(e));
    baitSlot?.addEventListener('pointerenter', (e) => this.setHudEquipHover('lure', e));
    baitSlot?.addEventListener('pointerleave', () => this.clearHudEquipHover('lure'));
    baitSlot?.addEventListener('pointermove', (e) => this.updateHudEquipHoverPointer(e));
  }

  private setHudEquipHover(type: 'rod' | 'lure', event: PointerEvent) {
    if (this.state !== FishingState.IDLE) return;
    if (this.modalStack.length > 0 || this.unifiedBookOpen) return;
    this.clearPlayerHintPointerFadeTimer();
    this.hudEquipHoverType = type;
    this.playerHintFollowPointer = true;
    this.hudEquipHoverPointerX = event.clientX;
    this.hudEquipHoverPointerY = event.clientY;
    this.showHudEquipHoverHint();
  }

  private updateHudEquipHoverPointer(event: PointerEvent) {
    if (!this.hudEquipHoverType) return;
    this.hudEquipHoverPointerX = event.clientX;
    this.hudEquipHoverPointerY = event.clientY;
    this.positionPlayerHintAtPointer();
  }

  private clearHudEquipHover(type: 'rod' | 'lure') {
    if (this.hudEquipHoverType !== type) return;
    this.hudEquipHoverType = null;
    // フェード中に頭上へジャンプしないよう、ポインター追従を維持したまま消す
    this.hidePlayerHint();
    this.clearPlayerHintPointerFadeTimer();
    this.playerHintPointerFadeTimer = window.setTimeout(() => {
      this.playerHintPointerFadeTimer = null;
      this.playerHintFollowPointer = false;
      if (this.state === FishingState.IDLE) {
        this.updateIdleWorldHints();
      }
    }, 180);
  }

  private clearPlayerHintPointerFadeTimer() {
    if (this.playerHintPointerFadeTimer !== null) {
      window.clearTimeout(this.playerHintPointerFadeTimer);
      this.playerHintPointerFadeTimer = null;
    }
  }

  private showHudEquipHoverHint() {
    if (this.hudEquipHoverType === 'rod') {
      this.showPlayerHint(PLAYER_HINTS.changeRod);
      this.positionPlayerHintAtPointer();
      return;
    }
    if (this.hudEquipHoverType === 'lure') {
      this.showPlayerHint(PLAYER_HINTS.changeBaitOrLure);
      this.positionPlayerHintAtPointer();
    }
  }

  private positionPlayerHintAtPointer() {
    if (!this.playerHintElement || !this.playerHintFollowPointer) return;
    // ポインター少し上に表示（既存の translate(-50%, -100%) と合わせて）
    this.playerHintElement.style.left = `${this.hudEquipHoverPointerX}px`;
    this.playerHintElement.style.top = `${this.hudEquipHoverPointerY - 12}px`;
  }

  /** プレイ画面の装備枠からステータス装備選択へショートカット */
  private openHudEquipmentShortcut(type: 'rod' | 'lure') {
    if (this.state !== FishingState.IDLE) return;
    if (!this.unifiedBookUIElement) return;

    this.clearPlayerHintPointerFadeTimer();
    this.hudEquipHoverType = null;
    this.playerHintFollowPointer = false;
    this.hidePlayerHint();

    if (this.unifiedBookOpen) {
      if (this.unifiedBookTab !== 'status') {
        this.switchUnifiedBookTab('status');
      }
    } else {
      this.openUnifiedBook('status');
    }
    this.openStatusEquipmentSelector(type);
  }

  private lastMoney: number = -1;
  private lastInventoryCount: number = -1;
  private lastMaxInventorySlots: number = -1;
  private lastLevel: number = -1;
  private lastExpProgress: number = -1;
  private lastPlayerName: string = '';
  private lastHudRodId: string | null = null;
  private lastHudBaitOrLureId: string | null = null;
  private lastHudBaitCount: number = -1;

  updateStatusUI() {
    if (!this.statusUIElement) return;

    // 装備（竿 + エサ/ルアー）
    const rodId = this.playerData.equippedRodId;
    const baitOrLureId = this.playerData.equippedBaitId ?? this.playerData.equippedLureId;
    const equippedBaitCount = this.playerData.equippedBaitId
      ? getBaitCount(this.playerData, this.playerData.equippedBaitId)
      : 0;
    if (
      rodId !== this.lastHudRodId
      || baitOrLureId !== this.lastHudBaitOrLureId
      || equippedBaitCount !== this.lastHudBaitCount
    ) {
      this.updateHudEquipmentDisplay();
      this.lastHudRodId = rodId;
      this.lastHudBaitOrLureId = baitOrLureId;
      this.lastHudBaitCount = equippedBaitCount;
    }
    
    // 所持金（変更時のみ・桁リールでカウント）
    const money = this.playerData.money;
    if (money !== this.lastMoney) {
      this.hudMoneyDisplay.setMoney(money, this.lastMoney < 0);
      this.lastMoney = money;
    }
    
    // バッグ所持数（変更時のみ更新）
    const inventoryCount = getInventoryCount(this.playerData);
    const maxSlots = this.playerData.maxInventorySlots;
    if (inventoryCount !== this.lastInventoryCount || maxSlots !== this.lastMaxInventorySlots) {
      const countEl = this.statusUIElement.querySelector('#hud-bag-count') as HTMLElement | null;
      const iconEl = this.statusUIElement.querySelector('#hud-bag-icon') as HTMLImageElement | null;
      const bagDisplay = this.statusUIElement.querySelector('#bag-count-display') as HTMLElement | null;
      if (countEl) countEl.textContent = `${inventoryCount}/${maxSlots}`;

      const bag =
        inventoryUpgradeConfigs.find((upgrade) => upgrade.slotCount === maxSlots)
        ?? inventoryUpgradeConfigs[0];
      const bagPath = bag ? getItemImagePath(bag.id) : undefined;
      if (iconEl) {
        if (bagPath) {
          iconEl.src = bagPath;
          iconEl.style.display = '';
        } else {
          iconEl.removeAttribute('src');
          iconEl.style.display = 'none';
        }
      }
      if (bagDisplay) {
        bagDisplay.setAttribute('aria-label', `バッグ ${inventoryCount}/${maxSlots}`);
      }

      this.lastInventoryCount = inventoryCount;
      this.lastMaxInventorySlots = maxSlots;
    }
    
    // レベル（変更時のみ更新）
    const level = this.playerData.level;
    if (level !== this.lastLevel) {
      const levelContainer = this.statusUIElement.querySelector('#level-text');
      const levelValueEl = this.statusUIElement.querySelector('#level-text .level-label-value');
      if (levelValueEl) {
        levelValueEl.textContent = String(level);
      } else if (levelContainer) {
        // フォールバック（古いマークアップ向け）
        (levelContainer as HTMLElement).textContent = `Lv. ${level}`;
      }
      this.lastLevel = level;
    }

    // プレイヤー名（変更時のみ更新）
    const playerName = this.getSelectedPlayerName() || 'Player';
    if (playerName !== this.lastPlayerName) {
      const nameEl = this.statusUIElement.querySelector('#player-name');
      if (nameEl) (nameEl as HTMLElement).textContent = playerName;
      this.lastPlayerName = playerName;
    }
    
    // 経験値バー（変更時のみ更新）
    const expProgress = getExpProgress(this.playerData);
    if (Math.abs(expProgress - this.lastExpProgress) > 0.001) {
      const expBarFill = this.statusUIElement.querySelector('#exp-bar-fill') as HTMLElement;
      if (expBarFill) expBarFill.style.width = `${expProgress * 100}%`;
      this.lastExpProgress = expProgress;
    }

    // 経験値テキスト（常に最新を表示）
    const expBarText = this.statusUIElement.querySelector('#exp-bar-text') as HTMLElement | null;
    if (expBarText) {
      const currentLevelExp = getRequiredExp(this.playerData.level);
      const nextLevelExp = getRequiredExp(this.playerData.level + 1);
      const expInCurrentLevel = Math.max(0, this.playerData.exp - currentLevelExp);
      const expNeededForNextLevel = Math.max(1, nextLevelExp - currentLevelExp);
      const currentDisplay = Math.floor(expInCurrentLevel);
      const nextDisplay = Math.floor(expNeededForNextLevel);
      expBarText.textContent = `${currentDisplay} / ${nextDisplay}`;
    }

    if (this.unifiedBookOpen && this.unifiedBookTab === 'status' && this.unifiedBookUIElement) {
      const sp = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
      if (sp && sp.style.display !== 'none') {
        this.fillBookStatusPanel(sp);
      }
    }
    if (this.unifiedBookOpen && this.unifiedBookTab === 'skills' && this.unifiedBookUIElement) {
      this.renderSkillBookPanel();
    }
  }

  private updateHudEquipmentDisplay() {
    if (!this.statusUIElement) return;

    const rodSlot = this.statusUIElement.querySelector('#equip-display-rod') as HTMLElement | null;
    const baitSlot = this.statusUIElement.querySelector('#equip-display-bait') as HTMLElement | null;
    const rodImg = this.statusUIElement.querySelector('#hud-equip-rod') as HTMLImageElement | null;
    const baitImg = this.statusUIElement.querySelector('#hud-equip-bait') as HTMLImageElement | null;
    const baitCountEl = this.statusUIElement.querySelector('#hud-equip-bait-count') as HTMLElement | null;

    const rod = getRodById(this.playerData.equippedRodId);
    const bait = this.playerData.equippedBaitId ? getBaitById(this.playerData.equippedBaitId) : null;
    const lure = this.playerData.equippedLureId ? getLureById(this.playerData.equippedLureId) : null;
    const baitOrLure = bait ?? lure;
    const baitOrLureId = this.playerData.equippedBaitId ?? this.playerData.equippedLureId;

    const setIcon = (img: HTMLImageElement | null, itemId: string | null | undefined) => {
      if (!img) return;
      const path = itemId ? getItemImagePath(itemId) : undefined;
      if (path) {
        img.src = path;
        img.style.display = '';
      } else {
        img.removeAttribute('src');
        img.style.display = 'none';
      }
    };

    setIcon(rodImg, this.playerData.equippedRodId);
    setIcon(baitImg, baitOrLureId);

    if (baitCountEl) {
      if (this.playerData.equippedBaitId) {
        const count = getBaitCount(this.playerData, this.playerData.equippedBaitId);
        baitCountEl.textContent = `×${count}`;
        baitCountEl.hidden = false;
      } else {
        baitCountEl.textContent = '';
        baitCountEl.hidden = true;
      }
    }

    if (rodSlot) {
      rodSlot.setAttribute('aria-label', `竿 ${rod?.name ?? '未装備'}（クリックで変更）`);
    }
    if (baitSlot) {
      if (this.playerData.equippedBaitId && bait) {
        const count = getBaitCount(this.playerData, this.playerData.equippedBaitId);
        baitSlot.setAttribute('aria-label', `エサ ${bait.name} ×${count}（クリックで変更）`);
      } else {
        baitSlot.setAttribute('aria-label', `エサ・ルアー ${baitOrLure?.name ?? '装備なし'}（クリックで変更）`);
      }
    }
  }

  private buildQuestHudSlotsHTML(): string {
    return Array.from({ length: MAX_ACTIVE_QUESTS }).map((_, index) => `
      <div class="quest-hud-slot is-empty" data-index="${index}" style="--quest-progress-angle: 0deg;" aria-label="空きクエストスロット">
        <div class="quest-hud-slot__ring" aria-hidden="true"></div>
        <div class="quest-hud-slot__inner">
          <img class="quest-hud-slot__img" alt="" draggable="false" />
          <span class="quest-hud-slot__emoji" aria-hidden="true">?</span>
        </div>
        <span class="quest-hud-slot__progress">0%</span>
      </div>
    `).join('');
  }

  private updateQuestHudUI() {
    this.updateQuestHudSlots(this.questHudElement);
    if (!this.questHudElement) return;
    const popover = this.questHudElement.querySelector('#quest-hud-popover') as HTMLElement | null;
    const openQuestId = popover?.dataset.questId;
    if (openQuestId && !getActiveQuests(this.playerData).some((quest) => quest.id === openQuestId)) {
      this.hideQuestHudPopover();
    }
  }

  private updateQuestHudSlots(root: HTMLElement | null) {
    if (!root) return;
    const slots = Array.from(root.querySelectorAll('.quest-hud-slot')) as HTMLElement[];
    const activeQuests = getActiveQuests(this.playerData);

    slots.forEach((slot, index) => {
      const quest = activeQuests[index];
      const img = slot.querySelector('.quest-hud-slot__img') as HTMLImageElement | null;
      const emoji = slot.querySelector('.quest-hud-slot__emoji') as HTMLElement | null;
      const progressText = slot.querySelector('.quest-hud-slot__progress') as HTMLElement | null;

      if (!quest) {
        slot.className = 'quest-hud-slot is-empty';
        slot.style.setProperty('--quest-progress-angle', '0deg');
        slot.setAttribute('aria-label', '空きクエストスロット');
        slot.removeAttribute('title');
        if (img) {
          img.removeAttribute('src');
          img.style.display = 'none';
        }
        if (emoji) {
          emoji.textContent = '?';
          emoji.style.display = '';
        }
        if (progressText) progressText.textContent = '0%';
        return;
      }

      const ratio = getQuestProgressRatio(this.playerData, quest);
      const percent = Math.round(ratio * 100);
      const imgPath = this.resolveQuestCardImagePath(quest);

      slot.className = `quest-hud-slot is-active${ratio >= 1 ? ' is-complete' : ''}`;
      slot.style.setProperty('--quest-progress-angle', `${Math.round(ratio * 360)}deg`);
      slot.setAttribute('aria-label', `${quest.name}: ${percent}%`);
      slot.removeAttribute('title');

      if (imgPath && img) {
        img.src = imgPath;
        img.className = this.getQuestIconImgClasses(imgPath, 'quest-hud-slot__img');
        img.style.display = '';
        if (emoji) emoji.style.display = 'none';
      } else {
        if (img) {
          img.removeAttribute('src');
          img.style.display = 'none';
        }
        if (emoji) {
          emoji.textContent = quest.emoji;
          emoji.style.display = '';
        }
      }
      if (progressText) progressText.textContent = `${percent}%`;
    });
  }

  private bindQuestHudPopoverEvents() {
    if (!this.questHudElement) return;

    const showSlotPopover = (slot: HTMLElement) => {
      if (slot.classList.contains('is-empty')) {
        this.hideQuestHudPopover();
        return;
      }

      const slotIndex = Number(slot.dataset.index ?? -1);
      const quest = getActiveQuests(this.playerData)[slotIndex];
      if (!quest) {
        this.hideQuestHudPopover();
        return;
      }

      this.showQuestHudPopover(quest, slot);
    };

    this.questHudElement.querySelectorAll('.quest-hud-slot').forEach((slot) => {
      slot.addEventListener('mouseenter', () => showSlotPopover(slot as HTMLElement));
      slot.addEventListener('mouseleave', () => this.hideQuestHudPopover());
    });
  }

  private showQuestHudPopover(quest: QuestConfig, slot: HTMLElement) {
    if (!this.questHudElement) return;
    const popover = this.questHudElement.querySelector('#quest-hud-popover') as HTMLElement | null;
    if (!popover) return;

    const hudRect = this.questHudElement.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2 - hudRect.left;

    popover.style.setProperty('--quest-popover-anchor-x', `${slotCenterX}px`);
    popover.innerHTML = `
      <div class="achievement-detail-item ui-frame-box locked quest-hud-popover-card">
        ${this.buildQuestCardHTML(quest, false, true)}
      </div>
    `;
    popover.dataset.questId = quest.id;
    popover.classList.add('is-visible');
    popover.setAttribute('aria-hidden', 'false');
  }

  private hideQuestHudPopover() {
    if (!this.questHudElement) return;
    const popover = this.questHudElement.querySelector('#quest-hud-popover') as HTMLElement | null;
    if (!popover) return;
    popover.classList.remove('is-visible');
    popover.setAttribute('aria-hidden', 'true');
    delete popover.dataset.questId;
  }

  private getCameraScrollForWorldCenter(worldX: number, worldY: number): { scrollX: number; scrollY: number } {
    const cam = this.cameras.main;
    return {
      scrollX: worldX - cam.width / 2,
      scrollY: worldY - cam.height / 2,
    };
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private beginCameraTransition(target: 'player' | 'float'): void {
    if (this.cameraFocusTarget === target) return;
    const cam = this.cameras.main;
    this.cameraTransitionFrom = { scrollX: cam.scrollX, scrollY: cam.scrollY };
    this.cameraFocusTarget = target;
    this.cameraTransitionProgress = 0;
    cam.stopFollow();
  }

  private followCameraToPlayer(): void {
    this.fixedFloatCenter = null;
    this.beginCameraTransition('player');
  }

  private followCameraToFloat(): void {
    this.beginCameraTransition('float');
  }

  private getCameraWorldTarget(): { x: number; y: number } {
    if (this.cameraFocusTarget === 'float' && this.fixedFloatCenter) {
      return this.fixedFloatCenter;
    }
    if (this.cameraFocusTarget === 'float') {
      return { x: this.fishingRig.float.x, y: this.fishingRig.float.y };
    }
    return { x: this.player.x, y: this.player.y };
  }

  private updateCameraFollow(delta: number): void {
    const cam = this.cameras.main;
    const worldTarget = this.getCameraWorldTarget();
    const targetScroll = this.getCameraScrollForWorldCenter(worldTarget.x, worldTarget.y);

    if (this.cameraTransitionProgress < 1) {
      this.cameraTransitionProgress = Math.min(
        1,
        this.cameraTransitionProgress + delta / GameScene.CAMERA_TRANSITION_MS,
      );
      const eased = this.easeOutCubic(this.cameraTransitionProgress);
      cam.scrollX = Phaser.Math.Linear(this.cameraTransitionFrom.scrollX, targetScroll.scrollX, eased);
      cam.scrollY = Phaser.Math.Linear(this.cameraTransitionFrom.scrollY, targetScroll.scrollY, eased);
      return;
    }

    if (this.cameraFocusTarget === 'float' && this.fixedFloatCenter) {
      cam.scrollX = targetScroll.scrollX;
      cam.scrollY = targetScroll.scrollY;
      return;
    }

    cam.scrollX = Phaser.Math.Linear(cam.scrollX, targetScroll.scrollX, GameScene.CAMERA_FOLLOW_LERP);
    cam.scrollY = Phaser.Math.Linear(cam.scrollY, targetScroll.scrollY, GameScene.CAMERA_FOLLOW_LERP);
  }

  /** ワールド座標を canvas 上の viewport（fixed）座標に変換 */
  private worldToViewport(worldX: number, worldY: number): { x: number; y: number } {
    const cam = this.cameras.main;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / cam.width;
    const scaleY = rect.height / cam.height;
    return {
      x: rect.left + (worldX - cam.scrollX) * scaleX,
      y: rect.top + (worldY - cam.scrollY) * scaleY,
    };
  }

  private createGameWorldTextUI(): void {
    const hint = document.createElement('div');
    hint.id = 'player-world-hint';
    hint.className = 'player-world-hint ui-frame-box';
    document.body.appendChild(hint);
    this.playerHintElement = hint;

    const biteMark = document.createElement('div');
    biteMark.id = 'player-bite-mark';
    biteMark.className = 'player-bite-mark';
    biteMark.textContent = '!';
    biteMark.style.display = 'none';
    biteMark.style.fontSize = `${Math.round(config.bite['4-1_ビックリマークサイズ'] * 1.25)}px`;
    document.body.appendChild(biteMark);
    this.biteMarkElement = biteMark;
  }

  private showPlayerHint(
    content: PlayerHintContent,
    tone: 'normal' | 'urgent' = 'normal',
  ): void {
    if (!this.playerHintElement) return;
    const el = this.playerHintElement;
    const urgent = tone === 'urgent';
    const hintId = `${(content.key ?? '').toLowerCase()}|${content.label}|${tone}`;
    const wasVisible = el.classList.contains('is-visible');
    const sameContent = el.dataset.hintId === hintId;

    // 毎フレーム差し替えるとキーのループアニメが毎フレリセットされるので、内容変化時のみ DOM 更新
    if (!sameContent) {
      el.dataset.hintId = hintId;
      el.innerHTML = this.buildPlayerHintHtml(content);
      el.classList.toggle('player-world-hint--urgent', urgent);
    }
    this.updateGameWorldTextPositions();

    if (wasVisible && sameContent) return;

    if (wasVisible) {
      el.classList.remove('is-visible');
      void el.offsetWidth;
    }
    el.classList.add('is-visible');
  }

  private buildPlayerHintHtml(content: PlayerHintContent): string {
    const labelHtml = `<span class="player-world-hint__text">${this.escapeHtml(content.label)}</span>`;
    if (!content.key) {
      return `<span class="player-world-hint__row">${labelHtml}</span>`;
    }
    return `<span class="player-world-hint__row">${this.buildPlayerHintKeyHtml(content.key)}${labelHtml}</span>`;
  }

  private buildPlayerHintKeyHtml(key: string): string {
    const normalized = key.trim().toLowerCase();
    if (normalized === 'space') {
      return `<span class="player-world-hint__key player-world-hint__key--space" aria-label="SPACE"><img src="/images/ui/hint/space.png" alt="" draggable="false"></span>`;
    }
    if (normalized === 'enter' || normalized === 'return') {
      return `<span class="player-world-hint__key player-world-hint__key--enter" aria-label="Enter"><img src="/images/ui/hint/Enter.png" alt="" draggable="false"></span>`;
    }
    const glyph = key.trim().toUpperCase();
    return `<span class="player-world-hint__key player-world-hint__key--letter" aria-label="${this.escapeHtml(glyph)}"><img src="/images/ui/hint/key.png" alt="" draggable="false"><span class="player-world-hint__key-glyph">${this.escapeHtml(glyph)}</span></span>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private hidePlayerHint(): void {
    if (!this.playerHintElement) return;
    this.playerHintElement.classList.remove('is-visible');
    delete this.playerHintElement.dataset.hintId;
  }

  private showBiteMark(): void {
    if (!this.biteMarkElement) return;
    this.biteMarkElement.style.display = 'block';
    this.updateGameWorldTextPositions();
  }

  private hideBiteMark(): void {
    if (this.biteMarkElement) {
      this.biteMarkElement.style.display = 'none';
      this.biteMarkElement.style.setProperty('--world-text-scale', '1');
    }
  }

  private updateGameWorldTextPositions(): void {
    if (!this.player) return;
    if (this.playerHintElement) {
      if (this.playerHintFollowPointer) {
        this.positionPlayerHintAtPointer();
      } else {
        const playerHint = this.worldToViewport(
          this.player.x,
          this.player.y - this.player.displayHeight * 0.75 - 18,
        );
        this.playerHintElement.style.left = `${playerHint.x}px`;
        this.playerHintElement.style.top = `${playerHint.y}px`;
      }
    }

    const biteMark = this.worldToViewport(
      this.player.x,
      this.player.y - this.player.displayHeight * 0.9 - 40,
    );
    if (this.biteMarkElement) {
      this.biteMarkElement.style.left = `${biteMark.x}px`;
      this.biteMarkElement.style.top = `${biteMark.y}px`;
    }
  }

  /** 投擲ゲージをキャラの少し下（viewport 座標）に置く */
  private getCastGaugeViewportCenter(): { x: number; y: number } {
    const gap = config.casting['2-5_ゲージ_キャラ下余白'] * FISHING_GAUGE_UI_SCALE;
    const worldY = this.player.y + this.player.displayHeight * 0.5 + gap;
    return this.worldToViewport(this.player.x, worldY);
  }

  /** 浮きスプライト上端のワールドY（中心Yから算出） */
  private getFloatTopWorldYFromCenter(centerY: number): number {
    const s = Math.max(1, Math.round(this.getFishingRigScale()));
    const redH = 2 + Math.floor(s * 0.5);
    return centerY - redH;
  }

  /** ファイトUI下端中央を浮き着水位置の上（viewport 座標）に置く */
  private getFightGaugeViewportAnchor(): { x: number; y: number } {
    const center = this.fixedFloatCenter ?? { x: this.fishingRig.float.x, y: this.fishingRig.float.y };
    const gap = config.fighting['5-1b_ファイトUI_浮き上余白'] * FISHING_GAUGE_UI_SCALE;
    const worldY = this.getFloatTopWorldYFromCenter(center.y) - gap;
    return this.worldToViewport(center.x, worldY);
  }

  private layoutFishingGaugeOverlay(): void {
    const canvas = this.game.canvas;
    if (!canvas || !this.fishingGaugeOverlay) return;
    const cast = this.getCastGaugeViewportCenter();
    const fight = this.getFightGaugeViewportAnchor();
    this.fishingGaugeOverlay.layoutGame({
      castCenterX: cast.x,
      castCenterY: cast.y,
      fightAnchorX: fight.x,
      fightAnchorY: fight.y,
    });
  }

  updateUIPositions() {
    this.layoutFishingGaugeOverlay();
    this.updateGameWorldTextPositions();

    // モーダル位置の更新はリサイズ時のみ（カメラ位置変更時は不要）
    // モーダルは固定位置なので、カメラが動いても位置を更新する必要はない
  }

  updateModalPositionsIfNeeded() {
    // Canvas要素を取得（必要時のみ）
    const canvas = this.game.canvas;
    if (!canvas) return;
    
    // キャッシュされた位置と比較して、変更がない場合はスキップ
    const canvasRect = canvas.getBoundingClientRect();
    if (this.lastCanvasRect && 
        this.lastCanvasRect.left === canvasRect.left &&
        this.lastCanvasRect.top === canvasRect.top &&
        this.lastCanvasRect.width === canvasRect.width &&
        this.lastCanvasRect.height === canvasRect.height) {
      return;
    }
    
    // キャッシュを更新
    this.lastCanvasRect = canvasRect;
    
    // 開いているモーダルのみ更新
    const modals: HTMLElement[] = [];
    if (this.inventoryOpen && this.inventoryUIElement) modals.push(this.inventoryUIElement);
    if (this.detailModalOpen && this.detailModalElement) modals.push(this.detailModalElement);
    if (this.bookOpen && this.bookUIElement) modals.push(this.bookUIElement);
    if (this.bookDetailOpen && this.bookDetailElement) modals.push(this.bookDetailElement);
    if (this.shopOpen && this.shopUIElement) modals.push(this.shopUIElement);

    modals.forEach(modal => {
      modal.style.position = 'fixed';
      modal.style.left = `${canvasRect.left}px`;
      modal.style.top = `${canvasRect.top}px`;
      modal.style.width = `${canvasRect.width}px`;
      modal.style.height = `${canvasRect.height}px`;
    });
  }

  sellAll() {
    const count = getInventoryCount(this.playerData);
    if (count === 0) {
        this.showResult("売る魚がありません", 1000);
        return;
    }
    
    const earnings = sellAllFish(this.playerData);

    const completedQuests = onQuestFishSold(this.playerData, count, earnings);
    completedQuests.forEach((quest) => this.showQuestNotification(quest));
    if (completedQuests.length > 0 && this.unifiedBookOpen && this.unifiedBookTab === 'quest') {
      this.updateUnifiedBookList();
      this.updateUnifiedBookDetail();
    }
    
    // 実績チェック（経済系）
    const unlockedAchievements = checkAchievements(this.playerData, ['money']);
    unlockedAchievements.forEach(achievement => {
      this.showAchievementNotification(achievement);
    });
    
    savePlayerData(this.playerData);
    this.updateStatusUI();
    this.updateQuestHudUI();
    
    // 統合BookUIが開いている場合はリストを更新
    if (this.unifiedBookOpen) {
      this.updateUnifiedBookList();
      this.unifiedBookSelectedId = null;
      this.unifiedBookSelectedIndex = null;
      this.updateUnifiedBookDetail();
    }
    
    this.showResult(`${count}匹を売却！ +${earnings.toLocaleString()} G`, 2000);
  }

  update(time: number, delta: number) {
    // FPS表示を更新
    if (this.debugFpsElement) {
      const fpsValue = this.debugFpsElement.querySelector('#fps-value');
      const deltaValue = this.debugFpsElement.querySelector('#delta-value');
      if (fpsValue) fpsValue.textContent = Math.round(this.game.loop.actualFps).toString();
      if (deltaValue) deltaValue.textContent = Math.round(delta).toString();
    }

    // バッグ満杯時の放流／入れかえ選択
    if (this.catchBagDecisionPhase) {
      this.handleCatchBagDecisionNavigation();
      this.refreshKbSelectionPointer();
      return;
    }

    // 統合BookUIが開いている場合はキーボード操作を処理
    if (this.unifiedBookOpen) {
      this.handleUnifiedBookNavigation();
      this.refreshKbSelectionPointer();
      return;
    }

    // モーダルが開いている場合はゲーム更新をスキップ（パフォーマンス最適化）
    // ただし、オンラインマルチ対応のため完全停止はしない
    const hasOpenModal = this.modalStack.length > 0;
    const topModalId = this.modalStack[this.modalStack.length - 1];
    
    if (hasOpenModal) {
      this.hidePlayerHint();
      // 最上位モーダルの操作のみ処理
      if (topModalId === this.MODAL_IDS.INVENTORY && !this.detailModalOpen) {
        this.handleInventoryNavigation();
        this.refreshKbSelectionPointer();
        return;
      }

      if (topModalId === this.MODAL_IDS.BOOK && !this.bookDetailOpen) {
        this.handleBookNavigation();
        this.refreshKbSelectionPointer();
        return;
      }

      if (topModalId === this.MODAL_IDS.SHOP) {
        this.handleShopNavigation();
        this.refreshKbSelectionPointer();
        return;
      }

      if (topModalId === this.MODAL_IDS.QUEST_BOARD) {
        this.refreshKbSelectionPointer();
        return;
      }

      // その他のモーダル（詳細モーダルなど）が最上位の場合は何もしない
      // ただし、ネットワーク処理などは継続（将来のマルチ対応）
      this.refreshKbSelectionPointer();
      return;
    }

    // UIをカメラ位置に追従させる（カメラ位置が変わった時のみ更新）
    const cam = this.cameras.main;
    if (cam.scrollX !== this.lastCameraX || 
        cam.scrollY !== this.lastCameraY ||
        cam.width !== this.lastCameraWidth ||
        cam.height !== this.lastCameraHeight) {
      this.lastCameraX = cam.scrollX;
      this.lastCameraY = cam.scrollY;
      this.lastCameraWidth = cam.width;
      this.lastCameraHeight = cam.height;
      this.updateUIPositions();
    }

    // 水辺に入れないよう制限
    this.restrictWaterEntry();

    if (this.state === FishingState.IDLE) {
        this.handleMovement();
        this.updateIdleWorldHints();
    } else {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);
        if (this.player.anims.currentAnim?.key === 'player-walk') {
          this.player.anims.play('player-idle', true);
        }
    }

    if (this.state === FishingState.CASTING) {
        this.updateCasting(delta);
    }

    if (this.state === FishingState.FIGHTING) {
        this.updateFighting(time, delta);
    }

    // BITE状態でエクスクラメーションを点滅
    if (this.state === FishingState.BITE) {
        this.biteMarkElement?.style.setProperty('--world-text-scale', `${1 + Math.sin(time / 50) * 0.2}`);
    }

    this.updateFishingRig(time, delta);
    this.tryOpenExplorationAfterSplash();
    this.updateCameraFollow(delta);
    this.drawFishingRig();
    this.updateGameWorldTextPositions();

    this.refreshKbSelectionPointer();
  }

  handleMovement() {
    const speed = config.main['1-5_移動速度'];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;

    // 左右移動と向きの更新（左右を押したときだけ向きを更新）
    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
      this.playerFacing = 'left';
      this.lastHorizontalFacing = 'left';
      moving = true;
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
      this.playerFacing = 'right';
      this.lastHorizontalFacing = 'right';
      moving = true;
    }

    // 上下移動（向きは変えず、最後の左右の向きを維持）
    if (this.cursors.up.isDown) {
      body.setVelocityY(-speed);
      this.playerFacing = 'up';
      moving = true;
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(speed);
      this.playerFacing = 'down';
      moving = true;
    }

    // アニメーションの更新（1行目=アイドル, 2行目=移動）
    const animKey = moving ? 'player-walk' : 'player-idle';
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.anims.play(animKey, true);
    }
    // 最後に向いていた左右で反転（上下移動中も維持）
    this.player.setFlipX(this.lastHorizontalFacing === 'left');
  }

  // --- 水辺判定 ---
  
  // 水辺エリアの定義
  private waterAreas = [
    // 中央の池（楕円形）
    { type: 'ellipse' as const, x: 600, y: 200, width: 850, height: 300 },
    // 左下の池
    { type: 'ellipse' as const, x: 150, y: 700, width: 220, height: 170 },
    // 右の川
    { type: 'rect' as const, x: 1060, y: 150, width: 80, height: 500 },
  ];

  isNearWater(): boolean {
    const px = this.player.x;
    const py = this.player.y;
    const margin = 50; // 水辺から50px以内なら釣り可能
    
    for (const area of this.waterAreas) {
        if (area.type === 'ellipse') {
            // 楕円形の水辺との距離を計算
            const dx = (px - area.x) / (area.width / 2 + margin);
            const dy = (py - area.y) / (area.height / 2 + margin);
            if (dx * dx + dy * dy <= 1) {
                return true;
            }
        } else if (area.type === 'rect') {
            // 矩形の水辺との距離を計算
            if (px >= area.x - margin && px <= area.x + area.width + margin &&
                py >= area.y - margin && py <= area.y + area.height + margin) {
                return true;
            }
        }
    }
    return false;
  }

  isPointInWater(x: number, y: number): boolean {
    for (const area of this.waterAreas) {
        if (area.type === 'ellipse') {
            const dx = (x - area.x) / (area.width / 2);
            const dy = (y - area.y) / (area.height / 2);
            if (dx * dx + dy * dy <= 1) {
                return true;
            }
        } else if (area.type === 'rect') {
            if (x >= area.x && x <= area.x + area.width &&
                y >= area.y && y <= area.y + area.height) {
                return true;
            }
        }
    }
    return false;
  }

  isInsideWater(): boolean {
    return this.isPointInWater(this.player.x, this.player.y);
  }

  /** 指定方向に水源があるか（複数距離をサンプルして狭い川も拾う） */
  private hasWaterInDirection(facing: 'up' | 'down' | 'left' | 'right'): boolean {
    const px = this.player.x;
    const py = this.player.y;
    const maxDist = config.waiting['3-4_最大投擲距離'];
    const sampleDistances = [40, 80, maxDist];
    for (const dist of sampleDistances) {
      let x = px;
      let y = py;
      switch (facing) {
        case 'up':
          y -= dist;
          break;
        case 'down':
          y += dist;
          break;
        case 'left':
          x -= dist;
          break;
        case 'right':
          x += dist;
          break;
      }
      if (this.isPointInWater(x, y)) {
        return true;
      }
    }
    return false;
  }

  /** 現在の向きで水源へキャストできるか */
  canCastTowardWater(): boolean {
    return this.hasWaterInDirection(this.playerFacing);
  }

  restrictWaterEntry() {
    if (!this.isInsideWater()) return;
    
    const px = this.player.x;
    const py = this.player.y;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    
    // 水辺から押し出す
    for (const area of this.waterAreas) {
        if (area.type === 'ellipse') {
            const dx = (px - area.x) / (area.width / 2);
            const dy = (py - area.y) / (area.height / 2);
            if (dx * dx + dy * dy <= 1) {
                // 楕円の外側へ押し出す
                const angle = Math.atan2(py - area.y, px - area.x);
                const pushX = area.x + Math.cos(angle) * (area.width / 2 + 5);
                const pushY = area.y + Math.sin(angle) * (area.height / 2 + 5);
                this.player.x = pushX;
                this.player.y = pushY;
                body.setVelocity(0);
                return;
            }
        } else if (area.type === 'rect') {
            if (px >= area.x && px <= area.x + area.width &&
                py >= area.y && py <= area.y + area.height) {
                // 矩形の外側へ押し出す（最も近い辺へ）
                const distances = [
                    { dir: 'left', dist: px - area.x },
                    { dir: 'right', dist: area.x + area.width - px },
                    { dir: 'top', dist: py - area.y },
                    { dir: 'bottom', dist: area.y + area.height - py },
                ];
                const nearest = distances.reduce((a, b) => a.dist < b.dist ? a : b);
                
                if (nearest.dir === 'left') this.player.x = area.x - 5;
                else if (nearest.dir === 'right') this.player.x = area.x + area.width + 5;
                else if (nearest.dir === 'top') this.player.y = area.y - 5;
                else if (nearest.dir === 'bottom') this.player.y = area.y + area.height + 5;
                
                body.setVelocity(0);
                return;
            }
        }
    }
  }

  // --- 釣りリグ（背面担ぎ・Graphics） ---

  /** 背中付け根（プレイヤー中心からのオフセット、スケール前） */
  private static readonly ROD_ANCHOR_OFFSET_X = 1;
  private static readonly ROD_ANCHOR_OFFSET_Y = 7.5;
  /** 竿先（付け根からのななめ後ろへの伸び・担ぎ/アイドル） */
  private static readonly ROD_TIP_OFFSET_X = 20;
  private static readonly ROD_TIP_OFFSET_Y = 27;
  /** 待機中は ROD_TIP_OFFSET と同じ長さで X だけ反転（後ろ上 → 前上） */
  /** 竿身の太さ（付け根→先端で三段階） */
  private static readonly ROD_SHAFT_THICK_GRIP = 4;
  private static readonly ROD_SHAFT_THICK_MID = 3;
  private static readonly ROD_SHAFT_THICK_TIP = 2;
  private static readonly ROD_GRIP_SIZE = 5;
  /** 先端のしなり量（スケール前・px） */
  private static readonly ROD_TIP_CURVE_BASE = 4;
  /** 担い時・通常時の糸の長さ（スケール前・px） */
  private static readonly ROD_CARRIED_LINE_LENGTH = 12;
  /** 左右移動の慣性（スケール前・px） */
  private static readonly ROD_FLOAT_INERTIA_MAX_X = 6;
  private static readonly ROD_FLOAT_INERTIA_MAX_Y = -1.0;
  /** キャスティング：持ち手（anchor）中心の揺れ・最大角度（ラジアン） */
  private static readonly ROD_CAST_GRIP_SWAY_MAX = 0.14;
  /** 上下待機：真上に対する「後ろ」成分（小さめ＝ちょい斜め） */
  private static readonly ROD_VERTICAL_WAIT_BACK_X = 0.05;
  /** 上下待機のしなり（角度は ROD_VERTICAL_WAIT_BACK_X、しなりだけ強め） */
  private static readonly ROD_VERTICAL_WAIT_CURVE_MUL = -2.5;

  private getFishingRigScale(): number {
    return Math.abs(this.player.scaleX);
  }

  private getRodPalette(): {
    grip: number;
    shaftGrip: number;
    shaftMid: number;
    shaftTip: number;
    ring: number;
  } {
    switch (this.playerData.equippedRodId) {
      case 'rod_bamboo':
        return {
          grip: 0x3a5c10,
          shaftGrip: 0x4e8018,
          shaftMid: 0x6ab020,
          shaftTip: 0x90d830,
          ring: 0xc8f070,
        };
      case 'rod_carbon':
        return {
          grip: 0x1a1e28,
          shaftGrip: 0x303848,
          shaftMid: 0x505868,
          shaftTip: 0x788898,
          ring: 0xb0b8c8,
        };
      case 'rod_master':
        return {
          grip: 0x5c1018,
          shaftGrip: 0x8c1828,
          shaftMid: 0xc02838,
          shaftTip: 0xe84858,
          ring: 0xffcc44,
        };
      case 'rod_legendary':
        return {
          grip: 0x4a1878,
          shaftGrip: 0x6a28a8,
          shaftMid: 0x9848d0,
          shaftTip: 0xc878f0,
          ring: 0xffe066,
        };
      case 'rod_basic':
      default:
        return {
          grip: 0x3a2410,
          shaftGrip: 0x5c3818,
          shaftMid: 0x805028,
          shaftTip: 0xa87038,
          ring: 0xdddddd,
        };
    }
  }

  /** 顔の反対側＝背中（スプライトは左右のみ） */
  private getBackSign(): number {
    return this.player.flipX ? 1 : -1;
  }

  /** アイドル8コマごとの Y オフセット（スプライト基準px・コマ切り） */
  private static readonly ROD_IDLE_FRAME_Y = [0, 0, 1, 2, 2, 1, 0, -1];
  /** 歩行4コマ（フレーム 9-12）ごとの Y オフセット */
  private static readonly ROD_WALK_FRAME_Y = [0, 2, 1, 0];

  /**
   * スプライトと同じコマ数でガクッと動く付け根オフセット（補間なし）
   * player-idle: 0-7 @ 6fps / player-walk: 9-12 @ 8fps
   */
  private getRodAnchorAnimOffset(): { x: number; y: number } {
    const animKey = this.player.anims.currentAnim?.key;
    const frame = this.player.anims.currentFrame?.index ?? 0;
    const s = this.getFishingRigScale();

    if (animKey === 'player-idle' && frame >= 0 && frame <= 7) {
      return {
        x: 0,
        y: Math.round(GameScene.ROD_IDLE_FRAME_Y[frame] * s),
      };
    }
    if (animKey === 'player-walk' && frame >= 9 && frame <= 12) {
      return {
        x: 0,
        y: Math.round(GameScene.ROD_WALK_FRAME_Y[frame - 9] * s),
      };
    }
    return { x: 0, y: 0 };
  }

  private syncFishingRigAnchor(): void {
    const s = this.getFishingRigScale();
    const backSign = this.getBackSign();
    const animOffset = this.getRodAnchorAnimOffset();
    this.fishingRig.anchor.x = Math.round(
      this.player.x + backSign * GameScene.ROD_ANCHOR_OFFSET_X * s + animOffset.x,
    );
    this.fishingRig.anchor.y = Math.round(
      this.player.y + GameScene.ROD_ANCHOR_OFFSET_Y * s + animOffset.y,
    );
  }

  /** 待機中に上下へキャストしたとき（左右パターンではなくやや後ろ上に構える） */
  private isRodWaitingPose(): boolean {
    return this.state === FishingState.WAITING || this.state === FishingState.EXPLORING;
  }

  private isVerticalRodWaitingPose(): boolean {
    return (
      this.isRodWaitingPose() &&
      (this.playerFacing === 'up' || this.playerFacing === 'down')
    );
  }

  /** 待機中：左右は前＋上へ反転、上下キャストはやや後ろ上 */
  private getRodWaitingDroopDirection(): { x: number; y: number } {
    if (this.playerFacing === 'up' || this.playerFacing === 'down') {
      const backSign = this.getBackSign();
      const x = backSign * GameScene.ROD_VERTICAL_WAIT_BACK_X;
      const y = -1;
      const len = Math.hypot(x, y) || 1;
      return { x: x / len, y: y / len };
    }
    const faceSign = -this.getBackSign();
    const x = faceSign * 0.75;
    const y = -1;
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  /** 先端が倒れる方向（正規化） */
  private getRodLeanDirection(fromX: number, fromY: number): { x: number; y: number } {
    if (this.isRodWaitingPose()) {
      return this.getRodWaitingDroopDirection();
    }
    const showLine =
      this.state === FishingState.BITE ||
      this.state === FishingState.FIGHTING;
    if (showLine) {
      const dx = this.fishingRig.float.x - fromX;
      const dy = this.fishingRig.float.y - fromY;
      const len = Math.hypot(dx, dy);
      if (len > 2) {
        return { x: dx / len, y: dy / len };
      }
      const tdx = this.fishingRig.targetFloat.x - fromX;
      const tdy = this.fishingRig.targetFloat.y - fromY;
      const tlen = Math.hypot(tdx, tdy);
      if (tlen > 2) {
        return { x: tdx / tlen, y: tdy / tlen };
      }
    }
    // 担い・キャスティング準備：後ろに構え、先端が下方向に垂れる（アイドルと同じ）
    return { x: 0, y: 1 };
  }

  private getRodTipCurveAmount(): number {
    const base = GameScene.ROD_TIP_CURVE_BASE;
    const bend = this.fishingRig.rodBend;
    if (this.state === FishingState.BITE) {
      return base + 2.5 + bend;
    }
    if (this.state === FishingState.FIGHTING) {
      return base + 1.5 + bend;
    }
    if (this.isRodWaitingPose()) {
      if (this.isVerticalRodWaitingPose()) {
        return base * GameScene.ROD_VERTICAL_WAIT_CURVE_MUL;
      }
      return base * 0.5;
    }
    if (this.state === FishingState.CASTING) {
      return base * 0.45;
    }
    return base * 0.45;
  }

  /** 弓形の膨らみ向き（付け根→先端の法線方向の符号） */
  private getRodCurveBulgeSign(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): number {
    const segDx = endX - startX;
    const segDy = endY - startY;
    const segLen = Math.hypot(segDx, segDy) || 1;
    const perpX = -segDy / segLen;
    const perpY = segDx / segLen;
    let lean = this.getRodLeanDirection(startX, startY);
    const lineDx = this.fishingRig.float.x - startX;
    const lineDy = this.fishingRig.float.y - startY;
    const lineLen = Math.hypot(lineDx, lineDy);
    if (lineLen > 2) {
      const lineDir = { x: lineDx / lineLen, y: lineDy / lineLen };
      // 糸がほぼ縦でも左右は顔向きで決める（投擲先の上下には依存しない）
      lean =
        Math.abs(lineDx) < Math.abs(lineDy) * 0.45
          ? this.getRodWaitingDroopDirection()
          : lineDir;
    }
    const dot = perpX * lean.x + perpY * lean.y;
    return dot >= 0 ? -1 : 1;
  }

  /** 放物線（二次ベジェ）の制御点 */
  private getRodCurveControlPoint(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    bulgeSign: number,
  ): { x: number; y: number } {
    const segDx = endX - startX;
    const segDy = endY - startY;
    const segLen = Math.hypot(segDx, segDy) || 1;
    const perpX = (-segDy / segLen) * bulgeSign;
    const perpY = (segDx / segLen) * bulgeSign;
    const bulgeMul = this.isRodWaitingPose() ? 1.0 : 2.5;
    const bulge = this.getRodTipCurveAmount() * this.getFishingRigScale() * bulgeMul;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    return {
      x: midX + perpX * bulge,
      y: midY + perpY * bulge,
    };
  }

  private syncFishingRigRodTipBase(): void {
    const s = this.getFishingRigScale();
    const backSign = this.getBackSign();
    const faceSign = -backSign;
    let straightX: number;
    let straightY: number;
    if (this.isRodWaitingPose()) {
      if (this.isVerticalRodWaitingPose()) {
        const rodLen = Math.hypot(
          GameScene.ROD_TIP_OFFSET_X,
          GameScene.ROD_TIP_OFFSET_Y,
        );
        const dir = this.getRodWaitingDroopDirection();
        straightX =
          this.fishingRig.anchor.x + Math.round(dir.x * rodLen * s);
        straightY =
          this.fishingRig.anchor.y + Math.round(dir.y * rodLen * s);
      } else {
        straightX =
          this.fishingRig.anchor.x +
          Math.round(faceSign * GameScene.ROD_TIP_OFFSET_X * s);
        straightY =
          this.fishingRig.anchor.y -
          Math.round(GameScene.ROD_TIP_OFFSET_Y * s);
      }
    } else {
      straightX =
        this.fishingRig.anchor.x +
        Math.round(backSign * GameScene.ROD_TIP_OFFSET_X * s);
      straightY =
        this.fishingRig.anchor.y -
        Math.round(GameScene.ROD_TIP_OFFSET_Y * s);
    }
    this.fishingRig.rodStraightTip.x = straightX;
    this.fishingRig.rodStraightTip.y = straightY;
    // 糸の出どころ＝直線延長上の先端（しなりは描画のみ）
    this.fishingRig.rodTip.x = straightX;
    this.fishingRig.rodTip.y = straightY;
  }

  private rotatePointAround(
    px: number,
    py: number,
    cx: number,
    cy: number,
    angle: number,
  ): { x: number; y: number } {
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  }

  /** ゲージの増減に合わせ、持ち手を中心に竿全体を小さく揺らす */
  private applyCastingGripSway(): void {
    const { anchor, float } = this.fishingRig;
    // 背面方向は flipX で反転。ゲージ最大＝最も背面へ引く
    const sway =
      (this.castPower - 0.5) *
      2 *
      GameScene.ROD_CAST_GRIP_SWAY_MAX *
      this.getBackSign();
    const tipRot = this.rotatePointAround(
      this.fishingRig.rodStraightTip.x,
      this.fishingRig.rodStraightTip.y,
      anchor.x,
      anchor.y,
      sway,
    );
    this.fishingRig.rodStraightTip.x = Math.round(tipRot.x);
    this.fishingRig.rodStraightTip.y = Math.round(tipRot.y);
    this.fishingRig.rodTip.x = this.fishingRig.rodStraightTip.x;
    this.fishingRig.rodTip.y = this.fishingRig.rodStraightTip.y;
    const floatRot = this.rotatePointAround(float.x, float.y, anchor.x, anchor.y, sway);
    this.fishingRig.float.x = Math.round(floatRot.x);
    this.fishingRig.float.y = Math.round(floatRot.y);
  }

  private computeFloatTarget(distance: number): { x: number; y: number } {
    let x = this.player.x;
    let y = this.player.y;
    switch (this.playerFacing) {
      case 'up':
        y -= distance;
        break;
      case 'down':
        y += distance;
        break;
      case 'left':
        x -= distance;
        break;
      case 'right':
        x += distance;
        break;
    }
    return { x: Math.round(x), y: Math.round(y) };
  }

  /** 竿先から短い糸＋浮き（常時・釣り前） */
  private syncCarriedFloatPosition(): void {
    const lean = this.getRodLeanDirection(
      this.fishingRig.rodTip.x,
      this.fishingRig.rodTip.y,
    );
    const lineLen = GameScene.ROD_CARRIED_LINE_LENGTH * this.getFishingRigScale();
    this.fishingRig.float.x = Math.round(this.fishingRig.rodTip.x + lean.x * lineLen);
    this.fishingRig.float.y = Math.round(this.fishingRig.rodTip.y + lean.y * lineLen);
    this.fishingRig.targetFloat.x = this.fishingRig.float.x;
    this.fishingRig.targetFloat.y = this.fishingRig.float.y;
  }

  /** 左右移動中のみ：浮きが進行方向の反対へ遅れ、糸が斜めに見える */
  private updateCarriedFloatInertia(delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const moveSpeed = config.main['1-5_移動速度'];
    const s = this.getFishingRigScale();
    const vx = body.velocity.x;
    const isHorizontalMove = Math.abs(vx) > 8;
    const follow = 1 - Math.exp(-14 * (delta / 1000));

    if (isHorizontalMove) {
      const ratio = Phaser.Math.Clamp(vx / moveSpeed, -1, 1);
      const targetX = -ratio * GameScene.ROD_FLOAT_INERTIA_MAX_X * s;
      const targetY = Math.abs(ratio) * GameScene.ROD_FLOAT_INERTIA_MAX_Y * s;
      this.fishingRig.floatInertiaX = Phaser.Math.Linear(
        this.fishingRig.floatInertiaX,
        targetX,
        follow,
      );
      this.fishingRig.floatInertiaY = Phaser.Math.Linear(
        this.fishingRig.floatInertiaY,
        targetY,
        follow,
      );
      return;
    }

    this.fishingRig.floatInertiaX = Phaser.Math.Linear(this.fishingRig.floatInertiaX, 0, follow * 1.35);
    this.fishingRig.floatInertiaY = Phaser.Math.Linear(this.fishingRig.floatInertiaY, 0, follow * 1.35);
  }

  private applyCarriedFloatWithInertia(): void {
    this.syncCarriedFloatPosition();
    this.fishingRig.float.x += Math.round(this.fishingRig.floatInertiaX);
    this.fishingRig.float.y += Math.round(this.fishingRig.floatInertiaY);
  }

  /** 背面に担いだ竿の初期姿勢（常時表示用） */
  private initCarriedRodRig(): void {
    this.fishingRig.phase = 0;
    this.fishingRig.castPullback = 0;
    this.fishingRig.rodBend = 0;
    this.fishingRig.castSnapT = 1;
    this.fishingRig.floatInertiaX = 0;
    this.fishingRig.floatInertiaY = 0;
    this.syncFishingRigAnchor();
    this.syncFishingRigRodTipBase();
    this.applyCarriedFloatWithInertia();
  }

  /** 釣り終了時：遠投用の糸を戻し、短い糸＋浮きに復帰 */
  private resetFishingLineState(): void {
    this.fishingRig.castSnapT = 1;
    this.fishingRig.castPullback = 0;
    this.fishingRig.rodBend = 0;
    this.fishingRig.floatInertiaX = 0;
    this.fishingRig.floatInertiaY = 0;
    this.syncFishingRigAnchor();
    this.syncFishingRigRodTipBase();
    this.applyCarriedFloatWithInertia();
  }

  private prepareCastingRig(): void {
    this.fishingRig.castSnapT = 0;
    this.fishingRig.castPullback = 0;
    this.fishingRig.rodBend = 0;
    this.fishingRig.floatInertiaX = 0;
    this.fishingRig.floatInertiaY = 0;
    this.syncFishingRigAnchor();
    this.syncFishingRigRodTipBase();
    this.applyCarriedFloatWithInertia();
  }

  private setupFishingRigAfterCast(distance: number): void {
    const target = this.computeFloatTarget(distance);
    this.fishingRig.castDistance = distance;
    this.fishingRig.targetFloat.x = target.x;
    this.fishingRig.targetFloat.y = target.y;
    this.fishingRig.castSnapT = 0;
    this.fishingRig.castPullback = 0;
    this.syncFishingRigAnchor();
    this.syncFishingRigRodTipBase();
    this.fishingRig.float.x = this.fishingRig.rodTip.x;
    this.fishingRig.float.y = this.fishingRig.rodTip.y;
  }

  private updateFishingRig(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.fishingRig.phase += dt;

    this.syncFishingRigAnchor();

    if (
      this.state === FishingState.IDLE ||
      this.state === FishingState.SUCCESS ||
      this.state === FishingState.FAIL
    ) {
      this.fishingRig.castPullback = Phaser.Math.Linear(this.fishingRig.castPullback, 0, 0.15);
      this.fishingRig.rodBend = Phaser.Math.Linear(this.fishingRig.rodBend, 0, 0.15);
      this.syncFishingRigRodTipBase();
      this.updateCarriedFloatInertia(delta);
      this.applyCarriedFloatWithInertia();
      this.syncFishingRigRodTipBase();
      return;
    }

    if (this.state === FishingState.CASTING) {
      this.fishingRig.castPullback = 0;
      this.fishingRig.rodBend = 0;
      this.fishingRig.floatInertiaX = Phaser.Math.Linear(this.fishingRig.floatInertiaX, 0, 0.25);
      this.fishingRig.floatInertiaY = Phaser.Math.Linear(this.fishingRig.floatInertiaY, 0, 0.25);
      this.syncFishingRigRodTipBase();
      this.applyCarriedFloatWithInertia();
      this.applyCastingGripSway();
      return;
    }

    if (this.fishingRig.castSnapT < 1) {
      this.fishingRig.castSnapT = Math.min(1, this.fishingRig.castSnapT + delta / 280);
    }
    const snapEase = 1 - Math.pow(1 - this.fishingRig.castSnapT, 3);

    let wobbleX = 0;
    let wobbleY = 0;

    if (this.isRodWaitingPose()) {
      const wobbleAmp = 4;
      wobbleX = Math.sin(this.fishingRig.phase * 4) * wobbleAmp;
      this.fishingRig.rodBend = Phaser.Math.Linear(this.fishingRig.rodBend, 0, 0.12);
      this.fishingRig.castPullback = Phaser.Math.Linear(this.fishingRig.castPullback, 0, 0.1);
    } else if (this.state === FishingState.BITE) {
      wobbleX = Math.sin(this.fishingRig.phase * 35) * 8;
      wobbleY = Math.cos(this.fishingRig.phase * 28) * 6;
      this.fishingRig.rodBend = Phaser.Math.Linear(this.fishingRig.rodBend, 3, 0.25);
    } else if (this.state === FishingState.FIGHTING) {
      const fightStrain = 1 - this.catchProgress;
      const fishPull = (this.fishBarPosition - 0.5) * 6;
      wobbleX = Math.sin(this.fishingRig.phase * 12) * (2 + fightStrain * 4) + fishPull;
      wobbleY = Math.cos(this.fishingRig.phase * 10) * (2 + fightStrain * 3);
      this.fishingRig.rodBend = Phaser.Math.Linear(this.fishingRig.rodBend, 2 + fightStrain * 4, 0.08);
    } else {
      this.fishingRig.rodBend = Phaser.Math.Linear(this.fishingRig.rodBend, 0, 0.15);
    }

    const destX = this.fishingRig.targetFloat.x + wobbleX;
    const destY = this.fishingRig.targetFloat.y + wobbleY;
    const snapT = this.isRodWaitingPose() ||
      this.state === FishingState.BITE ||
      this.state === FishingState.FIGHTING
      ? snapEase
      : 1;

    this.syncFishingRigRodTipBase();

    this.fishingRig.float.x = Math.round(
      Phaser.Math.Linear(this.fishingRig.rodTip.x, destX, snapT),
    );
    this.fishingRig.float.y = Math.round(
      Phaser.Math.Linear(this.fishingRig.rodTip.y, destY, snapT),
    );

    if (!this.isRodWaitingPose()) {
      this.syncFishingRigRodTipBase();
    }
  }

  private drawPixelLine(
    g: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: number,
  ): void {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const xe = Math.round(x1);
    const ye = Math.round(y1);
    const dx = Math.abs(xe - x);
    const dy = Math.abs(ye - y);
    const sx = x < xe ? 1 : -1;
    const sy = y < ye ? 1 : -1;
    let err = dx - dy;
    g.fillStyle(color, 1);
    while (true) {
      g.fillRect(x, y, 1, 1);
      if (x === xe && y === ye) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** 竿身の進行度 0=グリップ側 … 1=先端（太さ・色とも三段階） */
  private getRodShaftStyleAlongRod(
    t: number,
    palette: ReturnType<GameScene['getRodPalette']>,
  ): { thick: number; color: number } {
    if (t < 1 / 3) {
      return { thick: GameScene.ROD_SHAFT_THICK_GRIP, color: palette.shaftGrip };
    }
    if (t < 2 / 3) {
      return { thick: GameScene.ROD_SHAFT_THICK_MID, color: palette.shaftMid };
    }
    return { thick: GameScene.ROD_SHAFT_THICK_TIP, color: palette.shaftTip };
  }

  /** 付け根→先端を1本の二次ベジェでサンプル（連続した弓形） */
  private collectRodShaftPixelsArc(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    bulgeSign: number,
  ): Array<{ x: number; y: number; t: number }> {
    const ctrl = this.getRodCurveControlPoint(startX, startY, endX, endY, bulgeSign);
    const arcLen = Math.hypot(endX - startX, endY - startY);
    const steps = Math.max(20, Math.round(arcLen * 1.6));
    const samples: Array<{ x: number; y: number; t: number }> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const x = u * u * startX + 2 * u * t * ctrl.x + t * t * endX;
      const y = u * u * startY + 2 * u * t * ctrl.y + t * t * endY;
      samples.push({ x: Math.round(x), y: Math.round(y), t });
    }
    const pixels: Array<{ x: number; y: number; t: number }> = [];
    const seen = new Set<string>();
    for (const s of samples) {
      const key = `${s.x},${s.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pixels.push(s);
    }
    return pixels;
  }

  private drawRodOnBack(
    g: Phaser.GameObjects.Graphics,
    palette: ReturnType<GameScene['getRodPalette']>,
  ): void {
    const { anchor, rodStraightTip, rodTip } = this.fishingRig;
    const ax = anchor.x;
    const ay = anchor.y;
    const backSign = this.getBackSign();
    const gripSize = GameScene.ROD_GRIP_SIZE;
    const gripHalf = Math.floor(gripSize / 2);

    g.fillStyle(palette.grip, 1);
    g.fillRect(ax - gripHalf, ay - gripHalf, gripSize, gripSize);

    const bulgeSign = this.getRodCurveBulgeSign(ax, ay, rodStraightTip.x, rodStraightTip.y);
    const shaftPixels = this.collectRodShaftPixelsArc(
      ax,
      ay,
      rodStraightTip.x,
      rodStraightTip.y,
      bulgeSign,
    );
    shaftPixels.forEach((p) => {
      const { thick, color } = this.getRodShaftStyleAlongRod(p.t, palette);
      const off = Math.floor(thick / 2);
      g.fillStyle(color, 1);
      g.fillRect(p.x - off, p.y - off, thick, thick);
    });

    const endX = Math.round(rodTip.x);
    const endY = Math.round(rodTip.y);
    const tipThick = GameScene.ROD_SHAFT_THICK_TIP;
    const tipOff = Math.floor(tipThick / 2);
    g.fillStyle(palette.ring, 1);
    g.fillRect(endX - tipOff, endY - tipOff, tipThick, tipThick);
    g.fillStyle(palette.shaftTip, 0.6);
    g.fillRect(endX - tipOff + 1, endY - tipOff + 1, Math.max(1, tipThick - 2), Math.max(1, tipThick - 2));
    g.fillStyle(palette.grip, 0.85);
    g.fillRect(ax + backSign * 2 - 1, ay - 1, 2, 3);
  }

  private drawFishingFloat(g: Phaser.GameObjects.Graphics, fx: number, fy: number): void {
    const cx = Math.round(fx);
    const cy = Math.round(fy);
    const s = Math.max(1, Math.round(this.getFishingRigScale()));
    const w = 3 + s;
    const redH = 2 + Math.floor(s * 0.5);
    const yellowH = 2 + Math.floor(s * 0.5);
    g.fillStyle(0xffd200, 1);
    g.fillRect(cx - Math.floor(w / 2), cy, w, yellowH);
    g.fillStyle(0xff3333, 1);
    g.fillRect(cx - Math.floor(w / 2), cy - redH, w, redH);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx, cy - redH + 1, 1, 1);
  }

  private drawFishingRig(): void {
    const { rodTip, float } = this.fishingRig;
    const palette = this.getRodPalette();
    const lineColor = 0xdddddd;

    this.fishingRodGfx.clear();
    this.fishingLineGfx.clear();

    this.drawRodOnBack(this.fishingRodGfx, palette);

    this.drawPixelLine(this.fishingLineGfx, rodTip.x, rodTip.y, float.x, float.y, lineColor);
    const lineWidth = config.waiting['3-1_ライン太さ'];
    if (lineWidth >= 2) {
      const perpX = float.x - rodTip.x;
      const perpY = float.y - rodTip.y;
      const len = Math.hypot(perpX, perpY) || 1;
      const ox = Math.round((-perpY / len));
      const oy = Math.round((perpX / len));
      this.drawPixelLine(
        this.fishingLineGfx,
        rodTip.x + ox,
        rodTip.y + oy,
        float.x + ox,
        float.y + oy,
        lineColor,
      );
    }

    this.drawFishingFloat(this.fishingLineGfx, float.x, float.y);
  }

  // --- 投擲処理 ---
  startCasting() {
    this.player.setFlipX(this.lastHorizontalFacing === 'left');
    this.player.anims.play('player-idle', true);
    this.state = FishingState.CASTING;
    this.castPower = 0;
    this.castDirection = 1;
    this.castMaxHoldRemainingSec = 0;
    this.prepareCastingRig();
    this.fishingGaugeOverlay.setCastVisible(true);
    this.layoutFishingGaugeOverlay();
    this.showPlayerHint(PLAYER_HINTS.recast);
  }

  updateCasting(delta: number) {
    const deltaSec = delta / 1000;

    if (this.castMaxHoldRemainingSec > 0) {
      this.castMaxHoldRemainingSec = Math.max(0, this.castMaxHoldRemainingSec - deltaSec);
      if (this.castMaxHoldRemainingSec <= 0) {
        this.castDirection = -1;
      }
      this.castPower = 1;
    } else {
      const speed = config.casting['2-3_ゲージ速度'];
      this.castPower += speed * delta * this.castDirection;

      if (this.castPower >= 1) {
        this.castPower = 1;
        const holdSec = config.casting['2-4_マックス待機時間'];
        if (holdSec > 0) {
          this.castMaxHoldRemainingSec = holdSec;
        } else {
          this.castDirection = -1;
        }
      } else if (this.castPower <= 0) {
        this.castPower = 0;
        this.castDirection = 1;
      }
    }

    this.layoutFishingGaugeOverlay();
    this.fishingGaugeOverlay.updateCast({ power: this.castPower });
  }

  finishCasting() {
    const waitCfg = config.waiting;

    // 装備中の釣り竿のボーナスを取得
    const equippedRod = getRodById(this.playerData.equippedRodId);
    const skillBonuses = getEffectiveSkillStatBonuses(this.playerData);
    const powerStatus = 1.0 + (equippedRod?.powerStatAdd || 0) + skillBonuses.castDistSkillAdd;

    // パワーに応じた距離（釣り竿のボーナスを反映）
    const minDist = waitCfg['3-3_最小投擲距離'];
    const maxDist = waitCfg['3-4_最大投擲距離'];
    const baseDistance = minDist + (this.castPower * (maxDist - minDist));
    const distanceSpan = Math.max(0, maxDist - minDist);
    const castDistanceAdd = distanceSpan * (powerStatus - 1.0);
    let distance = baseDistance + castDistanceAdd;
    if (hasSkillAbility(this.playerData, 'abil_power_cast_finesse') && this.castPower >= 0.98) {
      distance *= 1.25;
    }

    const castTarget = this.computeFloatTarget(distance);
    if (!this.isPointInWater(castTarget.x, castTarget.y)) {
      this.fishingGaugeOverlay.setCastVisible(false);
      this.hidePlayerHint();
      this.state = FishingState.IDLE;
      this.showResult("水の方を向いてください", 1500);
      return;
    }

    this.state = FishingState.EXPLORING;
    this.fishingGaugeOverlay.setCastVisible(false);
    this.hidePlayerHint();
    if (this.resultTextElement) {
      this.resultTextElement.style.display = 'none';
    }
    this.hideCatchResultPopup();

    this.lastCastDistanceRatio = getCastDistanceRatio(distance);

    this.setupFishingRigAfterCast(distance);
    this.fixedFloatCenter = {
      x: this.fishingRig.targetFloat.x,
      y: this.fishingRig.targetFloat.y,
    };
    this.followCameraToFloat();

    // エサとルアーのボーナスを計算（消費はファイト開始時）
    const bait = this.playerData.equippedBaitId ? getBaitById(this.playerData.equippedBaitId) : null;
    const lure = this.playerData.equippedLureId ? getLureById(this.playerData.equippedLureId) : null;

    // 装備ボーナスは加算で合成し、効きは専用関数で調整する
    const rodRarityHitAdd = equippedRod?.rarityHitRateAdd || { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    const bonuses: RarityBonuses = {
      commonBonus: this.combineRarityBonus(bait?.commonBonus || 1.0, lure?.commonBonus || 1.0, 1.0 + rodRarityHitAdd.common),
      uncommonBonus: this.combineRarityBonus(bait?.uncommonBonus || 1.0, lure?.uncommonBonus || 1.0, 1.0 + rodRarityHitAdd.uncommon),
      rareBonus: this.combineRarityBonus(bait?.rareBonus || 1.0, lure?.rareBonus || 1.0, 1.0 + rodRarityHitAdd.rare),
      epicBonus: this.combineRarityBonus(bait?.epicBonus || 1.0, lure?.epicBonus || 1.0, 1.0 + rodRarityHitAdd.epic),
      legendaryBonus: this.combineRarityBonus(
        bait?.legendaryBonus || 1.0,
        lure?.legendaryBonus || 1.0,
        1.0 + rodRarityHitAdd.legendary,
      ),
    };

    this.pendingExploration = { bonuses, junkWeightMultiplier: skillBonuses.junkRateSkillMul };
    this.explorationAwaitingSplash = true;
  }

  private tryOpenExplorationAfterSplash(): void {
    if (!this.explorationAwaitingSplash) return;
    if (this.state !== FishingState.EXPLORING) return;
    if (this.fishingRig.castSnapT < 1) return;
    this.explorationAwaitingSplash = false;
    if (!this.pendingExploration) return;
    const delayMs = explorationConfig.modalDelayAfterSplashSec * 1000;
    this.explorationSplashTimer?.remove(false);
    this.explorationSplashTimer = this.time.delayedCall(delayMs, () => {
      this.explorationSplashTimer = undefined;
      if (this.state !== FishingState.EXPLORING) return;
      const next = this.pendingExploration;
      this.pendingExploration = null;
      if (!next) return;
      this.startUnderwaterExploration(next.bonuses, next.junkWeightMultiplier);
    });
  }

  private startUnderwaterExploration(bonuses: RarityBonuses, junkWeightMultiplier: number): void {
    if (!this.explorationController) {
      this.explorationController = new ExplorationController();
    }
    this.explorationController.start({
      rarityBonuses: bonuses,
      junkWeightMultiplier,
      castDistanceRatio: this.lastCastDistanceRatio,
      baitId: this.playerData.equippedBaitId,
      lureId: this.playerData.equippedLureId,
      onHookSuccess: (result) => this.onExplorationHookSuccess(result),
      onCancel: () => this.onExplorationCancel(),
    });
  }

  private onExplorationHookSuccess(result: ExplorationResult): void {
    this.currentFish = result.fish;
    this.currentFishSize = result.fish.id.startsWith('junk_') ? undefined : result.size;
    this.hookDepthRatio = result.hookDepthRatio;
    this.startFighting();
  }

  private onExplorationCancel(): void {
    this.cancelFishing('探索をやめた');
  }

  triggerBite() {
    if (this.state !== FishingState.WAITING) return;
    this.state = FishingState.BITE;
    
    // 派手なエフェクト
    this.showBiteMark();
    
    // ヒント表示
    this.showPlayerHint(PLAYER_HINTS.bite, 'urgent');

    // 反応時間
    const reactionTime = config.bite['4-3_反応時間'] * 1000;
    this.biteTimeout = this.time.delayedCall(reactionTime, () => {
        if (this.state === FishingState.BITE) {
            this.cancelFishing("逃げられた...");
        }
    });
  }

  // --- ファイト処理 ---
  private resetFightState(): void {
    const fightCfg = config.fighting;
    const skillBonuses = getEffectiveSkillStatBonuses(this.playerData);
    const startLayout = resolveFightStartBarLayout(
      this.playerData,
      this.playerData.equippedRodId,
      skillBonuses,
    );
    this.fishBarPosition = FIGHT_TRACK_CENTER;
    this.playerBarPosition = startLayout.playerBarPosition;
    this.playerBarVelocity = 0;
    this.playerBarPrevRange = startLayout.prevBarRange;
    this.catchProgress = fightCfg['5-12_初期ゲージ'];
    const fightStartMoveDelaySec = hasSkillAbility(this.playerData, 'abil_luck_junk_ward')
      ? fightCfg['5-12b_開始時魚移動待機秒_シルクタッチ']
      : fightCfg['5-12a_開始時魚移動待機秒'];
    this.fishMoveTimer = fightStartMoveDelaySec;
    this.fishTargetPosition = FIGHT_TRACK_CENTER;
    this.fishDriftIntent = 0;
    this.fishDriftVelocity = 0;
    this.fightTension = 0;
    this.fightTensionVelocity = 0;
    this.fightElapsedSec = 0;
    this.fightPeakTension = 0;
    this.fishFatigue = 0;
    this.fishFightState = 'running';
    this.fightStaggerUsedThisFight = false;
    this.fightSmoothDragUsedThisFight = false;
    this.fightLockOnUsedThisFight = false;
    this.fishFreezeRemainingSec = 0;
    this.lockOnRemainingSec = 0;
    this.smoothDragRemainingSec = 0;
    this.speedComboMultiplier = 0;
  }

  private buildFightSimSnapshot(): FightSimState {
    return {
      fishBarPosition: this.fishBarPosition,
      fishTargetPosition: this.fishTargetPosition,
      fishMoveTimer: this.fishMoveTimer,
      fishDriftIntent: this.fishDriftIntent,
      fishDriftVelocity: this.fishDriftVelocity,
      playerBarPosition: this.playerBarPosition,
      playerBarVelocity: this.playerBarVelocity,
      prevBarRange: this.playerBarPrevRange,
      catchProgress: this.catchProgress,
      tension: this.fightTension,
      tensionVelocity: this.fightTensionVelocity,
      fishFatigue: this.fishFatigue,
      fishState: this.fishFightState,
      fishFreezeRemainingSec: this.fishFreezeRemainingSec,
      lockOnRemainingSec: this.lockOnRemainingSec,
      smoothDragRemainingSec: this.smoothDragRemainingSec,
      speedComboMultiplier: this.speedComboMultiplier,
      fightStaggerUsed: this.fightStaggerUsedThisFight,
      fightSmoothDragUsed: this.fightSmoothDragUsedThisFight,
      fightLockOnUsed: this.fightLockOnUsedThisFight,
      isCatching: false,
    };
  }

  /** 非表示中も DOM を現在のファイト状態へ同期（開始時チラつき防止） */
  private renderFightOverlay(): void {
    const skillBonuses = getEffectiveSkillStatBonuses(this.playerData);
    const simSnapshot = this.buildFightSimSnapshot();
    const barHeight = getFightBarHeight(
      simSnapshot,
      this.playerData,
      this.playerData.equippedRodId,
      skillBonuses,
    );
    const isCatching =
      this.fishBarPosition >= this.playerBarPosition &&
      this.fishBarPosition <= this.playerBarPosition + barHeight;
    const criticalZoneHeight = hasSkillAbility(this.playerData, 'abil_speed_opening_surge') ? 0.08 : 0;
    const playerHitBarCenter = this.playerBarPosition + barHeight / 2;
    let fishRarityTint: string | null = null;
    if (this.currentFish && canRevealFightFishRarity(this.playerData)) {
      const colorNum = rarityColors[this.currentFish.rarity] ?? 0xaaaaaa;
      fishRarityTint = `#${colorNum.toString(16).padStart(6, '0')}`;
    }
    this.fishingGaugeOverlay.updateFight({
      fishBarPosition: this.fishBarPosition,
      playerBarPosition: this.playerBarPosition,
      barHeight,
      catchProgress: this.catchProgress,
      isCatching,
      criticalZoneHeight,
      playerHitBarCenter,
      fishDriftVelocity: this.fishDriftVelocity,
      tension: this.fightTension,
      fishState: this.fishFightState,
      fishRarityTint,
    });
    this.updateFightSkillIcons();
  }

  private updateFightSkillIcons(): void {
    this.fishingGaugeOverlay.updateFightSkillIcons({
      z: {
        learned: hasSkillAbility(this.playerData, 'abil_control_lock_on'),
        used: this.fightLockOnUsedThisFight,
        remainingSec: this.lockOnRemainingSec,
      },
      x: {
        learned: hasSkillAbility(this.playerData, 'abil_power_fight_steady'),
        used: this.fightStaggerUsedThisFight,
        remainingSec: this.fishFreezeRemainingSec,
      },
      c: {
        learned: hasSkillAbility(this.playerData, 'abil_control_smooth_drag'),
        used: this.fightSmoothDragUsedThisFight,
        remainingSec: this.smoothDragRemainingSec,
      },
    });
  }

  private hideAndResetFightOverlay(): void {
    this.fightIntroPlaying = false;
    this.fishingGaugeOverlay.setFightVisible(false);
    this.resetFightState();
    this.renderFightOverlay();
  }

  startFighting() {
    if (this.biteTimeout) this.biteTimeout.remove();
    this.hideBiteMark();
    this.hidePlayerHint();
    
    // ファイト開始時にエサを消費
    if (this.playerData.equippedBaitId) {
      consumeBait(this.playerData);
      savePlayerData(this.playerData);
    }
    
    // サイズは探索で決定済み。未設定時のみ従来どおり生成する
    if (this.currentFish && this.currentFishSize === undefined) {
      const isJunk = this.currentFish.id.startsWith('junk_');
      if (!isJunk) {
        this.currentFishSize = generateRandomSize(
          this.currentFish.maxSize,
          this.lastCastDistanceRatio,
        );
      }
    }

    this.resetFightState();
    this.renderFightOverlay();
    this.state = FishingState.FIGHTING;
    this.layoutFishingGaugeOverlay();
    this.fightIntroPlaying = true;
    this.fishingGaugeOverlay.playFightStartIntro(() => {
      this.fightIntroPlaying = false;
    });
  }

  /** Z : ロックオン（control_n03） */
  private tryUseFightLockOn() {
    if (this.fightLockOnUsedThisFight) return;
    if (!hasSkillAbility(this.playerData, 'abil_control_lock_on')) return;
    this.lockOnRemainingSec = FIGHT_SKILL_DURATIONS.z;
    this.fightLockOnUsedThisFight = true;
    this.showResult('スキル発動: ロックオン', 800, { resetFishingStateOnEnd: false });
  }

  /** X : スタッガー（power_n06） */
  private tryUseFightStagger() {
    if (this.fightStaggerUsedThisFight) return;
    if (!hasSkillAbility(this.playerData, 'abil_power_fight_steady')) return;
    this.fishFreezeRemainingSec = 1.5;
    this.fightStaggerUsedThisFight = true;
    this.showResult('スキル発動: スタッガー', 800, { resetFishingStateOnEnd: false });
  }

  /** C : フィッシャーズハイ（technique_n03） */
  private tryUseFightSmoothDrag() {
    if (this.fightSmoothDragUsedThisFight) return;
    if (!hasSkillAbility(this.playerData, 'abil_control_smooth_drag')) return;
    this.smoothDragRemainingSec = 4.0;
    this.fightSmoothDragUsedThisFight = true;
    this.showResult('スキル発動: フィッシャーズハイ', 800, { resetFishingStateOnEnd: false });
  }

  updateFighting(_time: number, delta: number) {
    if (this.fightIntroPlaying) {
      this.renderFightOverlay();
      return;
    }

    const dt = delta / 1000;
    this.fightElapsedSec += dt;
    const cfg = config.fighting;
    const skillBonuses = getEffectiveSkillStatBonuses(this.playerData);

    if (Phaser.Input.Keyboard.JustDown(this.fightSkillZKey)) {
      this.tryUseFightLockOn();
    }
    if (Phaser.Input.Keyboard.JustDown(this.fightSkillXKey)) {
      this.tryUseFightStagger();
    }
    if (Phaser.Input.Keyboard.JustDown(this.fightSkillCKey)) {
      this.tryUseFightSmoothDrag();
    }

    const simState: FightSimState = {
      fishBarPosition: this.fishBarPosition,
      fishTargetPosition: this.fishTargetPosition,
      fishMoveTimer: this.fishMoveTimer,
      fishDriftIntent: this.fishDriftIntent,
      fishDriftVelocity: this.fishDriftVelocity,
      playerBarPosition: this.playerBarPosition,
      playerBarVelocity: this.playerBarVelocity,
      prevBarRange: this.playerBarPrevRange,
      catchProgress: this.catchProgress,
      tension: this.fightTension,
      tensionVelocity: this.fightTensionVelocity,
      fishFatigue: this.fishFatigue,
      fishState: this.fishFightState,
      fishFreezeRemainingSec: this.fishFreezeRemainingSec,
      lockOnRemainingSec: this.lockOnRemainingSec,
      smoothDragRemainingSec: this.smoothDragRemainingSec,
      speedComboMultiplier: this.speedComboMultiplier,
      fightStaggerUsed: this.fightStaggerUsedThisFight,
      fightSmoothDragUsed: this.fightSmoothDragUsedThisFight,
      fightLockOnUsed: this.fightLockOnUsedThisFight,
      isCatching: false,
    };

    const fish = this.currentFish;
    const fishParams = fish
      ? applyHookDepthToFightParams(
          fishParamsFromConfig(fish, this.currentFishSize),
          this.hookDepthRatio,
        )
      : {
          catchRate: 1.0,
          escapeRate: 1.0,
          fishSpeed: 0.3,
          fishErratic: 0.3,
          moveInterval: [cfg['5-13_魚の移動間隔_最短'], cfg['5-14_魚の移動間隔_最長']] as [number, number],
          maxSize: 30,
        };

    stepFightSimulation(simState, {
      dt,
      leftHeld: this.cursors.left.isDown,
      rightHeld: this.cursors.right.isDown,
      tensionUpHeld: this.cursors.up.isDown,
      playerData: this.playerData,
      equippedRodId: this.playerData.equippedRodId,
      fish: fishParams,
      skillBonuses,
      skipSkillTriggers: true,
    });

    this.fishBarPosition = simState.fishBarPosition;
    this.fishTargetPosition = simState.fishTargetPosition;
    this.fishMoveTimer = simState.fishMoveTimer;
    this.fishDriftIntent = simState.fishDriftIntent;
    this.fishDriftVelocity = simState.fishDriftVelocity;
    this.playerBarPosition = simState.playerBarPosition;
    this.playerBarVelocity = simState.playerBarVelocity;
    this.playerBarPrevRange = simState.prevBarRange;
    this.catchProgress = simState.catchProgress;
    this.fightTension = simState.tension;
    this.fightTensionVelocity = simState.tensionVelocity;
    this.fightPeakTension = Math.max(this.fightPeakTension, simState.tension);
    this.fishFatigue = simState.fishFatigue;
    this.fishFightState = simState.fishState;
    this.fishFreezeRemainingSec = simState.fishFreezeRemainingSec;
    this.lockOnRemainingSec = simState.lockOnRemainingSec;
    this.smoothDragRemainingSec = simState.smoothDragRemainingSec;
    this.speedComboMultiplier = simState.speedComboMultiplier;

    this.renderFightOverlay();

    if (this.catchProgress >= 1) {
        this.successFishing();
    } else if (this.catchProgress <= 0) {
        this.cancelFishing("逃げられた...");
    }
  }

  private buildQuestCatchContext(
    fishSize?: number,
    fightStats?: { tensionAtCatch: number; fightDurationSec: number },
  ): QuestCatchContext {
    return {
      fishSize,
      tensionAtCatch: fightStats?.tensionAtCatch ?? this.fightPeakTension,
      fightDurationSec: fightStats?.fightDurationSec ?? this.fightElapsedSec,
      equippedRodId: this.playerData.equippedRodId,
      equippedBaitId: this.playerData.equippedBaitId,
      equippedLureId: this.playerData.equippedLureId,
    };
  }

  successFishing() {
    this.state = FishingState.SUCCESS;
    this.followCameraToPlayer();
    // オーバーレイリセット前にクエスト判定用のファイト統計を退避
    const fightStats = {
      tensionAtCatch: this.fightPeakTension,
      fightDurationSec: this.fightElapsedSec,
    };
    this.hideAndResetFightOverlay();
    this.cleanupFishingTools();

    if (this.currentFish) {
        const isNewSpecies = !this.playerData.caughtFishIds.has(this.currentFish.id);
        // インベントリの空きをチェック
        const currentCount = getInventoryCount(this.playerData);
        if (currentCount >= this.playerData.maxInventorySlots) {
            // 満杯: 報酬は付与し、放流／バッグ入れかえを選択
            const fishSize = this.currentFishSize;
            const { leveledUp } = applyCatchRewards(this.playerData, this.currentFish, fishSize);

            incrementConsecutiveSuccess(this.playerData);

            const isJunk = this.currentFish.id.startsWith('junk_');
            let actualPrice = this.currentFish.price;
            if (!isJunk && fishSize !== undefined) {
              const sizeRatio = fishSize / this.currentFish.maxSize;
              actualPrice = calculatePriceWithSizeBonus(
                this.currentFish.price,
                sizeRatio,
                config.fighting['5-12f_サイズ売価ボーナス係数'],
              );
            }
            actualPrice = Math.round(actualPrice * getSellPriceMultiplier(this.playerData));

            const expMul = getExpMultiplierForFish(this.playerData, this.currentFish.id);
            const expGain = Math.max(1, Math.round(getExpByRarity(this.currentFish.rarity) * expMul));

            const catchCtx = this.buildQuestCatchContext(fishSize, fightStats);
            const completedCatchQuests = onQuestFishCaught(this.playerData, this.currentFish, catchCtx);
            const completedStreakQuests = onQuestConsecutiveSuccess(this.playerData);
            const allCompletedQuests = [...completedCatchQuests, ...completedStreakQuests];
            allCompletedQuests.forEach((quest) => {
              this.showQuestNotification(quest);
            });
            this.updateQuestHudUI();

            const unlockedAchievements = checkAchievements(this.playerData, ['catch', 'rarity', 'collection', 'special']);
            unlockedAchievements.forEach((achievement) => {
              this.showAchievementNotification(achievement);
            });

            if (leveledUp) {
              const levelAchievements = checkAchievements(this.playerData, ['level']);
              levelAchievements.forEach((achievement) => {
                this.showAchievementNotification(achievement);
              });
              const completedLevelQuests = onQuestLevelUp(this.playerData);
              completedLevelQuests.forEach((quest) => this.showQuestNotification(quest));
              this.updateQuestHudUI();
            }

            savePlayerData(this.playerData);
            this.updateStatusUI();
            this.updateQuestHudUI();

            if (this.unifiedBookOpen) {
              this.updateUnifiedBookList();
            }

            const stars = rarityStars[this.currentFish.rarity];
            const duration = config.result['6-2_成功表示時間'] * 1000;
            const sizeRatio = fishSize !== undefined ? fishSize / this.currentFish.maxSize : undefined;

            this.showCatchResultSequence({
              fish: this.currentFish,
              fishSize,
              stars,
              price: actualPrice,
              exp: expGain,
              leveledUp,
              isBagFull: true,
              needsBagDecision: true,
              isNewSpecies,
              level: this.playerData.level,
              duration,
              sizeRatio,
            });
            this.currentFish = null;
            this.currentFishSize = undefined;
            this.hookDepthRatio = 0.5;
            return;
        }

        // インベントリに追加（ファイト開始時に生成したサイズを使用）
        const fishSize = this.currentFishSize;
        const expMul = getExpMultiplierForFish(this.playerData, this.currentFish.id);
        const expGain = Math.max(1, Math.round(getExpByRarity(this.currentFish.rarity) * expMul));
        const { leveledUp } = addFishToInventory(this.playerData, this.currentFish, fishSize);
        
        // 連続成功を更新
        incrementConsecutiveSuccess(this.playerData);

        const catchCtx = this.buildQuestCatchContext(fishSize, fightStats);
        const completedCatchQuests = onQuestFishCaught(this.playerData, this.currentFish, catchCtx);
        const completedStreakQuests = onQuestConsecutiveSuccess(this.playerData);
        const allCompletedQuests = [...completedCatchQuests, ...completedStreakQuests];
        allCompletedQuests.forEach((quest) => {
          this.showQuestNotification(quest);
        });
        this.updateQuestHudUI();
        if (allCompletedQuests.length > 0 && this.unifiedBookOpen && this.unifiedBookTab === 'quest') {
          this.updateUnifiedBookList();
          this.updateUnifiedBookDetail();
        } else if (this.unifiedBookOpen && this.unifiedBookTab === 'quest') {
          this.updateUnifiedBookDetail();
        }
        
        // サイズによる価格ボーナスを計算
        const isJunk = this.currentFish.id.startsWith('junk_');
        let actualPrice = this.currentFish.price;
        if (!isJunk && fishSize !== undefined) {
          const sizeRatio = fishSize / this.currentFish.maxSize;
          actualPrice = calculatePriceWithSizeBonus(
            this.currentFish.price,
            sizeRatio,
            config.fighting['5-12f_サイズ売価ボーナス係数'],
          );
        }
        actualPrice = Math.round(actualPrice * getSellPriceMultiplier(this.playerData));
        
        // 統合BookUIが開いている場合はリストを更新
        if (this.unifiedBookOpen) {
          this.updateUnifiedBookList();
        }
        
        // 実績チェック（釣果、レア度、図鑑、連続成功、ゴミ）
        const unlockedAchievements = checkAchievements(this.playerData, ['catch', 'rarity', 'collection', 'special']);
        unlockedAchievements.forEach(achievement => {
          this.showAchievementNotification(achievement);
        });
        
        // レベルアップした場合はレベル実績もチェック
        if (leveledUp) {
          const levelAchievements = checkAchievements(this.playerData, ['level']);
          levelAchievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
          });
          const completedLevelQuests = onQuestLevelUp(this.playerData);
          completedLevelQuests.forEach((quest) => this.showQuestNotification(quest));
          this.updateQuestHudUI();
        }
        
        savePlayerData(this.playerData);
        this.updateStatusUI();
        this.updateQuestHudUI();

        const stars = rarityStars[this.currentFish.rarity];
        const duration = config.result['6-2_成功表示時間'] * 1000;
        
        const sizeRatio = fishSize !== undefined ? fishSize / this.currentFish.maxSize : undefined;
        this.showCatchResultSequence({
          fish: this.currentFish,
          fishSize,
          stars,
          price: actualPrice,
          exp: expGain,
          leveledUp,
          isBagFull: false,
          isNewSpecies,
          level: this.playerData.level,
          duration,
          sizeRatio,
        });
    }
    
    this.currentFish = null;
    this.currentFishSize = undefined;
    this.hookDepthRatio = 0.5;
  }

  cancelFishing(reason: string) {
    this.state = FishingState.FAIL;
    this.followCameraToPlayer();
    this.hideAndResetFightOverlay();
    this.cleanupFishingTools();
    this.currentFish = null;
    this.currentFishSize = undefined;
    this.hookDepthRatio = 0.5;
    
    // 連続成功をリセット
    resetConsecutiveSuccess(this.playerData);
    
    const duration = config.result['6-3_失敗表示時間'] * 1000;
    this.showResult(reason, duration);
  }

  cleanupFishingTools() {
    if (this.biteTimer) this.biteTimer.remove();
    if (this.biteTimeout) this.biteTimeout.remove();
    if (this.explorationSplashTimer) {
      this.explorationSplashTimer.remove(false);
      this.explorationSplashTimer = undefined;
    }
    this.explorationAwaitingSplash = false;
    this.pendingExploration = null;
    this.explorationController?.stop();
    this.resetFishingLineState();
    this.hideBiteMark();
    this.fishingGaugeOverlay.setCastVisible(false);
    this.hidePlayerHint();
  }

  showResult(text: string, duration: number, options?: { resetFishingStateOnEnd?: boolean }) {
    if (this.resultTextTimer) {
      this.resultTextTimer.remove(false);
      this.resultTextTimer = undefined;
    }

    if (this.resultTextElement) {
      this.resultTextElement.textContent = text;
      this.resultTextElement.style.display = 'block';
    }

    const shouldResetFishingState = options?.resetFishingStateOnEnd ?? true;
    this.resultTextTimer = this.time.delayedCall(duration, () => {
        if (shouldResetFishingState && (this.state === FishingState.SUCCESS || this.state === FishingState.FAIL)) {
          this.resetState();
        }
        if (this.resultTextElement) {
          this.resultTextElement.style.display = 'none';
        }
        this.resultTextTimer = undefined;
    });
  }

  private showCatchResultSequence(params: {
    fish: FishConfig;
    fishSize?: number;
    stars: string;
    price: number;
    exp: number;
    leveledUp: boolean;
    isBagFull: boolean;
    /** 満杯時に放流／入れかえ選択へ進む */
    needsBagDecision?: boolean;
    isNewSpecies: boolean;
    level: number;
    duration: number;
    sizeRatio?: number;
  }) {
    if (!this.catchResultElement) return;
    const additionalDurationMs = 1000;

    if (this.catchResultTimer) {
      this.catchResultTimer.remove(false);
      this.catchResultTimer = undefined;
    }

    const needsBagDecision = !!params.needsBagDecision;
    if (needsBagDecision) {
      this.catchBagDecisionPending = {
        fish: params.fish,
        fishSize: params.fishSize,
        stars: params.stars,
        price: params.price,
        exp: params.exp,
        leveledUp: params.leveledUp,
        isNewSpecies: params.isNewSpecies,
        level: params.level,
        duration: params.duration,
        sizeRatio: params.sizeRatio,
      };
    }

    const popupQueue: Array<{ kind: 'catch' | 'bag' | 'level' }> = [{ kind: 'catch' }];
    // 入れかえ選択フローでは自動売却通知は出さない。レベルアップは選択後に表示
    if (params.isBagFull && !needsBagDecision) popupQueue.push({ kind: 'bag' });
    if (params.leveledUp && !needsBagDecision) popupQueue.push({ kind: 'level' });

    const showAt = (index: number) => {
      const popup = popupQueue[index];
      if (!popup) {
        this.hideCatchResultPopup({
          keepDimmer: needsBagDecision,
          onHidden: () => {
            if (needsBagDecision && this.catchBagDecisionPending) {
              this.openCatchBagDecisionChoice();
              return;
            }
            if (this.state === FishingState.SUCCESS || this.state === FishingState.FAIL) {
              this.resetState();
            }
          },
        });
        return;
      }

      this.renderCatchResultPopup(popup.kind, params);
      const baseDuration = popup.kind === 'catch' ? params.duration : Math.min(params.duration, 1400);
      const popupDuration = baseDuration + additionalDurationMs;
      this.catchResultTimer = this.time.delayedCall(popupDuration, () => showAt(index + 1));
    };

    showAt(0);
  }

  /** リザルトUI調整用: 開始時にサンプルを出しっぱなしにする */
  private debugPinCatchResultPopup() {
    const fish = getFishById('fish_black_bass') ?? fishDatabase.find((f) => !f.id.startsWith('junk_')) ?? fishDatabase[0];
    if (!fish) return;
    const size = Math.round(fish.maxSize * 0.85 * 10) / 10;
    this.renderCatchResultPopup('catch', {
      fish,
      fishSize: size,
      stars: rarityStars[fish.rarity],
      price: fish.price,
      exp: getExpByRarity(fish.rarity),
      sizeRatio: size / fish.maxSize,
      isNewSpecies: true,
      level: this.playerData?.level ?? 1,
    });
  }

  private renderCatchResultPopup(
    kind: 'catch' | 'bag' | 'level',
    params: {
      fish: FishConfig;
      fishSize?: number;
      stars: string;
      price: number;
      exp: number;
      sizeRatio?: number;
      isNewSpecies: boolean;
      level: number;
    }
  ) {
    if (!this.catchResultElement) return;

    const mainLine = this.catchResultElement.querySelector('.catch-result-main-line') as HTMLElement | null;
    const rarityLine = this.catchResultElement.querySelector('.catch-result-rarity-line') as HTMLElement | null;
    const metaRow = this.catchResultElement.querySelector('.catch-result-meta-row') as HTMLElement | null;
    const priceValue = this.catchResultElement.querySelector('.catch-result-price-value') as HTMLElement | null;
    const sizeValue = this.catchResultElement.querySelector('.catch-result-size-value') as HTMLElement | null;
    const fishImage = this.catchResultElement.querySelector('.catch-result-fish-image') as HTMLImageElement | null;
    const fishEmoji = this.catchResultElement.querySelector('.catch-result-fish-emoji') as HTMLElement | null;
    const bigLabel = this.catchResultElement.querySelector('.catch-result-big-label') as HTMLImageElement | null;
    const expChip = this.catchResultElement.querySelector('.catch-result-exp-chip') as HTMLElement | null;
    const expValue = this.catchResultElement.querySelector('.catch-result-exp-value') as HTMLElement | null;

    if (!mainLine || !rarityLine || !metaRow || !priceValue || !sizeValue || !fishImage || !fishEmoji || !bigLabel || !expChip || !expValue) return;
    if (this.catchResultHideTimer) {
      this.catchResultHideTimer.remove(false);
      this.catchResultHideTimer = undefined;
    }

    const fishImagePath = getFishImagePath(params.fish.id);
    fishEmoji.textContent = params.fish.emoji;
    if (fishImagePath) {
      fishImage.style.display = 'block';
      fishImage.src = fishImagePath;
      fishImage.onerror = () => {
        fishImage.style.display = 'none';
        fishEmoji.style.display = 'flex';
      };
      fishImage.onload = () => {
        fishImage.style.display = 'block';
        fishEmoji.style.display = 'none';
      };
    } else {
      fishImage.style.display = 'none';
      fishEmoji.style.display = 'flex';
    }

    priceValue.textContent = params.price.toLocaleString();
    sizeValue.textContent = params.fishSize !== undefined ? params.fishSize.toFixed(1) : '--';
    const showBigLabel = isBigSizeRatio(params.sizeRatio ?? 0);
    const showNewLabel = params.isNewSpecies;
    if (kind === 'catch' && (showNewLabel || showBigLabel)) {
      if (showNewLabel) {
        bigLabel.src = '/images/Fishing Result UI/New-label.svg';
        bigLabel.alt = 'New';
      } else {
        bigLabel.src = '/images/Fishing Result UI/Big-label.svg';
        bigLabel.alt = 'Big';
      }
      bigLabel.style.display = 'block';
    } else {
      bigLabel.style.display = 'none';
    }

    this.catchResultElement.classList.toggle('catch-result-popup--notice', kind !== 'catch');
    this.catchResultElement.classList.toggle(
      'catch-result-popup--junk',
      kind === 'catch' && params.fish.id.startsWith('junk_'),
    );
    expValue.textContent = `+${params.exp.toLocaleString()}`;
    expChip.style.display = kind === 'catch' ? 'inline-flex' : 'none';

    if (kind === 'catch') {
      mainLine.textContent = `${params.fish.name}を\n釣り上げた！`;
      rarityLine.textContent = params.stars;
      rarityLine.style.color = this.getRarityColorCssValue(params.fish.rarity);
      metaRow.style.display = 'flex';
    } else if (kind === 'bag') {
      mainLine.textContent = 'バッグ満杯！';
      rarityLine.textContent = `自動売却 +${params.price.toLocaleString()} G`;
      rarityLine.style.color = '';
      metaRow.style.display = 'none';
    } else {
      mainLine.textContent = 'レベルアップ！';
      rarityLine.textContent = `Lv.${params.level} になった`;
      rarityLine.style.color = '';
      metaRow.style.display = 'none';
    }

    this.catchResultElement.classList.remove('is-visible');
    this.catchResultElement.classList.add('is-entering');
    this.catchResultElement.style.display = 'flex';
    this.showCatchResultDimmer();
    void this.catchResultElement.offsetWidth;
    this.catchResultElement.classList.remove('is-entering');
    this.catchResultElement.classList.add('is-visible');
  }

  private showCatchResultDimmer() {
    if (!this.catchResultDimmerElement) return;
    this.catchResultDimmerElement.style.display = 'block';
    // 連続ポップアップ切替で点滅しないよう、未表示時のみフェードイン
    if (!this.catchResultDimmerElement.classList.contains('is-visible')) {
      void this.catchResultDimmerElement.offsetWidth;
      this.catchResultDimmerElement.classList.add('is-visible');
    }
  }

  private hideCatchResultPopup(options?: {
    immediate?: boolean;
    keepDimmer?: boolean;
    onHidden?: () => void;
  }) {
    if (DEBUG_CATCH_RESULT_PINNED) return;
    if (!this.catchResultElement) return;
    if (this.catchResultTimer) {
      this.catchResultTimer.remove(false);
      this.catchResultTimer = undefined;
    }
    if (this.catchResultHideTimer) {
      this.catchResultHideTimer.remove(false);
      this.catchResultHideTimer = undefined;
    }

    const keepDimmer = !!options?.keepDimmer;
    const isAlreadyHidden = this.catchResultElement.style.display === 'none';
    const finalizeHide = () => {
      this.catchResultElement.classList.remove('is-entering');
      this.catchResultElement.classList.remove('is-visible');
      this.catchResultElement.style.display = 'none';
      if (!keepDimmer) {
        this.finalizeCatchResultDimmerHide();
      }
      this.catchResultHideTimer = undefined;
      options?.onHidden?.();
    };

    if (options?.immediate || isAlreadyHidden) {
      finalizeHide();
      return;
    }

    this.catchResultElement.classList.remove('is-visible');
    if (!keepDimmer) {
      this.catchResultDimmerElement?.classList.remove('is-visible');
    }
    this.catchResultHideTimer = this.time.delayedCall(CATCH_RESULT_FADE_MS, finalizeHide);
  }

  private hideCatchResultDimmer(immediate = false) {
    if (!this.catchResultDimmerElement) return;
    if (
      immediate ||
      this.catchResultDimmerElement.style.display === 'none' ||
      !this.catchResultDimmerElement.classList.contains('is-visible')
    ) {
      this.finalizeCatchResultDimmerHide();
      return;
    }
    this.catchResultDimmerElement.classList.remove('is-visible');
    window.setTimeout(() => {
      // その間に再表示されていたら消さない
      if (!this.catchResultDimmerElement?.classList.contains('is-visible')) {
        this.finalizeCatchResultDimmerHide();
      }
    }, CATCH_RESULT_FADE_MS);
  }

  private finalizeCatchResultDimmerHide() {
    if (!this.catchResultDimmerElement) return;
    this.catchResultDimmerElement.classList.remove('is-visible');
    this.catchResultDimmerElement.style.display = 'none';
  }

  private dismissCatchResultPopupByUser(): boolean {
    if (DEBUG_CATCH_RESULT_PINNED) return false;
    if (!this.catchResultElement || this.catchResultElement.style.display === 'none') {
      return false;
    }
    const pendingDecision = !!this.catchBagDecisionPending && this.catchBagDecisionPhase === null;
    this.hideCatchResultPopup({
      keepDimmer: pendingDecision,
      onHidden: () => {
        if (pendingDecision && this.catchBagDecisionPending) {
          this.openCatchBagDecisionChoice();
          return;
        }
        if (this.state === FishingState.SUCCESS || this.state === FishingState.FAIL) {
          this.resetState();
        }
      },
    });
    return true;
  }

  // ============================================
  // バッグ満杯時: 放流／入れかえ
  // ============================================

  private createCatchBagFullUI() {
    const html = `
      <div id="catch-bag-full-ui" aria-hidden="true">
        <div id="catch-bag-decision-layer" class="aquarium-bag-pick-layer" style="display: none;" aria-hidden="true">
          <div class="catch-bag-decision-dialog ui-frame-box" role="dialog" aria-modal="true" aria-labelledby="catch-bag-decision-title">
            <p id="catch-bag-decision-title" class="catch-bag-decision-title">バッグがいっぱいです</p>
            <p class="catch-bag-decision-message">釣った魚をどうしますか？</p>
            <div class="catch-bag-decision-actions modal-choice-actions">
              <button type="button" id="catch-bag-decision-release" class="nes-btn ui-frame-box">放流する</button>
              <button type="button" id="catch-bag-decision-swap" class="nes-btn ui-frame-box">入れかえる</button>
            </div>
          </div>
        </div>
        <div id="catch-bag-pick-layer" class="aquarium-bag-pick-layer" style="display: none;" aria-hidden="true">
          <div class="aquarium-bag-pick-dialog ui-frame-box" role="dialog" aria-modal="true" aria-labelledby="catch-bag-pick-title">
            <div class="aquarium-bag-pick-header">
              <p id="catch-bag-pick-title" class="aquarium-bag-pick-title">入れかえる魚を選ぶ</p>
            </div>
            <div class="aquarium-bag-pick-grid-wrap">
              <div id="catch-bag-pick-grid" class="aquarium-bag-pick-grid" role="list"></div>
              <div class="book-list-scroll-fade book-list-scroll-fade--top" id="catch-bag-pick-fade-top" aria-hidden="true"></div>
              <div class="book-list-scroll-fade book-list-scroll-fade--bottom" id="catch-bag-pick-fade-bottom" aria-hidden="true"></div>
            </div>
            <p id="catch-bag-pick-empty" class="aquarium-bag-pick-empty" style="display: none;">バッグに魚がいません</p>
            <div class="aquarium-bag-pick-actions modal-choice-actions">
              <button type="button" id="catch-bag-pick-cancel" class="nes-btn ui-frame-box">やめる</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    this.catchBagFullUIElement = temp.firstElementChild as HTMLElement;
    document.body.appendChild(this.catchBagFullUIElement);

    this.catchBagPickGridElement = this.catchBagFullUIElement.querySelector('#catch-bag-pick-grid');
    this.catchBagPickFadeTopElement = this.catchBagFullUIElement.querySelector('#catch-bag-pick-fade-top');
    this.catchBagPickFadeBottomElement = this.catchBagFullUIElement.querySelector('#catch-bag-pick-fade-bottom');

    const decisionLayer = this.catchBagFullUIElement.querySelector('#catch-bag-decision-layer');
    decisionLayer?.addEventListener('click', (e) => {
      if (e.target === decisionLayer) return; // 選択必須のため背景クリックでは閉じない
    });
    decisionLayer?.querySelector('.catch-bag-decision-dialog')?.addEventListener('click', (e) => e.stopPropagation());

    const releaseBtn = this.catchBagFullUIElement.querySelector('#catch-bag-decision-release');
    const swapBtn = this.catchBagFullUIElement.querySelector('#catch-bag-decision-swap');
    releaseBtn?.addEventListener('click', () => {
      this.catchBagDecisionFocus = 'release';
      this.applyCatchBagDecisionChoice();
    });
    swapBtn?.addEventListener('click', () => {
      this.catchBagDecisionFocus = 'swap';
      this.applyCatchBagDecisionChoice();
    });
    releaseBtn?.addEventListener('focus', () => {
      this.catchBagDecisionFocus = 'release';
      this.syncCatchBagDecisionSelection();
    });
    swapBtn?.addEventListener('focus', () => {
      this.catchBagDecisionFocus = 'swap';
      this.syncCatchBagDecisionSelection();
    });

    const pickLayer = this.catchBagFullUIElement.querySelector('#catch-bag-pick-layer');
    pickLayer?.addEventListener('click', (e) => {
      if (e.target === pickLayer) this.closeCatchBagPickToChoice();
    });
    pickLayer?.querySelector('.aquarium-bag-pick-dialog')?.addEventListener('click', (e) => e.stopPropagation());
    const pickCancel = this.catchBagFullUIElement.querySelector('#catch-bag-pick-cancel');
    pickCancel?.addEventListener('click', () => this.closeCatchBagPickToChoice());
    pickCancel?.addEventListener('focus', () => {
      this.catchBagPickFocus = 'cancel';
      this.syncCatchBagPickSelection();
    });

    this.setupCatchBagPickScrollFade();
  }

  private openCatchBagDecisionChoice() {
    if (!this.catchBagFullUIElement || !this.catchBagDecisionPending) return;
    this.catchBagDecisionPhase = 'choice';
    this.catchBagDecisionFocus = 'swap';
    this.catchBagFullUIElement.setAttribute('aria-hidden', 'false');
    this.showCatchResultDimmer();

    const decisionLayer = this.catchBagFullUIElement.querySelector('#catch-bag-decision-layer') as HTMLElement | null;
    const pickLayer = this.catchBagFullUIElement.querySelector('#catch-bag-pick-layer') as HTMLElement | null;
    if (pickLayer) {
      pickLayer.style.display = 'none';
      pickLayer.setAttribute('aria-hidden', 'true');
    }
    if (decisionLayer) {
      decisionLayer.style.display = 'flex';
      decisionLayer.setAttribute('aria-hidden', 'false');
    }
    this.syncCatchBagDecisionSelection();
    this.noteUiMenuKeyboardNavigation();
    this.refreshKbSelectionPointer();
    requestAnimationFrame(() => {
      (this.catchBagFullUIElement?.querySelector('#catch-bag-decision-swap') as HTMLButtonElement | null)?.focus();
    });
  }

  private syncCatchBagDecisionSelection() {
    if (!this.catchBagFullUIElement || this.catchBagDecisionPhase !== 'choice') return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const release = this.catchBagFullUIElement.querySelector('#catch-bag-decision-release');
    const swap = this.catchBagFullUIElement.querySelector('#catch-bag-decision-swap');
    release?.classList.toggle('is-nav-selected', kb && this.catchBagDecisionFocus === 'release');
    swap?.classList.toggle('is-nav-selected', kb && this.catchBagDecisionFocus === 'swap');
    this.refreshKbSelectionPointer();
  }

  /** キー↔マウス切替時に入れかえUIのナビ見た目を同期（マウス時は上昇をリセット） */
  private syncBagPickInputChannelChrome() {
    if (this.aquariumBagPickMode) this.syncAquariumBagPickSelection();
    if (this.catchBagDecisionPhase === 'pick') this.syncCatchBagPickSelection();
    if (this.catchBagDecisionPhase === 'choice') this.syncCatchBagDecisionSelection();
  }

  private handleCatchBagDecisionNavigation() {
    if (this.catchBagDecisionPhase === 'choice') {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.noteUiMenuKeyboardNavigation();
        this.catchBagDecisionFocus = this.catchBagDecisionFocus === 'release' ? 'swap' : 'release';
        this.syncCatchBagDecisionSelection();
        const focusId =
          this.catchBagDecisionFocus === 'release' ? '#catch-bag-decision-release' : '#catch-bag-decision-swap';
        (this.catchBagFullUIElement?.querySelector(focusId) as HTMLButtonElement | null)?.focus();
      }
      return;
    }
    if (this.catchBagDecisionPhase === 'pick') {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.noteUiMenuKeyboardNavigation();
        this.handleCatchBagPickNavigation('left');
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.noteUiMenuKeyboardNavigation();
        this.handleCatchBagPickNavigation('right');
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.noteUiMenuKeyboardNavigation();
        this.handleCatchBagPickNavigation('up');
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.noteUiMenuKeyboardNavigation();
        this.handleCatchBagPickNavigation('down');
      }
    }
  }

  private applyCatchBagDecisionChoice() {
    if (this.catchBagDecisionPhase !== 'choice' || !this.catchBagDecisionPending) return;
    if (this.catchBagDecisionFocus === 'release') {
      this.finishCatchBagDecision('放流した');
      return;
    }
    this.openCatchBagPick();
  }

  private openCatchBagPick() {
    if (!this.catchBagFullUIElement || !this.catchBagDecisionPending) return;
    this.catchBagDecisionPhase = 'pick';
    this.catchBagPickNavIndex = 0;
    this.catchBagPickFocus = 'grid';

    const decisionLayer = this.catchBagFullUIElement.querySelector('#catch-bag-decision-layer') as HTMLElement | null;
    const pickLayer = this.catchBagFullUIElement.querySelector('#catch-bag-pick-layer') as HTMLElement | null;
    if (decisionLayer) {
      decisionLayer.style.display = 'none';
      decisionLayer.setAttribute('aria-hidden', 'true');
    }
    this.renderCatchBagPickModal();
    if (pickLayer) {
      pickLayer.style.display = 'flex';
      pickLayer.setAttribute('aria-hidden', 'false');
    }
    this.syncCatchBagPickSelection();
    this.refreshKbSelectionPointer();
  }

  private closeCatchBagPickToChoice() {
    if (this.catchBagDecisionPhase !== 'pick') return;
    const pickLayer = this.catchBagFullUIElement?.querySelector('#catch-bag-pick-layer') as HTMLElement | null;
    if (pickLayer) {
      pickLayer.style.display = 'none';
      pickLayer.setAttribute('aria-hidden', 'true');
    }
    this.openCatchBagDecisionChoice();
  }

  /** バッグ満杯入れかえ用: 全インベントリ（ゴミ含む・新しい順） */
  private getCatchBagSelectableIndices(): number[] {
    const indices: number[] = [];
    const inv = this.playerData.inventory;
    for (let i = inv.length - 1; i >= 0; i--) {
      const entry = inv[i];
      if (!entry || !getFishById(entry.fishId)) continue;
      indices.push(i);
    }
    return indices;
  }

  private renderCatchBagPickModal() {
    if (!this.catchBagFullUIElement || this.catchBagDecisionPhase !== 'pick') return;
    const grid = this.catchBagFullUIElement.querySelector('#catch-bag-pick-grid') as HTMLElement | null;
    const empty = this.catchBagFullUIElement.querySelector('#catch-bag-pick-empty') as HTMLElement | null;
    if (!grid) return;

    grid.innerHTML = '';
    const indices = this.getCatchBagSelectableIndices();
    if (empty) empty.style.display = indices.length === 0 ? 'block' : 'none';
    grid.style.display = indices.length === 0 ? 'none' : 'grid';

    indices.forEach((invIndex, displayIndex) => {
      const entry = this.playerData.inventory[invIndex];
      const fish = getFishById(entry.fishId);
      if (!fish) return;
      const row = this.createUnifiedBookListItem(fish, displayIndex, true, entry, {
        rowClassName: 'aquarium-bag-pick-card',
        showSizePriceUnderName: true,
        onClick: () => {
          this.catchBagPickNavIndex = displayIndex;
          this.catchBagPickFocus = 'grid';
          this.applyCatchBagPick(invIndex);
        },
      });
      row.setAttribute('role', 'listitem');
      row.setAttribute('data-inv-index', String(invIndex));
      row.setAttribute('data-pick-index', String(displayIndex));
      grid.appendChild(row);
    });

    if (this.catchBagPickNavIndex >= indices.length) {
      this.catchBagPickNavIndex = Math.max(0, indices.length - 1);
    }
    if (indices.length === 0) {
      this.catchBagPickFocus = 'cancel';
    }
    requestAnimationFrame(() => this.updateCatchBagPickScrollFade());
  }

  private getCatchBagPickCards(): HTMLElement[] {
    const grid = this.catchBagFullUIElement?.querySelector('#catch-bag-pick-grid');
    if (!grid) return [];
    return Array.from(grid.querySelectorAll('.aquarium-bag-pick-card')) as HTMLElement[];
  }

  private syncCatchBagPickSelection() {
    if (!this.catchBagFullUIElement || this.catchBagDecisionPhase !== 'pick') return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const cards = this.getCatchBagPickCards();
    cards.forEach((card, i) => {
      const on = kb && this.catchBagPickFocus === 'grid' && i === this.catchBagPickNavIndex;
      card.classList.toggle('is-nav-selected', on);
      card.querySelector('.book-ui-node')?.classList.toggle('is-nav-selected', on);
      if (on) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    const cancel = this.catchBagFullUIElement.querySelector('#catch-bag-pick-cancel');
    cancel?.classList.toggle('is-nav-selected', kb && this.catchBagPickFocus === 'cancel');
    this.refreshKbSelectionPointer();
    requestAnimationFrame(() => this.updateCatchBagPickScrollFade());
  }

  private handleCatchBagPickNavigation(dir: 'up' | 'down' | 'left' | 'right') {
    if (this.catchBagDecisionPhase !== 'pick') return;
    const cards = this.getCatchBagPickCards();
    const cols = 3;

    if (this.catchBagPickFocus === 'cancel') {
      if (dir === 'up' || dir === 'left') {
        this.catchBagPickFocus = 'grid';
        if (cards.length > 0) {
          this.catchBagPickNavIndex = Math.min(this.catchBagPickNavIndex, cards.length - 1);
        }
        this.syncCatchBagPickSelection();
      }
      return;
    }

    if (cards.length === 0) {
      this.catchBagPickFocus = 'cancel';
      this.syncCatchBagPickSelection();
      return;
    }

    const idx = Math.max(0, Math.min(this.catchBagPickNavIndex, cards.length - 1));
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const lastRow = Math.floor((cards.length - 1) / cols);

    if (dir === 'left') {
      if (col > 0) this.catchBagPickNavIndex = idx - 1;
      else this.catchBagPickNavIndex = Math.min(idx + (cols - 1), cards.length - 1);
    } else if (dir === 'right') {
      if (col < cols - 1 && idx + 1 < cards.length) this.catchBagPickNavIndex = idx + 1;
      else this.catchBagPickNavIndex = row * cols;
    } else if (dir === 'up') {
      if (row > 0) this.catchBagPickNavIndex = idx - cols;
    } else if (dir === 'down') {
      if (row < lastRow && idx + cols < cards.length) {
        this.catchBagPickNavIndex = idx + cols;
      } else {
        this.catchBagPickFocus = 'cancel';
      }
    }
    this.syncCatchBagPickSelection();
  }

  private triggerCatchBagPickKeyboardAction() {
    if (this.catchBagDecisionPhase !== 'pick') return;
    if (this.catchBagPickFocus === 'cancel') {
      this.closeCatchBagPickToChoice();
      return;
    }
    const cards = this.getCatchBagPickCards();
    const card = cards[this.catchBagPickNavIndex];
    const invAttr = card?.getAttribute('data-inv-index');
    if (invAttr == null) return;
    const invIndex = Number(invAttr);
    if (!Number.isFinite(invIndex)) return;
    this.applyCatchBagPick(invIndex);
  }

  private applyCatchBagPick(inventoryIndex: number) {
    const pending = this.catchBagDecisionPending;
    if (!pending || this.catchBagDecisionPhase !== 'pick') return;
    const ok = swapCaughtFishIntoInventory(
      this.playerData,
      inventoryIndex,
      pending.fish,
      pending.fishSize,
    );
    if (!ok) {
      this.showResult('入れかえに失敗しました', 1200, { resetFishingStateOnEnd: false });
      return;
    }
    savePlayerData(this.playerData);
    this.updateStatusUI();
    if (this.unifiedBookOpen) {
      this.updateUnifiedBookList();
    }
    this.finishCatchBagDecision('入れかえた！');
  }

  private finishCatchBagDecision(message: string) {
    const pending = this.catchBagDecisionPending;
    if (!pending) {
      this.closeCatchBagDecisionUI();
      this.showResult(message, 1200);
      return;
    }
    const leveledUp = pending.leveledUp;
    const level = pending.level;
    const duration = pending.duration;
    const levelParams = {
      fish: pending.fish,
      fishSize: pending.fishSize,
      stars: pending.stars,
      price: pending.price,
      exp: pending.exp,
      sizeRatio: pending.sizeRatio,
      isNewSpecies: pending.isNewSpecies,
      level,
    };

    this.closeCatchBagDecisionUI({ keepDimmer: leveledUp });

    if (leveledUp) {
      this.showResult(message, 1000, { resetFishingStateOnEnd: false });
      this.time.delayedCall(1000, () => {
        if (!this.catchResultElement) {
          this.hideCatchResultDimmer();
          this.resetState();
          return;
        }
        this.renderCatchResultPopup('level', levelParams);
        this.catchResultTimer = this.time.delayedCall(Math.min(duration, 1400) + 1000, () => {
          this.hideCatchResultPopup({
            onHidden: () => {
              if (this.state === FishingState.SUCCESS || this.state === FishingState.FAIL) {
                this.resetState();
              }
            },
          });
        });
      });
      return;
    }

    this.showResult(message, 1200);
  }

  private closeCatchBagDecisionUI(options?: { keepDimmer?: boolean }) {
    this.catchBagDecisionPending = null;
    this.catchBagDecisionPhase = null;
    this.catchBagDecisionFocus = 'swap';
    this.catchBagPickNavIndex = 0;
    this.catchBagPickFocus = 'grid';
    if (!options?.keepDimmer) {
      this.hideCatchResultDimmer();
    }
    if (!this.catchBagFullUIElement) return;
    this.catchBagFullUIElement.setAttribute('aria-hidden', 'true');
    const decisionLayer = this.catchBagFullUIElement.querySelector('#catch-bag-decision-layer') as HTMLElement | null;
    const pickLayer = this.catchBagFullUIElement.querySelector('#catch-bag-pick-layer') as HTMLElement | null;
    if (decisionLayer) {
      decisionLayer.style.display = 'none';
      decisionLayer.setAttribute('aria-hidden', 'true');
    }
    if (pickLayer) {
      pickLayer.style.display = 'none';
      pickLayer.setAttribute('aria-hidden', 'true');
    }
    this.refreshKbSelectionPointer();
  }

  private setupCatchBagPickScrollFade() {
    const el = this.catchBagPickGridElement;
    if (!el || !this.catchBagPickFadeTopElement || !this.catchBagPickFadeBottomElement) return;
    const update = () => {
      this.updateCatchBagPickScrollFade();
      this.refreshKbSelectionPointer();
    };
    el.addEventListener('scroll', update, { passive: true });
    this.catchBagPickScrollFadeObserver = new ResizeObserver(update);
    this.catchBagPickScrollFadeObserver.observe(el);
    const wrap = el.parentElement;
    if (wrap) this.catchBagPickScrollFadeObserver.observe(wrap);
    requestAnimationFrame(update);
  }

  private updateCatchBagPickScrollFade() {
    // 先頭行抑制はキー選択時のみ（マウスでは navIndex が先頭のまま残り上グラデが出ない）
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const selectedIndex =
      kb && this.catchBagPickFocus === 'grid' ? this.catchBagPickNavIndex : -1;
    this.updateScrollFadeIndicators(
      this.catchBagPickGridElement,
      this.catchBagPickFadeTopElement,
      this.catchBagPickFadeBottomElement,
      selectedIndex >= 0
        ? {
            selectedIndex,
            itemCount: this.getCatchBagPickCards().length,
            columns: 3,
          }
        : undefined,
    );
  }

  resetState() {
    this.state = FishingState.IDLE;
    this.followCameraToPlayer();
    this.cleanupFishingTools();
    if (this.resultTextElement) {
      this.resultTextElement.style.display = 'none';
    }
    if (this.resultTextTimer) {
      this.resultTextTimer.remove(false);
      this.resultTextTimer = undefined;
    }
    this.closeCatchBagDecisionUI();
    this.hideCatchResultPopup();
    this.hideAndResetFightOverlay();
    this.hidePlayerHint();
  }

  // ============================================
  // インベントリUI
  // ============================================

  createInventoryUI() {
    // HTML/CSSでインベントリUIを作成
    const maxSlots = 18;  // 最大18スロット

    // スロットHTMLを生成
    let slotsHTML = '';
    for (let i = 0; i < maxSlots; i++) {
      slotsHTML += `
        <div class="inventory-slot" data-index="${i}">
          <div class="slot-bg ui-frame-box"></div>
          <canvas class="slot-image" width="70" height="70" style="display: none;"></canvas>
          <div class="slot-emoji"></div>
          <div class="slot-name ui-frame-box"></div>
          <div class="slot-price ui-frame-box"></div>
        </div>
      `;
    }

    const inventoryHTML = `
      <div id="inventory-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content inventory-modal nes-container with-rounded ui-frame-box">
          <div class="modal-header">
            <h2>🎒 インベントリ</h2>
          </div>
          <div id="inventory-slots-grid" class="inventory-grid">
            ${slotsHTML}
          </div>
          <div class="modal-footer">
            <div class="hint-text">矢印: 選択 | Enter: 詳細 | I/ESC: 閉じる</div>
          </div>
        </div>
      </div>
    `;

    // DOM要素を追加
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = inventoryHTML;
    this.inventoryUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.inventoryUIElement);

    // スロット要素を取得
    this.inventorySlots = Array.from(this.inventoryUIElement.querySelectorAll('.inventory-slot')) as HTMLElement[];

    // スロットの子要素をキャッシュ
    this.inventorySlotElements = this.inventorySlots.map(slot => ({
      slot,
      bg: slot.querySelector('.slot-bg') as HTMLElement,
      image: slot.querySelector('.slot-image') as HTMLCanvasElement,
      emoji: slot.querySelector('.slot-emoji') as HTMLElement,
      name: slot.querySelector('.slot-name') as HTMLElement,
      price: slot.querySelector('.slot-price') as HTMLElement,
    }));

    // スロットにイベントリスナーを追加
    this.inventorySlots.forEach((slot, index) => {
      slot.addEventListener('click', () => {
        this.selectedSlotIndex = index;
        this.updateInventorySelection();
        this.openDetailModal();
      });
      slot.addEventListener('mouseenter', () => {
        this.selectedSlotIndex = index;
        this.updateInventorySelection();
      });
    });

    this.updateInventoryLayout();
    this.updateInventorySelection();
  }

  updateInventoryLayout() {
    if (!this.inventoryUIElement) return;
    
    // スロットの表示/非表示を更新
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (i < this.playerData.maxInventorySlots) {
        slot.style.display = 'block';
      } else {
        slot.style.display = 'none';
      }
    }
  }

  createDetailModal() {
    // HTML/CSSで詳細モーダルを作成（Figmaデザインに基づく）
    const detailHTML = `
      <div id="detail-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content detail-modal nes-container with-rounded ui-frame-box">
          <button class="modal-close nes-btn ui-frame-box" onclick="window.gameScene?.closeDetailModal()">✕</button>
          <div class="detail-content">
            <!-- ヘッダー: 魚名 + レアリティバッジ -->
            <div class="detail-header">
              <div id="detail-name" class="detail-name"></div>
              <div class="detail-rarity-badge ui-frame-box">
                <div id="detail-rarity-stars" class="detail-rarity-stars"></div>
                <div class="detail-rarity-label">
                  <span class="rarity-label-text">Rarity</span>
                  <div class="rarity-label-decoration"></div>
                </div>
              </div>
            </div>
            
            <!-- 魚のイラスト -->
            <div class="detail-image-container">
              <canvas id="detail-fish-image" class="detail-image" width="148" height="165" style="display: none;"></canvas>
              <div id="detail-emoji" class="detail-emoji" style="display: none;"></div>
            </div>
            
            <!-- 統計情報: 売値とサイズ -->
            <div class="detail-stats">
              <div class="detail-stat-item ui-frame-box" data-name="売値">
                <span class="detail-stat-label">$</span>
                <span id="detail-price" class="detail-stat-value"></span>
              </div>
              <div class="detail-stat-item ui-frame-box" data-name="サイズ">
                <span class="detail-stat-label">S</span>
                <span id="detail-size" class="detail-stat-value"></span>
              </div>
            </div>
            
            <!-- 生息地と捕獲数 -->
            <div class="detail-habitat-row">
              <div id="detail-habitat" class="detail-habitat ui-frame-box"></div>
              <div class="detail-catch-count ui-frame-box">
                <span>捕獲数：</span>
                <span id="detail-catch-count-value"></span>
                <span>匹</span>
              </div>
            </div>
            
            <!-- Noteセクション -->
            <div class="detail-note ui-frame-box">
              <div class="detail-note-header">
                <span class="detail-note-title">Note</span>
              </div>
              <div id="detail-desc" class="detail-note-content"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = detailHTML;
    this.detailModalElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.detailModalElement);

    // 閉じるボタンのイベント
    const closeBtn = this.detailModalElement.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDetailModal());
    }

    // グローバルに参照を保存（HTMLから呼び出せるように）
    (window as any).gameScene = this;
  }

  toggleInventory() {
    // 統合BookUIを使用
    this.toggleUnifiedBook('inventory');
  }

  openInventory() {
    // 統合BookUIを使用（既存コードとの互換性のため残す）
    this.openUnifiedBook('inventory');
  }

  closeInventory() {
    this.inventoryOpen = false;
    if (this.inventoryUIElement) {
      this.closeModal(this.MODAL_IDS.INVENTORY);
    }
    if (this.detailModalOpen) {
        this.closeDetailModal();
    }
  }

  updateInventorySlots() {
    if (!this.inventoryUIElement) return;
    
    const flatInventory = getInventoryDisplayOrder(this.playerData);

    // maxInventorySlotsに基づいてスロットを更新
    for (let i = 0; i < this.playerData.maxInventorySlots; i++) {
        const slotData = this.inventorySlotElements[i];
        if (!slotData) continue;
        
        const { bg: slotBg, image: slotImage, emoji: slotEmoji, name: slotName, price: slotPrice } = slotData;

        if (i < flatInventory.length) {
            const entry = flatInventory[i];
            const { fishId, size } = entry;
            const fish = getFishById(fishId);
            if (fish) {
                // 画像があるかチェック
                const hasTexture = this.textures.exists(fishId);
                if (hasTexture) {
                    // Canvasに画像を描画（画像が変わった時のみ）
                    const ctx = slotImage.getContext('2d');
                    if (ctx) {
                        // データ属性で前回のfishIdをチェック（最適化）
                        const lastFishId = slotImage.getAttribute('data-fish-id');
                        if (lastFishId !== fishId) {
                            ctx.clearRect(0, 0, 70, 70);
                            
                            // キャッシュから取得または作成
                            const cacheKey = `${fishId}_70`;
                            let cached = this.canvasImageCache.get(cacheKey);
                            
                            if (!cached) {
                                const frame = this.textures.getFrame(fishId);
                                const maxSize = 70;
                                const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
                                const width = frame.width * scale;
                                const height = frame.height * scale;
                                
                                // キャッシュ用のCanvas（スロットサイズで白フチ込みの魚を中央に描画）
                                const cacheCanvas = document.createElement('canvas');
                                cacheCanvas.width = 70;
                                cacheCanvas.height = 70;
                                const cacheCtx = cacheCanvas.getContext('2d');
                                
                                if (cacheCtx) {
                                    cacheCtx.clearRect(0, 0, 70, 70);
                                    const sourceImage = frame.source.image as HTMLImageElement;
                                    if (sourceImage) {
                                        this.drawFishImageWithOutline(cacheCtx, sourceImage, frame,
                                            (70 - width) / 2, (70 - height) / 2, width, height, 2, '#ffffff');
                                    }
                                }

                                cached = { canvas: cacheCanvas, width: 70, height: 70 };
                                this.canvasImageCache.set(cacheKey, cached);
                            }

                            // キャッシュから描画
                            ctx.drawImage(cached.canvas, 0, 0);
                            slotImage.setAttribute('data-fish-id', fishId);
                        }
                    }
                    slotImage.style.display = 'block';
                    slotEmoji.style.display = 'none';
                } else {
                    slotImage.style.display = 'none';
                    slotEmoji.textContent = fish.emoji;
                    slotEmoji.style.display = 'block';
                }
                
                slotName.textContent = fish.name;
                // サイズを表示（ゴミの場合は表示しない）
                const sizeText = size !== undefined ? `${size}cm` : '';
                const growthText =
                  (entry.feedCount ?? 0) > 0 ? ` Lv.${getGrowthStage(entry.feedCount!).level}` : '';
                const displayPrice = Math.round(
                  getInventoryEntryBaseSellPrice(fish, entry) * getSellPriceMultiplier(this.playerData),
                );
                slotPrice.textContent = sizeText
                  ? `${sizeText}${growthText} / ${displayPrice}G`
                  : growthText
                    ? `${growthText.trim()} / ${displayPrice}G`
                    : `${displayPrice}G`;
                
                // レア度に応じた背景色
                const colorHex = this.getRarityColorCssValue(fish.rarity);
                slotBg.style.backgroundColor = colorHex;
                slotBg.style.opacity = '0.4';
                slotBg.style.borderColor = colorHex;
            }
        } else {
            slotImage.style.display = 'none';
            slotImage.removeAttribute('data-fish-id'); // クリア
            slotEmoji.textContent = '';
            slotEmoji.style.display = 'none';
            slotName.textContent = '';
            slotPrice.textContent = '';
            slotBg.style.backgroundColor = '#fff';
            slotBg.style.opacity = '1';
            slotBg.style.borderColor = '#212529';
        }
    }
  }

  private lastSelectedInventoryIndex: number = -1;

  updateInventorySelection() {
    if (!this.inventoryUIElement || this.inventorySlots.length === 0) return;
    
    // selectedSlotIndexがmaxInventorySlotsを超えないようにする
    if (this.selectedSlotIndex >= this.playerData.maxInventorySlots) {
      this.selectedSlotIndex = Math.max(0, this.playerData.maxInventorySlots - 1);
    }
    
    // 前回と同じインデックスの場合はスキップ（最適化）
    if (this.selectedSlotIndex === this.lastSelectedInventoryIndex) {
      return;
    }
    
    // 前回選択されていたスロットからクラスを削除
    if (this.lastSelectedInventoryIndex >= 0 && this.inventorySlots[this.lastSelectedInventoryIndex]) {
      this.inventorySlots[this.lastSelectedInventoryIndex].classList.remove('is-selected');
    }
    
    // 選択されたスロットにクラスを追加
    if (this.inventorySlots[this.selectedSlotIndex]) {
      this.inventorySlots[this.selectedSlotIndex].classList.add('is-selected');
    }
    
    this.lastSelectedInventoryIndex = this.selectedSlotIndex;
  }

  openDetailModal() {
    if (!this.detailModalElement) return;
    
    const flatInventory = getInventoryDisplayOrder(this.playerData);

    if (this.selectedSlotIndex >= flatInventory.length) return;

    const { fishId, size, feedCount } = flatInventory[this.selectedSlotIndex];
    const fish = getFishById(fishId);
    if (!fish) return;

    this.detailModalOpen = true;

    // モーダルの内容を更新（Figmaデザインに基づく）
    const fishImage = this.detailModalElement.querySelector('#detail-fish-image') as HTMLCanvasElement;
    const emoji = this.detailModalElement.querySelector('#detail-emoji') as HTMLElement;
    const nameText = this.detailModalElement.querySelector('#detail-name') as HTMLElement;
    const rarityStarsElement = this.detailModalElement.querySelector('#detail-rarity-stars') as HTMLElement;
    const descText = this.detailModalElement.querySelector('#detail-desc') as HTMLElement;
    const priceText = this.detailModalElement.querySelector('#detail-price') as HTMLElement;
    const sizeText = this.detailModalElement.querySelector('#detail-size') as HTMLElement;
    const habitatText = this.detailModalElement.querySelector('#detail-habitat') as HTMLElement;
    const catchCountText = this.detailModalElement.querySelector('#detail-catch-count-value') as HTMLElement;

    // 画像があれば画像、なければ絵文字
    if (this.textures.exists(fish.id)) {
        const ctx = fishImage.getContext('2d');
        if (ctx) {
            const frame = this.textures.getFrame(fish.id);
            const maxWidth = 148;
            const maxHeight = 165;
            const scale = Math.min(maxWidth / frame.width, maxHeight / frame.height);
            const width = frame.width * scale;
            const height = frame.height * scale;
            
            ctx.clearRect(0, 0, 148, 165);
            const sourceImage = frame.source.image as HTMLImageElement;
            if (sourceImage) {
                this.drawFishImageWithOutline(ctx, sourceImage, frame,
                    (148 - width) / 2, (165 - height) / 2, width, height, 3, '#ffffff');
            }
        }
        fishImage.style.display = 'block';
        emoji.style.display = 'none';
    } else {
        fishImage.style.display = 'none';
        emoji.textContent = fish.emoji;
        emoji.style.display = 'block';
    }
    
    // 魚名
    nameText.textContent = fish.name;
    
    // レアリティスター表示
    const starCount = rarityStarCount[fish.rarity];
    const colorHex = this.getRarityColorCssValue(fish.rarity);
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
      if (i < starCount) {
        starsHTML += `<span style="color: ${colorHex}">★</span>`;
      } else {
        starsHTML += `<span style="color: #bababa">★</span>`;
      }
    }
    rarityStarsElement.innerHTML = starsHTML;
    
    // 説明文
    descText.innerHTML = fish.description.replace(/\n/g, '<br>');
    
    // サイズを表示（ゴミの場合は表示しない）
    const isJunk = fish.id.startsWith('junk_');
    if (!isJunk && size !== undefined) {
      sizeText.textContent = `${size.toFixed(1)}cm`;
    } else {
      sizeText.textContent = '-';
    }
    
    // サイズを考慮した価格を計算
    const displayPrice = Math.round(
      getInventoryEntryBaseSellPrice(fish, { fishId, size, feedCount }) *
        getSellPriceMultiplier(this.playerData),
    );
    priceText.textContent = `${Math.floor(displayPrice)}G`;
    
      // 生息地
      const habitatTextMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '淡水',
        [Habitat.SALTWATER]: '海水',
        [Habitat.STREAM]: '渓流'
      };
      const habitatColorMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '#383680',
        [Habitat.SALTWATER]: '#19648B',
        [Habitat.STREAM]: '#327F75'
      };
      habitatText.textContent = habitatTextMap[fish.habitat] || '不明';
      habitatText.style.backgroundColor = habitatColorMap[fish.habitat] || '#327F75';
    
    // 捕獲数（インベントリ内のこの魚の数）
    const catchCount = this.playerData.inventory.filter((e) => e.fishId === fish.id).length;
    catchCountText.textContent = catchCount.toString();

    this.openModal(this.MODAL_IDS.DETAIL);
    // モーダル位置を更新
    this.updateModalPositionsIfNeeded();
  }

  closeDetailModal() {
    this.detailModalOpen = false;
    if (this.detailModalElement) {
      this.closeModal(this.MODAL_IDS.DETAIL);
    }
  }

  handleInventoryNavigation() {
    if (!this.inventoryOpen || this.detailModalOpen) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.down)
    ) {
      this.noteUiMenuKeyboardNavigation();
    }

    const gridSize = 3;
    const maxRows = Math.ceil(this.playerData.maxInventorySlots / gridSize);
    let newIndex = this.selectedSlotIndex;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        if (this.selectedSlotIndex % gridSize > 0) newIndex--;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        if (this.selectedSlotIndex % gridSize < gridSize - 1 && newIndex + 1 < this.playerData.maxInventorySlots) newIndex++;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        if (this.selectedSlotIndex >= gridSize) newIndex -= gridSize;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        const currentRow = Math.floor(this.selectedSlotIndex / gridSize);
        if (currentRow < maxRows - 1 && newIndex + gridSize < this.playerData.maxInventorySlots) {
          newIndex += gridSize;
        }
    }

    // maxInventorySlotsを超えないようにする
    if (newIndex >= this.playerData.maxInventorySlots) {
      newIndex = this.playerData.maxInventorySlots - 1;
    }

    if (newIndex !== this.selectedSlotIndex && newIndex >= 0) {
        this.selectedSlotIndex = newIndex;
        this.updateInventorySelection();
    }
  }

  // ============================================
  // 図鑑UI
  // ============================================

  createBookUI() {
    // HTML/CSSで図鑑UIを作成
    const slotsPerPage = 12;  // 4列×3行
    let slotsHTML = '';
    for (let i = 0; i < slotsPerPage; i++) {
      slotsHTML += `
        <div class="book-slot" data-index="${i}">
          <div class="slot-bg ui-frame-box"></div>
          <canvas class="slot-image" width="70" height="70" style="display: none;"></canvas>
          <div class="slot-emoji"></div>
          <div class="slot-name ui-frame-box"></div>
          <div class="slot-rarity"></div>
        </div>
      `;
    }

    const bookHTML = `
      <div id="book-modal" class="modal" style="display: none;">
        <div class="modal-content book-modal nes-container with-rounded ui-frame-box">
          <div class="modal-header">
            <h2>📖 魚図鑑</h2>
            <div id="book-progress" class="book-progress ui-frame-box"></div>
          </div>
          <div id="book-slots-grid" class="book-grid">
            ${slotsHTML}
          </div>
          <div class="modal-footer">
            <div id="book-page-text" class="book-page-text"></div>
            <div class="hint-text">Q/W: ページ | 矢印: 選択 | Enter: 詳細 | B/ESC: 閉じる</div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bookHTML;
    this.bookUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.bookUIElement);

    // スロット要素を取得
    this.bookSlots = Array.from(this.bookUIElement.querySelectorAll('.book-slot')) as HTMLElement[];

    // スロットの子要素をキャッシュ
    this.bookSlotElements = this.bookSlots.map(slot => ({
      slot,
      bg: slot.querySelector('.slot-bg') as HTMLElement,
      image: slot.querySelector('.slot-image') as HTMLCanvasElement,
      emoji: slot.querySelector('.slot-emoji') as HTMLElement,
      name: slot.querySelector('.slot-name') as HTMLElement,
      rarity: slot.querySelector('.slot-rarity') as HTMLElement,
    }));

    // 図鑑の進捗表示要素をキャッシュ
    this.bookProgressElement = this.bookUIElement.querySelector('#book-progress') as HTMLElement;
    this.bookPageTextElement = this.bookUIElement.querySelector('#book-page-text') as HTMLElement;

    // スロットにイベントリスナーを追加
    this.bookSlots.forEach((slot, index) => {
      slot.addEventListener('click', () => {
        this.bookSelectedIndex = index;
        this.updateBookSelection();
        this.openBookDetail();
      });
      slot.addEventListener('mouseenter', () => {
        this.bookSelectedIndex = index;
        this.updateBookSelection();
      });
    });

    // 図鑑詳細モーダル
    this.createBookDetailModal();
    this.updateBookSelection();
  }

  // ============================================
  // 統合BookUI（2ペイン）
  // ============================================

  createUnifiedBookUI() {
    const bookHTML = `
      <div id="book-ui" class="book-ui">
        <div class="book-header">
          <div class="book-tabs">
            <button class="book-tab-button active ui-frame-box" data-tab="inventory" aria-label="Bag">
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_bag.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Bag</span>
              </span>
            </button>
            <button class="book-tab-button ui-frame-box" data-tab="aquarium" aria-label="Aquarium" hidden>
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_aquarium.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Aquarium</span>
              </span>
            </button>
            <button class="book-tab-button ui-frame-box" data-tab="status" aria-label="Status">
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_status.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Status</span>
              </span>
            </button>
            <button class="book-tab-button ui-frame-box" data-tab="skills" aria-label="Skills">
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_skill.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Skills</span>
              </span>
            </button>
            <button class="book-tab-button ui-frame-box" data-tab="quest" aria-label="Quests">
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_quest.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Quests</span>
              </span>
            </button>
            <button class="book-tab-button ui-frame-box" data-tab="achievement" aria-label="Achieve">
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_achievement.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Achieve</span>
              </span>
            </button>
            <button class="book-tab-button ui-frame-box" data-tab="pedia" aria-label="Pedia">
              <span class="book-tab-button-inner">
                <img class="book-tab-icon" src="/images/ui/icon/icon_encyclopedia.png" alt="" aria-hidden="true" />
                <span class="book-tab-label">Pedia</span>
              </span>
            </button>
          </div>
        </div>
        <div class="book-container ui-frame-box">
            <div class="book-main-row">
            <div class="book-left-pane">
              <div class="book-left-pane-list-column">
                <div id="book-pedia-sort-bar" class="book-pedia-sort-bar" role="tablist" aria-label="Encyclopedia sort">
                  <button type="button" id="book-pedia-sort-rarity" class="book-pedia-sort-btn ui-frame-box is-active" data-pedia-sort="rarity" role="tab" aria-selected="true">Rarity</button>
                  <button type="button" id="book-pedia-sort-waters" class="book-pedia-sort-btn ui-frame-box" data-pedia-sort="waters" role="tab" aria-selected="false">Waters</button>
                </div>
                <div class="book-list-scroll-wrap">
                  <div class="book-list-scroll" id="book-list-scroll"></div>
                  <div class="book-list-scroll-fade book-list-scroll-fade--top" id="book-list-scroll-fade-top" aria-hidden="true"></div>
                  <div class="book-list-scroll-fade book-list-scroll-fade--bottom" id="book-list-scroll-fade-bottom" aria-hidden="true"></div>
                </div>
              </div>
            </div>
            <div class="book-right-pane">
              <div class="book-right-pane-scroll-wrap">
                <div class="book-right-pane-scroll" id="book-right-pane-scroll">
                  <div class="book-right-pane-inner">
                <div id="book-status-panel" class="book-status-panel" style="display: none;">
                  <div class="book-status-hero">
                    <div class="book-status-hero-main">
                      <div class="book-status-name-row">
                        <div class="book-status-character-icon" aria-hidden="true">
                          <div class="book-status-character-icon__inner">
                            <canvas id="book-status-character-icon-canvas" width="56" height="56" class="book-status-character-icon__canvas"></canvas>
                          </div>
                        </div>
                        <div id="book-status-player-name" class="book-status-name"></div>
                      </div>
                      <div class="book-status-meta-row">
                        <div class="book-status-level-row">
                          <span class="book-status-label">Lv.</span><span id="book-status-level" class="book-status-level-num"></span>
                        </div>
                        <div class="book-status-exp-bar-wrap">
                          <div class="book-status-exp-bar"><div id="book-status-exp-fill" class="book-status-exp-fill"></div></div>
                          <span id="book-status-exp-summary" class="book-status-exp-summary"></span>
                        </div>
                      </div>
                    </div>
                    <div class="book-status-hero-equipment">
                      <div class="book-status-equipment-item">
                        <div class="book-status-equipment-info">
                          <div id="book-status-equipped-rod-icon" class="book-status-equipment-icon" aria-hidden="true"></div>
                          <p id="book-status-equipped-rod-name" class="book-status-equipment-name">-</p>
                        </div>
                        <button type="button" id="book-status-change-rod" class="book-status-change-btn ui-frame-box">変更する</button>
                      </div>
                      <div class="book-status-equipment-item">
                        <div class="book-status-equipment-info">
                          <div id="book-status-equipped-lure-icon" class="book-status-equipment-icon" aria-hidden="true"></div>
                          <p id="book-status-equipped-lure-name" class="book-status-equipment-name">-</p>
                        </div>
                        <button type="button" id="book-status-change-lure" class="book-status-change-btn ui-frame-box">変更する</button>
                      </div>
                    </div>
                  </div>
                  <section class="book-status-section">
                    <h3 class="book-status-section-title">現在の能力値</h3>
                    <p class="book-status-hint">いまの装備とスキルを反映した実戦性能を、基準100の整数で示しています（100が標準）。</p>
                    <div class="book-status-two-col">
                      <ul class="book-status-stat-list">
                        <li class="ui-frame-box" data-stat-key="power" role="button" tabindex="0" aria-selected="true"><div class="book-stat-name"><span class="book-stat-name-label">パワー</span><span class="book-stat-name-delta-icon" aria-hidden="true"></span></div><span class="book-stat-val-wrap"><span class="book-status-stat-arrow-wrap"><span class="book-status-stat-delta" aria-live="polite"></span></span><span id="book-status-power" class="book-stat-val">0</span><span id="book-status-power-current" class="book-stat-val book-stat-val-current">0</span></span></li>
                        <li class="ui-frame-box" data-stat-key="speed" role="button" tabindex="0" aria-selected="false"><div class="book-stat-name"><span class="book-stat-name-label">スピード</span><span class="book-stat-name-delta-icon" aria-hidden="true"></span></div><span class="book-stat-val-wrap"><span class="book-status-stat-arrow-wrap"><span class="book-status-stat-delta" aria-live="polite"></span></span><span id="book-status-speed" class="book-stat-val">0</span><span id="book-status-speed-current" class="book-stat-val book-stat-val-current">0</span></span></li>
                        <li class="ui-frame-box" data-stat-key="technique" role="button" tabindex="0" aria-selected="false"><div class="book-stat-name"><span class="book-stat-name-label">テクニック</span><span class="book-stat-name-delta-icon" aria-hidden="true"></span></div><span class="book-stat-val-wrap"><span class="book-status-stat-arrow-wrap"><span class="book-status-stat-delta" aria-live="polite"></span></span><span id="book-status-technique" class="book-stat-val">0</span><span id="book-status-technique-current" class="book-stat-val book-stat-val-current">0</span></span></li>
                        <li class="ui-frame-box" data-stat-key="control" role="button" tabindex="0" aria-selected="false"><div class="book-stat-name"><span class="book-stat-name-label">コントロール</span><span class="book-stat-name-delta-icon" aria-hidden="true"></span></div><span class="book-stat-val-wrap"><span class="book-status-stat-arrow-wrap"><span class="book-status-stat-delta" aria-live="polite"></span></span><span id="book-status-control" class="book-stat-val">0</span><span id="book-status-control-current" class="book-stat-val book-stat-val-current">0</span></span></li>
                      </ul>
                      <div class="book-status-detail-note">
                        <p id="book-status-detail-title" class="book-status-detail-note-title">Info</p>
                        <div id="book-status-detail-text" class="book-status-detail-note-text"></div>
                        <div class="book-status-detail-fade book-status-detail-fade--top" id="book-status-detail-fade-top" aria-hidden="true"></div>
                        <div class="book-status-detail-fade book-status-detail-fade--bottom" id="book-status-detail-fade-bottom" aria-hidden="true"></div>
                      </div>
                    </div>
                    <div class="book-status-detail-note book-status-rarity-prob book-status-rarity-prob-note">
                      <p class="book-status-detail-note-title book-status-rarity-prob-title">Catch Rates</p>
                      <div class="book-status-rarity-prob-grid">
                        <div class="book-status-rarity-prob-item" data-rarity="common">
                          <span class="book-status-rarity-prob-label-wrap"><span class="book-status-rarity-prob-label">COMMON</span><span class="book-status-rarity-prob-arrow-wrap"><span id="book-status-rarity-common-delta" class="book-status-rarity-prob-delta" aria-live="polite"></span></span></span>
                          <span class="book-status-rarity-prob-stars" aria-hidden="true"><span class="book-rarity-star">★</span></span>
                          <span class="book-status-rarity-prob-value-wrap"><span id="book-status-rarity-common" class="book-status-rarity-prob-value">0.0%</span><span id="book-status-rarity-common-current" class="book-status-rarity-prob-value book-status-rarity-prob-value-current">0.0%</span></span>
                        </div>
                        <div class="book-status-rarity-prob-item" data-rarity="uncommon">
                          <span class="book-status-rarity-prob-label-wrap"><span class="book-status-rarity-prob-label">UNCOMMON</span><span class="book-status-rarity-prob-arrow-wrap"><span id="book-status-rarity-uncommon-delta" class="book-status-rarity-prob-delta" aria-live="polite"></span></span></span>
                          <span class="book-status-rarity-prob-stars" aria-hidden="true"><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span></span>
                          <span class="book-status-rarity-prob-value-wrap"><span id="book-status-rarity-uncommon" class="book-status-rarity-prob-value">0.0%</span><span id="book-status-rarity-uncommon-current" class="book-status-rarity-prob-value book-status-rarity-prob-value-current">0.0%</span></span>
                        </div>
                        <div class="book-status-rarity-prob-item" data-rarity="rare">
                          <span class="book-status-rarity-prob-label-wrap"><span class="book-status-rarity-prob-label">RARE</span><span class="book-status-rarity-prob-arrow-wrap"><span id="book-status-rarity-rare-delta" class="book-status-rarity-prob-delta" aria-live="polite"></span></span></span>
                          <span class="book-status-rarity-prob-stars" aria-hidden="true"><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span></span>
                          <span class="book-status-rarity-prob-value-wrap"><span id="book-status-rarity-rare" class="book-status-rarity-prob-value">0.0%</span><span id="book-status-rarity-rare-current" class="book-status-rarity-prob-value book-status-rarity-prob-value-current">0.0%</span></span>
                        </div>
                        <div class="book-status-rarity-prob-item" data-rarity="epic">
                          <span class="book-status-rarity-prob-label-wrap"><span class="book-status-rarity-prob-label">EPIC</span><span class="book-status-rarity-prob-arrow-wrap"><span id="book-status-rarity-epic-delta" class="book-status-rarity-prob-delta" aria-live="polite"></span></span></span>
                          <span class="book-status-rarity-prob-stars" aria-hidden="true"><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span></span>
                          <span class="book-status-rarity-prob-value-wrap"><span id="book-status-rarity-epic" class="book-status-rarity-prob-value">0.0%</span><span id="book-status-rarity-epic-current" class="book-status-rarity-prob-value book-status-rarity-prob-value-current">0.0%</span></span>
                        </div>
                        <div class="book-status-rarity-prob-item" data-rarity="legendary">
                          <span class="book-status-rarity-prob-label-wrap"><span class="book-status-rarity-prob-label">LEGEND</span><span class="book-status-rarity-prob-arrow-wrap"><span id="book-status-rarity-legendary-delta" class="book-status-rarity-prob-delta" aria-live="polite"></span></span></span>
                          <span class="book-status-rarity-prob-stars" aria-hidden="true"><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span><span class="book-rarity-star">★</span></span>
                          <span class="book-status-rarity-prob-value-wrap"><span id="book-status-rarity-legendary" class="book-status-rarity-prob-value">0.0%</span><span id="book-status-rarity-legendary-current" class="book-status-rarity-prob-value book-status-rarity-prob-value-current">0.0%</span></span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <div id="book-skill-panel" class="book-skill-panel" style="display: none;">
                  <div class="book-skill-head-row">
                    <div class="book-skill-category-block">
                      <div class="book-skill-category-title">Skill Category</div>
                      <div id="book-skill-category-tabs" class="book-skill-category-tabs" role="tablist" aria-label="スキルカテゴリ">
                        <button type="button" class="book-skill-category-tab is-active" data-tree-id="power" data-label="POWER" aria-label="パワー"><span class="book-skill-category-tab-initial">P</span></button>
                        <button type="button" class="book-skill-category-tab" data-tree-id="speed" data-label="SPEED" aria-label="スピード"><span class="book-skill-category-tab-initial">S</span></button>
                        <button type="button" class="book-skill-category-tab" data-tree-id="technique" data-label="TECH" aria-label="テクニック"><span class="book-skill-category-tab-initial">T</span></button>
                        <button type="button" class="book-skill-category-tab" data-tree-id="control" data-label="CONTROL" aria-label="コントロール"><span class="book-skill-category-tab-initial">C</span></button>
                        <button type="button" class="book-skill-category-tab" data-tree-id="special" data-label="UNIQUE" aria-label="特殊"><span class="book-skill-category-tab-initial">U</span></button>
                      </div>
                    </div>
                    <div class="book-skill-summary-col">
                      <div class="book-skill-top ui-frame-box">
                        <span class="book-skill-sp-label">所持SP</span>
                        <span id="book-skill-sp" class="book-skill-sp-value">0</span>
                      </div>
                      <div class="book-skill-summary-subrow">
                        <span class="book-skill-summary-item">使用したSP <b id="book-skill-sp-used">0</b></span>
                        <span class="book-skill-summary-item">解放したスキル <b id="book-skill-unlocked-count">0</b></span>
                      </div>
                    </div>
                  </div>
                  <div class="book-skill-content-row ui-frame-box">
                    <div class="book-skill-tree-scroll-wrap">
                      <div class="book-skill-tree-wrap" id="book-skill-tree-scroll">
                        <div id="book-skill-tree-grid" class="book-skill-tree-grid" role="group" aria-label="スキルツリー"></div>
                      </div>
                      <div class="book-skill-tree-scroll-fade book-skill-tree-scroll-fade--top" id="book-skill-tree-fade-top" aria-hidden="true"></div>
                      <div class="book-skill-tree-scroll-fade book-skill-tree-scroll-fade--bottom" id="book-skill-tree-fade-bottom" aria-hidden="true"></div>
                    </div>
                    <div id="book-skill-node-detail" class="book-skill-node-detail ui-frame-box">
                      <h4 id="book-skill-detail-name" class="book-skill-detail-name">スキルを選択すると<br />説明が見られるよ</h4>
                      <p id="book-skill-detail-desc" class="book-skill-detail-desc"></p>
                      <p id="book-skill-detail-prereq" class="book-skill-detail-prereq"></p>
                      <p id="book-skill-detail-cost" class="book-skill-detail-cost"></p>
                      <button type="button" id="book-skill-unlock" class="nes-btn ui-frame-box">解放する</button>
                      <p id="book-skill-detail-hint" class="book-skill-detail-hint"></p>
                    </div>
                  </div>
                </div>
                <div class="book-detail-placeholder" id="book-detail-placeholder">
                  魚を釣り上げよう！
                </div>
                <div class="book-detail-content" id="book-detail-content">
                <!-- ヘッダー: 魚名 + レアリティバッジ -->
                <div class="book-detail-header-new">
                  <div id="book-detail-name" class="book-detail-name-new"></div>
                  <div class="book-detail-rarity-badge ui-frame-box">
                    <div id="book-detail-rarity-stars" class="book-detail-rarity-stars"></div>
                    <div class="book-detail-rarity-label">
                      <img src="/images/rarity-label.svg" alt="Rarity" class="book-rarity-label-image" />
                    </div>
                  </div>
                </div>
                
                <!-- 魚のイラスト -->
                <div class="book-detail-image-container-new">
                  <canvas id="book-detail-image" class="book-detail-image-new" width="148" height="165" style="display: none;"></canvas>
                  <div id="book-detail-emoji" class="book-detail-emoji-new" style="display: none;"></div>
                </div>
                
                <div class="book-detail-sections">
                <!-- 統計情報: 売値とサイズ -->
                <div class="book-detail-stats">
                  <div class="book-detail-stat-item" data-name="売値">
                    <img src="/images/ui/ゴールド.png" alt="売値" class="book-detail-stat-label-icon" />
                    <span id="book-detail-price" class="book-detail-stat-value"></span>
                    <span id="book-detail-price-unit" class="book-detail-stat-unit"></span>
                  </div>
                  <div class="book-detail-stat-item" data-name="サイズ">
                    <img id="book-detail-size-icon" src="/images/ui/サイズ.png" alt="サイズ" class="book-detail-stat-label-icon" />
                    <span id="book-detail-size" class="book-detail-stat-value"></span>
                    <span id="book-detail-size-unit" class="book-detail-stat-unit"></span>
                  </div>
                </div>
                
                <!-- 生息地と捕獲数 -->
                <div class="book-detail-habitat-row">
                  <div id="book-detail-habitat" class="book-detail-habitat"></div>
                  <div class="book-detail-catch-count">
                    <span>捕獲数：</span>
                    <span id="book-detail-catch-count-value"></span>
                    <span>匹</span>
                  </div>
                </div>
                </div>
                
                <!-- Noteセクション -->
                <div class="book-detail-note">
                  <div class="book-detail-note-header">
                    <span class="book-detail-note-title">Note</span>
                  </div>
                  <div id="book-detail-desc" class="book-detail-note-content"></div>
                </div>
              </div>
              </div>
              </div>
                <div class="book-list-scroll-fade book-list-scroll-fade--top" id="book-right-pane-fade-top" aria-hidden="true"></div>
                <div class="book-list-scroll-fade book-list-scroll-fade--bottom" id="book-right-pane-fade-bottom" aria-hidden="true"></div>
            </div>
            </div>
            </div>
        <div id="book-aquarium-panel" class="book-aquarium-panel" style="display: none;">
          <div class="aquarium-hero">
            <div id="aquarium-slots" class="aquarium-slots" role="list"></div>
            <div id="aquarium-manage-detail" class="aquarium-manage-detail"></div>
          </div>
          <div class="aquarium-tank-section ui-frame-box">
            <div class="aquarium-tank-footer">
              <div class="aquarium-food-select" role="group" aria-label="エサ選択">
                <button type="button" class="aquarium-food-option ui-frame-box" data-food-tier="normal" aria-pressed="true">
                  <img class="aquarium-food-option-icon" src="/images/items/アクアリウムのエサ.png" alt="" width="28" height="28" />
                  <span class="aquarium-food-option-count">×<span id="aquarium-food-count-value">0</span></span>
                </button>
                <button type="button" class="aquarium-food-option ui-frame-box" data-food-tier="premium" aria-pressed="false">
                  <img class="aquarium-food-option-icon" src="/images/items/高級なエサ.png" alt="" width="28" height="28" />
                  <span class="aquarium-food-option-count">×<span id="aquarium-premium-food-count-value">0</span></span>
                </button>
              </div>
              <div id="aquarium-summary-bonus" class="aquarium-bonus-chips" aria-label="合計ボーナス"></div>
            </div>
            <div class="aquarium-canvas-wrap" aria-label="水槽プレビュー">
              <canvas id="aquarium-canvas" width="960" height="540"></canvas>
            </div>
          </div>
        </div>
        <div id="skill-unlock-confirm-layer" class="skill-unlock-confirm-layer" style="display: none;" aria-hidden="true">
          <div class="skill-unlock-confirm-dialog ui-frame-box" role="dialog" aria-modal="true" aria-labelledby="skill-unlock-confirm-message">
            <p id="skill-unlock-confirm-message" class="skill-unlock-confirm-message"></p>
            <div class="skill-unlock-confirm-actions modal-choice-actions">
              <button type="button" id="skill-unlock-confirm-cancel" class="nes-btn ui-frame-box">やめる</button>
              <button type="button" id="skill-unlock-confirm-ok" class="nes-btn ui-frame-box">解放する</button>
            </div>
          </div>
        </div>
        <div id="quest-abandon-confirm-layer" class="skill-unlock-confirm-layer" style="display: none;" aria-hidden="true">
          <div class="skill-unlock-confirm-dialog ui-frame-box" role="dialog" aria-modal="true" aria-labelledby="quest-abandon-confirm-message">
            <p id="quest-abandon-confirm-message" class="skill-unlock-confirm-message"></p>
            <div class="skill-unlock-confirm-actions modal-choice-actions">
              <button type="button" id="quest-abandon-confirm-cancel" class="nes-btn ui-frame-box">やめる</button>
              <button type="button" id="quest-abandon-confirm-ok" class="nes-btn ui-frame-box">破棄する</button>
            </div>
          </div>
        </div>
        <div id="aquarium-bag-pick-layer" class="aquarium-bag-pick-layer" style="display: none;" aria-hidden="true">
          <div class="aquarium-bag-pick-dialog ui-frame-box" role="dialog" aria-modal="true" aria-labelledby="aquarium-bag-pick-title">
            <div class="aquarium-bag-pick-header">
              <p id="aquarium-bag-pick-title" class="aquarium-bag-pick-title">バッグから選ぶ</p>
            </div>
            <div class="aquarium-bag-pick-grid-wrap">
              <div id="aquarium-bag-pick-grid" class="aquarium-bag-pick-grid" role="list"></div>
              <div class="book-list-scroll-fade book-list-scroll-fade--top" id="aquarium-bag-pick-fade-top" aria-hidden="true"></div>
              <div class="book-list-scroll-fade book-list-scroll-fade--bottom" id="aquarium-bag-pick-fade-bottom" aria-hidden="true"></div>
            </div>
            <p id="aquarium-bag-pick-empty" class="aquarium-bag-pick-empty" style="display: none;">入れられる魚がバッグにいません</p>
            <div class="aquarium-bag-pick-actions modal-choice-actions">
              <button type="button" id="aquarium-bag-pick-cancel" class="nes-btn ui-frame-box">やめる</button>
            </div>
          </div>
        </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bookHTML;
    this.unifiedBookUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.unifiedBookUIElement);

    // 画面外クリックで閉じる。タブ行の空き（.book-header の余白）は外側扱い。
    // タブボタン本体と .book-container（確認ダイアログ含む）だけ内側とする。
    this.unifiedBookUIElement.addEventListener('pointerdown', (e) => {
      if (!this.unifiedBookOpen) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.book-container') || target.closest('.book-tab-button')) {
        return;
      }
      this.closeUnifiedBook();
    });

    // 要素をキャッシュ
    this.unifiedBookListScrollElement = this.unifiedBookUIElement.querySelector('#book-list-scroll') as HTMLElement;
    this.unifiedBookListScrollFadeBottomElement = this.unifiedBookUIElement.querySelector('#book-list-scroll-fade-bottom') as HTMLElement;
    this.unifiedBookListScrollFadeTopElement = this.unifiedBookUIElement.querySelector('#book-list-scroll-fade-top') as HTMLElement;
    this.setupUnifiedBookListScrollFade();
    this.unifiedBookRightPaneScrollElement = this.unifiedBookUIElement.querySelector('#book-right-pane-scroll') as HTMLElement;
    this.unifiedBookRightPaneFadeTopElement = this.unifiedBookUIElement.querySelector('#book-right-pane-fade-top') as HTMLElement;
    this.unifiedBookRightPaneFadeBottomElement = this.unifiedBookUIElement.querySelector('#book-right-pane-fade-bottom') as HTMLElement;
    this.setupUnifiedBookRightPaneScrollFade();
    this.bookSkillTreeScrollElement = this.unifiedBookUIElement.querySelector('#book-skill-tree-scroll') as HTMLElement;
    this.bookSkillTreeFadeTopElement = this.unifiedBookUIElement.querySelector('#book-skill-tree-fade-top') as HTMLElement;
    this.bookSkillTreeFadeBottomElement = this.unifiedBookUIElement.querySelector('#book-skill-tree-fade-bottom') as HTMLElement;
    this.setupBookSkillTreeScrollFade();
    this.unifiedBookDetailElement = this.unifiedBookUIElement.querySelector('#book-detail-content') as HTMLElement;
    this.unifiedBookDetailPlaceholderElement = this.unifiedBookUIElement.querySelector('#book-detail-placeholder') as HTMLElement;

    // タブボタンのイベント
    const tabButtons = this.unifiedBookUIElement.querySelectorAll('.book-tab-button');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.exitUnifiedBookMainTabsNav();
        const tab = (btn as HTMLElement).getAttribute('data-tab') as UnifiedBookTab;
        this.switchUnifiedBookTab(tab);
      });
    });

    const pediaSortRarityBtn = this.unifiedBookUIElement.querySelector('#book-pedia-sort-rarity') as HTMLButtonElement | null;
    const pediaSortWatersBtn = this.unifiedBookUIElement.querySelector('#book-pedia-sort-waters') as HTMLButtonElement | null;
    pediaSortRarityBtn?.addEventListener('click', () => {
      this.pediaNavArea = 'sort';
      this.setUnifiedBookPediaSortMode('rarity');
      this.syncBookPediaSortBarUI();
    });
    pediaSortWatersBtn?.addEventListener('click', () => {
      this.pediaNavArea = 'sort';
      this.setUnifiedBookPediaSortMode('waters');
      this.syncBookPediaSortBarUI();
    });

    const skillUnlockBtn = this.unifiedBookUIElement.querySelector('#book-skill-unlock');
    skillUnlockBtn?.addEventListener('click', () => {
      if (!this.skillSelectedNodeId) return;
      if (this.playerData.unlockedSkillNodes.has(this.skillSelectedNodeId)) return;
      const check = canUnlockSkillNode(this.playerData, this.skillSelectedNodeId);
      if (!check.ok) {
        if (check.reason) this.showResult(check.reason, 1600);
        return;
      }
      this.openSkillUnlockConfirm(this.skillSelectedNodeId);
    });

    const skillUnlockLayer = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-layer');
    skillUnlockLayer?.addEventListener('click', (e) => {
      if (e.target === skillUnlockLayer) this.closeSkillUnlockConfirm();
    });
    const skillUnlockDialog = this.unifiedBookUIElement.querySelector('.skill-unlock-confirm-dialog');
    skillUnlockDialog?.addEventListener('click', (e) => e.stopPropagation());
    const skillUnlockCancelBtn = this.unifiedBookUIElement.querySelector(
      '#skill-unlock-confirm-cancel',
    ) as HTMLButtonElement | null;
    const skillUnlockOkBtn = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-ok') as HTMLButtonElement | null;
    skillUnlockCancelBtn?.addEventListener('click', () => {
      this.closeSkillUnlockConfirm();
    });
    skillUnlockOkBtn?.addEventListener('click', () => {
      this.applySkillUnlockConfirm();
    });
    skillUnlockCancelBtn?.addEventListener('focus', () => {
      this.skillUnlockConfirmFocus = 'cancel';
      this.syncSkillUnlockConfirmSelection();
    });
    skillUnlockOkBtn?.addEventListener('focus', () => {
      this.skillUnlockConfirmFocus = 'ok';
      this.syncSkillUnlockConfirmSelection();
    });

    const questAbandonLayer = this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-layer');
    questAbandonLayer?.addEventListener('click', (e) => {
      if (e.target === questAbandonLayer) this.closeQuestAbandonConfirm();
    });
    const questAbandonDialog = questAbandonLayer?.querySelector('.skill-unlock-confirm-dialog');
    questAbandonDialog?.addEventListener('click', (e) => e.stopPropagation());
    const questAbandonCancelBtn = this.unifiedBookUIElement.querySelector(
      '#quest-abandon-confirm-cancel',
    ) as HTMLButtonElement | null;
    const questAbandonOkBtn = this.unifiedBookUIElement.querySelector(
      '#quest-abandon-confirm-ok',
    ) as HTMLButtonElement | null;
    questAbandonCancelBtn?.addEventListener('click', () => {
      this.closeQuestAbandonConfirm();
    });
    questAbandonOkBtn?.addEventListener('click', () => {
      this.applyQuestAbandonConfirm();
    });
    questAbandonCancelBtn?.addEventListener('focus', () => {
      this.questAbandonConfirmFocus = 'cancel';
      this.syncQuestAbandonConfirmSelection();
    });
    questAbandonOkBtn?.addEventListener('focus', () => {
      this.questAbandonConfirmFocus = 'ok';
      this.syncQuestAbandonConfirmSelection();
    });

    const aquariumBagPickLayer = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-layer');
    aquariumBagPickLayer?.addEventListener('click', (e) => {
      if (e.target === aquariumBagPickLayer) this.closeAquariumBagPick();
    });
    const aquariumBagPickDialog = aquariumBagPickLayer?.querySelector('.aquarium-bag-pick-dialog');
    aquariumBagPickDialog?.addEventListener('click', (e) => e.stopPropagation());
    this.aquariumBagPickGridElement = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-grid') as HTMLElement;
    this.aquariumBagPickFadeTopElement = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-fade-top') as HTMLElement;
    this.aquariumBagPickFadeBottomElement = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-fade-bottom') as HTMLElement;
    this.setupAquariumBagPickScrollFade();
    const aquariumBagPickCancelBtn = this.unifiedBookUIElement.querySelector(
      '#aquarium-bag-pick-cancel',
    ) as HTMLButtonElement | null;
    aquariumBagPickCancelBtn?.addEventListener('click', () => {
      this.closeAquariumBagPick();
    });
    aquariumBagPickCancelBtn?.addEventListener('focus', () => {
      this.aquariumBagPickFocus = 'cancel';
      this.syncAquariumBagPickSelection();
    });

    const statusChangeRodBtn = this.unifiedBookUIElement.querySelector('#book-status-change-rod') as HTMLButtonElement | null;
    const statusChangeLureBtn = this.unifiedBookUIElement.querySelector('#book-status-change-lure') as HTMLButtonElement | null;
    statusChangeRodBtn?.addEventListener('click', () => {
      this.statusLastInteractedButtonType = 'rod';
      this.openStatusEquipmentSelector('rod');
    });
    statusChangeRodBtn?.addEventListener('mouseenter', () => {
      if (this.uiMenuNavInputChannel === 'keyboard') return;
      this.statusNavButtonType = 'rod';
      this.statusLastInteractedButtonType = 'rod';
      if (!this.statusEquipmentSelectorType) {
        this.statusNavArea = 'equipmentButtons';
        const panel = this.unifiedBookUIElement?.querySelector('#book-status-panel') as HTMLElement | null;
        if (panel) this.syncStatusEquipmentButtonSelection(panel);
      }
    });
    statusChangeRodBtn?.addEventListener('mouseleave', (e) => {
      if (this.uiMenuNavInputChannel === 'keyboard') return;
      if (this.statusEquipmentSelectorType) return;
      if (this.statusNavArea !== 'equipmentButtons') return;
      const to = e.relatedTarget as Node | null;
      if (to && (statusChangeRodBtn.contains(to) || statusChangeLureBtn?.contains(to))) return;
      const panel = this.unifiedBookUIElement?.querySelector('#book-status-panel') as HTMLElement | null;
      if (!panel) return;
      this.statusNavArea = 'stats';
      this.fillBookStatusPanel(panel);
    });
    statusChangeRodBtn?.addEventListener('pointerdown', () => {
      this.statusNavButtonType = 'rod';
      this.statusLastInteractedButtonType = 'rod';
    });
    statusChangeRodBtn?.addEventListener('focus', () => {
      this.statusNavButtonType = 'rod';
      this.statusLastInteractedButtonType = 'rod';
    });
    statusChangeLureBtn?.addEventListener('click', () => {
      this.statusLastInteractedButtonType = 'lure';
      this.openStatusEquipmentSelector('lure');
    });
    statusChangeLureBtn?.addEventListener('mouseenter', () => {
      if (this.uiMenuNavInputChannel === 'keyboard') return;
      this.statusNavButtonType = 'lure';
      this.statusLastInteractedButtonType = 'lure';
      if (!this.statusEquipmentSelectorType) {
        this.statusNavArea = 'equipmentButtons';
        const panel = this.unifiedBookUIElement?.querySelector('#book-status-panel') as HTMLElement | null;
        if (panel) this.syncStatusEquipmentButtonSelection(panel);
      }
    });
    statusChangeLureBtn?.addEventListener('mouseleave', (e) => {
      if (this.uiMenuNavInputChannel === 'keyboard') return;
      if (this.statusEquipmentSelectorType) return;
      if (this.statusNavArea !== 'equipmentButtons') return;
      const to = e.relatedTarget as Node | null;
      if (to && (statusChangeLureBtn.contains(to) || statusChangeRodBtn?.contains(to))) return;
      const panel = this.unifiedBookUIElement?.querySelector('#book-status-panel') as HTMLElement | null;
      if (!panel) return;
      this.statusNavArea = 'stats';
      this.fillBookStatusPanel(panel);
    });
    statusChangeLureBtn?.addEventListener('pointerdown', () => {
      this.statusNavButtonType = 'lure';
      this.statusLastInteractedButtonType = 'lure';
    });
    statusChangeLureBtn?.addEventListener('focus', () => {
      this.statusNavButtonType = 'lure';
      this.statusLastInteractedButtonType = 'lure';
    });

    const bookStatusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    bookStatusPanel?.addEventListener('pointerenter', () => {
      if (!this.unifiedBookOpen || this.unifiedBookTab !== 'status') return;
      this.applyUiMenuNavInputChannel('mouse');
    });

    this.unifiedBookUIElement.addEventListener('pointerenter', () => {
      if (!this.unifiedBookOpen) return;
      const t = this.unifiedBookTab;
      if (
        t !== 'skills' &&
        t !== 'achievement' &&
        t !== 'quest' &&
        t !== 'pedia' &&
        t !== 'inventory' &&
        t !== 'aquarium'
      ) {
        return;
      }
      this.applyUiMenuNavInputChannel('mouse');
    });

    // グローバルに参照を保存
    (window as any).gameScene = this;
  }

  private getVisibleUnifiedBookTabOrder(): UnifiedBookTab[] {
    if (hasAquarium(this.playerData)) return this.unifiedBookTabOrder;
    return this.unifiedBookTabOrder.filter((t) => t !== 'aquarium');
  }

  private updateAquariumTabVisibility() {
    if (!this.unifiedBookUIElement) return;
    const btn = this.unifiedBookUIElement.querySelector('.book-tab-button[data-tab="aquarium"]') as HTMLElement | null;
    if (!btn) return;
    const visible = hasAquarium(this.playerData);
    btn.hidden = !visible;
    if (!visible && this.unifiedBookTab === 'aquarium') {
      this.switchUnifiedBookTab('inventory');
    }
  }

  private clearAquariumSatietyInterval() {
    if (this.aquariumSatietyIntervalId !== null) {
      window.clearInterval(this.aquariumSatietyIntervalId);
      this.aquariumSatietyIntervalId = null;
    }
  }

  private startAquariumSatietyInterval() {
    this.clearAquariumSatietyInterval();
    this.refreshAquariumSatietyUI();
    this.aquariumSatietyIntervalId = window.setInterval(() => this.refreshAquariumSatietyUI(), 1000);
  }

  /** 詳細の満腹テキスト＋スロットバッジのみ更新（リスト再描画はしない） */
  private refreshAquariumSatietyUI() {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'aquarium') return;
    const now = Date.now();
    const slots = this.playerData.aquarium ?? [];

    const cards = this.unifiedBookUIElement.querySelectorAll('#aquarium-slots .aquarium-slot-card');
    cards.forEach((card, i) => {
      const entry = slots[i];
      let badge = card.querySelector('.aquarium-satiety-badge') as HTMLElement | null;
      if (!entry) {
        badge?.remove();
        return;
      }
      const satiated = isSatiated(entry, now);
      if (satiated && !badge) {
        badge = document.createElement('span');
        badge.className = 'aquarium-satiety-badge';
        badge.textContent = '満腹';
        card.appendChild(badge);
      } else if (!satiated && badge) {
        badge.remove();
      }
    });

    const satietyEl = this.unifiedBookUIElement.querySelector(
      '#aquarium-manage-detail .aquarium-satiety-text',
    ) as HTMLElement | null;
    if (!satietyEl) return;
    const id = this.unifiedBookSelectedId;
    if (!id?.startsWith('aquarium-slot-')) return;
    const slotIdx = Number(id.replace('aquarium-slot-', ''));
    const entry = slots[slotIdx];
    if (!entry) return;
    const rem = getSatietyRemainingMs(entry, now);
    const wasSatiated = (satietyEl.textContent ?? '').startsWith('満腹');
    const nowSatiated = rem > 0;
    if (isAquariumMaxGrowth(entry)) {
      satietyEl.textContent = 'これ以上成長しない';
    } else {
      satietyEl.textContent =
        nowSatiated ? `満腹（あと${Math.ceil(rem / 1000)}秒）` : 'おなかがすいている';
    }
    // 満腹解除で戻す／入れかえボタンを再有効化
    if (wasSatiated && !nowSatiated && this.aquariumNavArea === 'detail') {
      this.updateUnifiedBookDetail();
    }
  }

  private clearAquariumRemoveConfirm() {
    if (this.aquariumRemoveConfirmTimer !== null) {
      window.clearTimeout(this.aquariumRemoveConfirmTimer);
      this.aquariumRemoveConfirmTimer = null;
    }
    this.aquariumRemoveConfirmIndex = null;
  }

  private aquariumStatLabel(stat: AquariumStatKey): string {
    if (stat === 'power') return 'パワー';
    if (stat === 'speed') return 'スピード';
    if (stat === 'technique') return 'テクニック';
    return 'コントロール';
  }

  private aquariumStatInitial(stat: AquariumStatKey): string {
    if (stat === 'power') return 'P';
    if (stat === 'speed') return 'S';
    if (stat === 'technique') return 'T';
    return 'C';
  }

  private formatAquariumPt(value: number): string {
    return (value * 100).toFixed(1);
  }

  /**
   * スロットにカーソルを移動する（is-selected のみ更新）。
   * 詳細パネルは開かない。決定操作（マウスクリック確定 or Enter）時は openAquariumDetail() を呼ぶ。
   */
  private renderAquariumIdleDetail() {
    const detailEl = this.unifiedBookUIElement?.querySelector('#aquarium-manage-detail') as HTMLElement | null;
    if (!detailEl) return;
    detailEl.innerHTML = '';

    const tipTitle = document.createElement('p');
    tipTitle.className = 'aquarium-detail-note-title';
    tipTitle.textContent = 'Slot';

    const tip = document.createElement('p');
    tip.className = 'aquarium-detail-tip';
    const hasAnyFish = (this.playerData.aquarium?.length ?? 0) > 0;
    tip.textContent = hasAnyFish ? 'さかなを選択しよう' : '水槽にさかなを入れよう';

    detailEl.appendChild(tipTitle);
    detailEl.appendChild(tip);
    this.syncAquariumKeyboardSelection();
  }

  private selectAquariumBookItem(id: string, index: number) {
    this.unifiedBookSelectedId = id;
    this.unifiedBookSelectedIndex = index;
    this.aquariumPendingBagIndex = null;
    this.closeAquariumBagPick();
    this.aquariumDetailNavIndex = 0;
    this.clearAquariumRemoveConfirm();
    this.unifiedBookListItems.forEach((el, i) => {
      const on = i === index;
      el.classList.toggle('is-selected', on);
      el.classList.toggle('state-selected', on);
    });
    this.renderAquariumIdleDetail();
  }

  /** 決定操作（クリック確定・Enter）でスロット詳細を開く */
  private openAquariumDetail() {
    if (this.aquariumNavArea !== 'slots') return;
    this.updateUnifiedBookDetail();
    const focusables = this.getAquariumDetailFocusables();
    if (focusables.length > 0) {
      this.aquariumNavArea = 'detail';
      this.aquariumDetailNavIndex = 0;
      this.syncAquariumKeyboardSelection();
    }
  }

  /** 詳細パネル内のキー操作可能要素（アクションボタン） */
  private getAquariumDetailFocusables(): HTMLElement[] {
    const detail = this.unifiedBookUIElement?.querySelector('#aquarium-manage-detail');
    if (!detail) return [];
    const items: HTMLElement[] = [];
    detail.querySelectorAll('.aquarium-detail-action').forEach((el) => {
      const btn = el as HTMLButtonElement;
      if (!btn.disabled && !btn.classList.contains('is-disabled')) items.push(btn);
    });
    return items;
  }

  private clampAquariumDetailNavIndex() {
    const items = this.getAquariumDetailFocusables();
    if (items.length === 0) {
      this.aquariumDetailNavIndex = 0;
      return;
    }
    this.aquariumDetailNavIndex = Math.max(0, Math.min(this.aquariumDetailNavIndex, items.length - 1));
  }

  private syncAquariumKeyboardSelection() {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'aquarium') return;
    const root = this.unifiedBookUIElement;
    root.querySelectorAll('.aquarium-slot-card.is-nav-selected').forEach((el) => el.classList.remove('is-nav-selected'));
    root.querySelectorAll('.aquarium-detail-action.is-nav-selected').forEach((el) => el.classList.remove('is-nav-selected'));
    root.querySelectorAll('.aquarium-food-option.is-nav-selected').forEach((el) => el.classList.remove('is-nav-selected'));
    root.querySelectorAll('.aquarium-canvas-wrap.is-nav-selected').forEach((el) => el.classList.remove('is-nav-selected'));

    // 上部タブ選択中はスロットの選択見た目を残さない
    if (this.unifiedBookMainTabsNavActive) {
      this.unifiedBookListItems.forEach((el) => {
        el.classList.remove('is-selected', 'state-selected');
      });
      this.refreshKbSelectionPointer();
      return;
    }

    // スロット／詳細操作中だけ「選択中スロット」を残す。エサ・水槽へ移ったら外す。
    // マウス＋スロット未決定時は浮き上がりを出さない（詳細未オープンなのに選択に見えるのを防ぐ）
    const highlightSlotSelection =
      this.aquariumNavArea === 'detail' ||
      (this.aquariumNavArea === 'slots' && this.uiMenuNavInputChannel === 'keyboard');
    const selIdx = this.unifiedBookSelectedIndex;
    this.unifiedBookListItems.forEach((el, i) => {
      const on = highlightSlotSelection && selIdx !== null && i === selIdx;
      el.classList.toggle('is-selected', on);
      el.classList.toggle('state-selected', on);
    });

    if (this.uiMenuNavInputChannel === 'keyboard') {
      if (this.aquariumNavArea === 'slots') {
        if (selIdx !== null) {
          const card = this.unifiedBookListItems[selIdx]?.querySelector(
            '.aquarium-slot-card',
          ) as HTMLElement | null;
          card?.classList.add('is-nav-selected');
        }
      } else if (this.aquariumNavArea === 'detail') {
        this.clampAquariumDetailNavIndex();
        const items = this.getAquariumDetailFocusables();
        items[this.aquariumDetailNavIndex]?.classList.add('is-nav-selected');
      } else if (this.aquariumNavArea === 'food') {
        const tier = this.aquariumSelectedFoodTier;
        root.querySelector(`.aquarium-food-option[data-food-tier="${tier}"]`)?.classList.add('is-nav-selected');
      } else if (this.aquariumNavArea === 'tank') {
        root.querySelector('.aquarium-canvas-wrap')?.classList.add('is-nav-selected');
      }
    }

    this.refreshKbSelectionPointer();
  }

  private handleAquariumNavigation(dir: 'up' | 'down' | 'left' | 'right', now: number) {
    const slotCount = this.unifiedBookListItems.length;
    let slotIdx = this.unifiedBookSelectedIndex ?? 0;
    if (slotIdx < 0 || slotIdx >= slotCount) slotIdx = 0;

    if (this.aquariumNavArea === 'slots') {
      if (dir === 'up') {
        this.enterUnifiedBookMainTabsNav();
        return;
      }
      if (dir === 'down') {
        this.aquariumNavArea = 'food';
        this.syncAquariumKeyboardSelection();
        return;
      }
      if (dir === 'left') {
        if (slotIdx > 0) {
          const item = this.unifiedBookListItems[slotIdx - 1];
          const id = item?.getAttribute('data-aquarium-id');
          if (id) this.selectAquariumBookItem(id, slotIdx - 1);
          return;
        }
      this.enterUnifiedBookMainTabsNav();
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
        return;
      }
      if (dir === 'right') {
        if (slotIdx < slotCount - 1) {
          const item = this.unifiedBookListItems[slotIdx + 1];
          const id = item?.getAttribute('data-aquarium-id');
          if (id) this.selectAquariumBookItem(id, slotIdx + 1);
          return;
        }
        this.enterUnifiedBookMainTabsNav();
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      }
      return;
    }

    if (this.aquariumNavArea === 'detail') {
      const focusables = this.getAquariumDetailFocusables();
      if (focusables.length === 0) {
        if (dir === 'up') {
          this.aquariumNavArea = 'slots';
          this.syncAquariumKeyboardSelection();
        } else if (dir === 'down') {
          this.aquariumNavArea = 'food';
          this.syncAquariumKeyboardSelection();
        }
        return;
      }
      this.clampAquariumDetailNavIndex();
      if (dir === 'up') {
        if (this.aquariumDetailNavIndex > 0) {
          this.aquariumDetailNavIndex--;
          this.syncAquariumKeyboardSelection();
        } else {
          this.aquariumNavArea = 'slots';
          this.syncAquariumKeyboardSelection();
        }
        return;
      }
      if (dir === 'down') {
        if (this.aquariumDetailNavIndex < focusables.length - 1) {
          this.aquariumDetailNavIndex++;
          this.syncAquariumKeyboardSelection();
        } else {
          this.aquariumNavArea = 'food';
          this.syncAquariumKeyboardSelection();
        }
        return;
      }
      if (dir === 'left') {
        if (this.aquariumDetailNavIndex > 0) {
          this.aquariumDetailNavIndex--;
          this.syncAquariumKeyboardSelection();
        } else {
          this.aquariumNavArea = 'slots';
          this.syncAquariumKeyboardSelection();
        }
        return;
      }
      if (dir === 'right') {
        if (this.aquariumDetailNavIndex < focusables.length - 1) {
          this.aquariumDetailNavIndex++;
          this.syncAquariumKeyboardSelection();
        } else {
          this.aquariumNavArea = 'food';
          this.syncAquariumKeyboardSelection();
        }
      }
      return;
    }

    if (this.aquariumNavArea === 'food') {
      if (dir === 'up') {
        const focusables = this.getAquariumDetailFocusables();
        if (focusables.length > 0) {
          this.aquariumNavArea = 'detail';
          this.aquariumDetailNavIndex = focusables.length - 1;
          this.syncAquariumKeyboardSelection();
        } else {
          this.aquariumNavArea = 'slots';
          this.syncAquariumKeyboardSelection();
        }
        return;
      }
      if (dir === 'down') {
        if (getAquariumFoodCount(this.playerData, this.aquariumSelectedFoodTier) <= 0) {
          this.showResult('エサがありません', 1200);
          return;
        }
        this.aquariumNavArea = 'tank';
        this.syncAquariumKeyboardSelection();
        return;
      }
      if (dir === 'left') {
        if (this.aquariumSelectedFoodTier === 'premium') {
          if (getAquariumFoodCount(this.playerData, 'normal') > 0) {
            this.setAquariumSelectedFoodTier('normal');
          }
          return;
        }
        this.enterUnifiedBookMainTabsNav();
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
        return;
      }
      if (dir === 'right') {
        if (this.aquariumSelectedFoodTier === 'normal') {
          if (getAquariumFoodCount(this.playerData, 'premium') > 0) {
            this.setAquariumSelectedFoodTier('premium');
          }
          return;
        }
        this.enterUnifiedBookMainTabsNav();
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      }
      return;
    }

    if (this.aquariumNavArea === 'tank') {
      if (dir === 'up') {
        this.aquariumNavArea = 'food';
        this.syncAquariumKeyboardSelection();
        return;
      }
      if (dir === 'left') {
        this.aquariumAimX = Math.max(AQUARIUM_SWIM_X_MIN, this.aquariumAimX - this.aquariumAimStepPx);
        return;
      }
      if (dir === 'right') {
        this.aquariumAimX = Math.min(AQUARIUM_SWIM_X_MAX, this.aquariumAimX + this.aquariumAimStepPx);
      }
    }
  }

  private triggerAquariumKeyboardAction() {
    if (this.aquariumNavArea === 'tank') {
      if (getAquariumFoodCount(this.playerData, this.aquariumSelectedFoodTier) <= 0) {
        this.showResult('エサがありません', 1200);
        this.aquariumNavArea = 'food';
        this.updateAquariumFoodHud();
        this.syncAquariumKeyboardSelection();
        return;
      }
      this.tryDropAquariumFood();
      return;
    }
    if (this.aquariumNavArea === 'food') {
      // エサ種別の選択のみ。投下は水槽フォーカス（↓）へ進んでから Enter
      return;
    }
    if (this.aquariumNavArea === 'detail') {
      const items = this.getAquariumDetailFocusables();
      const el = items[this.aquariumDetailNavIndex];
      if (el) el.click();
      return;
    }
    // slots エリアでの決定 → 詳細を開く
    this.openAquariumDetail();
  }

  private tryAddAquariumFish(inventoryIndex: number) {
    if (!addFishToAquarium(this.playerData, inventoryIndex)) {
      this.showResult('水槽に入れられません', 1500);
      return;
    }
    savePlayerData(this.playerData);
    this.aquariumPendingBagIndex = null;
    this.closeAquariumBagPick();
    this.syncAquariumRuntimesPreserving();
    this.updateUnifiedBookList();
    this.updateUnifiedBookDetail();
    this.updateAquariumFoodHud();
    this.showResult('水槽に入れた！', 1200);
  }

  private tryRemoveAquariumFish(aquariumIndex: number) {
    const entry = this.playerData.aquarium?.[aquariumIndex];
    if (entry && isSatiated(entry, Date.now())) {
      this.showResult('満腹中はバッグに戻せません', 1500);
      return;
    }
    if (this.playerData.inventory.length >= this.playerData.maxInventorySlots) {
      this.showResult('バッグがいっぱいです', 1500);
      return;
    }
    if (this.aquariumRemoveConfirmIndex !== aquariumIndex) {
      this.aquariumRemoveConfirmIndex = aquariumIndex;
      if (this.aquariumRemoveConfirmTimer !== null) {
        window.clearTimeout(this.aquariumRemoveConfirmTimer);
      }
      this.aquariumRemoveConfirmTimer = window.setTimeout(() => {
        this.aquariumRemoveConfirmIndex = null;
        this.aquariumRemoveConfirmTimer = null;
        if (this.unifiedBookTab === 'aquarium') this.updateUnifiedBookDetail();
      }, 5000);
      this.updateUnifiedBookDetail();
      return;
    }
    if (!removeFishFromAquarium(this.playerData, aquariumIndex)) {
      this.showResult('バッグがいっぱいです', 1500);
      return;
    }
    this.clearAquariumRemoveConfirm();
    this.aquariumPendingBagIndex = null;
    this.closeAquariumBagPick();
    savePlayerData(this.playerData);
    this.syncAquariumRuntimesPreserving({ removedIndex: aquariumIndex });
    this.updateUnifiedBookList();
    this.updateUnifiedBookDetail();
    this.showResult('バッグに戻した！', 1200);
  }

  private trySwapAquariumFish(aquariumIndex: number, inventoryIndex: number) {
    const entry = this.playerData.aquarium?.[aquariumIndex];
    if (entry && isSatiated(entry, Date.now())) {
      this.showResult('満腹中は入れかえられません', 1500);
      this.closeAquariumBagPick();
      this.updateUnifiedBookDetail();
      return;
    }
    if (!swapAquariumFish(this.playerData, aquariumIndex, inventoryIndex)) {
      this.showResult('入れかえられません', 1500);
      return;
    }
    this.aquariumPendingBagIndex = null;
    this.closeAquariumBagPick();
    this.clearAquariumRemoveConfirm();
    savePlayerData(this.playerData);
    this.preloadAquariumImages();
    this.updateUnifiedBookList();
    this.updateUnifiedBookDetail();
    this.updateAquariumFoodHud();
    this.showResult('入れかえた！', 1200);
  }

  private hasSwappableBagFish(): boolean {
    return this.playerData.inventory.some(
      (inv) => !inv.fishId.startsWith('junk_') && !!getFishById(inv.fishId),
    );
  }

  /** バッグから水槽向けに選べる魚の inventory インデックス（新しい順） */
  private getAquariumSelectableBagIndices(): number[] {
    const indices: number[] = [];
    const inv = this.playerData.inventory;
    for (let i = inv.length - 1; i >= 0; i--) {
      const entry = inv[i];
      if (!entry || entry.fishId.startsWith('junk_')) continue;
      if (!getFishById(entry.fishId)) continue;
      indices.push(i);
    }
    return indices;
  }

  private openAquariumBagPick(mode: 'add' | 'swap') {
    if (!this.unifiedBookUIElement) return;
    if (mode === 'swap') {
      const id = this.unifiedBookSelectedId;
      if (id?.startsWith('aquarium-slot-')) {
        const slotIdx = Number(id.replace('aquarium-slot-', ''));
        const entry = this.playerData.aquarium?.[slotIdx];
        if (entry && isSatiated(entry, Date.now())) {
          this.showResult('満腹中は入れかえられません', 1500);
          this.updateUnifiedBookDetail();
          return;
        }
      }
    }
    if (!this.hasSwappableBagFish()) {
      this.showResult('入れられる魚がバッグにいません', 1500);
      return;
    }
    this.aquariumBagPickMode = mode;
    this.aquariumBagPickNavIndex = 0;
    this.aquariumBagPickFocus = 'grid';
    this.aquariumPendingBagIndex = null;
    this.clearAquariumRemoveConfirm();
    this.renderAquariumBagPickModal();
    const layer = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-layer') as HTMLElement | null;
    if (layer) {
      layer.style.display = 'flex';
      layer.setAttribute('aria-hidden', 'false');
    }
    this.syncAquariumBagPickSelection();
    this.refreshKbSelectionPointer();
  }

  private closeAquariumBagPick() {
    const wasOpen = this.aquariumBagPickMode !== null;
    this.aquariumBagPickMode = null;
    this.aquariumBagPickNavIndex = 0;
    this.aquariumBagPickFocus = 'grid';
    this.aquariumPendingBagIndex = null;
    const layer = this.unifiedBookUIElement?.querySelector('#aquarium-bag-pick-layer') as HTMLElement | null;
    if (layer) {
      layer.style.display = 'none';
      layer.setAttribute('aria-hidden', 'true');
    }
    if (wasOpen) {
      this.syncAquariumKeyboardSelection();
      this.refreshKbSelectionPointer();
    }
  }

  private renderAquariumBagPickModal() {
    if (!this.unifiedBookUIElement || !this.aquariumBagPickMode) return;
    const title = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-title');
    const grid = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-grid') as HTMLElement | null;
    const empty = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-empty') as HTMLElement | null;
    if (!grid) return;

    if (title) {
      title.textContent = this.aquariumBagPickMode === 'swap' ? '入れかえる魚を選ぶ' : 'バッグから選ぶ';
    }

    grid.innerHTML = '';
    const indices = this.getAquariumSelectableBagIndices();
    if (empty) empty.style.display = indices.length === 0 ? 'block' : 'none';
    grid.style.display = indices.length === 0 ? 'none' : 'grid';

    indices.forEach((invIndex, displayIndex) => {
      const entry = this.playerData.inventory[invIndex];
      const fish = getFishById(entry.fishId);
      if (!fish) return;
      const row = this.createUnifiedBookListItem(fish, displayIndex, true, entry, {
        rowClassName: 'aquarium-bag-pick-card',
        markSelected: this.aquariumPendingBagIndex === invIndex,
        showSizePriceUnderName: true,
        onClick: () => {
          this.aquariumBagPickNavIndex = displayIndex;
          this.aquariumBagPickFocus = 'grid';
          this.applyAquariumBagPick(invIndex);
        },
      });
      row.setAttribute('role', 'listitem');
      row.setAttribute('data-inv-index', String(invIndex));
      row.setAttribute('data-pick-index', String(displayIndex));
      grid.appendChild(row);
    });

    if (this.aquariumBagPickNavIndex >= indices.length) {
      this.aquariumBagPickNavIndex = Math.max(0, indices.length - 1);
    }
    requestAnimationFrame(() => this.updateAquariumBagPickScrollFade());
  }

  private applyAquariumBagPick(inventoryIndex: number) {
    const mode = this.aquariumBagPickMode;
    if (!mode) return;
    if (mode === 'add') {
      this.tryAddAquariumFish(inventoryIndex);
      return;
    }
    const id = this.unifiedBookSelectedId;
    if (!id || !id.startsWith('aquarium-slot-')) return;
    const slotIdx = Number(id.replace('aquarium-slot-', ''));
    if (!Number.isFinite(slotIdx)) return;
    this.trySwapAquariumFish(slotIdx, inventoryIndex);
  }

  private getAquariumBagPickCards(): HTMLElement[] {
    const grid = this.unifiedBookUIElement?.querySelector('#aquarium-bag-pick-grid');
    if (!grid) return [];
    return Array.from(grid.querySelectorAll('.aquarium-bag-pick-card')) as HTMLElement[];
  }

  private syncAquariumBagPickSelection() {
    if (!this.unifiedBookUIElement || !this.aquariumBagPickMode) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const cards = this.getAquariumBagPickCards();
    cards.forEach((card, i) => {
      const on = kb && this.aquariumBagPickFocus === 'grid' && i === this.aquariumBagPickNavIndex;
      card.classList.toggle('is-nav-selected', on);
      card.querySelector('.book-ui-node')?.classList.toggle('is-nav-selected', on);
      if (on) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    const cancel = this.unifiedBookUIElement.querySelector('#aquarium-bag-pick-cancel');
    cancel?.classList.toggle('is-nav-selected', kb && this.aquariumBagPickFocus === 'cancel');
    this.refreshKbSelectionPointer();
    requestAnimationFrame(() => this.updateAquariumBagPickScrollFade());
  }

  private handleAquariumBagPickNavigation(dir: 'up' | 'down' | 'left' | 'right') {
    if (!this.aquariumBagPickMode) return;
    const cards = this.getAquariumBagPickCards();
    const cols = 3;

    if (this.aquariumBagPickFocus === 'cancel') {
      if (dir === 'up' || dir === 'left') {
        this.aquariumBagPickFocus = 'grid';
        if (cards.length > 0) {
          this.aquariumBagPickNavIndex = Math.min(this.aquariumBagPickNavIndex, cards.length - 1);
        }
        this.syncAquariumBagPickSelection();
      }
      return;
    }

    if (cards.length === 0) {
      this.aquariumBagPickFocus = 'cancel';
      this.syncAquariumBagPickSelection();
      return;
    }

    const idx = Math.max(0, Math.min(this.aquariumBagPickNavIndex, cards.length - 1));
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const lastRow = Math.floor((cards.length - 1) / cols);

    if (dir === 'left') {
      if (col > 0) this.aquariumBagPickNavIndex = idx - 1;
      else this.aquariumBagPickNavIndex = Math.min(idx + (cols - 1), cards.length - 1);
    } else if (dir === 'right') {
      if (col < cols - 1 && idx + 1 < cards.length) this.aquariumBagPickNavIndex = idx + 1;
      else this.aquariumBagPickNavIndex = row * cols;
    } else if (dir === 'up') {
      if (row > 0) this.aquariumBagPickNavIndex = idx - cols;
    } else if (dir === 'down') {
      if (row < lastRow && idx + cols < cards.length) {
        this.aquariumBagPickNavIndex = idx + cols;
      } else {
        this.aquariumBagPickFocus = 'cancel';
      }
    }
    this.syncAquariumBagPickSelection();
  }

  private triggerAquariumBagPickKeyboardAction() {
    if (!this.aquariumBagPickMode) return;
    if (this.aquariumBagPickFocus === 'cancel') {
      this.closeAquariumBagPick();
      return;
    }
    const cards = this.getAquariumBagPickCards();
    const card = cards[this.aquariumBagPickNavIndex];
    const invAttr = card?.getAttribute('data-inv-index');
    if (invAttr == null) return;
    const invIndex = Number(invAttr);
    if (!Number.isFinite(invIndex)) return;
    this.applyAquariumBagPick(invIndex);
  }

  /** 水槽データとランタイムを差分同期（既存魚の位置・遊泳は維持） */
  private syncAquariumRuntimesPreserving(opts?: { removedIndex?: number }) {
    this.preloadAquariumImages();
    const count = (this.playerData.aquarium ?? []).length;
    const prev = this.aquariumFishRuntimes;

    if (count === 0) {
      this.aquariumFishRuntimes = [];
      this.aquariumFx = this.aquariumFx.filter((fx) => fx.aquariumIndex === undefined);
      return;
    }

    if (opts?.removedIndex !== undefined) {
      const removed = opts.removedIndex;
      this.aquariumFishRuntimes = prev
        .filter((r) => r.aquariumIndex !== removed)
        .map((r) => {
          if (r.aquariumIndex > removed) r.aquariumIndex -= 1;
          return r;
        });
      this.aquariumFx = this.aquariumFx
        .filter((fx) => fx.aquariumIndex !== removed)
        .map((fx) => {
          if (fx.aquariumIndex !== undefined && fx.aquariumIndex > removed) {
            fx.aquariumIndex -= 1;
          }
          return fx;
        });
      return;
    }

    // addFishToAquarium は末尾 push なので、足りない分だけ追加
    if (prev.length < count) {
      for (let i = prev.length; i < count; i++) {
        const runtime = this.createAquariumRuntime(i);
        this.aquariumFishRuntimes.push(runtime);
        this.spawnAquariumIntroBubbles(runtime.x, runtime.y);
      }
      return;
    }

    if (prev.length > count) {
      // 削除ヒントなしのフォールバック
      this.initAquariumRuntimes();
    }
  }

  private renderAquariumBookList() {
    const slotsEl = this.unifiedBookUIElement?.querySelector('#aquarium-slots') as HTMLElement | null;
    if (!slotsEl) return;

    slotsEl.innerHTML = '';
    this.unifiedBookListItems = [];

    const now = Date.now();
    const slots = this.playerData.aquarium ?? [];
    for (let i = 0; i < AQUARIUM_CAPACITY; i++) {
      const entry = slots[i];
      const row = document.createElement('div');
      row.className = 'book-ui-row aquarium-slot-item';
      row.setAttribute('data-aquarium-id', `aquarium-slot-${i}`);
      row.setAttribute('data-index', String(i));
      row.setAttribute('role', 'listitem');

      const node = document.createElement('div');
      node.className = 'book-ui-node ui-frame-box aquarium-slot-card';
      if (!entry) node.classList.add('is-empty');

      if (entry) {
        const fish = getFishById(entry.fishId);
        const stage = getGrowthStage(entry.feedCount);
        const bonus = getAquariumBonusForEntry(entry);
        if (fish) node.setAttribute('data-rarity', String(fish.rarity));
        const thumb = document.createElement('div');
        thumb.className = 'aquarium-slot-thumb';
        if (fish && this.textures.exists(fish.id)) {
          const canvas = document.createElement('canvas');
          canvas.width = 80;
          canvas.height = 80;
          thumb.appendChild(canvas);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const frame = this.textures.getFrame(fish.id);
            const maxSize = 80;
            const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
            const width = frame.width * scale;
            const height = frame.height * scale;
            const sourceImage = frame.source.image as HTMLImageElement;
            if (sourceImage) {
              this.drawFishImageWithOutline(
                ctx,
                sourceImage,
                frame,
                (80 - width) / 2,
                (80 - height) / 2,
                width,
                height,
                2,
                '#ffffff',
              );
            }
          }
        } else {
          thumb.textContent = fish?.emoji ?? '🐟';
        }
        const info = document.createElement('div');
        info.className = 'aquarium-slot-info';
        const name = document.createElement('div');
        name.className = 'aquarium-slot-name';
        name.textContent = fish?.name ?? entry.fishId;
        const stageEl = document.createElement('div');
        stageEl.className = 'aquarium-slot-meta aquarium-slot-lv';
        stageEl.innerHTML = `<span class="aquarium-slot-lv-label">Lv.</span><span class="aquarium-slot-lv-num">${stage.level}</span>`;
        const bonusEl = document.createElement('div');
        bonusEl.className = 'aquarium-slot-meta aquarium-slot-bonus';
        bonusEl.innerHTML = `<span class="aquarium-slot-bonus-label">${this.aquariumStatInitial(bonus.stat)}</span><span class="aquarium-slot-bonus-num">+${this.formatAquariumPt(bonus.value)}</span>`;
        info.appendChild(name);
        info.appendChild(stageEl);
        info.appendChild(bonusEl);
        node.appendChild(thumb);
        node.appendChild(info);
        if (
          entry.size !== undefined &&
          fish &&
          fish.maxSize > 0 &&
          isBigSizeRatio(entry.size / fish.maxSize)
        ) {
          const bigLabel = document.createElement('img');
          bigLabel.className = 'book-list-item-big-label';
          bigLabel.src = '/images/Fishing Result UI/Big-label.svg';
          bigLabel.alt = 'Big';
          node.appendChild(bigLabel);
        }
        if (isSatiated(entry, now)) {
          const badge = document.createElement('span');
          badge.className = 'aquarium-satiety-badge';
          badge.textContent = '満腹';
          node.appendChild(badge);
        }
      } else {
        const plus = document.createElement('div');
        plus.className = 'aquarium-slot-empty-label';
        plus.textContent = '＋ 空き';
        node.appendChild(plus);
      }

      row.appendChild(node);
      const idx = i;
      row.addEventListener('click', () => {
        this.selectAquariumBookItem(`aquarium-slot-${idx}`, idx);
        this.aquariumNavArea = 'slots';
        this.openAquariumDetail();
      });
      slotsEl.appendChild(row);
      this.unifiedBookListItems.push(row);
    }

    this.renderAquariumBonusChips();

    // 再描画後も選択を復元
    const selIdx = this.unifiedBookSelectedIndex;
    if (selIdx !== null && this.unifiedBookListItems[selIdx]) {
      this.unifiedBookListItems.forEach((el, i) => {
        const on = i === selIdx;
        el.classList.toggle('is-selected', on);
        el.classList.toggle('state-selected', on);
      });
    }
    this.syncAquariumKeyboardSelection();
  }

  private updateAquariumBookDetail() {
    const detailEl = this.unifiedBookUIElement?.querySelector('#aquarium-manage-detail') as HTMLElement | null;
    if (!detailEl) return;

    // 通常ペインは使わない
    const statusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    const skillPanel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
    if (statusPanel) statusPanel.style.display = 'none';
    if (skillPanel) skillPanel.style.display = 'none';
    if (this.unifiedBookDetailPlaceholderElement) this.unifiedBookDetailPlaceholderElement.style.display = 'none';
    if (this.unifiedBookDetailElement) this.unifiedBookDetailElement.classList.remove('active');

    detailEl.innerHTML = '';
    const id = this.unifiedBookSelectedId;
    if (!id || !id.startsWith('aquarium-slot-')) {
      this.renderAquariumIdleDetail();
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'aquarium-detail-panel';
    const slotIdx = Number(id.replace('aquarium-slot-', ''));
    const entry = this.playerData.aquarium[slotIdx];

    if (entry) {
      const fish = getFishById(entry.fishId);
      const stage = getGrowthStage(entry.feedCount);
      const next = getNextGrowthStage(entry.feedCount);

      // ── 名前 + サイズバッジ ──
      const topBlock = document.createElement('div');
      topBlock.className = 'aquarium-detail-top';

      const nameRow = document.createElement('div');
      nameRow.className = 'aquarium-detail-name-row';
      const noteTitle = document.createElement('p');
      noteTitle.className = 'aquarium-detail-note-title';
      noteTitle.textContent = fish?.name ?? entry.fishId;
      const sizeBadge = document.createElement('div');
      sizeBadge.className = 'aquarium-detail-size-badge';
      if (entry.size !== undefined) {
        const sizeNum = document.createElement('span');
        sizeNum.className = 'aquarium-detail-size-num';
        sizeNum.textContent = entry.size.toFixed(1);
        const sizeUnit = document.createElement('span');
        sizeUnit.className = 'aquarium-detail-size-unit';
        sizeUnit.textContent = 'cm';
        sizeBadge.appendChild(sizeNum);
        sizeBadge.appendChild(sizeUnit);
      } else {
        const sizeNum = document.createElement('span');
        sizeNum.className = 'aquarium-detail-size-num';
        sizeNum.textContent = '-';
        sizeBadge.appendChild(sizeNum);
      }
      nameRow.appendChild(noteTitle);
      nameRow.appendChild(sizeBadge);

      // ── Lv + 成長ゲージ ──
      const lvGaugeRow = document.createElement('div');
      lvGaugeRow.className = 'aquarium-detail-lv-gauge-row';
      const lvLine = document.createElement('div');
      lvLine.className = 'aquarium-detail-lv';
      lvLine.innerHTML = `<span class="aquarium-detail-lv-label">Lv.</span><span class="aquarium-detail-lv-num">${stage.level}</span>`;
      const growthRow = document.createElement('div');
      growthRow.className = 'aquarium-detail-growth-row';
      const gauge = document.createElement('div');
      gauge.className = 'aquarium-growth-gauge';
      const fill = document.createElement('div');
      fill.className = 'aquarium-growth-gauge-fill';
      if (next) {
        const cur = entry.feedCount - stage.requiredFeeds;
        const need = next.requiredFeeds - stage.requiredFeeds;
        const pct = need > 0 ? Math.min(100, (cur / need) * 100) : 100;
        fill.style.width = `${pct}%`;
      } else {
        fill.style.width = '100%';
      }
      gauge.appendChild(fill);
      growthRow.appendChild(gauge);
      lvGaugeRow.appendChild(lvLine);
      lvGaugeRow.appendChild(growthRow);

      topBlock.appendChild(nameRow);
      topBlock.appendChild(lvGaugeRow);

      // ── 状態 ──
      const statusRow = document.createElement('div');
      statusRow.className = 'aquarium-detail-status-row';
      const statusBadge = document.createElement('div');
      statusBadge.className = 'aquarium-detail-status-badge';
      statusBadge.textContent = '状態';
      const satietyEl = document.createElement('p');
      satietyEl.className = 'aquarium-satiety-text';
      const rem = getSatietyRemainingMs(entry, Date.now());
      if (isAquariumMaxGrowth(entry)) {
        satietyEl.textContent = 'これ以上成長しない';
      } else {
        satietyEl.textContent =
          rem > 0 ? `満腹（あと${Math.ceil(rem / 1000)}秒）` : 'おなかがすいている';
      }
      statusRow.appendChild(statusBadge);
      statusRow.appendChild(satietyEl);

      wrap.appendChild(topBlock);
      wrap.appendChild(statusRow);

      // ── アクション（バッグに戻す / 入れかえる） ──
      const bagFull = this.playerData.inventory.length >= this.playerData.maxInventorySlots;
      const canSwap = this.hasSwappableBagFish();
      const satiated = isSatiated(entry, Date.now());
      const actions = document.createElement('div');
      actions.className = 'aquarium-detail-actions';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'nes-btn ui-frame-box aquarium-detail-action';
      if (satiated) {
        removeBtn.disabled = true;
        removeBtn.textContent = '満腹中は不可';
        removeBtn.classList.add('is-disabled');
      } else if (bagFull) {
        removeBtn.disabled = true;
        removeBtn.textContent = 'バッグがいっぱい';
        removeBtn.classList.add('is-disabled');
      } else if (this.aquariumRemoveConfirmIndex === slotIdx) {
        removeBtn.textContent = 'もう一度で確定';
        removeBtn.classList.add('is-confirm');
      } else {
        removeBtn.textContent = 'バッグに戻す';
      }
      removeBtn.addEventListener('click', () => {
        if (satiated) return;
        this.closeAquariumBagPick();
        this.tryRemoveAquariumFish(slotIdx);
      });

      const swapBtn = document.createElement('button');
      swapBtn.type = 'button';
      swapBtn.className = 'nes-btn ui-frame-box aquarium-detail-action';
      if (satiated) {
        swapBtn.disabled = true;
        swapBtn.textContent = '満腹中は不可';
        swapBtn.classList.add('is-disabled');
      } else if (!canSwap) {
        swapBtn.disabled = true;
        swapBtn.textContent = '入れかえる';
        swapBtn.classList.add('is-disabled');
      } else {
        swapBtn.textContent = '入れかえる';
      }
      swapBtn.addEventListener('click', () => {
        if (satiated || !canSwap) return;
        this.openAquariumBagPick('swap');
      });

      actions.appendChild(removeBtn);
      actions.appendChild(swapBtn);
      wrap.appendChild(actions);
      detailEl.appendChild(wrap);
      this.syncAquariumKeyboardSelection();
      return;
    }

    const tipTitle = document.createElement('p');
    tipTitle.className = 'aquarium-detail-note-title';
    tipTitle.textContent = 'Empty';
    const tip = document.createElement('p');
    tip.className = 'aquarium-detail-tip';
    tip.textContent = 'バッグの魚を選んで水槽に入れる';
    wrap.appendChild(tipTitle);
    wrap.appendChild(tip);

    const canAdd = this.hasSwappableBagFish();
    const full = (this.playerData.aquarium?.length ?? 0) >= AQUARIUM_CAPACITY;
    const actions = document.createElement('div');
    actions.className = 'aquarium-detail-actions';
    const pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.className = 'nes-btn ui-frame-box aquarium-detail-action';
    if (full) {
      pickBtn.disabled = true;
      pickBtn.textContent = '水槽がいっぱい';
      pickBtn.classList.add('is-disabled');
    } else if (!canAdd) {
      pickBtn.disabled = true;
      pickBtn.textContent = 'バッグに魚なし';
      pickBtn.classList.add('is-disabled');
    } else {
      pickBtn.textContent = 'バッグから選ぶ';
    }
    pickBtn.addEventListener('click', () => {
      if (!canAdd || full) return;
      this.openAquariumBagPick('add');
    });
    actions.appendChild(pickBtn);
    wrap.appendChild(actions);
    detailEl.appendChild(wrap);
    this.syncAquariumKeyboardSelection();
  }

  createAquariumUI() {
    // タブ内常時表示キャンバスの参照を張る（モーダルは使わない）
    if (!this.unifiedBookUIElement) return;
    this.aquariumUIElement = this.unifiedBookUIElement.querySelector('#book-aquarium-panel') as HTMLElement | null;
    this.aquariumCanvasEl = this.unifiedBookUIElement.querySelector('#aquarium-canvas') as HTMLCanvasElement | null;
    this.bindAquariumFoodSelect();
    if (!this.aquariumCanvasEl || this.aquariumCanvasBound) return;

    this.aquariumCanvasBound = true;
    this.aquariumCanvasEl.addEventListener('pointerenter', () => {
      this.aquariumPointerOverCanvas = true;
    });
    this.aquariumCanvasEl.addEventListener('pointerleave', () => {
      this.aquariumPointerOverCanvas = false;
    });
    this.aquariumCanvasEl.addEventListener('mousemove', (e) => {
      if (!this.aquariumCanvasEl) return;
      if (this.unifiedBookTab !== 'aquarium') return;
      this.aquariumPointerOverCanvas = true;
      this.aquariumAimX = this.aquariumClientXToAimX(e.clientX);
    });
    this.aquariumCanvasEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.unifiedBookTab !== 'aquarium') return;
      this.aquariumPointerOverCanvas = true;
      this.aquariumAimX = this.aquariumClientXToAimX(e.clientX);
      this.tryDropAquariumFood();
    });
  }

  private setAquariumSelectedFoodTier(tier: AquariumFoodTier) {
    if (getAquariumFoodCount(this.playerData, tier) <= 0) return;
    this.aquariumSelectedFoodTier = tier;
    this.playerData.aquariumSelectedFoodTier = tier;
    savePlayerData(this.playerData);
    this.updateAquariumFoodHud();
    this.syncAquariumKeyboardSelection();
  }

  /** 所持0のエサから、使える方へ選択を逃がす */
  private ensureAquariumFoodSelectionAvailable() {
    if (getAquariumFoodCount(this.playerData, this.aquariumSelectedFoodTier) > 0) return;
    const fallback: AquariumFoodTier =
      this.aquariumSelectedFoodTier === 'normal' ? 'premium' : 'normal';
    if (getAquariumFoodCount(this.playerData, fallback) <= 0) return;
    this.aquariumSelectedFoodTier = fallback;
    this.playerData.aquariumSelectedFoodTier = fallback;
    savePlayerData(this.playerData);
  }

  private bindAquariumFoodSelect() {
    if (!this.aquariumUIElement || this.aquariumFoodSelectBound) return;
    const root = this.aquariumUIElement.querySelector('.aquarium-food-select');
    if (!root) return;
    this.aquariumFoodSelectBound = true;
    root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement | null)?.closest('[data-food-tier]') as HTMLElement | null;
      if (!btn || btn.classList.contains('is-disabled') || (btn as HTMLButtonElement).disabled) return;
      e.stopPropagation();
      const tier = btn.getAttribute('data-food-tier');
      if (tier !== 'normal' && tier !== 'premium') return;
      this.setAquariumSelectedFoodTier(tier);
    });
  }

  /** object-fit: cover のクロップを考慮したキャンバス内部 X 座標 */
  private aquariumClientXToAimX(clientX: number): number {
    if (!this.aquariumCanvasEl) return 480;
    const rect = this.aquariumCanvasEl.getBoundingClientRect();
    const scale = Math.max(rect.width / AQUARIUM_CANVAS_W, rect.height / AQUARIUM_CANVAS_H);
    const contentW = AQUARIUM_CANVAS_W * scale;
    const offsetX = (rect.width - contentW) / 2;
    const x = ((clientX - rect.left - offsetX) / contentW) * AQUARIUM_CANVAS_W;
    return Math.max(AQUARIUM_SWIM_X_MIN, Math.min(AQUARIUM_SWIM_X_MAX, x));
  }

  /** object-fit: cover で隠れる上下余白（キャンバス座標） */
  private getAquariumCoverCropTop(): number {
    if (!this.aquariumCanvasEl) return 0;
    const rect = this.aquariumCanvasEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return 0;
    const scale = Math.max(rect.width / AQUARIUM_CANVAS_W, rect.height / AQUARIUM_CANVAS_H);
    const contentH = AQUARIUM_CANVAS_H * scale;
    return Math.max(0, (contentH - rect.height) / (2 * scale));
  }

  private startAquariumTankLoop() {
    if (!hasAquarium(this.playerData)) return;
    if (!this.aquariumCanvasEl) this.createAquariumUI();
    if (this.aquariumRafId !== null) return;

    this.updateAquariumFoodHud();
    this.preloadAquariumImages();
    if (this.aquariumFishRuntimes.length !== (this.playerData.aquarium?.length ?? 0)) {
      this.initAquariumRuntimes();
    }
    this.aquariumPellets = [];
    this.aquariumFx = [];
    this.aquariumBubbles = [];
    this.aquariumGodRays = [];
    this.seedAquariumBubbles(performance.now() / 1000);
    this.seedAquariumGodRays();
    this.aquariumLastFrameAt = performance.now();
    this.aquariumAimX = AQUARIUM_CANVAS_W / 2;
    this.bindAquariumKeys(true);

    const loop = (now: number) => {
      if (this.unifiedBookTab !== 'aquarium' || !this.unifiedBookOpen) {
        this.aquariumRafId = null;
        return;
      }
      this.aquariumRafId = requestAnimationFrame(loop);
      let dt = (now - this.aquariumLastFrameAt) / 1000;
      this.aquariumLastFrameAt = now;
      dt = Math.min(dt, 0.05);
      this.tickAquariumView(dt, now / 1000);
      this.drawAquariumView(now / 1000);
    };
    this.aquariumRafId = requestAnimationFrame(loop);
  }

  private stopAquariumTankLoop() {
    this.bindAquariumKeys(false);
    this.aquariumPointerOverCanvas = false;
    if (this.aquariumRafId !== null) {
      cancelAnimationFrame(this.aquariumRafId);
      this.aquariumRafId = null;
    }
    this.aquariumPellets = [];
    this.aquariumFx = [];
    this.aquariumGodRays = [];
    savePlayerData(this.playerData);
  }

  // 後方互換名（内部からは stop/start を使う）
  openAquariumView() {
    this.startAquariumTankLoop();
  }

  closeAquariumView() {
    this.stopAquariumTankLoop();
  }

  private bindAquariumKeys(on: boolean) {
    if (on) {
      if (this.aquariumKeyHandler) return;
      this.aquariumKeyHandler = (e: KeyboardEvent) => {
        if (!this.unifiedBookOpen || this.unifiedBookTab !== 'aquarium') return;
        if (this.skillUnlockConfirmPendingNodeId) return;
        // スロット操作と衝突しないよう、矢印は管理ナビに任せ、投下は水槽フォーカス時のみ
        if (e.key === 'z' || e.key === 'Z' || e.key === ' ') {
          if (this.aquariumNavArea !== 'tank') return;
          e.preventDefault();
          e.stopPropagation();
          this.tryDropAquariumFood();
        }
      };
      window.addEventListener('keydown', this.aquariumKeyHandler, true);
    } else if (this.aquariumKeyHandler) {
      window.removeEventListener('keydown', this.aquariumKeyHandler, true);
      this.aquariumKeyHandler = null;
    }
  }

  private renderAquariumBonusChips() {
    const bonusEl = this.unifiedBookUIElement?.querySelector('#aquarium-summary-bonus');
    if (!bonusEl) return;
    const totals = getAquariumStatBonuses(this.playerData);
    const chips: Array<{ key: string; label: string; value: number }> = [
      { key: 'power', label: 'P', value: totals.powerAdd },
      { key: 'speed', label: 'S', value: totals.speedAdd },
      { key: 'technique', label: 'T', value: totals.techniqueAdd },
      { key: 'control', label: 'C', value: totals.controlAdd },
    ];
    const chipHtml = chips
      .map(
        (c) =>
          `<span class="aquarium-bonus-chip${c.value > 0 ? ' is-active' : ''}" data-stat="${c.key}"><span class="aquarium-bonus-chip-label">${c.label}</span><span class="aquarium-bonus-chip-value">+${this.formatAquariumPt(c.value)}</span></span>`,
      )
      .join('');
    bonusEl.innerHTML = `<span class="aquarium-bonus-chips-title">STATUS BONUS</span>${chipHtml}`;
  }

  private updateAquariumFoodHud() {
    const root = this.aquariumUIElement ?? this.unifiedBookUIElement;
    this.ensureAquariumFoodSelectionAvailable();

    const normalEl = root?.querySelector('#aquarium-food-count-value');
    if (normalEl) normalEl.textContent = String(getAquariumFoodCount(this.playerData, 'normal'));
    const premiumEl = root?.querySelector('#aquarium-premium-food-count-value');
    if (premiumEl) premiumEl.textContent = String(getAquariumFoodCount(this.playerData, 'premium'));

    root?.querySelectorAll<HTMLElement>('[data-food-tier]').forEach((btn) => {
      const tier = btn.getAttribute('data-food-tier');
      if (tier !== 'normal' && tier !== 'premium') return;
      const empty = getAquariumFoodCount(this.playerData, tier) <= 0;
      const selected = tier === this.aquariumSelectedFoodTier;
      btn.classList.toggle('is-disabled', empty);
      btn.classList.toggle('is-selected', selected && !empty);
      btn.setAttribute('aria-pressed', selected && !empty ? 'true' : 'false');
      btn.setAttribute('aria-disabled', empty ? 'true' : 'false');
      if (btn instanceof HTMLButtonElement) btn.disabled = empty;
    });

    this.renderAquariumBonusChips();
  }

  private preloadAquariumImages() {
    for (const entry of this.playerData.aquarium ?? []) {
      if (this.aquariumFishImages.has(entry.fishId)) continue;
      const path = getFishImagePath(entry.fishId);
      if (!path) continue;
      const img = new Image();
      img.src = path;
      this.aquariumFishImages.set(entry.fishId, img);
    }
    if (!this.aquariumBgImage && !this.aquariumBgFailed) {
      const bg = new Image();
      bg.onload = () => {
        this.aquariumBgImage = bg;
        this.aquariumBgCache = this.createAquariumLayerCache(bg);
      };
      bg.onerror = () => {
        this.aquariumBgFailed = true;
        this.aquariumBgImage = null;
        this.aquariumBgCache = null;
      };
      bg.src = '/images/ui/Book%20UI/aquariumbg.png';
    }
    if (!this.aquariumFgCache && !this.aquariumFgFailed) {
      const fg = new Image();
      fg.onload = () => {
        this.aquariumFgCache = this.createAquariumLayerCache(fg);
      };
      fg.onerror = () => {
        this.aquariumFgFailed = true;
        this.aquariumFgCache = null;
      };
      fg.src = '/images/ui/Book%20UI/aquariumbga.png';
    }
  }

  private createAquariumLayerCache(img: HTMLImageElement): HTMLCanvasElement {
    const cache = document.createElement('canvas');
    cache.width = AQUARIUM_CANVAS_W;
    cache.height = AQUARIUM_CANVAS_H;
    const cctx = cache.getContext('2d');
    if (cctx) {
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(img, 0, 0, AQUARIUM_CANVAS_W, AQUARIUM_CANVAS_H);
    }
    return cache;
  }

  /** 枠は固定のまま、内側だけ横帯ずらしで水中ゆらぎを描く */
  private drawAquariumWarpedLayer(
    ctx: CanvasRenderingContext2D,
    cache: HTMLCanvasElement,
    timeSec: number,
  ) {
    drawWaterWarpPostEffect(ctx, cache, timeSec, {
      width: AQUARIUM_CANVAS_W,
      height: AQUARIUM_CANVAS_H,
      insetL: AQUARIUM_BG_WARP_INSET_L,
      insetR: AQUARIUM_BG_WARP_INSET_R,
      insetT: AQUARIUM_BG_WARP_INSET_T,
      insetB: AQUARIUM_BG_WARP_INSET_B,
    });
  }

  private drawAquariumBackground(ctx: CanvasRenderingContext2D, timeSec: number) {
    const cache = this.aquariumBgCache;
    if (cache) {
      this.drawAquariumWarpedLayer(ctx, cache, timeSec);
      return;
    }

    const g = ctx.createLinearGradient(0, 0, 0, AQUARIUM_CANVAS_H);
    g.addColorStop(0, '#173e5e');
    g.addColorStop(1, '#0b2036');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, AQUARIUM_CANVAS_W, AQUARIUM_CANVAS_H);
    ctx.fillStyle = 'rgba(180, 220, 255, 0.15)';
    for (let i = 0; i < 8; i++) {
      const bx = (i * 137 + timeSec * 20) % AQUARIUM_CANVAS_W;
      const by = 80 + ((i * 97 + timeSec * 30) % 400);
      ctx.beginPath();
      ctx.arc(bx, by, 4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private aquariumSpriteSize(entry: { fishId: string; feedCount: number; size?: number }): number {
    const fish = getFishById(entry.fishId);
    const stage = getGrowthStage(entry.feedCount);
    const maxSize = fish?.maxSize ?? 50;
    const sizeRatio =
      entry.size !== undefined && maxSize > 0 ? entry.size / maxSize : 0.75;
    return (
      AQUARIUM_FISH_BASE_SIZE *
      stage.spriteScale *
      getAquariumSpeciesScale(maxSize) *
      getAquariumIndividualScale(sizeRatio)
    );
  }

  private pickCruiseTarget(runtime: AquariumFishRuntime): void {
    const randY = AQUARIUM_SWIM_Y_MIN + Math.random() * (AQUARIUM_SWIM_Y_MAX - AQUARIUM_SWIM_Y_MIN);
    runtime.targetX = AQUARIUM_SWIM_X_MIN + Math.random() * (AQUARIUM_SWIM_X_MAX - AQUARIUM_SWIM_X_MIN);
    runtime.targetY = (randY + runtime.homeY) / 2;
  }

  private pickDashTarget(runtime: AquariumFishRuntime): void {
    const range = AQUARIUM_DASH_RANGE_MIN + Math.random() * (AQUARIUM_DASH_RANGE_MAX - AQUARIUM_DASH_RANGE_MIN);
    const angle = Math.random() * Math.PI * 2;
    runtime.targetX = Math.max(
      AQUARIUM_SWIM_X_MIN,
      Math.min(AQUARIUM_SWIM_X_MAX, runtime.x + Math.cos(angle) * range),
    );
    runtime.targetY = Math.max(
      AQUARIUM_SWIM_Y_MIN,
      Math.min(AQUARIUM_SWIM_Y_MAX, runtime.y + Math.sin(angle) * range * 0.55),
    );
  }

  private beginAquariumState(runtime: AquariumFishRuntime, state: AquariumSwimState, timeSec: number) {
    runtime.state = state;
    if (state === 'cruise') {
      this.pickCruiseTarget(runtime);
      runtime.stateUntil =
        timeSec +
        AQUARIUM_CRUISE_DURATION_MIN +
        Math.random() * (AQUARIUM_CRUISE_DURATION_MAX - AQUARIUM_CRUISE_DURATION_MIN);
    } else if (state === 'idle') {
      runtime.stateUntil =
        timeSec +
        AQUARIUM_IDLE_DURATION_MIN +
        Math.random() * (AQUARIUM_IDLE_DURATION_MAX - AQUARIUM_IDLE_DURATION_MIN);
    } else {
      this.pickDashTarget(runtime);
      runtime.stateUntil =
        timeSec +
        AQUARIUM_DASH_DURATION_MIN +
        Math.random() * (AQUARIUM_DASH_DURATION_MAX - AQUARIUM_DASH_DURATION_MIN);
    }
  }

  private transitionFromCruise(runtime: AquariumFishRuntime, timeSec: number, satiated: boolean) {
    const idleP = satiated ? AQUARIUM_CRUISE_TO_IDLE_SATIATED_P : AQUARIUM_CRUISE_TO_IDLE_P;
    const r = Math.random();
    if (r < idleP) this.beginAquariumState(runtime, 'idle', timeSec);
    else if (r < idleP + AQUARIUM_CRUISE_TO_DASH_P) this.beginAquariumState(runtime, 'dash', timeSec);
    else this.beginAquariumState(runtime, 'cruise', timeSec);
  }

  private createAquariumRuntime(aquariumIndex: number): AquariumFishRuntime {
    const homeY = AQUARIUM_HOME_Y_MIN + Math.random() * AQUARIUM_HOME_Y_RANGE;
    const runtime: AquariumFishRuntime = {
      aquariumIndex,
      x: AQUARIUM_SWIM_X_MIN + 60 + Math.random() * 720,
      y: homeY,
      vx: 0,
      vy: 0,
      targetX: AQUARIUM_SWIM_X_MIN + 60 + Math.random() * 720,
      targetY: homeY,
      mode: 'wander',
      phase: Math.random() * Math.PI * 2,
      facing: -1,
      pitch: 0,
      state: 'cruise',
      stateUntil: 0,
      speedMul: AQUARIUM_SPEED_MUL_MIN + Math.random() * AQUARIUM_SPEED_MUL_RANGE,
      homeY,
    };
    this.beginAquariumState(runtime, 'cruise', performance.now() / 1000);
    return runtime;
  }

  private initAquariumRuntimes() {
    this.aquariumFishRuntimes = (this.playerData.aquarium ?? []).map((_entry, aquariumIndex) =>
      this.createAquariumRuntime(aquariumIndex),
    );
  }

  private tryDropAquariumFood() {
    const now = Date.now();
    if (now - this.aquariumLastFeedAt < AQUARIUM_FEED_COOLDOWN_MS) return;
    if (this.aquariumPellets.length >= 3) return;
    if ((this.playerData.aquarium?.length ?? 0) === 0) {
      return;
    }

    const tier = this.aquariumSelectedFoodTier;
    if (getAquariumFoodCount(this.playerData, tier) <= 0) {
      return;
    }

    addAquariumFoodCount(this.playerData, tier, -1);
    savePlayerData(this.playerData);
    this.aquariumLastFeedAt = now;
    this.aquariumPellets.push({
      x: this.aquariumAimX,
      y: 30,
      swayPhase: Math.random() * Math.PI * 2,
      tier,
    });
    this.updateAquariumFoodHud();
  }

  private createAquariumBubble(yOverride?: number): AquariumBubble {
    const spawn = AQUARIUM_BUBBLE_SPAWNS[Math.floor(Math.random() * AQUARIUM_BUBBLE_SPAWNS.length)];
    const jitterX = (Math.random() - 0.5) * 18;
    const jitterY = (Math.random() - 0.5) * 10;
    const baseX = spawn.x + jitterX;
    const r =
      AQUARIUM_BUBBLE_RADIUS_MIN +
      Math.random() * (AQUARIUM_BUBBLE_RADIUS_MAX - AQUARIUM_BUBBLE_RADIUS_MIN);
    const yBottom = spawn.y + jitterY;
    const y =
      yOverride !== undefined
        ? yOverride
        : yBottom;
    return {
      baseX,
      x: baseX,
      y,
      r,
      riseSpeed:
        AQUARIUM_BUBBLE_RISE_MIN +
        Math.random() * (AQUARIUM_BUBBLE_RISE_MAX - AQUARIUM_BUBBLE_RISE_MIN),
      swayAmp:
        AQUARIUM_BUBBLE_SWAY_AMP_MIN +
        Math.random() * (AQUARIUM_BUBBLE_SWAY_AMP_MAX - AQUARIUM_BUBBLE_SWAY_AMP_MIN),
      swayFreq:
        AQUARIUM_BUBBLE_SWAY_FREQ_MIN +
        Math.random() * (AQUARIUM_BUBBLE_SWAY_FREQ_MAX - AQUARIUM_BUBBLE_SWAY_FREQ_MIN),
      swayPhase: Math.random() * Math.PI * 2,
    };
  }

  /** 魚投入位置に単発の気泡バーストを出す */
  private spawnAquariumIntroBubbles(x: number, y: number) {
    const spread = AQUARIUM_INTRO_BUBBLE_SPREAD;
    for (let i = 0; i < AQUARIUM_INTRO_BUBBLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * spread;
      const baseX = x + Math.cos(angle) * dist;
      const by = y + Math.sin(angle) * dist * 0.55;
      const r =
        AQUARIUM_BUBBLE_RADIUS_MIN +
        Math.random() * (AQUARIUM_BUBBLE_RADIUS_MAX - AQUARIUM_BUBBLE_RADIUS_MIN) * 1.4;
      this.aquariumBubbles.push({
        baseX,
        x: baseX,
        y: by,
        r,
        riseSpeed:
          (AQUARIUM_BUBBLE_RISE_MIN +
            Math.random() * (AQUARIUM_BUBBLE_RISE_MAX - AQUARIUM_BUBBLE_RISE_MIN)) *
          AQUARIUM_INTRO_BUBBLE_RISE_MUL,
        swayAmp:
          AQUARIUM_BUBBLE_SWAY_AMP_MIN +
          Math.random() * (AQUARIUM_BUBBLE_SWAY_AMP_MAX - AQUARIUM_BUBBLE_SWAY_AMP_MIN),
        swayFreq:
          AQUARIUM_BUBBLE_SWAY_FREQ_MIN +
          Math.random() * (AQUARIUM_BUBBLE_SWAY_FREQ_MAX - AQUARIUM_BUBBLE_SWAY_FREQ_MIN),
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  /** 表示直後から気泡が見えるよう、上昇途中の位置に事前配置する */
  private seedAquariumBubbles(timeSec: number) {
    const yMin = AQUARIUM_BUBBLE_DESPAWN_Y + 20;
    const yMax = 500;
    for (let i = 0; i < AQUARIUM_BUBBLE_SEED_COUNT; i++) {
      if (this.aquariumBubbles.length >= AQUARIUM_BUBBLE_MAX) break;
      // 下寄りに偏らせず、水槽内にばらまく
      const t = (i + Math.random()) / AQUARIUM_BUBBLE_SEED_COUNT;
      const y = yMax - t * (yMax - yMin);
      const bubble = this.createAquariumBubble(y);
      bubble.x = bubble.baseX + Math.sin(timeSec * bubble.swayFreq + bubble.swayPhase) * bubble.swayAmp;
      this.aquariumBubbles.push(bubble);
    }
  }

  private tickAquariumBubbles(dt: number, timeSec: number) {
    if (this.aquariumBubbles.length < AQUARIUM_BUBBLE_MAX) {
      const spawnChance = AQUARIUM_BUBBLE_SPAWN_PER_SEC * dt;
      if (Math.random() < spawnChance) {
        this.aquariumBubbles.push(this.createAquariumBubble());
      }
    }

    for (const b of this.aquariumBubbles) {
      b.y -= b.riseSpeed * dt;
      b.x = b.baseX + Math.sin(timeSec * b.swayFreq + b.swayPhase) * b.swayAmp;
    }
    this.aquariumBubbles = this.aquariumBubbles.filter((b) => b.y + b.r > AQUARIUM_BUBBLE_DESPAWN_Y);
  }

  private createAquariumGodRay(ageOverride?: number): AquariumGodRay {
    const life =
      AQUARIUM_GODRAY_LIFE_MIN +
      Math.random() * (AQUARIUM_GODRAY_LIFE_MAX - AQUARIUM_GODRAY_LIFE_MIN);
    const halfW =
      AQUARIUM_GODRAY_HALF_W_MIN +
      Math.random() * (AQUARIUM_GODRAY_HALF_W_MAX - AQUARIUM_GODRAY_HALF_W_MIN);
    const length =
      AQUARIUM_GODRAY_LENGTH_MIN +
      Math.random() * (AQUARIUM_GODRAY_LENGTH_MAX - AQUARIUM_GODRAY_LENGTH_MIN);
    const startX =
      AQUARIUM_GODRAY_X_CENTER + (Math.random() - 0.5) * 2 * AQUARIUM_GODRAY_SPAWN_SPREAD;
    const goRight = Math.random() < 0.5;
    const edgeX = goRight
      ? AQUARIUM_CANVAS_W - AQUARIUM_GODRAY_EDGE_INSET
      : AQUARIUM_GODRAY_EDGE_INSET;
    const travelFrac =
      AQUARIUM_GODRAY_TRAVEL_FRAC_MIN +
      Math.random() * (AQUARIUM_GODRAY_TRAVEL_FRAC_MAX - AQUARIUM_GODRAY_TRAVEL_FRAC_MIN);
    const targetX = startX + (edgeX - startX) * travelFrac;
    const driftVx = (targetX - startX) / life;
    const age = ageOverride ?? 0;
    return {
      x: startX + driftVx * age,
      halfW,
      length,
      life,
      age,
      driftVx,
      maxAlpha: AQUARIUM_GODRAY_MAX_ALPHA * (0.65 + Math.random() * 0.35),
    };
  }

  private seedAquariumGodRays() {
    for (let i = 0; i < AQUARIUM_GODRAY_SEED_COUNT; i++) {
      if (this.aquariumGodRays.length >= AQUARIUM_GODRAY_MAX) break;
      const ray = this.createAquariumGodRay();
      // 表示直後から途中フェーズで見えるよう、寿命の前半にばらまく
      ray.age = ray.life * (0.15 + Math.random() * 0.45);
      this.aquariumGodRays.push(ray);
    }
  }

  private tickAquariumGodRays(dt: number) {
    if (this.aquariumGodRays.length < AQUARIUM_GODRAY_MAX) {
      if (Math.random() < AQUARIUM_GODRAY_SPAWN_PER_SEC * dt) {
        this.aquariumGodRays.push(this.createAquariumGodRay());
      }
    }
    for (const ray of this.aquariumGodRays) {
      ray.age += dt;
      ray.x += ray.driftVx * dt;
    }
    this.aquariumGodRays = this.aquariumGodRays.filter((ray) => ray.age < ray.life);
  }

  private godRayAlpha(ray: AquariumGodRay): number {
    const t = ray.age / ray.life;
    let fade = 1;
    if (t < AQUARIUM_GODRAY_FADE_IN_FRAC) {
      fade = t / AQUARIUM_GODRAY_FADE_IN_FRAC;
    } else if (t > 1 - AQUARIUM_GODRAY_FADE_OUT_FRAC) {
      fade = (1 - t) / AQUARIUM_GODRAY_FADE_OUT_FRAC;
    }
    // わずかな明滅
    const shimmer = 0.88 + 0.12 * Math.sin(ray.age * 2.4 + ray.x * 0.01);
    return ray.maxAlpha * fade * shimmer;
  }

  private drawAquariumGodRays(ctx: CanvasRenderingContext2D, _timeSec: number) {
    if (this.aquariumGodRays.length === 0) return;

    const insetL = AQUARIUM_BG_WARP_INSET_L;
    const insetR = AQUARIUM_BG_WARP_INSET_R;
    const insetT = AQUARIUM_BG_WARP_INSET_T;
    const insetB = AQUARIUM_BG_WARP_INSET_B;
    const innerW = AQUARIUM_CANVAS_W - insetL - insetR;
    const innerH = AQUARIUM_CANVAS_H - insetT - insetB;
    if (innerW <= 0 || innerH <= 0) return;

    const angle = AQUARIUM_GODRAY_ANGLE;
    const dirX = Math.sin(angle);
    const dirY = Math.cos(angle);
    const perpX = Math.cos(angle);
    const perpY = -Math.sin(angle);
    const topY = AQUARIUM_GODRAY_TOP_Y;

    ctx.save();
    ctx.beginPath();
    ctx.rect(insetL, insetT, innerW, innerH);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    for (const ray of this.aquariumGodRays) {
      const alpha = this.godRayAlpha(ray);
      if (alpha <= 0.004) continue;

      const ox = ray.x;
      const oy = topY;
      const far = ray.length;
      const hw = ray.halfW;

      const nx = ox;
      const ny = oy;
      const fx = ox + dirX * far;
      const fy = oy + dirY * far;

      // 根元も先端も同じ太さの平行四辺形
      const n0x = nx - perpX * hw;
      const n0y = ny - perpY * hw;
      const n1x = nx + perpX * hw;
      const n1y = ny + perpY * hw;
      const f0x = fx - perpX * hw;
      const f0y = fy - perpY * hw;
      const f1x = fx + perpX * hw;
      const f1y = fy + perpY * hw;

      const midX = ox + dirX * (far * 0.55);
      const midY = oy + dirY * (far * 0.55);

      ctx.beginPath();
      ctx.moveTo(n0x, n0y);
      ctx.lineTo(n1x, n1y);
      ctx.lineTo(f1x, f1y);
      ctx.lineTo(f0x, f0y);
      ctx.closePath();

      const grad = ctx.createLinearGradient(ox, oy, midX, midY);
      grad.addColorStop(0, `rgba(220, 240, 255, ${alpha})`);
      grad.addColorStop(0.35, `rgba(170, 215, 255, ${alpha * 0.55})`);
      grad.addColorStop(0.75, `rgba(140, 200, 245, ${alpha * 0.18})`);
      grad.addColorStop(1, 'rgba(120, 180, 230, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      const chw = hw * 0.3;
      ctx.beginPath();
      ctx.moveTo(nx - perpX * chw, ny - perpY * chw);
      ctx.lineTo(nx + perpX * chw, ny + perpY * chw);
      ctx.lineTo(fx + perpX * chw, fy + perpY * chw);
      ctx.lineTo(fx - perpX * chw, fy - perpY * chw);
      ctx.closePath();
      const coreGrad = ctx.createLinearGradient(ox, oy, midX, midY);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`);
      coreGrad.addColorStop(0.45, `rgba(230, 245, 255, ${alpha * 0.35})`);
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    ctx.restore();
  }

  private tickAquariumView(dt: number, timeSec: number) {
    this.tickAquariumBubbles(dt, timeSec);
    this.tickAquariumGodRays(dt);

    for (const pellet of this.aquariumPellets) {
      pellet.y += AQUARIUM_PELLET_FALL_SPEED * dt;
      pellet.x += Math.sin(timeSec * 3 + pellet.swayPhase) * 12 * dt;
    }
    // miss bottom: food already consumed on drop
    this.aquariumPellets = this.aquariumPellets.filter((p) => p.y <= 500);

    const nowMs = Date.now();
    for (const runtime of this.aquariumFishRuntimes) {
      const entry = this.playerData.aquarium[runtime.aquariumIndex];
      if (!entry) continue;
      const stage = getGrowthStage(entry.feedCount);
      const satiated = isSatiated(entry, nowMs);
      const maxGrowth = isAquariumMaxGrowth(entry);

      let nearest: AquariumFoodPellet | null = null;
      let nearestDist = Infinity;
      if (!satiated && !maxGrowth) {
        for (const p of this.aquariumPellets) {
          const d = Math.hypot(p.x - runtime.x, p.y - runtime.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = p;
          }
        }
      }

      let accel = AQUARIUM_CRUISE_ACCEL;
      let maxSpeed = AQUARIUM_CRUISE_BASE_SPEED * (1.1 - 0.05 * stage.level) * runtime.speedMul;

      if (nearest) {
        runtime.mode = 'seek';
        // 落下先行狙い：到達見込み秒だけ下側を狙って取りこぼしを減らす
        const leadSec = Math.min(
          AQUARIUM_SEEK_LEAD_MAX_SEC,
          nearestDist / Math.max(1, AQUARIUM_SEEK_MAX_SPEED),
        );
        runtime.targetX = nearest.x;
        runtime.targetY = Math.min(
          AQUARIUM_SWIM_Y_MAX,
          nearest.y + AQUARIUM_PELLET_FALL_SPEED * leadSec,
        );
        accel = AQUARIUM_SEEK_ACCEL;
        maxSpeed = AQUARIUM_SEEK_MAX_SPEED;
      } else {
        runtime.mode = 'wander';
        if (timeSec >= runtime.stateUntil) {
          if (runtime.state === 'cruise') this.transitionFromCruise(runtime, timeSec, satiated);
          else if (runtime.state === 'idle') {
            if (Math.random() < AQUARIUM_IDLE_TO_DASH_P) this.beginAquariumState(runtime, 'dash', timeSec);
            else this.beginAquariumState(runtime, 'cruise', timeSec);
          } else {
            this.beginAquariumState(runtime, 'cruise', timeSec);
          }
        }

        if (runtime.state === 'idle') {
          const damp = 1 - Math.min(1, dt * AQUARIUM_IDLE_DAMP);
          runtime.vx *= damp;
          runtime.vy *= damp;
          // まれに向きだけ反転
          if (Math.random() < 0.002) runtime.facing = runtime.facing === 1 ? -1 : 1;
        } else if (runtime.state === 'dash') {
          accel = AQUARIUM_DASH_ACCEL;
          maxSpeed = AQUARIUM_DASH_MAX_SPEED * runtime.speedMul;
        } else {
          // cruise: 到着減速
          const distToTarget = Math.hypot(runtime.targetX - runtime.x, runtime.targetY - runtime.y);
          if (distToTarget < AQUARIUM_ARRIVAL_REACH_DIST) {
            this.transitionFromCruise(runtime, timeSec, satiated);
          } else if (distToTarget < AQUARIUM_ARRIVAL_SLOW_DIST) {
            maxSpeed *= Math.max(AQUARIUM_ARRIVAL_MIN_SPEED_FRAC, distToTarget / AQUARIUM_ARRIVAL_SLOW_DIST);
          }
        }
      }

      if (runtime.mode === 'seek' || runtime.state !== 'idle') {
        const dx = runtime.targetX - runtime.x;
        const dy = runtime.targetY - runtime.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (runtime.mode === 'seek') {
          // 希望速度へ直接寄せて、徘徊からの方向転換遅れを減らす
          const desiredVx = (dx / dist) * maxSpeed;
          const desiredVy = (dy / dist) * maxSpeed;
          const steer = Math.min(1, (accel / Math.max(1, maxSpeed)) * dt * 1.8);
          runtime.vx += (desiredVx - runtime.vx) * steer;
          runtime.vy += (desiredVy - runtime.vy) * steer;
        } else {
          runtime.vx += (dx / dist) * accel * dt;
          runtime.vy += (dy / dist) * accel * dt;
        }
        const speed = Math.hypot(runtime.vx, runtime.vy);
        if (speed > maxSpeed) {
          runtime.vx = (runtime.vx / speed) * maxSpeed;
          runtime.vy = (runtime.vy / speed) * maxSpeed;
        }
      }

      runtime.x += runtime.vx * dt;
      runtime.y += runtime.vy * dt;

      // 位置クランプは投下範囲と同一。サイズ連動の内側余白は食べた瞬間に押し戻す原因になるため使わない。
      runtime.x = Math.max(AQUARIUM_SWIM_X_MIN, Math.min(AQUARIUM_SWIM_X_MAX, runtime.x));
      runtime.y = Math.max(AQUARIUM_SWIM_Y_MIN, Math.min(AQUARIUM_SWIM_Y_MAX, runtime.y));

      if (Math.abs(runtime.vx) > AQUARIUM_FACING_VX_THRESHOLD) {
        runtime.facing = runtime.vx > 0 ? 1 : -1;
      }

      const speedNow = Math.hypot(runtime.vx, runtime.vy);
      let targetPitch = 0;
      if (speedNow >= AQUARIUM_PITCH_STOP_SPEED) {
        // canvas は Y 下向き。左向き基準スプライトでは正の回転で頭が上がるため -vy
        targetPitch = Math.atan2(-runtime.vy, Math.abs(runtime.vx));
        targetPitch = Math.max(-AQUARIUM_PITCH_MAX, Math.min(AQUARIUM_PITCH_MAX, targetPitch));
      }
      runtime.pitch += (targetPitch - runtime.pitch) * Math.min(1, dt * AQUARIUM_PITCH_LERP);
    }

    // eating: first fish to reach within eat radius, prefer closest if multiple
    const remaining: AquariumFoodPellet[] = [];
    for (const pellet of this.aquariumPellets) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (const runtime of this.aquariumFishRuntimes) {
        const entry = this.playerData.aquarium[runtime.aquariumIndex];
        if (!entry || isAquariumMaxGrowth(entry) || isSatiated(entry, nowMs)) continue;
        const size = this.aquariumSpriteSize(entry);
        const eatR = AQUARIUM_EAT_BASE_RADIUS + size * AQUARIUM_EAT_SIZE_FACTOR;
        const d = Math.hypot(pellet.x - runtime.x, pellet.y - runtime.y);
        if (d < eatR && d < bestDist) {
          bestDist = d;
          bestIdx = runtime.aquariumIndex;
        }
      }
      if (bestIdx >= 0) {
        // food already spent on drop; restore then let feedAquariumFish consume
        addAquariumFoodCount(this.playerData, pellet.tier, 1);
        const result = feedAquariumFish(this.playerData, bestIdx, nowMs, pellet.tier);
        if (result.ok) {
          savePlayerData(this.playerData);
          const rt = this.aquariumFishRuntimes.find((r) => r.aquariumIndex === bestIdx);
          if (rt) {
            this.aquariumFx.push({ kind: 'heart', x: rt.x, y: rt.y - 20, bornAt: nowMs, aquariumIndex: bestIdx });
            if (result.leveledUp) {
              this.aquariumFx.push({ kind: 'ring', x: rt.x, y: rt.y, bornAt: nowMs, aquariumIndex: bestIdx });
              const entry = this.playerData.aquarium[bestIdx];
              const fish = getFishById(entry.fishId);
              const stage = getGrowthStage(entry.feedCount);
              const bonus = getAquariumBonusForEntry(entry);
              this.showResult(
                `${fish?.name ?? '魚'}が ${stage.name} に成長した！ ${this.aquariumStatLabel(bonus.stat)}ボーナス +${this.formatAquariumPt(bonus.value)}pt`,
                2500,
              );
            }
          }
          this.updateAquariumFoodHud();
          if (this.unifiedBookTab === 'aquarium') {
            this.updateUnifiedBookList();
            this.updateUnifiedBookDetail();
          }
        } else {
          addAquariumFoodCount(this.playerData, pellet.tier, -1);
          remaining.push(pellet);
        }
      } else {
        remaining.push(pellet);
      }
    }
    this.aquariumPellets = remaining.filter((p) => p.y <= 500);
    this.aquariumFx = this.aquariumFx.filter((fx) => nowMs - fx.bornAt < 1000);
  }

  private drawAquariumView(timeSec: number) {
    const canvas = this.aquariumCanvasEl;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, AQUARIUM_CANVAS_W, AQUARIUM_CANVAS_H);

    this.drawAquariumBackground(ctx, timeSec);
    this.drawAquariumGodRays(ctx, timeSec);

    const nowMs = Date.now();
    for (const runtime of this.aquariumFishRuntimes) {
      const entry = this.playerData.aquarium[runtime.aquariumIndex];
      if (!entry) continue;
      const fish = getFishById(entry.fishId);
      const size = this.aquariumSpriteSize(entry);
      const swayY =
        Math.sin(timeSec * 1.7 + runtime.phase) * 2.5 +
        Math.sin(timeSec * 0.9 + runtime.phase * 1.3) * 1.5;

      const baseFacesLeft = !AQUARIUM_RIGHT_FACING_FISH.has(entry.fishId);
      const flip = baseFacesLeft ? runtime.facing === 1 : runtime.facing === -1;
      // ゆっくりした縦横の伸び縮み（呼吸／体幹のたわみ）。回転・移動は加えない
      const breath =
        Math.sin(timeSec * 1.05 + runtime.phase) * 0.7 +
        Math.sin(timeSec * 0.48 + runtime.phase * 1.6) * 0.3;
      const stretchX = 1 + breath * 0.045;
      const stretchY = 1 - breath * 0.055;

      ctx.save();
      ctx.translate(runtime.x, runtime.y + swayY);
      // 左向き基準の pitch。水平反転すると上下が逆転するため flip 時は符号を反転する
      ctx.rotate(flip ? -runtime.pitch : runtime.pitch);
      ctx.scale(flip ? -stretchX : stretchX, stretchY);

      const img = this.aquariumFishImages.get(entry.fishId);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      } else {
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fish?.emoji ?? '🐟', 0, 0);
      }
      ctx.restore();
    }

    // 気泡：前景の背面（魚の上・水草の下）
    for (const b of this.aquariumBubbles) {
      const alpha = Math.min(0.75, 0.35 + b.r * 0.08);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 235, 255, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // ハイライト
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.6, b.r * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.fill();
    }

    // 水草・岩前景：魚の上に重ねて回り込ませる
    if (this.aquariumFgCache) {
      this.drawAquariumWarpedLayer(ctx, this.aquariumFgCache, timeSec);
    }

    for (const pellet of this.aquariumPellets) {
      ctx.fillStyle = AQUARIUM_FOOD_TIERS[pellet.tier].pelletColor;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, AQUARIUM_PELLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (const fx of this.aquariumFx) {
      const age = (nowMs - fx.bornAt) / 1000;
      if (fx.kind === 'heart') {
        ctx.globalAlpha = Math.max(0, 1 - age);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#ff6b8a';
        ctx.fillText('♥', fx.x, fx.y - age * 30);
        ctx.globalAlpha = 1;
      } else {
        const r = 10 + age * 40;
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 1 - age * 2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // aim marker（マウスが水槽上 / キーで水槽フォーカス中のみ）
    const showAimMarker =
      this.aquariumPointerOverCanvas ||
      (this.uiMenuNavInputChannel === 'keyboard' && this.aquariumNavArea === 'tank');
    if (showAimMarker) {
      const cd = Date.now() - this.aquariumLastFeedAt < AQUARIUM_FEED_COOLDOWN_MS;
      const markerY = this.getAquariumCoverCropTop() + 8;
      ctx.save();
      ctx.globalAlpha = cd ? 0.45 : 1;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(50, 30, 10, 0.55)';
      ctx.fillStyle = '#ffe08a';
      ctx.strokeText('▼', this.aquariumAimX, markerY);
      ctx.fillText('▼', this.aquariumAimX, markerY);
      ctx.restore();
    }
  }


  switchUnifiedBookTab(
    tab: UnifiedBookTab,
    opts?: { keepMainTabNav?: boolean },
  ) {
    const prevTab = this.unifiedBookTab;
    if (!opts?.keepMainTabNav) {
      this.exitUnifiedBookMainTabsNav();
    }

    // 実績・クエストタブから他のタブに切り替える場合は、詳細エリアを元の構造に復元
    if ((this.unifiedBookTab === 'achievement' || this.unifiedBookTab === 'quest' || this.unifiedBookTab === 'aquarium') && tab !== 'achievement' && tab !== 'quest' && tab !== 'aquarium') {
      this.restoreBookDetailStructure();
    }
    if (this.unifiedBookTab === 'aquarium' && tab !== 'aquarium') {
      this.stopAquariumTankLoop();
      this.clearAquariumSatietyInterval();
      this.clearAquariumRemoveConfirm();
    }

    this.unifiedBookTab = tab;
    this.unifiedBookSelectedId = null;
    this.unifiedBookSelectedIndex = null;
    this.aquariumPendingBagIndex = null;
    this.closeAquariumBagPick();
    if (tab === 'aquarium') {
      this.aquariumNavArea = 'slots';
      this.aquariumDetailNavIndex = 0;
    }
    if (tab === 'status') {
      this.statusNavArea = 'stats';
      this.statusNavButtonType = 'rod';
      this.statusLastInteractedButtonType = 'rod';
      this.statusNavEquipOptionIndex = 0;
      this.statusEquipmentSelectorType = null;
      this.statusPreviewEquipmentType = null;
      this.statusPreviewEquipmentId = null;
    }
    if (tab === 'pedia') {
      this.pediaNavArea = 'list';
    }
    this.setSkillNavArea('tree');
    this.achievementNavArea = 'left';
    this.achievementDetailSelectedIndex = 0;

    // タブボタンのアクティブ状態を更新
    const tabButtons = this.unifiedBookUIElement.querySelectorAll('.book-tab-button');
    tabButtons.forEach(btn => {
      const btnTab = (btn as HTMLElement).getAttribute('data-tab');
      if (btnTab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const aquariumPanel = this.unifiedBookUIElement.querySelector('#book-aquarium-panel') as HTMLElement | null;
    if (aquariumPanel) aquariumPanel.style.display = tab === 'aquarium' ? 'flex' : 'none';

    if (tab === 'achievement') {
      this.unifiedBookUIElement.setAttribute('data-tab', 'achievement');
    } else if (tab === 'quest') {
      this.unifiedBookUIElement.setAttribute('data-tab', 'quest');
    } else if (tab === 'status') {
      this.unifiedBookUIElement.setAttribute('data-tab', 'status');
    } else if (tab === 'skills') {
      this.unifiedBookUIElement.setAttribute('data-tab', 'skills');
    } else if (tab === 'aquarium') {
      this.unifiedBookUIElement.setAttribute('data-tab', 'aquarium');
    } else {
      this.unifiedBookUIElement.setAttribute('data-tab', tab);
      this.restoreBookDetailStructure();
    }

    if (this.unifiedBookDetailPlaceholderElement) {
      if (tab === 'quest') {
        this.unifiedBookDetailPlaceholderElement.textContent = 'クエストを選んでみよう！';
      } else if (tab === 'achievement') {
        this.unifiedBookDetailPlaceholderElement.textContent = 'カテゴリを選んでみよう！';
      } else if (tab === 'aquarium') {
        this.unifiedBookDetailPlaceholderElement.textContent = 'バッグの魚を水槽に入れてみよう！';
      } else {
        this.unifiedBookDetailPlaceholderElement.textContent = '魚を釣り上げよう！';
      }
    }

    // リストと詳細を更新
    this.updateUnifiedBookList();
    if (tab === 'quest' && this.unifiedBookListItems.length > 0) {
      this.selectQuestLogCategory('active', 0);
    } else if (tab !== 'aquarium') {
      this.updateUnifiedBookDetail();
    }
    if (tab === 'aquarium') {
      this.startAquariumTankLoop();
      this.startAquariumSatietyInterval();
      this.syncAquariumKeyboardSelection();
    }
    if (tab === 'skills') {
      if (prevTab !== 'skills') {
        const skillPanel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
        const firstNode = skillPanel?.querySelector('#book-skill-tree-grid .book-ui-node') as HTMLElement | null;
        if (firstNode) {
          this.skillSelectedNodeId = null;
          this.setSkillNavArea('tree');
          firstNode.click();
          firstNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.updateBookSkillTreeScrollFade());
      });
    }

    if (this.unifiedBookMainTabsNavActive) {
      this.syncUnifiedBookMainTabsNavUI();
    }

    this.refreshStatusPanelBookInputModeStyles();
    this.syncBookPediaSortBarUI();
    this.refreshBookTabsKbInputChrome();

    // タブ切替時のみコンテンツをフェードイン（初回オープンで prev===tab のときは動かさない）
    if (prevTab !== tab) {
      this.playUnifiedBookTabContentFade();
    }
  }

  /** Book タブ切替: 画面内要素を不透明度だけでイージング出現 */
  private playUnifiedBookTabContentFade() {
    const container = this.unifiedBookUIElement?.querySelector('.book-container') as HTMLElement | null;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    container.classList.add('is-tab-content-hidden');
    void container.offsetWidth;
    requestAnimationFrame(() => {
      container.classList.remove('is-tab-content-hidden');
    });
  }

  private enterUnifiedBookMainTabsNav() {
    // 先に true にしてから clear → update（status の setupStatusStatSelector が applySelection しないようにする）
    this.unifiedBookMainTabsNavActive = true;
    this.resetUnifiedBookTabScrollToTop();
    this.clearUnifiedBookMenuSelectionForMainTabNav();
    this.syncUnifiedBookMainTabsNavUI();
    this.refreshBookTabsKbInputChrome();
  }

  private exitUnifiedBookMainTabsNav() {
    if (!this.unifiedBookMainTabsNavActive) return;
    this.unifiedBookMainTabsNavActive = false;
    this.syncUnifiedBookMainTabsNavUI();
    this.refreshBookTabsKbInputChrome();
  }

  /** 上部タブをキー選択中は、左ペイン／ステータス／スキルツリーの選択表示を外す */
  private clearUnifiedBookMenuSelectionForMainTabNav() {
    if (!this.unifiedBookUIElement) return;

    this.unifiedBookSelectedId = null;
    this.unifiedBookSelectedIndex = null;

    for (const item of this.unifiedBookListItems) {
      item.classList.remove('state-selected', 'is-selected');
      item.querySelector('.book-ui-node')?.classList.remove('is-selected', 'is-nav-selected');
    }

    const statusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    if (statusPanel) {
      this.statusEquipmentSelectorType = null;
      this.statusNavArea = 'stats';
      this.statusNavButtonType = 'rod';
      this.statusLastInteractedButtonType = 'rod';
      this.statusNavEquipOptionIndex = 0;
      this.statusPreviewEquipmentType = null;
      this.statusPreviewEquipmentId = null;
      statusPanel.querySelectorAll('.book-status-change-btn').forEach((btn) => {
        btn.classList.remove('is-nav-selected');
        btn.textContent = '変更する';
      });
      statusPanel.querySelectorAll('.book-status-equip-option').forEach((btn) => btn.classList.remove('is-nav-selected'));
      statusPanel.querySelectorAll('.book-status-stat-list li').forEach((li) => {
        li.classList.remove('is-selected');
        li.setAttribute('aria-selected', 'false');
      });
      const detailText = statusPanel.querySelector('#book-status-detail-text');
      const detailTitle = statusPanel.querySelector('#book-status-detail-title');
      if (detailText) detailText.textContent = '';
      if (detailTitle) detailTitle.textContent = 'Info';
    }

    if (this.unifiedBookTab === 'skills') {
      this.skillSelectedNodeId = null;
      this.clearSkillTreeRowKeyboardSelection();
      this.setSkillNavArea('tree');
      const unlockBtn = this.unifiedBookUIElement.querySelector('#book-skill-unlock') as HTMLElement | null;
      unlockBtn?.classList.remove('is-nav-selected');
    }

    if (this.unifiedBookTab === 'achievement' || this.unifiedBookTab === 'quest') {
      this.achievementNavArea = 'left';
      this.clearRightPaneDetailKeyboardSelection();
    }

    if (this.unifiedBookTab === 'pedia') {
      this.pediaNavArea = 'list';
      this.syncBookPediaSortBarUI();
    }

    this.updateUnifiedBookDetail();
  }

  /** タブ行フォーカス解除後、先頭項目などへ選択を戻す */
  private restoreUnifiedBookMenuSelectionAfterMainTabNav() {
    if (!this.unifiedBookUIElement) return;

    if (this.unifiedBookTab === 'status') {
      const statusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
      if (statusPanel) {
        this.statusNavArea = 'equipmentButtons';
        this.syncStatusEquipmentButtonSelection(statusPanel);
      }
      return;
    }

    if (this.unifiedBookTab === 'skills') {
      const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
      const activeTab = panel?.querySelector('.book-skill-category-tab.is-active') as HTMLElement | null;
      const tid = activeTab?.dataset.treeId as SkillTreeId | undefined;
      const idx =
        tid && SKILL_TREE_IDS.includes(tid)
          ? SKILL_TREE_IDS.indexOf(tid)
          : 0;
      this.selectSkillTree(SKILL_TREE_IDS[idx] ?? 'power', idx);
      this.setSkillNavArea('category');
      this.ensureSkillCategoryVisibleInRightPane();
      return;
    }

    if (this.unifiedBookTab === 'achievement') {
      const firstCategory = this.unifiedBookListItems[0]?.getAttribute('data-category');
      if (firstCategory) this.selectAchievementCategory(firstCategory, 0);
      return;
    }

    if (this.unifiedBookTab === 'quest') {
      const firstCategory = this.unifiedBookListItems[0]?.getAttribute('data-category');
      if (firstCategory) this.selectQuestLogCategory(firstCategory, 0);
      return;
    }

    if (this.unifiedBookTab === 'pedia') {
      this.pediaNavArea = 'sort';
      this.syncBookPediaSortBarUI();
      return;
    }

    if (this.unifiedBookTab === 'aquarium') {
      this.aquariumNavArea = 'slots';
      const firstId = this.unifiedBookListItems[0]?.getAttribute('data-aquarium-id');
      if (firstId) {
        this.selectAquariumBookItem(firstId, 0);
      } else {
        this.syncAquariumKeyboardSelection();
      }
      return;
    }

    if (this.unifiedBookListItems.length > 0) {
      const firstFishId = this.unifiedBookListItems[0]?.getAttribute('data-fish-id');
      if (firstFishId) this.selectUnifiedBookItem(firstFishId, 0);
    }
  }

  private syncUnifiedBookMainTabsNavUI() {
    if (!this.unifiedBookUIElement) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    this.unifiedBookUIElement.classList.toggle(
      'is-book-main-tabs-nav',
      kb && this.unifiedBookMainTabsNavActive,
    );
    const buttons = this.unifiedBookUIElement.querySelectorAll('.book-tab-button');
    buttons.forEach((btn) => {
      const t = (btn as HTMLElement).getAttribute('data-tab');
      const on = kb && this.unifiedBookMainTabsNavActive && t === this.unifiedBookTab;
      btn.classList.toggle('is-nav-selected', !!on);
    });
  }

  private fillBookStatusPanel(panel: HTMLElement) {
    const pd = this.playerData;
    const level = pd.level;
    const displayName = this.getSelectedPlayerName() || 'Player';

    const nameEl = panel.querySelector('#book-status-player-name');
    if (nameEl) nameEl.textContent = displayName;

    const iconCanvas = panel.querySelector('#book-status-character-icon-canvas') as HTMLCanvasElement | null;
    if (iconCanvas) {
      this.renderCharacterIconToCanvas(iconCanvas, this.getSelectedCharacterId(), this.getSelectedColor());
    }

    const levelEl = panel.querySelector('#book-status-level');
    if (levelEl) levelEl.textContent = String(level);

    const curExp = getRequiredExp(level);
    const nextExp = getRequiredExp(level + 1);
    const expIn = Math.max(0, pd.exp - curExp);
    const need = Math.max(1, nextExp - curExp);
    const summaryEl = panel.querySelector('#book-status-exp-summary');
    if (summaryEl) summaryEl.textContent = `EXP ${Math.floor(expIn)} / ${Math.floor(need)}`;

    const fillEl = panel.querySelector('#book-status-exp-fill') as HTMLElement | null;
    if (fillEl) fillEl.style.width = `${getExpProgress(pd) * 100}%`;

    const rod = getRodById(pd.equippedRodId);
    const bait = pd.equippedBaitId ? getBaitById(pd.equippedBaitId) : null;
    const lure = pd.equippedLureId ? getLureById(pd.equippedLureId) : null;

    const rodNameEl = panel.querySelector('#book-status-equipped-rod-name');
    if (rodNameEl) rodNameEl.textContent = rod?.name ?? '未装備';
    const activeBaitOrLure = bait ?? lure;
    const lureNameEl = panel.querySelector('#book-status-equipped-lure-name');
    if (lureNameEl) lureNameEl.textContent = activeBaitOrLure?.name ?? '装備なし';
    this.renderStatusEquipmentIcon(
      panel.querySelector('#book-status-equipped-rod-icon') as HTMLElement | null,
      rod?.id ?? null,
      rod?.icon ?? '🎣',
    );
    this.renderStatusEquipmentIcon(
      panel.querySelector('#book-status-equipped-lure-icon') as HTMLElement | null,
      activeBaitOrLure?.id ?? null,
      activeBaitOrLure?.icon ?? null,
    );
    const statusValues = this.calculateStatusIndexValues(pd.equippedRodId);

    const powerEl = panel.querySelector('#book-status-power');
    if (powerEl) powerEl.textContent = String(statusValues.power);
    const speedEl = panel.querySelector('#book-status-speed');
    if (speedEl) speedEl.textContent = String(statusValues.speed);
    const techniqueEl = panel.querySelector('#book-status-technique');
    if (techniqueEl) techniqueEl.textContent = String(statusValues.technique);
    const controlEl = panel.querySelector('#book-status-control');
    if (controlEl) controlEl.textContent = String(statusValues.control);

    // 現在の装備・補正を反映したレアリティ出現率を表示
    const rarityRates = this.calculateStatusRarityRateValues();
    this.applyStatusRarityRateValues(panel, rarityRates);

    this.setupStatusStatSelector(panel);
    this.syncStatusDetailNoteHeight(panel);

    // 詳細項目（キャスト/ファイト/装備）は非表示運用のため、ここでは更新しない
  }

  private syncStatusDetailNoteHeight(panel: HTMLElement) {
    const statList = panel.querySelector('.book-status-stat-list') as HTMLElement | null;
    const detailNote = panel.querySelector('.book-status-two-col .book-status-detail-note') as HTMLElement | null;
    if (!statList || !detailNote) return;

    statList.style.height = 'fit-content';
    detailNote.style.height = '220px';
    detailNote.style.removeProperty('max-height');
    this.updateStatusDetailScrollFade(panel);
  }

  private calculateStatusIndexValues(rodId: string): Record<'power' | 'speed' | 'technique' | 'control', number> {
    return calculateDisplayStatIndices(this.playerData, rodId);
  }

  private setStatusPreviewEquipment(type: 'rod' | 'bait' | 'lure' | null, equipmentId: string | null, panel: HTMLElement) {
    this.statusPreviewEquipmentType = type;
    this.statusPreviewEquipmentId = equipmentId;
    this.updateStatusPreviewStatDelta(panel);
  }

  private applyStatusPanelValues(
    panel: HTMLElement,
    values: Record<'power' | 'speed' | 'technique' | 'control', number>,
    baselineValues?: Record<'power' | 'speed' | 'technique' | 'control', number>,
  ) {
    const statIdMap: Record<'power' | 'speed' | 'technique' | 'control', string> = {
      power: '#book-status-power',
      speed: '#book-status-speed',
      technique: '#book-status-technique',
      control: '#book-status-control',
    };
    (Object.keys(statIdMap) as Array<'power' | 'speed' | 'technique' | 'control'>).forEach((key) => {
      const nextValueEl = panel.querySelector(statIdMap[key]) as HTMLElement | null;
      if (!nextValueEl) return;
      nextValueEl.textContent = String(values[key]);
      const currentValueEl = panel.querySelector(`${statIdMap[key]}-current`) as HTMLElement | null;
      if (currentValueEl) {
        currentValueEl.textContent = String(baselineValues ? baselineValues[key] : values[key]);
      }
    });
  }

  private calculateStatusRarityRateValues(
    override?: { rodId?: string | null; baitId?: string | null; lureId?: string | null },
  ): Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', number> {
    const resolvedRodId = override?.rodId === undefined ? this.playerData.equippedRodId : override.rodId;
    const resolvedBaitId = override?.baitId === undefined ? this.playerData.equippedBaitId : override.baitId;
    const resolvedLureId = override?.lureId === undefined ? this.playerData.equippedLureId : override.lureId;

    const rod = resolvedRodId ? getRodById(resolvedRodId) : null;
    const bait = resolvedBaitId ? getBaitById(resolvedBaitId) : null;
    const lure = resolvedLureId ? getLureById(resolvedLureId) : null;
    const rodRarityHitAdd = rod?.rarityHitRateAdd || { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    const adjustedRarityWeights = {
      common: rarityWeights.common * this.combineRarityBonus(bait?.commonBonus || 1.0, lure?.commonBonus || 1.0, 1.0 + rodRarityHitAdd.common),
      uncommon: rarityWeights.uncommon * this.combineRarityBonus(bait?.uncommonBonus || 1.0, lure?.uncommonBonus || 1.0, 1.0 + rodRarityHitAdd.uncommon),
      rare: rarityWeights.rare * this.combineRarityBonus(bait?.rareBonus || 1.0, lure?.rareBonus || 1.0, 1.0 + rodRarityHitAdd.rare),
      epic: rarityWeights.epic * this.combineRarityBonus(bait?.epicBonus || 1.0, lure?.epicBonus || 1.0, 1.0 + rodRarityHitAdd.epic),
      legendary: rarityWeights.legendary * this.combineRarityBonus(
        bait?.legendaryBonus || 1.0,
        lure?.legendaryBonus || 1.0,
        1.0 + rodRarityHitAdd.legendary,
      ),
    };
    const totalRarityWeight =
      adjustedRarityWeights.common +
      adjustedRarityWeights.uncommon +
      adjustedRarityWeights.rare +
      adjustedRarityWeights.epic +
      adjustedRarityWeights.legendary;
    const safeTotal = Math.max(0.0001, totalRarityWeight);
    return {
      common: (adjustedRarityWeights.common / safeTotal) * 100,
      uncommon: (adjustedRarityWeights.uncommon / safeTotal) * 100,
      rare: (adjustedRarityWeights.rare / safeTotal) * 100,
      epic: (adjustedRarityWeights.epic / safeTotal) * 100,
      legendary: (adjustedRarityWeights.legendary / safeTotal) * 100,
    };
  }

  private applyStatusRarityRateValues(
    panel: HTMLElement,
    values: Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', number>,
    baselineValues?: Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', number>,
  ) {
    const rarityIdMap: Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', string> = {
      common: '#book-status-rarity-common',
      uncommon: '#book-status-rarity-uncommon',
      rare: '#book-status-rarity-rare',
      epic: '#book-status-rarity-epic',
      legendary: '#book-status-rarity-legendary',
    };
    (Object.keys(rarityIdMap) as Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>).forEach((key) => {
      const rateEl = panel.querySelector(rarityIdMap[key]) as HTMLElement | null;
      if (!rateEl) return;
      const formattedValue = Math.round(values[key]).toString();
      rateEl.innerHTML = `${formattedValue}<span class="book-status-rarity-prob-percent">%</span>`;
      const currentRateEl = panel.querySelector(`${rarityIdMap[key]}-current`) as HTMLElement | null;
      if (currentRateEl) {
        const currentValue = baselineValues ? Math.round(baselineValues[key]).toString() : formattedValue;
        currentRateEl.innerHTML = `${currentValue}<span class="book-status-rarity-prob-percent">%</span>`;
      }
      const deltaEl = panel.querySelector(`${rarityIdMap[key]}-delta`) as HTMLElement | null;
      if (!deltaEl) return;
      const itemEl = deltaEl.closest('.book-status-rarity-prob-item') as HTMLElement | null;
      deltaEl.textContent = '';
      deltaEl.classList.remove('is-plus', 'is-minus', 'has-delta');
      itemEl?.classList.remove('is-delta-unchanged', 'is-delta-plus', 'is-delta-minus');
      if (!baselineValues) return;
      const delta = Math.round(values[key] * 10) - Math.round(baselineValues[key] * 10);
      if (delta === 0) {
        itemEl?.classList.add('is-delta-unchanged');
        return;
      }
      deltaEl.textContent = '';
      deltaEl.classList.add('has-delta');
      deltaEl.classList.toggle('is-plus', delta > 0);
      deltaEl.classList.toggle('is-minus', delta < 0);
      itemEl?.classList.toggle('is-delta-plus', delta > 0);
      itemEl?.classList.toggle('is-delta-minus', delta < 0);
    });
  }

  private combineRarityBonus(a: number, b: number, c: number = 1.0): number {
    // 整数表示でも差が見えるよう、装備ボーナスの効きを強める。
    const bonusDelta = (a - 1.0) + (b - 1.0) + (c - 1.0);
    const combined = 1.0 + bonusDelta * 2.4;
    return Math.max(0.05, combined);
  }

  private clearStatusPreviewStatDelta(panel: HTMLElement) {
    panel.classList.remove('is-status-previewing');
    const currentValues = this.calculateStatusIndexValues(this.playerData.equippedRodId);
    this.applyStatusPanelValues(panel, currentValues, currentValues);
    const currentRarityRates = this.calculateStatusRarityRateValues();
    this.applyStatusRarityRateValues(panel, currentRarityRates);
    const deltaEls = panel.querySelectorAll('.book-status-stat-delta');
    deltaEls.forEach((el) => {
      (el as HTMLElement).textContent = '';
      el.classList.remove('is-plus', 'is-minus');
    });
    const statItems = panel.querySelectorAll('.book-status-stat-list li[data-stat-key]');
    statItems.forEach((el) => el.classList.remove('is-delta-unchanged', 'is-delta-plus', 'is-delta-minus'));
    const rarityItems = panel.querySelectorAll('.book-status-rarity-prob-item');
    rarityItems.forEach((el) => el.classList.remove('is-delta-unchanged', 'is-delta-plus', 'is-delta-minus'));
  }

  private updateStatusPreviewStatDelta(panel: HTMLElement) {
    this.clearStatusPreviewStatDelta(panel);
    if (!this.statusEquipmentSelectorType || !this.statusPreviewEquipmentType) return;
    panel.classList.add('is-status-previewing');

    const currentValues = this.calculateStatusIndexValues(this.playerData.equippedRodId);
    const currentRarityRates = this.calculateStatusRarityRateValues();
    const previewRodId =
      this.statusPreviewEquipmentType === 'rod' && this.statusPreviewEquipmentId
        ? this.statusPreviewEquipmentId
        : this.playerData.equippedRodId;
    const previewValues = this.calculateStatusIndexValues(previewRodId);
    const previewRarityOverrides =
      this.statusPreviewEquipmentType === 'rod'
        ? { rodId: this.statusPreviewEquipmentId ?? this.playerData.equippedRodId }
        : this.statusPreviewEquipmentType === 'bait'
          ? { baitId: this.statusPreviewEquipmentId, lureId: null }
          : { lureId: this.statusPreviewEquipmentId, baitId: null };
    const previewRarityRates = this.calculateStatusRarityRateValues(previewRarityOverrides);
    this.applyStatusPanelValues(panel, previewValues, currentValues);
    this.applyStatusRarityRateValues(panel, previewRarityRates, currentRarityRates);

    const statKeys: Array<'power' | 'speed' | 'technique' | 'control'> = ['power', 'speed', 'technique', 'control'];
    statKeys.forEach((statKey) => {
      const li = panel.querySelector(`.book-status-stat-list li[data-stat-key="${statKey}"]`) as HTMLElement | null;
      if (!li) return;
      const delta = previewValues[statKey] - currentValues[statKey];
      li.classList.toggle('is-delta-unchanged', delta === 0);
      li.classList.toggle('is-delta-plus', delta > 0);
      li.classList.toggle('is-delta-minus', delta < 0);
      if (delta === 0) return;
      const deltaEl = li.querySelector('.book-status-stat-delta') as HTMLElement | null;
      if (!deltaEl) return;
      deltaEl.textContent = '';
      deltaEl.classList.toggle('is-plus', delta > 0);
      deltaEl.classList.toggle('is-minus', delta < 0);
    });
  }

  private setupStatusStatSelector(panel: HTMLElement) {
    const list = panel.querySelector('.book-status-stat-list') as HTMLElement | null;
    if (!list) return;

    const statDetails: Record<'power' | 'speed' | 'technique' | 'control', { text: string }> = {
      'power': {
        text: '遠くまで投げる能力。投擲距離が長いほど、大きい個体が釣れやすくなる。',
      },
      'speed': {
        text: 'ヒット時にゲージを伸ばす速さ。高いほど捕獲を安定させやすい。',
      },
      'technique': {
        text: 'ファイト中の判定ゾーンの広さ。レベルが上がるほど広がり、操作ミスの影響を受けにくい。',
      },
      'control': {
        text: 'ファイト中のプレイヤーバーの扱いやすさ。レベルが上がるほど慣性が抑えられ、思い通りの位置で止めやすい。',
      },
    };

    const applySelection = (nextKey: 'power' | 'speed' | 'technique' | 'control') => {
      this.selectedStatusStatKey = nextKey;
      this.syncStatusEquipmentButtonSelection(panel);
      const detailTextEl = panel.querySelector('#book-status-detail-text') as HTMLElement | null;
      if (detailTextEl) {
        detailTextEl.textContent = statDetails[nextKey].text;
      }
      const detailTitle = panel.querySelector('#book-status-detail-title') as HTMLElement | null;
      if (detailTitle) detailTitle.textContent = 'Info';
    };

    if (list.dataset.statListBound !== '1') {
      list.dataset.statListBound = '1';
      const selectStatByKey = (key: 'power' | 'speed' | 'technique' | 'control') => {
        this.statusEquipmentSelectorType = null;
        this.statusNavArea = 'stats';
        applySelection(key);
      };
      list.addEventListener('click', (e) => {
        const t = e.target as HTMLElement | null;
        if (!t) return;
        const li = t.closest('li[data-stat-key]') as HTMLElement | null;
        if (!li || !list.contains(li)) return;
        const key = li.dataset.statKey as 'power' | 'speed' | 'technique' | 'control' | undefined;
        if (!key) return;
        selectStatByKey(key);
      });
      /* マウスホバーでも仮ホバーではなく、クリック／キー選択と同じ決定状態にする */
      list.addEventListener('mouseover', (e) => {
        if (this.uiMenuNavInputChannel === 'keyboard') return;
        if (this.unifiedBookMainTabsNavActive) return;
        const t = e.target as HTMLElement | null;
        const li = t?.closest('li[data-stat-key]') as HTMLElement | null;
        if (!li || !list.contains(li)) return;
        const from = e.relatedTarget as Node | null;
        if (from && li.contains(from)) return;
        const key = li.dataset.statKey as 'power' | 'speed' | 'technique' | 'control' | undefined;
        if (!key) return;
        selectStatByKey(key);
      });
      list.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const t = e.target as HTMLElement | null;
        if (!t) return;
        const li = t.closest('li[data-stat-key]') as HTMLElement | null;
        if (!li || !list.contains(li)) return;
        if (this.statusNavArea !== 'stats' || this.statusEquipmentSelectorType || this.unifiedBookMainTabsNavActive) return;
        e.preventDefault();
        const key = li.dataset.statKey as 'power' | 'speed' | 'technique' | 'control' | undefined;
        if (!key) return;
        this.noteUiMenuKeyboardNavigation();
        selectStatByKey(key);
      });
    }

    const items = Array.from(list.querySelectorAll('li[data-stat-key]')) as HTMLElement[];
    if (!items.length) return;

    const detailTextEl = panel.querySelector('#book-status-detail-text') as HTMLElement | null;
    if (detailTextEl && detailTextEl.dataset.scrollFadeBound !== '1') {
      detailTextEl.dataset.scrollFadeBound = '1';
      detailTextEl.addEventListener('scroll', () => this.updateStatusDetailScrollFade(panel));
    }

    if (this.unifiedBookMainTabsNavActive) {
      this.statusNavArea = 'stats';
      items.forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-selected', 'false');
      });
      this.syncStatusEquipmentButtonSelection(panel);
      const detailTitle = panel.querySelector('#book-status-detail-title');
      if (detailTitle) detailTitle.textContent = 'Info';
      if (detailTextEl) detailTextEl.textContent = '';
      this.updateStatusDetailScrollFade(panel);
      return;
    }
    if (this.statusEquipmentSelectorType) {
      this.renderStatusEquipmentSelector(panel, this.statusEquipmentSelectorType);
      this.syncStatusEquipmentButtonSelection(panel);
      this.updateStatusPreviewStatDelta(panel);
      this.updateStatusDetailScrollFade(panel);
      return;
    }
    this.clearStatusPreviewStatDelta(panel);
    if (this.statusNavArea === 'stats') {
      applySelection(this.selectedStatusStatKey);
      this.syncStatusEquipmentButtonSelection(panel);
    } else if (this.statusNavArea === 'equipmentButtons') {
      this.syncStatusStatSelection(panel);
      this.syncStatusEquipmentButtonSelection(panel);
    } else {
      this.statusNavArea = 'stats';
      this.syncStatusEquipmentButtonSelection(panel);
      applySelection(this.selectedStatusStatKey);
    }
    this.updateStatusDetailScrollFade(panel);
  }

  private updateStatusDetailScrollFade(panel: HTMLElement) {
    const detailText = panel.querySelector('#book-status-detail-text') as HTMLElement | null;
    const fadeTop = panel.querySelector('#book-status-detail-fade-top') as HTMLElement | null;
    const fadeBottom = panel.querySelector('#book-status-detail-fade-bottom') as HTMLElement | null;
    this.updateScrollFadeIndicators(detailText, fadeTop, fadeBottom);
  }

  private openStatusEquipmentSelector(type: 'rod' | 'lure') {
    this.statusEquipmentSelectorType = type;
    this.statusNavButtonType = type;
    this.statusLastInteractedButtonType = type;
    this.statusNavArea = 'equipmentOptions';
    this.statusNavEquipOptionIndex = 0;
    const panel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    if (!panel) return;
    this.fillBookStatusPanel(panel);
  }

  private renderStatusEquipmentSelector(panel: HTMLElement, type: 'rod' | 'lure') {
    const detailTitle = panel.querySelector('#book-status-detail-title') as HTMLElement | null;
    const detailBody = panel.querySelector('#book-status-detail-text') as HTMLElement | null;
    if (!detailBody) return;

    detailBody.textContent = '';
    if (detailTitle) {
      detailTitle.textContent = 'List';
    }

    const listEl = document.createElement('div');
    listEl.className = 'book-status-equip-option-list';
    const syncMouseDrivenOptionNav = () => {
      if (this.statusNavArea !== 'equipmentOptions') return;
      this.syncStatusEquipmentOptionSelection(panel);
    };
    listEl.addEventListener('wheel', syncMouseDrivenOptionNav, { passive: true });
    listEl.addEventListener('pointerdown', syncMouseDrivenOptionNav);
    listEl.addEventListener('pointermove', syncMouseDrivenOptionNav);
    listEl.addEventListener('mouseleave', () => {
      if (this.statusNavArea !== 'equipmentOptions') return;
      this.setStatusPreviewEquipment(null, null, panel);
      const options = Array.from(listEl.querySelectorAll('.book-status-equip-option')) as HTMLButtonElement[];
      options.forEach((opt) => opt.classList.remove('is-nav-selected'));
    });
    const setMouseHoverOptionSelection = (activeOption: HTMLButtonElement | null) => {
      const options = Array.from(listEl.querySelectorAll('.book-status-equip-option')) as HTMLButtonElement[];
      options.forEach((opt) => {
        opt.classList.toggle('is-nav-selected', !!activeOption && opt === activeOption);
      });
    };
    const bindPreviewEvents = (option: HTMLButtonElement, equipType: 'rod' | 'bait' | 'lure', equipId: string | null) => {
      option.addEventListener('mouseenter', () => {
        // スクロールに伴う擬似 hover で入力チャネルを切り替えない
        if (this.statusNavArea === 'equipmentOptions' && this.uiMenuNavInputChannel === 'keyboard') return;
        setMouseHoverOptionSelection(option);
        this.setStatusPreviewEquipment(equipType, equipId, panel);
      });
      option.addEventListener('focus', () => {
        // キーボードナビ時は is-nav-selected 側の preview を正とする
        if (this.statusNavArea === 'equipmentOptions' && this.uiMenuNavInputChannel === 'keyboard') return;
        setMouseHoverOptionSelection(option);
        this.setStatusPreviewEquipment(equipType, equipId, panel);
      });
      option.addEventListener('mouseleave', () => {
        if (this.statusNavArea === 'equipmentOptions') {
          this.syncStatusEquipmentOptionSelection(panel);
          return;
        }
        this.setStatusPreviewEquipment(null, null, panel);
      });
      option.addEventListener('blur', () => {
        if (this.statusNavArea !== 'equipmentOptions') {
          this.setStatusPreviewEquipment(null, null, panel);
        }
      });
    };

    if (type === 'rod') {
      const ownedRods = rodConfigs.filter((rod) => this.playerData.ownedRods.includes(rod.id));
      ownedRods.forEach((rod) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'book-status-equip-option ui-frame-box';
        if (this.playerData.equippedRodId === rod.id) option.classList.add('is-selected');
        option.dataset.equipType = 'rod';
        option.dataset.equipId = rod.id;

        const nameEl = document.createElement('span');
        nameEl.className = 'book-status-equip-option-name';
        nameEl.appendChild(this.createStatusEquipmentOptionIcon(rod.id));
        const textEl = document.createElement('span');
        textEl.textContent = rod.name;
        nameEl.appendChild(textEl);
        option.appendChild(nameEl);

        const stateEl = document.createElement('span');
        stateEl.className = 'book-status-equip-option-state';
        stateEl.textContent = this.playerData.equippedRodId === rod.id ? '装備中' : '';
        option.appendChild(stateEl);

        option.addEventListener('click', () => this.equipFromStatusPanel('rod', rod.id));
        bindPreviewEvents(option, 'rod', rod.id);
        listEl.appendChild(option);
      });
    } else {
      const unequipOption = document.createElement('button');
      unequipOption.type = 'button';
      unequipOption.className = 'book-status-equip-option ui-frame-box';
      if (!this.playerData.equippedBaitId && !this.playerData.equippedLureId) unequipOption.classList.add('is-selected');
      unequipOption.dataset.equipType = 'lure';
      unequipOption.dataset.equipId = '';

      const unequipName = document.createElement('span');
      unequipName.className = 'book-status-equip-option-name';
      unequipName.textContent = 'なし';
      unequipOption.appendChild(unequipName);

      const unequipState = document.createElement('span');
      unequipState.className = 'book-status-equip-option-state';
      unequipState.textContent = !this.playerData.equippedBaitId && !this.playerData.equippedLureId ? '装備中' : '';
      unequipOption.appendChild(unequipState);

      unequipOption.addEventListener('click', () => this.equipFromStatusPanel('lure', null));
      bindPreviewEvents(unequipOption, 'lure', null);
      listEl.appendChild(unequipOption);

      const ownedBaits = this.playerData.baits
        .filter((baitItem) => baitItem.count > 0)
        .map((baitItem) => {
          const bait = getBaitById(baitItem.baitId);
          if (!bait) return null;
          return { bait, count: baitItem.count };
        })
        .filter((entry): entry is { bait: NonNullable<ReturnType<typeof getBaitById>>; count: number } => !!entry)
        .sort(
          (a, b) =>
            baitConfigs.findIndex((cfg) => cfg.id === a.bait.id) -
            baitConfigs.findIndex((cfg) => cfg.id === b.bait.id),
        );
      ownedBaits.forEach(({ bait, count }) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'book-status-equip-option ui-frame-box';
        if (this.playerData.equippedBaitId === bait.id) option.classList.add('is-selected');
        option.dataset.equipType = 'bait';
        option.dataset.equipId = bait.id;

        const nameEl = document.createElement('span');
        nameEl.className = 'book-status-equip-option-name';
        nameEl.appendChild(this.createStatusEquipmentOptionIcon(bait.id));
        const textEl = document.createElement('span');
        textEl.textContent = bait.name;
        nameEl.appendChild(textEl);
        const countEl = document.createElement('span');
        countEl.className = 'book-status-equip-option-count';
        countEl.textContent = `×${count}`;
        nameEl.appendChild(countEl);
        option.appendChild(nameEl);

        const stateEl = document.createElement('span');
        stateEl.className = 'book-status-equip-option-state';
        stateEl.textContent = this.playerData.equippedBaitId === bait.id ? '装備中' : '';
        option.appendChild(stateEl);

        option.addEventListener('click', () => this.equipFromStatusPanel('bait', bait.id));
        bindPreviewEvents(option, 'bait', bait.id);
        listEl.appendChild(option);
      });

      const ownedLures = lureConfigs.filter((lure) => this.playerData.ownedLures.includes(lure.id));
      ownedLures.forEach((lure) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'book-status-equip-option ui-frame-box';
        if (this.playerData.equippedLureId === lure.id) option.classList.add('is-selected');
        option.dataset.equipType = 'lure';
        option.dataset.equipId = lure.id;

        const nameEl = document.createElement('span');
        nameEl.className = 'book-status-equip-option-name';
        nameEl.appendChild(this.createStatusEquipmentOptionIcon(lure.id));
        const textEl = document.createElement('span');
        textEl.textContent = lure.name;
        nameEl.appendChild(textEl);
        option.appendChild(nameEl);

        const stateEl = document.createElement('span');
        stateEl.className = 'book-status-equip-option-state';
        stateEl.textContent = this.playerData.equippedLureId === lure.id ? '装備中' : '';
        option.appendChild(stateEl);

        option.addEventListener('click', () => this.equipFromStatusPanel('lure', lure.id));
        bindPreviewEvents(option, 'lure', lure.id);
        listEl.appendChild(option);
      });
    }

    if (!listEl.children.length) {
      detailBody.textContent = '所持している装備がありません。';
      this.setStatusPreviewEquipment(null, null, panel);
      return;
    }

    detailBody.appendChild(listEl);
    this.syncStatusEquipmentOptionSelection(panel);
  }

  private createStatusEquipmentOptionIcon(textureId: string): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'book-status-equip-option-icon';

    if (!this.textures.exists(textureId)) {
      wrap.classList.add('is-placeholder');
      return wrap;
    }

    const frame = this.textures.getFrame(textureId);
    const sourceImage = frame.source.image as HTMLImageElement;
    if (!sourceImage) {
      wrap.classList.add('is-placeholder');
      return wrap;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'book-status-equip-option-icon-canvas';
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      wrap.classList.add('is-placeholder');
      return wrap;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 20, 20);
    ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, 20, 20);
    wrap.appendChild(canvas);
    return wrap;
  }

  private equipFromStatusPanel(type: 'rod' | 'bait' | 'lure', equipmentId: string | null) {
    let equipped = false;
    if (type === 'rod') {
      if (!equipmentId || !this.playerData.ownedRods.includes(equipmentId)) return;
      if (this.playerData.equippedRodId !== equipmentId) {
        this.playerData.equippedRodId = equipmentId;
        const rod = getRodById(equipmentId);
        if (rod) this.showResult(`${rod.name}を装備した！`, 1500);
        equipped = true;
      }
    } else if (type === 'bait') {
      if (!equipmentId || !this.playerData.baits.some((b) => b.baitId === equipmentId && b.count > 0)) return;
      if (this.playerData.equippedBaitId !== equipmentId) {
        this.playerData.equippedBaitId = equipmentId;
        this.playerData.equippedLureId = null;
        const bait = getBaitById(equipmentId);
        if (bait) this.showResult(`${bait.name}を装備した！`, 1500);
        equipped = true;
      }
    } else {
      if (equipmentId === null) {
        if (this.playerData.equippedLureId !== null || this.playerData.equippedBaitId !== null) {
          this.playerData.equippedLureId = null;
          this.playerData.equippedBaitId = null;
          this.showResult('エサ/ルアーを外した', 1500);
          equipped = true;
        }
      } else {
        if (!this.playerData.ownedLures.includes(equipmentId)) return;
        if (this.playerData.equippedLureId !== equipmentId) {
          this.playerData.equippedLureId = equipmentId;
          this.playerData.equippedBaitId = null;
          const lure = getLureById(equipmentId);
          if (lure) this.showResult(`${lure.name}を装備した！`, 1500);
          equipped = true;
        }
      }
    }

    if (equipped) {
      savePlayerData(this.playerData);
      this.updateStatusUI();
      if (this.shopOpen) this.updateShopContent();
    }

    // リストを閉じて、「変更する」選択前のステータス（能力値Info）へ戻す
    this.statusEquipmentSelectorType = null;
    this.statusNavArea = 'stats';
    this.statusPreviewEquipmentType = null;
    this.statusPreviewEquipmentId = null;

    const panel = this.unifiedBookUIElement?.querySelector('#book-status-panel') as HTMLElement | null;
    if (panel) {
      this.setStatusPreviewEquipment(null, null, panel);
      this.fillBookStatusPanel(panel);
    }
  }

  private renderStatusEquipmentIcon(container: HTMLElement | null, textureId: string | null, fallbackIcon: string | null) {
    if (!container) return;
    container.innerHTML = '';
    container.style.display = '';

    if (textureId && this.textures.exists(textureId)) {
      const canvas = document.createElement('canvas');
      canvas.className = 'book-status-equipment-icon-canvas';
      canvas.width = 32;
      canvas.height = 32;
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const frame = this.textures.getFrame(textureId);
      const sourceImage = frame.source.image as HTMLImageElement;
      if (!sourceImage) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, 32, 32);
      return;
    }

    if (!fallbackIcon) {
      container.style.display = 'none';
      return;
    }
    const emoji = document.createElement('span');
    emoji.className = 'book-status-equipment-icon-emoji';
    emoji.textContent = fallbackIcon;
    container.appendChild(emoji);
  }

  private moveStatusStatSelection(panel: HTMLElement, delta: number) {
    this.statusNavArea = 'stats';
    this.syncStatusEquipmentButtonSelection(panel);
    const items = Array.from(panel.querySelectorAll('.book-status-stat-list li')) as HTMLElement[];
    if (!items.length) return;
    const currentIndex = Math.max(0, this.statusStatOrder.indexOf(this.selectedStatusStatKey));
    const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + delta));
    if (nextIndex === currentIndex && delta !== 0) {
      if (delta < 0) {
        this.enterUnifiedBookMainTabsNav();
      } else {
        this.nudgeBookScrollOnVerticalEdge('down');
      }
      return;
    }
    const nextItem = items[nextIndex];
    if (!nextItem) return;
    const nextKey = nextItem.dataset.statKey as 'power' | 'speed' | 'technique' | 'control' | undefined;
    if (!nextKey) return;
    if (nextKey !== this.selectedStatusStatKey) {
      nextItem.click();
    }
    nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private syncStatusStatSelection(panel: HTMLElement) {
    const items = Array.from(panel.querySelectorAll('.book-status-stat-list li[data-stat-key]')) as HTMLElement[];
    if (!items.length) return;
    const shouldHighlightStat =
      !this.unifiedBookMainTabsNavActive &&
      this.statusNavArea === 'stats' &&
      !this.statusEquipmentSelectorType;
    items.forEach((item) => {
      const isSelected = shouldHighlightStat && item.dataset.statKey === this.selectedStatusStatKey;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  private syncStatusEquipmentButtonSelection(panel: HTMLElement) {
    const rodBtn = panel.querySelector('#book-status-change-rod') as HTMLElement | null;
    const lureBtn = panel.querySelector('#book-status-change-lure') as HTMLElement | null;
    if (rodBtn) {
      rodBtn.textContent = this.statusEquipmentSelectorType === 'rod' ? 'リストから選ぶ' : '変更する';
    }
    if (lureBtn) {
      lureBtn.textContent = this.statusEquipmentSelectorType === 'lure' ? 'リストから選ぶ' : '変更する';
    }
    const equipBtnKbNav =
      this.statusNavArea === 'equipmentButtons' &&
      !this.statusEquipmentSelectorType &&
      this.uiMenuNavInputChannel === 'keyboard';
    const rodSelected =
      this.statusEquipmentSelectorType === 'rod' ||
      (equipBtnKbNav && this.statusNavButtonType === 'rod');
    const lureSelected =
      this.statusEquipmentSelectorType === 'lure' ||
      (equipBtnKbNav && this.statusNavButtonType === 'lure');
    rodBtn?.classList.toggle('is-nav-selected', rodSelected);
    lureBtn?.classList.toggle('is-nav-selected', lureSelected);
    this.syncStatusStatSelection(panel);
    if (this.statusNavArea === 'equipmentButtons' && !this.statusEquipmentSelectorType) {
      const detailTitle = panel.querySelector('#book-status-detail-title') as HTMLElement | null;
      const detailText = panel.querySelector('#book-status-detail-text') as HTMLElement | null;
      const infoByButton: Record<'rod' | 'lure', string> = {
        rod: '釣り竿を選んで変更できる。竿の性能はパワー・スピード・テクニック・コントロールに影響する。',
        lure: 'エサやルアーを選んで変更できる。狙う魚や出現率のバランスを調整したい時に付け替える。',
      };
      if (detailTitle) detailTitle.textContent = 'Info';
      if (detailText) detailText.textContent = infoByButton[this.statusNavButtonType] ?? '';
      this.updateStatusDetailScrollFade(panel);
    }
  }

  private syncStatusEquipmentOptionSelection(panel: HTMLElement) {
    this.syncStatusStatSelection(panel);
    const options = Array.from(panel.querySelectorAll('.book-status-equip-option')) as HTMLElement[];
    if (!options.length) {
      this.setStatusPreviewEquipment(null, null, panel);
      return;
    }
    const keyboardOptionNavActive = this.statusNavArea === 'equipmentOptions' && this.uiMenuNavInputChannel === 'keyboard';
    const maxIndex = options.length - 1;
    this.statusNavEquipOptionIndex = Math.max(0, Math.min(maxIndex, this.statusNavEquipOptionIndex));
    options.forEach((opt, index) => {
      opt.classList.toggle(
        'is-nav-selected',
        keyboardOptionNavActive && index === this.statusNavEquipOptionIndex,
      );
    });
    if (keyboardOptionNavActive) {
      options[this.statusNavEquipOptionIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const selected = options[this.statusNavEquipOptionIndex];
      const equipType = (selected?.dataset.equipType as 'rod' | 'bait' | 'lure' | undefined) ?? this.statusEquipmentSelectorType ?? 'rod';
      const equipIdRaw = selected?.dataset.equipId;
      const equipId = equipIdRaw === '' ? null : equipIdRaw ?? null;
      this.setStatusPreviewEquipment(equipType, equipId, panel);
    } else {
      // マウス操作時は hover 中の項目を「未確定選択」として扱い、プレビューを維持する
      const hovered = options.find((opt) => opt.matches(':hover')) ?? null;
      const activeOption = hovered ?? options.find((opt) => opt.classList.contains('is-nav-selected')) ?? null;
      if (activeOption) {
        options.forEach((opt) => opt.classList.toggle('is-nav-selected', opt === activeOption));
        const equipType = (activeOption.dataset.equipType as 'rod' | 'bait' | 'lure' | undefined) ?? this.statusEquipmentSelectorType ?? 'rod';
        const equipIdRaw = activeOption.dataset.equipId;
        const equipId = equipIdRaw === '' ? null : equipIdRaw ?? null;
        this.setStatusPreviewEquipment(equipType, equipId, panel);
      } else {
        this.setStatusPreviewEquipment(null, null, panel);
      }
    }
  }

  private moveStatusEquipmentButtonSelection(panel: HTMLElement, delta: -1 | 1) {
    this.statusNavArea = 'equipmentButtons';
    const order: Array<'rod' | 'lure'> = ['rod', 'lure'];
    const current = Math.max(0, order.indexOf(this.statusNavButtonType));
    const next = Math.max(0, Math.min(order.length - 1, current + delta));
    this.statusNavButtonType = order[next] ?? 'rod';
    this.statusLastInteractedButtonType = this.statusNavButtonType;
    this.syncStatusEquipmentButtonSelection(panel);
  }

  private moveStatusEquipmentOptionSelection(panel: HTMLElement, delta: -1 | 1) {
    const options = Array.from(panel.querySelectorAll('.book-status-equip-option')) as HTMLElement[];
    if (!options.length) return;
    if (delta < 0 && this.statusNavEquipOptionIndex <= 0) {
      this.statusEquipmentSelectorType = null;
      this.statusNavArea = 'equipmentButtons';
      this.fillBookStatusPanel(panel);
      return;
    }
    this.statusNavArea = 'equipmentOptions';
    const maxIndex = options.length - 1;
    this.statusNavEquipOptionIndex = Math.max(0, Math.min(maxIndex, this.statusNavEquipOptionIndex + delta));
    this.syncStatusEquipmentOptionSelection(panel);
  }

  private triggerStatusKeyboardAction() {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'status') return;
    // Enter 起点の操作は常にキーボード入力として扱い、hover 由来の分岐を除外する
    this.noteUiMenuKeyboardNavigation();
    const panel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    if (!panel) return;
    if (this.statusNavArea === 'equipmentButtons') {
      const rodBtn = panel.querySelector('#book-status-change-rod') as HTMLButtonElement | null;
      const lureBtn = panel.querySelector('#book-status-change-lure') as HTMLButtonElement | null;
      const activeEl = document.activeElement as HTMLElement | null;
      const focusedButton =
        activeEl && panel.contains(activeEl) && activeEl.classList.contains('book-status-change-btn')
          ? (activeEl as HTMLButtonElement)
          : null;
      const navSelectedButton = panel.querySelector('.book-status-change-btn.is-nav-selected') as HTMLButtonElement | null;
      const resolvedType: 'rod' | 'lure' =
        focusedButton?.id === 'book-status-change-rod'
          ? 'rod'
          : focusedButton?.id === 'book-status-change-lure'
            ? 'lure'
            : this.statusLastInteractedButtonType
              ? this.statusLastInteractedButtonType
              : navSelectedButton?.id === 'book-status-change-rod'
                ? 'rod'
                : navSelectedButton?.id === 'book-status-change-lure'
                  ? 'lure'
                  : this.statusNavButtonType === 'lure'
                    ? 'lure'
                    : 'rod';
      this.statusNavButtonType = resolvedType;
      this.statusLastInteractedButtonType = resolvedType;
      if (rodBtn && lureBtn) {
        rodBtn.classList.toggle('is-nav-selected', resolvedType === 'rod');
        lureBtn.classList.toggle('is-nav-selected', resolvedType === 'lure');
      }
      this.openStatusEquipmentSelector(resolvedType);
      return;
    }
    if (this.statusNavArea === 'equipmentOptions') {
      const options = Array.from(panel.querySelectorAll('.book-status-equip-option')) as HTMLButtonElement[];
      options[this.statusNavEquipOptionIndex]?.click();
    }
  }

  private selectSkillTree(treeId: SkillTreeId, index: number) {
    this.unifiedBookSelectedId = treeId;
    this.unifiedBookSelectedIndex = index;
    this.setSkillNavArea('tree');
    // カテゴリ切替直後はツリー上のノード未選択。↓で一段目を選ぶまで選択なし。
    this.skillSelectedNodeId = null;
    this.unifiedBookListItems.forEach((row, i) => {
      const on = i === index;
      row.classList.toggle('state-selected', on);
      row.querySelector('.book-ui-node')?.classList.toggle('is-selected', on);
      if (on) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    this.renderSkillBookPanel();
  }

  private getUsedSkillPoints(): number {
    let used = 0;
    for (const nodeId of this.playerData.unlockedSkillNodes) {
      const def = getSkillNodeDef(nodeId);
      if (def) used += def.costSp;
    }
    return used;
  }

  private updateSkillNodeVisualStates(grid: HTMLElement) {
    const rows = grid.querySelectorAll('.book-ui-row');
    rows.forEach((row) => {
      const nodeId = row.getAttribute('data-node-id');
      const button = row.querySelector('.book-ui-node') as HTMLElement | null;
      if (!nodeId || !button) return;
      const isUnlocked = this.playerData.unlockedSkillNodes.has(nodeId as SkillNodeId);
      const isSelected = button.classList.contains('is-selected');
      const isAvailable = button.classList.contains('is-available');
      row.classList.toggle('state-obtained', isUnlocked);
      row.classList.toggle('state-selected', isSelected);
      row.classList.toggle('state-available', !isUnlocked && isAvailable);
      row.classList.toggle('state-locked', !isUnlocked && !isSelected && !isAvailable);
    });
  }

  private renderSkillBookPanel() {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'skills') return;
    const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
    if (!panel) return;

    // 左リストの選択が一瞬ずれていても、現在見ているノードのツリーを優先（解放直後などに power_n01 へ戻らない）
    const noListSelection =
      this.unifiedBookSelectedIndex === null && this.unifiedBookSelectedId === null;

    let treeId: SkillTreeId = 'power';
    const selNodeDef = this.skillSelectedNodeId ? getSkillNodeDef(this.skillSelectedNodeId) : undefined;
    if (selNodeDef && SKILL_TREE_IDS.includes(selNodeDef.treeId)) {
      treeId = selNodeDef.treeId;
    } else {
      const bookTree = this.unifiedBookSelectedId as SkillTreeId;
      if (bookTree && SKILL_TREE_IDS.includes(bookTree)) treeId = bookTree;
    }

    if (noListSelection && !selNodeDef) {
      const activeTab = panel.querySelector('.book-skill-category-tab.is-active') as HTMLElement | null;
      const at = activeTab?.dataset.treeId as SkillTreeId | undefined;
      if (at && SKILL_TREE_IDS.includes(at)) treeId = at;
    }

    const treeIdx = SKILL_TREE_IDS.indexOf(treeId);
    if (treeIdx >= 0) {
      if (!noListSelection) {
        this.unifiedBookSelectedId = treeId;
        this.unifiedBookSelectedIndex = treeIdx;
      }
      if (this.unifiedBookListItems.length > 0) {
        this.unifiedBookListItems.forEach((row, i) => {
          const on = !noListSelection && i === treeIdx;
          row.classList.toggle('state-selected', on);
          row.querySelector('.book-ui-node')?.classList.toggle('is-selected', on);
        });
      }
    }

    const spEl = panel.querySelector('#book-skill-sp');
    if (spEl) spEl.textContent = String(this.playerData.skillPoints);
    const usedSpEl = panel.querySelector('#book-skill-sp-used');
    if (usedSpEl) usedSpEl.textContent = String(this.getUsedSkillPoints());
    const unlockedCountEl = panel.querySelector('#book-skill-unlocked-count');
    if (unlockedCountEl) unlockedCountEl.textContent = String(this.playerData.unlockedSkillNodes.size);

    const categoryTabs = panel.querySelectorAll('.book-skill-category-tab');
    categoryTabs.forEach((el, idx) => {
      const btn = el as HTMLButtonElement;
      const tid = btn.dataset.treeId as SkillTreeId | undefined;
      const active = tid === treeId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      if (!btn.dataset.boundClick) {
        btn.dataset.boundClick = '1';
        btn.addEventListener('click', () => {
          const nextTreeId = btn.dataset.treeId as SkillTreeId | undefined;
          if (!nextTreeId || !SKILL_TREE_IDS.includes(nextTreeId)) return;
          this.selectSkillTree(nextTreeId, idx);
        });
      }
    });

    const grid = panel.querySelector('#book-skill-tree-grid') as HTMLElement;
    grid.innerHTML = '';
    const nodes = getSkillNodesForTree(treeId);
    const unlocked = this.playerData.unlockedSkillNodes;

    for (const def of nodes) {
      const row = document.createElement('div');
      row.className = 'book-ui-row';
      row.setAttribute('data-node-id', def.id);
      row.setAttribute('data-slot', def.slot);

      const marker = document.createElement('span');
      marker.className = `book-ui-marker ${def.kind === 'ability' ? 'is-ability' : 'is-passive'}`;
      marker.setAttribute('aria-hidden', 'true');
      marker.innerHTML = '<span class="book-ui-marker-inner"></span>';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'book-ui-node ui-frame-box';
      btn.setAttribute('data-node-id', def.id);
      btn.setAttribute('data-slot', def.slot);
      const unlockedHere = unlocked.has(def.id);
      const can = canUnlockSkillNode(this.playerData, def.id).ok;
      btn.classList.toggle('is-unlocked', unlockedHere);
      btn.classList.toggle('is-available', !unlockedHere && can);
      btn.classList.toggle('is-locked', !unlockedHere && !can);
      btn.innerHTML = `
        <span class="book-ui-node-main">
          <span class="book-ui-node-name">${def.name}</span>
          <span class="book-ui-node-meta"><span class="book-skill-cost-num">${def.costSp}</span> SP</span>
        </span>
      `;
      const handleSelect = () => {
        this.skillSelectedNodeId = def.id;
        grid.querySelectorAll('.book-ui-node').forEach((el) => {
          el.classList.toggle('is-selected', el === btn);
        });
        this.updateSkillNodeVisualStates(grid);
        this.updateSkillDetailPanel(panel);
      };
      btn.addEventListener('click', handleSelect);
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.book-ui-node')) return;
        handleSelect();
      });

      row.appendChild(marker);
      row.appendChild(btn);
      grid.appendChild(row);
    }

    if (this.skillSelectedNodeId) {
      const sd = getSkillNodeDef(this.skillSelectedNodeId);
      if (!sd || sd.treeId !== treeId) {
        this.skillSelectedNodeId = null;
      }
    }
    // 行 .book-ui-row にも data-node-id があるため、必ずノードボタンを対象にする
    let selBtn: HTMLElement | null = null;
    if (this.skillSelectedNodeId) {
      selBtn = grid.querySelector(
        `.book-ui-node[data-node-id="${this.skillSelectedNodeId}"]`,
      ) as HTMLElement | null;
      if (!selBtn) {
        this.skillSelectedNodeId = null;
      }
    }
    grid.querySelectorAll('.book-ui-node').forEach((el) => el.classList.remove('is-selected'));
    if (selBtn) selBtn.classList.add('is-selected');

    this.updateSkillNodeVisualStates(grid);

    this.updateSkillDetailPanel(panel);
  }

  private clearSkillDetailPanel(root: HTMLElement) {
    const nameEl = root.querySelector('#book-skill-detail-name');
    if (nameEl) nameEl.innerHTML = 'スキルを選択すると<br />説明が見られるよ';
    const descEl = root.querySelector('#book-skill-detail-desc');
    if (descEl) descEl.textContent = '';
    const prereqEl = root.querySelector('#book-skill-detail-prereq');
    if (prereqEl) prereqEl.textContent = '';
    const costEl = root.querySelector('#book-skill-detail-cost');
    if (costEl) costEl.textContent = '';
    const unlockBtn = root.querySelector('#book-skill-unlock') as HTMLButtonElement | null;
    if (unlockBtn) {
      unlockBtn.style.display = 'none';
      unlockBtn.disabled = true;
      unlockBtn.textContent = '解放する';
      unlockBtn.classList.remove('book-skill-unlock--obtained');
    }
    const hint = root.querySelector('#book-skill-detail-hint');
    if (hint) hint.textContent = '';
  }

  private openSkillUnlockConfirm(nodeId: SkillNodeId) {
    const def = getSkillNodeDef(nodeId);
    if (!def || !this.unifiedBookUIElement) return;
    const layer = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-layer') as HTMLElement | null;
    const msg = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-message');
    if (msg) msg.textContent = `${def.costSp}SPを消費してスキルを解放しますか？`;
    this.skillUnlockConfirmPendingNodeId = nodeId;
    this.skillUnlockConfirmFocus = 'cancel';
    this.syncSkillUnlockConfirmSelection();
    if (layer) {
      layer.style.display = 'flex';
      layer.setAttribute('aria-hidden', 'false');
    }
    const cancelBtn = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-cancel') as HTMLButtonElement | null;
    requestAnimationFrame(() => {
      cancelBtn?.focus();
    });
  }

  private closeSkillUnlockConfirm() {
    this.skillUnlockConfirmPendingNodeId = null;
    this.skillUnlockConfirmFocus = 'cancel';
    const layer = this.unifiedBookUIElement?.querySelector('#skill-unlock-confirm-layer') as HTMLElement | null;
    if (layer) {
      layer.style.display = 'none';
      layer.setAttribute('aria-hidden', 'true');
    }
    const cancel = this.unifiedBookUIElement?.querySelector('#skill-unlock-confirm-cancel');
    const ok = this.unifiedBookUIElement?.querySelector('#skill-unlock-confirm-ok');
    cancel?.classList.remove('is-nav-selected');
    ok?.classList.remove('is-nav-selected');
  }

  private syncSkillUnlockConfirmSelection() {
    if (!this.unifiedBookUIElement) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const cancel = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-cancel');
    const ok = this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-ok');
    cancel?.classList.toggle('is-nav-selected', kb && this.skillUnlockConfirmFocus === 'cancel');
    ok?.classList.toggle('is-nav-selected', kb && this.skillUnlockConfirmFocus === 'ok');
  }

  /** スキル解放確認を表示中のみ。Phaser の矢印（カーソルキー）で左右移動。 */
  private handleSkillUnlockConfirmNavigation() {
    if (!this.skillUnlockConfirmPendingNodeId || !this.unifiedBookUIElement) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.noteUiMenuKeyboardNavigation();
      this.skillUnlockConfirmFocus = 'cancel';
      this.syncSkillUnlockConfirmSelection();
      (this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-cancel') as HTMLButtonElement | null)?.focus();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.noteUiMenuKeyboardNavigation();
      this.skillUnlockConfirmFocus = 'ok';
      this.syncSkillUnlockConfirmSelection();
      (this.unifiedBookUIElement.querySelector('#skill-unlock-confirm-ok') as HTMLButtonElement | null)?.focus();
    }
  }

  private applySkillUnlockConfirm() {
    const nodeId = this.skillUnlockConfirmPendingNodeId;
    if (!nodeId) return;
    this.closeSkillUnlockConfirm();
    const r = tryUnlockSkillNode(this.playerData, nodeId);
    if (r.ok) {
      savePlayerData(this.playerData);
      this.updateStatusUI();
      this.renderSkillBookPanel();
      if (this.unifiedBookOpen && this.unifiedBookTab === 'status' && this.unifiedBookUIElement) {
        const statusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
        if (statusPanel && statusPanel.style.display !== 'none') {
          this.fillBookStatusPanel(statusPanel);
        }
      }
      this.showResult('スキルを解放しました', 1200);
    } else if (r.reason) {
      this.showResult(r.reason, 1600);
    }
  }

  private updateSkillDetailPanel(panel?: HTMLElement | null) {
    const root = panel ?? (this.unifiedBookUIElement?.querySelector('#book-skill-panel') as HTMLElement | null);
    if (!root) return;
    if (!this.skillSelectedNodeId) {
      this.clearSkillDetailPanel(root);
      this.setSkillNavArea(this.skillNavArea);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.updateUnifiedBookRightPaneScrollFade();
          this.updateBookSkillTreeScrollFade();
        });
      });
      return;
    }
    const def = getSkillNodeDef(this.skillSelectedNodeId);
    if (!def) return;

    const nameEl = root.querySelector('#book-skill-detail-name');
    if (nameEl) nameEl.textContent = def.name;

    const descEl = root.querySelector('#book-skill-detail-desc');
    if (descEl) descEl.textContent = def.description;

    const prereqEl = root.querySelector('#book-skill-detail-prereq');
    if (prereqEl) {
      prereqEl.textContent =
        def.requires.length === 0
          ? '前提: なし'
          : `前提: ${def.requires.map((r) => getSkillNodeDef(r)?.name ?? r).join('、')}`;
    }

    const costEl = root.querySelector('#book-skill-detail-cost');
    if (costEl) costEl.textContent = `コスト: ${def.costSp} SP`;

    const unlocked = this.playerData.unlockedSkillNodes.has(def.id);
    const prereqMet = def.requires.every((req) => this.playerData.unlockedSkillNodes.has(req));
    const unlockBtn = root.querySelector('#book-skill-unlock') as HTMLButtonElement | null;
    if (unlockBtn) {
      unlockBtn.style.display = '';
      unlockBtn.classList.toggle('book-skill-unlock--obtained', unlocked);
      if (unlocked) {
        unlockBtn.disabled = true;
        unlockBtn.textContent = '解放済み';
      } else {
        unlockBtn.disabled = !prereqMet;
        unlockBtn.textContent = !prereqMet ? '解放不可' : '解放する';
      }
    }

    const hint = root.querySelector('#book-skill-detail-hint');
    if (hint) {
      if (unlocked) {
        hint.textContent = '';
      } else {
        const c = canUnlockSkillNode(this.playerData, def.id);
        hint.textContent = c.ok ? '' : c.reason ?? '';
      }
    }

    this.setSkillNavArea(this.skillNavArea);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateUnifiedBookRightPaneScrollFade();
        this.updateBookSkillTreeScrollFade();
      });
    });
  }

  /** スキルカテゴリを隣に切り替え。端では false（呼び出し側で Book タブ遷移などに使う） */
  private switchSkillTreeByDelta(delta: number): boolean {
    const currentSelectedNode = this.skillSelectedNodeId ? getSkillNodeDef(this.skillSelectedNodeId) : null;
    const selectedSlot = currentSelectedNode?.slot ?? null;
    let currentTree = (this.unifiedBookSelectedId as SkillTreeId) || SKILL_TREE_IDS[0];
    if (!SKILL_TREE_IDS.includes(currentTree)) currentTree = SKILL_TREE_IDS[0];
    const currentIdx = SKILL_TREE_IDS.indexOf(currentTree);
    const nextIdx = Math.max(0, Math.min(SKILL_TREE_IDS.length - 1, currentIdx + delta));
    if (nextIdx === currentIdx) return false;
    this.selectSkillTree(SKILL_TREE_IDS[nextIdx], nextIdx);
    if (selectedSlot !== null && this.unifiedBookUIElement) {
      const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
      const sameSlotNode = panel?.querySelector(
        `#book-skill-tree-grid .book-ui-node[data-slot="${selectedSlot}"]`,
      ) as HTMLButtonElement | null;
      if (sameSlotNode) {
        sameSlotNode.click();
        sameSlotNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    return true;
  }

  /** スキルタブで左右が「これ以上進めない」とき、現在タブの上部タブ列へ戻す */
  private switchUnifiedBookTabWhenSkillHorizontalEdge(delta: -1 | 1) {
    void delta;
    this.enterUnifiedBookMainTabsNav();
    this.unifiedBookNavNextMoveAt = this.time.now + this.unifiedBookNavInitialDelayMs;
  }

  private getSkillUnlockButton(): HTMLButtonElement | null {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'skills') return null;
    const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
    if (!panel) return null;
    const unlockBtn = panel.querySelector('#book-skill-unlock') as HTMLButtonElement | null;
    if (!unlockBtn || unlockBtn.style.display === 'none' || unlockBtn.disabled) return null;
    return unlockBtn;
  }

  private setSkillNavArea(area: 'category' | 'tree' | 'unlock') {
    const nextArea = area === 'unlock' && !this.getSkillUnlockButton() ? 'tree' : area;
    this.skillNavArea = nextArea;
    this.syncSkillNavAreaChrome();
  }

  private syncSkillNavAreaChrome() {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'skills') return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const tabs = this.unifiedBookUIElement.querySelector('#book-skill-category-tabs') as HTMLElement | null;
    if (tabs) tabs.classList.toggle('is-nav-selected', kb && this.skillNavArea === 'category');
    const unlockBtn = this.unifiedBookUIElement.querySelector('#book-skill-unlock') as HTMLButtonElement | null;
    if (unlockBtn) {
      unlockBtn.classList.toggle(
        'is-nav-selected',
        kb && this.skillNavArea === 'unlock' && unlockBtn.style.display !== 'none',
      );
    }
  }

  /** オーバーフロー時のみ scrollTop を動かし、動かしたら true */
  private nudgeScrollContainer(scrollEl: HTMLElement | null, deltaY: number): boolean {
    if (!scrollEl || deltaY === 0) return false;
    const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    if (max <= 0) return false;
    const next = Math.min(max, Math.max(0, scrollEl.scrollTop + deltaY));
    if (Math.abs(next - scrollEl.scrollTop) < 1) return false;
    scrollEl.scrollTo({ top: next, behavior: 'smooth' });
    requestAnimationFrame(() => {
      this.updateUnifiedBookListScrollFade();
      this.updateUnifiedBookRightPaneScrollFade();
      this.updateBookSkillTreeScrollFade();
    });
    return true;
  }

  /** 上部タブ行へフォーカス移動したとき、各タブ内スクロールを先頭に戻す */
  private resetUnifiedBookTabScrollToTop() {
    const targets: Array<HTMLElement | null> = [
      this.unifiedBookListScrollElement,
      this.unifiedBookRightPaneScrollElement,
      this.bookSkillTreeScrollElement,
    ];
    let changed = false;
    targets.forEach((el) => {
      if (!el || el.scrollTop <= 0) return;
      el.scrollTop = 0;
      changed = true;
    });
    if (!changed) return;
    requestAnimationFrame(() => {
      this.updateUnifiedBookListScrollFade();
      this.updateUnifiedBookRightPaneScrollFade();
      this.updateBookSkillTreeScrollFade();
    });
  }

  /** 左リスト→右ペインの順で、端での上下入力に応じてスクロール */
  private nudgeBookScrollOnVerticalEdge(dir: 'up' | 'down'): boolean {
    const step = this.BOOK_EDGE_SCROLL_STEP_PX;
    const deltaY = dir === 'down' ? step : -step;
    if (this.nudgeScrollContainer(this.unifiedBookListScrollElement, deltaY)) return true;
    if (this.unifiedBookTab === 'skills' && this.nudgeScrollContainer(this.bookSkillTreeScrollElement, deltaY)) return true;
    if (this.nudgeScrollContainer(this.unifiedBookRightPaneScrollElement, deltaY)) return true;
    return false;
  }

  /** スキルカテゴリ行が右ペイン内で見えるようスクロール（ツリー下位から上に戻ったとき用） */
  private ensureSkillCategoryVisibleInRightPane() {
    const wrap = this.unifiedBookRightPaneScrollElement;
    if (!wrap || this.unifiedBookTab !== 'skills') return;
    const target =
      (wrap.querySelector('.book-skill-head-row') as HTMLElement | null) ??
      (wrap.querySelector('#book-skill-category-tabs') as HTMLElement | null);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() => this.updateUnifiedBookRightPaneScrollFade());
  }

  /** カテゴリに戻したとき、ツリー行の選択ハイライトと詳細を未選択状態にする */
  private clearSkillTreeRowKeyboardSelection() {
    if (!this.unifiedBookUIElement || this.unifiedBookTab !== 'skills') return;
    this.skillSelectedNodeId = null;
    const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
    if (!panel) return;
    const grid = panel.querySelector('#book-skill-tree-grid') as HTMLElement | null;
    if (grid) {
      grid.querySelectorAll('.book-ui-node').forEach((el) => el.classList.remove('is-selected'));
      this.updateSkillNodeVisualStates(grid);
    }
    this.updateSkillDetailPanel(panel);
  }

  /** スキルタブの矢印（バッグ/図鑑と同様の長押しリピートは handleUnifiedBookNavigation 側で制御） */
  private handleSkillBookArrowNavigation(dir: 'up' | 'down' | 'left' | 'right') {
    if (!this.unifiedBookUIElement) return;
    const rightPane = this.unifiedBookRightPaneScrollElement;
    const edgeStep = this.BOOK_EDGE_SCROLL_STEP_PX;

    if (dir === 'up') {
      if (this.skillNavArea === 'tree') {
        const moved = this.moveSkillNodeSelection(-1);
        if (!moved) {
          this.setSkillNavArea('category');
          this.clearSkillTreeRowKeyboardSelection();
          this.ensureSkillCategoryVisibleInRightPane();
        }
      } else if (this.skillNavArea === 'unlock') {
        this.setSkillNavArea('category');
        this.clearSkillTreeRowKeyboardSelection();
        this.ensureSkillCategoryVisibleInRightPane();
      } else if (this.skillNavArea === 'category') {
        this.enterUnifiedBookMainTabsNav();
      }
      return;
    }
    if (dir === 'down') {
      if (this.skillNavArea === 'category') {
        this.setSkillNavArea('tree');
        if (!this.skillSelectedNodeId) {
          const skillPanel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
          const firstNode = skillPanel?.querySelector(
            '#book-skill-tree-grid .book-ui-node',
          ) as HTMLElement | null;
          if (firstNode) {
            firstNode.click();
            firstNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      } else if (this.skillNavArea === 'tree') {
        const moved = this.moveSkillNodeSelection(1);
        if (!moved) {
          if (!this.nudgeScrollContainer(this.bookSkillTreeScrollElement, edgeStep)) {
            this.nudgeScrollContainer(rightPane, edgeStep);
          }
        }
      } else if (this.skillNavArea === 'unlock') {
        this.nudgeScrollContainer(rightPane, edgeStep);
      }
      return;
    }
    if (dir === 'left') {
      if (this.skillNavArea === 'unlock') {
        this.setSkillNavArea('tree');
      } else {
        const wasCategory = this.skillNavArea === 'category';
        if (!this.switchSkillTreeByDelta(-1)) {
          if (wasCategory) {
            const lastIdx = SKILL_TREE_IDS.length - 1;
            this.selectSkillTree(SKILL_TREE_IDS[lastIdx], lastIdx);
          } else {
            this.switchUnifiedBookTabWhenSkillHorizontalEdge(-1);
          }
        }
        if (wasCategory) {
          this.clearSkillTreeRowKeyboardSelection();
          this.setSkillNavArea('category');
          this.ensureSkillCategoryVisibleInRightPane();
        }
      }
      return;
    }
    if (dir === 'right') {
      if (this.skillNavArea === 'category') {
        if (!this.switchSkillTreeByDelta(1)) {
          this.selectSkillTree(SKILL_TREE_IDS[0], 0);
        }
        this.clearSkillTreeRowKeyboardSelection();
        this.setSkillNavArea('category');
        this.ensureSkillCategoryVisibleInRightPane();
      } else if (this.skillNavArea === 'tree') {
        // 右端: 解放ボタンがあればそちらへ。なければ次カテゴリへ飛ばず、現在のカテゴリタブへ戻る
        if (this.getSkillUnlockButton()) {
          this.setSkillNavArea('unlock');
        } else {
          this.setSkillNavArea('category');
          this.clearSkillTreeRowKeyboardSelection();
          this.ensureSkillCategoryVisibleInRightPane();
        }
      } else if (this.skillNavArea === 'unlock') {
        // 解放ボタンからの右: 次カテゴリへ即切替せず、現在のカテゴリタブへ
        this.setSkillNavArea('category');
        this.clearSkillTreeRowKeyboardSelection();
        this.ensureSkillCategoryVisibleInRightPane();
      }
    }
  }

  private moveSkillNodeSelection(delta: number): boolean {
    if (!this.unifiedBookUIElement) return false;
    const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
    if (!panel) return false;
    const buttons = Array.from(panel.querySelectorAll('#book-skill-tree-grid .book-ui-node')) as HTMLElement[];
    if (!buttons.length) return false;

    let currentIdx = buttons.findIndex((btn) => btn.classList.contains('is-selected'));
    if (currentIdx < 0 && this.skillSelectedNodeId) {
      currentIdx = buttons.findIndex((btn) => btn.getAttribute('data-node-id') === this.skillSelectedNodeId);
    }
    if (currentIdx < 0) {
      if (delta > 0) {
        buttons[0]?.click();
        buttons[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return true;
      }
      return false;
    }

    const nextIdx = Math.max(0, Math.min(buttons.length - 1, currentIdx + delta));
    if (nextIdx === currentIdx) return false;
    buttons[nextIdx]?.click();
    buttons[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return true;
  }

  private triggerSkillDetailAction() {
    if (!this.unifiedBookUIElement) return;
    const panel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;
    if (!panel) return;
    const unlockBtn = panel.querySelector('#book-skill-unlock') as HTMLButtonElement | null;
    if (!unlockBtn || unlockBtn.style.display === 'none' || unlockBtn.disabled) return;
    unlockBtn.click();
    this.setSkillNavArea('unlock');
  }

  updateUnifiedBookList() {
    if (!this.unifiedBookListScrollElement) return;

    // 既存のアイテムをクリア
    this.unifiedBookListScrollElement.innerHTML = '';
    this.unifiedBookListItems = [];

    // 実績・クエストタブ以外の場合は、リスト用のインラインをリセット
    if (this.unifiedBookTab !== 'achievement' && this.unifiedBookTab !== 'quest') {
      this.unifiedBookListScrollElement.classList.remove('achievement-list-container');
      this.unifiedBookListScrollElement.style.display = '';
      this.unifiedBookListScrollElement.style.flexDirection = '';
      this.unifiedBookListScrollElement.style.gridTemplateColumns = '';
      this.unifiedBookListScrollElement.style.gridTemplateRows = '';
      this.unifiedBookListScrollElement.style.gap = '';
      this.unifiedBookListScrollElement.style.padding = '';
      this.unifiedBookListScrollElement.style.width = '';
      this.unifiedBookListScrollElement.style.alignItems = '';
    }

    if (this.unifiedBookTab === 'status') {
      // 左リストなし。詳細はステータスパネル側。
    } else if (this.unifiedBookTab === 'inventory') {
      // インベントリタブ
      const flatInventory = getInventoryDisplayOrder(this.playerData);

      let createdFishCount = 0;
      flatInventory.forEach((entry, index) => {
        const fish = getFishById(entry.fishId);
        if (!fish) return;

        const item = this.createUnifiedBookListItem(fish, index, true, entry);
        this.unifiedBookListScrollElement.appendChild(item);
        this.unifiedBookListItems.push(item);
        createdFishCount++;
      });

      // バッグの容量（最大スロット数）ぶん、空のカードも表示する
      const remainingSlots = Math.max(0, this.playerData.maxInventorySlots - createdFishCount);
      for (let i = 0; i < remainingSlots; i++) {
        const emptySlot = this.createUnifiedBookEmptySlotItem();
        this.unifiedBookListScrollElement.appendChild(emptySlot);
      }
    } else if (this.unifiedBookTab === 'pedia') {
      // 図鑑タブ（ソート単位で見出し行を挿入。見出しは unifiedBookListItems に含めない）
      this.syncBookPediaSortBarUI();
      const fishList = this.getSortedPediaFishList(this.getRealFishList());
      let lastSectionKey: string | null = null;
      fishList.forEach((fish, index) => {
        const sectionKey =
          this.unifiedBookPediaSortMode === 'rarity' ? String(fish.rarity) : String(fish.habitat);
        if (sectionKey !== lastSectionKey) {
          lastSectionKey = sectionKey;
          const headingRow = document.createElement('div');
          headingRow.className = 'book-ui-row book-pedia-section-row';
          headingRow.setAttribute('data-pedia-section', sectionKey);
          const label = document.createElement('div');
          label.className = 'book-pedia-section-label';
          label.textContent = this.getPediaSectionHeadingLabel(sectionKey);
          headingRow.appendChild(label);
          this.unifiedBookListScrollElement.appendChild(headingRow);
        }
        const isCaught = this.playerData.caughtFishIds.has(fish.id);
        const item = this.createUnifiedBookListItem(fish, index, isCaught);
        this.unifiedBookListScrollElement.appendChild(item);
        this.unifiedBookListItems.push(item);
      });
    } else if (this.unifiedBookTab === 'aquarium') {
      this.renderAquariumBookList();
    } else if (this.unifiedBookTab === 'skills') {
      SKILL_TREE_IDS.forEach((treeId, index) => {
        const row = document.createElement('div');
        row.className = 'book-ui-row state-obtained';
        row.setAttribute('data-tree-id', treeId);
        row.setAttribute('data-index', String(index));

        const item = document.createElement('div');
        item.className = 'book-ui-node ui-frame-box book-list-item';

        const icon = document.createElement('div');
        icon.className = 'book-list-item-icon';
        const emoji = document.createElement('div');
        emoji.className = 'book-list-item-emoji';
        const emojiChar =
          treeId === 'power'
            ? '💪'
            : treeId === 'speed'
              ? '⚡'
              : treeId === 'technique'
                ? '🎯'
                : treeId === 'control'
                  ? '✋'
                  : '✨';
        emoji.textContent = emojiChar;
        icon.appendChild(emoji);

        const info = document.createElement('div');
        info.className = 'book-list-item-info';
        const name = document.createElement('div');
        name.className = 'book-list-item-name';
        name.textContent = SKILL_TREE_LABELS[treeId];
        const meta = document.createElement('div');
        meta.className = 'book-list-item-meta';
        meta.textContent = 'スキルツリー';
        info.appendChild(name);
        info.appendChild(meta);

        item.appendChild(icon);
        item.appendChild(info);
        row.appendChild(item);
        row.addEventListener('click', () => this.selectSkillTree(treeId, index));
        this.unifiedBookListScrollElement.appendChild(row);
        this.unifiedBookListItems.push(row);
      });
    } else if (this.unifiedBookTab === 'achievement') {
      const categories = getAllCategories();
      categories.forEach((category, index) => {
        const achievements = getAchievementsByCategory(category);
        const categoryItem = this.createAchievementCategoryItem(category, achievements.length, index);
        this.unifiedBookListScrollElement.appendChild(categoryItem);
        this.unifiedBookListItems.push(categoryItem);
      });
    } else if (this.unifiedBookTab === 'quest') {
      const questLogCategories = ['active', 'completed'] as const;
      questLogCategories.forEach((category, index) => {
        const count =
          category === 'active'
            ? getActiveQuests(this.playerData).length
            : getCompletedQuests(this.playerData).length;
        const categoryItem = this.createQuestLogCategoryItem(category, count, index);
        this.unifiedBookListScrollElement.appendChild(categoryItem);
        this.unifiedBookListItems.push(categoryItem);
      });
    } else {
      // バッグ・図鑑タブの場合は通常のリスト表示
      this.unifiedBookListScrollElement.classList.remove('achievement-list-container');
      this.unifiedBookListScrollElement.style.display = '';
      this.unifiedBookListScrollElement.style.gridTemplateColumns = '';
      this.unifiedBookListScrollElement.style.gridTemplateRows = '';
      this.unifiedBookListScrollElement.style.gap = '';
      this.unifiedBookListScrollElement.style.padding = '';
    }

    // 初期状態では1つ目を選択状態にする（ホバーでは切り替えない方針）
    if (
      this.unifiedBookListItems.length > 0 &&
      this.unifiedBookSelectedIndex === null &&
      !this.unifiedBookMainTabsNavActive
    ) {
      if (this.unifiedBookTab === 'achievement') {
        const firstCategory = this.unifiedBookListItems[0]?.getAttribute('data-category');
        if (firstCategory) this.selectAchievementCategory(firstCategory, 0);
      } else if (this.unifiedBookTab === 'quest') {
        this.selectQuestLogCategory('active', 0);
      } else if (this.unifiedBookTab === 'skills') {
        this.selectSkillTree(SKILL_TREE_IDS[0], 0);
      } else if (this.unifiedBookTab === 'aquarium') {
        // キー操作時のみ先頭スロットにカーソルを置く。マウスでは仮選択（浮き）だけ出して詳細が空に見えるのを防ぐ
        if (this.uiMenuNavInputChannel === 'keyboard') {
          const firstId = this.unifiedBookListItems[0]?.getAttribute('data-aquarium-id');
          if (firstId) this.selectAquariumBookItem(firstId, 0);
          else this.renderAquariumIdleDetail();
        } else {
          this.renderAquariumIdleDetail();
        }
      } else if (this.unifiedBookTab !== 'status') {
        const firstFishId = this.unifiedBookListItems[0]?.getAttribute('data-fish-id');
        if (firstFishId) this.selectUnifiedBookItem(firstFishId, 0);
      }
    } else if (this.unifiedBookTab === 'skills' && this.unifiedBookListItems.length > 0) {
      if (this.unifiedBookSelectedIndex === null || this.unifiedBookSelectedId === null) {
        this.unifiedBookListItems.forEach((row) => {
          row.classList.remove('state-selected');
          row.querySelector('.book-ui-node')?.classList.remove('is-selected');
        });
        this.renderSkillBookPanel();
      } else {
        const idx = Math.min(this.unifiedBookSelectedIndex, this.unifiedBookListItems.length - 1);
        this.unifiedBookListItems.forEach((row, i) => {
          const on = i === idx;
          row.classList.toggle('state-selected', on);
          row.querySelector('.book-ui-node')?.classList.toggle('is-selected', on);
        });
        const tid = this.unifiedBookListItems[idx]?.getAttribute('data-tree-id') as SkillTreeId | undefined;
        if (tid && SKILL_TREE_IDS.includes(tid)) {
          this.unifiedBookSelectedId = tid;
          this.unifiedBookSelectedIndex = idx;
        }
        this.renderSkillBookPanel();
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateUnifiedBookListScrollFade());
    });
  }

  private setupUnifiedBookListScrollFade() {
    const el = this.unifiedBookListScrollElement;
    if (!el || !this.unifiedBookListScrollFadeBottomElement || !this.unifiedBookListScrollFadeTopElement) return;

    const update = () => this.updateUnifiedBookListScrollFade();
    el.addEventListener('scroll', update, { passive: true });

    this.bookListScrollFadeObserver = new ResizeObserver(update);
    this.bookListScrollFadeObserver.observe(el);
    const wrap = el.parentElement;
    if (wrap) this.bookListScrollFadeObserver.observe(wrap);
  }

  private setupUnifiedBookRightPaneScrollFade() {
    const el = this.unifiedBookRightPaneScrollElement;
    if (!el || !this.unifiedBookRightPaneFadeTopElement || !this.unifiedBookRightPaneFadeBottomElement) return;

    const update = () => this.updateUnifiedBookRightPaneScrollFade();
    el.addEventListener('scroll', update, { passive: true });

    this.bookRightPaneScrollFadeObserver = new ResizeObserver(update);
    this.bookRightPaneScrollFadeObserver.observe(el);
    const wrap = el.parentElement;
    if (wrap)     this.bookRightPaneScrollFadeObserver.observe(wrap);
    const inner = el.querySelector('.book-right-pane-inner');
    if (inner) this.bookRightPaneScrollFadeObserver.observe(inner);
  }

  private setupBookSkillTreeScrollFade() {
    const el = this.bookSkillTreeScrollElement;
    if (!el || !this.bookSkillTreeFadeTopElement || !this.bookSkillTreeFadeBottomElement) return;

    const update = () => this.updateBookSkillTreeScrollFade();
    el.addEventListener('scroll', update, { passive: true });

    this.bookSkillTreeScrollFadeObserver = new ResizeObserver(update);
    this.bookSkillTreeScrollFadeObserver.observe(el);
    const wrap = el.parentElement;
    if (wrap) this.bookSkillTreeScrollFadeObserver.observe(wrap);
    const grid = el.querySelector('#book-skill-tree-grid');
    if (grid) this.bookSkillTreeScrollFadeObserver.observe(grid);
    requestAnimationFrame(update);
  }

  private updateBookSkillTreeScrollFade() {
    this.updateScrollFadeIndicators(
      this.bookSkillTreeScrollElement,
      this.bookSkillTreeFadeTopElement,
      this.bookSkillTreeFadeBottomElement,
    );
  }

  private setupAquariumBagPickScrollFade() {
    const el = this.aquariumBagPickGridElement;
    if (!el || !this.aquariumBagPickFadeTopElement || !this.aquariumBagPickFadeBottomElement) return;

    const update = () => {
      this.updateAquariumBagPickScrollFade();
      this.refreshKbSelectionPointer();
    };
    el.addEventListener('scroll', update, { passive: true });

    this.aquariumBagPickScrollFadeObserver = new ResizeObserver(update);
    this.aquariumBagPickScrollFadeObserver.observe(el);
    const wrap = el.parentElement;
    if (wrap) this.aquariumBagPickScrollFadeObserver.observe(wrap);
    requestAnimationFrame(update);
  }

  private updateAquariumBagPickScrollFade() {
    // 先頭行抑制はキー選択時のみ（マウスでは navIndex が先頭のまま残り上グラデが出ない）
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const selectedIndex =
      kb && this.aquariumBagPickFocus === 'grid' ? this.aquariumBagPickNavIndex : -1;
    this.updateScrollFadeIndicators(
      this.aquariumBagPickGridElement,
      this.aquariumBagPickFadeTopElement,
      this.aquariumBagPickFadeBottomElement,
      selectedIndex >= 0
        ? {
            selectedIndex,
            itemCount: this.getAquariumBagPickCards().length,
            columns: 3,
          }
        : undefined,
    );
  }

  private updateScrollFadeIndicators(
    scrollEl: HTMLElement | null,
    fadeTop: HTMLElement | null,
    fadeBottom: HTMLElement | null,
    edgeSelection?: {
      selectedIndex: number;
      itemCount: number;
      columns: number;
    },
  ) {
    if (!scrollEl || !fadeTop || !fadeBottom) return;

    const cs = window.getComputedStyle(scrollEl);
    if (cs.display === 'none' || cs.visibility === 'hidden') {
      fadeBottom.classList.remove('is-visible');
      fadeTop.classList.remove('is-visible');
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const epsilon = 3;
    const overflowY = scrollHeight > clientHeight + epsilon;
    let moreBelow = overflowY && scrollTop + clientHeight < scrollHeight - epsilon;
    let moreAbove = overflowY && scrollTop > epsilon;

    // 選択が先頭行／末尾行のとき、その側のグラデは出さない（端カードに被らないように）
    if (edgeSelection && edgeSelection.itemCount > 0 && edgeSelection.selectedIndex >= 0) {
      const cols = Math.max(1, edgeSelection.columns);
      const idx = edgeSelection.selectedIndex;
      const lastRowStart = Math.floor((edgeSelection.itemCount - 1) / cols) * cols;
      if (idx < cols) moreAbove = false;
      if (idx >= lastRowStart) moreBelow = false;
    }

    fadeBottom.classList.toggle('is-visible', moreBelow);
    fadeTop.classList.toggle('is-visible', moreAbove);
  }

  private updateUnifiedBookListScrollFade() {
    this.updateScrollFadeIndicators(
      this.unifiedBookListScrollElement,
      this.unifiedBookListScrollFadeTopElement,
      this.unifiedBookListScrollFadeBottomElement,
    );
  }

  private updateUnifiedBookRightPaneScrollFade() {
    this.updateScrollFadeIndicators(
      this.unifiedBookRightPaneScrollElement,
      this.unifiedBookRightPaneFadeTopElement,
      this.unifiedBookRightPaneFadeBottomElement,
    );
  }

  createUnifiedBookListItem(
    fish: any,
    index: number,
    isCaught: boolean,
    inventoryEntry?: { size?: number; feedCount?: number },
    options?: {
      onClick?: () => void;
      rowClassName?: string;
      markSelected?: boolean;
      /** 入れかえピッカー: 名前下にサイズ・売価（クエスト報酬風）を表示 */
      showSizePriceUnderName?: boolean;
    },
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = ['book-ui-row', options?.rowClassName].filter(Boolean).join(' ');
    if (this.unifiedBookTab === 'pedia' && !inventoryEntry) {
      row.classList.toggle('state-obtained', isCaught);
      row.classList.toggle('state-locked', !isCaught);
    } else {
      row.classList.add('state-obtained');
    }
    row.setAttribute('data-fish-id', fish.id);
    row.setAttribute('data-index', index.toString());

    const item = document.createElement('div');
    item.className = 'book-ui-node ui-frame-box book-list-item';
    if (!isCaught && this.unifiedBookTab === 'pedia' && !inventoryEntry) {
      item.classList.add('book-list-item-unknown');
    }
    // バッグタブ／入れかえピッカー: レア枠色
    if (inventoryEntry && isCaught) {
      item.setAttribute('data-rarity', String(fish.rarity));
    }
    if (options?.markSelected) item.classList.add('is-selected');

    // アイコン
    const icon = document.createElement('div');
    icon.className = 'book-list-item-icon';

    const hasTexture = this.textures.exists(fish.id);
    if (hasTexture && isCaught) {
      // 図鑑・バッグ左カラムのサムネイルも共通の白フチで描画（常にCanvas使用）
      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const frame = this.textures.getFrame(fish.id);
        const maxSize = 60;
        const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
        const width = frame.width * scale;
        const height = frame.height * scale;
        const sourceImage = frame.source.image as HTMLImageElement;
        if (sourceImage) {
          this.drawFishImageWithOutline(ctx, sourceImage, frame,
              (60 - width) / 2, (60 - height) / 2, width, height, 2, '#ffffff');
        }
      }
      icon.appendChild(canvas);
    } else {
      const emoji = document.createElement('div');
      emoji.className = 'book-list-item-emoji';
      if (isCaught || this.unifiedBookTab === 'inventory' || inventoryEntry) {
        emoji.textContent = fish.emoji;
      } else {
        emoji.textContent = '?';
      }
      icon.appendChild(emoji);
    }

    const name = document.createElement('div');
    name.className = 'book-list-item-name';
    if (isCaught || this.unifiedBookTab === 'inventory' || inventoryEntry) {
      name.textContent = fish.name;
    } else {
      name.textContent = '？？？';
    }

    if (this.unifiedBookTab === 'pedia' && !inventoryEntry) {
      item.classList.add('book-list-item--pedia');
      const stars = document.createElement('div');
      stars.className = 'book-list-item-stars';
      stars.innerHTML = this.buildBookRarityStarsInnerHtml(fish.rarity);
      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(stars);
    } else {
      const info = document.createElement('div');
      info.className = 'book-list-item-info';
      const meta = document.createElement('div');
      meta.className = 'book-list-item-meta';
      if (inventoryEntry) {
        const size = inventoryEntry.size;
        const feedCount = inventoryEntry.feedCount ?? 0;
        const sizeText = size !== undefined ? `${size}cm` : '';
        const displayPrice = Math.round(
          getInventoryEntryBaseSellPrice(fish, {
            fishId: fish.id,
            size,
            feedCount: feedCount > 0 ? feedCount : undefined,
          }) * getSellPriceMultiplier(this.playerData),
        );
        meta.textContent = `${sizeText}${sizeText ? ' ' : ''}💰 ${displayPrice}G`;
        // 釣果と同じ閾値で BIG タグ
        const maxSize = Number(fish.maxSize) || 0;
        if (size !== undefined && maxSize > 0 && isBigSizeRatio(size / maxSize)) {
          const bigLabel = document.createElement('img');
          bigLabel.className = 'book-list-item-big-label';
          bigLabel.src = '/images/Fishing Result UI/Big-label.svg';
          bigLabel.alt = 'Big';
          item.appendChild(bigLabel);
        }
        // meta は CSS で非表示のため、育成済みはカード上のバッジで Lv を出す
        if (feedCount > 0) {
          const lvBadge = document.createElement('span');
          lvBadge.className = 'book-list-item-lv';
          lvBadge.innerHTML = `<span class="book-list-item-lv-label">Lv.</span><span class="book-list-item-lv-num">${getGrowthStage(feedCount).level}</span>`;
          item.appendChild(lvBadge);
        }
        if (options?.showSizePriceUnderName) {
          item.classList.add('aquarium-bag-pick-item--with-stats');
          const stats = document.createElement('div');
          stats.className = 'aquarium-bag-pick-stats';

          const sizeLine = document.createElement('span');
          sizeLine.className = 'quest-card__reward-line';
          const sizeAmount = document.createElement('span');
          sizeAmount.className = 'quest-card__reward-amount';
          sizeAmount.textContent = size !== undefined ? String(size) : '-';
          sizeLine.appendChild(sizeAmount);
          if (size !== undefined) {
            const sizeUnit = document.createElement('span');
            sizeUnit.className = 'quest-card__reward-unit';
            sizeUnit.textContent = 'cm';
            sizeLine.appendChild(sizeUnit);
          }
          stats.appendChild(sizeLine);

          const priceLine = document.createElement('span');
          priceLine.className = 'quest-card__reward-line';
          const priceAmount = document.createElement('span');
          priceAmount.className = 'quest-card__reward-amount';
          priceAmount.textContent = String(displayPrice);
          const priceUnit = document.createElement('span');
          priceUnit.className = 'quest-card__reward-unit';
          priceUnit.textContent = 'G';
          priceLine.appendChild(priceAmount);
          priceLine.appendChild(priceUnit);
          stats.appendChild(priceLine);

          info.appendChild(stats);
        }
      } else {
        if (isCaught) {
          const priceG = Math.round(fish.price * getSellPriceMultiplier(this.playerData));
          const rarityKey = fish.rarity as keyof typeof rarityStars;
          meta.textContent = `💰 ${priceG}G | ${rarityStars[rarityKey]}`;
        } else {
          meta.textContent = '未発見';
        }
      }

      info.appendChild(name);
      info.appendChild(meta);

      item.appendChild(icon);
      item.appendChild(info);
    }

    row.appendChild(item);

    row.addEventListener('click', () => {
      if (options?.onClick) {
        options.onClick();
        return;
      }
      this.selectUnifiedBookItem(fish.id, index);
    });

    return row;
  }

  createUnifiedBookEmptySlotItem(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'book-ui-row state-empty';
    const item = document.createElement('div');
    item.className = 'book-ui-node ui-frame-box book-list-item empty-slot';

    // 空スロットは枠だけ（魚画像・名前を描画しない）
    const icon = document.createElement('div');
    icon.className = 'book-list-item-icon';
    item.appendChild(icon);
    row.appendChild(item);

    return row;
  }

  selectUnifiedBookItem(fishId: string, index: number, opts?: { pediaNavKeepSortArea?: boolean }) {
    // 実績・クエストタブの場合は別処理
    if (this.unifiedBookTab === 'achievement') {
      const category = this.unifiedBookListItems[index]?.getAttribute('data-category');
      if (category) {
        this.selectAchievementCategory(category, index);
      }
      return;
    }
    if (this.unifiedBookTab === 'quest') {
      const category = this.unifiedBookListItems[index]?.getAttribute('data-category');
      if (category) {
        this.selectQuestLogCategory(category, index);
      }
      return;
    }
    if (this.unifiedBookTab === 'skills') {
      return;
    }

    if (this.unifiedBookTab === 'pedia' && !opts?.pediaNavKeepSortArea) {
      this.pediaNavArea = 'list';
      this.syncBookPediaSortBarUI();
    }

    this.unifiedBookSelectedId = fishId;
    this.unifiedBookSelectedIndex = index;

    // 選択状態を更新（行 state-selected + ノード is-selected）
    this.unifiedBookListItems.forEach((row, i) => {
      const on = i === index;
      row.classList.toggle('state-selected', on);
      row.querySelector('.book-ui-node')?.classList.toggle('is-selected', on);
      if (on) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // 詳細を更新
    this.updateUnifiedBookDetail();
  }

  updateUnifiedBookDetail() {
    if (!this.unifiedBookDetailElement || !this.unifiedBookDetailPlaceholderElement) return;

    try {
    const statusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    const skillPanel = this.unifiedBookUIElement.querySelector('#book-skill-panel') as HTMLElement | null;

    if (this.unifiedBookTab === 'skills') {
      this.restoreBookDetailStructure();
      if (statusPanel) statusPanel.style.display = 'none';
      if (skillPanel) skillPanel.style.display = 'flex';
      this.unifiedBookDetailPlaceholderElement.style.display = 'none';
      this.unifiedBookDetailElement.classList.remove('active');
      this.renderSkillBookPanel();
      return;
    }
    if (skillPanel) skillPanel.style.display = 'none';

    if (this.unifiedBookTab === 'status') {
      this.restoreBookDetailStructure();
      if (statusPanel) {
        statusPanel.style.display = 'flex';
        this.fillBookStatusPanel(statusPanel);
      }
      this.unifiedBookDetailPlaceholderElement.style.display = 'none';
      this.unifiedBookDetailElement.classList.remove('active');
      return;
    }

    if (statusPanel) statusPanel.style.display = 'none';

    // 実績・クエスト・アクアリウムタブ以外の場合は、詳細エリアの構造が正しいことを確認（最初に実行）
    if (this.unifiedBookTab !== 'achievement' && this.unifiedBookTab !== 'quest' && this.unifiedBookTab !== 'aquarium') {
      this.restoreBookDetailStructure();
    }

    if (this.unifiedBookTab === 'aquarium') {
      this.updateAquariumBookDetail();
      return;
    }

    if (!this.unifiedBookSelectedId) {
      // 未選択時はプレースホルダーを表示（前タブのインラインスタイルが残らないよう画像コンテナをリセット）
      const imageContainer = this.unifiedBookDetailElement.querySelector('.book-detail-image-container-new') as HTMLElement;
      if (imageContainer) {
        imageContainer.style.backgroundImage = '';
        imageContainer.style.backgroundSize = '';
        imageContainer.style.backgroundPosition = '';
        imageContainer.style.backgroundRepeat = '';
      }
      this.unifiedBookDetailPlaceholderElement.style.display = 'flex';
      this.unifiedBookDetailElement.classList.remove('active');
      return;
    }

    // 実績・クエストタブの場合は別処理
    if (this.unifiedBookTab === 'achievement') {
      this.updateAchievementDetail(this.unifiedBookSelectedId);
      return;
    }
    if (this.unifiedBookTab === 'quest') {
      this.updateQuestLogDetail(this.unifiedBookSelectedId);
      return;
    }

    const fish = getFishById(this.unifiedBookSelectedId);
    if (!fish) return;

    const isCaught = this.unifiedBookTab === 'inventory' || this.playerData.caughtFishIds.has(fish.id);

    // プレースホルダーを非表示
    this.unifiedBookDetailPlaceholderElement.style.display = 'none';
    this.unifiedBookDetailElement.classList.add('active');

    // 要素を取得（Figmaデザインに基づく）
    let imageCanvas = this.unifiedBookDetailElement.querySelector('#book-detail-image') as HTMLCanvasElement;
    let emoji = this.unifiedBookDetailElement.querySelector('#book-detail-emoji') as HTMLElement;
    let name = this.unifiedBookDetailElement.querySelector('#book-detail-name') as HTMLElement;
    let rarityStarsElement = this.unifiedBookDetailElement.querySelector('#book-detail-rarity-stars') as HTMLElement;
    let desc = this.unifiedBookDetailElement.querySelector('#book-detail-desc') as HTMLElement;
    let priceText = this.unifiedBookDetailElement.querySelector('#book-detail-price') as HTMLElement;
    let priceUnitText = this.unifiedBookDetailElement.querySelector('#book-detail-price-unit') as HTMLElement;
    let sizeText = this.unifiedBookDetailElement.querySelector('#book-detail-size') as HTMLElement;
    let sizeUnitText = this.unifiedBookDetailElement.querySelector('#book-detail-size-unit') as HTMLElement;
    let habitatText = this.unifiedBookDetailElement.querySelector('#book-detail-habitat') as HTMLElement;
    let catchCountText = this.unifiedBookDetailElement.querySelector('#book-detail-catch-count-value') as HTMLElement;
    let imageContainer = this.unifiedBookDetailElement.querySelector('.book-detail-image-container-new') as HTMLElement;
    let habitatRow = this.unifiedBookDetailElement.querySelector('.book-detail-habitat-row') as HTMLElement;
    
    // 要素が存在しない場合は復元して再取得
    if (!imageCanvas || !emoji || !name || !rarityStarsElement || !desc || !priceText || !priceUnitText || !sizeText || !sizeUnitText || !habitatText || !catchCountText || !imageContainer) {
      this.restoreBookDetailStructure();
      imageCanvas = this.unifiedBookDetailElement.querySelector('#book-detail-image') as HTMLCanvasElement;
      emoji = this.unifiedBookDetailElement.querySelector('#book-detail-emoji') as HTMLElement;
      name = this.unifiedBookDetailElement.querySelector('#book-detail-name') as HTMLElement;
      rarityStarsElement = this.unifiedBookDetailElement.querySelector('#book-detail-rarity-stars') as HTMLElement;
      desc = this.unifiedBookDetailElement.querySelector('#book-detail-desc') as HTMLElement;
      priceText = this.unifiedBookDetailElement.querySelector('#book-detail-price') as HTMLElement;
      priceUnitText = this.unifiedBookDetailElement.querySelector('#book-detail-price-unit') as HTMLElement;
      sizeText = this.unifiedBookDetailElement.querySelector('#book-detail-size') as HTMLElement;
      sizeUnitText = this.unifiedBookDetailElement.querySelector('#book-detail-size-unit') as HTMLElement;
      habitatText = this.unifiedBookDetailElement.querySelector('#book-detail-habitat') as HTMLElement;
      catchCountText = this.unifiedBookDetailElement.querySelector('#book-detail-catch-count-value') as HTMLElement;
      imageContainer = this.unifiedBookDetailElement.querySelector('.book-detail-image-container-new') as HTMLElement;
      habitatRow = this.unifiedBookDetailElement.querySelector('.book-detail-habitat-row') as HTMLElement;
      
      if (!imageCanvas || !emoji || !name || !rarityStarsElement || !desc || !priceText || !priceUnitText || !sizeText || !sizeUnitText || !habitatText || !catchCountText || !imageContainer) {
        return; // 復元に失敗した場合は処理を中断
      }
    }

    // 生息地に応じて背景画像を設定
    const isJunk = fish.id.startsWith('junk_');
    if (habitatRow) {
      habitatRow.style.display = isJunk ? 'none' : '';
    }
    if (!isJunk && imageContainer) {
      const habitatBgMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '/images/habitats/freshwater-bg.png',
        [Habitat.SALTWATER]: '/images/habitats/saltwater-bg.png',
        [Habitat.STREAM]: '/images/habitats/stream-bg.png',
      };
      const bgImage = habitatBgMap[fish.habitat] || '/images/habitats/freshwater-bg.png';
      imageContainer.style.backgroundImage = `url(${bgImage})`;
      imageContainer.style.backgroundSize = 'cover';
      imageContainer.style.backgroundPosition = 'center';
      imageContainer.style.backgroundRepeat = 'no-repeat';
    } else if (imageContainer) {
      // ゴミの場合はデフォルト背景
      imageContainer.style.backgroundImage = '';
    }

    if (isCaught) {
      // 発見済み/所持品
      const hasTexture = this.textures.exists(fish.id);
      if (hasTexture) {
        const ctx = imageCanvas.getContext('2d');
        if (ctx) {
          const frame = this.textures.getFrame(fish.id);
          const maxWidth = 148;
          const maxHeight = 165;
          const scale = Math.min(maxWidth / frame.width, maxHeight / frame.height);
          const width = frame.width * scale;
          const height = frame.height * scale;

          ctx.clearRect(0, 0, 148, 165);
          const sourceImage = frame.source.image as HTMLImageElement;
          if (sourceImage) {
            this.drawFishImageWithOutline(ctx, sourceImage, frame,
                (148 - width) / 2, (165 - height) / 2, width, height, 3, '#ffffff');
          }
        }
        imageCanvas.style.display = 'block';
        emoji.style.display = 'none';
      } else {
        imageCanvas.style.display = 'none';
        emoji.textContent = fish.emoji;
        emoji.style.display = 'block';
      }

      // 魚名（バッグで育成済みなら Lv も表示。構造は揃えて Lv 有無で行高が変わらないようにする）
      {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'book-detail-fish-name';
        nameSpan.textContent = fish.name;
        name.replaceChildren(nameSpan);

        if (this.unifiedBookTab === 'inventory') {
          const flatInventoryForName = getInventoryDisplayOrder(this.playerData);
          const selectedIdxForName = this.unifiedBookSelectedIndex;
          const selectedForName =
            selectedIdxForName !== null &&
            selectedIdxForName >= 0 &&
            selectedIdxForName < flatInventoryForName.length
              ? flatInventoryForName[selectedIdxForName]
              : null;
          const feedCount = selectedForName?.feedCount ?? 0;
          if (feedCount > 0) {
            const lv = getGrowthStage(feedCount).level;
            const lvWrap = document.createElement('span');
            lvWrap.className = 'book-detail-growth-lv';
            lvWrap.innerHTML =
              `<span class="book-detail-growth-lv-label">Lv.</span>` +
              `<span class="book-detail-growth-lv-num">${lv}</span>`;
            name.appendChild(lvWrap);
          }
        }
      }
      
      // レアリティスター表示（釣果のある図鑑・インベントリは常に表示）
      rarityStarsElement.innerHTML = this.buildBookRarityStarsInnerHtml(fish.rarity);

      // インベントリタブの場合は個体のサイズ、図鑑タブの場合は記録を表示
      let displaySizeValue: string;
      let displaySizeUnit: string;
      if (this.unifiedBookTab === 'inventory') {
        const flatInventory = getInventoryDisplayOrder(this.playerData);
        const selectedIdx = this.unifiedBookSelectedIndex;
        const selectedItem =
          selectedIdx !== null && selectedIdx >= 0 && selectedIdx < flatInventory.length
            ? flatInventory[selectedIdx]
            : null;
        const itemSize = selectedItem?.size;
        if (itemSize !== undefined) {
          displaySizeValue = itemSize.toFixed(1);
          displaySizeUnit = 'cm';
        } else {
          displaySizeValue = '-';
          displaySizeUnit = '';
        }
      } else {
        // 図鑑タブの場合は記録を表示
        const recordSize = this.playerData.fishSizes[fish.id];
        if (recordSize) {
          displaySizeValue = recordSize.toFixed(1);
          displaySizeUnit = 'cm';
        } else {
          displaySizeValue = '-';
          displaySizeUnit = '';
        }
      }
      sizeText.textContent = displaySizeValue;
      if (sizeUnitText) {
        sizeUnitText.textContent = displaySizeUnit;
      }
      
      // サイズアイコンをタブに応じて変更
      const sizeIconElement = this.unifiedBookDetailElement?.querySelector('#book-detail-size-icon') as HTMLImageElement;
      if (sizeIconElement) {
        if (this.unifiedBookTab === 'inventory') {
          // インベントリタブの場合は魚と宝箱のアイコン
          sizeIconElement.src = '/images/ui/サイズ.png';
          sizeIconElement.alt = 'サイズ';
        } else {
          // 図鑑タブの場合はトロフィーアイコン（最大サイズ）
          sizeIconElement.src = '/images/ui/最大サイズ.png';
          sizeIconElement.alt = '最大サイズ';
        }
      }
      
      // サイズを考慮した価格を計算（インベントリタブの場合のみ）
      let displayPrice = fish.price;
      if (this.unifiedBookTab === 'inventory') {
        const flatInventory = getInventoryDisplayOrder(this.playerData);
        const selectedIdx = this.unifiedBookSelectedIndex;
        const selectedItem =
          selectedIdx !== null && selectedIdx >= 0 && selectedIdx < flatInventory.length
            ? flatInventory[selectedIdx]
            : null;
        if (selectedItem && !isJunk) {
          displayPrice = Math.round(
            getInventoryEntryBaseSellPrice(fish, selectedItem) *
              getSellPriceMultiplier(this.playerData),
          );
        } else if (!isJunk) {
          displayPrice = Math.round(fish.price * getSellPriceMultiplier(this.playerData));
        }
      }
      priceText.textContent = Math.floor(displayPrice).toLocaleString('ja-JP');
      if (priceUnitText) {
        priceUnitText.textContent = 'G';
      }
      
      // 生息地
      const habitatTextMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '淡水',
        [Habitat.SALTWATER]: '海水',
        [Habitat.STREAM]: '渓流'
      };
      const habitatColorMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '#383680',
        [Habitat.SALTWATER]: '#19648B',
        [Habitat.STREAM]: '#327F75'
      };
      if (!isJunk) {
        habitatText.textContent = habitatTextMap[fish.habitat] || '不明';
        habitatText.style.backgroundColor = habitatColorMap[fish.habitat] || '#327F75';
      } else {
        habitatText.textContent = '-';
        habitatText.style.backgroundColor = '#327F75';
      }
      
      // 捕獲数（累計で何匹釣ったか）
      const catchCount = this.playerData.fishCaughtCounts.get(fish.id) || 0;
      catchCountText.textContent = catchCount.toString();

      // 説明文
      desc.innerHTML = (fish.description || '説明').replace(/\n/g, '<br>');
    } else {
      // 未発見（図鑑のみ）
      imageCanvas.style.display = 'none';
      emoji.textContent = '?';
      emoji.style.display = 'block';

      name.textContent = '？？？';
      rarityStarsElement.innerHTML = this.buildBookRarityStarsInnerHtml(fish.rarity);

      sizeText.textContent = '-';
      if (sizeUnitText) {
        sizeUnitText.textContent = '';
      }
      priceText.textContent = '-';
      if (priceUnitText) {
        priceUnitText.textContent = '';
      }
      // 生息地（未発見でも表示する）
      const habitatTextMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '淡水',
        [Habitat.SALTWATER]: '海水',
        [Habitat.STREAM]: '渓流'
      };
      const habitatColorMap: Record<Habitat, string> = {
        [Habitat.FRESHWATER]: '#383680',
        [Habitat.SALTWATER]: '#19648B',
        [Habitat.STREAM]: '#327F75'
      };
      if (!isJunk) {
        habitatText.textContent = habitatTextMap[fish.habitat] || '不明';
        habitatText.style.backgroundColor = habitatColorMap[fish.habitat] || '#327F75';
      } else {
        habitatText.textContent = '-';
        habitatText.style.backgroundColor = '#327F75';
      }
      catchCountText.textContent = '0';

      desc.innerHTML = 'まだ発見されていません...<br>この魚を釣って図鑑を完成させよう！';
    }
    } finally {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.updateUnifiedBookRightPaneScrollFade());
      });
    }
  }

  restoreBookDetailStructure() {
    if (!this.unifiedBookDetailElement) return;
    
    // 実績タブの詳細表示（achievement-detail-list）が存在する場合は、元の構造に復元
    const achievementDetailList = this.unifiedBookDetailElement.querySelector('.achievement-detail-list');
    const questLogEmpty = this.unifiedBookDetailElement.querySelector('.quest-log-empty');
    const aquariumDetail = this.unifiedBookDetailElement.querySelector('.aquarium-detail-panel');
    const existingHeader = this.unifiedBookDetailElement.querySelector('.book-detail-header-new');
    
    // 実績・クエスト・アクアリウムタブの詳細表示が存在するか、元の構造が失われている場合は復元
    if (achievementDetailList || questLogEmpty || aquariumDetail || !existingHeader) {
      // 初期HTML（createUnifiedBookUI）と完全に同一の構造・クラスに復元し、
      // バッグ・図鑑タブ間の切り替え時も詳細欄のスタイルが変わらないようにする（BUG-UI-001 同種対策）
      this.unifiedBookDetailElement.innerHTML = `
        <!-- ヘッダー: 魚名 + レアリティバッジ -->
        <div class="book-detail-header-new">
          <div id="book-detail-name" class="book-detail-name-new"></div>
          <div class="book-detail-rarity-badge ui-frame-box">
            <div id="book-detail-rarity-stars" class="book-detail-rarity-stars"></div>
            <div class="book-detail-rarity-label">
              <img src="/images/rarity-label.svg" alt="Rarity" class="book-rarity-label-image" />
            </div>
          </div>
        </div>
        
        <!-- 魚のイラスト -->
        <div class="book-detail-image-container-new">
          <canvas id="book-detail-image" class="book-detail-image-new" width="148" height="165" style="display: none;"></canvas>
          <div id="book-detail-emoji" class="book-detail-emoji-new" style="display: none;"></div>
        </div>
        
        <div class="book-detail-sections">
        <!-- 統計情報: 売値とサイズ -->
        <div class="book-detail-stats">
          <div class="book-detail-stat-item" data-name="売値">
            <img src="/images/ui/ゴールド.png" alt="売値" class="book-detail-stat-label-icon" />
            <span id="book-detail-price" class="book-detail-stat-value"></span>
            <span id="book-detail-price-unit" class="book-detail-stat-unit"></span>
          </div>
          <div class="book-detail-stat-item" data-name="サイズ">
            <img id="book-detail-size-icon" src="/images/ui/サイズ.png" alt="サイズ" class="book-detail-stat-label-icon" />
            <span id="book-detail-size" class="book-detail-stat-value"></span>
            <span id="book-detail-size-unit" class="book-detail-stat-unit"></span>
          </div>
        </div>
        
        <!-- 生息地と捕獲数 -->
        <div class="book-detail-habitat-row">
          <div id="book-detail-habitat" class="book-detail-habitat"></div>
          <div class="book-detail-catch-count">
            <span>捕獲数：</span>
            <span id="book-detail-catch-count-value"></span>
            <span>匹</span>
          </div>
        </div>
        </div>
        
        <!-- Noteセクション -->
        <div class="book-detail-note">
          <div class="book-detail-note-header">
            <span class="book-detail-note-title">Note</span>
          </div>
          <div id="book-detail-desc" class="book-detail-note-content"></div>
        </div>
      `;
    }
  }

  createAchievementCategoryItem(category: string, count: number, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'achievement-category-item book-ui-node ui-frame-box';
    item.setAttribute('data-category', category);
    item.setAttribute('data-index', index.toString());

    const categoryData: Record<string, { name: string; char: string }> = {
      'catch': { name: '釣果', char: '釣' },
      'rarity': { name: 'レア度', char: 'レ' },
      'collection': { name: '図鑑', char: '図' },
      'level': { name: 'レベル', char: 'レ' },
      'money': { name: '経済', char: '経' },
      'equipment': { name: '装備', char: '装' },
      'special': { name: '特殊', char: '特' },
    };

    const data = categoryData[category] || { name: category, char: category[0] };
    const unlockedCount = getAchievementsByCategory(category).filter((a) =>
      this.playerData.achievements.has(a.id)
    ).length;

    const segments: string[] = [];
    for (let i = 0; i < count; i++) {
      const on = i < unlockedCount;
      segments.push(
        `<span class="achievement-category-seg ${on ? 'achievement-category-seg--on' : 'achievement-category-seg--off'}" aria-hidden="true"></span>`
      );
    }

    item.innerHTML = `
      <div class="achievement-category-item__head">
        <span class="achievement-category-item__name">${data.name}</span>
        <span class="achievement-category-item__count">${unlockedCount}/${count} 達成</span>
      </div>
      <div class="achievement-category-item__segments" role="img" aria-label="カテゴリ達成 ${unlockedCount} / ${count}">
        ${segments.join('')}
      </div>
    `;

    item.addEventListener('click', () => {
      this.selectAchievementCategory(category, index);
    });

    return item;
  }

  selectAchievementCategory(category: string, index: number) {
    this.unifiedBookSelectedId = category;
    this.unifiedBookSelectedIndex = index;
    this.achievementDetailSelectedIndex = 0;

    // 選択状態を更新
    this.unifiedBookListItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('is-selected');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('is-selected');
      }
    });

    // 詳細を更新
    this.updateUnifiedBookDetail();
  }

  /**
   * Figma 47:175 達成（橙枠・半透明行・CLEAR）/ 47:633 進行中（sand・報酬ボックス・分割メタ）
   */
  private buildAchievementCardHTML(achievement: AchievementConfig, isUnlocked: boolean): string {
    const progress = getAchievementProgress(this.playerData, achievement);
    const progressPercent = Math.round(progress * 100);
    const prog = getAchievementProgressDisplay(this.playerData, achievement);
    const dispCur = isUnlocked ? prog.target : prog.current;
    const dispTgt = prog.target;
    const unitPart = prog.unit ? ` ${prog.unit}` : '';
    const progressLabel = `${dispCur} / ${dispTgt}${unitPart}`;
    const reward = achievement.reward;
    const rewardBlock = reward
      ? `
      <div class="achievement-detail-reward">
        <div class="achievement-detail-reward__panel">
          <div class="achievement-detail-reward__label">
            <img src="/images/ui/Book%20UI/reward-label.svg" alt="報酬" class="achievement-detail-reward__label-image" width="48" height="14" decoding="async" />
          </div>
          <div class="achievement-detail-reward__values">
            ${reward.money ? `<span class="achievement-detail-reward__line"><span class="achievement-detail-reward__icon">💰</span><span class="achievement-detail-reward__amount">${reward.money}</span><span class="achievement-detail-reward__unit">G</span></span>` : ''}
            ${reward.exp ? `<span class="achievement-detail-reward__line"><span class="achievement-detail-reward__icon">⭐</span><span class="achievement-detail-reward__amount">${reward.exp}</span><span class="achievement-detail-reward__unit">EXP</span></span>` : ''}
          </div>
        </div>
      </div>`
      : '';
    const rowClass = isUnlocked ? ' achievement-detail-item__row--cleared' : '';
    const stamp = isUnlocked
      ? `
      <div class="achievement-detail-stamp" aria-hidden="true">
        <img class="achievement-detail-stamp__img" src="/images/ui/Book%20UI/clear.png" alt="" width="203" height="94" decoding="async" />
      </div>`
      : '';
    const fillW = isUnlocked ? 100 : progressPercent;
    const pctLabel = isUnlocked ? 100 : progressPercent;
    return `
      <div class="achievement-detail-item__inner">
        <div class="achievement-detail-item__row${rowClass}">
          <div class="achievement-detail-item__body">
            <div class="achievement-detail-item__top">
              <div class="achievement-detail-item__textcol">
                <div class="achievement-detail-item__title">${achievement.name}</div>
                <p class="achievement-detail-item__desc">${achievement.description}</p>
              </div>
              ${rewardBlock}
            </div>
            <div class="achievement-detail-item__progress">
              <div class="achievement-detail-item__track">
                <div class="achievement-detail-item__fill" style="width: ${fillW}%;"></div>
              </div>
              <div class="achievement-detail-item__meta">
                <span class="achievement-detail-item__progress-value">${progressLabel}</span>
                <span class="achievement-detail-item__progress-value">${pctLabel}<span class="achievement-detail-item__progress-unit">%</span></span>
              </div>
            </div>
          </div>
        </div>
        ${stamp}
      </div>`;
  }

  private syncAchievementDetailKeyboardSelection() {
    const root = this.unifiedBookDetailElement;
    if (!root) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard' && this.achievementNavArea === 'right';
    const items = root.querySelectorAll('.achievement-detail-list .achievement-detail-item');
    items.forEach((el, i) => {
      el.classList.toggle(
        'achievement-detail-item--kb-selected',
        kb && i === this.achievementDetailSelectedIndex,
      );
    });
  }

  private syncQuestLogDetailKeyboardSelection() {
    const root = this.unifiedBookDetailElement;
    if (!root) return;

    root.querySelectorAll('.quest-card__abandon.is-nav-selected').forEach((el) => {
      el.classList.remove('is-nav-selected');
    });
    root.querySelectorAll('.quest-log-list .quest-card').forEach((el) => {
      el.classList.remove('quest-card--kb-selected', 'achievement-detail-item--kb-selected');
    });

    if (this.achievementNavArea !== 'right' || this.uiMenuNavInputChannel !== 'keyboard') return;

    if (this.unifiedBookSelectedId === 'active') {
      const btn = this.getQuestLogAbandonAtSlot(this.achievementDetailSelectedIndex);
      btn?.classList.add('is-nav-selected');
      return;
    }

    const items = root.querySelectorAll('.quest-log-list.quest-log-list--completed .quest-card');
    items.forEach((el, i) => {
      el.classList.toggle(
        'quest-card--kb-selected',
        i === this.achievementDetailSelectedIndex,
      );
    });
  }

  private isQuestLogActiveCategory(): boolean {
    return this.unifiedBookTab === 'quest' && this.unifiedBookSelectedId === 'active';
  }

  private getQuestLogActiveSlotCards(): HTMLElement[] {
    if (!this.unifiedBookDetailElement) return [];
    return Array.from(
      this.unifiedBookDetailElement.querySelectorAll(
        '.quest-log-list.quest-board-cards:not(.quest-log-list--completed) .quest-card',
      ),
    ) as HTMLElement[];
  }

  private questLogActiveSlotHasAbandon(slotIndex: number): boolean {
    const card = this.getQuestLogActiveSlotCards()[slotIndex];
    return !!card && !card.classList.contains('quest-log-slot-empty');
  }

  private getQuestLogAbandonAtSlot(slotIndex: number): HTMLButtonElement | null {
    const card = this.getQuestLogActiveSlotCards()[slotIndex];
    if (!card || card.classList.contains('quest-log-slot-empty')) return null;
    return card.querySelector('.quest-card__abandon') as HTMLButtonElement | null;
  }

  private findFirstQuestAbandonSlotIndex(): number | null {
    for (let i = 0; i < MAX_ACTIVE_QUESTS; i++) {
      if (this.questLogActiveSlotHasAbandon(i)) return i;
    }
    return null;
  }

  private scrollQuestLogActiveSlotIntoView(slotIndex: number) {
    this.getQuestLogActiveSlotCards()[slotIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }

  private triggerQuestLogAbandonKeyboardAction() {
    const btn = this.getQuestLogAbandonAtSlot(this.achievementDetailSelectedIndex);
    const questId = btn?.dataset.questId;
    if (questId) this.openQuestAbandonConfirm(questId);
  }

  private openQuestAbandonConfirm(questId: string) {
    const quest = resolveQuest(this.playerData, questId);
    if (!quest || !this.unifiedBookUIElement) return;
    const layer = this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-layer') as HTMLElement | null;
    const msg = this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-message');
    if (msg) msg.textContent = `「${quest.name}」を破棄しますか？進捗は失われ、報酬は得られません。`;
    this.questAbandonConfirmPendingQuestId = questId;
    this.questAbandonConfirmFocus = 'cancel';
    this.syncQuestAbandonConfirmSelection();
    if (layer) {
      layer.style.display = 'flex';
      layer.setAttribute('aria-hidden', 'false');
    }
    const cancelBtn = this.unifiedBookUIElement.querySelector(
      '#quest-abandon-confirm-cancel',
    ) as HTMLButtonElement | null;
    requestAnimationFrame(() => {
      cancelBtn?.focus();
    });
  }

  private closeQuestAbandonConfirm() {
    this.questAbandonConfirmPendingQuestId = null;
    this.questAbandonConfirmFocus = 'cancel';
    const layer = this.unifiedBookUIElement?.querySelector('#quest-abandon-confirm-layer') as HTMLElement | null;
    if (layer) {
      layer.style.display = 'none';
      layer.setAttribute('aria-hidden', 'true');
    }
    const cancel = this.unifiedBookUIElement?.querySelector('#quest-abandon-confirm-cancel');
    const ok = this.unifiedBookUIElement?.querySelector('#quest-abandon-confirm-ok');
    cancel?.classList.remove('is-nav-selected');
    ok?.classList.remove('is-nav-selected');
  }

  private syncQuestAbandonConfirmSelection() {
    if (!this.unifiedBookUIElement) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const cancel = this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-cancel');
    const ok = this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-ok');
    cancel?.classList.toggle('is-nav-selected', kb && this.questAbandonConfirmFocus === 'cancel');
    ok?.classList.toggle('is-nav-selected', kb && this.questAbandonConfirmFocus === 'ok');
  }

  private handleQuestAbandonConfirmNavigation() {
    if (!this.questAbandonConfirmPendingQuestId || !this.unifiedBookUIElement) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.noteUiMenuKeyboardNavigation();
      this.questAbandonConfirmFocus = 'cancel';
      this.syncQuestAbandonConfirmSelection();
      (this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-cancel') as HTMLButtonElement | null)?.focus();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.noteUiMenuKeyboardNavigation();
      this.questAbandonConfirmFocus = 'ok';
      this.syncQuestAbandonConfirmSelection();
      (this.unifiedBookUIElement.querySelector('#quest-abandon-confirm-ok') as HTMLButtonElement | null)?.focus();
    }
  }

  private applyQuestAbandonConfirm() {
    const questId = this.questAbandonConfirmPendingQuestId;
    if (!questId) return;
    this.closeQuestAbandonConfirm();
    this.abandonQuestFromLog(questId);
  }

  private syncRightPaneDetailKeyboardSelection() {
    if (this.unifiedBookTab === 'quest') {
      this.syncQuestLogDetailKeyboardSelection();
    } else {
      this.syncAchievementDetailKeyboardSelection();
    }
  }

  private clearRightPaneDetailKeyboardSelection() {
    if (!this.unifiedBookDetailElement) return;
    this.unifiedBookDetailElement
      .querySelectorAll(
        '.achievement-detail-item--kb-selected, .quest-card--kb-selected, .quest-card__abandon.is-nav-selected',
      )
      .forEach((el) => {
        el.classList.remove(
          'achievement-detail-item--kb-selected',
          'quest-card--kb-selected',
          'is-nav-selected',
        );
      });
  }

  /** 右ペイン（実績・クエスト詳細）へ移動。詳細が空なら false */
  private tryEnterAchievementRightPane(): boolean {
    if (!this.unifiedBookDetailElement) return false;

    if (this.isQuestLogActiveCategory()) {
      const firstSlot = this.findFirstQuestAbandonSlotIndex();
      if (firstSlot === null) return false;
      this.achievementNavArea = 'right';
      this.achievementDetailSelectedIndex = firstSlot;
      this.syncQuestLogDetailKeyboardSelection();
      this.scrollQuestLogActiveSlotIntoView(firstSlot);
      return true;
    }

    const selector =
      this.unifiedBookTab === 'quest'
        ? '.quest-log-list.quest-log-list--completed .quest-card'
        : '.achievement-detail-list .achievement-detail-item';
    const items = this.unifiedBookDetailElement.querySelectorAll(selector);
    if (items.length === 0) return false;
    this.achievementNavArea = 'right';
    this.achievementDetailSelectedIndex = 0;
    this.syncRightPaneDetailKeyboardSelection();
    (items[0] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return true;
  }

  private handleQuestLeftPaneNavigation(
    dir: 'up' | 'down' | 'left' | 'right',
    now: number,
  ) {
    let currentIndex = this.unifiedBookSelectedIndex ?? 0;
    const lastIndex = this.unifiedBookListItems.length - 1;
    if (currentIndex < 0 || currentIndex > lastIndex) currentIndex = 0;

    if (dir === 'up') {
      this.enterUnifiedBookMainTabsNav();
      return;
    }

    if (dir === 'down') {
      if (this.tryEnterAchievementRightPane()) {
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      }
      return;
    }

    if (dir === 'left') {
      if (currentIndex > 0) {
        const item = this.unifiedBookListItems[currentIndex - 1];
        const category = item?.getAttribute('data-category');
        if (category) this.selectQuestLogCategory(category, currentIndex - 1);
        return;
      }
      this.enterUnifiedBookMainTabsNav();
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      return;
    }

    if (dir === 'right') {
      if (currentIndex < lastIndex) {
        const item = this.unifiedBookListItems[currentIndex + 1];
        const category = item?.getAttribute('data-category');
        if (category) this.selectQuestLogCategory(category, currentIndex + 1);
        return;
      }
      this.enterUnifiedBookMainTabsNav();
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
    }
  }

  private handleQuestLogActiveAbandonNavigation(
    dir: 'up' | 'down' | 'left' | 'right',
    now: number,
  ) {
    const gridCols = this.questBoardGridCols;
    const maxSlot = MAX_ACTIVE_QUESTS - 1;
    let idx = this.achievementDetailSelectedIndex;

    const selectSlot = (slotIndex: number): boolean => {
      if (!this.questLogActiveSlotHasAbandon(slotIndex)) return false;
      this.achievementDetailSelectedIndex = slotIndex;
      this.syncQuestLogDetailKeyboardSelection();
      this.scrollQuestLogActiveSlotIntoView(slotIndex);
      return true;
    };

    if (dir === 'left') {
      if (idx % gridCols > 0) {
        for (let i = idx - 1; i >= Math.floor(idx / gridCols) * gridCols; i--) {
          if (selectSlot(i)) return;
        }
      }
      this.achievementNavArea = 'left';
      this.clearRightPaneDetailKeyboardSelection();
      return;
    }

    if (dir === 'right') {
      const rowEnd = Math.min(maxSlot, Math.floor(idx / gridCols) * gridCols + gridCols - 1);
      for (let i = idx + 1; i <= rowEnd; i++) {
        if (selectSlot(i)) return;
      }
      this.enterUnifiedBookMainTabsNav();
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      return;
    }

    if (dir === 'up') {
      if (idx >= gridCols) {
        for (let i = idx - gridCols; i >= 0; i -= gridCols) {
          if (selectSlot(i)) return;
        }
      }
      this.achievementNavArea = 'left';
      this.clearRightPaneDetailKeyboardSelection();
      return;
    }

    if (dir === 'down') {
      const maxRows = Math.ceil(MAX_ACTIVE_QUESTS / gridCols);
      const currentRow = Math.floor(idx / gridCols);
      if (currentRow < maxRows - 1) {
        for (let i = idx + gridCols; i <= maxSlot; i += gridCols) {
          if (selectSlot(i)) return;
        }
      }
      this.nudgeBookScrollOnVerticalEdge('down');
    }
  }

  private handleQuestLogRightPaneNavigation(
    dir: 'up' | 'down' | 'left' | 'right',
    now: number,
  ) {
    if (this.isQuestLogActiveCategory()) {
      this.handleQuestLogActiveAbandonNavigation(dir, now);
      return;
    }

    if (!this.unifiedBookDetailElement) return;
    const items = Array.from(
      this.unifiedBookDetailElement.querySelectorAll('.quest-log-list .quest-card'),
    ) as HTMLElement[];
    const lastIdx = items.length - 1;

    if (lastIdx < 0) {
      this.achievementNavArea = 'left';
      return;
    }

    if (dir === 'left') {
      const gridCols = this.questBoardGridCols;
      if (this.achievementDetailSelectedIndex % gridCols > 0) {
        this.achievementDetailSelectedIndex--;
        this.syncQuestLogDetailKeyboardSelection();
        items[this.achievementDetailSelectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      this.achievementNavArea = 'left';
      this.clearRightPaneDetailKeyboardSelection();
      return;
    }

    const gridCols = this.questBoardGridCols;
    const maxRows = Math.ceil(items.length / gridCols);
    let newIndex = this.achievementDetailSelectedIndex;

    if (dir === 'right') {
      if (this.achievementDetailSelectedIndex % gridCols < gridCols - 1 && newIndex + 1 <= lastIdx) {
        newIndex++;
      } else {
        this.enterUnifiedBookMainTabsNav();
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
        return;
      }
    } else if (dir === 'up') {
      if (this.achievementDetailSelectedIndex >= gridCols) {
        newIndex -= gridCols;
      } else {
        this.achievementNavArea = 'left';
        this.clearRightPaneDetailKeyboardSelection();
        return;
      }
    } else if (dir === 'down') {
      const currentRow = Math.floor(this.achievementDetailSelectedIndex / gridCols);
      if (currentRow < maxRows - 1 && newIndex + gridCols <= lastIdx) {
        newIndex += gridCols;
      } else {
        this.nudgeBookScrollOnVerticalEdge('down');
        return;
      }
    }

    if (newIndex === this.achievementDetailSelectedIndex || newIndex < 0 || newIndex > lastIdx) return;

    this.achievementDetailSelectedIndex = newIndex;
    this.syncQuestLogDetailKeyboardSelection();
    items[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private handleAchievementRightPaneNavigation(
    dir: 'up' | 'down' | 'left' | 'right',
    now: number,
  ) {
    if (!this.unifiedBookDetailElement) return;
    const items = Array.from(
      this.unifiedBookDetailElement.querySelectorAll(
        '.achievement-detail-list .achievement-detail-item',
      ),
    ) as HTMLElement[];
    const lastIdx = items.length - 1;

    if (lastIdx < 0) {
      this.achievementNavArea = 'left';
      return;
    }

    if (dir === 'left') {
      this.achievementNavArea = 'left';
      this.clearRightPaneDetailKeyboardSelection();
      return;
    }

    if (dir === 'up') {
      if (this.achievementDetailSelectedIndex > 0) {
        this.achievementDetailSelectedIndex--;
        this.syncAchievementDetailKeyboardSelection();
        items[this.achievementDetailSelectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        this.nudgeBookScrollOnVerticalEdge('up');
      }
      return;
    }

    if (dir === 'down') {
      if (this.achievementDetailSelectedIndex < lastIdx) {
        this.achievementDetailSelectedIndex++;
        this.syncAchievementDetailKeyboardSelection();
        items[this.achievementDetailSelectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        this.nudgeBookScrollOnVerticalEdge('down');
      }
      return;
    }

    if (dir === 'right') {
      this.enterUnifiedBookMainTabsNav();
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
    }
  }

  updateAchievementDetail(category: string) {
    if (!this.unifiedBookDetailElement || !this.unifiedBookDetailPlaceholderElement) return;

    // プレースホルダーを非表示
    this.unifiedBookDetailPlaceholderElement.style.display = 'none';
    this.unifiedBookDetailElement.classList.add('active');

    // 実績一覧を表示
    const achievements = getAchievementsByCategory(category);

    this.unifiedBookDetailElement.innerHTML = `
      <div class="achievement-detail-list">
        ${achievements
          .map((achievement) => {
            const isUnlocked = this.playerData.achievements.has(achievement.id);
            return `
            <div class="achievement-detail-item ui-frame-box ${isUnlocked ? 'unlocked' : 'locked'}">
              ${this.buildAchievementCardHTML(achievement, isUnlocked)}
            </div>`;
          })
          .join('')}
      </div>
    `;

    const n = achievements.length;
    if (n === 0) {
      this.achievementNavArea = 'left';
      return;
    }
    if (this.achievementNavArea === 'right') {
      this.achievementDetailSelectedIndex = Math.min(
        Math.max(0, this.achievementDetailSelectedIndex),
        n - 1,
      );
      requestAnimationFrame(() => {
        this.syncAchievementDetailKeyboardSelection();
        const list = this.unifiedBookDetailElement?.querySelectorAll(
          '.achievement-detail-list .achievement-detail-item',
        );
        list?.[this.achievementDetailSelectedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }

  // ============================================
  // クエストログ（Book UI）
  // ============================================

  createQuestLogCategoryItem(category: string, count: number, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'quest-log-category book-ui-node ui-frame-box';
    item.setAttribute('data-category', category);
    item.setAttribute('data-index', index.toString());

    const categoryData: Record<string, { name: string }> = {
      active: { name: '進行中' },
      completed: { name: '完了' },
    };
    const data = categoryData[category] || { name: category };

    if (category === 'active') {
      const segments: string[] = [];
      for (let i = 0; i < MAX_ACTIVE_QUESTS; i++) {
        const on = i < count;
        segments.push(
          `<span class="quest-log-slot-seg ${on ? 'quest-log-slot-seg--on' : 'quest-log-slot-seg--off'}" aria-hidden="true"></span>`
        );
      }
      item.innerHTML = `
        <div class="quest-log-category__head">
          <span class="quest-log-category__name">${data.name}</span>
          <span class="quest-log-category__count"><b>${count}</b>/${MAX_ACTIVE_QUESTS}</span>
        </div>
        <div class="quest-log-category__slots" role="img" aria-label="進行中 ${count}/${MAX_ACTIVE_QUESTS}">
          ${segments.join('')}
        </div>
      `;
    } else {
      item.innerHTML = `
        <div class="quest-log-category__head">
          <span class="quest-log-category__name">${data.name}</span>
          <span class="quest-log-category__count"><b>${count}</b>件</span>
        </div>
      `;
    }

    item.addEventListener('click', () => {
      this.selectQuestLogCategory(category, index);
    });

    return item;
  }

  selectQuestLogCategory(category: string, index: number) {
    this.unifiedBookSelectedId = category;
    this.unifiedBookSelectedIndex = index;
    this.achievementDetailSelectedIndex = 0;

    this.unifiedBookListItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('is-selected');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('is-selected');
      }
    });

    this.updateUnifiedBookDetail();
  }

  private buildQuestCardRewardHTML(reward: QuestConfig['reward']): string {
    const rewardLines: string[] = [];
    if (reward?.money) {
      rewardLines.push(
        `<span class="quest-card__reward-line"><span class="quest-card__reward-icon">💰</span><span class="quest-card__reward-amount">${reward.money}</span><span class="quest-card__reward-unit">G</span></span>`,
      );
    }
    if (reward?.exp) {
      rewardLines.push(
        `<span class="quest-card__reward-line"><span class="quest-card__reward-icon">⭐</span><span class="quest-card__reward-amount">${reward.exp}</span><span class="quest-card__reward-unit">EXP</span></span>`,
      );
    }
    if (rewardLines.length === 0) return '';
    return `
      <div class="quest-card__reward">
        <div class="quest-card__reward-values">${rewardLines.join('')}</div>
      </div>`;
  }

  private buildQuestLogCardHTML(quest: QuestConfig, isCompleted: boolean): string {
    const group = this.getQuestGroup(quest);
    const progressPercent = Math.round(getQuestProgressRatio(this.playerData, quest) * 100);
    const prog = getQuestProgressDisplay(this.playerData, quest);
    const dispCur = isCompleted ? prog.target : prog.current;
    const dispTgt = prog.target;
    const unitPart = prog.unit ? ` ${prog.unit}` : '';
    const progressLabel = `${dispCur} / ${dispTgt}${unitPart}`;
    const fillW = isCompleted ? 100 : progressPercent;
    const pctLabel = isCompleted ? 100 : progressPercent;
    const abandonBtn = isCompleted
      ? ''
      : `
      <button type="button" class="quest-card__abandon nes-btn ui-frame-box" data-quest-id="${quest.id}">
        <span class="quest-card__abandon-label">破棄する</span>
      </button>`;
    return `
      ${this.buildQuestCardRibbonHTML(group)}
      <div class="quest-card__icon ui-frame-box">${this.buildQuestCardIcon(quest)}</div>
      <div class="quest-card__title">${quest.name}</div>
      <div class="quest-card__divider"></div>
      <p class="quest-card__desc">${quest.description}</p>
      ${this.buildQuestCardRewardHTML(quest.reward)}
      <div class="quest-card__progress">
        <div class="quest-card__progress-track">
          <div class="quest-card__progress-fill" style="width: ${fillW}%;"></div>
        </div>
        <div class="quest-card__progress-meta">
          <span class="quest-card__progress-value">${progressLabel}</span>
          <span class="quest-card__progress-value">${pctLabel}<span class="quest-card__progress-unit">%</span></span>
        </div>
      </div>
      ${abandonBtn}`;
  }

  private buildQuestCardHTML(quest: QuestConfig, isCompleted: boolean, hideProgressUnit = false): string {
    const progress = getQuestProgressRatio(this.playerData, quest);
    const progressPercent = Math.round(progress * 100);
    const prog = getQuestProgressDisplay(this.playerData, quest);
    const dispCur = isCompleted ? prog.target : prog.current;
    const dispTgt = prog.target;
    const unitPart = !hideProgressUnit && prog.unit ? ` ${prog.unit}` : '';
    const progressLabel = `${dispCur} / ${dispTgt}${unitPart}`;
    const reward = quest.reward;
    const rewardBlock = reward
      ? `
      <div class="achievement-detail-reward">
        <div class="achievement-detail-reward__panel">
          <div class="achievement-detail-reward__label">
            <img src="/images/ui/Book%20UI/reward-label.svg" alt="報酬" class="achievement-detail-reward__label-image" width="48" height="14" decoding="async" />
          </div>
          <div class="achievement-detail-reward__values">
            ${reward.money ? `<span class="achievement-detail-reward__line"><span class="achievement-detail-reward__icon">💰</span><span class="achievement-detail-reward__amount">${reward.money}</span><span class="achievement-detail-reward__unit">G</span></span>` : ''}
            ${reward.exp ? `<span class="achievement-detail-reward__line"><span class="achievement-detail-reward__icon">⭐</span><span class="achievement-detail-reward__amount">${reward.exp}</span><span class="achievement-detail-reward__unit">EXP</span></span>` : ''}
          </div>
        </div>
      </div>`
      : '';
    const rowClass = isCompleted ? ' achievement-detail-item__row--cleared' : '';
    const stamp = isCompleted
      ? `
      <div class="achievement-detail-stamp" aria-hidden="true">
        <img class="achievement-detail-stamp__img" src="/images/ui/Book%20UI/clear.png" alt="" width="203" height="94" decoding="async" />
      </div>`
      : '';
    const fillW = isCompleted ? 100 : progressPercent;
    const pctLabel = isCompleted ? 100 : progressPercent;
    return `
      <div class="achievement-detail-item__inner">
        <div class="achievement-detail-item__row${rowClass}">
          <div class="achievement-detail-item__body">
            <div class="achievement-detail-item__top">
              <div class="achievement-detail-item__textcol">
                <div class="achievement-detail-item__title">${quest.name}</div>
                <p class="achievement-detail-item__desc">${quest.description}</p>
              </div>
              ${rewardBlock}
            </div>
            <div class="achievement-detail-item__progress">
              <div class="achievement-detail-item__track">
                <div class="achievement-detail-item__fill" style="width: ${fillW}%;"></div>
              </div>
              <div class="achievement-detail-item__meta">
                <span class="achievement-detail-item__progress-value">${progressLabel}</span>
                <span class="achievement-detail-item__progress-value">${pctLabel}<span class="achievement-detail-item__progress-unit">%</span></span>
              </div>
            </div>
          </div>
        </div>
        ${stamp}
      </div>`;
  }

  updateQuestLogDetail(category: string) {
    if (!this.unifiedBookDetailElement || !this.unifiedBookDetailPlaceholderElement) return;

    this.unifiedBookDetailPlaceholderElement.style.display = 'none';
    this.unifiedBookDetailElement.classList.add('active');

    if (category === 'active') {
      const quests = getActiveQuests(this.playerData);
      const slots: string[] = [];

      for (let i = 0; i < MAX_ACTIVE_QUESTS; i++) {
        if (i < quests.length) {
          const quest = quests[i];
          slots.push(`
            <div class="achievement-detail-item quest-card ui-frame-box" data-quest-id="${quest.id}">
              ${this.buildQuestLogCardHTML(quest, false)}
            </div>`);
        } else {
          slots.push(`
            <div class="quest-log-slot-empty quest-card ui-frame-box" aria-label="空きクエストスロット">
              <span class="quest-log-slot-empty__label">空きスロット</span>
              <span class="quest-log-slot-empty__hint">マップの掲示板（Fキー）でクエストを受注できます</span>
            </div>`);
        }
      }

      this.unifiedBookDetailElement.innerHTML = `
        <div class="achievement-detail-list quest-log-list quest-board-cards">
          ${slots.join('')}
        </div>
      `;
      this.bindQuestLogAbandonButtons();

      if (this.achievementNavArea === 'right') {
        if (!this.questLogActiveSlotHasAbandon(this.achievementDetailSelectedIndex)) {
          const firstSlot = this.findFirstQuestAbandonSlotIndex();
          if (firstSlot === null) {
            this.achievementNavArea = 'left';
          } else {
            this.achievementDetailSelectedIndex = firstSlot;
          }
        }
        requestAnimationFrame(() => {
          this.syncQuestLogDetailKeyboardSelection();
          if (this.achievementNavArea === 'right') {
            this.scrollQuestLogActiveSlotIntoView(this.achievementDetailSelectedIndex);
          }
        });
      }
      return;
    }

    const quests = getCompletedQuests(this.playerData);

    if (quests.length === 0) {
      this.unifiedBookDetailElement.innerHTML = `
        <div class="quest-log-empty ui-frame-box">完了したクエストはまだありません。</div>
      `;
      this.achievementNavArea = 'left';
      return;
    }

    this.unifiedBookDetailElement.innerHTML = `
      <div class="achievement-detail-list quest-log-list quest-board-cards quest-log-list--completed">
        ${quests
          .map(
            (quest) => `
            <div class="achievement-detail-item quest-card ui-frame-box" data-quest-id="${quest.id}">
              ${this.buildQuestLogCardHTML(quest, true)}
              <img class="quest-card__clear" src="/images/ui/Book%20UI/clear.png" alt="クリア済み" decoding="async" />
            </div>`,
          )
          .join('')}
      </div>
    `;

    const n = quests.length;
    if (this.achievementNavArea === 'right') {
      this.achievementDetailSelectedIndex = Math.min(
        Math.max(0, this.achievementDetailSelectedIndex),
        n - 1,
      );
      requestAnimationFrame(() => {
        this.syncQuestLogDetailKeyboardSelection();
        const list = this.unifiedBookDetailElement?.querySelectorAll('.quest-log-list .quest-card');
        list?.[this.achievementDetailSelectedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }

  showQuestNotification(quest: QuestConfig) {
    const notification = this.achievementNotificationElement;
    const nameEl = notification.querySelector('#achievement-notification-name') as HTMLElement;
    const descEl = notification.querySelector('#achievement-notification-desc') as HTMLElement;
    const rewardEl = notification.querySelector('#achievement-notification-reward') as HTMLElement;

    const title = notification.querySelector('div');
    if (title) title.textContent = '📋 クエスト達成！';
    if (nameEl) nameEl.textContent = `${quest.emoji} ${quest.name}`;
    if (descEl) descEl.textContent = quest.description;

    if (quest.reward) {
      const rewards: string[] = [];
      if (quest.reward.money) rewards.push(`💰 ${quest.reward.money}G`);
      if (quest.reward.exp) rewards.push(`⭐ ${quest.reward.exp}EXP`);
      if (rewardEl) rewardEl.textContent = rewards.length > 0 ? `報酬: ${rewards.join(' ')}` : '';
    } else if (rewardEl) {
      rewardEl.textContent = '';
    }

    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
      const titleReset = notification.querySelector('div');
      if (titleReset) titleReset.textContent = '🏆 実績解除！';
    }, 3000);
  }

  // ============================================
  // 掲示板（クエスト受注）
  // ============================================

  isNearBulletinBoard(): boolean {
    const px = this.player.x;
    const py = this.player.y;
    const margin = 55;
    const zone = this.bulletinBoardZone;
    return (
      px >= zone.x - zone.width / 2 - margin &&
      px <= zone.x + zone.width / 2 + margin &&
      py >= zone.y - zone.height / 2 - margin &&
      py <= zone.y + zone.height / 2 + margin
    );
  }

  private updateIdleWorldHints() {
    if (this.modalStack.length > 0 || this.unifiedBookOpen) {
      this.clearPlayerHintPointerFadeTimer();
      this.hudEquipHoverType = null;
      this.playerHintFollowPointer = false;
      this.hidePlayerHint();
      return;
    }
    if (this.hudEquipHoverType) {
      this.showHudEquipHoverHint();
      return;
    }
    if (this.playerHintFollowPointer) {
      // 装備ヒントのフェードアウト中は掲示板ヒント等へ切り替えない
      return;
    }
    if (this.isNearBulletinBoard()) {
      this.showPlayerHint(PLAYER_HINTS.bulletinBoard);
    } else if (this.isNearWater() && this.canCastTowardWater()) {
      this.showPlayerHint(PLAYER_HINTS.cast);
    } else {
      this.hidePlayerHint();
    }
  }

  createQuestBoardUI() {
    const questBoardHTML = `
      <div id="quest-board-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content quest-board-modal nes-container with-rounded ui-frame-box">
          <div class="quest-board-header">
            <div class="quest-board-header__titlewrap">
              <span class="quest-board-header__title">QuestBoard</span>
            </div>
            <div class="quest-board-active-summary" id="quest-board-active-summary" aria-label="進行中クエスト">
              ${this.buildQuestHudSlotsHTML()}
            </div>
          </div>
          <div class="quest-board-cards-scroll-wrap" id="quest-board-cards-scroll-wrap">
            <div class="quest-board-scroll-fade quest-board-scroll-fade--top" id="quest-board-scroll-fade-top" aria-hidden="true"></div>
            <div class="quest-board-cards-scroll" id="quest-board-cards-scroll">
              <div id="quest-board-list" class="quest-board-cards"></div>
            </div>
            <div class="quest-board-scroll-fade quest-board-scroll-fade--bottom" id="quest-board-scroll-fade-bottom" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = questBoardHTML;
    this.questBoardUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.questBoardUIElement);

    this.questBoardUIElement.addEventListener('pointerdown', (e) => {
      if (!this.questBoardOpen) return;
      const panel = this.questBoardUIElement.querySelector('.modal-content');
      if (panel && panel.contains(e.target as Node)) {
        this.questBoardUIElement.focus({ preventScroll: true });
        return;
      }
      if (panel && !panel.contains(e.target as Node)) {
        this.closeQuestBoard();
      }
    });
    this.questBoardUIElement.setAttribute('tabindex', '-1');
    this.questBoardCardsScrollElement = this.questBoardUIElement.querySelector('#quest-board-cards-scroll') as HTMLElement;
    this.questBoardScrollFadeTopElement = this.questBoardUIElement.querySelector('#quest-board-scroll-fade-top') as HTMLElement;
    this.questBoardScrollFadeBottomElement = this.questBoardUIElement.querySelector('#quest-board-scroll-fade-bottom') as HTMLElement;
    this.setupQuestBoardScrollFade();
  }

  private bindQuestBoardDocumentKeys() {
    document.addEventListener('keydown', this.questBoardDocumentKeyHandler, true);
  }

  private unbindQuestBoardDocumentKeys() {
    document.removeEventListener('keydown', this.questBoardDocumentKeyHandler, true);
  }

  private setupQuestBoardScrollFade() {
    const el = this.questBoardCardsScrollElement;
    if (!el || !this.questBoardScrollFadeTopElement || !this.questBoardScrollFadeBottomElement) return;

    const update = () => this.updateQuestBoardScrollFade();
    el.addEventListener('scroll', update, { passive: true });

    this.questBoardScrollFadeObserver = new ResizeObserver(update);
    this.questBoardScrollFadeObserver.observe(el);
    const list = el.querySelector('#quest-board-list');
    if (list) this.questBoardScrollFadeObserver.observe(list);
    requestAnimationFrame(update);
  }

  private updateQuestBoardScrollFade() {
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const items = this.questBoardUIElement?.querySelectorAll('.quest-card');
    const itemCount = items?.length ?? 0;
    this.updateScrollFadeIndicators(
      this.questBoardCardsScrollElement,
      this.questBoardScrollFadeTopElement,
      this.questBoardScrollFadeBottomElement,
      kb && itemCount > 0
        ? {
            selectedIndex: this.questBoardSelectedIndex,
            itemCount,
            columns: items ? this.getQuestBoardGridColumns(items) : this.questBoardGridCols,
          }
        : undefined,
    );
  }

  private nudgeQuestBoardScrollOnVerticalEdge(dir: 'up' | 'down'): boolean {
    const scrollEl = this.questBoardCardsScrollElement;
    if (!scrollEl) return false;

    const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    if (max <= 0) return false;

    const deltaY = dir === 'down' ? this.BOOK_EDGE_SCROLL_STEP_PX : -this.BOOK_EDGE_SCROLL_STEP_PX;
    const next = Math.min(max, Math.max(0, scrollEl.scrollTop + deltaY));
    if (next === scrollEl.scrollTop) {
      this.updateQuestBoardScrollFade();
      return false;
    }

    scrollEl.scrollTo({ top: next, behavior: 'smooth' });
    requestAnimationFrame(() => {
      this.updateQuestBoardScrollFade();
      this.refreshKbSelectionPointer();
    });
    return true;
  }

  openQuestBoard() {
    if (this.state !== FishingState.IDLE) return;
    if (this.unifiedBookOpen) this.closeUnifiedBook();
    if (this.shopOpen) this.closeShop();

    this.questBoardOpen = true;
    this.questBoardSelectedIndex = 0;
    this.bindQuestBoardDocumentKeys();
    this.openModal(this.MODAL_IDS.QUEST_BOARD);
    this.updateQuestBoardContent();
    const resetScrollToTop = () => {
      if (this.questBoardCardsScrollElement) this.questBoardCardsScrollElement.scrollTop = 0;
    };
    resetScrollToTop();
    requestAnimationFrame(() => {
      resetScrollToTop();
      this.questBoardUIElement?.focus({ preventScroll: true });
      this.updateQuestBoardScrollFade();
      this.refreshKbSelectionPointer();
    });
  }

  closeQuestBoard() {
    this.questBoardOpen = false;
    this.unbindQuestBoardDocumentKeys();
    this.closeModal(this.MODAL_IDS.QUEST_BOARD);
  }

  /** クエストの分類（リボン色・ラベル用） */
  private getQuestGroup(quest: QuestConfig): { key: 'fishing' | 'collection' | 'challenge'; label: string } {
    const type = quest.condition.type;
    if (type === 'quest_catch_junk') return { key: 'collection', label: '収集' };
    if (
      type === 'quest_tension_max' ||
      type === 'quest_fight_duration' ||
      type === 'quest_consecutive_success'
    ) {
      return { key: 'challenge', label: 'その他' };
    }
    return { key: 'fishing', label: '釣り' };
  }

  private buildQuestCardRibbonHTML(group: { key: string; label: string }): string {
    return `
      <div class="quest-card__ribbon quest-card__ribbon--${group.key}">
        <span class="quest-card__ribbon-label">${group.label}</span>
      </div>`;
  }

  /** クエストカード用サムネイルパス（魚/ゴミ/道具） */
  private resolveQuestCardImagePath(quest: QuestConfig): string | undefined {
    const fishId = quest.condition.fishId;
    return quest.thumbnailImage ?? (fishId ? getFishImagePath(fishId) : undefined);
  }

  /** 道具画像はキャンバス占有率が高いため、表示サイズ用クラスを付与 */
  private getQuestIconImgClasses(imgPath: string, baseClass: string): string {
    return imgPath.includes('/images/items/')
      ? `${baseClass} ${baseClass}--item`
      : baseClass;
  }

  /** カードのアイコン HTML（魚/ゴミ画像があれば画像、なければ絵文字） */
  private buildQuestCardIcon(quest: QuestConfig): string {
    const imgPath = this.resolveQuestCardImagePath(quest);
    if (imgPath) {
      const imgClass = this.getQuestIconImgClasses(imgPath, 'quest-card__icon-img');
      return `<img class="${imgClass}" src="${imgPath}" alt="" draggable="false" />`;
    }
    return `<span class="quest-card__icon-emoji" aria-hidden="true">${quest.emoji}</span>`;
  }

  /** 掲示板のクエストを全件差し替え（進行中・完了済みは保持） */
  resetQuestBoard() {
    resetBoardQuests(this.playerData);
    savePlayerData(this.playerData);
    this.questBoardSelectedIndex = 0;
    if (this.questBoardOpen) {
      this.updateQuestBoardContent();
    }
    if (this.unifiedBookOpen && this.unifiedBookTab === 'quest') {
      this.updateUnifiedBookList();
      this.updateUnifiedBookDetail();
    }
    this.updateQuestHudUI();
    const count = getAvailableQuests(this.playerData).length;
    this.showResult(`掲示板のクエストを再生成しました（${count}件）`, 2000);
  }

  updateQuestBoardContent() {
    if (!this.questBoardUIElement) return;
    const summaryEl = this.questBoardUIElement.querySelector('#quest-board-active-summary') as HTMLElement;
    const listEl = this.questBoardUIElement.querySelector('#quest-board-list') as HTMLElement;
    if (!summaryEl || !listEl) return;

    this.updateQuestHudSlots(summaryEl);
    summaryEl.setAttribute('aria-label', `進行中 ${this.playerData.activeQuests.length}/${MAX_ACTIVE_QUESTS}`);

    const available = getAvailableQuests(this.playerData);
    listEl.innerHTML = '';

    if (available.length === 0) {
      listEl.innerHTML = '<p class="quest-board-empty">受注できるクエストがありません</p>';
      requestAnimationFrame(() => this.updateQuestBoardScrollFade());
      return;
    }

    if (this.questBoardSelectedIndex >= available.length) {
      this.questBoardSelectedIndex = Math.max(0, available.length - 1);
    }

    const kb = this.uiMenuNavInputChannel === 'keyboard';
    available.forEach((quest, index) => {
      const card = document.createElement('div');
      const group = this.getQuestGroup(quest);
      card.className = `quest-card ui-frame-box book-ui-node${kb && index === this.questBoardSelectedIndex ? ' is-nav-selected' : ''}`;
      card.setAttribute('data-quest-id', quest.id);
      card.setAttribute('data-index', String(index));
      card.setAttribute('data-group', group.key);
      card.innerHTML = `
        ${this.buildQuestCardRibbonHTML(group)}
        <div class="quest-card__icon ui-frame-box">${this.buildQuestCardIcon(quest)}</div>
        <div class="quest-card__title">${quest.name}</div>
        <div class="quest-card__divider"></div>
        <p class="quest-card__desc">${quest.description}</p>
        ${this.buildQuestCardRewardHTML(quest.reward)}
        <button type="button" class="quest-card__accept nes-btn ui-frame-box" data-quest-id="${quest.id}"><span class="quest-card__accept-label">受注する</span></button>
      `;
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.quest-card__accept')) {
          this.acceptQuestFromBoard(quest.id);
          return;
        }
        this.questBoardSelectedIndex = index;
        this.updateQuestBoardSelection();
        this.refreshKbSelectionPointer();
      });
      const acceptBtn = card.querySelector('.quest-card__accept');
      acceptBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.acceptQuestFromBoard(quest.id);
      });
      listEl.appendChild(card);
    });
    requestAnimationFrame(() => this.updateQuestBoardScrollFade());
  }

  /** キー↔マウス切替時に掲示板カードのキー選択見た目を同期 */
  private syncQuestBoardInputChannelChrome() {
    if (!this.questBoardOpen || !this.questBoardUIElement) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const items = this.questBoardUIElement.querySelectorAll('.quest-card');
    items.forEach((item, i) => {
      item.classList.toggle('is-nav-selected', kb && i === this.questBoardSelectedIndex);
    });
    this.updateQuestBoardScrollFade();
  }

  private updateQuestBoardSelection() {
    if (!this.questBoardUIElement) return;
    const kb = this.uiMenuNavInputChannel === 'keyboard';
    const items = this.questBoardUIElement.querySelectorAll('.quest-card');
    items.forEach((item, i) => {
      item.classList.toggle('is-nav-selected', kb && i === this.questBoardSelectedIndex);
    });
    if (kb) {
      this.scrollQuestBoardSelectionIntoView(items);
    }
    requestAnimationFrame(() => {
      this.updateQuestBoardScrollFade();
      this.refreshKbSelectionPointer();
    });
  }

  /** 先頭行／末尾行は余白込みで端まで送り、途中の行は nearest */
  private scrollQuestBoardSelectionIntoView(items: NodeListOf<Element>) {
    const scrollEl = this.questBoardCardsScrollElement;
    const selected = items[this.questBoardSelectedIndex] as HTMLElement | undefined;
    if (!scrollEl || !selected) return;

    const cols = this.getQuestBoardGridColumns(items);
    const idx = this.questBoardSelectedIndex;
    const lastRowStart = Math.floor((items.length - 1) / cols) * cols;
    const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);

    if (idx < cols) {
      if (scrollEl.scrollTop > 0) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (idx >= lastRowStart) {
      if (scrollEl.scrollTop < max) scrollEl.scrollTo({ top: max, behavior: 'smooth' });
      return;
    }
    selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  private getQuestBoardGridColumns(items: NodeListOf<Element>): number {
    if (items.length <= 1) return 1;
    const firstTop = (items[0] as HTMLElement).offsetTop;
    let cols = 0;
    for (const item of items) {
      if ((item as HTMLElement).offsetTop !== firstTop) break;
      cols++;
    }
    return Math.max(1, cols || this.questBoardGridCols);
  }

  private moveQuestBoardSelection(dir: 'up' | 'down' | 'left' | 'right'): boolean {
    if (!this.questBoardUIElement) return false;
    const items = this.questBoardUIElement.querySelectorAll('.quest-card');
    if (items.length === 0) return false;

    const gridCols = this.getQuestBoardGridColumns(items);
    const itemCount = items.length;
    const maxRows = Math.ceil(itemCount / gridCols);
    let newIndex = this.questBoardSelectedIndex;

    if (dir === 'left') {
      if (this.questBoardSelectedIndex % gridCols > 0) newIndex--;
    } else if (dir === 'right') {
      if (this.questBoardSelectedIndex % gridCols < gridCols - 1 && newIndex + 1 < itemCount) newIndex++;
    } else if (dir === 'up') {
      if (this.questBoardSelectedIndex >= gridCols) newIndex -= gridCols;
    } else if (dir === 'down') {
      const currentRow = Math.floor(this.questBoardSelectedIndex / gridCols);
      if (currentRow < maxRows - 1 && newIndex + gridCols < itemCount) {
        newIndex += gridCols;
      }
    }

    if (newIndex === this.questBoardSelectedIndex || newIndex < 0 || newIndex >= itemCount) {
      return false;
    }

    this.questBoardSelectedIndex = newIndex;
    this.updateQuestBoardSelection();
    return true;
  }

  acceptSelectedQuestFromBoard() {
    const available = getAvailableQuests(this.playerData);
    const quest = available[this.questBoardSelectedIndex];
    if (quest) {
      this.acceptQuestFromBoard(quest.id);
    }
  }

  acceptQuestFromBoard(questId: string) {
    const result = acceptQuest(this.playerData, questId);
    if (!result.ok) {
      this.showResult(result.reason ?? '受注できませんでした', 2000);
      return;
    }
    savePlayerData(this.playerData);
    this.updateQuestBoardContent();
    this.updateQuestHudUI();
    if (this.unifiedBookOpen && this.unifiedBookTab === 'quest') {
      this.updateUnifiedBookList();
      this.updateUnifiedBookDetail();
    }
    const quest = resolveQuest(this.playerData, questId);
    if (quest) {
      this.showResult(`「${quest.name}」を受注しました`, 2000);
    }
  }

  private bindQuestLogAbandonButtons() {
    if (!this.unifiedBookDetailElement) return;
    this.unifiedBookDetailElement.querySelectorAll('.quest-card__abandon').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const questId = (btn as HTMLElement).dataset.questId;
        if (questId) this.openQuestAbandonConfirm(questId);
      });
    });
  }

  private abandonQuestFromLog(questId: string) {
    const quest = resolveQuest(this.playerData, questId);
    const result = abandonQuest(this.playerData, questId);
    if (!result.ok) {
      this.showResult(result.reason ?? '破棄できませんでした', 2000);
      return;
    }
    savePlayerData(this.playerData);
    this.updateQuestHudUI();
    if (this.unifiedBookOpen && this.unifiedBookTab === 'quest') {
      this.updateUnifiedBookList();
      this.updateUnifiedBookDetail();
    }
    if (quest) {
      this.showResult(`「${quest.name}」を破棄しました`, 2000);
    }
  }

  openUnifiedBook(tab: UnifiedBookTab = 'inventory') {
    if (this.state !== FishingState.IDLE) return;

    if (this.shopOpen) this.closeShop();
    if (this.questBoardOpen) this.closeQuestBoard();

    this.unifiedBookOpen = true;
    this.unifiedBookTab = tab;
    this.unifiedBookSelectedId = null;
    this.unifiedBookSelectedIndex = null;
    this.setSkillNavArea('tree');

    // モーダルスタックに追加してオーバーレイを表示（updateModalStatesでis-openクラスが追加される）
    this.openModal(this.MODAL_IDS.UNIFIED_BOOK);

    if (this.unifiedBookUIElement) {
      this.switchUnifiedBookTab(tab);
    }
  }

  closeUnifiedBook() {
    this.closeSkillUnlockConfirm();
    this.closeQuestAbandonConfirm();
    this.closeAquariumBagPick();
    this.stopAquariumTankLoop();
    this.clearAquariumSatietyInterval();
    this.clearAquariumRemoveConfirm();
    this.exitUnifiedBookMainTabsNav();
    this.unifiedBookOpen = false;
    this.refreshStatusPanelBookInputModeStyles();
    this.syncBookPediaSortBarUI();
    this.refreshBookTabsKbInputChrome();
    this.unifiedBookSelectedId = null;
    this.unifiedBookSelectedIndex = null;
    this.unifiedBookNavRepeatDir = null;
    this.setSkillNavArea('tree');
    this.achievementNavArea = 'left';
    this.achievementDetailSelectedIndex = 0;

    // モーダルスタックから削除してオーバーレイを非表示（updateModalStatesでis-openクラスが削除される）
    this.closeModal(this.MODAL_IDS.UNIFIED_BOOK);
  }

  toggleUnifiedBook(tab: UnifiedBookTab = 'inventory') {
    if (this.unifiedBookOpen) {
      this.closeUnifiedBook();
    } else {
      this.openUnifiedBook(tab);
    }
  }

  private getKbSelectionPointerEl(): HTMLDivElement {
    if (this.kbSelectionPointerEl) return this.kbSelectionPointerEl;
    const el = document.createElement('div');
    el.className = 'ui-kb-selection-pointer';
    el.setAttribute('aria-hidden', 'true');
    el.style.display = 'none';
    document.body.appendChild(el);
    this.kbSelectionPointerEl = el;
    return el;
  }

  /** キー／ゲームパッドで辿るメニュー上の、現在の選択要素（右下マーカー用） */
  private resolveKbSelectionPointerHost(): HTMLElement | null {
    if (this.catchBagDecisionPhase === 'choice' && this.catchBagFullUIElement) {
      const id =
        this.catchBagDecisionFocus === 'release'
          ? '#catch-bag-decision-release'
          : '#catch-bag-decision-swap';
      const btn = this.catchBagFullUIElement.querySelector(`${id}.is-nav-selected`) as HTMLElement | null;
      return btn && document.body.contains(btn) ? btn : null;
    }
    if (this.catchBagDecisionPhase === 'pick' && this.catchBagFullUIElement) {
      const cancel = this.catchBagFullUIElement.querySelector(
        '#catch-bag-pick-cancel.is-nav-selected',
      ) as HTMLElement | null;
      if (cancel && document.body.contains(cancel)) return cancel;
      const card = this.catchBagFullUIElement.querySelector(
        '.aquarium-bag-pick-card.is-nav-selected',
      ) as HTMLElement | null;
      return card && document.body.contains(card) ? card : null;
    }

    if (
      this.unifiedBookOpen &&
      this.unifiedBookUIElement?.classList.contains('is-open') &&
      this.unifiedBookUIElement.classList.contains('is-topmost')
    ) {
      return this.resolveKbPointerForUnifiedBook();
    }

    const topModalId = this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : undefined;
    if (!topModalId) return null;

    if (topModalId === this.MODAL_IDS.INVENTORY && !this.detailModalOpen && this.inventoryUIElement?.classList.contains('is-topmost')) {
      const slot = this.inventorySlots[this.selectedSlotIndex];
      return slot && document.body.contains(slot) ? slot : null;
    }

    if (topModalId === this.MODAL_IDS.BOOK && !this.bookDetailOpen && this.bookUIElement?.classList.contains('is-topmost')) {
      const slot = this.bookSlots[this.bookSelectedIndex];
      return slot && document.body.contains(slot) ? slot : null;
    }

    if (topModalId === this.MODAL_IDS.SHOP && this.shopOpen && this.shopUIElement?.classList.contains('is-topmost')) {
      if (this.shopNavArea === 'tabs') {
        const tabEl = this.shopUIElement.querySelector(`.shop-tab[data-tab="${this.shopTab}"]`) as HTMLElement | null;
        return tabEl && document.body.contains(tabEl) ? tabEl : null;
      }
      const el = this.shopItemElements[this.shopSelectedIndex];
      if (!el || !document.body.contains(el)) return null;
      const actionButton = el.querySelector('.shop-item-action-button') as HTMLElement | null;
      return actionButton && document.body.contains(actionButton) ? actionButton : el;
    }

    if (
      topModalId === this.MODAL_IDS.QUEST_BOARD &&
      this.questBoardOpen &&
      this.questBoardUIElement?.classList.contains('is-topmost')
    ) {
      const card = this.questBoardUIElement.querySelector('.quest-card.is-nav-selected') as HTMLElement | null;
      if (!card || !document.body.contains(card)) return null;
      const acceptBtn = card.querySelector('.quest-card__accept') as HTMLElement | null;
      return acceptBtn && document.body.contains(acceptBtn) ? acceptBtn : card;
    }

    return null;
  }

  private resolveKbPointerForUnifiedBook(): HTMLElement | null {
    const root = this.unifiedBookUIElement!;
    if (this.skillUnlockConfirmPendingNodeId) {
      const cancel = root.querySelector('#skill-unlock-confirm-cancel.is-nav-selected') as HTMLElement | null;
      if (cancel) return cancel;
      const ok = root.querySelector('#skill-unlock-confirm-ok.is-nav-selected') as HTMLElement | null;
      return ok;
    }

    if (this.questAbandonConfirmPendingQuestId) {
      const cancel = root.querySelector('#quest-abandon-confirm-cancel.is-nav-selected') as HTMLElement | null;
      if (cancel) return cancel;
      const ok = root.querySelector('#quest-abandon-confirm-ok.is-nav-selected') as HTMLElement | null;
      return ok;
    }

    if (this.aquariumBagPickMode) {
      const cancel = root.querySelector('#aquarium-bag-pick-cancel.is-nav-selected') as HTMLElement | null;
      if (cancel) return cancel;
      const card = root.querySelector('.aquarium-bag-pick-card.is-nav-selected') as HTMLElement | null;
      return card;
    }

    if (this.unifiedBookMainTabsNavActive) {
      return root.querySelector('.book-tab-button.is-nav-selected') as HTMLElement | null;
    }

    if (this.unifiedBookTab === 'status') {
      if (this.statusNavArea === 'equipmentOptions') {
        const options = root.querySelectorAll('.book-status-equip-option.is-nav-selected');
        if (options.length > 0) return options[0] as HTMLElement;
      }
      if (this.statusNavArea === 'equipmentButtons') {
        const btn = root.querySelector('.book-status-change-btn.is-nav-selected') as HTMLElement | null;
        if (btn) return btn;
      }
      return root.querySelector('.book-status-stat-list li.is-selected') as HTMLElement | null;
    }

    if (this.unifiedBookTab === 'skills') {
      if (this.skillNavArea === 'unlock') {
        const unlock = root.querySelector('#book-skill-unlock.is-nav-selected') as HTMLElement | null;
        if (unlock) return unlock;
      }
      if (this.skillNavArea === 'category') {
        const tabs = root.querySelector('#book-skill-category-tabs.is-nav-selected') as HTMLElement | null;
        if (tabs) {
          const activeTab = tabs.querySelector('.book-skill-category-tab.is-active') as HTMLElement | null;
          if (activeTab) return activeTab;
          return tabs;
        }
      }
      if (this.skillNavArea === 'tree') {
        return root.querySelector('#book-skill-tree-grid .book-ui-node.is-selected') as HTMLElement | null;
      }
      return null;
    }

    if (this.unifiedBookTab === 'achievement' || this.unifiedBookTab === 'quest') {
      if (this.achievementNavArea === 'right') {
        if (this.unifiedBookTab === 'quest' && this.unifiedBookSelectedId === 'active') {
          const btn = root.querySelector('.quest-card__abandon.is-nav-selected') as HTMLElement | null;
          if (btn) return btn;
        } else if (this.unifiedBookTab === 'quest') {
          const row = root.querySelector(
            '.quest-log-list.quest-log-list--completed .quest-card.quest-card--kb-selected',
          ) as HTMLElement | null;
          if (row) return row;
        } else {
          const row = root.querySelector(
            '.achievement-detail-item.achievement-detail-item--kb-selected',
          ) as HTMLElement | null;
          if (row) return row;
        }
      }
      const catSelector =
        this.unifiedBookTab === 'quest'
          ? '#book-list-scroll .quest-log-category.is-selected'
          : '#book-list-scroll .achievement-category-item.is-selected';
      const cat = root.querySelector(catSelector) as HTMLElement | null;
      if (cat) return cat;
    }

    if (this.unifiedBookTab === 'pedia' && this.pediaNavArea === 'sort') {
      const sel = this.unifiedBookPediaSortMode === 'rarity' ? '#book-pedia-sort-rarity' : '#book-pedia-sort-waters';
      return root.querySelector(sel) as HTMLElement | null;
    }

    if (this.unifiedBookTab === 'aquarium') {
      if (this.aquariumNavArea === 'slots') {
        const idx = this.unifiedBookSelectedIndex ?? 0;
        const card = this.unifiedBookListItems[idx]?.querySelector('.aquarium-slot-card.is-nav-selected') as HTMLElement | null;
        if (card) return card;
        return this.unifiedBookListItems[idx]?.querySelector('.aquarium-slot-card') as HTMLElement | null;
      }
      if (this.aquariumNavArea === 'detail') {
        const el = root.querySelector('#aquarium-manage-detail .is-nav-selected') as HTMLElement | null;
        if (el) return el;
      }
      if (this.aquariumNavArea === 'food') {
        return root.querySelector('.aquarium-food-option.is-nav-selected') as HTMLElement | null;
      }
      if (this.aquariumNavArea === 'tank') {
        return root.querySelector('.aquarium-canvas-wrap.is-nav-selected') as HTMLElement | null;
      }
    }

    return root.querySelector(
      '#book-list-scroll .book-ui-node.book-list-item.is-selected',
    ) as HTMLElement | null;
  }

  /**
   * メニュー入力チャンネル。キー↔マウス切替は必ずここを通す。
   * マウスに戻したときはキーフォーカス見た目を全UIから外す。
   */
  private applyUiMenuNavInputChannel(channel: 'mouse' | 'keyboard') {
    if (this.uiMenuNavInputChannel === channel) return;
    this.uiMenuNavInputChannel = channel;
    this.syncUiMenuInputChannelChrome();
  }

  /** 入力チャンネルに合わせて、開いている全メニューのキークロームを同期する */
  private syncUiMenuInputChannelChrome() {
    this.syncUiMenuKeyboardPointerSuppression();
    this.refreshBookTabsKbInputChrome();
    this.refreshStatusPanelBookInputModeStyles();
    this.syncBagPickInputChannelChrome();
    this.syncQuestBoardInputChannelChrome();
    this.syncBookPediaSortBarUI();
    this.syncUnifiedBookMainTabsNavUI();
    this.syncSkillNavAreaChrome();
    if (this.shopOpen) this.updateShopTabs();
    if (this.skillUnlockConfirmPendingNodeId) this.syncSkillUnlockConfirmSelection();
    if (this.questAbandonConfirmPendingQuestId) this.syncQuestAbandonConfirmSelection();
    if (this.unifiedBookOpen && (this.unifiedBookTab === 'quest' || this.unifiedBookTab === 'achievement')) {
      this.syncRightPaneDetailKeyboardSelection();
    }
    this.refreshKbSelectionPointer();
  }

  private noteUiMenuKeyboardNavigation() {
    this.applyUiMenuNavInputChannel('keyboard');
  }

  /**
   * キー操作時は HTML モーダルへポインタを届かせない（:hover 残りを防ぐ）。マウス系イベントで解除。
   * modalStack 更新時も `updateModalStates` から同期する。
   */
  private syncUiMenuKeyboardPointerSuppression() {
    const htmlUiOpen = this.modalStack.length > 0 || !!this.catchBagDecisionPending;
    const suppress = this.uiMenuNavInputChannel === 'keyboard' && htmlUiOpen;
    document.body.classList.toggle('ui-menu-input-keyboard', suppress);
  }

  /** スキル / 実績 / クエスト / 図鑑 / バッグ / 水槽: キー操作中は左リスト・ツリー等のホバー見た目を抑える（#book-ui.is-book-kb-input） */
  private refreshBookTabsKbInputChrome() {
    if (!this.unifiedBookUIElement) return;
    const kb =
      this.unifiedBookOpen &&
      !this.unifiedBookMainTabsNavActive &&
      this.uiMenuNavInputChannel === 'keyboard' &&
      (this.unifiedBookTab === 'skills' ||
        this.unifiedBookTab === 'achievement' ||
        this.unifiedBookTab === 'quest' ||
        this.unifiedBookTab === 'pedia' ||
        this.unifiedBookTab === 'inventory' ||
        this.unifiedBookTab === 'aquarium');
    this.unifiedBookUIElement.classList.toggle('is-book-kb-input', kb);
    if (this.unifiedBookTab === 'aquarium') {
      this.syncAquariumKeyboardSelection();
    }
  }

  /** ステータスタブ: キー操作中はマウス風ホバー見た目を抑える */
  private refreshStatusPanelBookInputModeStyles() {
    if (!this.unifiedBookUIElement) return;
    const panel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
    if (!panel) return;
    const kbChrome =
      this.unifiedBookOpen &&
      this.unifiedBookTab === 'status' &&
      this.uiMenuNavInputChannel === 'keyboard';
    panel.classList.toggle('is-status-kb-nav-input', kbChrome);
    if (this.unifiedBookOpen && this.unifiedBookTab === 'status') {
      this.syncStatusEquipmentButtonSelection(panel);
    }
  }

  /**
   * スクロールクリップ内のホスト矩形を可視領域に収める。
   * smooth scrollIntoView 直後はカードが枠外にあり、指が画面下へ飛ぶのを防ぐ。
   */
  private getKbPointerAnchorRect(host: HTMLElement): DOMRect | null {
    const r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;

    let clip: HTMLElement | null = null;
    for (let p = host.parentElement; p && p !== document.body; p = p.parentElement) {
      const oy = window.getComputedStyle(p).overflowY;
      if (oy === 'auto' || oy === 'scroll' || oy === 'hidden') {
        clip = p;
        break;
      }
    }
    if (!clip) return r;

    const c = clip.getBoundingClientRect();
    const left = Math.min(Math.max(r.left, c.left), c.right);
    const right = Math.max(Math.min(r.right, c.right), c.left);
    const width = Math.max(right - left, 1);

    if (r.bottom <= c.top) {
      return new DOMRect(left, c.top, width, 1);
    }
    if (r.top >= c.bottom) {
      return new DOMRect(left, c.bottom - 1, width, 1);
    }

    const top = Math.max(r.top, c.top);
    const bottom = Math.min(r.bottom, c.bottom);
    return new DOMRect(left, top, width, Math.max(bottom - top, 1));
  }

  private positionKbSelectionPointer(host: HTMLElement | null) {
    const ptr = this.getKbSelectionPointerEl();
    const hideKbPointerAndCursor = () => {
      ptr.style.display = 'none';
      ptr.style.transition = 'none';
      this.kbSelectionPointerVisible = false;
      this.kbSelectionPointerLastHost = null;
      this.kbSelectionPointerEaseUntilMs = 0;
      document.body.classList.remove('ui-kb-selection-cursor-hide');
    };
    if (!host) {
      hideKbPointerAndCursor();
      return;
    }
    const r = this.getKbPointerAnchorRect(host);
    if (!r) {
      hideKbPointerAndCursor();
      return;
    }
    /* マウス操作中は右下マーカーを出さず、実カーソルのみ */
    if (this.uiMenuNavInputChannel === 'mouse') {
      hideKbPointerAndCursor();
      return;
    }
    /* NES.css 既定カーソルと同じ 32×32。正の nudge でホスト矩形の右下外側へ寄せる（要素ごとに分岐可） */
    const size = 32;
    let nudgeX = 16;
    let nudgeY = 16;
    /* 上部 Book タブ: +8 だと下に寄りすぎるため従来の 8 のまま */
    if (host.classList.contains('book-tab-button')) {
      nudgeX = 8;
      nudgeY = 8;
    } else if (host.classList.contains('book-skill-category-tab')) {
      /* スキル◇は小さめホスト用（共通 +8 は適用しない） */
      nudgeX = 28;
      nudgeY = 42;
    }
    const left = Math.round(r.right - size + nudgeX);
    const top = Math.round(r.bottom - size + nudgeY);
    const now = performance.now();
    const hostChanged = host !== this.kbSelectionPointerLastHost;
    const shouldEase = this.kbSelectionPointerVisible && hostChanged;

    ptr.style.position = 'fixed';
    ptr.style.width = `${size}px`;
    ptr.style.height = `${size}px`;
    if (!this.kbSelectionPointerVisible) {
      /* 初回表示・再表示は (0,0) からのスライドを避けて即時配置 */
      ptr.style.transition = 'none';
      ptr.style.display = 'block';
      ptr.style.left = `${left}px`;
      ptr.style.top = `${top}px`;
      void ptr.offsetWidth;
      ptr.style.removeProperty('transition');
      this.kbSelectionPointerEaseUntilMs = 0;
    } else if (shouldEase) {
      ptr.style.removeProperty('transition');
      ptr.style.display = 'block';
      ptr.style.left = `${left}px`;
      ptr.style.top = `${top}px`;
      this.kbSelectionPointerEaseUntilMs = now + 140;
    } else if (now < this.kbSelectionPointerEaseUntilMs) {
      /* イージング中は目標だけ更新（スクロール中も追従） */
      ptr.style.display = 'block';
      ptr.style.left = `${left}px`;
      ptr.style.top = `${top}px`;
    } else {
      /* 同一ホストの追従（scrollIntoView 等）は即時 */
      ptr.style.transition = 'none';
      ptr.style.display = 'block';
      ptr.style.left = `${left}px`;
      ptr.style.top = `${top}px`;
    }
    this.kbSelectionPointerVisible = true;
    this.kbSelectionPointerLastHost = host;
    document.body.classList.toggle('ui-kb-selection-cursor-hide', this.uiMenuNavInputChannel === 'keyboard');
  }

  private refreshKbSelectionPointer() {
    this.positionKbSelectionPointer(this.resolveKbSelectionPointerHost());
  }

  handleUnifiedBookNavigation() {
    if (!this.unifiedBookOpen) return;
    if (this.skillUnlockConfirmPendingNodeId) {
      this.handleSkillUnlockConfirmNavigation();
      return;
    }
    if (this.questAbandonConfirmPendingQuestId) {
      this.handleQuestAbandonConfirmNavigation();
      return;
    }
    if (this.aquariumBagPickMode) {
      const keyboard = this.input?.keyboard;
      if (!keyboard) return;
      const now = this.time.now;
      const dir =
        this.cursors.up.isDown ? 'up' :
        this.cursors.down.isDown ? 'down' :
        this.cursors.left.isDown ? 'left' :
        this.cursors.right.isDown ? 'right' :
        null;
      if (!dir) {
        this.unifiedBookNavRepeatDir = null;
        this.unifiedBookNavNextMoveAt = 0;
        return;
      }
      const justDown =
        (dir === 'up' && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
        (dir === 'down' && Phaser.Input.Keyboard.JustDown(this.cursors.down)) ||
        (dir === 'left' && Phaser.Input.Keyboard.JustDown(this.cursors.left)) ||
        (dir === 'right' && Phaser.Input.Keyboard.JustDown(this.cursors.right));
      const isRepeatMoveDue = this.unifiedBookNavRepeatDir === dir && now >= this.unifiedBookNavNextMoveAt;
      const isInitialMove = this.unifiedBookNavRepeatDir !== dir && justDown;
      if (!isInitialMove && !isRepeatMoveDue) return;
      this.noteUiMenuKeyboardNavigation();
      this.unifiedBookNavRepeatDir = dir;
      this.unifiedBookNavNextMoveAt = now + (isInitialMove ? this.unifiedBookNavInitialDelayMs : this.unifiedBookNavRepeatIntervalMs);
      this.handleAquariumBagPickNavigation(dir);
      return;
    }

    // タブ切替（Q, E）
    const keyboard = this.input?.keyboard;
    if (!keyboard) return;
    const qKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    const eKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    
    const bookTabsCycle = this.getVisibleUnifiedBookTabOrder();
    const keepTabRow = this.unifiedBookMainTabsNavActive;
    if (Phaser.Input.Keyboard.JustDown(qKey)) {
      this.noteUiMenuKeyboardNavigation();
      let i = bookTabsCycle.indexOf(this.unifiedBookTab);
      if (i < 0) i = 0;
      this.switchUnifiedBookTab(bookTabsCycle[(i - 1 + bookTabsCycle.length) % bookTabsCycle.length], {
        keepMainTabNav: keepTabRow,
      });
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(eKey)) {
      this.noteUiMenuKeyboardNavigation();
      let i = bookTabsCycle.indexOf(this.unifiedBookTab);
      if (i < 0) i = 0;
      this.switchUnifiedBookTab(bookTabsCycle[(i + 1) % bookTabsCycle.length], {
        keepMainTabNav: keepTabRow,
      });
      return;
    }

    const now = this.time.now;

    // 現在の矢印方向（複数押しの場合は優先度を固定）
    const dir =
      this.cursors.up.isDown ? 'up' :
      this.cursors.down.isDown ? 'down' :
      this.cursors.left.isDown ? 'left' :
      this.cursors.right.isDown ? 'right' :
      null;

    // 入力が途切れたらリピート状態をリセット
    if (!dir) {
      this.unifiedBookNavRepeatDir = null;
      this.unifiedBookNavNextMoveAt = 0;
      return;
    }

    // リピート制御:
    // - 方向が変わったときは、そのキーの「初回押下（JustDown）」で即移動
    // - 同じ方向は `unifiedBookNavNextMoveAt` に達したら移動
    const justDown =
      (dir === 'up' && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
      (dir === 'down' && Phaser.Input.Keyboard.JustDown(this.cursors.down)) ||
      (dir === 'left' && Phaser.Input.Keyboard.JustDown(this.cursors.left)) ||
      (dir === 'right' && Phaser.Input.Keyboard.JustDown(this.cursors.right));

    const isRepeatMoveDue = this.unifiedBookNavRepeatDir === dir && now >= this.unifiedBookNavNextMoveAt;
    const isInitialMove = this.unifiedBookNavRepeatDir !== dir && justDown;
    const shouldMove = isInitialMove || isRepeatMoveDue;

    if (!shouldMove) return;

    this.noteUiMenuKeyboardNavigation();

    // 次回移動タイミング更新
    if (this.unifiedBookNavRepeatDir !== dir) {
      this.unifiedBookNavRepeatDir = dir;
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
    } else {
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavRepeatIntervalMs;
    }

    const bookTabOrder = this.getVisibleUnifiedBookTabOrder();

    if (this.unifiedBookMainTabsNavActive) {
      const ti = bookTabOrder.indexOf(this.unifiedBookTab);
      if (dir === 'down') {
        this.exitUnifiedBookMainTabsNav();
        this.restoreUnifiedBookMenuSelectionAfterMainTabNav();
        return;
      }
      if (dir === 'left' || dir === 'right') {
        if (ti < 0 || bookTabOrder.length === 0) return;
        const delta = dir === 'left' ? -1 : 1;
        const next = (ti + delta + bookTabOrder.length) % bookTabOrder.length;
        this.switchUnifiedBookTab(bookTabOrder[next], { keepMainTabNav: true });
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      }
      return;
    }

    if (this.unifiedBookTab === 'skills') {
      this.handleSkillBookArrowNavigation(dir);
      return;
    }

    if (this.unifiedBookListItems.length === 0) {
      if (this.unifiedBookTab === 'status') {
        const statusPanel = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
        if (statusPanel) {
          if (dir === 'up' || dir === 'down') {
            if (this.statusNavArea === 'equipmentOptions') {
              this.moveStatusEquipmentOptionSelection(statusPanel, dir === 'up' ? -1 : 1);
            } else if (this.statusNavArea === 'equipmentButtons') {
              if (dir === 'up') {
                this.enterUnifiedBookMainTabsNav();
              } else {
                this.statusNavArea = 'stats';
                this.syncStatusEquipmentButtonSelection(statusPanel);
                this.setupStatusStatSelector(statusPanel);
              }
            } else {
              if (dir === 'up') {
                if (this.selectedStatusStatKey === 'power') {
                  this.statusNavArea = 'equipmentButtons';
                  this.syncStatusEquipmentButtonSelection(statusPanel);
                } else {
                  this.moveStatusStatSelection(statusPanel, -1);
                }
              } else {
                this.moveStatusStatSelection(statusPanel, 1);
              }
            }
            return;
          }
          if (dir === 'right') {
            if (this.statusNavArea === 'stats') {
              this.statusNavArea = 'equipmentButtons';
              this.syncStatusEquipmentButtonSelection(statusPanel);
              return;
            }
            if (this.statusNavArea === 'equipmentButtons') {
              if (this.statusNavButtonType === 'lure') {
                this.enterUnifiedBookMainTabsNav();
                this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
                return;
              }
              this.moveStatusEquipmentButtonSelection(statusPanel, 1);
              return;
            }
          }
          if (dir === 'left') {
            if (this.statusNavArea === 'equipmentOptions') {
              this.statusEquipmentSelectorType = null;
              this.statusNavArea = 'equipmentButtons';
              this.fillBookStatusPanel(statusPanel);
              return;
            }
            if (this.statusNavArea === 'equipmentButtons') {
              const prevType = this.statusNavButtonType;
              this.moveStatusEquipmentButtonSelection(statusPanel, -1);
              if (prevType === 'rod') {
                this.statusNavArea = 'stats';
                this.syncStatusEquipmentButtonSelection(statusPanel);
                this.setupStatusStatSelector(statusPanel);
              }
              return;
            }
          }
        }
      }
      if (dir === 'up') {
        this.enterUnifiedBookMainTabsNav();
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
        return;
      }
      if (dir === 'left' || dir === 'right') {
        this.enterUnifiedBookMainTabsNav();
        this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      }
      return;
    }

    if (this.unifiedBookTab === 'aquarium') {
      this.handleAquariumNavigation(dir, now);
      return;
    }

    if ((this.unifiedBookTab === 'achievement' || this.unifiedBookTab === 'quest') && this.unifiedBookListItems.length > 0) {
      if (this.unifiedBookTab === 'quest' && this.achievementNavArea === 'left') {
        this.handleQuestLeftPaneNavigation(dir, now);
        return;
      }
      if (this.achievementNavArea === 'right') {
        if (this.unifiedBookTab === 'quest') {
          this.handleQuestLogRightPaneNavigation(dir, now);
        } else {
          this.handleAchievementRightPaneNavigation(dir, now);
        }
        return;
      }
      if (dir === 'right' && this.unifiedBookTab === 'achievement') {
        if (this.tryEnterAchievementRightPane()) {
          this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
          return;
        }
        // 詳細が空のときは右端タブ切替など通常ナビへフォールスルー
      }
    }

    if (this.unifiedBookTab === 'pedia') {
      if (this.pediaNavArea === 'sort') {
        if (dir === 'up') {
          this.enterUnifiedBookMainTabsNav();
          return;
        }
        if (dir === 'down') {
          this.pediaNavArea = 'list';
          this.syncBookPediaSortBarUI();
          if (this.unifiedBookListItems.length > 0) {
            const lastIdx = this.unifiedBookListItems.length - 1;
            let idx = this.unifiedBookSelectedIndex ?? 0;
            if (idx < 0 || idx > lastIdx) idx = 0;
            const item = this.unifiedBookListItems[idx];
            const fishId = item?.getAttribute('data-fish-id');
            if (fishId) {
              this.selectUnifiedBookItem(fishId, idx);
            }
          }
          this.refreshKbSelectionPointer();
          return;
        }
        if (dir === 'left') {
          if (this.unifiedBookPediaSortMode === 'waters') {
            this.setUnifiedBookPediaSortMode('rarity');
          } else {
            this.enterUnifiedBookMainTabsNav();
            this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
          }
          return;
        }
        if (dir === 'right') {
          if (this.unifiedBookPediaSortMode === 'rarity') {
            this.setUnifiedBookPediaSortMode('waters');
          } else {
            this.enterUnifiedBookMainTabsNav();
            this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
          }
          return;
        }
        return;
      }

      if (this.pediaNavArea === 'list' && dir === 'up') {
        const lastIdx = this.unifiedBookListItems.length - 1;
        let cur = this.unifiedBookSelectedIndex ?? 0;
        if (lastIdx < 0) cur = 0;
        if (cur < 0 || cur > lastIdx) cur = 0;
        if (this.unifiedBookListItems.length === 0 || cur === 0) {
          this.pediaNavArea = 'sort';
          this.syncBookPediaSortBarUI();
          this.refreshKbSelectionPointer();
          return;
        }
      }
    }

    // クエスト・アクアリウムタブは各専用ハンドラで完結
    if ((this.unifiedBookTab as string) === 'quest' || (this.unifiedBookTab as string) === 'aquarium') return;

    // 現在の選択インデックスを取得（インベントリは同じ `fish.id` が複数枚あり得るため index 基準）
    let currentIndex = this.unifiedBookSelectedIndex ?? 0;
    const lastIndex = this.unifiedBookListItems.length - 1;
    if (currentIndex < 0 || currentIndex > lastIndex) currentIndex = 0;

    const columns =
      (this.unifiedBookTab as string) === 'achievement' ||
      (this.unifiedBookTab as string) === 'quest' ||
      this.unifiedBookTab === 'pedia' ||
      (this.unifiedBookTab as string) === 'aquarium'
        ? 1
        : 3;

    if (dir === 'up' && currentIndex < columns && this.achievementNavArea === 'left') {
      this.enterUnifiedBookMainTabsNav();
      return;
    }

    // 矢印キーで選択移動（グリッド基準）
    let newIndex = currentIndex;
    if (dir === 'up') {
      newIndex = Math.max(0, currentIndex - columns);
    } else if (dir === 'down') {
      newIndex = Math.min(lastIndex, currentIndex + columns);
    } else if (dir === 'left') {
      if (currentIndex % columns !== 0) newIndex = currentIndex - 1;
    } else if (dir === 'right') {
      if (currentIndex % columns !== columns - 1 && currentIndex + 1 <= lastIndex) newIndex = currentIndex + 1;
    }

    // 端まで到達しているなら、左右入力で現在タブの上部タブ列へ戻す
    if (newIndex === currentIndex && (dir === 'left' || dir === 'right')) {
      this.enterUnifiedBookMainTabsNav();
      this.unifiedBookNavNextMoveAt = now + this.unifiedBookNavInitialDelayMs;
      return;
    }

    if (newIndex === currentIndex) {
      if ((dir === 'up' || dir === 'down') && this.nudgeBookScrollOnVerticalEdge(dir)) {
        return;
      }
      return;
    }

    const item = this.unifiedBookListItems[newIndex];
    // スクロールして表示範囲内に
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (this.unifiedBookTab === 'achievement') {
      const category = item.getAttribute('data-category');
      if (category) this.selectAchievementCategory(category, newIndex);
    } else {
      const fishId = item.getAttribute('data-fish-id');
      if (fishId) this.selectUnifiedBookItem(fishId, newIndex);
    }
  }

  createBookDetailModal() {
    // HTML/CSSで図鑑詳細モーダルを作成
    const bookDetailHTML = `
      <div id="book-detail-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content detail-modal nes-container with-rounded ui-frame-box">
          <button class="modal-close nes-btn ui-frame-box" onclick="window.gameScene?.closeBookDetail()">✕</button>
          <div class="detail-content">
            <canvas id="book-detail-fish-image" class="detail-image" width="80" height="80" style="display: none;"></canvas>
            <div id="book-detail-emoji" class="detail-emoji" style="display: none;"></div>
            <div id="book-detail-name" class="detail-name"></div>
            <div id="book-detail-rarity" class="detail-rarity"></div>
            <div id="book-detail-desc" class="detail-desc"></div>
            <div id="book-detail-price" class="detail-info"></div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bookDetailHTML;
    this.bookDetailElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.bookDetailElement);

    // 閉じるボタンのイベント
    const closeBtn = this.bookDetailElement.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeBookDetail());
    }
  }

  toggleBook() {
    // 統合BookUIを使用
    this.toggleUnifiedBook('pedia');
  }

  openBook() {
    // 統合BookUIを使用（既存コードとの互換性のため残す）
    this.openUnifiedBook('pedia');
  }

  closeBook() {
    // 図鑑詳細が開いている場合は先に閉じる（スタックの順序を正しく保つため）
    if (this.bookDetailOpen) {
        this.closeBookDetail();
    }
    
    this.bookOpen = false;
    if (this.bookUIElement) {
      this.closeModal(this.MODAL_IDS.BOOK);
    }
  }

  // ゴミ以外の魚リストを取得
  getRealFishList() {
    return fishDatabase.filter(f => !f.id.startsWith('junk'));
  }

  private syncBookPediaSortBarUI() {
    if (!this.unifiedBookUIElement) return;
    const root = this.unifiedBookUIElement;
    const rarityBtn = root.querySelector('#book-pedia-sort-rarity') as HTMLButtonElement | null;
    const watersBtn = root.querySelector('#book-pedia-sort-waters') as HTMLButtonElement | null;
    const rarityOn = this.unifiedBookPediaSortMode === 'rarity';
    rarityBtn?.classList.toggle('is-active', rarityOn);
    watersBtn?.classList.toggle('is-active', !rarityOn);
    rarityBtn?.setAttribute('aria-selected', rarityOn ? 'true' : 'false');
    watersBtn?.setAttribute('aria-selected', rarityOn ? 'false' : 'true');

    const kbSortNav =
      this.unifiedBookTab === 'pedia' &&
      this.pediaNavArea === 'sort' &&
      this.uiMenuNavInputChannel === 'keyboard';
    root.classList.toggle('is-pedia-sort-kb-nav', kbSortNav);
    rarityBtn?.classList.toggle('is-nav-selected', kbSortNav && rarityOn);
    watersBtn?.classList.toggle('is-nav-selected', kbSortNav && !rarityOn);
  }

  private setUnifiedBookPediaSortMode(mode: 'rarity' | 'waters') {
    if (this.unifiedBookPediaSortMode === mode) return;
    const preservePediaSortNav =
      this.unifiedBookTab === 'pedia' && this.pediaNavArea === 'sort' && this.uiMenuNavInputChannel === 'keyboard';
    this.unifiedBookPediaSortMode = mode;
    this.updateUnifiedBookList();
    if (this.unifiedBookTab !== 'pedia' || this.unifiedBookListItems.length === 0) return;
    const firstId = this.unifiedBookListItems[0]?.getAttribute('data-fish-id');
    if (firstId) {
      this.selectUnifiedBookItem(firstId, 0, { pediaNavKeepSortArea: preservePediaSortNav });
    }
    if (preservePediaSortNav) {
      this.syncBookPediaSortBarUI();
    }
  }

  private getSortedPediaFishList(source: FishConfig[]): FishConfig[] {
    const RARITY_ORDER: Record<Rarity, number> = {
      [Rarity.COMMON]: 0,
      [Rarity.UNCOMMON]: 1,
      [Rarity.RARE]: 2,
      [Rarity.EPIC]: 3,
      [Rarity.LEGENDARY]: 4,
    };
    const HABITAT_ORDER: Record<Habitat, number> = {
      [Habitat.FRESHWATER]: 0,
      [Habitat.STREAM]: 1,
      [Habitat.SALTWATER]: 2,
    };
    const list = [...source];
    if (this.unifiedBookPediaSortMode === 'rarity') {
      list.sort((a, b) => {
        const ra = RARITY_ORDER[a.rarity] ?? 99;
        const rb = RARITY_ORDER[b.rarity] ?? 99;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name, 'ja');
      });
    } else {
      list.sort((a, b) => {
        const ha = HABITAT_ORDER[a.habitat] ?? 99;
        const hb = HABITAT_ORDER[b.habitat] ?? 99;
        if (ha !== hb) return ha - hb;
        const ra = RARITY_ORDER[a.rarity] ?? 99;
        const rb = RARITY_ORDER[b.rarity] ?? 99;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name, 'ja');
      });
    }
    return list;
  }

  private getPediaSectionHeadingLabel(groupKey: string): string {
    if (this.unifiedBookPediaSortMode === 'rarity') {
      return groupKey.toUpperCase();
    }
    const watersSectionLabels: Record<string, string> = {
      [Habitat.FRESHWATER]: 'Freshwater',
      [Habitat.STREAM]: 'Stream',
      [Habitat.SALTWATER]: 'Saltwater',
    };
    return watersSectionLabels[groupKey] ?? groupKey;
  }

  updateBookSlots() {
    if (!this.bookUIElement) return;
    
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const totalPages = Math.ceil(fishList.length / slotsPerPage);
    const startIndex = this.bookPage * slotsPerPage;
    
    // コンプリート率更新
    const caughtCount = Array.from(this.playerData.caughtFishIds).filter(id => !id.startsWith('junk')).length;
    const totalFish = fishList.length;
    const percentage = Math.floor((caughtCount / totalFish) * 100);
    if (this.bookProgressElement) {
      this.bookProgressElement.textContent = `発見: ${caughtCount}/${totalFish} (${percentage}%)`;
    }

    // ページ表示更新
    if (this.bookPageTextElement) {
      this.bookPageTextElement.textContent = `ページ ${this.bookPage + 1}/${totalPages}`;
    }

    for (let i = 0; i < slotsPerPage; i++) {
        const slotData = this.bookSlotElements[i];
        if (!slotData) continue;
        
        const { slot, bg: slotBg, image: slotImage, emoji: slotEmoji, name: slotName, rarity: slotRarity } = slotData;

        const fishIndex = startIndex + i;
        
        if (fishIndex < fishList.length) {
            const fish = fishList[fishIndex];
            const isCaught = this.playerData.caughtFishIds.has(fish.id);
            
            if (isCaught) {
                // 発見済み - 画像があれば画像、なければ絵文字
                const hasTexture = this.textures.exists(fish.id);
                if (hasTexture) {
                    const ctx = slotImage.getContext('2d');
                    if (ctx) {
                        // データ属性で前回のfishIdをチェック（最適化）
                        const lastFishId = slotImage.getAttribute('data-fish-id');
                        if (lastFishId !== fish.id) {
                            ctx.clearRect(0, 0, 70, 70);
                            
                            // キャッシュから取得または作成
                            const cacheKey = `${fish.id}_70`;
                            let cached = this.canvasImageCache.get(cacheKey);
                            
                            if (!cached) {
                                const frame = this.textures.getFrame(fish.id);
                                const maxSize = 70;
                                const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
                                const width = frame.width * scale;
                                const height = frame.height * scale;
                                
                                // キャッシュ用のCanvas（スロットサイズで白フチ込みの魚を中央に描画）
                                const cacheCanvas = document.createElement('canvas');
                                cacheCanvas.width = 70;
                                cacheCanvas.height = 70;
                                const cacheCtx = cacheCanvas.getContext('2d');
                                
                                if (cacheCtx) {
                                    cacheCtx.clearRect(0, 0, 70, 70);
                                    const sourceImage = frame.source.image as HTMLImageElement;
                                    if (sourceImage) {
                                        this.drawFishImageWithOutline(cacheCtx, sourceImage, frame,
                                            (70 - width) / 2, (70 - height) / 2, width, height, 2, '#ffffff');
                                    }
                                }

                                cached = { canvas: cacheCanvas, width: 70, height: 70 };
                                this.canvasImageCache.set(cacheKey, cached);
                            }

                            // キャッシュから描画
                            ctx.drawImage(cached.canvas, 0, 0);
                            slotImage.setAttribute('data-fish-id', fish.id);
                        }
                    }
                    slotImage.style.display = 'block';
                    slotEmoji.style.display = 'none';
                } else {
                    slotImage.style.display = 'none';
                    slotEmoji.textContent = fish.emoji;
                    slotEmoji.style.display = 'block';
                }
                
                slotName.textContent = fish.name;
                slotRarity.textContent = rarityStars[fish.rarity];
                
                const colorHex = this.getRarityColorCssValue(fish.rarity);
                slotBg.style.backgroundColor = colorHex;
                slotBg.style.opacity = '0.3';
                slotBg.style.borderColor = colorHex;
                slotRarity.style.color = colorHex;
            } else {
                // 未発見（シルエット）
                slotImage.style.display = 'none';
                slotEmoji.textContent = '?';
                slotEmoji.style.display = 'block';
                slotName.textContent = '？？？';
                slotRarity.textContent = rarityStars[fish.rarity];
                
                slotBg.style.backgroundColor = '#e7e7e7';
                slotBg.style.opacity = '1';
                slotBg.style.borderColor = '#212529';
                slotRarity.style.color = '#666666';
            }
            
            slot.style.display = 'block';
        } else {
            // 空きスロット
            slotImage.style.display = 'none';
            slotImage.removeAttribute('data-fish-id'); // クリア
            slotEmoji.textContent = '';
            slotEmoji.style.display = 'none';
            slotName.textContent = '';
            slotRarity.textContent = '';
            slotBg.style.backgroundColor = '#fff';
            slotBg.style.opacity = '1';
            slotBg.style.borderColor = '#212529';
            slot.style.display = 'none';
        }
    }
  }

  private lastSelectedBookIndex: number = -1;

  updateBookSelection() {
    if (!this.bookUIElement || this.bookSlots.length === 0) return;
    
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const startIndex = this.bookPage * slotsPerPage;
    const visibleCount = Math.min(slotsPerPage, fishList.length - startIndex);
    
    // 選択インデックスが範囲外なら調整
    if (this.bookSelectedIndex >= visibleCount) {
        this.bookSelectedIndex = Math.max(0, visibleCount - 1);
    }
    
    // 前回と同じインデックスの場合はスキップ（最適化）
    if (this.bookSelectedIndex === this.lastSelectedBookIndex) {
      return;
    }
    
    // 前回選択されていたスロットからクラスを削除
    if (this.lastSelectedBookIndex >= 0 && this.bookSlots[this.lastSelectedBookIndex]) {
      this.bookSlots[this.lastSelectedBookIndex].classList.remove('is-selected');
    }
    
    // 選択されたスロットにクラスを追加
    if (this.bookSlots[this.bookSelectedIndex]) {
      this.bookSlots[this.bookSelectedIndex].classList.add('is-selected');
    }
    
    this.lastSelectedBookIndex = this.bookSelectedIndex;
  }

  bookPrevPage() {
    if (this.bookPage > 0) {
        this.bookPage--;
        this.bookSelectedIndex = 0;
        this.lastSelectedBookIndex = -1; // リセット
        this.updateBookSlots();
        this.updateBookSelection();
    }
  }

  bookNextPage() {
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const totalPages = Math.ceil(fishList.length / slotsPerPage);
    
    if (this.bookPage < totalPages - 1) {
        this.bookPage++;
        this.bookSelectedIndex = 0;
        this.lastSelectedBookIndex = -1; // リセット
        this.updateBookSlots();
        this.updateBookSelection();
    }
  }

  openBookDetail() {
    if (!this.bookDetailElement) return;
    
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const fishIndex = this.bookPage * slotsPerPage + this.bookSelectedIndex;
    
    if (fishIndex >= fishList.length) return;
    
    const fish = fishList[fishIndex];
    const isCaught = this.playerData.caughtFishIds.has(fish.id);

    this.bookDetailOpen = true;

    const fishImage = this.bookDetailElement.querySelector('#book-detail-fish-image') as HTMLCanvasElement;
    const emoji = this.bookDetailElement.querySelector('#book-detail-emoji') as HTMLElement;
    const nameText = this.bookDetailElement.querySelector('#book-detail-name') as HTMLElement;
    const rarityText = this.bookDetailElement.querySelector('#book-detail-rarity') as HTMLElement;
    const descText = this.bookDetailElement.querySelector('#book-detail-desc') as HTMLElement;
    const priceText = this.bookDetailElement.querySelector('#book-detail-price') as HTMLElement;

    if (isCaught) {
        // 画像があれば画像、なければ絵文字
        if (this.textures.exists(fish.id)) {
            const ctx = fishImage.getContext('2d');
            if (ctx) {
                const frame = this.textures.getFrame(fish.id);
                const maxSize = 80;
                const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
                const width = frame.width * scale;
                const height = frame.height * scale;
                
                ctx.clearRect(0, 0, 80, 80);
                const sourceImage = frame.source.image as HTMLImageElement;
                if (sourceImage) {
                    this.drawFishImageWithOutline(ctx, sourceImage, frame,
                        (80 - width) / 2, (80 - height) / 2, width, height, 3, '#ffffff');
                }
            }
            fishImage.style.display = 'block';
            emoji.style.display = 'none';
        } else {
            fishImage.style.display = 'none';
            emoji.textContent = fish.emoji;
            emoji.style.display = 'block';
        }

        nameText.textContent = fish.name;
        const starCount = rarityStarCount[fish.rarity];
        const colorHex = this.getRarityColorCssValue(fish.rarity);
        rarityText.innerHTML = '';
        rarityText.style.color = colorHex;
        for (let i = 0; i < 5; i++) {
          const star = document.createElement('span');
          star.className = 'star';
          star.textContent = '★';
          if (i >= starCount) {
            star.classList.add('star-inactive');
          }
          rarityText.appendChild(star);
        }
        descText.innerHTML = fish.description.replace(/\n/g, '<br>');
        // ゴミの場合は生息地を表示しない
        const isJunk = fish.id.startsWith('junk_');
        const habitatText = !isJunk ? (
          fish.habitat === Habitat.FRESHWATER ? '淡水' :
          fish.habitat === Habitat.SALTWATER ? '海水' :
          fish.habitat === Habitat.STREAM ? '渓流' : '不明'
        ) : '';
        const recordSize = this.playerData.fishSizes[fish.id];
        const recordText = recordSize ? `記録: ${recordSize}cm` : '記録: なし';
        // 生息地の行を条件付きで追加
        const habitatLine = habitatText ? `生息地: ${habitatText}<br>` : '';
        priceText.innerHTML = `${recordText}<br>${habitatLine}💰 売値: ${fish.price}G`;
    } else {
        fishImage.style.display = 'none';
        emoji.textContent = '?';
        emoji.style.display = 'block';
        nameText.textContent = '？？？';
        const starCount = rarityStarCount[fish.rarity];
        rarityText.innerHTML = '';
        // 未捕獲時もレアリティトークンの色を使用
        rarityText.style.color = this.getRarityColorCssValue(fish.rarity);
        for (let i = 0; i < 5; i++) {
          const star = document.createElement('span');
          star.className = 'star';
          star.textContent = '★';
          if (i >= starCount) {
            star.classList.add('star-inactive');
          }
          rarityText.appendChild(star);
        }
        descText.innerHTML = 'まだ発見されていません...<br>この魚を釣って図鑑を完成させよう！';
        priceText.textContent = '';
    }

    this.openModal(this.MODAL_IDS.BOOK_DETAIL);
    // モーダル位置を更新
    this.updateModalPositionsIfNeeded();
  }

  closeBookDetail() {
    this.bookDetailOpen = false;
    if (this.bookDetailElement) {
      this.closeModal(this.MODAL_IDS.BOOK_DETAIL);
    }
  }

  handleBookNavigation() {
    if (!this.bookOpen || this.bookDetailOpen) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.down)
    ) {
      this.noteUiMenuKeyboardNavigation();
    }

    const gridCols = 4;
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const startIndex = this.bookPage * slotsPerPage;
    const visibleCount = Math.min(slotsPerPage, fishList.length - startIndex);
    
    let newIndex = this.bookSelectedIndex;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        if (this.bookSelectedIndex % gridCols > 0) newIndex--;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        if (this.bookSelectedIndex % gridCols < gridCols - 1 && this.bookSelectedIndex + 1 < visibleCount) {
            newIndex++;
        }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        if (this.bookSelectedIndex >= gridCols) newIndex -= gridCols;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        if (this.bookSelectedIndex + gridCols < visibleCount) newIndex += gridCols;
    }

    if (newIndex !== this.bookSelectedIndex && newIndex < visibleCount) {
        this.bookSelectedIndex = newIndex;
        this.updateBookSelection();
    }
  }

  // ============================================
  // ショップUI
  // ============================================

  createShopUI() {
    // HTML/CSSでショップUIを作成
    const shopHTML = `
      <div id="shop-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content shop-modal nes-container with-rounded ui-frame-box">
          <div class="modal-header shop-modal-header-row book-list-header">Shop</div>
          <div class="shop-controls-row">
            <div class="shop-tabs">
              <button class="shop-tab shop-tab-button nes-btn ui-frame-box" data-tab="rod">釣り竿</button>
              <button class="shop-tab shop-tab-button nes-btn ui-frame-box" data-tab="bait">エサ</button>
              <button class="shop-tab shop-tab-button nes-btn ui-frame-box" data-tab="lure">ルアー</button>
              <button class="shop-tab shop-tab-button nes-btn ui-frame-box" data-tab="inventory">どうぐ</button>
            </div>
            <div id="shop-money" class="shop-money ui-frame-box"></div>
          </div>
          <div class="shop-items-scroll-wrap" id="shop-items-scroll-wrap">
            <div class="shop-items-scroll-fade shop-items-scroll-fade--top" id="shop-items-scroll-fade-top" aria-hidden="true"></div>
            <div id="shop-items-list" class="shop-items-list"></div>
            <div class="shop-items-scroll-fade shop-items-scroll-fade--bottom" id="shop-items-scroll-fade-bottom" aria-hidden="true"></div>
          </div>
          <div class="modal-footer"></div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = shopHTML;
    this.shopUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.shopUIElement);

    this.shopUIElement.addEventListener('pointerdown', (e) => {
      if (!this.shopOpen) return;
      const panel = this.shopUIElement.querySelector('.modal-content');
      if (panel && !panel.contains(e.target as Node)) {
        this.closeShop();
      }
    });

    // ショップの要素をキャッシュ
    this.shopItemsScrollWrapElement = this.shopUIElement.querySelector('#shop-items-scroll-wrap') as HTMLElement;
    this.shopItemsScrollFadeTopElement = this.shopUIElement.querySelector('#shop-items-scroll-fade-top') as HTMLElement;
    this.shopItemsScrollFadeBottomElement = this.shopUIElement.querySelector('#shop-items-scroll-fade-bottom') as HTMLElement;
    this.shopItemsListElement = this.shopUIElement.querySelector('#shop-items-list') as HTMLElement;
    this.shopMoneyElement = this.shopUIElement.querySelector('#shop-money') as HTMLElement;
    this.setupShopItemsScrollFade();

    // タブボタンのイベント
    const tabButtons = this.shopUIElement.querySelectorAll('.shop-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as 'rod' | 'bait' | 'lure' | 'inventory';
        this.shopNavArea = 'tabs';
        this.switchShopTab(tab);
      });
    });
  }

  // ============================================
  // 実績UI
  // ============================================

  createAchievementUI() {
    // 実績モーダル
    const achievementHTML = `
      <div id="achievement-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content achievement-modal nes-container with-rounded ui-frame-box" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
          <div class="modal-header">
            <h2>🏆 実績一覧</h2>
            <button class="modal-close ui-frame-box" id="achievement-close">×</button>
          </div>
          <div class="achievement-tabs">
            <button class="achievement-tab nes-btn ui-frame-box" data-category="catch">🎣 釣果</button>
            <button class="achievement-tab nes-btn ui-frame-box" data-category="rarity">⭐ レア度</button>
            <button class="achievement-tab nes-btn ui-frame-box" data-category="collection">📖 図鑑</button>
            <button class="achievement-tab nes-btn ui-frame-box" data-category="level">⭐ レベル</button>
            <button class="achievement-tab nes-btn ui-frame-box" data-category="money">💰 経済</button>
            <button class="achievement-tab nes-btn ui-frame-box" data-category="equipment">⚔️ 装備</button>
            <button class="achievement-tab nes-btn ui-frame-box" data-category="special">✨ 特殊</button>
          </div>
          <div id="achievement-list" class="achievement-list"></div>
          <div class="modal-footer">
            <div class="hint-text">ESC: 閉じる</div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = achievementHTML;
    this.achievementUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.achievementUIElement);

    // 実績通知
    const notificationHTML = `
      <div id="achievement-notification" style="display: none; position: fixed; top: 20px; right: 20px; z-index: 2000; background: rgba(0,0,0,0.9); border: 2px solid #ffd700; border-radius: 10px; padding: 15px; max-width: 300px; color: #fff; pointer-events: none;">
        <div style="font-size: 24px; margin-bottom: 10px;">🏆 実績解除！</div>
        <div id="achievement-notification-name" style="font-size: 18px; font-weight: bold; margin-bottom: 5px;"></div>
        <div id="achievement-notification-desc" style="font-size: 14px; margin-bottom: 10px;"></div>
        <div id="achievement-notification-reward" style="font-size: 12px; color: #ffd700;"></div>
      </div>
    `;

    const notificationDiv = document.createElement('div');
    notificationDiv.innerHTML = notificationHTML;
    this.achievementNotificationElement = notificationDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.achievementNotificationElement);


    // 閉じるボタン
    const closeButton = this.achievementUIElement.querySelector('#achievement-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeAchievementModal();
      });
    }

    // タブボタンのイベント
    const tabButtons = this.achievementUIElement.querySelectorAll('.achievement-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category') as string;
        this.updateAchievementList(category);
        // アクティブタブを更新（Book/Shopと同じactiveクラス運用に統一）
        tabButtons.forEach(b => {
          b.classList.remove('is-primary');
          b.classList.remove('active');
        });
        btn.classList.add('is-primary');
        btn.classList.add('active');
      });
    });

    // 初期表示（最初のタブ）
    if (tabButtons.length > 0) {
      (tabButtons[0] as HTMLElement).click();
    }
  }

  // --- バランス調整UI（デバッグ用） ---

  createBalanceDebugUI() {
    if (this.balanceDebugPanel?.element) return;

    this.balanceDebugPanel = createBalanceDebugPanel({
      getPlayerData: () => this.playerData,
      getEquippedRodId: () => this.playerData.equippedRodId,
      onPlayerDataChanged: () => {
        this.lastLevel = -1;
        this.lastExpProgress = -1;
        this.updateStatusUI();
        if (this.skillUnlockConfirmPendingNodeId) {
          this.closeSkillUnlockConfirm();
        }
        if (this.unifiedBookOpen && this.unifiedBookUIElement) {
          if (this.unifiedBookTab === 'status') {
            const sp = this.unifiedBookUIElement.querySelector('#book-status-panel') as HTMLElement | null;
            if (sp && sp.style.display !== 'none') {
              this.fillBookStatusPanel(sp);
            }
          } else if (this.unifiedBookTab === 'skills') {
            this.renderSkillBookPanel();
          }
        }
      },
      onRequestClose: () => this.closeBalanceDebug(),
      savePlayerData: () => savePlayerData(this.playerData),
    });
  }

  openBalanceDebug() {
    if (!this.balanceDebugPanel?.element) {
      this.createBalanceDebugUI();
    }
    this.balanceDebugPanel.refresh();
    document.body.classList.add('balance-debug-open');
    this.openModal(this.MODAL_IDS.BALANCE_DEBUG);
    this.balanceDebugPanel.startFightPreview();
  }

  closeBalanceDebug() {
    if (!this.balanceDebugPanel?.element) return;
    this.balanceDebugPanel.stopFightPreview();
    document.body.classList.remove('balance-debug-open');
    this.closeModal(this.MODAL_IDS.BALANCE_DEBUG);
  }

  // --- キャラクター設定UI（デバッグ用） ---

  createCharacterSettingsUI() {
    if (this.characterSettingsElement) return;

    const currentId = this.getSelectedCharacterId();
    const currentName = this.getSelectedPlayerName();
    const currentColor = this.getSelectedColor();
    this.characterColorTemp = currentColor;

    const colorButtonsHTML = this.CHARACTER_COLORS.map(c => `
                <button type="button"
                        class="character-color-item nes-btn ${currentColor === c.value ? 'is-primary' : ''}"
                        data-color="${c.value}"
                        style="background:${c.value};">
                  ${c.label ?? ''}
                </button>
    `).join('');

    const html = `
      <div id="character-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content character-modal nes-container with-rounded ui-frame-box" style="max-width: 520px;">
          <div class="modal-header">
            <h2>キャラクター設定（デバッグ）</h2>
            <button class="modal-close ui-frame-box" id="character-settings-close">×</button>
          </div>
          <div class="modal-body">
            <div class="character-preview-wrap">
              <canvas id="character-preview-canvas" width="96" height="96" class="character-preview-canvas"></canvas>
            </div>
            <fieldset class="character-settings__field">
              <legend>キャラカラー</legend>
              <div class="character-color-list">
                ${colorButtonsHTML}
              </div>
            </fieldset>
            <label class="character-settings__field">
              <span>ユーザー名（半角英数字のみ）</span>
              <input
                type="text"
                id="character-name-input"
                class="nes-input"
                maxlength="16"
                value="${currentName}"
                autocomplete="off"
              />
            </label>
            <fieldset class="character-settings__field">
              <legend>キャラクター画像</legend>
              <div class="character-thumb-list">
                ${characterConfigs
                  .map(
                    (ch) => `
                <button type="button" class="character-thumb-item nes-btn ${
                  currentId === ch.id ? 'is-primary' : ''
                }" data-id="${ch.id}">
                  <div class="character-thumb-frame">
                    <img src="/${ch.sheetPath}" alt="${ch.label}" />
                  </div>
                  <div class="character-thumb-label">${ch.label}</div>
                </button>`
                  )
                  .join('')}
              </div>
            </fieldset>
            <p class="character-settings__note">
              ※ キャラ画像の変更は「保存」後にページを再読み込みすると反映されます。
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" id="character-settings-save" class="nes-btn is-primary">保存</button>
            <button type="button" id="character-settings-cancel" class="nes-btn">閉じる</button>
          </div>
        </div>
      </div>
    `;

    const temp = document.createElement('div');
    temp.innerHTML = html;
    this.characterSettingsElement = temp.firstElementChild as HTMLElement;
    document.body.appendChild(this.characterSettingsElement);

    const nameInput = document.getElementById('character-name-input') as HTMLInputElement | null;
    const saveBtn = document.getElementById('character-settings-save');
    const closeBtn = document.getElementById('character-settings-close');
    const cancelBtn = document.getElementById('character-settings-cancel');
    const thumbButtons = Array.from(
      this.characterSettingsElement.querySelectorAll<HTMLButtonElement>('.character-thumb-item')
    );
    const colorButtons = Array.from(
      this.characterSettingsElement.querySelectorAll<HTMLButtonElement>('.character-color-item')
    );

    // ユーザー名: 半角英数字のみ許可
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        const raw = nameInput.value;
        const sanitized = raw.replace(/[^0-9a-zA-Z]/g, '');
        if (raw !== sanitized) {
          nameInput.value = sanitized;
        }
      });
    }

    // サムネイル選択（ボタンの見た目だけ切り替え + プレビュー更新）
    thumbButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        thumbButtons.forEach(b => b.classList.remove('is-primary'));
        btn.classList.add('is-primary');
        const id = btn.getAttribute('data-id');
        if (id) this.startCharacterPreview(id, this.characterColorTemp);
      });
    });

    // カラー選択（ボタンの見た目 + 一時色 + プレビュー更新）
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        colorButtons.forEach(b => b.classList.remove('is-primary'));
        btn.classList.add('is-primary');
        this.characterColorTemp = btn.getAttribute('data-color') ?? '#ffffff';

        const selectedBtn =
          thumbButtons.find(b => b.classList.contains('is-primary')) ?? thumbButtons[0] ?? null;
        const selectedId = selectedBtn?.getAttribute('data-id') ?? getDefaultCharacterId();
        this.startCharacterPreview(selectedId, this.characterColorTemp);
      });
    });

    saveBtn?.addEventListener('click', () => {
      const selectedBtn =
        thumbButtons.find(b => b.classList.contains('is-primary')) ?? thumbButtons[0] ?? null;
      const selectedId = selectedBtn?.getAttribute('data-id') ?? getDefaultCharacterId();

      const name = nameInput?.value ?? '';
      this.saveCharacterSettings(selectedId, name, this.characterColorTemp);
      this.renderStatusCharacterIcon(selectedId, this.characterColorTemp);
      this.updateStatusUI();
      alert('設定を保存しました。\nキャラクター画像の変更を反映するにはページを再読み込みしてください。');
    });

    const handleClose = () => this.closeCharacterSettings();
    closeBtn?.addEventListener('click', handleClose);
    cancelBtn?.addEventListener('click', handleClose);

    // サムネイル：スプライトシートの1コマ目（24x24）だけ表示するよう拡大してクリップ
    const frameSize = 24;
    const thumbSize = 48;
    const scale = thumbSize / frameSize;
    this.characterSettingsElement.querySelectorAll<HTMLImageElement>('.character-thumb-frame img').forEach(img => {
      const applyClip = () => {
        img.style.width = `${img.naturalWidth * scale}px`;
        img.style.height = `${img.naturalHeight * scale}px`;
      };
      if (img.complete) applyClip();
      else img.addEventListener('load', applyClip);
    });
  }

  private stopCharacterPreview() {
    if (this.characterPreviewIntervalId != null) {
      clearInterval(this.characterPreviewIntervalId);
      this.characterPreviewIntervalId = null;
    }
  }

  private startCharacterPreview(characterId: string, colorHex?: string) {
    const canvas = this.characterSettingsElement?.querySelector('#character-preview-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    this.stopCharacterPreview();

    const character = getCharacterById(characterId);
    if (!character) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameSize = 24;
    const scale = 4;
    const displaySize = frameSize * scale; // 96
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/' + character.sheetPath;

    img.onload = () => {
      const tintColor = (colorHex ?? this.characterColorTemp ?? this.getSelectedColor()).toLowerCase();
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displaySize, displaySize);

      // レベルアイコンと同じく、1コマ目の静止画像を描画
      const sx = 0;
      const sy = 0;
      ctx.drawImage(img, sx, sy, frameSize, frameSize, 0, 0, displaySize, displaySize);

      // Phaser の setTint に近い挙動: 各ピクセルに乗算
      if (tintColor && tintColor !== '#ffffff') {
        const m = tintColor.match(/^#([0-9a-f]{6})$/);
        if (m) {
          const tint = parseInt(m[1], 16);
          const tr = (tint >> 16) & 0xff;
          const tg = (tint >> 8) & 0xff;
          const tb = tint & 0xff;
          const rf = tr / 255;
          const gf = tg / 255;
          const bf = tb / 255;

          const imageData = ctx.getImageData(0, 0, displaySize, displaySize);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha === 0) continue; // 完全透明は無視
            data[i] = data[i] * rf;
            data[i + 1] = data[i + 1] * gf;
            data[i + 2] = data[i + 2] * bf;
          }
          ctx.putImageData(imageData, 0, 0);
        }
      }
    };
  }

  openCharacterSettings() {
    if (!this.characterSettingsElement) return;
    this.openModal(this.MODAL_IDS.CHARACTER);
    this.characterColorTemp = this.getSelectedColor();
    this.startCharacterPreview(this.getSelectedCharacterId(), this.characterColorTemp);
  }

  closeCharacterSettings() {
    if (!this.characterSettingsElement) return;
    this.stopCharacterPreview();
    this.closeModal(this.MODAL_IDS.CHARACTER);
  }

  openAchievementModal() {
    if (this.achievementOpen) return;
    this.achievementOpen = true;
    this.achievementUIElement.style.display = 'block';
    this.achievementUIElement.setAttribute('aria-hidden', 'false');
    this.updateModalStates();
  }

  closeAchievementModal() {
    if (!this.achievementOpen) return;
    this.achievementOpen = false;
    this.achievementUIElement.style.display = 'none';
    this.achievementUIElement.setAttribute('aria-hidden', 'true');
    this.updateModalStates();
  }

  updateAchievementList(category: string) {
    const listElement = this.achievementUIElement.querySelector('#achievement-list') as HTMLElement;
    if (!listElement) return;

    const achievements = getAchievementsByCategory(category);
    listElement.innerHTML = '';

    achievements.forEach((achievement) => {
      const isUnlocked = this.playerData.achievements.has(achievement.id);
      const itemHTML = `
        <div class="achievement-item ui-frame-box ${isUnlocked ? 'unlocked' : 'locked'}">
          ${this.buildAchievementCardHTML(achievement, isUnlocked)}
        </div>
      `;

      const itemDiv = document.createElement('div');
      itemDiv.innerHTML = itemHTML;
      listElement.appendChild(itemDiv.firstElementChild as HTMLElement);
    });
  }

  showAchievementNotification(achievement: AchievementConfig) {
    const notification = this.achievementNotificationElement;
    const nameEl = notification.querySelector('#achievement-notification-name') as HTMLElement;
    const descEl = notification.querySelector('#achievement-notification-desc') as HTMLElement;
    const rewardEl = notification.querySelector('#achievement-notification-reward') as HTMLElement;

    if (nameEl) nameEl.textContent = `${displayAchievementEmoji(achievement.emoji)} ${achievement.name}`;
    if (descEl) descEl.textContent = achievement.description;
    
    if (achievement.reward) {
      const rewards: string[] = [];
      if (achievement.reward.money) rewards.push(`💰 ${achievement.reward.money}G`);
      if (achievement.reward.exp) rewards.push(`⭐ ${achievement.reward.exp}EXP`);
      if (rewardEl) rewardEl.textContent = rewards.length > 0 ? `報酬: ${rewards.join(' ')}` : '';
    } else {
      if (rewardEl) rewardEl.textContent = '';
    }

    notification.style.display = 'block';
    
    // 3秒後に自動で非表示
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  toggleShop() {
    if (this.shopOpen) {
      this.closeShop();
    } else {
      this.openShop();
    }
  }

  openShop() {
    // 他のUIを閉じる
    if (this.unifiedBookOpen) this.closeUnifiedBook();
    // 既存のモーダルは統合BookUIに置き換えられたため、ここでは閉じない
    // if (this.inventoryOpen) this.closeInventory();
    // if (this.bookOpen) this.closeBook();
    
    this.shopOpen = true;
    this.shopSelectedIndex = -1;
    this.shopTab = 'rod';
    this.shopNavArea = 'tabs';
    this.updateShopContent({ snapMoney: true });
    this.updateShopTabs();
    if (this.shopUIElement) {
      this.openModal(this.MODAL_IDS.SHOP);
      // モーダル位置を更新
      this.updateModalPositionsIfNeeded();
    }
  }

  closeShop() {
    this.shopOpen = false;
    if (this.shopUIElement) {
      this.closeModal(this.MODAL_IDS.SHOP);
    }
  }

  updateShopTabs() {
    if (!this.shopUIElement) return;
    const tabButtons = this.shopUIElement.querySelectorAll('.shop-tab');
    tabButtons.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === this.shopTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      btn.classList.remove('is-nav-selected');
    });
    if (this.shopNavArea === 'tabs' && this.uiMenuNavInputChannel === 'keyboard') {
      const activeTab = this.shopUIElement.querySelector(`.shop-tab[data-tab="${this.shopTab}"]`) as HTMLElement | null;
      if (activeTab) activeTab.classList.add('is-nav-selected');
    }
  }

  /** ショップタブ切替（内容更新 + 切替時のみフェード） */
  private switchShopTab(tab: 'rod' | 'bait' | 'lure' | 'inventory') {
    const prevTab = this.shopTab;
    this.shopTab = tab;
    this.shopSelectedIndex = -1;
    this.updateShopContent();
    this.updateShopTabs();
    if (prevTab !== tab) {
      this.playShopTabContentFade();
    }
  }

  /** ショップタブ切替: 商品一覧を不透明度だけでイージング出現 */
  private playShopTabContentFade() {
    const wrap = this.shopItemsScrollWrapElement;
    if (!wrap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    wrap.classList.add('is-tab-content-hidden');
    void wrap.offsetWidth;
    requestAnimationFrame(() => {
      wrap.classList.remove('is-tab-content-hidden');
    });
  }

  updateShopContent(opts?: { snapMoney?: boolean }) {
    if (!this.shopUIElement || !this.shopItemsListElement) return;
    
    // 既存のアイテム要素を削除（innerHTMLを使わずに）
    while (this.shopItemsListElement.firstChild) {
      this.shopItemsListElement.removeChild(this.shopItemsListElement.firstChild);
    }
    
    // アイテム要素のキャッシュをクリア
    this.shopItemElements = [];
    this.lastSelectedShopIndex = -1;
    
    let items: {
      id: string;
      name: string;
      icon: string;
      price: number;
      info: string;
      owned: boolean;
      equipped: boolean;
      /** エサ/どうぐ消費: 1回の購入で入る個数（表示用） */
      packQuantity?: number;
      locked?: boolean;
    }[] = [];

    if (this.shopTab === 'rod') {
      items = rodConfigs.map(rod => ({
        id: rod.id,
        name: rod.name,
        icon: rod.icon,
        price: rod.price,
        info: `P:+${Math.round(rod.powerStatAdd * 100)} S:+${Math.round(rod.speedStatAdd * 100)} T:+${Math.round(rod.techniqueStatAdd * 100)} C:+${Math.round(rod.controlStatAdd * 100)} R/E/L:+${Math.round(rod.rarityHitRateAdd.rare * 100)}/+${Math.round(rod.rarityHitRateAdd.epic * 100)}/+${Math.round(rod.rarityHitRateAdd.legendary * 100)}`,
        owned: this.hasRod(rod.id),
        equipped: this.playerData.equippedRodId === rod.id,
      }));
    } else if (this.shopTab === 'bait') {
      items = baitConfigs.map(bait => ({
        id: bait.id,
        name: bait.name,
        packQuantity: bait.quantity,
        icon: bait.icon,
        price: bait.price,
        info: `所持: ${getBaitCount(this.playerData, bait.id)}個 [消費]`,
        owned: false,  // エサは何度でも購入可能
        equipped: this.playerData.equippedBaitId === bait.id,
      }));
    } else if (this.shopTab === 'lure') {
      items = lureConfigs.map(lure => ({
        id: lure.id,
        name: lure.name,
        icon: lure.icon,
        price: lure.price,
        info: `RARE+${Math.round((lure.rareBonus - 1) * 100)}% [永続]`,
        owned: this.playerData.ownedLures.includes(lure.id),
        equipped: this.playerData.equippedLureId === lure.id,
      }));
    } else if (this.shopTab === 'inventory') {
      const bagItems = inventoryUpgradeConfigs.map(inv => ({
        id: inv.id,
        name: inv.name,
        icon: inv.icon,
        price: inv.price,
        info: `${inv.slotCount}スロット`,
        owned: this.playerData.maxInventorySlots >= inv.slotCount,
        equipped: this.playerData.maxInventorySlots === inv.slotCount,
        packQuantity: undefined as number | undefined,
        locked: false,
      }));
      const toolItems = toolConfigs.map(tool => {
        const foodTier = getAquariumFoodTierByToolId(tool.id);
        const ownedCount = foodTier ? getAquariumFoodCount(this.playerData, foodTier.tier) : 0;
        return {
          id: tool.id,
          name: tool.name,
          icon: tool.icon,
          price: tool.price,
          packQuantity: tool.consumable ? tool.quantity : undefined,
          info: tool.consumable
            ? `所持: ${ownedCount}個 [消費]`
            : tool.description,
          owned: !tool.consumable && this.playerData.ownedTools.includes(tool.id),
          equipped: false,
          locked: !!tool.requiresToolId && !this.playerData.ownedTools.includes(tool.requiresToolId),
        };
      });
      items = [...toolItems, ...bagItems];
    }

    items.forEach((item, index) => {
      const canAfford = this.playerData.money >= item.price;
      const priceValue = item.price.toLocaleString();
      let buttonText = '購入する';
      let buttonStateClass = '';

      if ('locked' in item && item.locked) {
        buttonText = '要: アクアリウム';
        buttonStateClass = 'is-disabled';
      } else if (item.owned && this.shopTab !== 'bait') {
        buttonText = '購入済み';
        buttonStateClass = 'is-owned';
      } else if (!canAfford && item.price > 0) {
        buttonStateClass = 'is-disabled';
      }

      const statChips: { label: string; value: string }[] = [];
      let noteText = item.info;

      if (this.shopTab === 'rod') {
        const rod = rodConfigs[index];
        if (rod) {
          statChips.push(
            { label: 'POWER', value: `+${Math.round(rod.powerStatAdd * 100)}` },
            { label: 'SPEED', value: `+${Math.round(rod.speedStatAdd * 100)}` },
            { label: 'CONTROL', value: `+${Math.round(rod.controlStatAdd * 100)}` },
            { label: 'TECH', value: `+${Math.round(rod.techniqueStatAdd * 100)}` }
          );
          noteText = rod.description;
        }
      } else if (this.shopTab === 'bait') {
        const bait = baitConfigs[index];
        if (bait) {
          statChips.push(...this.getShopEquipRarityRateChips('bait', bait.id));
          noteText = bait.description;
        }
      } else if (this.shopTab === 'lure') {
        const lure = lureConfigs[index];
        if (lure) {
          statChips.push(...this.getShopEquipRarityRateChips('lure', lure.id));
          noteText = lure.description;
        }
      } else {
        // inventory タブ: どうぐ → バッグ の順
        if (index < toolConfigs.length) {
          const tool = toolConfigs[index];
          if (tool) {
            noteText = tool.description;
            if (tool.consumable) {
              const foodTier = getAquariumFoodTierByToolId(tool.id);
              const ownedCount = foodTier ? getAquariumFoodCount(this.playerData, foodTier.tier) : 0;
              const chips: { label: string; value: string }[] = [
                { label: 'TYPE', value: 'FOOD' },
                { label: 'STOCK', value: String(ownedCount) },
              ];
              if (foodTier) {
                chips.push(
                  { label: 'GROW', value: `+${foodTier.feedGain}` },
                  { label: 'FULL', value: `${foodTier.satietyMs / 1000}s` },
                );
              }
              statChips.push(...chips);
            } else {
              statChips.push({ label: 'TYPE', value: 'TOOL' });
            }
          }
        } else {
          const inv = inventoryUpgradeConfigs[index - toolConfigs.length];
          if (inv) {
            const currentSlots = this.playerData.maxInventorySlots;
            statChips.push(
              { label: '現在', value: `${currentSlots}枠` },
              { label: '拡張後', value: `${inv.slotCount}枠` },
              { label: '増加', value: `+${Math.max(inv.slotCount - currentSlots, 0)}` },
              { label: '分類', value: 'バッグ' }
            );
            noteText = inv.description;
          }
        }
      }

      const itemEl = document.createElement('div');
      itemEl.className = 'shop-item book-ui-row';
      if (item.owned && this.shopTab !== 'bait') {
        itemEl.classList.add('is-owned');
      }
      itemEl.setAttribute('data-index', index.toString());

      const contentWrap = document.createElement('div');
      contentWrap.className = 'shop-item-content ui-frame-box book-ui-node';

      const iconContainer = document.createElement('div');
      iconContainer.className = 'shop-item-icon';
      if (this.textures.exists(item.id)) {
        const canvas = document.createElement('canvas');
        canvas.className = 'shop-item-icon-image';
        canvas.width = 64;
        canvas.height = 64;
        canvas.setAttribute('data-item-id', item.id);
        iconContainer.appendChild(canvas);
      } else {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'shop-item-icon-emoji';
        emojiSpan.textContent = item.icon;
        iconContainer.appendChild(emojiSpan);
      }

      const infoContainer = document.createElement('div');
      infoContainer.className = 'shop-item-info';

      const topRow = document.createElement('div');
      topRow.className = 'shop-item-top-row';

      const titleGroup = document.createElement('div');
      titleGroup.className = 'shop-item-title-group';

      const nameEl = document.createElement('div');
      nameEl.className = 'shop-item-name';
      if ((this.shopTab === 'bait' || item.packQuantity != null) && item.packQuantity != null) {
        nameEl.appendChild(document.createTextNode(item.name));
        const qtyEl = document.createElement('span');
        qtyEl.className = 'shop-item-name-qty';
        qtyEl.textContent = `×${item.packQuantity}`;
        nameEl.appendChild(qtyEl);
      } else {
        nameEl.textContent = item.name;
      }

      const actionWrap = document.createElement('div');
      actionWrap.className = 'shop-item-action';

      const priceGroup = document.createElement('div');
      priceGroup.className = 'shop-item-price-group';

      const priceValueEl = document.createElement('span');
      priceValueEl.className = 'shop-item-price-value';
      priceValueEl.textContent = priceValue;
      if (!canAfford && item.price > 0) {
        priceValueEl.classList.add('is-insufficient');
      }

      const priceUnitEl = document.createElement('span');
      priceUnitEl.className = 'shop-item-price-unit';
      priceUnitEl.textContent = 'G';

      const actionButtonEl = document.createElement('button');
      actionButtonEl.type = 'button';
      actionButtonEl.className = `shop-item-action-button nes-btn ui-frame-box ${buttonStateClass}`.trim();
      actionButtonEl.textContent = buttonText;
      if (buttonStateClass === 'is-owned' || buttonStateClass === 'is-disabled') {
        actionButtonEl.disabled = true;
      }

      priceGroup.appendChild(priceValueEl);
      priceGroup.appendChild(priceUnitEl);
      actionWrap.appendChild(priceGroup);
      actionWrap.appendChild(actionButtonEl);
      titleGroup.appendChild(iconContainer);
      titleGroup.appendChild(nameEl);
      topRow.appendChild(titleGroup);
      topRow.appendChild(actionWrap);

      const showStatRow =
        this.shopTab !== 'inventory' || index < toolConfigs.length;
      const statRow = document.createElement('div');
      statRow.className = 'shop-item-stat-row';
      statChips.forEach((chip) => {
        const chipEl = document.createElement('div');
        chipEl.className = 'shop-item-stat-chip';
        const chipLabelEl = document.createElement('span');
        chipLabelEl.className = 'shop-item-stat-chip-label';
        chipLabelEl.textContent = chip.label;
        const chipValueEl = document.createElement('span');
        chipValueEl.className = 'shop-item-stat-chip-value';
        const v = chip.value;
        // 日本語テキスト（どうぐ/消費など）はラベル相当サイズに落とす
        const isJaText = /[\u3040-\u30ff\u3400-\u9fff]/.test(v) && !/[0-9%+]/.test(v);
        if (isJaText) {
          chipValueEl.classList.add('is-ja-text');
        }
        if (v.includes('%')) {
          const i = v.lastIndexOf('%');
          const numPart = v.slice(0, i);
          const rest = v.slice(i + 1);
          chipValueEl.appendChild(document.createTextNode(numPart));
          const pctEl = document.createElement('span');
          pctEl.className = 'shop-item-stat-chip-percent';
          pctEl.textContent = '%';
          chipValueEl.appendChild(pctEl);
          if (rest) chipValueEl.appendChild(document.createTextNode(rest));
        } else {
          chipValueEl.textContent = v;
        }
        chipEl.appendChild(chipLabelEl);
        chipEl.appendChild(chipValueEl);
        statRow.appendChild(chipEl);
      });

      const noteRow = document.createElement('div');
      noteRow.className = 'shop-item-note';
      const noteLabelEl = document.createElement('span');
      noteLabelEl.className = 'shop-item-note-label';
      noteLabelEl.textContent = 'Note';
      const noteTextEl = document.createElement('span');
      noteTextEl.className = 'shop-item-note-text';
      noteTextEl.textContent = noteText;
      noteRow.appendChild(noteLabelEl);
      noteRow.appendChild(noteTextEl);

      infoContainer.appendChild(topRow);
      if (showStatRow) {
        infoContainer.appendChild(statRow);
      }
      infoContainer.appendChild(noteRow);
      contentWrap.appendChild(infoContainer);
      itemEl.appendChild(contentWrap);

      this.shopItemsListElement.appendChild(itemEl);
    });

    // アイテム要素をキャッシュしてイベントリスナーを追加
    const itemElements = Array.from(this.shopItemsListElement.querySelectorAll('.shop-item')) as HTMLElement[];
    this.shopItemElements = itemElements;
    
    itemElements.forEach((itemEl, index) => {
      itemEl.addEventListener('click', () => {
        this.shopNavArea = 'items';
        this.shopSelectedIndex = index;
        this.updateShopSelection();
        this.updateShopTabs();
      });
      const actionBtn = itemEl.querySelector('.shop-item-action-button') as HTMLButtonElement | null;
      actionBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = items[index];
        this.shopNavArea = 'items';
        this.shopSelectedIndex = index;
        this.updateShopSelection();
        this.updateShopTabs();
        if (item && item.owned && this.shopTab !== 'bait') return;
        this.purchaseOrEquipItem();
      });
      itemEl.addEventListener('mouseenter', () => {
        if (this.uiMenuNavInputChannel !== 'mouse') return;
        this.shopNavArea = 'items';
        this.shopSelectedIndex = index;
        this.updateShopSelection();
        this.updateShopTabs();
      });
      
      // 画像を描画（画像がある場合）
      const item = items[index];
      if (item && this.textures.exists(item.id)) {
        const canvas = itemEl.querySelector('.shop-item-icon-image') as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const frame = this.textures.getFrame(item.id);
            ctx.clearRect(0, 0, 64, 64);
            const sourceImage = frame.source.image as HTMLImageElement;
            if (sourceImage) {
              ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, 64, 64);
            }
          }
        }
      }
    });

    // 所持金を更新（構造は維持し、金額だけカウンター再生）
    if (this.shopMoneyElement) {
      const hadValue = Boolean(this.shopMoneyElement.querySelector('.shop-money-value'));
      if (!hadValue) {
        this.shopMoneyElement.innerHTML = `
        <span class="shop-money-label">所持金</span>
        <div class="shop-money-balance">
          <img src="/images/ui/ゴールド.png" alt="" aria-hidden="true" class="shop-money-icon-image" />
          <div class="shop-money-amount">
            <span class="shop-money-value">0</span>
            <span class="shop-money-unit">G</span>
          </div>
        </div>
      `;
      }
      this.shopMoneyDisplay.attach(this.shopMoneyElement, '.shop-money-value');
      this.shopMoneyDisplay.setMoney(this.playerData.money, !hadValue || !!opts?.snapMoney);
    }

    this.updateShopSelection();
    this.updateShopItemsScrollFade();
  }

  /** エサ／ルアーを装備したときの Catch Rates 差分（竿のみ比、ステータス画面と同じ計算） */
  private getShopEquipRarityRateChips(
    kind: 'bait' | 'lure',
    itemId: string,
  ): { label: string; value: string }[] {
    const baseline = this.calculateStatusRarityRateValues({ baitId: null, lureId: null });
    const preview =
      kind === 'bait'
        ? this.calculateStatusRarityRateValues({ baitId: itemId, lureId: null })
        : this.calculateStatusRarityRateValues({ lureId: itemId, baitId: null });
    const rows: Array<{ key: 'uncommon' | 'rare' | 'epic' | 'legendary'; label: string }> = [
      { key: 'uncommon', label: 'UNCOMMON' },
      { key: 'rare', label: 'RARE' },
      { key: 'epic', label: 'EPIC' },
      { key: 'legendary', label: 'LEGEND' },
    ];
    return rows.map(({ key, label }) => {
      const delta = Math.round(preview[key]) - Math.round(baseline[key]);
      return { label, value: delta > 0 ? `+${delta}%` : `${delta}%` };
    });
  }

  private setupShopItemsScrollFade() {
    const el = this.shopItemsListElement;
    if (!el || !this.shopItemsScrollFadeTopElement || !this.shopItemsScrollFadeBottomElement) return;

    const update = () => this.updateShopItemsScrollFade();
    el.addEventListener('scroll', update, { passive: true });

    this.shopItemsScrollFadeObserver = new ResizeObserver(update);
    this.shopItemsScrollFadeObserver.observe(el);
    const wrap = this.shopItemsScrollWrapElement;
    if (wrap) this.shopItemsScrollFadeObserver.observe(wrap);
  }

  private updateShopItemsScrollFade() {
    this.updateScrollFadeIndicators(
      this.shopItemsListElement,
      this.shopItemsScrollFadeTopElement,
      this.shopItemsScrollFadeBottomElement,
    );
  }

  private lastSelectedShopIndex: number = -1;
  private shopItemElements: HTMLElement[] = [];

  updateShopSelection() {
    if (!this.shopUIElement) return;
    
    // 前回と同じインデックスの場合はスキップ（最適化）
    if (this.shopSelectedIndex === this.lastSelectedShopIndex) {
      return;
    }
    
    // 前回選択されていた行・ノードからクラスを削除
    if (this.lastSelectedShopIndex >= 0 && this.shopItemElements[this.lastSelectedShopIndex]) {
      const prevRow = this.shopItemElements[this.lastSelectedShopIndex];
      prevRow.classList.remove('state-selected');
      prevRow.querySelector('.shop-item-content')?.classList.remove('is-selected');
    }

    // 選択された行・ノードにクラスを追加（Book UI と同型: 行 state-selected + ノード is-selected）
    if (this.shopSelectedIndex >= 0 && this.shopItemElements[this.shopSelectedIndex]) {
      const row = this.shopItemElements[this.shopSelectedIndex];
      row.classList.add('state-selected');
      row.querySelector('.shop-item-content')?.classList.add('is-selected');
      // キーボード移動時に選択中アイテムが常に見えるようにする
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    
    this.lastSelectedShopIndex = this.shopSelectedIndex;
    this.updateShopItemsScrollFade();
  }

  hasRod(rodId: string): boolean {
    // ownedRods配列に含まれているかチェック
    return this.playerData.ownedRods.includes(rodId);
  }

  purchaseOrEquipItem() {
    if (this.shopTab === 'rod') {
      this.handleRodPurchase();
    } else if (this.shopTab === 'bait') {
      this.handleBaitPurchase();
    } else if (this.shopTab === 'lure') {
      this.handleLurePurchase();
    } else if (this.shopTab === 'inventory') {
      this.handleInventoryUpgrade();
    }
  }

  handleRodPurchase() {
    const rod = rodConfigs[this.shopSelectedIndex];
    if (!rod) return;

    if (this.playerData.equippedRodId === rod.id) {
      // 既に装備中
      return;
    }

    if (this.hasRod(rod.id)) {
      // 所持している → 装備
      this.playerData.equippedRodId = rod.id;
      savePlayerData(this.playerData);
      this.updateShopContent();
      this.showResult(`${rod.name}を装備した！`, 1500);
    } else if (this.playerData.money >= rod.price) {
      // 購入
      this.playerData.money -= rod.price;
      // ownedRodsに追加（まだ含まれていない場合のみ）
      if (!this.playerData.ownedRods.includes(rod.id)) {
        this.playerData.ownedRods.push(rod.id);
      }
      this.playerData.equippedRodId = rod.id;
      
      // 実績チェック（装備系）
      const unlockedAchievements = checkAchievements(this.playerData, ['equipment']);
      unlockedAchievements.forEach(achievement => {
        this.showAchievementNotification(achievement);
      });
      
      savePlayerData(this.playerData);
      this.updateStatusUI();
      this.updateShopContent();
      this.showResult(`${rod.name}を購入！`, 1500);
    } else {
      this.showResult('お金が足りません...', 1500);
    }
  }

  handleBaitPurchase() {
    const bait = baitConfigs[this.shopSelectedIndex];
    if (!bait) return;

    if (this.playerData.money >= bait.price) {
      // 購入
      this.playerData.money -= bait.price;
      addBait(this.playerData, bait.id, bait.quantity);
      // 自動で装備
      this.playerData.equippedBaitId = bait.id;
      this.playerData.equippedLureId = null;
      
      // 実績チェック（装備系）
      const unlockedAchievements = checkAchievements(this.playerData, ['equipment']);
      unlockedAchievements.forEach(achievement => {
        this.showAchievementNotification(achievement);
      });
      
      savePlayerData(this.playerData);
      this.updateStatusUI();
      this.updateShopContent();
      this.showResult(`${bait.name}を${bait.quantity}個購入！`, 1500);
    } else {
      this.showResult('お金が足りません...', 1500);
    }
  }

  handleLurePurchase() {
    const lure = lureConfigs[this.shopSelectedIndex];
    if (!lure) return;

    if (this.playerData.equippedLureId === lure.id) {
      // 既に装備中 → 外す
      this.playerData.equippedLureId = null;
      savePlayerData(this.playerData);
      this.updateShopContent();
      this.showResult(`${lure.name}を外した`, 1500);
      return;
    }

    if (this.playerData.ownedLures.includes(lure.id)) {
      // 所持している → 装備
      this.playerData.equippedLureId = lure.id;
      this.playerData.equippedBaitId = null;
      savePlayerData(this.playerData);
      this.updateShopContent();
      this.showResult(`${lure.name}を装備した！`, 1500);
    } else if (this.playerData.money >= lure.price) {
      // 購入
      this.playerData.money -= lure.price;
      this.playerData.ownedLures.push(lure.id);
      this.playerData.equippedLureId = lure.id;
      this.playerData.equippedBaitId = null;
      
      // 実績チェック（装備系）
      const unlockedAchievements = checkAchievements(this.playerData, ['equipment']);
      unlockedAchievements.forEach(achievement => {
        this.showAchievementNotification(achievement);
      });
      
      savePlayerData(this.playerData);
      this.updateStatusUI();
      this.updateShopContent();
      this.showResult(`${lure.name}を購入！`, 1500);
    } else {
      this.showResult('お金が足りません...', 1500);
    }
  }

  handleInventoryUpgrade() {
    const idx = this.shopSelectedIndex;
    // inventory タブ: どうぐ → バッグ の順
    if (idx < toolConfigs.length) {
      const tool = toolConfigs[idx];
      if (!tool) return;
      this.handleToolPurchase(tool);
      return;
    }

    const upgrade = inventoryUpgradeConfigs[idx - toolConfigs.length];
    if (!upgrade) return;

    if (this.playerData.maxInventorySlots >= upgrade.slotCount) {
      // 既に所持
      return;
    }

    if (this.playerData.money >= upgrade.price) {
      // 購入
      this.playerData.money -= upgrade.price;
      this.playerData.maxInventorySlots = upgrade.slotCount;
      savePlayerData(this.playerData);
      this.updateStatusUI();
      this.updateShopContent();
      // インベントリが開いている場合はレイアウトを更新
      if (this.inventoryOpen) {
        this.updateInventoryLayout();
        this.updateInventorySlots();
      }
      this.showResult(`${upgrade.name}を購入！ ${upgrade.slotCount}スロットに拡張！`, 2000);
    } else {
      this.showResult('お金が足りません...', 1500);
    }
  }

  handleToolPurchase(tool: ToolConfig) {
    if (tool.requiresToolId && !this.playerData.ownedTools.includes(tool.requiresToolId)) {
      this.showResult('先にアクアリウムを購入しよう', 1500);
      return;
    }
    if (!tool.consumable && this.playerData.ownedTools.includes(tool.id)) {
      return;
    }
    if (this.playerData.money < tool.price) {
      this.showResult('お金が足りません...', 1500);
      return;
    }

    this.playerData.money -= tool.price;
    if (!tool.consumable) {
      if (!this.playerData.ownedTools.includes(tool.id)) {
        this.playerData.ownedTools.push(tool.id);
      }
      if (tool.id === 'tool_aquarium') {
        this.updateAquariumTabVisibility();
        this.showResult('アクアリウムを購入！ Bookに「Aquarium」タブが追加された！', 2500);
      } else {
        this.showResult(`${tool.name}を購入！`, 1500);
      }
    } else {
      const foodTier = getAquariumFoodTierByToolId(tool.id);
      if (foodTier) {
        addAquariumFoodCount(this.playerData, foodTier.tier, tool.quantity ?? 0);
      }
      this.showResult(`${tool.name}を${tool.quantity}個購入！`, 1500);
    }

    const unlockedAchievements = checkAchievements(this.playerData, ['equipment']);
    unlockedAchievements.forEach(achievement => {
      this.showAchievementNotification(achievement);
    });

    savePlayerData(this.playerData);
    this.updateStatusUI();
    this.updateShopContent();
  }

  handleShopNavigation() {
    const justUp = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const justDown = Phaser.Input.Keyboard.JustDown(this.cursors.down);
    const justLeft = Phaser.Input.Keyboard.JustDown(this.cursors.left);
    const justRight = Phaser.Input.Keyboard.JustDown(this.cursors.right);

    if (justUp || justDown || justLeft || justRight) {
      this.noteUiMenuKeyboardNavigation();
    }

    const tabOrder: Array<'rod' | 'bait' | 'lure' | 'inventory'> = ['rod', 'bait', 'lure', 'inventory'];
    const currentTabIndex = Math.max(0, tabOrder.indexOf(this.shopTab));

    if (this.shopNavArea === 'tabs') {
      let nextTabIndex = currentTabIndex;
      if (justLeft) nextTabIndex = (currentTabIndex - 1 + tabOrder.length) % tabOrder.length;
      if (justRight) nextTabIndex = (currentTabIndex + 1) % tabOrder.length;
      if (nextTabIndex !== currentTabIndex) {
        this.switchShopTab(tabOrder[nextTabIndex]);
      }
      if (justDown) {
        this.shopNavArea = 'items';
        if (this.shopSelectedIndex < 0 && this.shopItemElements.length > 0) {
          this.shopSelectedIndex = 0;
          this.updateShopSelection();
        }
      }
      this.updateShopTabs();
      return;
    }

    let itemCount = 0;
    if (this.shopTab === 'rod') itemCount = rodConfigs.length;
    else if (this.shopTab === 'bait') itemCount = baitConfigs.length;
    else if (this.shopTab === 'lure') itemCount = lureConfigs.length;
    else if (this.shopTab === 'inventory') itemCount = inventoryUpgradeConfigs.length + toolConfigs.length;

    let newIndex = this.shopSelectedIndex;

    if (justUp) {
        if (this.shopSelectedIndex > 0) {
          newIndex--;
        } else {
          this.shopNavArea = 'tabs';
          this.updateShopTabs();
          return;
        }
    } else if (justDown) {
        if (this.shopSelectedIndex < 0) newIndex = 0;
        else if (this.shopSelectedIndex < itemCount - 1) newIndex++;
    }

    if (newIndex !== this.shopSelectedIndex) {
        this.shopSelectedIndex = newIndex;
        this.updateShopSelection();
    }
    this.updateShopTabs();
  }
}

