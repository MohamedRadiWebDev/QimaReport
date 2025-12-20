'use client';

import { ReceivablesData } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';
import { useMemo, useState } from 'react';

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

  const monthOptions = useMemo(() => {
    const unique = new Map<string, { label: string; monthNumber: number | null }>();
    data.rows.forEach((row) => {
      if (!unique.has(row.monthLabel)) {
        unique.set(row.monthLabel, { label: row.monthLabel, monthNumber: row.monthNumber });
      }
    });
    return Array.from(unique.values()).sort((a, b) => {
      if (a.monthNumber && b.monthNumber) return a.monthNumber - b.monthNumber;
      if (a.monthNumber) return -1;
      if (b.monthNumber) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [data.rows]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    data.rows.forEach((row) => {
      if (row.year) {
        years.add(row.year.toString());
      } else {
        years.add('غير محدد');
      }
    });
    return Array.from(years).sort((a, b) => {
      if (a === 'غير محدد') return 1;
      if (b === 'غير محدد') return -1;
      return Number(a) - Number(b);
    });
  }, [data.rows]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('الكل');

  const filteredRows = useMemo(() => {
    return data.rows.filter((row) => {
      const matchesMonth =
        selectedMonths.length === 0 || selectedMonths.includes(row.monthLabel);
      const yearLabel = row.year ? row.year.toString() : 'غير محدد';
      const matchesYear = selectedYear === 'الكل' ? true : selectedYear === yearLabel;
      return matchesMonth && matchesYear;
    });
  }, [data.rows, selectedMonths, selectedYear]);

  const filteredTotals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => {
          acc.receivablesTotal += row.receivable;
          acc.toTransferTotal += row.toTransfer;
          acc.paidTotal += row.paid;
          acc.tax14Total += row.tax14 ?? 0;
          return acc;
        },
        { receivablesTotal: 0, toTransferTotal: 0, paidTotal: 0, tax14Total: 0 }
      ),
    [filteredRows]
  );

  const filteredCustomerSummary = useMemo(
    () =>
      Object.entries(
        filteredRows.reduce<Record<string, number>>((acc, row) => {
          if (!acc[row.customer]) acc[row.customer] = 0;
          acc[row.customer] += row.receivable;
          return acc;
        }, {})
      )
        .map(([customer, receivable]) => ({ customer, receivable }))
        .sort((a, b) => b.receivable - a.receivable),
    [filteredRows]
  );

  const toggleMonth = (label: string) => {
    setSelectedMonths((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="الكل">الكل</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <p className="text-sm font-medium text-gray-700 mb-1">الشهور</p>
            <div className="flex flex-wrap gap-2">
              {monthOptions.map((month) => {
                const checked = selectedMonths.includes(month.label);
                return (
                  <label
                    key={month.label}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-sm cursor-pointer ${
                      checked ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMonth(month.label)}
                    />
                    <span>{month.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المستحقات</p>
          <p className="text-2xl font-bold text-blue-700">{formatNumber(filteredTotals.receivablesTotal)} ج.م</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المطلوب تحويله</p>
          <p className="text-2xl font-bold text-green-700">{formatNumber(filteredTotals.toTransferTotal)} ج.م</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-amber-500">
          <p className="text-sm text-gray-600 mb-1">إجمالي المسدد</p>
          <p className="text-2xl font-bold text-amber-700">{formatNumber(filteredTotals.paidTotal)} ج.م</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">جدول المستحقات</h2>
        {filteredRows.length === 0 ? (
          <p className="text-gray-500">لا توجد مستحقات أكبر من جنيه واحد</p>
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
              {filteredRows.map((row, idx) => (
                <tr key={`${row.customer}-${row.monthKey}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border-b">{row.monthLabel}</td>
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
                <td className="px-3 py-2 border-t text-green-800">{formatNumber(filteredTotals.toTransferTotal)}</td>
                <td className="px-3 py-2 border-t text-amber-800">{formatNumber(filteredTotals.paidTotal)}</td>
                <td className="px-3 py-2 border-t text-blue-800">{formatNumber(filteredTotals.receivablesTotal)}</td>
                <td className="px-3 py-2 border-t text-gray-800">{formatNumber(filteredTotals.tax14Total)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">تجميع حسب العميل</h3>
        {filteredCustomerSummary.length === 0 ? (
          <p className="text-gray-500">لا توجد مستحقات متاحة للتجميع</p>
        ) : (
          <ul className="space-y-2">
            {filteredCustomerSummary.map((item) => (
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
