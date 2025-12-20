'use client';

import { useState, useRef } from 'react';
import { parseExcelFile } from '@/lib/excelParser';
import { getTodayDateString } from '@/lib/dateUtils';
import { ReportData, ValidationError } from '@/lib/types';
import SummaryCards from '@/components/SummaryCards';
import ExpensesTable from '@/components/ExpensesTable';
import LoansTable from '@/components/LoansTable';
import CustodyTable from '@/components/CustodyTable';
import WhatsAppMessage from '@/components/WhatsAppMessage';
import ErrorDisplay from '@/components/ErrorDisplay';
import ReportTab from '@/components/ReportTab';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'report'>('daily');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setReportData(null);
      setErrors([]);
      setActiveTab('daily');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setReportData(null);
      setErrors([]);
      setActiveTab('daily');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const generateReport = async () => {
    if (!file) {
      setErrors([{ type: 'file', message: 'الرجاء اختيار ملف Excel أولاً' }]);
      return;
    }

    setLoading(true);
    setErrors([]);
    setReportData(null);
    setActiveTab('daily');

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, selectedDate);
      
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      
      if (result.data) {
        setReportData(result.data);
      }
    } catch (err) {
      setErrors([{ 
        type: 'file', 
        message: 'حدث خطأ غير متوقع أثناء معالجة الملف',
        details: [String(err)]
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          تقرير المصروفات اليومي
        </h1>
        <p className="text-gray-600">
          ارفع ملف Excel لتجهيز تقرير اليوم
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-gray-500">
            {file ? (
              <div>
                <p className="text-lg font-semibold text-gray-700">{file.name}</p>
                <p className="text-sm mt-1">اضغط لتغيير الملف</p>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-lg">اسحب وأفلت ملف Excel هنا</p>
                <p className="text-sm mt-1">أو اضغط لاختيار الملف</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ التقرير
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading || !file}
            className={`flex-1 w-full sm:w-auto py-3 px-6 rounded-lg font-semibold transition-colors ${
              loading || !file
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'جاري التحليل...' : 'تجهيز تقرير اليوم'}
          </button>
        </div>
      </div>

      <ErrorDisplay errors={errors} />

      {reportData && (
        <>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-lg font-semibold border ${
                activeTab === 'daily'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              التقرير اليومي
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg font-semibold border ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Report
            </button>
          </div>

          {activeTab === 'daily' ? (
            <>
              <SummaryCards
                expensesTotal={reportData.daily.totals.expensesTotal}
                loansOut={reportData.daily.totals.loansOut}
                loansIn={reportData.daily.totals.loansIn}
                custodyOut={reportData.daily.totals.custodyOut}
                custodyIn={reportData.daily.totals.custodyIn}
                totalOut={reportData.daily.totals.totalOut}
              />

              <WhatsAppMessage
                date={reportData.daily.date}
                expensesTotal={reportData.daily.totals.expensesTotal}
                custodyOut={reportData.daily.totals.custodyOut}
                loansOut={reportData.daily.totals.loansOut}
                totalOut={reportData.daily.totals.totalOut}
              />

              <ExpensesTable expenses={reportData.daily.expenses} />
              <CustodyTable custody={reportData.daily.custody} />
              <LoansTable loans={reportData.daily.loans} />
            </>
          ) : (
            <ReportTab report={reportData.report} selectedDate={selectedDate} />
          )}
        </>
      )}
    </main>
  );
}
