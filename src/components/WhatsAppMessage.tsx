'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/numberUtils';
import { formatDateForDisplay } from '@/lib/dateUtils';

interface WhatsAppMessageProps {
  date: string;
  expensesTotal: number;
  custodyOut: number;
  loansOut: number;
  totalOut: number;
}

export default function WhatsAppMessage({
  date,
  expensesTotal,
  custodyOut,
  loansOut,
  totalOut,
}: WhatsAppMessageProps) {
  const [copied, setCopied] = useState(false);

  const message = `📅 تقرير يومي – ${formatDateForDisplay(date)}

💰 مصروفات الخزينة: ${formatNumber(expensesTotal)} ج.م
👛 العهد (الخارج): ${formatNumber(custodyOut)} ج.م
🧾 السلف (الخارج): ${formatNumber(loansOut)} ج.م

📊 إجمالي الخارج اليوم: ${formatNumber(totalOut)} ج.م`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        رسالة واتساب جاهزة
      </h2>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 whitespace-pre-wrap text-gray-800">
        {message}
      </div>
      <button
        onClick={handleCopy}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {copied ? '✓ تم النسخ!' : 'نسخ الرسالة'}
      </button>
    </div>
  );
}
