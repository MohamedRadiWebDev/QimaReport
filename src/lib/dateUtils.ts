import { normalizeDigits } from './numberUtils';

export function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }

  if (typeof value === 'string') {
    const normalized = normalizeDigits(value).trim();

    const ddmmyyyyMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const date = new Date(Date.UTC(year, month, day));
      return isNaN(date.getTime()) ? null : date;
    }

    const yyyymmddMatch = normalized.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10) - 1;
      const day = parseInt(yyyymmddMatch[3], 10);
      const date = new Date(Date.UTC(year, month, day));
      return isNaN(date.getTime()) ? null : date;
    }
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  return null;
}

function excelSerialToDate(serial: number): Date {
  let adjustedSerial = serial;
  if (serial > 60) {
    adjustedSerial = serial - 1;
  }
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcMs = excelEpoch.getTime() + adjustedSerial * msPerDay;
  return new Date(utcMs);
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
