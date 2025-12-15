'use client';

import { CustodyRow } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';

interface CustodyTableProps {
  custody: CustodyRow[];
}

export default function CustodyTable({ custody }: CustodyTableProps) {
  if (custody.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">العهد اليوم</h2>
        <p className="text-gray-500 text-center py-8">لا توجد بيانات لهذا اليوم</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">العهد اليوم</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-right">البيان</th>
            <th className="px-3 py-2 text-right">المنصرف اليه</th>
            <th className="px-3 py-2 text-right">القسم</th>
            <th className="px-3 py-2 text-right">التصنيف</th>
            <th className="px-3 py-2 text-right">النوع</th>
            <th className="px-3 py-2 text-right">المبلغ</th>
            <th className="px-3 py-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {custody.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 border-b">{row.البيان}</td>
              <td className="px-3 py-2 border-b">{row['المنصرف اليه']}</td>
              <td className="px-3 py-2 border-b">{row.القسم}</td>
              <td className="px-3 py-2 border-b">{row.التصنيف}</td>
              <td className="px-3 py-2 border-b">
                <span className={`px-2 py-1 rounded text-xs ${
                  row['العهدة / سداد']?.includes('سداد') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {row['العهدة / سداد']}
                </span>
              </td>
              <td className="px-3 py-2 border-b font-semibold text-purple-600">
                {formatNumber(row.العهدة)}
              </td>
              <td className="px-3 py-2 border-b text-gray-600">{row.ملاحظات}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
