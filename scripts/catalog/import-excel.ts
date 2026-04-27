// scripts/catalog/import-excel.ts
// Usage: node --experimental-strip-types scripts/catalog/import-excel.ts <path-to-xlsx> [--force]
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import XLSXDefault from 'xlsx';
// xlsx is a CJS package; when imported as ESM the API lives on the default export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XLSX: any = XLSXDefault ?? (XLSXDefault as any)['default'] ?? XLSXDefault;

interface Row {
  code?: string; name?: string; category?: string; sectors?: string;
  material?: string; dn_min?: number; dn_max?: number; pn?: number;
  blurb?: string; specs?: string; standards?: string;
  image_url?: string; datasheet_url?: string; bim?: string | boolean; featured?: string | boolean;
}

const SECTORS = new Set(['agriculture', 'landscape', 'building', 'industry']);
const CATEGORIES = new Set(['compression-fittings', 'pvc-ball-valves', 'saddles', 'adaptor-flanged', 'couplings', 'valves']);

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function csv(s?: string): string[] {
  return s ? s.split(',').map(v => v.trim()).filter(Boolean) : [];
}

function bool(v: string | boolean | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (!v) return false;
  return /^(true|1|yes|y)$/i.test(String(v).trim());
}

function rowToMdx(row: Row, errors: string[]): { slug: string; content: string } | null {
  if (!row.code || !row.name || !row.category) {
    errors.push(`row missing required fields (code, name, category): ${JSON.stringify(row)}`);
    return null;
  }
  if (!CATEGORIES.has(row.category)) {
    errors.push(`row ${row.code}: unknown category "${row.category}"`);
    return null;
  }
  const sectors = csv(row.sectors).filter(s => SECTORS.has(s));
  const standards = csv(row.standards);
  let specsArr: { key: string; value: string }[] = [];
  if (row.specs) {
    try { specsArr = JSON.parse(row.specs); }
    catch { errors.push(`row ${row.code}: invalid specs JSON, skipping specs field`); }
  }
  const slug = slugify(row.code);
  const lines: string[] = ['---'];
  lines.push(`name: ${JSON.stringify(row.name)}`);
  lines.push(`category: ${row.category}`);
  lines.push(`code: ${row.code}`);
  if (sectors.length) lines.push(`sectors: [${sectors.join(', ')}]`);
  if (row.material) lines.push(`material: ${JSON.stringify(row.material)}`);
  if (row.dn_min !== undefined && row.dn_max !== undefined) lines.push(`dnRange: [${row.dn_min}, ${row.dn_max}]`);
  if (row.pn !== undefined) lines.push(`pnRating: ${row.pn}`);
  if (standards.length) lines.push(`standards: [${standards.map(s => JSON.stringify(s)).join(', ')}]`);
  lines.push(`pressure: ${JSON.stringify(row.pn !== undefined ? `${row.pn} bar` : '')}`);
  lines.push(`sizeRange: ${JSON.stringify(row.dn_min !== undefined && row.dn_max !== undefined ? `Ø${row.dn_min}–Ø${row.dn_max}` : '')}`);
  lines.push(`blurb: ${JSON.stringify(row.blurb ?? '')}`);
  lines.push(`image: ${JSON.stringify(row.image_url ?? '/images/products/placeholder.svg')}`);
  if (row.image_url) lines.push(`imageUrls: [${JSON.stringify(row.image_url)}]`);
  if (specsArr.length) {
    lines.push('specs:');
    for (const s of specsArr) lines.push(`  - { key: ${JSON.stringify(s.key)}, value: ${JSON.stringify(s.value)} }`);
  }
  lines.push(`bim: ${bool(row.bim)}`);
  lines.push(`featured: ${bool(row.featured)}`);
  if (row.datasheet_url) lines.push(`datasheet: ${JSON.stringify(row.datasheet_url)}`);
  lines.push('---');
  lines.push('');
  lines.push(row.blurb ?? '');
  lines.push('');
  return { slug, content: lines.join('\n') };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) { console.error('usage: import-excel.ts <xlsx> [--force]'); process.exit(1); }
  const xlsxPath = resolve(args[0]);
  const force = args.includes('--force');
  if (!existsSync(xlsxPath)) { console.error(`file not found: ${xlsxPath}`); process.exit(1); }

  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const outDir = join(process.cwd(), 'src/content/products');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const errors: string[] = [];
  let written = 0, skipped = 0;
  for (const row of rows) {
    const norm: Row = {};
    for (const [k, v] of Object.entries(row)) (norm as any)[k.toLowerCase()] = v;
    const result = rowToMdx(norm, errors);
    if (!result) continue;
    const filePath = join(outDir, `${result.slug}.mdx`);
    if (existsSync(filePath) && !force) {
      console.warn(`skip existing: ${filePath}`);
      skipped++; continue;
    }
    writeFileSync(filePath, result.content);
    written++;
  }
  console.log(`wrote ${written}, skipped ${skipped}`);
  if (errors.length) {
    console.warn(`${errors.length} row error(s):`);
    for (const e of errors) console.warn(' ', e);
  }
}

main();
