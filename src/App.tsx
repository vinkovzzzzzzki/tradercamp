// Main App component - exact reproduction of current app structure
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Platform, UIManager } from 'react-native';
import { useAppState } from './state';
import { Header, Toast } from './components/common';
import { Dashboard, Journal, Planner, Community, Profile } from './features';
// import './styles/index.css'; // CSS не поддерживается в React Native

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const App: React.FC = () => {
  const {
    // Navigation
    tab,
    openDropdown,
    setTab,
    setOpenDropdown,
    
    // Auth
    currentUser,
    
    // Theme
    isDark,
    
    // UI
    toast,
    setToast,
    
    // Animation refs
    tabAnimation,
    dropdownAnimations,
    buttonAnimations,
    
    // Finance
    chartVisibility,
    setChartVisibility,
    chartTimePeriod,
    setChartTimePeriod,
    cashReserve,
    setCashReserve,
    monthlyExpenses,
    setMonthlyExpenses,
    cushionHistory,
    investmentHistory,
    debtsHistory,
    
    // Additional states for Dashboard
    newEmergencyTx, setNewEmergencyTx,
    newInvestTx, setNewInvestTx,
    newDebt, setNewDebt,
    repayDrafts, setRepayDrafts,
    showEmergencyLocationDropdown, setShowEmergencyLocationDropdown,
    showInvestDestinationDropdown, setShowInvestDestinationDropdown,
    emergencyLocations, setEmergencyLocations,
    investDestinations, setInvestDestinations,
    sortedDebts, setSortedDebts,
    investHoldings, setInvestHoldings,
    emergencyMonths,
    investmentBalance,
    totalDebt,
    emergencyTx, setEmergencyTx,
    investTx, setInvestTx,
    
    // Business logic functions
    addEmergencyTransaction,
    addInvestmentTransaction,
    addDebt,
    deleteEmergencyTx,
    deleteInvestTx,
    deleteDebt,
    repayDebt,
    resetAllFinancialData,
    getComprehensiveChartData,
    logout
  } = useAppState();

  // Animation refs
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const isHoveringDropdown = useRef(false);
  const isHoveringTab = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  // Animation functions
  const animateTabChange = (newTab: string) => {
    Animated.timing(tabAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      tabAnimation.setValue(0);
    });
  };

  const handleTabClick = (tabKey: string) => {
    if (tabKey === tab) return;
    
    animateTabChange(tabKey);
    setTab(tabKey as any);
    setOpenDropdown(null);
  };

  const handleTabHover = (tabKey: string) => {
    const dropdownTabs = ['finance', 'journal', 'planner'];
    
    if (dropdownTabs.includes(tabKey)) {
      // Mark that we're hovering over tab
      isHoveringTab.current = true;
      
      // Open dropdown for any dropdown tab, regardless of current active tab
      setOpenDropdown(tabKey);
    }
  };

  const handleTabLeave = (tabKey: string) => {
    const dropdownTabs = ['finance', 'journal', 'planner'];
    
    if (dropdownTabs.includes(tabKey)) {
      // Mark that we're no longer hovering over tab
      isHoveringTab.current = false;
      
      // Only close if we're not hovering over either tab or dropdown
      if (!isHoveringDropdown.current) {
        hoverTimeout.current = setTimeout(() => {
          if (!isHoveringTab.current && !isHoveringDropdown.current) {
            setOpenDropdown(null);
          }
        }, 300);
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={[
      { flex: 1, backgroundColor: '#0b0f14' },
      isDark ? { backgroundColor: '#0b0f14' } : null
    ]}>
      <Toast toast={toast} />
      
      <Header
        tab={tab}
        openDropdown={openDropdown}
        currentUser={currentUser}
        isDark={isDark}
        onTabClick={handleTabClick}
        onTabHover={handleTabHover}
        onTabLeave={handleTabLeave}
        onLogout={handleLogout}
        tabAnimation={tabAnimation}
        dropdownAnimations={dropdownAnimations}
        buttonAnimations={buttonAnimations}
      />
      
      {/* Content will be rendered here based on tab */}
      <View style={{ flex: 1, padding: 20 }}>
        {tab === 'finance' && (
          <Dashboard
            currentUser={currentUser}
            isDark={isDark}
            chartVisibility={chartVisibility}
            chartTimePeriod={chartTimePeriod}
            cashReserve={cashReserve}
            investmentBalance={investmentBalance}
            monthlyExpenses={monthlyExpenses}
            emergencyMonths={emergencyMonths}
            sortedDebts={sortedDebts}
            cushionHistory={cushionHistory}
            investmentHistory={investmentHistory}
            debtsHistory={debtsHistory}
            emergencyTx={emergencyTx}
            investTx={investTx}
            investHoldings={investHoldings}
            newEmergencyTx={newEmergencyTx}
            newInvestTx={newInvestTx}
            newDebt={newDebt}
            repayDrafts={repayDrafts}
            showEmergencyLocationDropdown={showEmergencyLocationDropdown}
            showInvestDestinationDropdown={showInvestDestinationDropdown}
            emergencyLocations={emergencyLocations}
            investDestinations={investDestinations}
            onChartVisibilityChange={setChartVisibility}
            onChartTimePeriodChange={setChartTimePeriod}
            onResetAllFinancialData={resetAllFinancialData}
            onMonthlyExpensesChange={setMonthlyExpenses}
            onCashReserveChange={setCashReserve}
            onNewEmergencyTxChange={setNewEmergencyTx}
            onAddEmergencyTransaction={addEmergencyTransaction}
            onShowEmergencyLocationDropdown={setShowEmergencyLocationDropdown}
            onEmergencyLocationSelect={(location, currency) => {
              setNewEmergencyTx(v => ({ ...v, location, currency }));
              setShowEmergencyLocationDropdown(false);
            }}
            onDeleteEmergencyTx={deleteEmergencyTx}
            onNewInvestTxChange={setNewInvestTx}
            onAddInvestmentTransaction={addInvestmentTransaction}
            onShowInvestDestinationDropdown={setShowInvestDestinationDropdown}
            onInvestDestinationSelect={(destination, currency) => {
              setNewInvestTx(v => ({ ...v, destination, currency }));
              setShowInvestDestinationDropdown(false);
            }}
            onDeleteInvestTx={deleteInvestTx}
            onNewDebtChange={setNewDebt}
            onAddDebt={addDebt}
            onRepayDraftChange={(debtId, value) => setRepayDrafts(prev => ({ ...prev, [debtId]: value }))}
            onRepayDebt={repayDebt}
            onDeleteDebt={deleteDebt}
            onDeleteDebtTx={(debtId, txId) => {
              setSortedDebts(prev => prev.map(debt => 
                debt.id === debtId 
                  ? { ...debt, history: (debt.history || []).filter(tx => tx.id !== txId) }
                  : debt
              ));
            }}
            getComprehensiveChartData={getComprehensiveChartData}
            totalDebt={totalDebt}
          />
        )}
        {tab === 'journal' && (
          <Journal
            currentUser={currentUser}
            isDark={isDark}
          />
        )}
        {tab === 'planner' && (
          <Planner
            currentUser={currentUser}
            isDark={isDark}
          />
        )}
        {tab === 'community' && (
          <Community
            currentUser={currentUser}
            isDark={isDark}
          />
        )}
        {tab === 'profile' && (
          <Profile
            currentUser={currentUser}
            isDark={isDark}
            onLogout={handleLogout}
          />
        )}
      </View>
    </View>
  );
};

export default App;
