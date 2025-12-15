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

export interface ReportData {
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

export interface ValidationError {
  type: 'file' | 'sheet' | 'column';
  message: string;
  details?: string[];
}
