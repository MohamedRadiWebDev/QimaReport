import * as XLSX from 'xlsx';
import { parseExcelDate } from './dateUtils';
import { parseNumber } from './numberUtils';
import { ExpenseRow, LoanRow, CustodyRow, ReportData, ValidationError } from './types';

// Helper function to normalize column names for matching
function normalizeColumnName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Helper function to find column value by flexible matching
function getColumnValue(row: Record<string, unknown>, targetColumn: string): unknown {
  const normalizedTarget = normalizeColumnName(targetColumn);
  
  for (const [key, value] of Object.entries(row)) {
    if (normalizeColumnName(key) === normalizedTarget) {
      return value;
    }
  }
  
  return undefined;
}

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
  const normalizedSheetNames = workbook.SheetNames.map(name => name.trim());
  
  for (const sheetName of Object.values(SHEET_NAMES)) {
    const normalizedTargetName = sheetName.trim();
    if (!normalizedSheetNames.some(name => name === normalizedTargetName)) {
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
  const actualSheetName = workbook.SheetNames.find(name => name.trim() === sheetName.trim()) || sheetName;
  const sheet = workbook.Sheets[actualSheetName];
  
  // Try reading from different starting rows to find the headers
  let jsonData: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let missingColumns: string[] = [];
  
  for (let startRow = 0; startRow <= 3; startRow++) {
    const tempData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
      defval: '',
      range: startRow
    });
    
    if (tempData.length > 0) {
      const tempHeaders = Object.keys(tempData[0] || {});
      const normalizedHeaders = tempHeaders.map(h => normalizeColumnName(h));
      const tempMissing = EXPENSE_COLUMNS.filter(col => 
        !normalizedHeaders.includes(normalizeColumnName(col))
      );
      
      if (tempMissing.length < missingColumns.length || missingColumns.length === 0) {
        jsonData = tempData;
        headers = tempHeaders;
        missingColumns = tempMissing;
        
        if (missingColumns.length === 0) break;
      }
    }
  }

  const rows: ExpenseRow[] = [];
  for (const row of jsonData) {
    const dateValue = parseExcelDate(getColumnValue(row, 'التاريخ'));
    if (dateValue === targetDate) {
      rows.push({
        التاريخ: dateValue,
        البيان: String(getColumnValue(row, 'البيان') || ''),
        'اسم الشركه المنصرف لها': String(getColumnValue(row, 'اسم الشركه المنصرف لها') || ''),
        'اسم الموظف المنصرف له': String(getColumnValue(row, 'اسم الموظف المنصرف له') || ''),
        القسم: String(getColumnValue(row, 'القسم') || ''),
        الفرع: String(getColumnValue(row, 'الفرع') || ''),
        'نوع المصروف': String(getColumnValue(row, 'نوع المصروف') || ''),
        'رقم الفاتورة': String(getColumnValue(row, 'رقم الفاتورة') || ''),
        المنصرف: parseNumber(getColumnValue(row, 'المنصرف')),
        ملاحظات: String(getColumnValue(row, 'ملاحظات') || ''),
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
  const actualSheetName = workbook.SheetNames.find(name => name.trim() === sheetName.trim()) || sheetName;
  const sheet = workbook.Sheets[actualSheetName];
  
  // Try reading from different starting rows to find the headers
  let jsonData: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let missingColumns: string[] = [];
  
  for (let startRow = 0; startRow <= 3; startRow++) {
    const tempData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
      defval: '',
      range: startRow
    });
    
    if (tempData.length > 0) {
      const tempHeaders = Object.keys(tempData[0] || {});
      const normalizedHeaders = tempHeaders.map(h => normalizeColumnName(h));
      const tempMissing = LOAN_COLUMNS.filter(col => 
        !normalizedHeaders.includes(normalizeColumnName(col))
      );
      
      if (tempMissing.length < missingColumns.length || missingColumns.length === 0) {
        jsonData = tempData;
        headers = tempHeaders;
        missingColumns = tempMissing;
        
        if (missingColumns.length === 0) break;
      }
    }
  }

  const rows: LoanRow[] = [];
  for (const row of jsonData) {
    const dateValue = parseExcelDate(getColumnValue(row, 'التاريخ'));
    if (dateValue === targetDate) {
      rows.push({
        التاريخ: dateValue,
        'اسم الموظف': String(getColumnValue(row, 'اسم الموظف') || ''),
        الكود: String(getColumnValue(row, 'الكود') || ''),
        القسم: String(getColumnValue(row, 'القسم') || ''),
        الفرع: String(getColumnValue(row, 'الفرع') || ''),
        'سلفه / سداد': String(getColumnValue(row, 'سلفه / سداد') || ''),
        السلفه: parseNumber(getColumnValue(row, 'السلفه')),
        'طريق السداد': String(getColumnValue(row, 'طريق السداد') || ''),
        ملاحظات: String(getColumnValue(row, 'ملاحظات') || ''),
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
  const actualSheetName = workbook.SheetNames.find(name => name.trim() === sheetName.trim()) || sheetName;
  const sheet = workbook.Sheets[actualSheetName];
  
  // Try reading from different starting rows to find the headers
  let jsonData: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let missingColumns: string[] = [];
  
  for (let startRow = 0; startRow <= 3; startRow++) {
    const tempData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
      defval: '',
      range: startRow
    });
    
    if (tempData.length > 0) {
      const tempHeaders = Object.keys(tempData[0] || {});
      const normalizedHeaders = tempHeaders.map(h => normalizeColumnName(h));
      const tempMissing = CUSTODY_COLUMNS.filter(col => 
        !normalizedHeaders.includes(normalizeColumnName(col))
      );
      
      if (tempMissing.length < missingColumns.length || missingColumns.length === 0) {
        jsonData = tempData;
        headers = tempHeaders;
        missingColumns = tempMissing;
        
        if (missingColumns.length === 0) break;
      }
    }
  }

  const rows: CustodyRow[] = [];
  for (const row of jsonData) {
    const dateValue = parseExcelDate(getColumnValue(row, 'التاريخ'));
    if (dateValue === targetDate) {
      rows.push({
        التاريخ: dateValue,
        البيان: String(getColumnValue(row, 'البيان') || ''),
        'المنصرف اليه': String(getColumnValue(row, 'المنصرف اليه') || ''),
        القسم: String(getColumnValue(row, 'القسم') || ''),
        التصنيف: String(getColumnValue(row, 'التصنيف') || ''),
        'نوع المصروف': String(getColumnValue(row, 'نوع المصروف') || ''),
        'رقم الفاتورة / كود موظف': String(getColumnValue(row, 'رقم الفاتورة / كود موظف') || ''),
        'رقم إيصال الصرف/ استلام': String(getColumnValue(row, 'رقم إيصال الصرف/ استلام') || ''),
        'العهدة / سداد': String(getColumnValue(row, 'العهدة / سداد') || ''),
        العهدة: parseNumber(getColumnValue(row, 'العهدة')),
        ملاحظات: String(getColumnValue(row, 'ملاحظات') || ''),
      });
    }
  }

  return { rows, missingColumns };
}
