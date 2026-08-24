const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  CHF: "CHF",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  KRW: "₩",
  CNY: "¥",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  TRY: "₺",
  ZAR: "R",
  SGD: "S$",
  HKD: "HK$",
  TWD: "NT$",
  THB: "฿",
  PHP: "₱",
  MYR: "RM",
  IDR: "Rp",
  VND: "₫",
  EGP: "E£",
  KES: "KSh",
  GHS: "GH₵",
  AED: "د.إ",
  SAR: "﷼",
  QAR: "﷼",
  AFS: "؋",
  IRR: "﷼",
};

export function getCurrencySymbol(currency: string): string {
  if (CURRENCY_SYMBOL_MAP[currency]) return CURRENCY_SYMBOL_MAP[currency];
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === "currency")?.value;
    if (symbol && symbol !== currency) return symbol;
  } catch {
    // currency code not supported by Intl
  }
  return CURRENCY_SYMBOL_MAP[currency] ?? currency;
}

function formatWithSymbol(
  value: number,
  opts: Intl.NumberFormatOptions
): string {
  const nf = new Intl.NumberFormat("en-US", opts);
  const parts = nf.formatToParts(value);
  const symbol = getCurrencySymbol(opts.currency as string);

  return parts
    .map((p) => (p.type === "currency" ? symbol : p.value))
    .join("");
}

export function formatCurrency(value: number, currency = "USD"): string {
  return formatWithSymbol(value, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatCompactValue(value: number, currency = "USD"): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return formatWithSymbol(value, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }
  if (abs >= 1_000_000) {
    return formatWithSymbol(value, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 2,
    });
  }
  if (abs >= 100_000) {
    return formatWithSymbol(value, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }
  return formatCurrency(value, currency);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
