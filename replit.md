# Arabic Daily Expense Report Generator

## Overview
A Next.js (App Router) TypeScript web application that processes multi-sheet Excel files to generate clean Arabic daily expense reports ready to send via WhatsApp.

## Features
- Excel file upload with drag-and-drop support
- Date picker (defaults to today) for flexible report generation
- Robust date parsing supporting Excel serial numbers and text formats
- Extracts data from 3 Arabic-named sheets: الخزينه, خزينه السلف, العهد
- Calculates expenses, loans (out/in), and custody (out/in) totals
- RTL Arabic interface with summary cards and detailed tables
- WhatsApp-ready message generator with one-click copy

## Project Architecture

### Directory Structure
```
src/
├── app/
│   ├── globals.css      # Tailwind CSS with RTL configuration
│   ├── layout.tsx       # Root layout with Arabic metadata
│   └── page.tsx         # Main page with upload and report UI
├── components/
│   ├── SummaryCards.tsx   # Summary totals display
│   ├── ExpensesTable.tsx  # Expenses table component
│   ├── LoansTable.tsx     # Loans table component
│   ├── CustodyTable.tsx   # Custody table component
│   ├── WhatsAppMessage.tsx # WhatsApp message with copy
│   └── ErrorDisplay.tsx    # Error handling display
└── lib/
    ├── dateUtils.ts      # Date parsing utilities
    ├── numberUtils.ts    # Number parsing utilities
    ├── excelParser.ts    # Excel file parsing logic
    └── types.ts          # TypeScript interfaces
```

### Excel Sheet Structure
1. **الخزينه (Expenses)**: Filter by التاريخ, sum المنصرف
2. **خزينه السلف (Loans)**: Filter by التاريخ, classify by سلفه/سداد
3. **العهد (Custody)**: Filter by التاريخ, classify by العهدة/سداد

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (RTL)
- xlsx (SheetJS) for Excel parsing

## Running the Application
```bash
npm install
npm run dev
```

The app runs on port 5000.

## Recent Changes
- 2025-12-15: Initial implementation with full feature set
