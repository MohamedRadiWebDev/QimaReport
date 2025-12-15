'use client';

import { ExpenseRow } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';

interface ExpensesTableProps {
  expenses: ExpenseRow[];
}

export default function ExpensesTable({ expenses }: ExpensesTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">مصروفات اليوم</h2>
        <p className="text-gray-500 text-center py-8">لا توجد بيانات لهذا اليوم</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">مصروفات اليوم</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-right">البيان</th>
            <th className="px-3 py-2 text-right">الشركه / الموظف</th>
            <th className="px-3 py-2 text-right">القسم</th>
            <th className="px-3 py-2 text-right">الفرع</th>
            <th className="px-3 py-2 text-right">نوع المصروف</th>
            <th className="px-3 py-2 text-right">رقم الفاتورة</th>
            <th className="px-3 py-2 text-right">المبلغ</th>
            <th className="px-3 py-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 border-b">{row.البيان}</td>
              <td className="px-3 py-2 border-b">
                {row['اسم الشركه المنصرف لها'] || row['اسم الموظف المنصرف له']}
              </td>
              <td className="px-3 py-2 border-b">{row.القسم}</td>
              <td className="px-3 py-2 border-b">{row.الفرع}</td>
              <td className="px-3 py-2 border-b">{row['نوع المصروف']}</td>
              <td className="px-3 py-2 border-b">{row['رقم الفاتورة']}</td>
              <td className="px-3 py-2 border-b font-semibold text-blue-600">
                {formatNumber(row.المنصرف)}
              </td>
              <td className="px-3 py-2 border-b text-gray-600">{row.ملاحظات}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
