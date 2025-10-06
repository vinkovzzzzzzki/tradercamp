// Debts component - exact reproduction of original debt management logic
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { formatCurrencyCustom, parseNumberSafe } from '../../services/format';
import type { Debt } from '../../state/types';

interface DebtsProps {
  sortedDebts: Debt[];
  newDebt: any;
  repayDrafts: Record<number, string>;
  totalDebt: number;
  isDark: boolean;
  onNewDebtChange: (debt: any) => void;
  onAddDebt: () => void;
  onRepayDraftChange: (debtId: number, amount: string) => void;
  onRepayDebt: (debtId: number, amount: number) => void;
  onDeleteDebt: (debtId: number) => void;
  onDeleteDebtTx: (debtId: number, txId: number) => void;
}

const Debts: React.FC<DebtsProps> = ({
  sortedDebts,
  newDebt,
  repayDrafts,
  totalDebt,
  isDark,
  onNewDebtChange,
  onAddDebt,
  onRepayDraftChange,
  onRepayDebt,
  onDeleteDebt,
  onDeleteDebtTx
}) => {
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
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e5e5e5'
    },
    totalLabel: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666'
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ef4444'
    },
    debtItem: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0'
    },
    debtHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    debtName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000'
    },
    debtAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ef4444'
    },
    repaySection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8
    },
    repayInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ccc',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      marginRight: 8
    },
    repayButton: {
      backgroundColor: '#22c55e',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6
    },
    repayButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600'
    },
    deleteDebtButton: {
      backgroundColor: '#ef4444',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start'
    },
    deleteDebtButtonText: {
      color: '#ffffff',
      fontSize: 12
    },
    transactionList: {
      marginTop: 8
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
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
    deleteTxButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: '#ef4444',
      borderRadius: 3
    },
    deleteTxButtonText: {
      color: '#ffffff',
      fontSize: 10
    },
    addDebtForm: {
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
    addButton: {
      backgroundColor: '#ef4444',
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
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Долги</Text>
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Общий долг:</Text>
        <Text style={styles.totalValue}>
          {formatCurrencyCustom(totalDebt, 'USD')}
        </Text>
      </View>

      {sortedDebts.map((debt) => (
        <View key={debt.id} style={styles.debtItem}>
          <View style={styles.debtHeader}>
            <Text style={styles.debtName}>{debt.name}</Text>
            <Text style={styles.debtAmount}>
              {formatCurrencyCustom(debt.amount, debt.currency)}
            </Text>
          </View>

          <View style={styles.repaySection}>
            <TextInput
              style={styles.repayInput}
              value={repayDrafts[debt.id] || ''}
              onChangeText={(value) => onRepayDraftChange(debt.id, value)}
              placeholder="Сумма погашения"
              keyboardType="numeric"
            />
            <Pressable
              style={styles.repayButton}
              onPress={() => {
                const amount = parseNumberSafe(repayDrafts[debt.id] || '0');
                if (!isNaN(amount) && amount > 0) {
                  onRepayDebt(debt.id, amount);
                }
              }}
            >
              <Text style={styles.repayButtonText}>Погасить</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.deleteDebtButton}
            onPress={() => onDeleteDebt(debt.id)}
          >
            <Text style={styles.deleteDebtButtonText}>Удалить долг</Text>
          </Pressable>

          {debt.tx.length > 0 && (
            <View style={styles.transactionList}>
              <Text style={[styles.formLabel, { marginBottom: 4 }]}>История:</Text>
              {debt.tx.slice(-3).reverse().map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDate}>{tx.date}</Text>
                    <Text style={styles.transactionDetails}>
                      {tx.type === 'add' ? '+' : '-'}{formatCurrencyCustom(tx.amount, debt.currency)} - {tx.note}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.deleteTxButton}
                    onPress={() => onDeleteDebtTx(debt.id, tx.id)}
                  >
                    <Text style={styles.deleteTxButtonText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={styles.addDebtForm}>
        <Text style={styles.formTitle}>Добавить долг</Text>
        
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Название:</Text>
          <TextInput
            style={styles.formInput}
            value={newDebt.name}
            onChangeText={(value) => onNewDebtChange({ ...newDebt, name: value })}
            placeholder="Название долга"
          />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Сумма:</Text>
          <TextInput
            style={styles.formInput}
            value={newDebt.amount}
            onChangeText={(value) => onNewDebtChange({ ...newDebt, amount: value })}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Валюта:</Text>
          <TextInput
            style={styles.formInput}
            value={newDebt.currency}
            onChangeText={(value) => onNewDebtChange({ ...newDebt, currency: value })}
            placeholder="USD"
          />
        </View>

        <Pressable style={styles.addButton} onPress={onAddDebt}>
          <Text style={styles.addButtonText}>Добавить долг</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Debts;