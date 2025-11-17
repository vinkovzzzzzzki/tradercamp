// Investments component - exact reproduction of original investment logic
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { formatCurrencyCustom, parseNumberSafe, clampNumericText, normalizeCurrencyText } from '../../services/format';
import type { InvestmentTransaction } from '../../state/types';

interface InvestmentsProps {
  investmentBalance: number;
  investTx: InvestmentTransaction[];
  investHoldings: Array<{ destination: string; currency: string; balance: number }>;
  newInvestTx: any;
  showDestinationDropdown: boolean;
  investDestinations: string[];
  isDark: boolean;
  onNewInvestTxChange: (tx: any) => void;
  onAddInvestmentTransaction: () => void;
  onShowDestinationDropdown: (show: boolean) => void;
  onDestinationSelect: (destination: string, currency: string) => void;
  onDeleteInvestTx: (id: number) => void;
  onUpdateInvestTx: (id: number, patch: Partial<InvestmentTransaction>) => void;
}

const Investments: React.FC<InvestmentsProps> = ({
  investmentBalance,
  investTx,
  investHoldings,
  newInvestTx,
  showDestinationDropdown,
  investDestinations,
  isDark,
  onNewInvestTxChange,
  onAddInvestmentTransaction,
  onShowDestinationDropdown,
  onDestinationSelect,
  onDeleteInvestTx
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<any>({});
  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e5e5e5'
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000',
      marginBottom: 16
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e5e5e5'
    },
    balanceLabel: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666'
    },
    balanceValue: {
      fontSize: 20,
      fontWeight: '700',
      color: investmentBalance >= 0 ? '#22c55e' : '#ef4444'
    },
    holdingsSection: {
      marginBottom: 16
    },
    holdingsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000',
      marginBottom: 12
    },
    holdingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e5e5e5'
    },
    holdingName: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000'
    },
    holdingBalance: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000'
    },
    transactionForm: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#e5e5e5'
    },
    formTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000',
      marginBottom: 12
    },
    formRow: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'center'
    },
    formLabel: {
      fontSize: 14,
      color: isDark ? '#cccccc' : '#666666',
      width: 80,
      marginRight: 8
    },
    formInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ccc',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff'
    },
    dropdown: {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ccc',
      borderRadius: 6,
      maxHeight: 150,
      zIndex: 1000
    },
    dropdownItem: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e5e5e5'
    },
    dropdownItemText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000'
    },
    addButton: {
      backgroundColor: '#3b82f6',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      marginTop: 8,
      alignSelf: 'flex-start'
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600'
    },
    transactionList: {
      marginTop: 16
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e5e5e5'
    },
    transactionInfo: {
      flex: 1
    },
    transactionDate: {
      fontSize: 12,
      color: isDark ? '#888' : '#666'
    },
    transactionDetails: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000',
      marginTop: 2
    },
    deleteButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: '#ef4444',
      borderRadius: 4
    },
    deleteButtonText: {
      color: '#ffffff',
      fontSize: 12
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Инвестиции</Text>
      
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Общий баланс:</Text>
        <Text style={styles.balanceValue}>
          {formatCurrencyCustom(investmentBalance, 'USD')}
        </Text>
      </View>

      {investHoldings.length > 0 && (
        <View style={styles.holdingsSection}>
          <Text style={styles.holdingsTitle}>Позиции</Text>
          {investHoldings.map((holding, index) => (
            <View key={index} style={styles.holdingItem}>
              <Text style={styles.holdingName}>{holding.destination}</Text>
              <Text style={styles.holdingBalance}>
                {formatCurrencyCustom(holding.balance, holding.currency)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.transactionForm}>
        <Text style={styles.formTitle}>Новая операция</Text>
        
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Тип:</Text>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Pressable
              style={[
                { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginRight: 4 },
                newInvestTx.type === 'in' ? { backgroundColor: '#22c55e' } : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
              ]}
              onPress={() => onNewInvestTxChange({ ...newInvestTx, type: 'in' })}
            >
              <Text style={[styles.formLabel, { color: newInvestTx.type === 'in' ? '#ffffff' : (isDark ? '#cccccc' : '#666666') }]}>
                Вложение
              </Text>
            </Pressable>
            <Pressable
              style={[
                { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginLeft: 4 },
                newInvestTx.type === 'out' ? { backgroundColor: '#ef4444' } : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
              ]}
              onPress={() => onNewInvestTxChange({ ...newInvestTx, type: 'out' })}
            >
              <Text style={[styles.formLabel, { color: newInvestTx.type === 'out' ? '#ffffff' : (isDark ? '#cccccc' : '#666666') }]}>
                Вывод
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Сумма:</Text>
          <TextInput
            style={styles.formInput}
            value={newInvestTx.amount}
            onChangeText={(value) => onNewInvestTxChange({ ...newInvestTx, amount: clampNumericText(value) })}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Валюта:</Text>
          <TextInput
            style={styles.formInput}
            value={newInvestTx.currency}
            onChangeText={(value) => onNewInvestTxChange({ ...newInvestTx, currency: normalizeCurrencyText(value) })}
            placeholder="USD"
          />
        </View>

        <View style={[styles.formRow, { position: 'relative' }]}>
          <Text style={styles.formLabel}>Направление:</Text>
          <TextInput
            style={styles.formInput}
            value={newInvestTx.destination}
            onChangeText={(value) => onNewInvestTxChange({ ...newInvestTx, destination: value })}
            onFocus={() => onShowDestinationDropdown(true)}
            placeholder="Выберите направление"
          />
          {showDestinationDropdown && (
            <ScrollView style={styles.dropdown}>
              {investDestinations.map((destination, index) => (
                <Pressable
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => onDestinationSelect(destination, newInvestTx.currency)}
                >
                  <Text style={styles.dropdownItemText}>{destination}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Заметка:</Text>
          <TextInput
            style={styles.formInput}
            value={newInvestTx.note}
            onChangeText={(value) => onNewInvestTxChange({ ...newInvestTx, note: value })}
            placeholder="Опционально"
          />
        </View>

        <Pressable style={styles.addButton} onPress={onAddInvestmentTransaction}>
          <Text style={styles.addButtonText}>Добавить операцию</Text>
        </Pressable>
      </View>

      {investTx.length > 0 ? (
        <View style={styles.transactionList}>
          <Text style={styles.formTitle}>История операций</Text>
          {investTx.slice(-5).reverse().map((tx) => (
            <View key={tx.id} style={styles.transactionItem}>
              {editingId === tx.id ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionDate}>{tx.date}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <Pressable
                      style={[
                        { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
                        (editDraft.type || tx.type) === 'in' ? { backgroundColor: '#22c55e' } : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                      ]}
                      onPress={() => setEditDraft((d: any) => ({ ...d, type: 'in' }))}
                    >
                      <Text style={{ color: (editDraft.type || tx.type) === 'in' ? '#fff' : (isDark ? '#ccc' : '#666') }}>Вложение</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
                        (editDraft.type || tx.type) === 'out' ? { backgroundColor: '#ef4444' } : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                      ]}
                      onPress={() => setEditDraft((d: any) => ({ ...d, type: 'out' }))}
                    >
                      <Text style={{ color: (editDraft.type || tx.type) === 'out' ? '#fff' : (isDark ? '#ccc' : '#666') }}>Вывод</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TextInput style={[styles.formInput, { flex: 1 }]} value={String(editDraft.amount ?? tx.amount)} onChangeText={(v) => setEditDraft((d: any) => ({ ...d, amount: clampNumericText(v) }))} keyboardType="numeric" />
                    <TextInput style={[styles.formInput, { width: 90 }]} value={String(editDraft.currency ?? tx.currency)} onChangeText={(v) => setEditDraft((d: any) => ({ ...d, currency: normalizeCurrencyText(v) }))} />
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <TextInput style={styles.formInput} value={String((editDraft.destination ?? tx.destination) || '')} onChangeText={(v) => setEditDraft((d: any) => ({ ...d, destination: v }))} placeholder="Направление" />
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <TextInput style={styles.formInput} value={String((editDraft.note ?? tx.note) || '')} onChangeText={(v) => setEditDraft((d: any) => ({ ...d, note: v }))} placeholder="Заметка" />
                  </View>
                </View>
              ) : (
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDate}>{tx.date}</Text>
                  <Text style={styles.transactionDetails}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrencyCustom(tx.amount, tx.currency)} - {tx.destination}
                  </Text>
                  {tx.note && (
                    <Text style={[styles.transactionDate, { marginTop: 2 }]}>{tx.note}</Text>
                  )}
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {editingId === tx.id ? (
                  <>
                    <Pressable
                      style={[styles.deleteButton, { backgroundColor: '#22c55e' }]}
                      onPress={() => {
                        const patch: any = {
                          type: editDraft.type || tx.type,
                          amount: parseNumberSafe(String(editDraft.amount ?? tx.amount)),
                          currency: (editDraft.currency ?? tx.currency),
                          destination: (editDraft.destination ?? tx.destination),
                          note: (editDraft.note ?? tx.note)
                        };
                        onUpdateInvestTx(tx.id, patch);
                        setEditingId(null);
                        setEditDraft({});
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Сохранить</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.deleteButton, { backgroundColor: '#6b7280' }]}
                      onPress={() => { setEditingId(null); setEditDraft({}); }}
                    >
                      <Text style={styles.deleteButtonText}>Отмена</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[styles.deleteButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => { setEditingId(tx.id); setEditDraft({}); }}
                  >
                    <Text style={styles.deleteButtonText}>Редакт.</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => onDeleteInvestTx(tx.id)}
                >
                  <Text style={styles.deleteButtonText}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.formLabel}>Операций пока нет.</Text>
          <Pressable style={[styles.addButton, { backgroundColor: '#1f6feb' }]} onPress={() => onNewInvestTxChange({ ...newInvestTx, type: 'in' })}>
            <Text style={styles.addButtonText}>Добавить первую инвестицию</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Investments;