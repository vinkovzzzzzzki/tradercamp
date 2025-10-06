// Safety Fund component - exact reproduction of original emergency fund logic
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { formatCurrencyCustom, parseNumberSafe } from '../../services/format';
import type { EmergencyTransaction } from '../../state/types';

interface SafetyFundProps {
  cashReserve: number;
  monthlyExpenses: number;
  emergencyMonths: number;
  emergencyTx: EmergencyTransaction[];
  newEmergencyTx: any;
  showLocationDropdown: boolean;
  emergencyLocations: string[];
  isDark: boolean;
  onCashReserveChange: (value: number) => void;
  onMonthlyExpensesChange: (value: number) => void;
  onNewEmergencyTxChange: (tx: any) => void;
  onAddEmergencyTransaction: () => void;
  onShowLocationDropdown: (show: boolean) => void;
  onLocationSelect: (location: string, currency: string) => void;
  onDeleteEmergencyTx: (id: number) => void;
}

const SafetyFund: React.FC<SafetyFundProps> = ({
  cashReserve,
  monthlyExpenses,
  emergencyMonths,
  emergencyTx,
  newEmergencyTx,
  showLocationDropdown,
  emergencyLocations,
  isDark,
  onCashReserveChange,
  onMonthlyExpensesChange,
  onNewEmergencyTxChange,
  onAddEmergencyTransaction,
  onShowLocationDropdown,
  onLocationSelect,
  onDeleteEmergencyTx
}) => {
  const [editingReserve, setEditingReserve] = useState(false);
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [tempReserve, setTempReserve] = useState('');
  const [tempExpenses, setTempExpenses] = useState('');

  const handleReserveEdit = () => {
    setEditingReserve(true);
    setTempReserve(cashReserve.toString());
  };

  const handleReserveSave = () => {
    const value = parseNumberSafe(tempReserve);
    if (!isNaN(value)) {
      onCashReserveChange(value);
    }
    setEditingReserve(false);
  };

  const handleExpensesEdit = () => {
    setEditingExpenses(true);
    setTempExpenses(monthlyExpenses.toString());
  };

  const handleExpensesSave = () => {
    const value = parseNumberSafe(tempExpenses);
    if (!isNaN(value)) {
      onMonthlyExpensesChange(value);
    }
    setEditingExpenses(false);
  };

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
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? '#cccccc' : '#666666'
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000'
    },
    editButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
      borderRadius: 6,
      marginLeft: 8
    },
    editButtonText: {
      fontSize: 12,
      color: isDark ? '#ffffff' : '#000000'
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ccc',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 14,
      color: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      minWidth: 100
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
      backgroundColor: '#22c55e',
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
      <Text style={styles.title}>Резервный фонд</Text>
      
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Текущий резерв:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {editingReserve ? (
            <TextInput
              style={styles.input}
              value={tempReserve}
              onChangeText={setTempReserve}
              onBlur={handleReserveSave}
              keyboardType="numeric"
              autoFocus
            />
          ) : (
            <Text style={styles.statValue}>
              {formatCurrencyCustom(cashReserve, 'USD')}
            </Text>
          )}
          <Pressable style={styles.editButton} onPress={editingReserve ? handleReserveSave : handleReserveEdit}>
            <Text style={styles.editButtonText}>
              {editingReserve ? '✓' : '✏️'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Месячные расходы:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {editingExpenses ? (
            <TextInput
              style={styles.input}
              value={tempExpenses}
              onChangeText={setTempExpenses}
              onBlur={handleExpensesSave}
              keyboardType="numeric"
              autoFocus
            />
          ) : (
            <Text style={styles.statValue}>
              {formatCurrencyCustom(monthlyExpenses, 'USD')}
            </Text>
          )}
          <Pressable style={styles.editButton} onPress={editingExpenses ? handleExpensesSave : handleExpensesEdit}>
            <Text style={styles.editButtonText}>
              {editingExpenses ? '✓' : '✏️'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Месяцев на резерв:</Text>
        <Text style={[styles.statValue, { color: emergencyMonths >= 6 ? '#22c55e' : emergencyMonths >= 3 ? '#f59e0b' : '#ef4444' }]}>
          {emergencyMonths.toFixed(1)}
        </Text>
      </View>

      <View style={styles.transactionForm}>
        <Text style={styles.formTitle}>Новая операция</Text>
        
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Тип:</Text>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Pressable
              style={[
                { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginRight: 4 },
                newEmergencyTx.type === 'deposit' ? { backgroundColor: '#22c55e' } : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
              ]}
              onPress={() => onNewEmergencyTxChange({ ...newEmergencyTx, type: 'deposit' })}
            >
              <Text style={[styles.formLabel, { color: newEmergencyTx.type === 'deposit' ? '#ffffff' : (isDark ? '#cccccc' : '#666666') }]}>
                Пополнение
              </Text>
            </Pressable>
            <Pressable
              style={[
                { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginLeft: 4 },
                newEmergencyTx.type === 'withdraw' ? { backgroundColor: '#ef4444' } : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
              ]}
              onPress={() => onNewEmergencyTxChange({ ...newEmergencyTx, type: 'withdraw' })}
            >
              <Text style={[styles.formLabel, { color: newEmergencyTx.type === 'withdraw' ? '#ffffff' : (isDark ? '#cccccc' : '#666666') }]}>
                Снятие
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Сумма:</Text>
          <TextInput
            style={styles.formInput}
            value={newEmergencyTx.amount}
            onChangeText={(value) => onNewEmergencyTxChange({ ...newEmergencyTx, amount: value })}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Валюта:</Text>
          <TextInput
            style={styles.formInput}
            value={newEmergencyTx.currency}
            onChangeText={(value) => onNewEmergencyTxChange({ ...newEmergencyTx, currency: value })}
            placeholder="USD"
          />
        </View>

        <View style={[styles.formRow, { position: 'relative' }]}>
          <Text style={styles.formLabel}>Место:</Text>
          <TextInput
            style={styles.formInput}
            value={newEmergencyTx.location}
            onChangeText={(value) => onNewEmergencyTxChange({ ...newEmergencyTx, location: value })}
            onFocus={() => onShowLocationDropdown(true)}
            placeholder="Выберите место"
          />
          {showLocationDropdown && (
            <ScrollView style={styles.dropdown}>
              {emergencyLocations.map((location, index) => (
                <Pressable
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => onLocationSelect(location, newEmergencyTx.currency)}
                >
                  <Text style={styles.dropdownItemText}>{location}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Заметка:</Text>
          <TextInput
            style={styles.formInput}
            value={newEmergencyTx.note}
            onChangeText={(value) => onNewEmergencyTxChange({ ...newEmergencyTx, note: value })}
            placeholder="Опционально"
          />
        </View>

        <Pressable style={styles.addButton} onPress={onAddEmergencyTransaction}>
          <Text style={styles.addButtonText}>Добавить операцию</Text>
        </Pressable>
      </View>

      {emergencyTx.length > 0 && (
        <View style={styles.transactionList}>
          <Text style={styles.formTitle}>История операций</Text>
          {emergencyTx.slice(-5).reverse().map((tx) => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDate}>{tx.date}</Text>
                <Text style={styles.transactionDetails}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrencyCustom(tx.amount, tx.currency)} - {tx.location}
                </Text>
                {tx.note && (
                  <Text style={[styles.transactionDate, { marginTop: 2 }]}>{tx.note}</Text>
                )}
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => onDeleteEmergencyTx(tx.id)}
              >
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default SafetyFund;