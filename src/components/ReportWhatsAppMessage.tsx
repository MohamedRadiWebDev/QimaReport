'use client';

import { useState } from 'react';
import { BasicBalances } from '@/lib/types';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { formatNumber } from '@/lib/numberUtils';

interface ReportWhatsAppMessageProps {
  date: string;
  kpis: BasicBalances;
  monthlyExpensesTotal: number;
  receivablesTotal: number;
}

export default function ReportWhatsAppMessage({
  date,
  kpis,
  monthlyExpensesTotal,
  receivablesTotal,
}: ReportWhatsAppMessageProps) {
  const [copied, setCopied] = useState(false);

  const bankText = kpis.bankBalance === null ? 'غير متاح' : `${formatNumber(kpis.bankBalance)} ج.م`;
  const safeText = kpis.safeBalance === null ? 'غير متاح' : `${formatNumber(kpis.safeBalance)} ج.م`;
  const ohdaText = kpis.totalOhda === null ? 'غير متاح' : `${formatNumber(kpis.totalOhda)} ج.م`;
  const solfText = kpis.totalSolf === null ? 'غير متاح' : `${formatNumber(kpis.totalSolf)} ج.م`;

  const message = `📅 تقرير الريبورت – ${formatDateForDisplay(date)}

🏦 رصيد البنك: ${bankText}
💵 رصيد الخزينة: ${safeText}
👛 إجمالي العهد: ${ohdaText}
🧾 إجمالي السلف: ${solfText}

📌 إجمالي المصروفات الشهرية: ${formatNumber(monthlyExpensesTotal)} ج.م
📎 إجمالي المستحقات (الإيرادات): ${formatNumber(receivablesTotal)} ج.م`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">رسالة واتساب للريبورت</h2>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 whitespace-pre-wrap text-gray-800">
        {message}
      </div>
      <button
        onClick={handleCopy}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          copied ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {copied ? '✓ تم النسخ!' : 'نسخ الرسالة'}
      </button>
    </div>
  );
}
