// Debts component - exact reproduction of current debts structure
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { Debt } from '../../state/types';
import { formatCurrencyCustom } from '../../services/format';
import { calculateTotalDebt } from '../../services/calc';

interface DebtsProps {
  currentUser: any;
  isDark: boolean;
  debts: Debt[];
  totalDebt: number;
  newDebt: any;
  repayDrafts: Record<number, string>;
  onNewDebtChange: (debt: any) => void;
  onAddDebt: () => void;
  onRepayDraftChange: (debtId: number, amount: string) => void;
  onRepayDebt: (debtId: number) => void;
  onDeleteDebt: (debtId: number) => void;
  onDeleteDebtTx: (debtId: number, txId: number) => void;
}

const Debts: React.FC<DebtsProps> = ({
  currentUser,
  isDark,
  debts,
  totalDebt,
  newDebt,
  repayDrafts,
  onNewDebtChange,
  onAddDebt,
  onRepayDraftChange,
  onRepayDebt,
  onDeleteDebt,
  onDeleteDebtTx
}) => {
  if (!currentUser) {
    return (
      <View style={[
        { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
        isDark ? { backgroundColor: '#121820' } : null
      ]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>💳 Долги</Text>
        <Text style={{ fontSize: 12, color: '#9fb0c0', fontStyle: 'italic' }}>
          Войдите или зарегистрируйтесь, чтобы управлять долгами
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
      isDark ? { backgroundColor: '#121820' } : null
    ]}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>💳 Долги</Text>
      <Text style={{ fontSize: 14, color: '#9fb0c0', marginBottom: 16 }}>
        Общая сумма долгов: {formatCurrencyCustom(totalDebt, 'USD')}
      </Text>

      {/* Add new debt form */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Добавить долг</Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Название</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={newDebt.name}
              onChangeText={(text) => onNewDebtChange({ ...newDebt, name: text })}
              placeholder="Например: Кредитная карта"
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Сумма</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={newDebt.amount}
              onChangeText={(text) => onNewDebtChange({ ...newDebt, amount: text })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Валюта</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={newDebt.currency}
              onChangeText={(text) => onNewDebtChange({ ...newDebt, currency: text })}
              placeholder="USD"
            />
          </View>
        </View>

        <Pressable
          style={{ backgroundColor: '#10b981', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 }}
          onPress={onAddDebt}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Добавить долг</Text>
        </Pressable>
      </View>

      {/* Current debts */}
      {debts.length > 0 && (
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#9fb0c0' }}>Текущие долги</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {debts.map(debt => (
              <View key={debt.id} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1b2430' }}>
                <Text style={{ fontSize: 12, color: '#9fb0c0' }}>
                  {debt.name} • {formatCurrencyCustom(debt.amount, debt.currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Debt management */}
      {debts.map(debt => (
        <View key={debt.id} style={{ marginBottom: 16, borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#e6edf3' }}>{debt.name}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontSize: 14, color: '#e6edf3' }}>
                {formatCurrencyCustom(debt.amount, debt.currency)}
              </Text>
              <Pressable 
                style={{ backgroundColor: '#dc3545', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => onDeleteDebt(debt.id)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>×</Text>
              </Pressable>
            </View>
          </View>

          {/* Repay form */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#1f2a36', borderRadius: 6, padding: 8, fontSize: 14, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={repayDrafts[debt.id] || ''}
              onChangeText={(text) => onRepayDraftChange(debt.id, text)}
              placeholder="Сумма погашения"
              keyboardType="numeric"
            />
            <Pressable
              style={{ backgroundColor: '#1f6feb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
              onPress={() => onRepayDebt(debt.id)}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Погасить</Text>
            </Pressable>
          </View>

          {/* Transaction history */}
          {debt.history && debt.history.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#9fb0c0', marginBottom: 4 }}>История</Text>
              {debt.history.map(tx => (
                <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#e6edf3' }}>
                    • {tx.date}: {tx.type === 'add' ? 'Создание' : tx.type === 'repay' ? 'Погашение' : 'Закрытие'} {formatCurrencyCustom(tx.amount, debt.currency)} {tx.note ? `— ${tx.note}` : ''}
                  </Text>
                  <Pressable 
                    style={{ backgroundColor: '#dc3545', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => onDeleteDebtTx(debt.id, tx.id)}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export default Debts;
