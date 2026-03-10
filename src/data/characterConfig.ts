// キャラクター選択用：一覧は public/images/character/*.png をスキャンして
// scripts/generate-character-list.mjs が characterList.generated.ts に生成する。
// npm run dev / npm run build の前に自動実行される。

export type CharacterConfig = {
  id: string;
  label: string;
  sheetPath: string;
};

export {
  characterConfigs,
  getCharacterById,
  getDefaultCharacterId,
} from './characterList.generated';
