// Journal feature component - exact reproduction of original trading journal functionality
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { User } from '../../state/types';

interface JournalProps {
  currentUser: User | null;
  isDark: boolean;
}

const Journal: React.FC<JournalProps> = ({ currentUser, isDark }) => {
  const [journalView, setJournalView] = useState<'new' | 'list'>('new');
  const [newTrade, setNewTrade] = useState({
    asset: '',
    side: 'BUY',
    qty: '',
    price: '',
    stopLoss: '',
    takeProfit: '',
    market: 'Crypto',
    style: 'Скальпинг',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [trades, setTrades] = useState<any[]>([]);

  const addTrade = () => {
    if (!currentUser) return;
    if (!newTrade.asset || !newTrade.qty || !newTrade.price) return;

    const trade = {
      id: Date.now(),
      userId: currentUser.id,
      ...newTrade
    };

    setTrades(prev => [trade, ...prev]);
    setNewTrade({
      asset: '',
      side: 'BUY',
      qty: '',
      price: '',
      stopLoss: '',
      takeProfit: '',
      market: 'Crypto',
      style: 'Скальпинг',
      date: new Date().toISOString().slice(0, 10),
      notes: ''
    });
  };

  const deleteTrade = (id: number) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      {/* Journal view selector */}
      <View style={styles.viewSelector}>
        <Pressable
          style={[styles.viewButton, journalView === 'new' ? styles.viewButtonActive : null]}
          onPress={() => setJournalView('new')}
        >
          <Text style={[styles.viewButtonText, journalView === 'new' ? styles.viewButtonTextActive : null]}>
            Новая сделка
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewButton, journalView === 'list' ? styles.viewButtonActive : null]}
          onPress={() => setJournalView('list')}
        >
          <Text style={[styles.viewButtonText, journalView === 'list' ? styles.viewButtonTextActive : null]}>
            История сделок
          </Text>
        </Pressable>
      </View>

      {journalView === 'new' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            📝 Новая сделка
          </Text>
          {!currentUser && (
            <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
              Войдите, чтобы добавлять сделки
            </Text>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Инструмент</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newTrade.asset}
                onChangeText={(t) => setNewTrade(v => ({ ...v, asset: t }))}
                placeholder="BTCUSDT"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Сторона</Text>
              <View style={styles.pickerContainer}>
                {['BUY', 'SELL'].map(side => (
                  <Pressable
                    key={side}
                    style={[
                      styles.pickerOption,
                      isDark ? styles.pickerOptionDark : null,
                      newTrade.side === side ? styles.pickerOptionActive : null
                    ]}
                    onPress={() => setNewTrade(v => ({ ...v, side }))}
                  >
                    <Text style={[
                      styles.pickerText,
                      isDark ? styles.pickerTextDark : null,
                      newTrade.side === side ? styles.pickerTextActive : null
                    ]}>
                      {side}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Количество</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newTrade.qty}
                onChangeText={(t) => setNewTrade(v => ({ ...v, qty: t }))}
                keyboardType="numeric"
                placeholder="0.05"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Цена</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newTrade.price}
                onChangeText={(t) => setNewTrade(v => ({ ...v, price: t }))}
                keyboardType="numeric"
                placeholder="60000"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Stop Loss</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newTrade.stopLoss}
                onChangeText={(t) => setNewTrade(v => ({ ...v, stopLoss: t }))}
                keyboardType="numeric"
                placeholder="58000"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Take Profit</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : null]}
                value={newTrade.takeProfit}
                onChangeText={(t) => setNewTrade(v => ({ ...v, takeProfit: t }))}
                keyboardType="numeric"
                placeholder="63000"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Рынок</Text>
              <View style={styles.pickerContainer}>
                {['Forex', 'Stock', 'Metals', 'Crypto'].map(market => (
                  <Pressable
                    key={market}
                    style={[
                      styles.pickerOption,
                      isDark ? styles.pickerOptionDark : null,
                      newTrade.market === market ? styles.pickerOptionActive : null
                    ]}
                    onPress={() => setNewTrade(v => ({ ...v, market }))}
                  >
                    <Text style={[
                      styles.pickerText,
                      isDark ? styles.pickerTextDark : null,
                      newTrade.market === market ? styles.pickerTextActive : null
                    ]}>
                      {market}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark ? styles.labelDark : null]}>Стиль</Text>
              <View style={styles.pickerContainer}>
                {['Скальпинг', 'Интрадей', 'Среднесрок'].map(style => (
                  <Pressable
                    key={style}
                    style={[
                      styles.pickerOption,
                      isDark ? styles.pickerOptionDark : null,
                      newTrade.style === style ? styles.pickerOptionActive : null
                    ]}
                    onPress={() => setNewTrade(v => ({ ...v, style }))}
                  >
                    <Text style={[
                      styles.pickerText,
                      isDark ? styles.pickerTextDark : null,
                      newTrade.style === style ? styles.pickerTextActive : null
                    ]}>
                      {style}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Дата</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null]}
              value={newTrade.date}
              onChangeText={(t) => setNewTrade(v => ({ ...v, date: t }))}
              placeholder="2025-01-15"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Заметки</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null]}
              value={newTrade.notes}
              onChangeText={(t) => setNewTrade(v => ({ ...v, notes: t }))}
              placeholder="Анализ и комментарии"
              multiline
              numberOfLines={3}
            />
          </View>

          <Pressable style={styles.addButton} onPress={addTrade}>
            <Text style={styles.addButtonText}>Добавить сделку</Text>
          </Pressable>
        </View>
      )}

      {journalView === 'list' && (
        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
            📊 История сделок
          </Text>
          
          {trades.length === 0 ? (
            <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
              Пока нет сделок
            </Text>
          ) : (
            <ScrollView style={styles.tradesList}>
              {trades.map(trade => (
                <View key={trade.id} style={[styles.tradeItem, isDark ? styles.tradeItemDark : null]}>
                  <View style={styles.tradeHeader}>
                    <Text style={[styles.tradeAsset, isDark ? styles.tradeAssetDark : null]}>
                      {trade.asset}
                    </Text>
                    <Text style={[
                      styles.tradeSide,
                      trade.side === 'BUY' ? styles.tradeSideBuy : styles.tradeSideSell
                    ]}>
                      {trade.side}
                    </Text>
                  </View>
                  <View style={styles.tradeDetails}>
                    <Text style={[styles.tradeDetail, isDark ? styles.tradeDetailDark : null]}>
                      Количество: {trade.qty}
                    </Text>
                    <Text style={[styles.tradeDetail, isDark ? styles.tradeDetailDark : null]}>
                      Цена: ${trade.price}
                    </Text>
                    <Text style={[styles.tradeDetail, isDark ? styles.tradeDetailDark : null]}>
                      Рынок: {trade.market}
                    </Text>
                    <Text style={[styles.tradeDetail, isDark ? styles.tradeDetailDark : null]}>
                      Стиль: {trade.style}
                    </Text>
                  </View>
                  {trade.notes && (
                    <Text style={[styles.tradeNotes, isDark ? styles.tradeNotesDark : null]}>
                      {trade.notes}
                    </Text>
                  )}
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteTrade(trade.id)}
                  >
                    <Text style={styles.deleteButtonText}>Удалить</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  darkContainer: {
    backgroundColor: '#0b0f14',
  },
  viewSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewButtonTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#121820',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  cardTitleDark: {
    color: '#e6edf3',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labelDark: {
    color: '#d1d5db',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  pickerOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  pickerOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  pickerTextDark: {
    color: '#d1d5db',
  },
  pickerTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  noteTextDark: {
    color: '#9ca3af',
  },
  tradesList: {
    maxHeight: 400,
  },
  tradeItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tradeItemDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeAsset: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tradeAssetDark: {
    color: '#e6edf3',
  },
  tradeSide: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tradeSideBuy: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  tradeSideSell: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  tradeDetails: {
    marginBottom: 8,
  },
  tradeDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  tradeDetailDark: {
    color: '#9ca3af',
  },
  tradeNotes: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tradeNotesDark: {
    color: '#d1d5db',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Journal;