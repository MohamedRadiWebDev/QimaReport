'use client';

import { ReportSheetData } from '@/lib/types';
import { formatDateForDisplay } from '@/lib/dateUtils';
import ReportKpiCards from './ReportKpiCards';
import MonthlyExpensesSection from './MonthlyExpensesSection';
import ReceivablesSection from './ReceivablesSection';
import ReportWhatsAppMessage from './ReportWhatsAppMessage';
import { formatNumber } from '@/lib/numberUtils';

interface ReportTabProps {
  report?: ReportSheetData;
  selectedDate: string;
}

export default function ReportTab({ report, selectedDate }: ReportTabProps) {
  if (!report) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">تقرير الريبورت</h2>
        <p className="text-gray-600">لا توجد بيانات من شيت report.</p>
      </div>
    );
  }

  const displayDate = report.reportDate || selectedDate;

  return (
    <div className="space-y-4">
      {report.dateWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
          ⚠️ تاريخ الريبورت لا يطابق التاريخ المختار (تاريخ الملف: {report.reportDate ? formatDateForDisplay(report.reportDate) : 'غير متاح'})
        </div>
      )}

      <ReportKpiCards kpis={report.kpis} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5 border-r-4 border-sky-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المصروفات الشهرية</p>
          <p className="text-2xl font-bold text-sky-700">{formatNumber(report.monthlyExpenses.totals.amount)} ج.م</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border-r-4 border-indigo-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المستحقات</p>
          <p className="text-2xl font-bold text-indigo-700">{formatNumber(report.receivables.totals.receivablesTotal)} ج.م</p>
        </div>
      </div>

      <MonthlyExpensesSection data={report.monthlyExpenses} />
      <ReceivablesSection data={report.receivables} />

      <ReportWhatsAppMessage
        date={displayDate}
        kpis={report.kpis}
        monthlyExpensesTotal={report.monthlyExpenses.totals.amount}
        receivablesTotal={report.receivables.totals.receivablesTotal}
      />
    </div>
  );
}
