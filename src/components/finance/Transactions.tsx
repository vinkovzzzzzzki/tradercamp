import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { arrayToCSV, downloadCSV, generateFilename } from '../../services/export/csv';

interface TransactionsProps {
  isDark: boolean;
  emergencyTx: any[];
  investTx: any[];
  debts: any[];
}

const Transactions: React.FC<TransactionsProps> = ({ isDark, emergencyTx, investTx, debts }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fund' | 'invest' | 'debt'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('');

  const rows = useMemo(() => {
    const all = [
      ...emergencyTx.map(tx => ({
        type: 'fund',
        date: tx.date,
        op: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        place: tx.location,
        note: tx.note || ''
      })),
      ...investTx.map(tx => ({
        type: 'invest',
        date: tx.date,
        op: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        place: tx.destination,
        note: tx.note || ''
      })),
      ...debts.flatMap(debt => (debt.history || []).map((tx: any) => ({
        type: 'debt',
        date: tx.date,
        op: tx.type,
        amount: tx.amount,
        currency: debt.currency,
        place: debt.name,
        note: tx.note || ''
      })))
    ];

    return all.filter(r => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (currencyFilter && r.currency?.toLowerCase() !== currencyFilter.toLowerCase()) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        r.date?.toLowerCase().includes(q) ||
        r.op?.toLowerCase().includes(q) ||
        String(r.amount).includes(q) ||
        r.currency?.toLowerCase().includes(q) ||
        r.place?.toLowerCase().includes(q) ||
        r.note?.toLowerCase().includes(q)
      );
    });
  }, [emergencyTx, investTx, debts, typeFilter, currencyFilter, query]);

  const exportCSV = () => {
    const csv = arrayToCSV(rows.map(r => ({
      Тип: r.type === 'fund' ? 'Резервный фонд' : r.type === 'invest' ? 'Инвестиции' : 'Долги',
      Дата: r.date,
      Операция: r.op,
      Сумма: r.amount,
      Валюта: r.currency,
      'Место/Направление': r.place,
      Заметка: r.note
    })));
    downloadCSV(csv, generateFilename('transactions'));
  };

  return (
    <View style={[styles.card, isDark ? styles.cardDark : null]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDark ? styles.titleDark : null]}>Транзакции</Text>
        <Pressable style={styles.exportBtn} onPress={exportCSV}>
          <Text style={styles.exportText}>Экспорт CSV</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : null]}
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск..."
        />
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : null]}
          value={currencyFilter}
          onChangeText={setCurrencyFilter}
          placeholder="Валюта (например, USD)"
        />
        <View style={styles.typeRow}>
          {[
            { k: 'all', label: 'Все' },
            { k: 'fund', label: 'Подушка' },
            { k: 'invest', label: 'Инвестиции' },
            { k: 'debt', label: 'Долги' },
          ].map(btn => (
            <Pressable key={btn.k} style={[styles.typeBtn, typeFilter === (btn.k as any) ? styles.typeBtnActive : null]} onPress={() => setTypeFilter(btn.k as any)}>
              <Text style={[styles.typeText, typeFilter === (btn.k as any) ? styles.typeTextActive : null]}>{btn.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.tableHeader}>
        {['Тип', 'Дата', 'Операция', 'Сумма', 'Валюта', 'Место', 'Заметка'].map(h => (
          <Text key={h} style={[styles.th, isDark ? styles.thDark : null]}>{h}</Text>
        ))}
      </View>
      <ScrollView style={{ maxHeight: 320 }}>
        {rows.map((r, idx) => (
          <View key={idx} style={styles.tr}>
            <Text style={[styles.td, isDark ? styles.tdDark : null]}>
              {r.type === 'fund' ? 'Подушка' : r.type === 'invest' ? 'Инвестиции' : 'Долги'}
            </Text>
            <Text style={[styles.td, isDark ? styles.tdDark : null]}>{r.date}</Text>
            <Text style={[styles.td, isDark ? styles.tdDark : null]}>{r.op}</Text>
            <Text style={[styles.td, isDark ? styles.tdDark : null]}>{r.amount}</Text>
            <Text style={[styles.td, isDark ? styles.tdDark : null]}>{r.currency}</Text>
            <Text style={[styles.td, isDark ? styles.tdDark : null]}>{r.place}</Text>
            <Text style={[styles.td, isDark ? styles.tdDark : null]} numberOfLines={1}>{r.note}</Text>
          </View>
        ))}
        {rows.length === 0 && (
          <Text style={[styles.empty, isDark ? styles.emptyDark : null]}>Нет данных</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardDark: {
    backgroundColor: '#121820',
    borderColor: '#374151',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  titleDark: {
    color: '#e6edf3',
  },
  exportBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 160,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  typeBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeText: {
    color: '#374151',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    marginBottom: 6,
  },
  th: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  thDark: {
    color: '#9ca3af',
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  td: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
  },
  tdDark: {
    color: '#e6edf3',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 12,
  },
  emptyDark: {
    color: '#9ca3af',
  },
});

export default Transactions;


