export function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    const date = excelSerialToDate(value);
    return formatDateToYYYYMMDD(date);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = ddmmyyyyMatch[1].padStart(2, '0');
      const month = ddmmyyyyMatch[2].padStart(2, '0');
      const year = ddmmyyyyMatch[3];
      return `${year}-${month}-${day}`;
    }

    const yyyymmddMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = yyyymmddMatch[1];
      const month = yyyymmddMatch[2].padStart(2, '0');
      const day = yyyymmddMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return formatDateToYYYYMMDD(value);
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

function formatDateToYYYYMMDD(date: Date): string {
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
