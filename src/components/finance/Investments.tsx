// Investments component - exact reproduction of current investments structure
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { InvestmentTransaction } from '../../state/types';
import { formatCurrencyCustom } from '../../services/format';
import { calculateInvestmentBalance, getInvestHoldingBalance } from '../../services/calc';

interface InvestmentsProps {
  currentUser: any;
  isDark: boolean;
  investmentBalance: number;
  investTx: InvestmentTransaction[];
  investHoldings: Array<{ destination: string; currency: string; balance: number }>;
  newInvestTx: any;
  showInvestDestinationDropdown: boolean;
  investDestinations: string[];
  onNewInvestTxChange: (tx: any) => void;
  onAddInvestmentTransaction: () => void;
  onShowInvestDestinationDropdown: (show: boolean) => void;
  onInvestDestinationSelect: (destination: string) => void;
  onDeleteInvestTx: (id: number) => void;
}

const Investments: React.FC<InvestmentsProps> = ({
  currentUser,
  isDark,
  investmentBalance,
  investTx,
  investHoldings,
  newInvestTx,
  showInvestDestinationDropdown,
  investDestinations,
  onNewInvestTxChange,
  onAddInvestmentTransaction,
  onShowInvestDestinationDropdown,
  onInvestDestinationSelect,
  onDeleteInvestTx
}) => {
  if (!currentUser) {
    return (
      <View style={[
        { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
        isDark ? { backgroundColor: '#121820' } : null
      ]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>📈 Инвестиции</Text>
        <Text style={{ fontSize: 12, color: '#9fb0c0', fontStyle: 'italic' }}>
          Войдите или зарегистрируйтесь, чтобы управлять инвестициями
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      { backgroundColor: '#121820', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
      isDark ? { backgroundColor: '#121820' } : null
    ]}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' }}>📈 Инвестиции</Text>
      <Text style={{ fontSize: 14, color: '#9fb0c0', marginBottom: 16 }}>
        Баланс: {formatCurrencyCustom(investmentBalance, (investTx?.[0]?.currency) || 'USD')}
      </Text>

      {/* Holdings summary */}
      {currentUser && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#9fb0c0' }}>Ваши направления/вклады</Text>
          {investHoldings.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#9fb0c0', fontStyle: 'italic' }}>Нет активных инвестиций</Text>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {investHoldings.map(holding => (
                <View key={`${holding.destination}-${holding.currency}`} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1b2430' }}>
                  <Text style={{ fontSize: 12, color: '#9fb0c0' }}>
                    {holding.destination} • {formatCurrencyCustom(holding.balance, holding.currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Add investment transaction form */}
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Добавить транзакцию</Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Тип</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                style={[
                  { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#1b2430', alignItems: 'center' },
                  newInvestTx.type === 'in' ? { backgroundColor: '#1f6feb' } : null
                ]}
                onPress={() => onNewInvestTxChange({ ...newInvestTx, type: 'in' })}
              >
                <Text style={[
                  { fontSize: 12, color: '#9fb0c0' },
                  newInvestTx.type === 'in' ? { color: '#fff', fontWeight: '600' } : null
                ]}>
                  Вложение
                </Text>
              </Pressable>
              <Pressable
                style={[
                  { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#1b2430', alignItems: 'center' },
                  newInvestTx.type === 'out' ? { backgroundColor: '#1f6feb' } : null
                ]}
                onPress={() => onNewInvestTxChange({ ...newInvestTx, type: 'out' })}
              >
                <Text style={[
                  { fontSize: 12, color: '#9fb0c0' },
                  newInvestTx.type === 'out' ? { color: '#fff', fontWeight: '600' } : null
                ]}>
                  Вывод
                </Text>
              </Pressable>
            </View>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Сумма</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
              value={newInvestTx.amount}
              onChangeText={(text) => onNewInvestTxChange({ ...newInvestTx, amount: text })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Направление</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3' }}
                value={newInvestTx.destination}
                onChangeText={(text) => onNewInvestTxChange({ ...newInvestTx, destination: text })}
                placeholder="Например: Акции, Криптовалюта"
                onFocus={() => onShowInvestDestinationDropdown(true)}
              />
              
              {showInvestDestinationDropdown && (
                <View style={{ position: 'absolute', top: 48, left: 0, right: 0, maxHeight: 200, borderWidth: 1, borderColor: '#1f2a36', backgroundColor: '#0f1520', borderRadius: 8, zIndex: 50, opacity: 1 }}>
                  {investDestinations.length === 0 ? (
                    <Text style={{ color: '#9fb0c0', fontSize: 12, padding: 10 }}>Нет совпадений</Text>
                  ) : (
                    <View style={{ maxHeight: 200 }}>
                      {investDestinations.map(destination => (
                        <Pressable
                          key={destination}
                          style={{ paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2a36' }}
                          onPress={() => {
                            onNewInvestTxChange({ ...newInvestTx, destination });
                            onShowInvestDestinationDropdown(false);
                          }}
                        >
                          <Text style={{ color: '#e6edf3', fontSize: 14 }}>{destination}</Text>
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
              value={newInvestTx.currency}
              onChangeText={(text) => onNewInvestTxChange({ ...newInvestTx, currency: text })}
              placeholder="USD"
            />
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#e6edf3' }}>Примечание</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#1f2a36', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#0f1520', color: '#e6edf3', height: 80, textAlignVertical: 'top' }}
            value={newInvestTx.note}
            onChangeText={(text) => onNewInvestTxChange({ ...newInvestTx, note: text })}
            placeholder="Опционально"
            multiline
          />
        </View>

        <Pressable
          style={{ backgroundColor: '#10b981', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 }}
          onPress={onAddInvestmentTransaction}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Добавить транзакцию</Text>
        </Pressable>
      </View>

      {/* Transaction history */}
      {investTx.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#9fb0c0' }}>История транзакций</Text>
          <View style={{ maxHeight: 200 }}>
            {investTx.map(tx => (
              <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f2a36' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#e6edf3' }}>
                    {tx.date}: {tx.type === 'in' ? 'Вложение' : 'Вывод'} {formatCurrencyCustom(tx.amount, tx.currency)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9fb0c0' }}>
                    {tx.destination} {tx.note ? `— ${tx.note}` : ''}
                  </Text>
                </View>
                <Pressable 
                  style={{ backgroundColor: '#dc3545', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => onDeleteInvestTx(tx.id)}
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

export default Investments;
