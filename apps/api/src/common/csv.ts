const cell = (v: unknown) => {
  const s = String(v ?? '');
  // Quote cells with separators, and neutralise spreadsheet formulas (=, +, -, @).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(cell).join(',')).join('\n');
}
