export function normalizeDigits(value: string): string {
  const arabicToEnglishMap: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };

  return value.replace(/[٠-٩]/g, (char) => arabicToEnglishMap[char] || char);
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const normalized = normalizeDigits(value)
      .replace(/٬/g, ',')
      .replace(/٫/g, '.');

    let sign = 1;
    let trimmed = normalized.trim();

    if (/^\(.*\)$/.test(trimmed)) {
      sign = -1;
      trimmed = trimmed.slice(1, -1);
    }

    const cleaned = trimmed
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .trim();

    if (cleaned === '') return null;

    const parsed = parseFloat(cleaned) * sign;
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

export function formatNumber(value: number | null | undefined): string {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  return safeValue.toLocaleString('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
