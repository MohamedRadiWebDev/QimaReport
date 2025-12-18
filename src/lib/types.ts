export interface ExpenseRow {
  التاريخ: string;
  البيان: string;
  'اسم الشركه المنصرف لها': string;
  'اسم الموظف المنصرف له': string;
  القسم: string;
  الفرع: string;
  'نوع المصروف': string;
  'رقم الفاتورة': string;
  المنصرف: number;
  ملاحظات: string;
}

export interface LoanRow {
  التاريخ: string;
  'اسم الموظف': string;
  الكود: string;
  القسم: string;
  الفرع: string;
  'سلفه / سداد': string;
  السلفه: number;
  'طريق السداد': string;
  ملاحظات: string;
}

export interface CustodyRow {
  التاريخ: string;
  البيان: string;
  'المنصرف اليه': string;
  القسم: string;
  التصنيف: string;
  'نوع المصروف': string;
  'رقم الفاتورة / كود موظف': string;
  'رقم إيصال الصرف/ استلام': string;
  'العهدة / سداد': string;
  العهدة: number;
  ملاحظات: string;
}

export interface DailyReportData {
  date: string;
  expenses: ExpenseRow[];
  loans: LoanRow[];
  custody: CustodyRow[];
  totals: {
    expensesTotal: number;
    loansOut: number;
    loansIn: number;
    custodyOut: number;
    custodyIn: number;
    totalOut: number;
  };
}

export interface BasicBalances {
  bankBalance: number | null;
  safeBalance: number | null;
  totalSolf: number | null;
  totalOhda: number | null;
}

export interface MonthlyExpenseLine {
  name: string;
  amount: number;
  paid: number;
  remaining: number;
  notes: string;
}

export interface MonthlyExpensesData {
  lines: MonthlyExpenseLine[];
  totals: {
    amount: number;
    paid: number;
    remaining: number;
  };
  missingHeaders: string[];
  found: boolean;
}

export interface ReceivableRow {
  month: string;
  customer: string;
  toTransfer: number;
  paid: number;
  receivable: number;
  tax14: number | null;
}

export interface CustomerReceivableSummary {
  customer: string;
  receivable: number;
}

export interface ReceivablesData {
  rows: ReceivableRow[];
  totals: {
    receivablesTotal: number;
    toTransferTotal: number;
    paidTotal: number;
    tax14Total: number;
  };
  customerSummary: CustomerReceivableSummary[];
  missingHeaders: string[];
  found: boolean;
}

export interface ReportSheetData {
  reportDate: string | null;
  dateWarning: boolean;
  kpis: BasicBalances;
  monthlyExpenses: MonthlyExpensesData;
  receivables: ReceivablesData;
}

export interface ReportData {
  daily: DailyReportData;
  report?: ReportSheetData;
}

export interface ValidationError {
  type: 'file' | 'sheet' | 'column' | 'table';
  message: string;
  details?: string[];
}
