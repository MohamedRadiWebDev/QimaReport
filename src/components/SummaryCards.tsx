'use client';

import { formatNumber } from '@/lib/numberUtils';

interface SummaryCardsProps {
  expensesTotal: number;
  loansOut: number;
  loansIn: number;
  custodyOut: number;
  custodyIn: number;
  totalOut: number;
}

export default function SummaryCards({
  expensesTotal,
  loansOut,
  loansIn,
  custodyOut,
  custodyIn,
  totalOut,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
        <h3 className="text-gray-600 text-sm mb-2">إجمالي مصروفات اليوم</h3>
        <p className="text-2xl font-bold text-blue-600">{formatNumber(expensesTotal)} ج.م</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-purple-500">
        <h3 className="text-gray-600 text-sm mb-2">إجمالي العهد (الخارج)</h3>
        <p className="text-2xl font-bold text-purple-600">{formatNumber(custodyOut)} ج.م</p>
        {custodyIn > 0 && (
          <p className="text-xs text-gray-500 mt-1">السداد: {formatNumber(custodyIn)} ج.م</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-orange-500">
        <h3 className="text-gray-600 text-sm mb-2">إجمالي السلف (الخارج)</h3>
        <p className="text-2xl font-bold text-orange-600">{formatNumber(loansOut)} ج.م</p>
        {loansIn > 0 && (
          <p className="text-xs text-gray-500 mt-1">السداد: {formatNumber(loansIn)} ج.م</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-green-500">
        <h3 className="text-gray-600 text-sm mb-2">إجمالي الخارج اليوم</h3>
        <p className="text-2xl font-bold text-green-600">{formatNumber(totalOut)} ج.م</p>
      </div>
    </div>
  );
}
