import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function ImportModal({ onImport, onError }) {
  const inputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const imported = rows
          .map((row) => {
            const date = parseDate(row.Date || row.date);
            if (!date) return null;

            return {
              date: date.toISOString(),
              amount: Math.abs(parseFloat(row.Amount || row.amount || 0)) || 0,
              merchant: row.Merchant || row.Description || row.merchant || 'Imported Expense',
              category: row.Category || row.category || 'Other',
              type: String(row.Type || row.type || '').toLowerCase().includes('income')
                ? 'income'
                : 'expense'
            };
          })
          .filter(Boolean);

        if (imported.length === 0) {
          throw new Error('No valid transaction rows found. Include a valid Date column.');
        }
        onImport(imported);
      } catch (error) {
        console.error('Transaction import error:', error);
        onError(error.message || 'Failed to import transactions.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      onError('Failed to read the selected file.');
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        title="Import CSV or Excel transactions"
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:border-indigo-400/40 hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5 text-indigo-300" />
        {isImporting ? 'Importing...' : 'Import'}
      </button>
    </>
  );
}
