import Phaser from 'phaser';
import type { AreaConfig } from './areaConfig';
import { PLACEHOLDER_MAP } from './areaConfig';

/** 仮マップの装飾を3エリアで同じ見た目に揃える */
function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function createPlaceholderMap(scene: Phaser.Scene, area: AreaConfig): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(0);
  const { width: mapWidth, height: mapHeight } = PLACEHOLDER_MAP;
  const rng = createSeededRng(20260913);

  layer.add(scene.add.rectangle(0, 0, mapWidth, mapHeight, 0x5a9f3a).setOrigin(0));

  for (let i = 0; i < 100; i++) {
    const x = randInt(rng, 0, mapWidth);
    const y = randInt(rng, 250, mapHeight);
    const size = randInt(rng, 20, 50);
    layer.add(scene.add.circle(x, y, size, 0x4a8f2a, 0.3));
  }

  layer.add(scene.add.ellipse(600, 200, 900, 350, 0xc2b280).setOrigin(0.5));
  layer.add(scene.add.ellipse(600, 200, 850, 300, 0x4fa4f4).setOrigin(0.5));
  layer.add(scene.add.ellipse(600, 190, 650, 200, 0x3d8bd4).setOrigin(0.5));
  for (let i = 0; i < 15; i++) {
    const x = randInt(rng, 250, 950);
    const y = randInt(rng, 80, 280);
    layer.add(scene.add.ellipse(x, y, 8, 4, 0xffffff, 0.4));
  }

  layer.add(scene.add.ellipse(150, 700, 250, 200, 0xc2b280).setOrigin(0.5));
  layer.add(scene.add.ellipse(150, 700, 220, 170, 0x4fa4f4).setOrigin(0.5));
  layer.add(scene.add.ellipse(150, 695, 150, 100, 0x3d8bd4).setOrigin(0.5));

  layer.add(scene.add.rectangle(1100, 400, 120, 500, 0xc2b280).setOrigin(0.5));
  layer.add(scene.add.rectangle(1100, 400, 80, 500, 0x4fa4f4).setOrigin(0.5));
  layer.add(scene.add.rectangle(1100, 400, 50, 500, 0x3d8bd4, 0.5).setOrigin(0.5));

  const pathY = 450;
  const pathH = 56;
  layer.add(scene.add.rectangle(70, pathY, 140, pathH, 0x8b6914).setOrigin(0.5).setDepth(3));
  layer.add(scene.add.rectangle(70, pathY, 128, 40, 0xa07a22).setOrigin(0.5).setDepth(3));
  layer.add(scene.add.rectangle(1118, pathY, 164, pathH, 0x8b6914).setOrigin(0.5).setDepth(3));
  layer.add(scene.add.rectangle(1118, pathY, 148, 40, 0xa07a22).setOrigin(0.5).setDepth(3));

  const plankXs = [1052, 1074, 1096, 1118, 1140];
  for (const x of plankXs) {
    layer.add(scene.add.rectangle(x, pathY, 18, 58, 0x6b4423).setOrigin(0.5).setDepth(4));
    layer.add(scene.add.rectangle(x, pathY - 2, 14, 48, 0x8b5a2b).setOrigin(0.5).setDepth(4));
  }
  layer.add(scene.add.rectangle(1100, pathY - 30, 168, 6, 0x4a2f14).setOrigin(0.5).setDepth(4));
  layer.add(scene.add.rectangle(1100, pathY + 30, 168, 6, 0x4a2f14).setOrigin(0.5).setDepth(4));

  const treePositions = [
    { x: 100, y: 450 }, { x: 50, y: 520 }, { x: 180, y: 480 },
    { x: 300, y: 600 }, { x: 350, y: 700 }, { x: 280, y: 800 },
    { x: 900, y: 500 }, { x: 950, y: 600 }, { x: 850, y: 700 },
    { x: 500, y: 750 }, { x: 700, y: 800 }, { x: 600, y: 850 },
  ];
  for (const pos of treePositions) {
    layer.add(scene.add.rectangle(pos.x, pos.y + 20, 16, 30, 0x8b5a2b).setOrigin(0.5));
    layer.add(scene.add.circle(pos.x, pos.y - 10, 28, 0x2d5a1d));
    layer.add(scene.add.circle(pos.x - 12, pos.y, 20, 0x3d6a2d));
    layer.add(scene.add.circle(pos.x + 12, pos.y, 20, 0x3d6a2d));
  }

  const rockPositions = [
    { x: 400, y: 450 }, { x: 750, y: 550 }, { x: 200, y: 850 },
    { x: 1000, y: 750 }, { x: 550, y: 650 },
  ];
  for (const pos of rockPositions) {
    layer.add(scene.add.ellipse(pos.x, pos.y, 40, 25, 0x666666).setOrigin(0.5));
    layer.add(scene.add.ellipse(pos.x - 5, pos.y - 5, 30, 18, 0x888888).setOrigin(0.5));
  }

  const flowerColors = [0xff6b6b, 0xffd93d, 0xffffff, 0xff9ff3];
  for (let i = 0; i < 30; i++) {
    const x = randInt(rng, 50, mapWidth - 150);
    const y = randInt(rng, 400, mapHeight - 50);
    const color = flowerColors[randInt(rng, 0, flowerColors.length - 1)];
    layer.add(scene.add.circle(x, y, 4, color));
  }

  if (area.bulletinBoard) {
    const bb = area.bulletinBoard;
    layer.add(scene.add.rectangle(bb.x, bb.y + 8, 12, 50, 0x8b5a2b).setOrigin(0.5).setDepth(5));
    layer.add(scene.add.rectangle(bb.x, bb.y - 18, 72, 52, 0xc9a66b).setOrigin(0.5).setDepth(5));
    layer.add(scene.add.rectangle(bb.x - 14, bb.y - 22, 18, 14, 0xfff8e7).setOrigin(0.5).setDepth(6));
    layer.add(scene.add.rectangle(bb.x + 10, bb.y - 14, 16, 12, 0xfff8e7).setOrigin(0.5).setDepth(6));
    layer.add(scene.add.rectangle(bb.x + 2, bb.y - 6, 20, 14, 0xfff8e7).setOrigin(0.5).setDepth(6));
  }

  for (const sign of area.signs) {
    layer.add(scene.add.rectangle(sign.x, sign.y + 18, 8, 36, 0x6b4423).setOrigin(0.5).setDepth(6));
    layer.add(scene.add.rectangle(sign.x, sign.y, 72, 28, 0xc9a66b).setOrigin(0.5).setDepth(6));
    layer.add(scene.add.rectangle(sign.x, sign.y, 62, 20, 0xfff8e7).setOrigin(0.5).setDepth(7));
    const text = scene.add
      .text(sign.x, sign.y, sign.label, {
        fontFamily: 'DotGothic16, sans-serif',
        fontSize: '12px',
        color: '#3a2415',
      })
      .setOrigin(0.5)
      .setDepth(8)
      .setResolution(2);
    layer.add(text);
  }

  return layer;
}
