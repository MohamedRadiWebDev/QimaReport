import * as XLSX from 'xlsx';
import { formatDateToYYYYMMDD, parseExcelDate } from './dateUtils';
import { normalizeDigits, parseNumber } from './numberUtils';
import {
  BasicBalances,
  MonthlyExpenseLine,
  MonthlyExpensesData,
  ReceivableRow,
  ReceivablesData,
  ReportSheetData,
  ValidationError,
} from './types';

export function sheetToMatrix(sheet: XLSX.Sheet): (string | number | null)[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const matrix: (string | number | null)[][] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: (string | number | null)[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      row.push(cell ? (cell.v as string | number | null) : null);
    }
    matrix.push(row);
  }

  return matrix;
}

export function findCellByText(
  matrix: (string | number | null)[][],
  textVariants: string[]
): { r: number; c: number }[] {
  const targets = textVariants.map((text) => text.trim().toLowerCase());
  const matches: { r: number; c: number }[] = [];

  matrix.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (typeof cell === 'string') {
        const normalized = cell.trim().toLowerCase();
        if (targets.includes(normalized)) {
          matches.push({ r, c });
        }
      }
    });
  });

  return matches;
}

export function findNearestNumber(
  matrix: (string | number | null)[][],
  r: number,
  c: number,
  radius = 3
): number | null {
  let nearest: number | null = null;

  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const distance = Math.abs(dr) + Math.abs(dc);
      if (distance === 0 || distance > radius) continue;

      const row = matrix[r + dr];
      if (!row) continue;

      const value = row[c + dc];
      const parsed = parseNumber(value);
      if (parsed !== null) {
        nearest = parsed;
        return nearest;
      }
    }
  }

  return nearest;
}

function normalizeHeaderText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return normalizeDigits(String(value))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function extractTableByHeaders(
  matrix: (string | number | null)[][],
  headerNames: string[],
  startRow = 0
): { headerRow: number; colMap: Record<string, number>; rows: (string | number | null)[][] } | null {
  const normalizedHeaders = headerNames.map((h) => normalizeHeaderText(h));

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const colMap: Record<string, number> = {};

    normalizedHeaders.forEach((header, headerIdx) => {
      const idx = row.findIndex((cell) => normalizeHeaderText(cell) === header);
      if (idx !== -1) {
        colMap[headerNames[headerIdx]] = idx;
      }
    });

    if (Object.keys(colMap).length === normalizedHeaders.length) {
      return {
        headerRow: r,
        colMap,
        rows: matrix.slice(r + 1),
      };
    }
  }

  return null;
}

export function parseReportSheet(
  workbook: XLSX.WorkBook,
  targetDate: string
): { data: ReportSheetData; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const reportSheetName = workbook.SheetNames.find(
    (name) => name.trim().toLowerCase() === 'report'
  );

  const revenueSheetName = workbook.SheetNames.find((name) => {
    const normalized = name.trim().toLowerCase();
    return normalized === 'الايرادات' || normalized === 'الإيرادات';
  });

  const baseData: ReportSheetData = {
    reportDate: null,
    dateWarning: false,
    kpis: {
      bankBalance: null,
      safeBalance: null,
      totalSolf: null,
      totalOhda: null,
    },
    monthlyExpenses: {
      lines: [],
      totals: { amount: 0, paid: 0, remaining: 0 },
      missingHeaders: [],
      found: false,
    },
    receivables: {
      rows: [],
      totals: { receivablesTotal: 0, toTransferTotal: 0, paidTotal: 0, tax14Total: 0 },
      customerSummary: [],
      missingHeaders: [],
      found: false,
    },
  };

  if (!reportSheetName) {
    errors.push({ type: 'sheet', message: 'شيت report غير موجود' });
  } else {
    const sheet = workbook.Sheets[reportSheetName];
    const matrix = sheetToMatrix(sheet);

    const reportDate = detectReportDate(matrix);
    baseData.reportDate = reportDate;
    baseData.dateWarning = Boolean(reportDate && reportDate !== targetDate);

    baseData.kpis = {
      bankBalance: extractKpi(matrix, ['رصيد البنك']),
      safeBalance: extractKpi(matrix, ['رصيد الخزينه', 'رصيد الخزينة']),
      totalSolf: extractKpi(matrix, ['اجمالي السلف']),
      totalOhda: extractKpi(matrix, ['اجمالي العهد']),
    };

    const monthlyExpensesResult = extractMonthlyExpenses(matrix);
    baseData.monthlyExpenses = monthlyExpensesResult.data;
    errors.push(...monthlyExpensesResult.errors);
  }

  if (!revenueSheetName) {
    errors.push({ type: 'sheet', message: 'شيت الإيرادات غير موجود' });
  } else {
    console.log('[receivables] using sheet:', revenueSheetName);
    const revenueSheet = workbook.Sheets[revenueSheetName];
    const revenueMatrix = sheetToMatrix(revenueSheet);
    console.log('[receivables] sheet dimensions:', revenueMatrix.length, 'rows x', revenueMatrix[0]?.length || 0, 'cols');
    const receivablesResult = extractReceivables(revenueMatrix);
    baseData.receivables = receivablesResult.data;
    errors.push(...receivablesResult.errors);
  }

  return {
    data: baseData,
    errors,
  };
}

function detectReportDate(matrix: (string | number | null)[][]): string | null {
  const maxRows = Math.min(20, matrix.length);
  const maxCols = matrix[0] ? Math.min(20, matrix[0].length) : 0;

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const value = matrix[r]?.[c];
      const parsedDate = parseExcelDate(value);
      if (parsedDate) {
        return formatDateToYYYYMMDD(parsedDate);
      }
    }
  }

  return null;
}

function extractKpi(
  matrix: (string | number | null)[][],
  labelVariants: string[]
): number | null {
  const matches = findCellByText(matrix, labelVariants);

  for (const match of matches) {
    const value = findNearestNumber(matrix, match.r, match.c, 3);
    if (value !== null) return value;
  }

  return null;
}

function isEmptyRow(row: (string | number | null)[]): boolean {
  return row.every(
    (cell) =>
      cell === null ||
      cell === undefined ||
      cell === '' ||
      (typeof cell === 'string' && cell.trim() === '')
  );
}

function isTotalRow(row: (string | number | null)[]): boolean {
  return row.some(
    (cell) =>
      typeof cell === 'string' &&
      ['total', 'grand total', 'اجمالي', 'الإجمالي'].includes(cell.trim().toLowerCase())
  );
}

function getNameCell(
  row: (string | number | null)[],
  excludedColumns: Set<number>
): string {
  for (let i = 0; i < row.length; i++) {
    if (excludedColumns.has(i)) continue;
    const cell = row[i];
    if (typeof cell === 'string' && cell.trim() !== '') {
      return cell.trim();
    }
  }
  return '';
}

function extractMonthlyExpenses(
  matrix: (string | number | null)[][]
): { data: MonthlyExpensesData; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const sectionCell = findCellByText(matrix, ['المصروفات الشهريه', 'المصروفات الشهرية'])[0];
  const startRow = sectionCell ? sectionCell.r : 0;

  const headerResult = extractTableByHeaders(matrix, ['المبلغ', 'المدفوع', 'الباقي'], startRow);

  if (!headerResult) {
    const missingHeaders = ['المبلغ', 'المدفوع', 'الباقي'];
    errors.push({
      type: 'table',
      message: 'تعذر العثور على عناوين جدول المصروفات الشهرية',
      details: missingHeaders,
    });

    return {
      data: {
        lines: [],
        totals: { amount: 0, paid: 0, remaining: 0 },
        missingHeaders,
        found: false,
      },
      errors,
    };
  }

  const headerRowValues = matrix[headerResult.headerRow] || [];
  const notesCol = headerRowValues.findIndex(
    (cell) => typeof cell === 'string' && cell.trim() === 'ملاحظات'
  );

  const usedColumns = new Set<number>(Object.values(headerResult.colMap));
  if (notesCol !== -1) usedColumns.add(notesCol);

  const lines: MonthlyExpenseLine[] = [];

  for (const row of headerResult.rows) {
    if (!row || isEmptyRow(row) || isTotalRow(row)) break;

    const name = getNameCell(row, usedColumns);
    const amount = parseNumber(row[headerResult.colMap['المبلغ']]) ?? 0;
    const paid = parseNumber(row[headerResult.colMap['المدفوع']]) ?? 0;
    const remaining = parseNumber(row[headerResult.colMap['الباقي']]) ?? 0;
    const notes = notesCol !== -1 ? String(row[notesCol] ?? '').trim() : '';

    if (name || amount !== 0 || paid !== 0 || remaining !== 0 || notes) {
      lines.push({ name: name || 'غير مسمى', amount, paid, remaining, notes });
    }
  }

  const totals = lines.reduce(
    (acc, line) => {
      acc.amount += line.amount;
      acc.paid += line.paid;
      acc.remaining += line.remaining;
      return acc;
    },
    { amount: 0, paid: 0, remaining: 0 }
  );

  return {
    data: {
      lines,
      totals,
      missingHeaders: [],
      found: true,
    },
    errors,
  };
}

function extractReceivables(
  matrix: (string | number | null)[][]
): { data: ReceivablesData; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const headerNames = ['الشهر', 'العميل', 'المطلوب تحويله', 'المبلغ المسدد', 'المستحق', '14%'];

  const headerCandidates = findReceivablesHeaderCandidates(matrix, headerNames, [2, 0]);
  console.log('[receivables] header candidates found:', headerCandidates.map((c) => ({
    headerRow: c.headerRow,
    columns: Object.keys(c.colMap),
    rowsBelow: c.rows.length,
  })));
  if (headerCandidates.length === 0) {
    errors.push({
      type: 'table',
      message: 'تعذر العثور على جدول الإيرادات والمستحقات',
      details: headerNames,
    });

    return {
      data: {
        rows: [],
        totals: { receivablesTotal: 0, toTransferTotal: 0, paidTotal: 0, tax14Total: 0 },
        customerSummary: [],
        missingHeaders: headerNames,
        found: false,
      },
      errors,
    };
  }

  const parsedCandidates = headerCandidates.map((candidate) => ({
    header: candidate,
    rows: parseReceivableRows(candidate),
  }));

  const best = parsedCandidates.reduce(
    (acc, curr) => {
      return curr.rows.length > acc.rows.length ? curr : acc;
    },
    parsedCandidates[0]
  );

  const rows = best.rows;
  console.log('[receivables] chosen header row:', best.header.headerRow, 'rows parsed:', rows.length);

  const totals = rows.reduce(
    (acc, row) => {
      acc.receivablesTotal += row.receivable;
      acc.toTransferTotal += row.toTransfer;
      acc.paidTotal += row.paid;
      acc.tax14Total += row.tax14 ?? 0;
      return acc;
    },
    { receivablesTotal: 0, toTransferTotal: 0, paidTotal: 0, tax14Total: 0 }
  );

  const customerSummaryList = Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      if (!acc[row.customer]) acc[row.customer] = 0;
      acc[row.customer] += row.receivable;
      return acc;
    }, {})
  )
    .map(([customer, receivable]) => ({ customer, receivable }))
    .sort((a, b) => b.receivable - a.receivable);

  return {
    data: {
      rows,
      totals,
      customerSummary: customerSummaryList,
      missingHeaders: [],
      found: true,
    },
    errors,
  };
}

function findReceivablesHeaderCandidates(
  matrix: (string | number | null)[][],
  headerNames: string[],
  preferredStarts: number[]
): { headerRow: number; colMap: Record<string, number>; rows: (string | number | null)[][] }[] {
  const normalizedHeaders = headerNames.map((h) => normalizeHeaderText(h));
  const candidates: {
    headerRow: number;
    colMap: Record<string, number>;
    rows: (string | number | null)[][];
  }[] = [];
  const seenRows = new Set<number>();

  for (const startRow of preferredStarts) {
    for (let r = startRow; r < matrix.length; r++) {
      if (seenRows.has(r)) continue;
      const row = matrix[r] || [];
      const colMap: Record<string, number> = {};

      normalizedHeaders.forEach((header, headerIdx) => {
        const idx = row.findIndex((cell) => normalizeHeaderText(cell) === header);
        if (idx !== -1) {
          colMap[headerNames[headerIdx]] = idx;
        }
      });

      if (Object.keys(colMap).length === normalizedHeaders.length) {
        candidates.push({ headerRow: r, colMap, rows: matrix.slice(r + 1) });
        seenRows.add(r);
      }
    }
  }

  return candidates;
}

function parseReceivableRows(headerResult: {
  headerRow: number;
  colMap: Record<string, number>;
  rows: (string | number | null)[][];
}): ReceivableRow[] {
  const rows: ReceivableRow[] = [];
  let consecutiveEmptyRows = 0;

  for (const row of headerResult.rows) {
    if (!row || isEmptyRow(row)) {
      consecutiveEmptyRows += 1;
      if (consecutiveEmptyRows >= 3) break;
      continue;
    }

    consecutiveEmptyRows = 0;

    if (isTotalRow(row)) break;

    const receivable = parseNumber(row[headerResult.colMap['المستحق']]) ?? 0;
    const toTransfer = parseNumber(row[headerResult.colMap['المطلوب تحويله']]) ?? 0;
    const paid = parseNumber(row[headerResult.colMap['المبلغ المسدد']]) ?? 0;
    const monthInfo = formatMonthCell(row[headerResult.colMap['الشهر']]);
    const customer = String(row[headerResult.colMap['العميل']] ?? '').trim();
    const tax14Index = headerResult.colMap['14%'];
    const tax14 = tax14Index !== undefined ? parseNumber(row[tax14Index]) ?? 0 : 0;

    if (receivable > 1) {
      rows.push({
        monthLabel: monthInfo.label,
        monthKey: monthInfo.key,
        year: monthInfo.year,
        monthNumber: monthInfo.monthNumber,
        customer,
        toTransfer,
        paid,
        receivable,
        tax14,
      });
    }
  }

  if (rows.length > 0) {
    const sample = rows.slice(0, 3).map((row) => ({
      month: row.monthLabel,
      customer: row.customer,
      receivable: row.receivable,
    }));
    console.log('[receivables] parsed sample rows:', sample);
  } else {
    console.log('[receivables] no rows parsed from header row', headerResult.headerRow);
  }

  return rows;
}

function parseMonthYearString(
  value: string | number | null
): { label: string; key: string; year: number | null; monthNumber: number | null } | null {
  if (value === null || value === undefined) return null;

  const raw = normalizeDigits(String(value)).trim();
  if (!raw) return null;

  const englishMonths: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  const arabicMonths: Record<string, number> = {
    'يناير': 1,
    'فبراير': 2,
    'مارس': 3,
    'ابريل': 4,
    'أبريل': 4,
    'أبريل ': 4,
    'ابريل ': 4,
    'ابريل‏': 4,
    'أبريل‏': 4,
    'مايو': 5,
    'يونيو': 6,
    'يونيه': 6,
    'يوليو': 7,
    'يوليه': 7,
    'اغسطس': 8,
    'أغسطس': 8,
    'سبتمبر': 9,
    'اكتوبر': 10,
    'أكتوبر': 10,
    'نوفمبر': 11,
    'ديسمبر': 12,
  };

  const normalized = raw.toLowerCase();
  const englishMatch = normalized.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s\-\/]+(\d{2,4})$/
  );

  if (englishMatch) {
    const monthNumber = englishMonths[englishMatch[1] as keyof typeof englishMonths];
    const year = normalizeYear(englishMatch[2]);
    const label = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleString('ar-EG', {
      month: 'long',
    });
    const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
    return { label, key, year, monthNumber };
  }

  const cleanedArabic = normalized.replace(/[إأآ]/g, 'ا');
  const arabicParts = cleanedArabic.split(/[\s\-\/]+/).filter(Boolean);
  if (arabicParts.length >= 1) {
    const monthName = arabicParts[0];
    const monthNumber = arabicMonths[monthName];
    if (monthNumber) {
      const yearPart = arabicParts[1];
      if (yearPart) {
        const year = normalizeYear(yearPart);
        const label = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleString('ar-EG', {
          month: 'long',
        });
        const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
        return { label, key, year, monthNumber };
      }

      const label = new Date(Date.UTC(2000, monthNumber - 1, 1)).toLocaleString('ar-EG', {
        month: 'long',
      });
      return { label, key: label, year: null, monthNumber };
    }
  }

  return null;
}

function normalizeYear(value: string): number {
  const yearNum = parseInt(value, 10);
  if (value.length === 2) {
    return yearNum >= 50 ? 1900 + yearNum : 2000 + yearNum;
  }
  return yearNum;
}

function formatMonthCell(
  value: string | number | null
): { label: string; key: string; year: number | null; monthNumber: number | null } {
  const monthFromPattern = parseMonthYearString(value);
  if (monthFromPattern) {
    return monthFromPattern;
  }

  const parsedDate = parseExcelDate(value);
  if (parsedDate) {
    const monthNumber = parsedDate.getUTCMonth() + 1;
    const year = parsedDate.getUTCFullYear();
    return {
      label: parsedDate.toLocaleString('ar-EG', { month: 'long' }),
      key: `${year}-${String(monthNumber).padStart(2, '0')}`,
      year,
      monthNumber,
    };
  }

  if (typeof value === 'string') {
    const tryDate = new Date(value);
    if (!isNaN(tryDate.getTime())) {
      const monthNumber = tryDate.getMonth() + 1;
      const year = tryDate.getFullYear();
      return {
        label: tryDate.toLocaleString('ar-EG', { month: 'long' }),
        key: `${year}-${String(monthNumber).padStart(2, '0')}`,
        year,
        monthNumber,
      };
    }
  }

  const fallback = String(value ?? '').trim();
  return {
    label: fallback || 'غير محدد',
    key: fallback || 'غير محدد',
    year: null,
    monthNumber: null,
  };
}
