import React, { useState, useMemo } from 'react';
import { useTrips } from './hooks/useTrips';
import { useCosts } from './hooks/useCosts';
import { useAppSettings } from './hooks/useAppSettings';
import { useDaySummaries } from './hooks/useDaySummaries';
import { usePartners } from './hooks/usePartners';
import { useHistory } from './hooks/useImportHistory';

import { TripForm } from './components/TripForm';
import { CostForm } from './components/CostForm';
import { TripList } from './components/TripList';
import { CostList } from './components/CostList';
import { DailySummaryList } from './components/DailySummaryList';
import { CostAnalysis } from './components/CostAnalysis';
import { StatCard } from './components/StatCard';
import { EarningsChart } from './components/EarningsChart';
import { SettingsModal } from './components/SettingsModal';
import { SmartImportModal } from './components/SmartImportModal';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Chatbot } from './components/Chatbot';
import { WelcomeModal } from './components/WelcomeModal';

import { MoneyIcon, ClockIcon, CarIcon, SparklesIcon, ReceiptIcon, CogIcon, FileTextIcon, PlusIcon } from './components/icons';
import { calculateAggregatedAnalytics, formatDuration } from './utils/analytics';
import { getInsightsFromGemini } from './services/geminiService';
import { Trip, Partner, Platform, HistoryItem, Cost } from './types';

const App: React.FC = () => {
  const { trips, addTrip, addMultipleTrips, deleteTrip, deleteMultipleTrips } = useTrips();
  const { 
    costs: incidentalCosts, 
    addCost, 
    deleteCost,
  } = useCosts();
  const { 
    settings: appSettings, 
    saveSettings,
    addCustomPartner,
    updateCustomPartner,
    deleteCustomPartner,
  } = useAppSettings();
  
  const { allPartners, activePartner, findPartnerById } = usePartners(appSettings);
  const { history, addHistoryItem, deleteHistoryItem, deleteHistoryItemByRelatedId } = useHistory();
  
  const daySummaries = useDaySummaries(trips, incidentalCosts, allPartners);

  const [isTripFormVisible, setIsTripFormVisible] = useState(false);
  const [isCostFormVisible, setIsCostFormVisible] = useState(false);
  const [isInsightsModalVisible, setIsInsightsModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isSmartImportModalVisible, setIsSmartImportModalVisible] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(!appSettings.hasSeenWelcomeModal);


  const [insights, setInsights] = useState('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<'current' | 'previous'>('current');
  const [activeView, setActiveView] = useState<'summaries' | 'analysis' | 'trips' | 'costs'>('summaries');

  const allTimeAnalytics = useMemo(() => 
    calculateAggregatedAnalytics(daySummaries), 
    [daySummaries]
  );
  
  const { monthName, monthlySummaryData } = useMemo(() => {
    const now = new Date();
    let targetDate = new Date();
    if (summaryPeriod === 'previous') {
        targetDate.setMonth(now.getMonth() - 1);
    }
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    const monthFormatter = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });
    
    const monthlySummaries = daySummaries.filter(s => {
      const itemDate = new Date(s.date);
      return itemDate.getFullYear() === targetYear && itemDate.getMonth() === targetMonth;
    });

    const monthlyAnalytics = calculateAggregatedAnalytics(monthlySummaries);

    return {
      monthName: monthFormatter.format(targetDate),
      monthlySummaryData: {
        earnings: monthlyAnalytics.totalRevenue,
        costs: monthlyAnalytics.totalCosts,
        profit: monthlyAnalytics.netProfit
      }
    };
  }, [daySummaries, summaryPeriod]);

  const handleGetInsights = async () => {
    setIsInsightsModalVisible(true);
    setIsLoadingInsights(true);
    const result = await getInsightsFromGemini(daySummaries, trips);
    setInsights(result);
    setIsLoadingInsights(false);
  };
  
  const handleCloseWelcomeModal = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
        saveSettings({ hasSeenWelcomeModal: true });
    }
    setIsWelcomeModalVisible(false);
  };

  const handleAddTripWithPartner = (trip: Omit<Trip, 'id' | 'partnerId'>) => {
    const newTrip: Trip = { 
      ...trip, 
      id: `manual_${new Date().toISOString()}`,
      partnerId: appSettings.selectedPartnerId 
    };
    addTrip(newTrip);
  };
  
  const handleAddNewCost = (costData: Omit<Cost, 'id'>) => {
    const newCost = addCost(costData);
    const historyItem: HistoryItem = {
        id: `hist_cost_${newCost.id}`,
        date: newCost.date,
        type: 'cost',
        description: newCost.description || newCost.category,
        amount: newCost.amount,
        relatedIds: [newCost.id],
    };
    addHistoryItem(historyItem);
  };
  
  const handleDeleteCost = (costId: string) => {
    deleteCost(costId);
    deleteHistoryItemByRelatedId(costId);
  };

  const handleImportTrips = (
    importedTrips: Omit<Trip, 'id' | 'partnerId'>[],
    partnerId: string | null,
    fileName: string,
    platform: Platform
  ) => {
    const newTrips: Trip[] = importedTrips.map((trip, index) => ({
      ...trip,
      id: new Date().toISOString() + `-${index}-${Math.random()}`,
      partnerId: partnerId,
    }));
    
    addMultipleTrips(newTrips);

    const newHistoryItem: HistoryItem = {
      id: `hist_trips_${new Date().toISOString()}`,
      date: new Date().toISOString(),
      type: 'trips',
      fileName: fileName,
      platform: platform,
      tripCount: newTrips.length,
      relatedIds: newTrips.map(t => t.id),
    };
    addHistoryItem(newHistoryItem);
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    const itemToDelete = history.find(b => b.id === itemId);
    if (itemToDelete) {
      if (itemToDelete.type === 'trips') {
          deleteMultipleTrips(itemToDelete.relatedIds);
      } else if (itemToDelete.type === 'cost') {
          deleteCost(itemToDelete.relatedIds[0]);
      }
      deleteHistoryItem(itemId);
    }
  };


  const AiInsightsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-medium rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-main flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-brand-primary" />
            Wskazówki AI
          </h2>
          <button onClick={() => setIsInsightsModalVisible(false)} className="text-gray-400 hover:text-white text-3xl transition-colors">&times;</button>
        </div>
        {isLoadingInsights ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className="prose prose-invert prose-p:text-text-secondary prose-headings:text-text-main prose-strong:text-text-main" dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br />') }}></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-dark">
      <header className="bg-gray-medium/80 backdrop-blur-sm shadow-md sticky top-0 z-30 border-b border-gray-light/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <CarIcon className="w-8 h-8 text-brand-primary"/>
            <h1 className="text-xl font-bold text-text-main tracking-tight">Taxi Profit</h1>
          </div>
           <div className="flex items-center gap-2">
              <button onClick={() => setIsSmartImportModalVisible(true)} className="flex items-center gap-2 bg-gray-light text-text-main font-semibold px-4 py-2 rounded-lg hover:bg-gray-very-light/50 transition-colors text-sm" title="Importuj dane z CSV">
                <FileTextIcon className="w-5 h-5" />
                Importuj dane
              </button>
              <button onClick={() => setIsSettingsModalVisible(true)} className="p-2 rounded-full text-gray-very-light hover:text-white hover:bg-gray-light transition-colors" title="Ustawienia">
                <CogIcon className="w-6 h-6" />
              </button>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-8 pb-32">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="md:col-span-2">
                <StatCard 
                    variant="hero"
                    title="Zysk Netto na Godzinę" 
                    value={`${allTimeAnalytics.profitPerHour.toFixed(2)} zł`} 
                    icon={<MoneyIcon className="w-10 h-10 text-brand-profit"/>} 
                />
            </div>
            <StatCard 
                title="Czas Pracy" 
                value={formatDuration(allTimeAnalytics.totalWorkTimeMs)} 
                icon={<ClockIcon className="w-8 h-8 text-brand-primary"/>} 
            />
             <StatCard 
                title="Całkowity Zysk" 
                value={`${allTimeAnalytics.netProfit.toFixed(2)} zł`} 
                icon={<MoneyIcon className="w-8 h-8 text-brand-profit"/>}
                comparison={{ value: allTimeAnalytics.profitComparison, label: "vs wczoraj" }}
                sparklineData={allTimeAnalytics.profitSparkline}
            />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <StatCard 
                title="Przychód (brutto)" 
                value={`${allTimeAnalytics.totalRevenue.toFixed(2)} zł`} 
                icon={<MoneyIcon className="w-8 h-8 text-brand-primary"/>} 
                comparison={{ value: allTimeAnalytics.revenueComparison, label: "vs wczoraj" }}
                sparklineData={allTimeAnalytics.revenueSparkline}
            />
            <StatCard 
                title="Koszty" 
                value={`${allTimeAnalytics.totalCosts.toFixed(2)} zł`} 
                icon={<ReceiptIcon className="w-8 h-8 text-brand-cost"/>}
                comparison={{ value: allTimeAnalytics.costsComparison, label: "vs wczoraj" }}
                sparklineData={allTimeAnalytics.costsSparkline}
            />
        </div>

        
        <div className="bg-gray-medium p-4 sm:p-6 rounded-lg shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4 sm:gap-0">
            <h2 className="text-xl font-bold text-text-main">Podsumowanie Miesiąca</h2>
            <div className="flex items-center bg-gray-light rounded-lg p-1 self-start">
              <button 
                onClick={() => setSummaryPeriod('previous')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${summaryPeriod === 'previous' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-gray-very-light/10'}`}
              >
                Poprzedni
              </button>
              <button 
                onClick={() => setSummaryPeriod('current')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${summaryPeriod === 'current' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-gray-very-light/10'}`}
              >
                Bieżący
              </button>
            </div>
          </div>
          <p className="text-center text-text-secondary mb-4 font-semibold capitalize">{monthName}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-very-light">Przychód</p>
              <p className="text-2xl font-bold text-brand-primary">{monthlySummaryData.earnings.toFixed(2)} zł</p>
            </div>
            <div>
              <p className="text-sm text-gray-very-light">Koszty</p>
              <p className="text-2xl font-bold text-brand-cost">{monthlySummaryData.costs.toFixed(2)} zł</p>
            </div>
            <div>
              <p className="text-sm text-gray-very-light">Zysk</p>
              <p className="text-2xl font-bold text-brand-profit">{monthlySummaryData.profit.toFixed(2)} zł</p>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="border-b border-gray-light/50 flex space-x-2 flex-wrap">
              <button onClick={() => setActiveView('summaries')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'summaries' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Podsumowanie Dzienne</button>
              <button onClick={() => setActiveView('analysis')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'analysis' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Analiza</button>
              <button onClick={() => setActiveView('trips')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'trips' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Kursy</button>
              <button onClick={() => setActiveView('costs')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'costs' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Koszty</button>
          </div>
        </div>

        {activeView === 'trips' && (
          <div className="space-y-6">
            <EarningsChart trips={trips} />
            <TripList trips={trips} onDeleteTrip={deleteTrip} />
          </div>
        )}
        
        {activeView === 'analysis' && (
          <AnalysisDashboard allTrips={trips} daySummaries={daySummaries} />
        )}

        {activeView === 'summaries' && (
            <div className="space-y-6">
                <DailySummaryList daySummaries={daySummaries} />
            </div>
        )}

        {activeView === 'costs' && (
            <div className="space-y-6">
                <CostAnalysis daySummaries={daySummaries} />
                <CostList costs={incidentalCosts} onDeleteCost={handleDeleteCost} />
            </div>
        )}
      </main>
      
      <Chatbot
          daySummaries={daySummaries}
          allTrips={trips}
      />

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {isActionMenuOpen && (
           <div className="flex flex-col items-end gap-3">
             <button
                onClick={() => { setIsCostFormVisible(true); setIsActionMenuOpen(false); }}
                className="flex items-center gap-2 bg-brand-cost text-white pl-3 pr-4 py-2 rounded-full shadow-lg hover:bg-orange-600 transition-all transform hover:scale-105"
                aria-label='Dodaj nowy koszt'
              >
                <ReceiptIcon className="w-6 h-6" />
                <span className="text-sm font-semibold">Koszt</span>
              </button>
              <button
                onClick={() => { setIsTripFormVisible(true); setIsActionMenuOpen(false); }}
                className="flex items-center gap-2 bg-brand-primary text-white pl-3 pr-4 py-2 rounded-full shadow-lg hover:bg-brand-secondary transition-all transform hover:scale-105"
                aria-label='Dodaj nowy kurs'
              >
                <CarIcon className="w-6 h-6" />
                <span className="text-sm font-semibold">Kurs</span>
              </button>
               <button
                  onClick={() => { handleGetInsights(); setIsActionMenuOpen(false); }}
                  className="flex items-center gap-2 bg-gray-medium text-text-main pl-3 pr-4 py-2 rounded-full shadow-lg hover:bg-gray-light transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={trips.length < 5}
                  title={trips.length < 5 ? "Dodaj więcej kursów, aby odblokować wskazówki AI" : "Uzyskaj wskazówki AI"}
              >
                  <SparklesIcon className="w-6 h-6 text-brand-primary" />
                  <span className="text-sm font-semibold">Wskazówki</span>
              </button>
           </div>
        )}

        <button
          onClick={() => setIsActionMenuOpen(prev => !prev)}
          className="bg-brand-secondary text-white p-4 rounded-full shadow-lg hover:bg-brand-primary transition-transform transform hover:scale-110"
          aria-label='Otwórz menu akcji'
        >
          <PlusIcon className={`w-8 h-8 transition-transform duration-300 ${isActionMenuOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>
      
      {isWelcomeModalVisible && <WelcomeModal onClose={handleCloseWelcomeModal} />}
      {isTripFormVisible && <TripForm onAddTrip={handleAddTripWithPartner} onClose={() => setIsTripFormVisible(false)} />}
      {isCostFormVisible && <CostForm onAddCost={handleAddNewCost} onClose={() => setIsCostFormVisible(false)} />}
      {isInsightsModalVisible && <AiInsightsModal />}
      {isSettingsModalVisible && 
        <SettingsModal 
          settings={appSettings}
          saveSettings={saveSettings}
          onClose={() => setIsSettingsModalVisible(false)}
          trips={trips}
          costs={incidentalCosts}
          history={history}
          addCustomPartner={addCustomPartner}
          updateCustomPartner={updateCustomPartner}
          deleteCustomPartner={deleteCustomPartner}
          onDeleteHistoryItem={handleDeleteHistoryItem}
        />
      }
      {isSmartImportModalVisible &&
        <SmartImportModal
          onClose={() => setIsSmartImportModalVisible(false)}
          onImport={handleImportTrips}
          partners={allPartners}
        />
      }
    </div>
  );
};

export default App;