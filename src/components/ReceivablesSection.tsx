'use client';

import { ReceivablesData } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';

interface ReceivablesSectionProps {
  data: ReceivablesData;
}

export default function ReceivablesSection({ data }: ReceivablesSectionProps) {
  if (!data.found) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">الإيرادات والمستحقات</h2>
        <p className="text-red-600">تعذر استخراج جدول الإيرادات والمستحقات.</p>
        {data.missingHeaders.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            العناوين المطلوبة: {data.missingHeaders.join('، ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المستحقات</p>
          <p className="text-2xl font-bold text-blue-700">{formatNumber(data.totals.receivablesTotal)} ج.م</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المطلوب تحويله</p>
          <p className="text-2xl font-bold text-green-700">{formatNumber(data.totals.toTransferTotal)} ج.م</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-amber-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المسدد</p>
          <p className="text-2xl font-bold text-amber-700">{formatNumber(data.totals.paidTotal)} ج.م</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">جدول المستحقات</h2>
        {data.rows.length === 0 ? (
          <p className="text-gray-500">لا توجد مستحقات (المستحق = 0)</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-right">الشهر</th>
                <th className="px-3 py-2 text-right">العميل</th>
                <th className="px-3 py-2 text-right">المطلوب تحويله</th>
                <th className="px-3 py-2 text-right">المبلغ المسدد</th>
                <th className="px-3 py-2 text-right">المستحق</th>
                <th className="px-3 py-2 text-right">14%</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, idx) => (
                <tr key={`${row.customer}-${row.month}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border-b">{row.month}</td>
                  <td className="px-3 py-2 border-b font-semibold text-gray-800">{row.customer}</td>
                  <td className="px-3 py-2 border-b text-green-700">{formatNumber(row.toTransfer)}</td>
                  <td className="px-3 py-2 border-b text-amber-700">{formatNumber(row.paid)}</td>
                  <td className="px-3 py-2 border-b text-blue-700 font-bold">{formatNumber(row.receivable)}</td>
                  <td className="px-3 py-2 border-b text-gray-700">{formatNumber(row.tax14)}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td className="px-3 py-2 border-t">الإجمالي</td>
                <td className="px-3 py-2 border-t" />
                <td className="px-3 py-2 border-t text-green-800">{formatNumber(data.totals.toTransferTotal)}</td>
                <td className="px-3 py-2 border-t text-amber-800">{formatNumber(data.totals.paidTotal)}</td>
                <td className="px-3 py-2 border-t text-blue-800">{formatNumber(data.totals.receivablesTotal)}</td>
                <td className="px-3 py-2 border-t text-gray-800">{formatNumber(data.totals.tax14Total)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">تجميع حسب العميل</h3>
        {data.customerSummary.length === 0 ? (
          <p className="text-gray-500">لا توجد مستحقات متاحة للتجميع</p>
        ) : (
          <ul className="space-y-2">
            {data.customerSummary.map((item) => (
              <li key={item.customer} className="flex justify-between border-b pb-1 text-sm">
                <span className="font-medium text-gray-700">{item.customer}</span>
                <span className="text-blue-700 font-semibold">{formatNumber(item.receivable)} ج.م</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
