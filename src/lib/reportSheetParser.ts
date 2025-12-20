import * as XLSX from 'xlsx';
import { formatDateToYYYYMMDD, parseExcelDate } from './dateUtils';
import { parseNumber } from './numberUtils';
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

export function extractTableByHeaders(
  matrix: (string | number | null)[][],
  headerNames: string[],
  startRow = 0
): { headerRow: number; colMap: Record<string, number>; rows: (string | number | null)[][] } | null {
  const normalizedHeaders = headerNames.map((h) => h.trim());

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const colMap: Record<string, number> = {};

    normalizedHeaders.forEach((header) => {
      const idx = row.findIndex(
        (cell) => typeof cell === 'string' && cell.trim() === header
      );
      if (idx !== -1) {
        colMap[header] = idx;
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
    const revenueSheet = workbook.Sheets[revenueSheetName];
    const revenueMatrix = sheetToMatrix(revenueSheet);
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

  // The الإيرادات sheet typically has headers on row 3 (index 2). Try there first then fallback.
  const headerResult =
    extractTableByHeaders(matrix, headerNames, 2) || extractTableByHeaders(matrix, headerNames);
  if (!headerResult) {
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

  const rows: ReceivableRow[] = [];

  for (const row of headerResult.rows) {
    if (!row || isEmptyRow(row)) break;
    if (isTotalRow(row)) break;

    const receivable = parseNumber(row[headerResult.colMap['المستحق']]) ?? 0;
    const toTransfer = parseNumber(row[headerResult.colMap['المطلوب تحويله']]) ?? 0;
    const paid = parseNumber(row[headerResult.colMap['المبلغ المسدد']]) ?? 0;
    const month = formatMonthCell(row[headerResult.colMap['الشهر']]);
    const customer = String(row[headerResult.colMap['العميل']] ?? '').trim();
    const tax14Index = headerResult.colMap['14%'];
    const tax14 = tax14Index !== undefined ? parseNumber(row[tax14Index]) ?? 0 : 0;

    if (receivable > 1) {
      rows.push({
        month,
        customer,
        toTransfer,
        paid,
        receivable,
        tax14,
      });
    }
  }

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

function formatMonthCell(value: string | number | null): string {
  const parsedDate = parseExcelDate(value);
  if (parsedDate) {
    return parsedDate.toLocaleString('ar-EG', { month: 'long' });
  }

  if (typeof value === 'string') {
    const tryDate = new Date(value);
    if (!isNaN(tryDate.getTime())) {
      return tryDate.toLocaleString('ar-EG', { month: 'long' });
    }
  }

  return String(value ?? '').trim();
}
