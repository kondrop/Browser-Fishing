// Auto-generated from public/images/character/*.png — do not edit

export const characterConfigs: { id: string; label: string; sheetPath: string }[] = [
  { id: "basic_character_v1", label: "Basic character v1", sheetPath: "images/character/Basic character v1.png" },
  { id: "character_1_v1", label: "Character 1 v1", sheetPath: "images/character/Character 1 v1.png" },
  { id: "character_2_v1", label: "Character 2 v1", sheetPath: "images/character/Character 2 v1.png" },
  { id: "character_4_v1", label: "Character 4 v1", sheetPath: "images/character/Character 4 v1.png" },
];

export function getCharacterById(id: string) {
  return characterConfigs.find((c) => c.id === id);
}

export function getDefaultCharacterId(): string { return characterConfigs[0]?.id ?? "basic_character_v1"; }
