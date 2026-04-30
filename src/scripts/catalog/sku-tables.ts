// Hardcoded SKU tables per product. Demo-only.

export interface SkuRow {
  /** Legacy single-code field (used by coupling-transition demo). */
  code?: string;
  /** Country-1 (Elysée) code. Preferred over `code` when present. */
  code1?: string;
  /** Country-2 (Rohrsysteme) code. Preferred over `code` when present. */
  code2?: string;
  size: string;
  box?: number | string;
  bag?: number | string;
  moq?: number | string;
  npt?: number | string;
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
  ],
  'coupling-epsilon-pn16': [
    { code1: '331016016', code2: '381016016M', size: '16 x 16',   bag: 25, box: 525, moq: 0, npt: 0 },
    { code1: '331020020', code2: '381020020M', size: '20 x 20',   bag: 15, box: 315, moq: 0, npt: 0 },
    { code1: '331025025', code2: '381025025M', size: '25 x 25',   bag: 15, box: 225, moq: 0, npt: 0 },
    { code1: '331032032', code2: '381032032M', size: '32 x 32',   bag: 10, box: 120, moq: 0, npt: 0 },
    { code1: '331040040', code2: '381040040M', size: '40 x 40',   bag: 0,  box: 72,  moq: 0, npt: 0 },
    { code1: '331050050', code2: '381050050M', size: '50 x 50',   bag: 0,  box: 44,  moq: 0, npt: 0 },
    { code1: '331063063', code2: '381063063M', size: '63 x 63',   bag: 0,  box: 30,  moq: 0, npt: 0 },
    { code1: '331075075', code2: '381075075M', size: '75 x 75',   bag: 0,  box: 16,  moq: 0, npt: 0 },
    { code1: '331090090', code2: '381090090M', size: '90 x 90',   bag: 0,  box: 10,  moq: 0, npt: 0 },
    { code1: '331110110', code2: '381110110M', size: '110 x 110', bag: 0,  box: 5,   moq: 0, npt: 0 }
  ]
};

export function skuTableRowsForProduct(slug: string): SkuRow[] {
  return TABLES[slug] ?? [];
}
