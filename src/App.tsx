// Main App component - exact reproduction of current app structure
import React from 'react';
import { View, Text, Animated, Platform, UIManager } from 'react-native';
import { useAppState } from './state';
import { checkSupabaseConnectivity, getSupabaseDebugInfo } from './services/auth';
import { Header, Toast, FAB } from './components/common';
import { Dashboard, Journal, Planner, Community, Profile, Auth } from './features';
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
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authMode,
    setAuthMode,
    handleSignIn,
    handleSignUp,
    handleResetPassword,
    authError,
    registerNickname,
    setRegisterNickname,
    registerPasswordConfirm,
    setRegisterPasswordConfirm,
    
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
    logout,
    addFriend
  } = useAppState();

  React.useEffect(() => {
    (async () => {
      const result = await checkSupabaseConnectivity();
      if (result.ok) {
        setToast({ msg: 'База данных подключена', kind: 'success' } as any);
      } else {
        const dbg = getSupabaseDebugInfo();
        const host = (() => {
          try { return new URL(dbg.url).host; } catch { return dbg.url; }
        })();
        const configured = dbg.configured ? 'configured' : 'NOT configured';
        setToast({ msg: `Ошибка подключения к БД: ${result.error || 'неизвестно'} | host: ${host} | env: ${configured} | src: ${dbg.source}` as any, kind: 'error' } as any);
      }
    })();
  }, []);

  // Auto-dismiss toast after short delay to avoid sticking across tabs
  React.useEffect(() => {
    if (!toast) return;
    const timeoutMs = (toast as any).actionLabel ? 4000 : 2500;
    const t = setTimeout(() => setToast(null as any), timeoutMs);
    return () => clearTimeout(t);
  }, [toast?.msg, toast?.kind, (toast as any)?.actionLabel]);

  // Also clear toast when switching tabs to avoid lingering banners
  React.useEffect(() => {
    if (toast) setToast(null as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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
    
    // Reset to default view when switching tabs
    if (tabKey === 'finance') {
      setFinanceView('summary');
    }
  };

  const handleOpenDropdown = (dropdown: string | null) => {
    setOpenDropdown(dropdown);
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
        onOpenDropdown={handleOpenDropdown}
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
        {tab === 'auth' && (
          <Auth
            isDark={isDark}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            registerNickname={registerNickname}
            setRegisterNickname={setRegisterNickname}
            registerPasswordConfirm={registerPasswordConfirm}
            setRegisterPasswordConfirm={setRegisterPasswordConfirm}
            authMode={authMode}
            setAuthMode={setAuthMode}
            handleSignIn={handleSignIn}
            handleSignUp={handleSignUp}
            handleResetPassword={handleResetPassword}
            authError={authError}
          />
        )}
        {tab === 'profile' && (
          <Profile
            currentUser={currentUser}
            isDark={isDark}
            onLogout={handleLogout}
            onAddFriend={(id) => addFriend(id)}
          />
        )}
      </View>

      {/* Context-aware FAB */}
      <FAB
        actions={(() => {
          if (tab === 'finance') {
            return [
              { label: 'Пополнение подушки', onPress: () => setNewEmergencyTx(v => ({ ...v, type: 'deposit' })) },
              { label: 'Инвест. операция', onPress: () => setNewInvestTx(v => ({ ...v, type: 'in' })) },
              { label: 'Новый долг', onPress: () => setNewDebt({ name: '', amount: '', currency: 'USD' }) }
            ];
          }
          if (tab === 'journal') {
            return [
              { label: 'Новая сделка BUY', onPress: () => addTrade({ symbol: 'BTCUSDT', side: 'BUY' as any, qty: 0.01, price: 0, market: 'Crypto', date: new Date().toISOString().slice(0,10) }) },
              { label: 'Новая сделка SELL', onPress: () => addTrade({ symbol: 'BTCUSDT', side: 'SELL' as any, qty: 0.01, price: 0, market: 'Crypto', date: new Date().toISOString().slice(0,10) }) }
            ];
          }
          if (tab === 'planner') {
            return [
              { label: 'Событие', onPress: () => addEvent({ title: 'Новое событие', date: new Date().toISOString().slice(0,10), time: '09:00', notes: '', category: 'Работа', remindBefore: 60, reminders: [60,15] }) },
              { label: 'Тренировка', onPress: () => addWorkout({ type: 'Бег', date: new Date().toISOString().slice(0,10), time: '09:00', notes: '', remindBefore: 15 }) }
            ];
          }
          return [];
        })()}
      />
    </View>
  );
};

export default App;
