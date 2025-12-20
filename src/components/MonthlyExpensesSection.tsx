'use client';

import { MonthlyExpensesData } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';

interface MonthlyExpensesSectionProps {
  data: MonthlyExpensesData;
}

export default function MonthlyExpensesSection({ data }: MonthlyExpensesSectionProps) {
  if (!data.found) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المصروفات الشهرية</h2>
        <p className="text-red-600">
          تعذر استخراج جدول المصروفات الشهرية.
        </p>
        {data.missingHeaders.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            العناوين المطلوبة: {data.missingHeaders.join('، ')}
          </p>
        )}
      </div>
    );
  }

  if (data.lines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المصروفات الشهرية</h2>
        <p className="text-gray-500">لا توجد بيانات مصروفات شهرية</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المصروفات الشهرية</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-right">البند</th>
            <th className="px-3 py-2 text-right">المبلغ</th>
            <th className="px-3 py-2 text-right">المدفوع</th>
            <th className="px-3 py-2 text-right">الباقي</th>
            <th className="px-3 py-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, idx) => (
            <tr key={`${line.name}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 border-b font-medium text-gray-800">{line.name}</td>
              <td className="px-3 py-2 border-b text-blue-700 font-semibold">{formatNumber(line.amount)}</td>
              <td className="px-3 py-2 border-b text-green-700 font-semibold">{formatNumber(line.paid)}</td>
              <td className="px-3 py-2 border-b text-orange-700 font-semibold">{formatNumber(line.remaining)}</td>
              <td className="px-3 py-2 border-b text-gray-600">{line.notes || '-'}</td>
            </tr>
          ))}
          <tr className="bg-blue-50 font-bold">
            <td className="px-3 py-2 border-t">الإجمالي</td>
            <td className="px-3 py-2 border-t text-blue-800">{formatNumber(data.totals.amount)}</td>
            <td className="px-3 py-2 border-t text-green-800">{formatNumber(data.totals.paid)}</td>
            <td className="px-3 py-2 border-t text-orange-800">{formatNumber(data.totals.remaining)}</td>
            <td className="px-3 py-2 border-t">&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
