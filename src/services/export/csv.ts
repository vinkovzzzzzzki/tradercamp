// CSV export utilities - exact reproduction of original export logic
import { formatIsoDate } from '../format';

// Convert array of objects to CSV string
export function arrayToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) return '';
  
  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.map(header => `"${header}"`).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Handle different data types
      if (value === null || value === undefined) return '""';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (typeof value === 'number') return value.toString();
      if (value instanceof Date) return `"${formatIsoDate(value)}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

// Export trades to CSV
export function exportTradesToCSV(trades: any[]): string {
  const headers = [
    'ID',
    'Дата',
    'Актив',
    'Сторона',
    'Количество',
    'Цена',
    'Стоп-лосс',
    'Тейк-профит',
    'Рынок',
    'Стиль',
    'Заметки',
    'P&L',
    'Статус'
  ];
  
  const csvData = trades.map(trade => ({
    'ID': trade.id,
    'Дата': trade.date,
    'Актив': trade.asset,
    'Сторона': trade.side,
    'Количество': trade.qty,
    'Цена': trade.price,
    'Стоп-лосс': trade.stopLoss || '',
    'Тейк-профит': trade.takeProfit || '',
    'Рынок': trade.market,
    'Стиль': trade.style,
    'Заметки': trade.notes || '',
    'P&L': trade.pnl || '',
    'Статус': trade.status || 'Открыт'
  }));
  
  return arrayToCSV(csvData, headers);
}

// Export financial data to CSV
export function exportFinancialDataToCSV(
  emergencyTx: any[],
  investTx: any[],
  debts: any[]
): string {
  const allTransactions = [
    ...emergencyTx.map(tx => ({
      'Тип': 'Резервный фонд',
      'Дата': tx.date,
      'Операция': tx.type === 'deposit' ? 'Пополнение' : 'Снятие',
      'Сумма': tx.amount,
      'Валюта': tx.currency,
      'Место/Направление': tx.location,
      'Заметка': tx.note || ''
    })),
    ...investTx.map(tx => ({
      'Тип': 'Инвестиции',
      'Дата': tx.date,
      'Операция': tx.type === 'in' ? 'Вложение' : 'Вывод',
      'Сумма': tx.amount,
      'Валюта': tx.currency,
      'Место/Направление': tx.destination,
      'Заметка': tx.note || ''
    })),
    ...debts.flatMap(debt => 
      debt.tx.map((tx: any) => ({
        'Тип': 'Долги',
        'Дата': tx.date,
        'Операция': tx.type === 'add' ? 'Добавление долга' : 'Погашение',
        'Сумма': tx.amount,
        'Валюта': debt.currency,
        'Место/Направление': debt.name,
        'Заметка': tx.note || ''
      }))
    )
  ];
  
  return arrayToCSV(allTransactions);
}

// Download CSV file (for web)
export function downloadCSV(csvContent: string, filename: string): void {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Generate filename with timestamp
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
}
