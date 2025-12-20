'use client';

import { BasicBalances } from '@/lib/types';
import { formatNumber } from '@/lib/numberUtils';

interface ReportKpiCardsProps {
  kpis: BasicBalances;
}

const KPI_LABELS: Record<keyof BasicBalances, { label: string; color: string }> = {
  bankBalance: { label: 'رصيد البنك', color: 'border-blue-500 text-blue-600' },
  safeBalance: { label: 'رصيد الخزينة', color: 'border-emerald-500 text-emerald-600' },
  totalSolf: { label: 'إجمالي السلف', color: 'border-orange-500 text-orange-600' },
  totalOhda: { label: 'إجمالي العهد', color: 'border-purple-500 text-purple-600' },
};

export default function ReportKpiCards({ kpis }: ReportKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {(Object.keys(KPI_LABELS) as (keyof BasicBalances)[]).map((key) => {
        const value = kpis[key];
        const { label, color } = KPI_LABELS[key];
        return (
          <div
            key={key}
            className={`bg-white rounded-lg shadow-md p-5 border-r-4 ${color}`}
          >
            <h3 className="text-gray-600 text-sm mb-2">{label}</h3>
            <p className="text-2xl font-bold text-gray-800">
              {value === null ? 'غير متاح' : `${formatNumber(value)} ج.م`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
