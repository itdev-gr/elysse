// Hardcoded SKU tables per product. Demo-only: real data later comes from
// an Excel import or a per-product MDX field. To add a board for another
// product, drop a new entry keyed by the product slug below.

export interface SkuRow {
  code: string;
  size: string;
  box?: number | string;
  bag?: number | string;
  note?: string;
}

const TABLES: Record<string, SkuRow[]> = {
  'coupling-transition': [
    { code: '330001601', size: 'Ø 16 x ½"',  box: 750, bag: 25 },
    { code: '330001602', size: 'Ø 16 x ¾"',  box: 750, bag: 25 },
    { code: '330001610', size: 'Ø 16 x ⅜"',  box: 750, bag: 25 },
    { code: '330002001', size: 'Ø 20 x ½"',  box: 500, bag: 25 },
    { code: '330002002', size: 'Ø 20 x ¾"',  box: 500, bag: 25 },
    { code: '330002003', size: 'Ø 20 x 1"',  box: 450, bag: 25 },
    { code: '330002501', size: 'Ø 25 x ½"',  box: 360, bag: 20 },
    { code: '330002502', size: 'Ø 25 x ¾"',  box: 320, bag: 20 },
    { code: '330002503', size: 'Ø 25 x 1"',  box: 320, bag: 20 },
    { code: '330003201', size: 'Ø 32 x ½"',  box: 180, bag: 10 },
    { code: '330003202', size: 'Ø 32 x ¾"',  box: 180, bag: 10 },
    { code: '330003203', size: 'Ø 32 x 1"',  box: 180, bag: 10, note: '▲' },
    { code: '330003204', size: 'Ø 32 x 1¼"', box: 180, bag: 10, note: '▲' },
    { code: '330003205', size: 'Ø 32 x 1½"', box: 150, bag: 10 },
    { code: '330004003', size: 'Ø 40 x 1"',  box: 100 },
    { code: '330004004', size: 'Ø 40 x 1¼"', box: 100, note: '▲' },
    { code: '330004005', size: 'Ø 40 x 1½"', box: 100, note: '▲' }
  ]
};

export function skuTableRowsForProduct(slug: string): SkuRow[] {
  return TABLES[slug] ?? [];
}
