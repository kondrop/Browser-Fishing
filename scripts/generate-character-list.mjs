/**
 * public/images/character/ 内の .png をスキャンし、
 * キャラシート一覧を src/data/characterList.generated.ts に出力する。
 * Shadow.png などスプライトシートでないファイルは除外する。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const characterDir = path.join(projectRoot, 'public', 'images', 'character');
const outPath = path.join(projectRoot, 'src', 'data', 'characterList.generated.ts');

const EXCLUDE_FILES = new Set(['Shadow.png']);

function slug(filename) {
  return filename
    .replace(/\.png$/i, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase() || 'character';
}

if (!fs.existsSync(characterDir)) {
  fs.writeFileSync(
    outPath,
    `// Generated: character dir not found. Run after adding public/images/character/
export const characterConfigs: { id: string; label: string; sheetPath: string }[] = [];
export function getCharacterById(id: string) { return undefined; }
export function getDefaultCharacterId(): string { return 'basic_v1'; }
`,
    'utf8'
  );
  console.log('character dir not found, wrote empty list');
  process.exit(0);
}

const files = fs.readdirSync(characterDir);
const sheets = files
  .filter((f) => f.endsWith('.png') && !EXCLUDE_FILES.has(f))
  .sort();

const entries = sheets.map((filename) => {
  const label = filename.replace(/\.png$/i, '').trim();
  const id = slug(filename);
  const sheetPath = `images/character/${filename}`;
  return { id, label, sheetPath };
});

const lines = [
  '// Auto-generated from public/images/character/*.png — do not edit',
  '',
  'export const characterConfigs: { id: string; label: string; sheetPath: string }[] = [',
  ...entries.map(
    (e) =>
      `  { id: ${JSON.stringify(e.id)}, label: ${JSON.stringify(e.label)}, sheetPath: ${JSON.stringify(e.sheetPath)} },`
  ),
  '];',
  '',
  'export function getCharacterById(id: string) {',
  '  return characterConfigs.find((c) => c.id === id);',
  '}',
  '',
  `export function getDefaultCharacterId(): string { return characterConfigs[0]?.id ?? ${JSON.stringify(entries[0]?.id ?? 'basic_v1')}; }`,
  '',
];

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Generated ${outPath} with ${entries.length} character(s):`, entries.map((e) => e.id).join(', '));
