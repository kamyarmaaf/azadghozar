export function campaignPriceValue(value: string): number | undefined {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[,٬\s]/g, '');

  if (!normalized) return undefined;

  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0
    ? number * 1_000_000
    : undefined;
}
