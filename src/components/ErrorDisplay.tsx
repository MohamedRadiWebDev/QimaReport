'use client';

import { ValidationError } from '@/lib/types';

interface ErrorDisplayProps {
  errors: ValidationError[];
}

export default function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <h3 className="text-red-800 font-bold mb-2">أخطاء في الملف</h3>
      <ul className="list-disc list-inside space-y-2">
        {errors.map((error, idx) => (
          <li key={idx} className="text-red-700">
            {error.message}
            {error.details && error.details.length > 0 && (
              <ul className="list-none mr-4 mt-1 text-sm">
                {error.details.map((detail, dIdx) => (
                  <li key={dIdx} className="text-red-600">• {detail}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
