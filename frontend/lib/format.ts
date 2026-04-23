/**
 * Format a number as USD currency
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a number as compact currency (e.g. $1.2M)
 */
export function formatCompactCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return "$0";
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(num);
}

/**
 * Format a decimal as a percentage (e.g. 0.2534 → "25.34%")
 */
export function formatPercent(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return "0%";
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * Format a MOIC/multiple (e.g. 1.52 → "1.52x")
 */
export function formatMultiple(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return "0.00x";
  return `${num.toFixed(2)}x`;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string to a short quarter format (e.g. "Q4 2024")
 */
export function formatQuarter(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

/**
 * Calculate markup/markdown percentage from cost basis
 */
export function calcMarkupPct(currentValue: string | number, costBasis: string | number): number {
  const cv = typeof currentValue === "string" ? parseFloat(currentValue) : currentValue;
  const cb = typeof costBasis === "string" ? parseFloat(costBasis) : costBasis;
  if (!cb || cb === 0) return 0;
  return ((cv - cb) / cb) * 100;
}
