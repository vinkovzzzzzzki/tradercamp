import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { arrayToCSV, downloadCSV, generateFilename } from '../../services/export/csv';
import Skeleton from '../common/Skeleton';
import { storage, STORAGE_KEYS } from '../../services/persist';
import { parseDateSafe, formatDateDisplay } from '../../services/format/date';

interface TransactionsProps {
  isDark: boolean;
  emergencyTx: any[];
  investTx: any[];
  debts: any[];
}

const Transactions: React.FC<TransactionsProps> = ({ isDark, emergencyTx, investTx, debts }) => {
  const [query, setQuery] = useState(() => (storage.get(STORAGE_KEYS.FINANCE_TX_FILTERS, {})?.query || ''));
  const [typeFilter, setTypeFilter] = useState<'all' | 'fund' | 'invest' | 'debt'>(
    () => (storage.get(STORAGE_KEYS.FINANCE_TX_FILTERS, {})?.type || 'all')
  );
  const [currencyFilter, setCurrencyFilter] = useState<string>(
    () => (storage.get(STORAGE_KEYS.FINANCE_TX_FILTERS, {})?.currency || '')
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.FINANCE_TX_FILTERS, { query, type: typeFilter, currency: currencyFilter });
  }, [query, typeFilter, currencyFilter]);

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

  const copy = (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
        (navigator as any).clipboard.writeText(text);
      }
    } catch {}
  };

  const formatAmount = (amount: number, currency?: string) => {
    try {
      const num = Number(amount);
      if (!Number.isFinite(num)) return String(amount);
      const formatted = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
      return currency ? `${formatted} ${currency}` : formatted;
    } catch {
      return `${amount} ${currency || ''}`.trim();
    }
  };

  const getAmountStyle = (op?: string, amount?: number) => {
    const opStr = (op || '').toLowerCase();
    const isIn = /in|deposit|income|поп|доход/.test(opStr);
    const isOut = /out|withdraw|expense|спис|расход/.test(opStr);
    if (isIn) return styles.amountPositive;
    if (isOut) return styles.amountNegative;
    if (typeof amount === 'number') return amount >= 0 ? styles.amountPositive : styles.amountNegative;
    return styles.amountNeutral;
  };

  const grouped = useMemo(() => {
    const groups: Record<string, typeof rows> = {};
    rows.forEach(r => {
      const d = parseDateSafe(r.date);
      const key = d ? formatDateDisplay(d) : 'Без даты';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    const toTime = (key: string) => {
      // Try using first row date; fallback to 0
      const first = groups[key]?.[0];
      const d = first ? parseDateSafe(first.date) : null;
      return d ? d.getTime() : 0;
    };
    return Object.keys(groups)
      .sort((a, b) => toTime(b) - toTime(a))
      .map(k => ({ key: k, items: groups[k] }));
  }, [rows]);

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
      <ScrollView style={{ maxHeight: 320 }}>
        {grouped.map(group => (
          <View key={group.key} style={styles.group}>
            <Text style={[styles.groupTitle, isDark ? styles.groupTitleDark : null]}>{group.key}</Text>
            {group.items.map((r, idx) => (
              <Pressable key={idx} onLongPress={() => copy(`${r.type} ${r.op} ${r.amount} ${r.currency} ${r.place} ${r.note}`)} style={[styles.cardRow, isDark ? styles.cardRowDark : null]}>
                <View style={[styles.avatar, r.type === 'invest' ? styles.avatarInvest : r.type === 'debt' ? styles.avatarDebt : styles.avatarFund]}>
                  <Text style={styles.avatarText}>{r.type === 'invest' ? '📈' : r.type === 'debt' ? '🧾' : '💰'}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]} numberOfLines={1}>
                    {(r.type === 'fund' ? 'Подушка' : r.type === 'invest' ? 'Инвестиции' : 'Долги')} • {r.place || '-'}
                  </Text>
                  <Text style={[styles.cardSubtitle, isDark ? styles.cardSubtitleDark : null]} numberOfLines={1}>
                    {r.op}{r.note ? ` — ${r.note}` : ''}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={[styles.amount, getAmountStyle(r.op, r.amount)]}>
                    {formatAmount(r.amount, r.currency)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
        {rows.length === 0 && (
          <View style={{ paddingVertical: 12 }}>
            <Skeleton height={12} style={{ marginBottom: 8 }} />
            <Skeleton height={12} style={{ marginBottom: 8 }} />
            <Skeleton height={12} />
          </View>
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
    borderColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1f2a36',
  },
  typeBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeText: {
    color: '#9fb0c0',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#fff',
  },
  group: {
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
  },
  groupTitleDark: {
    color: '#9ca3af',
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
  trAlt: {
    backgroundColor: '#f9fafb',
  },
  trDarkAlt: {
    backgroundColor: '#1a1f29',
  },
  td: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
  },
  tdDark: {
    color: '#e6edf3',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  cardRowDark: {
    backgroundColor: '#0f1620',
    borderColor: '#253142',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
  },
  avatarFund: { backgroundColor: '#e3f2fd' },
  avatarInvest: { backgroundColor: '#e8f5e9' },
  avatarDebt: { backgroundColor: '#fff7ed' },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  cardTitleDark: {
    color: '#e6edf3',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  cardSubtitleDark: {
    color: '#9ca3af',
  },
  amountWrap: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
  },
  amountPositive: {
    color: '#16a34a',
  },
  amountNegative: {
    color: '#dc2626',
  },
  amountNeutral: {
    color: '#1f2937',
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


