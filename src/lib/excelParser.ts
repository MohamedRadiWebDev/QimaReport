import * as XLSX from 'xlsx';
import { parseExcelDate } from './dateUtils';
import { parseNumber } from './numberUtils';
import { ExpenseRow, LoanRow, CustodyRow, ReportData, ValidationError } from './types';

const SHEET_NAMES = {
  expenses: 'الخزينه',
  loans: 'خزينه السلف',
  custody: 'العهد',
};

const EXPENSE_COLUMNS = [
  'التاريخ', 'البيان', 'اسم الشركه المنصرف لها', 'اسم الموظف المنصرف له',
  'القسم', 'الفرع', 'نوع المصروف', 'رقم الفاتورة', 'المنصرف', 'ملاحظات'
];

const LOAN_COLUMNS = [
  'التاريخ', 'اسم الموظف', 'الكود', 'القسم', 'الفرع',
  'سلفه / سداد', 'السلفه', 'طريق السداد', 'ملاحظات'
];

const CUSTODY_COLUMNS = [
  'التاريخ', 'البيان', 'المنصرف اليه', 'القسم', 'التصنيف',
  'نوع المصروف', 'رقم الفاتورة / كود موظف', 'رقم إيصال الصرف/ استلام',
  'العهدة / سداد', 'العهدة', 'ملاحظات'
];

export function parseExcelFile(
  buffer: ArrayBuffer,
  targetDate: string
): { data: ReportData | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  } catch {
    errors.push({
      type: 'file',
      message: 'فشل في قراءة الملف. تأكد من أن الملف بصيغة Excel صحيحة (.xlsx)',
    });
    return { data: null, errors };
  }

  const missingSheets: string[] = [];
  for (const sheetName of Object.values(SHEET_NAMES)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      missingSheets.push(sheetName);
    }
  }

  if (missingSheets.length > 0) {
    errors.push({
      type: 'sheet',
      message: 'الصفحات التالية غير موجودة في الملف',
      details: missingSheets,
    });
    return { data: null, errors };
  }

  const expensesResult = parseExpenseSheet(workbook, SHEET_NAMES.expenses, targetDate);
  if (expensesResult.missingColumns.length > 0) {
    errors.push({
      type: 'column',
      message: `أعمدة مفقودة في صفحة "${SHEET_NAMES.expenses}"`,
      details: expensesResult.missingColumns,
    });
  }

  const loansResult = parseLoanSheet(workbook, SHEET_NAMES.loans, targetDate);
  if (loansResult.missingColumns.length > 0) {
    errors.push({
      type: 'column',
      message: `أعمدة مفقودة في صفحة "${SHEET_NAMES.loans}"`,
      details: loansResult.missingColumns,
    });
  }

  const custodyResult = parseCustodySheet(workbook, SHEET_NAMES.custody, targetDate);
  if (custodyResult.missingColumns.length > 0) {
    errors.push({
      type: 'column',
      message: `أعمدة مفقودة في صفحة "${SHEET_NAMES.custody}"`,
      details: custodyResult.missingColumns,
    });
  }

  const expensesTotal = expensesResult.rows.reduce((sum, row) => sum + row.المنصرف, 0);
  
  const loansOut = loansResult.rows
    .filter(row => row['سلفه / سداد']?.includes('سلفه') || row['سلفه / سداد']?.includes('سلفة'))
    .reduce((sum, row) => sum + row.السلفه, 0);
  
  const loansIn = loansResult.rows
    .filter(row => row['سلفه / سداد']?.includes('سداد'))
    .reduce((sum, row) => sum + row.السلفه, 0);
  
  const custodyOut = custodyResult.rows
    .filter(row => row['العهدة / سداد']?.includes('عهدة') || row['العهدة / سداد']?.includes('العهدة'))
    .reduce((sum, row) => sum + row.العهدة, 0);
  
  const custodyIn = custodyResult.rows
    .filter(row => row['العهدة / سداد']?.includes('سداد'))
    .reduce((sum, row) => sum + row.العهدة, 0);

  const totalOut = expensesTotal + loansOut + custodyOut;

  return {
    data: {
      date: targetDate,
      expenses: expensesResult.rows,
      loans: loansResult.rows,
      custody: custodyResult.rows,
      totals: {
        expensesTotal,
        loansOut,
        loansIn,
        custodyOut,
        custodyIn,
        totalOut,
      },
    },
    errors,
  };
}

function parseExpenseSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  targetDate: string
): { rows: ExpenseRow[]; missingColumns: string[] } {
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  
  if (jsonData.length === 0) {
    return { rows: [], missingColumns: [] };
  }

  const headers = Object.keys(jsonData[0] || {});
  const missingColumns = EXPENSE_COLUMNS.filter(col => !headers.some(h => h.trim() === col.trim()));

  const rows: ExpenseRow[] = [];
  for (const row of jsonData) {
    const dateValue = parseExcelDate(row['التاريخ']);
    if (dateValue === targetDate) {
      rows.push({
        التاريخ: dateValue,
        البيان: String(row['البيان'] || ''),
        'اسم الشركه المنصرف لها': String(row['اسم الشركه المنصرف لها'] || ''),
        'اسم الموظف المنصرف له': String(row['اسم الموظف المنصرف له'] || ''),
        القسم: String(row['القسم'] || ''),
        الفرع: String(row['الفرع'] || ''),
        'نوع المصروف': String(row['نوع المصروف'] || ''),
        'رقم الفاتورة': String(row['رقم الفاتورة'] || ''),
        المنصرف: parseNumber(row['المنصرف']),
        ملاحظات: String(row['ملاحظات'] || ''),
      });
    }
  }

  return { rows, missingColumns };
}

function parseLoanSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  targetDate: string
): { rows: LoanRow[]; missingColumns: string[] } {
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  
  if (jsonData.length === 0) {
    return { rows: [], missingColumns: [] };
  }

  const headers = Object.keys(jsonData[0] || {});
  const missingColumns = LOAN_COLUMNS.filter(col => !headers.some(h => h.trim() === col.trim()));

  const rows: LoanRow[] = [];
  for (const row of jsonData) {
    const dateValue = parseExcelDate(row['التاريخ']);
    if (dateValue === targetDate) {
      rows.push({
        التاريخ: dateValue,
        'اسم الموظف': String(row['اسم الموظف'] || ''),
        الكود: String(row['الكود'] || ''),
        القسم: String(row['القسم'] || ''),
        الفرع: String(row['الفرع'] || ''),
        'سلفه / سداد': String(row['سلفه / سداد'] || ''),
        السلفه: parseNumber(row['السلفه']),
        'طريق السداد': String(row['طريق السداد'] || ''),
        ملاحظات: String(row['ملاحظات'] || ''),
      });
    }
  }

  return { rows, missingColumns };
}

function parseCustodySheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  targetDate: string
): { rows: CustodyRow[]; missingColumns: string[] } {
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  
  if (jsonData.length === 0) {
    return { rows: [], missingColumns: [] };
  }

  const headers = Object.keys(jsonData[0] || {});
  const missingColumns = CUSTODY_COLUMNS.filter(col => !headers.some(h => h.trim() === col.trim()));

  const rows: CustodyRow[] = [];
  for (const row of jsonData) {
    const dateValue = parseExcelDate(row['التاريخ']);
    if (dateValue === targetDate) {
      rows.push({
        التاريخ: dateValue,
        البيان: String(row['البيان'] || ''),
        'المنصرف اليه': String(row['المنصرف اليه'] || ''),
        القسم: String(row['القسم'] || ''),
        التصنيف: String(row['التصنيف'] || ''),
        'نوع المصروف': String(row['نوع المصروف'] || ''),
        'رقم الفاتورة / كود موظف': String(row['رقم الفاتورة / كود موظف'] || ''),
        'رقم إيصال الصرف/ استلام': String(row['رقم إيصال الصرف/ استلام'] || ''),
        'العهدة / سداد': String(row['العهدة / سداد'] || ''),
        العهدة: parseNumber(row['العهدة']),
        ملاحظات: String(row['ملاحظات'] || ''),
      });
    }
  }

  return { rows, missingColumns };
}
