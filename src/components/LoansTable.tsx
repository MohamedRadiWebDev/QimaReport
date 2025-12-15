'use client';

import { LoanRow } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';

interface LoansTableProps {
  loans: LoanRow[];
}

export default function LoansTable({ loans }: LoansTableProps) {
  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">السلف اليوم</h2>
        <p className="text-gray-500 text-center py-8">لا توجد بيانات لهذا اليوم</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">السلف اليوم</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-right">اسم الموظف</th>
            <th className="px-3 py-2 text-right">الكود</th>
            <th className="px-3 py-2 text-right">القسم</th>
            <th className="px-3 py-2 text-right">الفرع</th>
            <th className="px-3 py-2 text-right">النوع</th>
            <th className="px-3 py-2 text-right">المبلغ</th>
            <th className="px-3 py-2 text-right">طريقة السداد</th>
            <th className="px-3 py-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 border-b">{row['اسم الموظف']}</td>
              <td className="px-3 py-2 border-b">{row.الكود}</td>
              <td className="px-3 py-2 border-b">{row.القسم}</td>
              <td className="px-3 py-2 border-b">{row.الفرع}</td>
              <td className="px-3 py-2 border-b">
                <span className={`px-2 py-1 rounded text-xs ${
                  row['سلفه / سداد']?.includes('سداد') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {row['سلفه / سداد']}
                </span>
              </td>
              <td className="px-3 py-2 border-b font-semibold text-orange-600">
                {formatNumber(row.السلفه)}
              </td>
              <td className="px-3 py-2 border-b">{row['طريق السداد']}</td>
              <td className="px-3 py-2 border-b text-gray-600">{row.ملاحظات}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
