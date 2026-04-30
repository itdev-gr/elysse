import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORY_SLUGS } from '~/scripts/catalog/types';

const CATEGORIES_DIR = join(process.cwd(), 'src', 'content', 'categories');

interface ParsedCategory {
  slug?: string;
  name?: string;
  order?: number;
  image?: string;
  blurb?: string;
}

function parseFrontmatter(content: string): ParsedCategory {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm: ParsedCategory = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, v] = kv;
    if (k === 'order') (fm as any)[k] = Number(v);
    else (fm as any)[k] = v.trim();
  }
  return fm;
}

describe('categories content collection', () => {
  const files = readdirSync(CATEGORIES_DIR).filter(f => f.endsWith('.mdx'));
  const parsed = files.map(f => ({
    file: f,
    fm: parseFrontmatter(readFileSync(join(CATEGORIES_DIR, f), 'utf-8'))
  }));

  it('has exactly 13 entries', () => {
    expect(files.length).toBe(13);
  });

  it('every slug is a valid CategorySlug', () => {
    const slugs = parsed.map(p => p.fm.slug);
    for (const s of slugs) {
      expect(CATEGORY_SLUGS).toContain(s);
    }
  });

  it('all 13 CategorySlugs are represented (no duplicates, no missing)', () => {
    const slugs = parsed.map(p => p.fm.slug).sort();
    const expected = [...CATEGORY_SLUGS].sort();
    expect(slugs).toEqual(expected);
  });

  it('every entry has unique order in 0..12', () => {
    const orders = parsed.map(p => p.fm.order).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('every entry has name, image, blurb', () => {
    for (const p of parsed) {
      expect(p.fm.name).toBeTruthy();
      expect(p.fm.image).toBeTruthy();
      expect(p.fm.blurb).toBeTruthy();
    }
  });
});
