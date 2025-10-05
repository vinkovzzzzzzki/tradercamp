// Safety Fund component - exact reproduction of current safety fund structure
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { EmergencyTransaction } from '../../state/types';
import { formatCurrency, formatCurrencyCustom } from '../../services/format';
import { calculateEmergencyMonths } from '../../services/calc';

interface SafetyFundProps {
  currentUser: any;
  isDark: boolean;
  monthlyExpenses: number;
  cashReserve: number;
  emergencyTx: EmergencyTransaction[];
  emergencyMonths: number;
  newEmergencyTx: any;
  showEmergencyLocationDropdown: boolean;
  emergencyLocations: string[];
  onMonthlyExpensesChange: (value: number) => void;
  onCashReserveChange: (value: number) => void;
  onNewEmergencyTxChange: (tx: any) => void;
  onAddEmergencyTransaction: () => void;
  onShowEmergencyLocationDropdown: (show: boolean) => void;
  onEmergencyLocationSelect: (location: string) => void;
  onDeleteEmergencyTx: (id: number) => void;
}

const SafetyFund: React.FC<SafetyFundProps> = ({
  currentUser,
  isDark,
  monthlyExpenses,
  cashReserve,
  emergencyTx,
  emergencyMonths,
  newEmergencyTx,
  showEmergencyLocationDropdown,
  emergencyLocations,
  onMonthlyExpensesChange,
  onCashReserveChange,
  onNewEmergencyTxChange,
  onAddEmergencyTransaction,
  onShowEmergencyLocationDropdown,
  onEmergencyLocationSelect,
  onDeleteEmergencyTx
}) => {
  if (!currentUser) {
    return (
      <View style={[
        { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
        isDark ? { backgroundColor: '#121820' } : null
      ]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>🛡️ Подушка безопасности</Text>
        <Text style={{ fontSize: 12, color: '#9fb0c0', fontStyle: 'italic' }}>
          Войдите или зарегистрируйтесь, чтобы управлять подушкой безопасности
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
      isDark ? { backgroundColor: '#121820' } : null
    ]}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>🛡️ Подушка безопасности</Text>
      <Text style={{ fontSize: 14, color: '#9fb0c0', marginBottom: 16 }}>
        Резерв на случай непредвиденных расходов
      </Text>

      {/* Emergency fund settings */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Месячные расходы ($)</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }} 
            value={String(monthlyExpenses)} 
            onChangeText={(t) => onMonthlyExpensesChange(Number(t) || 0)} 
            keyboardType="numeric" 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Текущий резерв ($)</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }} 
            value={String(cashReserve)} 
            onChangeText={(t) => onCashReserveChange(Number(t) || 0)} 
            keyboardType="numeric" 
          />
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <View style={[
          { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
          emergencyMonths >= 6 ? { backgroundColor: '#28a745' } : { backgroundColor: '#ffc107' }
        ]}>
          <Text style={[
            { fontSize: 13, fontWeight: '600' },
            emergencyMonths >= 6 ? { color: '#fff' } : { color: '#000' }
          ]}>
            {emergencyMonths.toFixed(1)} мес.
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#666' }}>Цель: 6 месяцев</Text>
      </View>
      
      {emergencyMonths < 6 && (
        <Text style={{ fontSize: 12, color: '#666', marginTop: 6, fontStyle: 'italic' }}>
          Рекомендация: доведите резерв до {formatCurrency(monthlyExpenses * 6)} ({(6 - emergencyMonths).toFixed(1)} мес. до цели)
        </Text>
      )}

      {/* Add transaction form */}
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Добавить транзакцию</Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Тип</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                style={[
                  { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#1b2430', alignItems: 'center' },
                  newEmergencyTx.type === 'deposit' ? { backgroundColor: '#1f6feb' } : null
                ]}
                onPress={() => onNewEmergencyTxChange({ ...newEmergencyTx, type: 'deposit' })}
              >
                <Text style={[
                  { fontSize: 12, color: '#9fb0c0' },
                  newEmergencyTx.type === 'deposit' ? { color: '#fff', fontWeight: '600' } : null
                ]}>
                  Пополнение
                </Text>
              </Pressable>
              <Pressable
                style={[
                  { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#1b2430', alignItems: 'center' },
                  newEmergencyTx.type === 'withdraw' ? { backgroundColor: '#1f6feb' } : null
                ]}
                onPress={() => onNewEmergencyTxChange({ ...newEmergencyTx, type: 'withdraw' })}
              >
                <Text style={[
                  { fontSize: 12, color: '#9fb0c0' },
                  newEmergencyTx.type === 'withdraw' ? { color: '#fff', fontWeight: '600' } : null
                ]}>
                  Изъятие
                </Text>
              </Pressable>
            </View>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Сумма</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={newEmergencyTx.amount}
              onChangeText={(text) => onNewEmergencyTxChange({ ...newEmergencyTx, amount: text })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Место хранения</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
                value={newEmergencyTx.location}
                onChangeText={(text) => onNewEmergencyTxChange({ ...newEmergencyTx, location: text })}
                placeholder="Например: Банк, Наличные"
                onFocus={() => onShowEmergencyLocationDropdown(true)}
              />
              
              {showEmergencyLocationDropdown && (
                <View style={{ position: 'absolute', top: 48, left: 0, right: 0, maxHeight: 200, borderWidth: 1, borderColor: '#1f2a36', backgroundColor: '#0f1520', borderRadius: 8, zIndex: 50, opacity: 1 }}>
                  {emergencyLocations.length === 0 ? (
                    <Text style={{ color: '#9fb0c0', fontSize: 12, padding: 10 }}>Нет совпадений</Text>
                  ) : (
                    <View style={{ maxHeight: 200 }}>
                      {emergencyLocations.map(location => (
                        <Pressable
                          key={location}
                          style={{ paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2a36' }}
                          onPress={() => {
                            onNewEmergencyTxChange({ ...newEmergencyTx, location });
                            onShowEmergencyLocationDropdown(false);
                          }}
                        >
                          <Text style={{ color: '#e6edf3', fontSize: 14 }}>{location}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Валюта</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={newEmergencyTx.currency}
              onChangeText={(text) => onNewEmergencyTxChange({ ...newEmergencyTx, currency: text })}
              placeholder="USD"
            />
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Примечание</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3', height: 80, textAlignVertical: 'top' }}
            value={newEmergencyTx.note}
            onChangeText={(text) => onNewEmergencyTxChange({ ...newEmergencyTx, note: text })}
            placeholder="Опционально"
            multiline
          />
        </View>

        <Pressable
          style={{ backgroundColor: '#10b981', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 }}
          onPress={onAddEmergencyTransaction}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Добавить транзакцию</Text>
        </Pressable>
      </View>

      {/* Transaction history */}
      {emergencyTx.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#9fb0c0' }}>История транзакций</Text>
          <View style={{ maxHeight: 200 }}>
            {emergencyTx.map(tx => (
              <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f2a36' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#e6edf3' }}>
                    {tx.date}: {tx.type === 'deposit' ? 'Пополнение' : 'Изъятие'} {formatCurrencyCustom(tx.amount, tx.currency)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9fb0c0' }}>
                    {tx.location} {tx.note ? `— ${tx.note}` : ''}
                  </Text>
                </View>
                <Pressable 
                  style={{ backgroundColor: '#dc3545', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => onDeleteEmergencyTx(tx.id)}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default SafetyFund;
