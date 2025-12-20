import Phaser from 'phaser';
import { config } from '../config';
import type { FishConfig } from '../data/fishConfig';
import { getRandomFish, rarityStars, rarityColors, getRealFishCount, getFishById, fishDatabase, type RarityBonuses } from '../data/fish';
import type { PlayerData } from '../data/inventory';
import { loadPlayerData, savePlayerData, addFishToInventory, getInventoryCount, sellAllFish, addBait, consumeBait, getBaitCount, getExpProgress, getExpByRarity, addExp, getLevelBarRangeBonus, getLevelGaugeSpeedBonus } from '../data/inventory';
import { rodConfigs, baitConfigs, lureConfigs, inventoryUpgradeConfigs, getRodById, getBaitById, getLureById, getNextRod, getNextInventoryUpgrade } from '../data/shopConfig';

enum FishingState {
  IDLE,
  CASTING,
  WAITING,
  BITE,
  FIGHTING,
  SUCCESS,
  FAIL
}

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fishingRod!: Phaser.GameObjects.Line;
  private float!: Phaser.GameObjects.Arc;
  
  // プレイヤーの向き（'up', 'down', 'left', 'right'）
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'up';
  
  private state: FishingState = FishingState.IDLE;
  private biteTimer?: Phaser.Time.TimerEvent;
  private biteTimeout?: Phaser.Time.TimerEvent;
  private exclamation!: Phaser.GameObjects.Text;
  // 結果表示テキスト（HTML/CSS）
  private resultTextElement!: HTMLElement;
  private hintText!: Phaser.GameObjects.Text;

  // 投擲用
  private castPower: number = 0;
  private castDirection: number = 1;
  private powerBarBg!: Phaser.GameObjects.Rectangle;
  private powerBarFill!: Phaser.GameObjects.Rectangle;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // ファイトミニゲーム用
  private fightContainer!: Phaser.GameObjects.Container;
  private fishBarPosition: number = 0.5;
  private fishVelocity: number = 0;
  private fishTargetPosition: number = 0.5;
  private fishMoveTimer: number = 0;
  
  private playerBarPosition: number = 0.5;
  private playerBarVelocity: number = 0;
  private catchProgress: number = 0.3;

  private uiFish!: Phaser.GameObjects.Rectangle;
  private uiPlayerBar!: Phaser.GameObjects.Rectangle;
  private uiProgressBar!: Phaser.GameObjects.Rectangle;

  // 現在釣っている魚
  private currentFish: FishConfig | null = null;

  // プレイヤーデータ
  private playerData!: PlayerData;

  // ステータスUI（HTML/CSS）
  private statusUIElement!: HTMLElement;

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

  // ショップUI（HTML/CSS）
  private shopUIElement!: HTMLElement;
  private shopItemsListElement!: HTMLElement;
  private shopMoneyElement!: HTMLElement;
  private shopOpen: boolean = false;
  private shopSelectedIndex: number = 0;
  private shopTab: 'rod' | 'bait' | 'lure' | 'inventory' = 'rod';

  // 操作説明テキスト（HTML/CSS）
  private controlsTextElement!: HTMLElement;

  // デバッグ用FPS表示（HTML/CSS）
  private debugFpsElement!: HTMLElement;

  // パフォーマンス最適化用
  private lastCameraX: number = 0;
  private lastCameraY: number = 0;
  private lastCameraWidth: number = 0;
  private lastCameraHeight: number = 0;
  private lastCanvasRect: DOMRect | null = null;
  
  // Canvas描画キャッシュ（画像のスケール済みデータを保持）
  private canvasImageCache: Map<string, { canvas: HTMLCanvasElement; width: number; height: number }> = new Map();

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
  } as const;

  constructor() {
    super('GameScene');
  }

  preload() {
    // 魚の画像を読み込み（IDと日本語ファイル名のマッピング）
    const fishImages: { [id: string]: string } = {
      // COMMON
      'fish_goby': 'ハゼ',
      'fish_crucian_carp': 'フナ',
      'fish_carp': 'コイ',
      'fish_sweetfish': 'アユ',
      'fish_killifish': 'メダカ',
      'fish_loach': 'ドジョウ',
      'fish_bluegill': 'ブルーギル',
      'fish_crucian_herabuna': 'ヘラブナ',
      'fish_sea_bass': 'スズキ',
      'fish_goldfish': 'キンギョ',
      // UNCOMMON
      'fish_catfish': 'ナマズ',
      'fish_black_bass': 'ブラックバス',
      'fish_rainbow_trout': 'ニジマス',
      'fish_eel': 'ウナギ',
      'fish_char': 'イワナ',
      'fish_yamame': 'ヤマメ',
      'fish_snakehead': 'ライギョ',
      'fish_rockfish': 'カサゴ',
      'fish_flatfish': 'カレイ',
      'fish_amago': 'アマゴ',
      // RARE
      'fish_salmon': 'サケ',
      'fish_yellowtail': 'ブリ',
      'fish_sea_bream': 'タイ',
      'fish_koi': '錦鯉',
      // EPIC
      'fish_horse_mackerel': 'アジ',
      'fish_tuna': 'マグロ',
      'fish_sturgeon': 'チョウザメ',
      // LEGENDARY
      'fish_golden_koi': '黄金の鯉',
      'fish_arowana': 'アロワナ',
      // ゴミ
      'junk_boot': '長靴',
      'junk_can': '空き缶',
      'junk_tire': 'タイヤ',
    };
    
    for (const [fishId, fileName] of Object.entries(fishImages)) {
      this.load.image(fishId, `/images/fish/${fileName}.png`);
    }

    // ショップアイテムの画像を読み込み（IDと日本語ファイル名のマッピング）
    const itemImages: { [id: string]: string } = {
      // 竿
      'rod_basic': '木の竿',
      'rod_bamboo': '竹の竿',
      'rod_carbon': 'カーボンロッド',
      'rod_master': '名人の竿',
      'rod_legendary': '達人の竿',
      // エサ
      'bait_worm': 'ミミズ',
      'bait_shrimp': '小エビ',
      'bait_minnow': '小魚',
      'bait_golden': '黄金虫',
      // ルアー
      'lure_basic': 'スプーン',
      'lure_minnow': 'ミノー',
      'lure_popper': 'ポッパー',
      'lure_legendary': 'スピナー',
      // バッグ
      'inv_9': '基本バッグ',
      'inv_12': '中型バッグ',
      'inv_15': '大型バッグ',
      'inv_18': '釣り師のバッグ',  // ファイル名に合わせて「釣り師のバッグ」
    };

    for (const [itemId, fileName] of Object.entries(itemImages)) {
      this.load.image(itemId, `/images/items/${fileName}.png`);
    }
  }

  create() {
    // プレイヤーデータを読み込み
    this.playerData = loadPlayerData();

    const mainCfg = config.main;
    const fightCfg = config.fighting;

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

    // ============================================
    // プレイヤー
    // ============================================
    const playerSize = mainCfg['1-1_プレイヤーサイズ'];
    this.player = this.add.rectangle(600, 500, playerSize, playerSize, 0xffe0bd);
    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    
    // 服を追加（プレイヤーに追従）
    const shirt = this.add.rectangle(0, 0, playerSize, playerSize / 2, 0xd32f2f).setDepth(10);
    this.player.setDepth(10);
    this.events.on('update', () => {
        shirt.setPosition(this.player.x, this.player.y + 5);
    });

    // 合わせヒント用テキスト
    this.hintText = this.add.text(0, 0, '', { 
        fontSize: '35px',  // 28 * 1.25
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5).setVisible(false).setDepth(200);

    this.exclamation = this.add.text(0, 0, '!', { 
        fontSize: `${Math.round(config.bite['4-1_ビックリマークサイズ'] * 1.25)}px`,
        color: '#ffff00', 
        fontStyle: 'bold',
        stroke: '#ff0000',
        strokeThickness: 8
    }).setOrigin(0.5).setVisible(false).setDepth(150);

    // HTML/CSSで結果表示を作成
    const resultHTML = `
      <div id="result-text" class="result-text" style="display: none;"></div>
    `;
    const tempDiv1 = document.createElement('div');
    tempDiv1.innerHTML = resultHTML;
    this.resultTextElement = tempDiv1.firstElementChild as HTMLElement;
    document.body.appendChild(this.resultTextElement);

    // パワーゲージ（25%大きく）
    const castCfg = config.casting;
    const gaugeWidth = Math.round(castCfg['2-1_ゲージ幅'] * 1.25);
    const gaugeHeight = Math.round(castCfg['2-2_ゲージ高さ'] * 1.25);
    this.powerBarBg = this.add.rectangle(0, 0, gaugeWidth, gaugeHeight, 0x333333)
        .setStrokeStyle(3, 0xffffff)
        .setDepth(100)
        .setVisible(false);
    
    this.powerBarFill = this.add.rectangle(0, 0, 0, gaugeHeight - 4, 0x00ff00)
        .setOrigin(0, 0.5)
        .setDepth(101)
        .setVisible(false);

    // ファイトUIコンテナ（25%大きく）
    this.fightContainer = this.add.container(0, 0).setVisible(false).setDepth(50).setScale(1.25);
    
    const bg = this.add.rectangle(0, 0, fightCfg['5-2_背景幅'], fightCfg['5-2_背景高さ'], 0x222222)
        .setStrokeStyle(2, 0xffffff);
    this.fightContainer.add(bg);
    
    // プレイヤーバーの高さを判定範囲に応じて設定
    const barHeight = fightCfg['5-9_バー判定範囲'];
    const bgHeight = fightCfg['5-2_背景高さ'];
    const barDisplayHeight = barHeight * bgHeight;  // 判定範囲をピクセルに変換
    this.uiPlayerBar = this.add.rectangle(0, 0, fightCfg['5-3_バー幅'], barDisplayHeight, 0x00ff00);
    this.fightContainer.add(this.uiPlayerBar);

    const fishSize = fightCfg['5-4_魚サイズ'];
    this.uiFish = this.add.rectangle(0, 0, fishSize, fishSize, 0xffaa00);
    this.fightContainer.add(this.uiFish);

    const progressBg = this.add.rectangle(25, 0, 10, fightCfg['5-2_背景高さ'], 0x000000).setStrokeStyle(1, 0xffffff);
    this.fightContainer.add(progressBg);
    // 進行ゲージ：上端基準で、Y位置を動的に変更して下から上に伸ばす
    this.uiProgressBar = this.add.rectangle(25, 0, 10, 0, 0xffff00).setOrigin(0.5, 0);
    this.fightContainer.add(this.uiProgressBar);

    // ファイト説明テキスト
    const fightHint = this.add.text(-60, -120, 'SPACEで上昇\n魚をバーに収めろ！', {
        fontSize: '15px',  // 12 * 1.25
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);
    this.fightContainer.add(fightHint);

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

    // ショップUI
    this.createShopUI();

    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Eキーで全て売却
        this.input.keyboard.on('keydown-E', () => {
            if (this.state === FishingState.IDLE) {
                this.sellAll();
            }
        });

        // Iキーでインベントリ表示
        this.input.keyboard.on('keydown-I', () => {
            if (this.detailModalOpen) {
                this.closeDetailModal();
            } else {
                this.toggleInventory();
            }
        });

        // ESCキーで閉じる（最上位モーダルのみ）
        this.input.keyboard.on('keydown-ESC', () => {
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
            }
        });

        // エンターキーで詳細を開く/購入
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.inventoryOpen && !this.detailModalOpen) {
                this.openDetailModal();
            } else if (this.bookOpen && !this.bookDetailOpen) {
                this.openBookDetail();
            } else if (this.shopOpen) {
                this.purchaseOrEquipItem();
            }
        });

        // Bキーで図鑑表示
        this.input.keyboard.on('keydown-B', () => {
            if (this.bookDetailOpen) {
                this.closeBookDetail();
            } else {
                this.toggleBook();
            }
        });

        // Sキーでショップ表示
        this.input.keyboard.on('keydown-S', () => {
            if (this.state === FishingState.IDLE) {
                this.toggleShop();
            }
        });

        // Qキーで前のページ
        this.input.keyboard.on('keydown-Q', () => {
            if (this.bookOpen && !this.bookDetailOpen) {
                this.bookPrevPage();
            }
        });

        // Eキーで次のページ（インベントリが閉じている時のみ）
        this.input.keyboard.on('keydown-W', () => {
            if (this.bookOpen && !this.bookDetailOpen) {
                this.bookNextPage();
            }
        });

        this.spaceKey.on('down', () => {
            if (this.state === FishingState.IDLE) {
                if (this.isNearWater()) {
                    this.startCasting();
                } else {
                    this.showResult("水辺に近づいてください", 1500);
                }
            } else if (this.state === FishingState.BITE) {
                this.startFighting();
            }
        });

        this.spaceKey.on('up', () => {
            if (this.state === FishingState.CASTING) {
                this.finishCasting();
            }
        });
    }

    // カメラ設定（プレイヤーを常に画面中央に配置）
    // カメラ境界を設定しないことで、マップサイズに関係なくプレイヤーが中央に
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    // デッドゾーンを0にして常に中央追従
    this.cameras.main.setDeadzone(0, 0);
    
    // HTML/CSSで操作説明を作成
    const controlsHTML = `
      <div id="controls-text" class="controls-text">移動: 矢印 | 釣り: SPACE | 売却: E | 持ち物: I | 図鑑: B | ショップ: S</div>
    `;
    const tempDiv2 = document.createElement('div');
    tempDiv2.innerHTML = controlsHTML;
    this.controlsTextElement = tempDiv2.firstElementChild as HTMLElement;
    document.body.appendChild(this.controlsTextElement);

    // HTML/CSSでFPS表示を作成（画面左下、最前面に表示）
    const debugFpsHTML = `
      <div id="debug-fps" style="position: fixed; bottom: 10px; left: 10px; color: #00ff00; font-family: monospace; font-size: 14px; background: rgba(0, 0, 0, 0.7); padding: 5px 10px; border-radius: 4px; z-index: 3000; user-select: none; pointer-events: none;">
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
        element.style.display = 'none';
        element.style.pointerEvents = 'none';
        element.setAttribute('aria-hidden', 'true');
        
        // inert属性を確実に解除
        if ('inert' in element) {
          (element as any).inert = false;
        }
        element.removeAttribute('inert');
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
      // スタイルも明示的に設定（念のため）
      if (this.modalStack.length > 0) {
        this.modalOverlayElement.style.display = 'block';
      } else {
        this.modalOverlayElement.style.display = 'none';
      }
    }

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
    const statusHTML = `
      <div id="status-ui" style="position: fixed; pointer-events: none; z-index: 1000; top: 0; left: 0; width: 100%; height: 100%;">
        <!-- 左上: レベルと経験値 -->
        <div id="level-section" style="position: absolute; top: 10px; left: 10px;">
          <div id="level-text" class="stat-item">⭐ Lv.1</div>
          <div id="exp-bar-bg">
            <div id="exp-bar-fill"></div>
          </div>
        </div>
        
        <!-- 右上: 所持金、インベントリ、図鑑 -->
        <div id="stats-section" style="position: absolute; top: 10px; right: 10px;">
          <div id="money-text" class="stat-item">💰 0 G</div>
          <div id="inventory-text" class="stat-item">🎒 0/9</div>
          <div id="collection-text" class="stat-item">📖 図鑑 0/0</div>
        </div>
      </div>
    `;
    
    // DOM要素を直接bodyに追加（画面固定）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = statusHTML;
    this.statusUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.statusUIElement);
    
    this.updateStatusUI();
  }

  private lastMoney: number = -1;
  private lastInventoryCount: number = -1;
  private lastMaxInventorySlots: number = -1;
  private lastCaughtCount: number = -1;
  private lastLevel: number = -1;
  private lastExpProgress: number = -1;

  updateStatusUI() {
    if (!this.statusUIElement) return;
    
    // 所持金（変更時のみ更新）
    const money = this.playerData.money;
    if (money !== this.lastMoney) {
      const moneyEl = this.statusUIElement.querySelector('#money-text');
      if (moneyEl) moneyEl.textContent = `💰 ${money.toLocaleString()} G`;
      this.lastMoney = money;
    }
    
    // インベントリ（変更時のみ更新）
    const inventoryCount = getInventoryCount(this.playerData);
    const maxSlots = this.playerData.maxInventorySlots;
    if (inventoryCount !== this.lastInventoryCount || maxSlots !== this.lastMaxInventorySlots) {
      const inventoryEl = this.statusUIElement.querySelector('#inventory-text');
      if (inventoryEl) inventoryEl.textContent = `🎒 ${inventoryCount}/${maxSlots}`;
      this.lastInventoryCount = inventoryCount;
      this.lastMaxInventorySlots = maxSlots;
    }
    
    // 図鑑（変更時のみ更新）
    const totalFish = getRealFishCount();
    const caught = Array.from(this.playerData.caughtFishIds).filter(id => !id.startsWith('junk')).length;
    if (caught !== this.lastCaughtCount) {
      const collectionEl = this.statusUIElement.querySelector('#collection-text');
      if (collectionEl) collectionEl.textContent = `📖 図鑑 ${caught}/${totalFish}`;
      this.lastCaughtCount = caught;
    }
    
    // レベル（変更時のみ更新）
    const level = this.playerData.level;
    if (level !== this.lastLevel) {
      const levelEl = this.statusUIElement.querySelector('#level-text');
      if (levelEl) levelEl.textContent = `⭐ Lv.${level}`;
      this.lastLevel = level;
    }
    
    // 経験値バー（変更時のみ更新）
    const expProgress = getExpProgress(this.playerData);
    if (Math.abs(expProgress - this.lastExpProgress) > 0.001) {
      const expBarFill = this.statusUIElement.querySelector('#exp-bar-fill') as HTMLElement;
      if (expBarFill) expBarFill.style.width = `${expProgress * 100}%`;
      this.lastExpProgress = expProgress;
    }
  }

  updateUIPositions() {
    const cam = this.cameras.main;
    const width = cam.width;
    const height = cam.height;
    
    // カメラのスクロール位置（ワールド座標でのカメラ左上）
    const scrollX = cam.scrollX;
    const scrollY = cam.scrollY;
    
    // 画面上の相対位置をワールド座標に変換
    const screenCenterX = scrollX + width / 2;
    const screenCenterY = scrollY + height / 2;
    const screenTop = scrollY;
    const screenRight = scrollX + width;
    const screenBottom = scrollY + height;

    // ヒントテキスト（画面上部中央）
    this.hintText.setPosition(screenCenterX, screenTop + 100);

    // パワーゲージ（画面下部中央）
    this.powerBarBg.setPosition(screenCenterX, screenBottom - 50);
    this.powerBarFill.setPosition(screenCenterX - 98, screenBottom - 50);

    // ファイトUI（画面右側）
    this.fightContainer.setPosition(screenRight - 80, screenCenterY);

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
    savePlayerData(this.playerData);
    this.updateStatusUI();
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

    // モーダルが開いている場合はゲーム更新をスキップ（パフォーマンス最適化）
    // ただし、オンラインマルチ対応のため完全停止はしない
    const hasOpenModal = this.modalStack.length > 0;
    const topModalId = this.modalStack[this.modalStack.length - 1];
    
    if (hasOpenModal) {
      // 最上位モーダルの操作のみ処理
      if (topModalId === this.MODAL_IDS.INVENTORY && !this.detailModalOpen) {
        this.handleInventoryNavigation();
        return;
      }

      if (topModalId === this.MODAL_IDS.BOOK && !this.bookDetailOpen) {
        this.handleBookNavigation();
        return;
      }

      if (topModalId === this.MODAL_IDS.SHOP) {
        this.handleShopNavigation();
        return;
      }

      // その他のモーダル（詳細モーダルなど）が最上位の場合は何もしない
      // ただし、ネットワーク処理などは継続（将来のマルチ対応）
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
    } else {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    }

    if (this.state === FishingState.CASTING) {
        this.updateCasting(delta);
    }

    if (this.state === FishingState.FIGHTING) {
        this.updateFighting(time, delta);
    }

    // BITE状態でエクスクラメーションを点滅
    if (this.state === FishingState.BITE) {
        this.exclamation.setScale(1 + Math.sin(time / 50) * 0.2);
    }
  }

  handleMovement() {
    const speed = config.main['1-5_移動速度'];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    // 左右移動と向きの更新
    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
      this.playerFacing = 'left';
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
      this.playerFacing = 'right';
    }

    // 上下移動と向きの更新
    if (this.cursors.up.isDown) {
      body.setVelocityY(-speed);
      this.playerFacing = 'up';
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(speed);
      this.playerFacing = 'down';
    }
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

  isInsideWater(): boolean {
    const px = this.player.x;
    const py = this.player.y;
    
    for (const area of this.waterAreas) {
        if (area.type === 'ellipse') {
            const dx = (px - area.x) / (area.width / 2);
            const dy = (py - area.y) / (area.height / 2);
            if (dx * dx + dy * dy <= 1) {
                return true;
            }
        } else if (area.type === 'rect') {
            if (px >= area.x && px <= area.x + area.width &&
                py >= area.y && py <= area.y + area.height) {
                return true;
            }
        }
    }
    return false;
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

  // --- 投擲処理 ---
  startCasting() {
    this.state = FishingState.CASTING;
    this.castPower = 0;
    this.castDirection = 1;
    this.powerBarBg.setVisible(true);
    this.powerBarFill.setVisible(true);
    this.hintText.setText('SPACE を離して投げる！').setVisible(true);
  }

  updateCasting(delta: number) {
    const speed = config.casting['2-3_ゲージ速度'];
    this.castPower += speed * delta * this.castDirection;

    if (this.castPower >= 1) {
        this.castPower = 1;
        this.castDirection = -1;
    } else if (this.castPower <= 0) {
        this.castPower = 0;
        this.castDirection = 1;
    }

    // パワーバーの色と幅を更新
    const maxWidth = config.casting['2-1_ゲージ幅'] - 4;
    const width = maxWidth * this.castPower;
    this.powerBarFill.width = width;
    
    // 色を緑→黄→赤に変化
    const r = Math.floor(this.castPower * 255);
    const g = Math.floor((1 - this.castPower * 0.5) * 255);
    this.powerBarFill.setFillStyle(Phaser.Display.Color.GetColor(r, g, 0));
  }

  finishCasting() {
    this.state = FishingState.WAITING;
    this.powerBarBg.setVisible(false);
    this.powerBarFill.setVisible(false);
    this.hintText.setVisible(false);
    if (this.resultTextElement) {
      this.resultTextElement.style.display = 'none';
    }

    const waitCfg = config.waiting;
    
    // 装備中の竿のボーナスを取得
    const equippedRod = getRodById(this.playerData.equippedRodId);
    const castDistanceBonus = equippedRod?.castDistanceBonus || 1.0;
    
    // パワーに応じた距離（竿のボーナスを反映）
    const minDist = waitCfg['3-3_最小投擲距離'];
    const maxDist = waitCfg['3-4_最大投擲距離'];
    const baseDistance = minDist + (this.castPower * (maxDist - minDist));
    const distance = baseDistance * castDistanceBonus;
    
    // 向きに応じた終点座標を計算
    let endX = this.player.x;
    let endY = this.player.y;
    let lineStartX = this.player.x;
    let lineStartY = this.player.y;
    
    switch (this.playerFacing) {
      case 'up':
        endY = this.player.y - distance;
        lineStartY = this.player.y - 16;
        break;
      case 'down':
        endY = this.player.y + distance;
        lineStartY = this.player.y + 16;
        break;
      case 'left':
        endX = this.player.x - distance;
        lineStartX = this.player.x - 16;
        break;
      case 'right':
        endX = this.player.x + distance;
        lineStartX = this.player.x + 16;
        break;
    }

    const lineWidth = waitCfg['3-1_ライン太さ'];
    this.fishingRod = this.add.line(0, 0, lineStartX, lineStartY, endX, endY, 0xffffff)
        .setOrigin(0).setLineWidth(lineWidth);
    
    const floatSize = waitCfg['3-2_浮きサイズ'];
    this.float = this.add.circle(endX, endY, floatSize, 0xff0000).setStrokeStyle(2, 0xffffff);

    // 浮きのゆらぎ（向きに応じてアニメーション方向を変更）
    const wobbleProps: { x?: number; y?: number } = {};
    if (this.playerFacing === 'up' || this.playerFacing === 'down') {
      wobbleProps.y = endY + 4;
    } else {
      wobbleProps.x = endX + 4;
    }
    
    this.tweens.add({
        targets: this.float,
        ...wobbleProps,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // エサとルアーのボーナスを計算（消費はファイト開始時）
    const bait = this.playerData.equippedBaitId ? getBaitById(this.playerData.equippedBaitId) : null;
    const lure = this.playerData.equippedLureId ? getLureById(this.playerData.equippedLureId) : null;

    // 竿のレアボーナス + エサのボーナス + ルアーのボーナスを組み合わせ
    const rareChanceBonus = equippedRod?.rareChanceBonus || 1.0;
    const bonuses = {
      commonBonus: (bait?.commonBonus || 1.0) * (lure?.commonBonus || 1.0),
      uncommonBonus: (bait?.uncommonBonus || 1.0) * (lure?.uncommonBonus || 1.0),
      rareBonus: (bait?.rareBonus || 1.0) * (lure?.rareBonus || 1.0) * rareChanceBonus,
      epicBonus: (bait?.epicBonus || 1.0) * (lure?.epicBonus || 1.0) * rareChanceBonus,
      legendaryBonus: (bait?.legendaryBonus || 1.0) * (lure?.legendaryBonus || 1.0) * rareChanceBonus,
    };

    // どの魚が釣れるか決定（ボーナス適用）
    this.currentFish = getRandomFish(bonuses);

    // 魚がかかるまでの時間
    const minWait = waitCfg['3-5_最短待機時間'] * 1000;
    const maxWait = waitCfg['3-6_最長待機時間'] * 1000;
    const waitTime = Phaser.Math.Between(minWait, maxWait);
    this.biteTimer = this.time.delayedCall(waitTime, () => this.triggerBite());
    
    this.hintText.setText('待機中...').setVisible(true);
  }

  triggerBite() {
    if (this.state !== FishingState.WAITING) return;
    this.state = FishingState.BITE;
    
    // 派手なエフェクト
    this.exclamation.setPosition(this.player.x, this.player.y - 50).setVisible(true);
    
    // ヒント表示
    this.hintText.setText('🎣 SPACE を押せ！').setVisible(true);
    
    // 浮きを激しく揺らす
    this.tweens.killTweensOf(this.float);
    this.tweens.add({
        targets: this.float,
        x: this.float.x + 8,
        y: this.float.y - 5,
        duration: 80,
        yoyo: true,
        repeat: -1
    });

    // 反応時間
    const reactionTime = config.bite['4-3_反応時間'] * 1000;
    this.biteTimeout = this.time.delayedCall(reactionTime, () => {
        if (this.state === FishingState.BITE) {
            this.cancelFishing("逃げられた...");
        }
    });
  }

  // --- ファイト処理 ---
  startFighting() {
    if (this.biteTimeout) this.biteTimeout.remove();
    this.exclamation.setVisible(false);
    this.hintText.setVisible(false);
    
    // ファイト開始時にエサを消費
    if (this.playerData.equippedBaitId) {
      consumeBait(this.playerData);
      savePlayerData(this.playerData);
    }
    
    this.state = FishingState.FIGHTING;
    this.fightContainer.setVisible(true);

    const fightCfg = config.fighting;
    this.fishBarPosition = 0.4;
    this.fishVelocity = 0;
    this.playerBarPosition = 0.3;
    this.playerBarVelocity = 0;
    this.catchProgress = fightCfg['5-12_初期ゲージ'];
    this.fishMoveTimer = 1.0;
    this.fishTargetPosition = 0.4;

    // 魚の難易度に応じて色を変更
    if (this.currentFish) {
        const color = rarityColors[this.currentFish.rarity];
        this.uiFish.setFillStyle(color);
    }
  }

  updateFighting(time: number, delta: number) {
    const dt = delta / 1000;
    const cfg = config.fighting;

    // プレイヤーバーの操作
    const gravity = cfg['5-7_重力'];
    const lift = cfg['5-8_上昇力'];

    if (this.spaceKey.isDown) {
        this.playerBarVelocity += lift * dt;
    }
    this.playerBarVelocity -= gravity * dt;

    this.playerBarPosition += this.playerBarVelocity * dt;

    if (this.playerBarPosition < 0) {
        this.playerBarPosition = 0;
        this.playerBarVelocity = 0;
    } else if (this.playerBarPosition > 0.8) {
        this.playerBarPosition = 0.8;
        this.playerBarVelocity = -this.playerBarVelocity * 0.3;
    }

    // 魚AI - 魚ごとのパラメータを使用
    const fish = this.currentFish;
    const fishSpeed = fish?.fishSpeed ?? 0.3;
    const fishErratic = fish?.fishErratic ?? 0.3;
    const moveIntervalMin = fish?.moveInterval[0] ?? cfg['5-13_魚の移動間隔_最短'];
    const moveIntervalMax = fish?.moveInterval[1] ?? cfg['5-14_魚の移動間隔_最長'];
    const catchRate = fish?.catchRate ?? 1.0;      // 捕まえやすさ
    const escapeRate = fish?.escapeRate ?? 1.0;    // 逃げやすさ
    
    this.fishMoveTimer -= dt;
    if (this.fishMoveTimer <= 0) {
        // 魚ごとの移動間隔を使用
        this.fishMoveTimer = Phaser.Math.FloatBetween(moveIntervalMin, moveIntervalMax);
        
        // 不規則な動きの場合、大きくジャンプすることがある
        const minRange = cfg['5-16_魚の移動範囲_下'];
        const maxRange = cfg['5-17_魚の移動範囲_上'];
        
        if (Math.random() < fishErratic) {
            // 激しい動き：遠くへジャンプ
            const currentPos = this.fishBarPosition;
            const jumpDistance = 0.3 + fishErratic * 0.3;
            if (Math.random() < 0.5) {
                this.fishTargetPosition = Math.min(currentPos + jumpDistance, maxRange);
            } else {
                this.fishTargetPosition = Math.max(currentPos - jumpDistance, minRange);
            }
        } else {
            // 通常の動き
            this.fishTargetPosition = Phaser.Math.FloatBetween(minRange, maxRange);
        }
    }
    
    // 魚の速度でlerpスピードを調整
    const baseLerpSpeed = cfg['5-15_魚のなめらかさ'];
    const lerpSpeed = baseLerpSpeed * (1 + fishSpeed * 2);
    this.fishBarPosition = Phaser.Math.Linear(
        this.fishBarPosition,
        this.fishTargetPosition,
        lerpSpeed
    );

    // 判定（レベルボーナスを適用）
    const baseBarHeight = cfg['5-9_バー判定範囲'];
    const levelBarBonus = getLevelBarRangeBonus(this.playerData.level);
    const barHeight = Math.min(1.0, baseBarHeight + levelBarBonus);  // 最大1.0まで
    const isCatching = (this.fishBarPosition >= this.playerBarPosition && 
                        this.fishBarPosition <= this.playerBarPosition + barHeight);

    // 装備中の竿のボーナスを取得
    const equippedRod = getRodById(this.playerData.equippedRodId);
    const rodCatchBonus = equippedRod?.catchRateBonus || 1.0;

    if (isCatching) {
        // 全体設定 × 魚ごとの捕まえやすさ × 竿のボーナス × レベルボーナス
        const baseGaugeSpeed = cfg['5-10_ゲージ増加速度'];
        const levelGaugeBonus = getLevelGaugeSpeedBonus(this.playerData.level);
        const gaugeSpeed = baseGaugeSpeed + levelGaugeBonus;
        this.catchProgress += gaugeSpeed * catchRate * rodCatchBonus * dt;
        this.uiPlayerBar.setFillStyle(0x00ff00);
    } else {
        // 全体設定 × 魚ごとの逃げやすさ
        this.catchProgress -= cfg['5-11_ゲージ減少速度'] * escapeRate * dt;
        this.uiPlayerBar.setFillStyle(0x888800);
    }
    
    this.catchProgress = Phaser.Math.Clamp(this.catchProgress, 0, 1);

    // UI更新
    const bgHeight = cfg['5-2_背景高さ'];
    const mapY = (pos: number) => (bgHeight / 2) - (pos * bgHeight);

    this.uiFish.y = mapY(this.fishBarPosition);
    
    // プレイヤーバーの高さを判定範囲に応じて動的に変更
    const barDisplayHeight = barHeight * bgHeight;  // 判定範囲をピクセルに変換
    this.uiPlayerBar.setSize(cfg['5-3_バー幅'], barDisplayHeight);
    this.uiPlayerBar.y = mapY(this.playerBarPosition + barHeight / 2);
    
    // 進行ゲージ：下から上に伸びる
    const progressHeight = this.catchProgress * bgHeight;
    this.uiProgressBar.height = progressHeight;
    this.uiProgressBar.y = (bgHeight / 2) - progressHeight;

    // 終了判定
    if (this.catchProgress >= 1) {
        this.successFishing();
    } else if (this.catchProgress <= 0) {
        this.cancelFishing("逃げられた...");
    }
  }

  successFishing() {
    this.state = FishingState.SUCCESS;
    this.fightContainer.setVisible(false);
    this.cleanupFishingTools();

    if (this.currentFish) {
        // インベントリの空きをチェック
        const currentCount = getInventoryCount(this.playerData);
        if (currentCount >= this.playerData.maxInventorySlots) {
            // 満杯の場合は自動売却
            const earnings = this.currentFish.price;
            this.playerData.money += earnings;
            // 図鑑には登録
            this.playerData.caughtFishIds.add(this.currentFish.id);
            this.playerData.totalCaught++;
            // 経験値も獲得
            const leveledUp = addExp(this.playerData, getExpByRarity(this.currentFish.rarity));
            savePlayerData(this.playerData);
            this.updateStatusUI();

            const stars = rarityStars[this.currentFish.rarity];
            const duration = config.result['6-2_成功表示時間'] * 1000;
            let resultMessage = `${this.currentFish.emoji} ${this.currentFish.name} ${stars}\nバッグ満杯！自動売却 +${earnings} G`;
            if (leveledUp) {
              resultMessage += `\n🎉 レベルアップ！ Lv.${this.playerData.level}`;
            }
            this.showResult(resultMessage, duration);
            return;
        }

        // インベントリに追加
        const leveledUp = addFishToInventory(this.playerData, this.currentFish);
        savePlayerData(this.playerData);
        this.updateStatusUI();

        const stars = rarityStars[this.currentFish.rarity];
        const duration = config.result['6-2_成功表示時間'] * 1000;
        let resultMessage = `${this.currentFish.emoji} ${this.currentFish.name} を釣った！\n${stars} | ${this.currentFish.price}G`;
        
        // レベルアップ時のメッセージを追加
        if (leveledUp) {
          resultMessage += `\n🎉 レベルアップ！ Lv.${this.playerData.level}`;
        }
        
        this.showResult(resultMessage, duration);
    }
    
    this.currentFish = null;
  }

  cancelFishing(reason: string) {
    this.state = FishingState.FAIL;
    this.fightContainer.setVisible(false);
    this.cleanupFishingTools();
    this.currentFish = null;
    
    const duration = config.result['6-3_失敗表示時間'] * 1000;
    this.showResult(reason, duration);
  }

  cleanupFishingTools() {
    if (this.biteTimer) this.biteTimer.remove();
    if (this.biteTimeout) this.biteTimeout.remove();
    if (this.fishingRod) this.fishingRod.destroy();
    if (this.float) this.float.destroy();
    this.exclamation.setVisible(false);
    this.powerBarBg.setVisible(false);
    this.powerBarFill.setVisible(false);
    this.hintText.setVisible(false);
  }

  showResult(text: string, duration: number) {
    if (this.resultTextElement) {
      this.resultTextElement.textContent = text;
      this.resultTextElement.style.display = 'block';
    }
    
    this.time.delayedCall(duration, () => {
        if (this.state === FishingState.SUCCESS || this.state === FishingState.FAIL) {
            this.resetState();
        }
        if (this.resultTextElement) {
          this.resultTextElement.style.display = 'none';
        }
    });
  }

  resetState() {
    this.state = FishingState.IDLE;
    this.cleanupFishingTools();
    if (this.resultTextElement) {
      this.resultTextElement.style.display = 'none';
    }
    this.fightContainer.setVisible(false);
    this.hintText.setVisible(false);
  }

  // ============================================
  // インベントリUI
  // ============================================

  createInventoryUI() {
    // HTML/CSSでインベントリUIを作成
    const slotSize = 100;
    const padding = 10;
    const gridSize = 3;
    const maxSlots = 18;  // 最大18スロット

    // スロットHTMLを生成
    let slotsHTML = '';
    for (let i = 0; i < maxSlots; i++) {
      slotsHTML += `
        <div class="inventory-slot" data-index="${i}">
          <div class="slot-bg"></div>
          <canvas class="slot-image" width="70" height="70" style="display: none;"></canvas>
          <div class="slot-emoji"></div>
          <div class="slot-name"></div>
          <div class="slot-price"></div>
        </div>
      `;
    }

    const inventoryHTML = `
      <div id="inventory-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content inventory-modal">
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
    // HTML/CSSで詳細モーダルを作成
    const detailHTML = `
      <div id="detail-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content detail-modal">
          <button class="modal-close" onclick="window.gameScene?.closeDetailModal()">✕</button>
          <div class="detail-content">
            <canvas id="detail-fish-image" class="detail-image" width="80" height="80" style="display: none;"></canvas>
            <div id="detail-emoji" class="detail-emoji" style="display: none;"></div>
            <div id="detail-name" class="detail-name"></div>
            <div id="detail-rarity" class="detail-rarity"></div>
            <div id="detail-desc" class="detail-desc"></div>
            <div id="detail-info" class="detail-info"></div>
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
    if (this.inventoryOpen) {
        this.closeInventory();
    } else {
        this.openInventory();
    }
  }

  openInventory() {
    if (this.state !== FishingState.IDLE) return;
    
    this.inventoryOpen = true;
    this.selectedSlotIndex = 0;
    this.lastSelectedInventoryIndex = -1; // リセット
    this.updateInventoryLayout();  // レイアウトを更新
    this.updateInventorySlots();
    this.updateInventorySelection();
    if (this.inventoryUIElement) {
      this.openModal(this.MODAL_IDS.INVENTORY);
      // モーダル位置を更新
      this.updateModalPositionsIfNeeded();
    }
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
    
    // インベントリをフラット化（スタックを展開して個別表示）
    const flatInventory: string[] = [];
    for (const item of this.playerData.inventory) {
        for (let j = 0; j < item.count; j++) {
            flatInventory.push(item.fishId);
        }
    }
    
    // maxInventorySlotsに基づいてスロットを更新
    for (let i = 0; i < this.playerData.maxInventorySlots; i++) {
        const slotData = this.inventorySlotElements[i];
        if (!slotData) continue;
        
        const { bg: slotBg, image: slotImage, emoji: slotEmoji, name: slotName, price: slotPrice } = slotData;

        if (i < flatInventory.length) {
            const fishId = flatInventory[i];
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
                                
                                // キャッシュ用のCanvasを作成
                                const cacheCanvas = document.createElement('canvas');
                                cacheCanvas.width = width;
                                cacheCanvas.height = height;
                                const cacheCtx = cacheCanvas.getContext('2d');
                                
                                if (cacheCtx) {
                                    const sourceImage = frame.source.image as HTMLImageElement;
                                    if (sourceImage) {
                                        cacheCtx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, width, height);
                                    }
                                }
                                
                                cached = { canvas: cacheCanvas, width, height };
                                this.canvasImageCache.set(cacheKey, cached);
                            }
                            
                            // キャッシュから描画
                            ctx.drawImage(cached.canvas, (70 - cached.width) / 2, (70 - cached.height) / 2);
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
                slotPrice.textContent = `${fish.price}G`;
                
                // レア度に応じた背景色
                const rarityColor = rarityColors[fish.rarity];
                const colorHex = `#${rarityColor.toString(16).padStart(6, '0')}`;
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
            slotBg.style.backgroundColor = '#333333';
            slotBg.style.opacity = '1';
            slotBg.style.borderColor = '#555555';
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
      this.inventorySlots[this.lastSelectedInventoryIndex].classList.remove('selected');
    }
    
    // 選択されたスロットにクラスを追加
    if (this.inventorySlots[this.selectedSlotIndex]) {
      this.inventorySlots[this.selectedSlotIndex].classList.add('selected');
    }
    
    this.lastSelectedInventoryIndex = this.selectedSlotIndex;
  }

  openDetailModal() {
    if (!this.detailModalElement) return;
    
    // フラット化したインベントリから取得
    const flatInventory: string[] = [];
    for (const item of this.playerData.inventory) {
        for (let j = 0; j < item.count; j++) {
            flatInventory.push(item.fishId);
        }
    }
    
    if (this.selectedSlotIndex >= flatInventory.length) return;

    const fishId = flatInventory[this.selectedSlotIndex];
    const fish = getFishById(fishId);
    if (!fish) return;

    this.detailModalOpen = true;

    // モーダルの内容を更新
    const fishImage = this.detailModalElement.querySelector('#detail-fish-image') as HTMLCanvasElement;
    const emoji = this.detailModalElement.querySelector('#detail-emoji') as HTMLElement;
    const nameText = this.detailModalElement.querySelector('#detail-name') as HTMLElement;
    const rarityText = this.detailModalElement.querySelector('#detail-rarity') as HTMLElement;
    const descText = this.detailModalElement.querySelector('#detail-desc') as HTMLElement;
    const infoText = this.detailModalElement.querySelector('#detail-info') as HTMLElement;

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
                ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
                             (80 - width) / 2, (80 - height) / 2, width, height);
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
    rarityText.textContent = rarityStars[fish.rarity];
    descText.textContent = fish.description;
    infoText.textContent = `💰 ${fish.price}G`;

    // レア度に応じた色
    const color = rarityColors[fish.rarity];
    rarityText.style.color = `#${color.toString(16).padStart(6, '0')}`;

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
          <div class="slot-bg"></div>
          <canvas class="slot-image" width="70" height="70" style="display: none;"></canvas>
          <div class="slot-emoji"></div>
          <div class="slot-name"></div>
          <div class="slot-rarity"></div>
        </div>
      `;
    }

    const bookHTML = `
      <div id="book-modal" class="modal" style="display: none;">
        <div class="modal-content book-modal">
          <div class="modal-header">
            <h2>📖 魚図鑑</h2>
            <div id="book-progress" class="book-progress"></div>
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

  createBookDetailModal() {
    // HTML/CSSで図鑑詳細モーダルを作成
    const bookDetailHTML = `
      <div id="book-detail-modal" class="modal" style="display: none;" aria-hidden="true">
        <div class="modal-content detail-modal">
          <button class="modal-close" onclick="window.gameScene?.closeBookDetail()">✕</button>
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
    if (this.bookOpen) {
        this.closeBook();
    } else {
        this.openBook();
    }
  }

  openBook() {
    if (this.state !== FishingState.IDLE) return;
    if (this.inventoryOpen) return;  // インベントリが開いている時は開かない
    
    this.bookOpen = true;
    this.bookPage = 0;
    this.bookSelectedIndex = 0;
    this.lastSelectedBookIndex = -1; // リセット
    this.updateBookSlots();
    this.updateBookSelection();
    if (this.bookUIElement) {
      this.openModal(this.MODAL_IDS.BOOK);
      // モーダル位置を更新
      this.updateModalPositionsIfNeeded();
    }
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
                                
                                // キャッシュ用のCanvasを作成
                                const cacheCanvas = document.createElement('canvas');
                                cacheCanvas.width = width;
                                cacheCanvas.height = height;
                                const cacheCtx = cacheCanvas.getContext('2d');
                                
                                if (cacheCtx) {
                                    const sourceImage = frame.source.image as HTMLImageElement;
                                    if (sourceImage) {
                                        cacheCtx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, width, height);
                                    }
                                }
                                
                                cached = { canvas: cacheCanvas, width, height };
                                this.canvasImageCache.set(cacheKey, cached);
                            }
                            
                            // キャッシュから描画
                            ctx.drawImage(cached.canvas, (70 - cached.width) / 2, (70 - cached.height) / 2);
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
                
                const color = rarityColors[fish.rarity];
                const colorHex = `#${color.toString(16).padStart(6, '0')}`;
                slotBg.style.backgroundColor = colorHex;
                slotBg.style.opacity = '0.3';
                slotBg.style.borderColor = colorHex;
                slotRarity.style.color = colorHex;
            } else {
                // 未発見（シルエット）
                slotImage.style.display = 'none';
                slotEmoji.textContent = '❓';
                slotEmoji.style.display = 'block';
                slotName.textContent = '？？？';
                slotRarity.textContent = rarityStars[fish.rarity];
                
                slotBg.style.backgroundColor = '#222222';
                slotBg.style.opacity = '1';
                slotBg.style.borderColor = '#444444';
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
            slotBg.style.backgroundColor = '#111111';
            slotBg.style.opacity = '1';
            slotBg.style.borderColor = '#333333';
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
      this.bookSlots[this.lastSelectedBookIndex].classList.remove('selected');
    }
    
    // 選択されたスロットにクラスを追加
    if (this.bookSlots[this.bookSelectedIndex]) {
      this.bookSlots[this.bookSelectedIndex].classList.add('selected');
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
                    ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
                                 (80 - width) / 2, (80 - height) / 2, width, height);
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
        rarityText.textContent = rarityStars[fish.rarity];
        descText.textContent = fish.description;
        priceText.textContent = `💰 売値: ${fish.price}G`;
        
        const color = rarityColors[fish.rarity];
        rarityText.style.color = `#${color.toString(16).padStart(6, '0')}`;
    } else {
        fishImage.style.display = 'none';
        emoji.textContent = '❓';
        emoji.style.display = 'block';
        nameText.textContent = '？？？';
        rarityText.textContent = rarityStars[fish.rarity];
        descText.textContent = 'まだ発見されていません...\nこの魚を釣って図鑑を完成させよう！';
        priceText.textContent = '';
        
        rarityText.style.color = '#666666';
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
        <div class="modal-content shop-modal">
          <div class="modal-header">
            <h2>🏪 ショップ</h2>
          </div>
          <div class="shop-tabs">
            <button class="shop-tab" data-tab="rod">🎣 竿</button>
            <button class="shop-tab" data-tab="bait">🪱 エサ</button>
            <button class="shop-tab" data-tab="lure">🎯 ルアー</button>
            <button class="shop-tab" data-tab="inventory">🎒 バッグ</button>
          </div>
          <div id="shop-items-list" class="shop-items-list"></div>
          <div class="modal-footer">
            <div id="shop-money" class="shop-money"></div>
            <div class="hint-text">↑↓: 選択 | ENTER: 購入/装備 | S/ESC: 閉じる</div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = shopHTML;
    this.shopUIElement = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.shopUIElement);

    // ショップの要素をキャッシュ
    this.shopItemsListElement = this.shopUIElement.querySelector('#shop-items-list') as HTMLElement;
    this.shopMoneyElement = this.shopUIElement.querySelector('#shop-money') as HTMLElement;

    // タブボタンのイベント
    const tabButtons = this.shopUIElement.querySelectorAll('.shop-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as 'rod' | 'bait' | 'lure' | 'inventory';
        this.shopTab = tab;
        this.shopSelectedIndex = 0;
        this.updateShopContent();
        this.updateShopTabs();
      });
    });
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
    if (this.inventoryOpen) this.closeInventory();
    if (this.bookOpen) this.closeBook();
    
    this.shopOpen = true;
    this.shopSelectedIndex = 0;
    this.shopTab = 'rod';
    this.updateShopContent();
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
    });
  }

  updateShopContent() {
    if (!this.shopUIElement || !this.shopItemsListElement) return;
    
    // 既存のアイテム要素を削除（innerHTMLを使わずに）
    while (this.shopItemsListElement.firstChild) {
      this.shopItemsListElement.removeChild(this.shopItemsListElement.firstChild);
    }
    
    // アイテム要素のキャッシュをクリア
    this.shopItemElements = [];
    this.lastSelectedShopIndex = -1;
    
    let items: { id: string; name: string; icon: string; price: number; info: string; owned: boolean; equipped: boolean }[] = [];

    if (this.shopTab === 'rod') {
      items = rodConfigs.map(rod => ({
        id: rod.id,
        name: rod.name,
        icon: rod.icon,
        price: rod.price,
        info: `距離+${Math.round((rod.castDistanceBonus - 1) * 100)}% 捕獲+${Math.round((rod.catchRateBonus - 1) * 100)}% レア+${Math.round((rod.rareChanceBonus - 1) * 100)}%`,
        owned: this.hasRod(rod.id),
        equipped: this.playerData.equippedRodId === rod.id,
      }));
    } else if (this.shopTab === 'bait') {
      items = baitConfigs.map(bait => ({
        id: bait.id,
        name: `${bait.name} (×${bait.quantity})`,
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
      items = inventoryUpgradeConfigs.map(inv => ({
        id: inv.id,
        name: inv.name,
        icon: inv.icon,
        price: inv.price,
        info: `${inv.slotCount}スロット`,
        owned: this.playerData.maxInventorySlots >= inv.slotCount,
        equipped: this.playerData.maxInventorySlots === inv.slotCount,
      }));
    }

    items.forEach((item, index) => {
      // 名前の色
      const nameColor = item.equipped ? '#00ff00' : (item.owned ? '#aaaaaa' : '#ffffff');

      // 価格または状態
      let priceText = '';
      let priceColor = '#ffff00';
      if (item.equipped) {
        priceText = '装備中';
        priceColor = '#00ff00';
      } else if (item.owned && this.shopTab !== 'bait') {
        priceText = '所持';
        priceColor = '#888888';
      } else if (item.price === 0) {
        priceText = '無料';
        priceColor = '#00ff00';
      } else {
        priceText = `${item.price.toLocaleString()} G`;
        priceColor = this.playerData.money >= item.price ? '#ffff00' : '#ff4444';
      }

      // DOM要素を直接作成（innerHTMLを使わない）
      const itemEl = document.createElement('div');
      itemEl.className = 'shop-item';
      itemEl.setAttribute('data-index', index.toString());
      
      const iconContainer = document.createElement('div');
      iconContainer.className = 'shop-item-icon';
      if (this.textures.exists(item.id)) {
        const canvas = document.createElement('canvas');
        canvas.className = 'shop-item-icon-image';
        canvas.width = 40;
        canvas.height = 40;
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
      
      const nameEl = document.createElement('div');
      nameEl.className = 'shop-item-name';
      nameEl.textContent = item.name;
      nameEl.style.color = nameColor;
      if (item.equipped) nameEl.style.fontWeight = 'bold';
      
      const descEl = document.createElement('div');
      descEl.className = 'shop-item-desc';
      descEl.textContent = item.info;
      
      infoContainer.appendChild(nameEl);
      infoContainer.appendChild(descEl);
      
      const priceEl = document.createElement('div');
      priceEl.className = 'shop-item-price';
      priceEl.textContent = priceText;
      priceEl.style.color = priceColor;
      
      itemEl.appendChild(iconContainer);
      itemEl.appendChild(infoContainer);
      itemEl.appendChild(priceEl);
      
      this.shopItemsListElement.appendChild(itemEl);
    });

    // アイテム要素をキャッシュしてイベントリスナーを追加
    const itemElements = Array.from(this.shopItemsListElement.querySelectorAll('.shop-item')) as HTMLElement[];
    this.shopItemElements = itemElements;
    
    itemElements.forEach((itemEl, index) => {
      itemEl.addEventListener('click', () => {
        this.shopSelectedIndex = index;
        this.updateShopSelection();
        this.purchaseOrEquipItem();
      });
      itemEl.addEventListener('mouseenter', () => {
        this.shopSelectedIndex = index;
        this.updateShopSelection();
      });
      
      // 画像を描画（画像がある場合）
      const item = items[index];
      if (item && this.textures.exists(item.id)) {
        const canvas = itemEl.querySelector('.shop-item-icon-image') as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const frame = this.textures.getFrame(item.id);
            ctx.clearRect(0, 0, 40, 40);
            const sourceImage = frame.source.image as HTMLImageElement;
            if (sourceImage) {
              ctx.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, 40, 40);
            }
          }
        }
      }
    });

    // 所持金を更新
    if (this.shopMoneyElement) {
      this.shopMoneyElement.textContent = `💰 所持金: ${this.playerData.money.toLocaleString()} G`;
    }

    this.updateShopSelection();
  }

  private lastSelectedShopIndex: number = -1;
  private shopItemElements: HTMLElement[] = [];

  updateShopSelection() {
    if (!this.shopUIElement) return;
    
    // 前回と同じインデックスの場合はスキップ（最適化）
    if (this.shopSelectedIndex === this.lastSelectedShopIndex) {
      return;
    }
    
    // 前回選択されていたアイテムからクラスを削除
    if (this.lastSelectedShopIndex >= 0 && this.shopItemElements[this.lastSelectedShopIndex]) {
      this.shopItemElements[this.lastSelectedShopIndex].classList.remove('selected');
    }
    
    // 選択されたアイテムにクラスを追加
    if (this.shopItemElements[this.shopSelectedIndex]) {
      this.shopItemElements[this.shopSelectedIndex].classList.add('selected');
    }
    
    this.lastSelectedShopIndex = this.shopSelectedIndex;
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
      savePlayerData(this.playerData);
      this.updateShopContent();
      this.showResult(`${lure.name}を装備した！`, 1500);
    } else if (this.playerData.money >= lure.price) {
      // 購入
      this.playerData.money -= lure.price;
      this.playerData.ownedLures.push(lure.id);
      this.playerData.equippedLureId = lure.id;
      savePlayerData(this.playerData);
      this.updateStatusUI();
      this.updateShopContent();
      this.showResult(`${lure.name}を購入！`, 1500);
    } else {
      this.showResult('お金が足りません...', 1500);
    }
  }

  handleInventoryUpgrade() {
    const upgrade = inventoryUpgradeConfigs[this.shopSelectedIndex];
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

  handleShopNavigation() {
    let itemCount = 0;
    if (this.shopTab === 'rod') itemCount = rodConfigs.length;
    else if (this.shopTab === 'bait') itemCount = baitConfigs.length;
    else if (this.shopTab === 'lure') itemCount = lureConfigs.length;
    else if (this.shopTab === 'inventory') itemCount = inventoryUpgradeConfigs.length;

    let newIndex = this.shopSelectedIndex;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        if (this.shopSelectedIndex > 0) newIndex--;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        if (this.shopSelectedIndex < itemCount - 1) newIndex++;
    }

    if (newIndex !== this.shopSelectedIndex) {
        this.shopSelectedIndex = newIndex;
        this.updateShopSelection();
    }
  }
}
