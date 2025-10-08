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
    
    // Views
    financeView,
    setFinanceView,
    setJournalView,
    setCalendarView,
    
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
    addTrade,
    deleteTrade,
    addWorkout,
    deleteWorkout,
    addEvent,
    deleteEvent,
    workouts,
    events,
    trades,
    posts,
    bookmarks,
    addPost,
    deletePost,
    toggleLike,
    addComment,
    toggleBookmark,
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
    
    // Reset to default view when switching tabs
    if (tabKey === 'finance') {
      setFinanceView('summary');
    }
  };

  const handleTabHover = (tabKey: string) => {
    const dropdownTabs = ['finance', 'journal', 'planner', 'community', 'profile'];
    
    if (dropdownTabs.includes(tabKey)) {
      // Clear any pending timeout
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      
      // Mark that we're hovering over tab
      isHoveringTab.current = true;
      
      // Open dropdown for any dropdown tab, regardless of current active tab
      setOpenDropdown(tabKey);
    }
  };

  const handleTabLeave = (tabKey: string) => {
    const dropdownTabs = ['finance', 'journal', 'planner', 'community', 'profile'];
    
    if (dropdownTabs.includes(tabKey)) {
      // Mark that we're no longer hovering over tab
      isHoveringTab.current = false;
      
      // Clear any existing timeout
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      
      // Set a new timeout to close the dropdown
      // Only close if not hovering over dropdown
      hoverTimeout.current = setTimeout(() => {
        if (!isHoveringDropdown.current && !isHoveringTab.current) {
          setOpenDropdown(null);
        }
      }, 300);
    }
  };
  
  const handleDropdownEnter = () => {
    isHoveringDropdown.current = true;
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };
  
  const handleDropdownLeave = () => {
    isHoveringDropdown.current = false;
    hoverTimeout.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
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
        onDropdownEnter={handleDropdownEnter}
        onDropdownLeave={handleDropdownLeave}
        onLogout={handleLogout}
        onFinanceViewChange={setFinanceView}
        onJournalViewChange={setJournalView}
        onPlannerViewChange={setCalendarView}
        tabAnimation={tabAnimation}
        dropdownAnimations={dropdownAnimations}
        buttonAnimations={buttonAnimations}
      />
      
      {/* Content will be rendered here based on tab */}
      <View style={{ flex: 1, padding: 20 }}>
        {tab === 'finance' && (
          <>
            {/* Debug info */}
            <Text style={{ color: '#fff', fontSize: 10, marginBottom: 5 }}>
              Current view: {financeView || 'not set'}
            </Text>
            <Dashboard
            currentUser={currentUser}
            isDark={isDark}
            financeView={financeView || 'summary'}
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
          </>
        )}
        {tab === 'journal' && (
          <Journal
            currentUser={currentUser}
            isDark={isDark}
            trades={trades}
            onAddTrade={addTrade}
            onDeleteTrade={deleteTrade}
          />
        )}
        {tab === 'planner' && (
          <Planner
            currentUser={currentUser}
            isDark={isDark}
            workouts={workouts}
            events={events}
            onAddWorkout={addWorkout}
            onAddEvent={addEvent}
            onDeleteWorkout={deleteWorkout}
            onDeleteEvent={deleteEvent}
          />
        )}
        {tab === 'community' && (
          <Community
            currentUser={currentUser}
            isDark={isDark}
            posts={posts}
            bookmarks={bookmarks}
            onAddPost={addPost}
            onDeletePost={deletePost}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onToggleBookmark={toggleBookmark}
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
