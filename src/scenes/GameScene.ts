import Phaser from 'phaser';
import { config } from '../config';
import type { FishConfig } from '../data/fishConfig';
import { getRandomFish, rarityStars, rarityColors, getRealFishCount, getFishById, fishDatabase, type RarityBonuses } from '../data/fish';
import type { PlayerData } from '../data/inventory';
import { loadPlayerData, savePlayerData, addFishToInventory, getInventoryCount, sellAllFish, addBait, consumeBait, getBaitCount } from '../data/inventory';
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
  private resultText!: Phaser.GameObjects.Text;
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

  // ステータスUI
  private moneyText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private collectionText!: Phaser.GameObjects.Text;

  // インベントリUI
  private inventoryContainer!: Phaser.GameObjects.Container;
  private inventorySlots: Phaser.GameObjects.Container[] = [];
  private inventoryOpen: boolean = false;
  private selectedSlotIndex: number = 0;
  private selectionCursor!: Phaser.GameObjects.Rectangle;

  // 詳細モーダル
  private detailModalContainer!: Phaser.GameObjects.Container;
  private detailModalOpen: boolean = false;

  // 図鑑UI
  private bookContainer!: Phaser.GameObjects.Container;
  private bookSlots: Phaser.GameObjects.Container[] = [];
  private bookOpen: boolean = false;
  private bookPage: number = 0;
  private bookSelectedIndex: number = 0;
  private bookSelectionCursor!: Phaser.GameObjects.Rectangle;
  private bookPageText!: Phaser.GameObjects.Text;
  private bookDetailContainer!: Phaser.GameObjects.Container;
  private bookDetailOpen: boolean = false;

  // ショップUI
  private shopContainer!: Phaser.GameObjects.Container;
  private shopOpen: boolean = false;
  private shopSelectedIndex: number = 0;
  private shopSelectionCursor!: Phaser.GameObjects.Rectangle;
  private shopTab: 'rod' | 'bait' | 'lure' | 'inventory' = 'rod';

  // 操作説明テキスト
  private controlsText!: Phaser.GameObjects.Text;

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

    this.resultText = this.add.text(0, 0, '', {
        fontSize: `${Math.round(config.result['6-1_フォントサイズ'] * 1.25)}px`,
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setVisible(false).setDepth(100);

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
    
    this.uiPlayerBar = this.add.rectangle(0, 0, fightCfg['5-3_バー幅'], fightCfg['5-3_バー高さ'], 0x00ff00);
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

        // ESCキーで閉じる
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.detailModalOpen) {
                this.closeDetailModal();
            } else if (this.inventoryOpen) {
                this.closeInventory();
            } else if (this.bookDetailOpen) {
                this.closeBookDetail();
            } else if (this.bookOpen) {
                this.closeBook();
            } else if (this.shopOpen) {
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
    
    this.controlsText = this.add.text(10, 10, '移動: 矢印 | 釣り: SPACE | 売却: E | 持ち物: I | 図鑑: B | ショップ: S', { 
        fontSize: '18px',
        color: '#fff', 
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 6 }
    }).setDepth(200);

    // UI位置を画面サイズに合わせて初期化
    this.updateUIPositions();

    // 画面リサイズ時にUI位置を更新
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        // カメラサイズを更新
        this.cameras.main.setSize(gameSize.width, gameSize.height);
        // UI位置を更新
        this.updateUIPositions();
    });
  }

  createStatusUI() {
    // 所持金（25%大きく）
    this.moneyText = this.add.text(0, 0, '', {
        fontSize: '20px',  // 16 * 1.25
        color: '#ffff00',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setDepth(200);

    // インベントリ数
    this.inventoryText = this.add.text(0, 0, '', {
        fontSize: '18px',  // 14 * 1.25 ≈ 18
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setDepth(200);

    // 図鑑コンプ率
    this.collectionText = this.add.text(0, 0, '', {
        fontSize: '18px',  // 14 * 1.25 ≈ 18
        color: '#aaffaa',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setDepth(200);

    this.updateStatusUI();
  }

  updateStatusUI() {
    this.moneyText.setText(`💰 ${this.playerData.money.toLocaleString()} G`);
    this.inventoryText.setText(`🎒 ${getInventoryCount(this.playerData)}/${this.playerData.maxInventorySlots}`);
    
    const totalFish = getRealFishCount();
    const caught = Array.from(this.playerData.caughtFishIds).filter(id => !id.startsWith('junk')).length;
    this.collectionText.setText(`📖 図鑑 ${caught}/${totalFish}`);
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
    const screenLeft = scrollX;
    const screenTop = scrollY;
    const screenRight = scrollX + width;
    const screenBottom = scrollY + height;

    // ヒントテキスト（画面上部中央）
    this.hintText.setPosition(screenCenterX, screenTop + 100);

    // 結果テキスト（画面中央）
    this.resultText.setPosition(screenCenterX, screenCenterY);

    // パワーゲージ（画面下部中央）
    this.powerBarBg.setPosition(screenCenterX, screenBottom - 50);
    this.powerBarFill.setPosition(screenCenterX - 98, screenBottom - 50);

    // ファイトUI（画面右側）
    this.fightContainer.setPosition(screenRight - 80, screenCenterY);

    // ステータスUI（画面右上）
    this.moneyText.setPosition(screenRight - 10, screenTop + 10);
    this.inventoryText.setPosition(screenRight - 10, screenTop + 45);
    this.collectionText.setPosition(screenRight - 10, screenTop + 78);

    // 操作説明（画面左上）
    this.controlsText.setPosition(screenLeft + 10, screenTop + 10);

    // インベントリ（画面中央）
    this.inventoryContainer.setPosition(screenCenterX, screenCenterY);

    // 詳細モーダル（画面中央）
    this.detailModalContainer.setPosition(screenCenterX, screenCenterY);

    // 図鑑（画面中央）
    this.bookContainer.setPosition(screenCenterX, screenCenterY);

    // 図鑑詳細モーダル（画面中央）
    this.bookDetailContainer.setPosition(screenCenterX, screenCenterY);

    // ショップ（画面中央）
    this.shopContainer.setPosition(screenCenterX, screenCenterY);
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
    // UIをカメラ位置に追従させる（毎フレーム更新）
    this.updateUIPositions();

    // インベントリが開いている場合は専用の操作
    if (this.inventoryOpen) {
        this.handleInventoryNavigation();
        return;
    }

    // 図鑑が開いている場合は専用の操作
    if (this.bookOpen) {
        this.handleBookNavigation();
        return;
    }

    // ショップが開いている場合は専用の操作
    if (this.shopOpen) {
        this.handleShopNavigation();
        return;
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
    this.resultText.setVisible(false);

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

    // 判定
    const barHeight = cfg['5-9_バー判定範囲'];
    const isCatching = (this.fishBarPosition >= this.playerBarPosition && 
                        this.fishBarPosition <= this.playerBarPosition + barHeight);

    // 装備中の竿のボーナスを取得
    const equippedRod = getRodById(this.playerData.equippedRodId);
    const rodCatchBonus = equippedRod?.catchRateBonus || 1.0;

    if (isCatching) {
        // 全体設定 × 魚ごとの捕まえやすさ × 竿のボーナス
        this.catchProgress += cfg['5-10_ゲージ増加速度'] * catchRate * rodCatchBonus * dt;
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
            savePlayerData(this.playerData);
            this.updateStatusUI();

            const stars = rarityStars[this.currentFish.rarity];
            const duration = config.result['6-2_成功表示時間'] * 1000;
            this.showResult(`${this.currentFish.emoji} ${this.currentFish.name} ${stars}\nバッグ満杯！自動売却 +${earnings} G`, duration);
            return;
        }

        // インベントリに追加
        addFishToInventory(this.playerData, this.currentFish);
        savePlayerData(this.playerData);
        this.updateStatusUI();

        const stars = rarityStars[this.currentFish.rarity];
        const duration = config.result['6-2_成功表示時間'] * 1000;
        this.showResult(
            `${this.currentFish.emoji} ${this.currentFish.name} を釣った！\n${stars} | ${this.currentFish.price}G`,
            duration
        );
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
    this.resultText.setText(text).setVisible(true);
    
    this.time.delayedCall(duration, () => {
        if (this.state === FishingState.SUCCESS || this.state === FishingState.FAIL) {
            this.resetState();
        }
        this.resultText.setVisible(false);
    });
  }

  resetState() {
    this.state = FishingState.IDLE;
    this.cleanupFishingTools();
    this.resultText.setVisible(false);
    this.fightContainer.setVisible(false);
    this.hintText.setVisible(false);
  }

  // ============================================
  // インベントリUI
  // ============================================

  createInventoryUI() {
    const slotSize = 100;  // 80 * 1.25
    const padding = 10;    // 8 * 1.25
    const gridSize = 3;
    const maxRows = 6;  // 最大18スロット（3列×6行）
    const containerWidth = gridSize * slotSize + (gridSize + 1) * padding;
    // 高さは動的に計算（後で更新される）

    this.inventoryContainer = this.add.container(400, 300).setDepth(300).setVisible(false);

    // 背景（高さは後で更新）
    const bg = this.add.rectangle(0, 0, containerWidth, 400, 0x222222, 0.95)
        .setStrokeStyle(4, 0xffffff);
    this.inventoryContainer.add(bg);
    this.inventoryContainer.setData('bg', bg);

    // タイトル
    const title = this.add.text(0, -180, '🎒 インベントリ', {
        fontSize: '25px',  // 20 * 1.25
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setName('inventoryTitle');
    this.inventoryContainer.add(title);
    this.inventoryContainer.setData('title', title);

    // 選択カーソル
    this.selectionCursor = this.add.rectangle(0, 0, slotSize + 5, slotSize + 5)
        .setStrokeStyle(4, 0xffff00)
        .setFillStyle(0xffff00, 0.2);
    this.inventoryContainer.add(this.selectionCursor);

    // 最大18スロット作成（3列×6行）
    const startX = -((gridSize - 1) * (slotSize + padding)) / 2;
    const startY = -140;  // タイトルの下から開始

    for (let i = 0; i < maxRows * gridSize; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = startX + col * (slotSize + padding);
        const y = startY + row * (slotSize + padding);

        const slotContainer = this.add.container(x, y);

        // スロット背景（レア度で色が変わる）
        const slotBg = this.add.rectangle(0, 0, slotSize, slotSize, 0x333333)
            .setStrokeStyle(3, 0x555555)
            .setInteractive({ useHandCursor: true });

        // 魚の画像（スロット100px内に収める）
        const fishImage = this.add.image(0, -6, '').setVisible(false);

        // 魚の絵文字（画像がない場合のフォールバック）
        const fishEmoji = this.add.text(0, -6, '', {
            fontSize: '30px'  // 24 * 1.25
        }).setOrigin(0.5);

        // 魚の名前
        const nameText = this.add.text(0, 28, '', {
            fontSize: '13px',  // 10 * 1.25 ≈ 13
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 金額
        const priceText = this.add.text(0, 42, '', {
            fontSize: '11px',  // 9 * 1.25 ≈ 11
            color: '#ffdd44'
        }).setOrigin(0.5);

        slotContainer.add([slotBg, fishImage, fishEmoji, nameText, priceText]);
        slotContainer.setData('index', i);
        slotContainer.setData('slotBg', slotBg);
        slotContainer.setData('fishImage', fishImage);
        slotContainer.setData('fishEmoji', fishEmoji);
        slotContainer.setData('nameText', nameText);
        slotContainer.setData('priceText', priceText);

        // クリックイベント
        slotBg.on('pointerdown', () => {
            this.selectedSlotIndex = i;
            this.updateSelectionCursor();
            this.openDetailModal();
        });

        // ホバーイベント
        slotBg.on('pointerover', () => {
            this.selectedSlotIndex = i;
            this.updateSelectionCursor();
        });

        this.inventorySlots.push(slotContainer);
        this.inventoryContainer.add(slotContainer);
    }

    // 操作ヒント
    const hint = this.add.text(0, 200, '矢印: 選択 | Enter: 詳細 | I/ESC: 閉じる', {
        fontSize: '15px',  // 12 * 1.25
        color: '#aaaaaa'
    }).setOrigin(0.5);
    this.inventoryContainer.add(hint);
    this.inventoryContainer.setData('hint', hint);

    this.updateInventoryLayout();
    this.updateSelectionCursor();
  }

  updateInventoryLayout() {
    // 現在のmaxInventorySlotsに基づいてレイアウトを更新
    const slotSize = 100;
    const padding = 10;
    const gridSize = 3;
    const rows = Math.ceil(this.playerData.maxInventorySlots / gridSize);
    const containerHeight = rows * slotSize + (rows + 1) * padding + 75;

    // 背景の高さを更新
    const bg = this.inventoryContainer.getData('bg') as Phaser.GameObjects.Rectangle;
    if (bg) {
      bg.setSize(bg.width, containerHeight);
    }

    // タイトルの位置を更新（コンテナの上端から30px下）
    const title = this.inventoryContainer.getData('title') as Phaser.GameObjects.Text;
    if (title) {
      title.setY(-containerHeight / 2 + 30);
    }

    // ヒントの位置を更新
    const hint = this.inventoryContainer.getData('hint') as Phaser.GameObjects.Text;
    if (hint) {
      hint.setY(containerHeight / 2 - 25);
    }

    // スロットの位置を再計算
    const startX = -((gridSize - 1) * (slotSize + padding)) / 2;
    const startY = -containerHeight / 2 + 75;  // タイトルの下から開始

    // スロットの表示/非表示と位置を更新
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (i < this.playerData.maxInventorySlots) {
        slot.setVisible(true);
        // 位置を再計算
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = startX + col * (slotSize + padding);
        const y = startY + row * (slotSize + padding);
        slot.setPosition(x, y);
      } else {
        slot.setVisible(false);
      }
    }
  }

  createDetailModal() {
    this.detailModalContainer = this.add.container(400, 300).setDepth(400).setVisible(false);

    // 背景（25%大きく: 280→350, 220→275）
    const bg = this.add.rectangle(0, 0, 350, 275, 0x1a1a2e, 0.98)
        .setStrokeStyle(4, 0xffffff);
    this.detailModalContainer.add(bg);

    // 閉じるボタン
    const closeBtn = this.add.text(160, -120, '✕', {
        fontSize: '25px',  // 20 * 1.25
        color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeDetailModal());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));
    this.detailModalContainer.add(closeBtn);

    // 魚の画像
    const fishImage = this.add.image(0, -75, '').setDisplaySize(80, 80).setVisible(false).setName('fishImage');
    this.detailModalContainer.add(fishImage);

    // 魚の絵文字
    const emoji = this.add.text(0, -88, '', {
        fontSize: '60px'  // 48 * 1.25
    }).setOrigin(0.5).setName('emoji');
    this.detailModalContainer.add(emoji);

    // 魚の名前
    const nameText = this.add.text(0, -18, '', {
        fontSize: '28px',  // 22 * 1.25 ≈ 28
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setName('name');
    this.detailModalContainer.add(nameText);

    // レア度
    const rarityText = this.add.text(0, 10, '', {
        fontSize: '20px',  // 16 * 1.25
        color: '#ffaa00'
    }).setOrigin(0.5).setName('rarity');
    this.detailModalContainer.add(rarityText);

    // 説明
    const descText = this.add.text(0, 50, '', {
        fontSize: '16px',  // 13 * 1.25 ≈ 16
        color: '#cccccc',
        wordWrap: { width: 310, useAdvancedWrap: true },  // モーダル幅350px - パディング40px
        align: 'center'
    }).setOrigin(0.5, 0).setName('desc');
    this.detailModalContainer.add(descText);

    // 価格と所持数
    const infoText = this.add.text(0, 105, '', {
        fontSize: '18px',  // 14 * 1.25 ≈ 18
        color: '#ffffff'
    }).setOrigin(0.5).setName('info');
    this.detailModalContainer.add(infoText);
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
    this.updateInventoryLayout();  // レイアウトを更新
    this.updateInventorySlots();
    this.updateSelectionCursor();
    this.inventoryContainer.setVisible(true);
  }

  closeInventory() {
    this.inventoryOpen = false;
    this.inventoryContainer.setVisible(false);
    if (this.detailModalOpen) {
        this.closeDetailModal();
    }
  }

  updateInventorySlots() {
    // インベントリをフラット化（スタックを展開して個別表示）
    const flatInventory: string[] = [];
    for (const item of this.playerData.inventory) {
        for (let j = 0; j < item.count; j++) {
            flatInventory.push(item.fishId);
        }
    }
    
    // maxInventorySlotsに基づいてスロットを更新
    for (let i = 0; i < this.playerData.maxInventorySlots; i++) {
        const slot = this.inventorySlots[i];
        const fishImage = slot.getData('fishImage') as Phaser.GameObjects.Image;
        const fishEmoji = slot.getData('fishEmoji') as Phaser.GameObjects.Text;
        const nameText = slot.getData('nameText') as Phaser.GameObjects.Text;
        const priceText = slot.getData('priceText') as Phaser.GameObjects.Text;
        const slotBg = slot.getData('slotBg') as Phaser.GameObjects.Rectangle;

        if (i < flatInventory.length) {
            const fishId = flatInventory[i];
            const fish = getFishById(fishId);
            if (fish) {
                // 画像があるかチェック
                if (this.textures.exists(fishId)) {
                    fishImage.setTexture(fishId);
                    // スロットに収まるようにスケーリング（最大45x45）
                    const maxSize = 70;  // スロット内で大きく表示
                    const frame = this.textures.getFrame(fishId);
                    const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
                    fishImage.setScale(scale).setVisible(true);
                    fishEmoji.setVisible(false);
                } else {
                    fishImage.setVisible(false);
                    fishEmoji.setText(fish.emoji).setVisible(true);
                }
                
                nameText.setText(fish.name);
                priceText.setText(`${fish.price}G`);
                
                // レア度に応じた背景色
                const rarityColor = rarityColors[fish.rarity];
                slotBg.setFillStyle(rarityColor, 0.4);
                slotBg.setStrokeStyle(2, rarityColor);
            }
        } else {
            fishImage.setVisible(false);
            fishEmoji.setText('').setVisible(false);
            nameText.setText('');
            priceText.setText('');
            slotBg.setFillStyle(0x333333, 1);
            slotBg.setStrokeStyle(2, 0x555555);
        }
    }
  }

  updateSelectionCursor() {
    if (this.inventorySlots.length === 0) return;
    
    // selectedSlotIndexがmaxInventorySlotsを超えないようにする
    if (this.selectedSlotIndex >= this.playerData.maxInventorySlots) {
      this.selectedSlotIndex = Math.max(0, this.playerData.maxInventorySlots - 1);
    }
    
    const slot = this.inventorySlots[this.selectedSlotIndex];
    this.selectionCursor.setPosition(slot.x, slot.y);
  }

  openDetailModal() {
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
    const fishImage = this.detailModalContainer.getByName('fishImage') as Phaser.GameObjects.Image;
    const emoji = this.detailModalContainer.getByName('emoji') as Phaser.GameObjects.Text;
    const nameText = this.detailModalContainer.getByName('name') as Phaser.GameObjects.Text;
    const rarityText = this.detailModalContainer.getByName('rarity') as Phaser.GameObjects.Text;
    const descText = this.detailModalContainer.getByName('desc') as Phaser.GameObjects.Text;
    const infoText = this.detailModalContainer.getByName('info') as Phaser.GameObjects.Text;

    // 画像があれば画像、なければ絵文字
    if (this.textures.exists(fish.id)) {
        fishImage.setTexture(fish.id);
        // モーダル用にスケーリング（最大64x64）
        const maxSize = 80;  // 64 * 1.25
        const frame = this.textures.getFrame(fish.id);
        const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
        fishImage.setScale(scale).setVisible(true);
        emoji.setVisible(false);
    } else {
        fishImage.setVisible(false);
        emoji.setText(fish.emoji).setVisible(true);
    }
    
    nameText.setText(fish.name);
    rarityText.setText(rarityStars[fish.rarity]);
    descText.setText(fish.description);
    infoText.setText(`💰 ${fish.price}G`);

    // レア度に応じた色
    const color = rarityColors[fish.rarity];
    rarityText.setColor(`#${color.toString(16).padStart(6, '0')}`);

    this.detailModalContainer.setVisible(true);
  }

  closeDetailModal() {
    this.detailModalOpen = false;
    this.detailModalContainer.setVisible(false);
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
        this.updateSelectionCursor();
    }
  }

  // ============================================
  // 図鑑UI
  // ============================================

  createBookUI() {
    const slotSize = 100;  // 80 * 1.25
    const padding = 10;    // 8 * 1.25
    const gridCols = 4;
    const gridRows = 3;
    const slotsPerPage = gridCols * gridRows;
    const containerWidth = gridCols * slotSize + (gridCols + 1) * padding;
    const containerHeight = gridRows * slotSize + (gridRows + 1) * padding + 112;  // 90 * 1.25

    this.bookContainer = this.add.container(400, 300).setDepth(300).setVisible(false);

    // 背景
    const bg = this.add.rectangle(0, 0, containerWidth, containerHeight, 0x2a1a0a, 0.95)
        .setStrokeStyle(5, 0x8b4513);
    this.bookContainer.add(bg);

    // タイトル
    const title = this.add.text(0, -containerHeight / 2 + 30, '📖 魚図鑑', {
        fontSize: '28px',  // 22 * 1.25 ≈ 28
        color: '#ffe4b5',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    this.bookContainer.add(title);

    // コンプリート率
    const progressText = this.add.text(0, -containerHeight / 2 + 62, '', {
        fontSize: '18px',  // 14 * 1.25 ≈ 18
        color: '#aaaaaa'
    }).setOrigin(0.5).setName('progressText');
    this.bookContainer.add(progressText);

    // 選択カーソル
    this.bookSelectionCursor = this.add.rectangle(0, 0, slotSize + 5, slotSize + 5)
        .setStrokeStyle(4, 0xffff00)
        .setFillStyle(0xffff00, 0.2);
    this.bookContainer.add(this.bookSelectionCursor);

    // スロット作成
    const startX = -((gridCols - 1) * (slotSize + padding)) / 2;
    const startY = -((gridRows - 1) * (slotSize + padding)) / 2 + 38;

    for (let i = 0; i < slotsPerPage; i++) {
        const row = Math.floor(i / gridCols);
        const col = i % gridCols;
        const x = startX + col * (slotSize + padding);
        const y = startY + row * (slotSize + padding);

        const slotContainer = this.add.container(x, y);

        // スロット背景
        const slotBg = this.add.rectangle(0, 0, slotSize, slotSize, 0x333333)
            .setStrokeStyle(3, 0x555555)
            .setInteractive({ useHandCursor: true });

        // 魚の画像（スロット100px内に収める）
        const fishImage = this.add.image(0, -6, '').setVisible(false);

        // 魚の絵文字（またはシルエット）
        const fishEmoji = this.add.text(0, -6, '', {
            fontSize: '30px'  // 24 * 1.25
        }).setOrigin(0.5);

        // 魚の名前
        const nameText = this.add.text(0, 28, '', {
            fontSize: '11px',  // 9 * 1.25 ≈ 11
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // レア度
        const rarityText = this.add.text(0, 42, '', {
            fontSize: '10px',  // 8 * 1.25
            color: '#ffaa00'
        }).setOrigin(0.5);

        slotContainer.add([slotBg, fishImage, fishEmoji, nameText, rarityText]);
        slotContainer.setData('index', i);
        slotContainer.setData('slotBg', slotBg);
        slotContainer.setData('fishImage', fishImage);
        slotContainer.setData('fishEmoji', fishEmoji);
        slotContainer.setData('nameText', nameText);
        slotContainer.setData('rarityText', rarityText);

        // クリックイベント
        slotBg.on('pointerdown', () => {
            this.bookSelectedIndex = i;
            this.updateBookSelectionCursor();
            this.openBookDetail();
        });

        // ホバーイベント
        slotBg.on('pointerover', () => {
            this.bookSelectedIndex = i;
            this.updateBookSelectionCursor();
        });

        this.bookSlots.push(slotContainer);
        this.bookContainer.add(slotContainer);
    }

    // ページ表示
    this.bookPageText = this.add.text(0, containerHeight / 2 - 56, '', {
        fontSize: '18px',  // 14 * 1.25 ≈ 18
        color: '#ffffff'
    }).setOrigin(0.5);
    this.bookContainer.add(this.bookPageText);

    // 操作ヒント
    const hint = this.add.text(0, containerHeight / 2 - 25, 'Q/W: ページ | 矢印: 選択 | Enter: 詳細 | B/ESC: 閉じる', {
        fontSize: '14px',  // 11 * 1.25 ≈ 14
        color: '#aaaaaa'
    }).setOrigin(0.5);
    this.bookContainer.add(hint);

    // 図鑑詳細モーダル
    this.createBookDetailModal();

    this.updateBookSelectionCursor();
  }

  createBookDetailModal() {
    this.bookDetailContainer = this.add.container(400, 300).setDepth(400).setVisible(false);

    // 背景（25%大きく: 300→375, 250→312）
    const bg = this.add.rectangle(0, 0, 375, 312, 0x1a1a2e, 0.98)
        .setStrokeStyle(4, 0xffffff);
    this.bookDetailContainer.add(bg);

    // 閉じるボタン
    const closeBtn = this.add.text(170, -138, '✕', {
        fontSize: '25px',  // 20 * 1.25
        color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeBookDetail());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));
    this.bookDetailContainer.add(closeBtn);

    // 魚の画像
    const fishImage = this.add.image(0, -88, '').setDisplaySize(80, 80).setVisible(false).setName('fishImage');
    this.bookDetailContainer.add(fishImage);

    // 魚の絵文字
    const emoji = this.add.text(0, -100, '', {
        fontSize: '60px'  // 48 * 1.25
    }).setOrigin(0.5).setName('emoji');
    this.bookDetailContainer.add(emoji);

    // 魚の名前
    const nameText = this.add.text(0, -25, '', {
        fontSize: '28px',  // 22 * 1.25 ≈ 28
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setName('name');
    this.bookDetailContainer.add(nameText);

    // レア度
    const rarityText = this.add.text(0, 5, '', {
        fontSize: '20px',  // 16 * 1.25
        color: '#ffaa00'
    }).setOrigin(0.5).setName('rarity');
    this.bookDetailContainer.add(rarityText);

    // 説明
    const descText = this.add.text(0, 50, '', {
        fontSize: '15px',  // 12 * 1.25
        color: '#cccccc',
        wordWrap: { width: 335, useAdvancedWrap: true },  // モーダル幅375px - パディング40px
        align: 'center'
    }).setOrigin(0.5, 0).setName('desc');
    this.bookDetailContainer.add(descText);

    // 価格
    const priceText = this.add.text(0, 120, '', {
        fontSize: '18px',  // 14 * 1.25 ≈ 18
        color: '#ffdd44'
    }).setOrigin(0.5).setName('price');
    this.bookDetailContainer.add(priceText);
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
    this.updateBookSlots();
    this.updateBookSelectionCursor();
    this.bookContainer.setVisible(true);
  }

  closeBook() {
    this.bookOpen = false;
    this.bookContainer.setVisible(false);
    if (this.bookDetailOpen) {
        this.closeBookDetail();
    }
  }

  // ゴミ以外の魚リストを取得
  getRealFishList() {
    return fishDatabase.filter(f => !f.id.startsWith('junk'));
  }

  updateBookSlots() {
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const totalPages = Math.ceil(fishList.length / slotsPerPage);
    const startIndex = this.bookPage * slotsPerPage;
    
    // コンプリート率更新
    const progressText = this.bookContainer.getByName('progressText') as Phaser.GameObjects.Text;
    const caughtCount = Array.from(this.playerData.caughtFishIds).filter(id => !id.startsWith('junk')).length;
    const totalFish = fishList.length;
    const percentage = Math.floor((caughtCount / totalFish) * 100);
    progressText.setText(`発見: ${caughtCount}/${totalFish} (${percentage}%)`);

    // ページ表示更新
    this.bookPageText.setText(`ページ ${this.bookPage + 1}/${totalPages}`);

    for (let i = 0; i < slotsPerPage; i++) {
        const slot = this.bookSlots[i];
        const fishImage = slot.getData('fishImage') as Phaser.GameObjects.Image;
        const fishEmoji = slot.getData('fishEmoji') as Phaser.GameObjects.Text;
        const nameText = slot.getData('nameText') as Phaser.GameObjects.Text;
        const rarityText = slot.getData('rarityText') as Phaser.GameObjects.Text;
        const slotBg = slot.getData('slotBg') as Phaser.GameObjects.Rectangle;

        const fishIndex = startIndex + i;
        
        if (fishIndex < fishList.length) {
            const fish = fishList[fishIndex];
            const isCaught = this.playerData.caughtFishIds.has(fish.id);
            
            if (isCaught) {
                // 発見済み - 画像があれば画像、なければ絵文字
                if (this.textures.exists(fish.id)) {
                    fishImage.setTexture(fish.id);
                    // スロットに収まるようにスケーリング（最大45x45）
                    const maxSize = 70;  // スロット内で大きく表示
                    const frame = this.textures.getFrame(fish.id);
                    const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
                    fishImage.setScale(scale).setVisible(true);
                    fishEmoji.setVisible(false);
                } else {
                    fishImage.setVisible(false);
                    fishEmoji.setText(fish.emoji).setVisible(true);
                }
                
                nameText.setText(fish.name);
                rarityText.setText(rarityStars[fish.rarity]);
                
                const color = rarityColors[fish.rarity];
                slotBg.setFillStyle(color, 0.3);
                slotBg.setStrokeStyle(2, color);
                rarityText.setColor(`#${color.toString(16).padStart(6, '0')}`);
            } else {
                // 未発見（シルエット）
                fishImage.setVisible(false);
                fishEmoji.setText('❓').setVisible(true);
                nameText.setText('？？？');
                rarityText.setText(rarityStars[fish.rarity]);
                
                slotBg.setFillStyle(0x222222, 1);
                slotBg.setStrokeStyle(2, 0x444444);
                rarityText.setColor('#666666');
            }
            
            slot.setVisible(true);
        } else {
            // 空きスロット
            slot.setVisible(false);
        }
    }
  }

  updateBookSelectionCursor() {
    if (this.bookSlots.length === 0) return;
    
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const startIndex = this.bookPage * slotsPerPage;
    const visibleCount = Math.min(slotsPerPage, fishList.length - startIndex);
    
    // 選択インデックスが範囲外なら調整
    if (this.bookSelectedIndex >= visibleCount) {
        this.bookSelectedIndex = Math.max(0, visibleCount - 1);
    }
    
    const slot = this.bookSlots[this.bookSelectedIndex];
    if (slot && slot.visible) {
        this.bookSelectionCursor.setPosition(slot.x, slot.y);
        this.bookSelectionCursor.setVisible(true);
    } else {
        this.bookSelectionCursor.setVisible(false);
    }
  }

  bookPrevPage() {
    if (this.bookPage > 0) {
        this.bookPage--;
        this.bookSelectedIndex = 0;
        this.updateBookSlots();
        this.updateBookSelectionCursor();
    }
  }

  bookNextPage() {
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const totalPages = Math.ceil(fishList.length / slotsPerPage);
    
    if (this.bookPage < totalPages - 1) {
        this.bookPage++;
        this.bookSelectedIndex = 0;
        this.updateBookSlots();
        this.updateBookSelectionCursor();
    }
  }

  openBookDetail() {
    const fishList = this.getRealFishList();
    const slotsPerPage = 12;
    const fishIndex = this.bookPage * slotsPerPage + this.bookSelectedIndex;
    
    if (fishIndex >= fishList.length) return;
    
    const fish = fishList[fishIndex];
    const isCaught = this.playerData.caughtFishIds.has(fish.id);

    this.bookDetailOpen = true;

    const fishImage = this.bookDetailContainer.getByName('fishImage') as Phaser.GameObjects.Image;
    const emoji = this.bookDetailContainer.getByName('emoji') as Phaser.GameObjects.Text;
    const nameText = this.bookDetailContainer.getByName('name') as Phaser.GameObjects.Text;
    const rarityText = this.bookDetailContainer.getByName('rarity') as Phaser.GameObjects.Text;
    const descText = this.bookDetailContainer.getByName('desc') as Phaser.GameObjects.Text;
    const priceText = this.bookDetailContainer.getByName('price') as Phaser.GameObjects.Text;

    if (isCaught) {
        // 画像があれば画像、なければ絵文字
        if (this.textures.exists(fish.id)) {
            fishImage.setTexture(fish.id);
            // モーダル用にスケーリング（最大64x64）
            const maxSize = 80;  // 64 * 1.25
            const frame = this.textures.getFrame(fish.id);
            const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
            fishImage.setScale(scale).setVisible(true);
            emoji.setVisible(false);
        } else {
            fishImage.setVisible(false);
            emoji.setText(fish.emoji).setVisible(true);
        }
        
        nameText.setText(fish.name);
        rarityText.setText(rarityStars[fish.rarity]);
        descText.setText(fish.description);
        priceText.setText(`💰 売値: ${fish.price}G`);
        
        const color = rarityColors[fish.rarity];
        rarityText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    } else {
        fishImage.setVisible(false);
        emoji.setText('❓').setVisible(true);
        nameText.setText('？？？');
        rarityText.setText(rarityStars[fish.rarity]);
        descText.setText('まだ発見されていません...\nこの魚を釣って図鑑を完成させよう！');
        priceText.setText('');
        
        rarityText.setColor('#666666');
    }

    this.bookDetailContainer.setVisible(true);
  }

  closeBookDetail() {
    this.bookDetailOpen = false;
    this.bookDetailContainer.setVisible(false);
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
        this.updateBookSelectionCursor();
    }
  }

  // ============================================
  // ショップUI
  // ============================================

  createShopUI() {
    const containerWidth = 500;
    const containerHeight = 450;

    this.shopContainer = this.add.container(400, 300).setDepth(300).setVisible(false);

    // 背景
    const bg = this.add.rectangle(0, 0, containerWidth, containerHeight, 0x1a3a1a, 0.95)
        .setStrokeStyle(4, 0x4a7a4a);
    this.shopContainer.add(bg);

    // タイトル
    const title = this.add.text(0, -containerHeight / 2 + 30, '🏪 ショップ', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    this.shopContainer.add(title);

    // タブボタン
    const tabY = -containerHeight / 2 + 70;
    const tabs = [
      { id: 'rod', text: '🎣 竿', x: -180 },
      { id: 'bait', text: '🪱 エサ', x: -60 },
      { id: 'lure', text: '🎯 ルアー', x: 60 },
      { id: 'inventory', text: '🎒 バッグ', x: 180 },
    ];

    tabs.forEach(tab => {
      const tabBtn = this.add.text(tab.x, tabY, tab.text, {
          fontSize: '18px',
          color: '#ffffff',
          backgroundColor: '#2a5a2a',
          padding: { x: 15, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      tabBtn.on('pointerdown', () => {
          this.shopTab = tab.id as 'rod' | 'bait' | 'lure' | 'inventory';
          this.shopSelectedIndex = 0;
          this.updateShopContent();
      });
      tabBtn.on('pointerover', () => tabBtn.setBackgroundColor('#3a7a3a'));
      tabBtn.on('pointerout', () => tabBtn.setBackgroundColor('#2a5a2a'));
      tabBtn.setName(`tab_${tab.id}`);
      this.shopContainer.add(tabBtn);
    });

    // 選択カーソル
    this.shopSelectionCursor = this.add.rectangle(0, 0, 460, 60)
        .setStrokeStyle(3, 0xffff00)
        .setFillStyle(0xffff00, 0.1);
    this.shopContainer.add(this.shopSelectionCursor);

    // アイテムリスト領域（動的に更新）
    // 初期表示は updateShopContent() で行う

    // 所持金表示
    const moneyDisplay = this.add.text(0, containerHeight / 2 - 70, '', {
        fontSize: '20px',
        color: '#ffff00'
    }).setOrigin(0.5).setName('shopMoney');
    this.shopContainer.add(moneyDisplay);

    // 操作ヒント
    const hint = this.add.text(0, containerHeight / 2 - 30, '↑↓: 選択 | ENTER: 購入/装備 | S/ESC: 閉じる', {
        fontSize: '14px',
        color: '#aaaaaa'
    }).setOrigin(0.5);
    this.shopContainer.add(hint);
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
    this.shopContainer.setVisible(true);
  }

  closeShop() {
    this.shopOpen = false;
    this.shopContainer.setVisible(false);
  }

  updateShopContent() {
    // 古いアイテム表示を削除
    this.shopContainer.getAll().forEach(child => {
      if ((child as Phaser.GameObjects.GameObject).name?.startsWith('shopItem_')) {
        child.destroy();
      }
    });

    const startY = -80;
    const itemHeight = 65;
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
      const y = startY + index * itemHeight;
      
      // 背景
      const itemBg = this.add.rectangle(0, y, 460, 55, 0x2a4a2a, 0.8)
          .setStrokeStyle(1, 0x4a7a4a)
          .setInteractive({ useHandCursor: true })
          .setName(`shopItem_bg_${index}`);
      
      itemBg.on('pointerdown', () => {
          this.shopSelectedIndex = index;
          this.updateShopSelectionCursor();
          this.purchaseOrEquipItem();
      });
      itemBg.on('pointerover', () => {
          this.shopSelectedIndex = index;
          this.updateShopSelectionCursor();
      });
      this.shopContainer.add(itemBg);

      // アイコン（画像がある場合は画像、ない場合は絵文字）
      let iconElement: Phaser.GameObjects.GameObject;
      if (this.textures.exists(item.id)) {
        // 画像がある場合
        const iconImage = this.add.image(-200, y, item.id);
        iconImage.setDisplaySize(40, 40);  // アイコンサイズを40x40に設定
        iconImage.setOrigin(0.5);
        iconImage.setName(`shopItem_icon_${index}`);
        iconElement = iconImage;
      } else {
        // 画像がない場合は絵文字を使用
        const iconText = this.add.text(-200, y, item.icon, {
          fontSize: '28px'
        }).setOrigin(0.5).setName(`shopItem_icon_${index}`);
        iconElement = iconText;
      }
      this.shopContainer.add(iconElement);

      // 名前
      const nameColor = item.equipped ? '#00ff00' : (item.owned ? '#aaaaaa' : '#ffffff');
      const name = this.add.text(-140, y - 10, item.name, {
          fontSize: '16px',
          color: nameColor,
          fontStyle: item.equipped ? 'bold' : 'normal'
      }).setOrigin(0, 0.5).setName(`shopItem_name_${index}`);
      this.shopContainer.add(name);

      // 情報
      const info = this.add.text(-140, y + 12, item.info, {
          fontSize: '12px',
          color: '#888888'
      }).setOrigin(0, 0.5).setName(`shopItem_info_${index}`);
      this.shopContainer.add(info);

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
      
      const price = this.add.text(180, y, priceText, {
          fontSize: '16px',
          color: priceColor,
          fontStyle: 'bold'
      }).setOrigin(0.5).setName(`shopItem_price_${index}`);
      this.shopContainer.add(price);
    });

    // 所持金を更新
    const moneyDisplay = this.shopContainer.getByName('shopMoney') as Phaser.GameObjects.Text;
    if (moneyDisplay) {
      moneyDisplay.setText(`💰 所持金: ${this.playerData.money.toLocaleString()} G`);
    }

    this.updateShopSelectionCursor();
  }

  updateShopSelectionCursor() {
    const startY = -80;
    const itemHeight = 65;
    const y = startY + this.shopSelectedIndex * itemHeight;
    this.shopSelectionCursor.setPosition(0, y);
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
        this.updateShopSelectionCursor();
    }
  }
}
