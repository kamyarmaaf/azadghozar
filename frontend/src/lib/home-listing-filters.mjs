const digits = (text) => text
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

function range(label, multiplier = 1) {
  if (typeof label !== 'string') return ['', ''];
  if (label.startsWith('صفر ')) return ['0', '0'];
  const numbers = [...digits(label).matchAll(/\d[\d,٬]*/g)]
    .map(([value]) => Number(value.replace(/[,٬]/g, '')) * multiplier);
  if (!numbers.length) return ['', ''];
  if (label.startsWith('تا ')) return ['', String(numbers[0])];
  if (label.startsWith('بالای ') || label.startsWith('قبل از ')) {
    return label.startsWith('قبل از ') ? ['', String(numbers[0] - 1)] : [String(numbers[0]), ''];
  }
  if (label.includes('و بالاتر')) return [String(numbers[0]), ''];
  return numbers.length === 2 ? [String(numbers[0]), String(numbers[1])] : ['', ''];
}

function names(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()))].slice(0, 20)
    : [];
}

export function homeListingFilters(data) {
  const input = data && typeof data === 'object' ? data : {};
  const [rangePriceMin, rangePriceMax] = range(input.priceRange, 1_000_000_000);
  const [yearMin, yearMax] = range(input.yearRange);
  const [mileageMin, mileageMax] = range(input.mileageRange);
  const priceMin = Number.isSafeInteger(input.minPrice) && input.minPrice >= 0
    ? String(input.minPrice / 1_000_000) : rangePriceMin ? String(Number(rangePriceMin) / 1_000_000) : '';
  const priceMax = Number.isSafeInteger(input.maxPrice) && input.maxPrice >= 0
    ? String(input.maxPrice / 1_000_000) : rangePriceMax ? String(Number(rangePriceMax) / 1_000_000) : '';
  return {
    search: typeof input.search === 'string' ? input.search.trim() : '',
    brands: names(input.brands),
    bodyTypes: names(input.bodyTypes || (input.bodyType ? [input.bodyType] : [])),
    city: typeof input.city === 'string' ? input.city.trim() : '',
    priceMin, priceMax, yearMin, yearMax,
    mileageMin: mileageMin ? String(Number(mileageMin) / 1_000) : '',
    mileageMax: mileageMax ? String(Number(mileageMax) / 1_000) : '',
  };
}
