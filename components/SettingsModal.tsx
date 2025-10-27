import React, { useState } from 'react';
import { DownloadIcon, TrashIcon } from './icons';
import { AppSettings, Partner, Trip, Cost, HistoryItem, Platform } from '../types';
import { exportTripsToCsv, exportCostsToCsv } from '../utils/exporters';
import { usePartners } from '../hooks/usePartners';
import { PartnerManager } from './PartnerManager';

// --- DataExporter Component ---
const DataExporter: React.FC<{ trips: Trip[], costs: Cost[] }> = ({ trips, costs }) => {
    
    const handleDownload = (content: string, filename: string) => {
        const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportTrips = () => {
        const csvContent = exportTripsToCsv(trips);
        handleDownload(csvContent, 'taxi-profit-tracker-kursy.csv');
    };

    const handleExportCosts = () => {
        const csvContent = exportCostsToCsv(costs);
        handleDownload(csvContent, 'taxi-profit-tracker-koszty.csv');
    };

    return (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-text-main">Eksport Danych</h3>
          <p className="text-sm text-text-secondary">Pobierz swoje dane w formacie CSV, aby je zarchiwizować lub otworzyć w innym programie, np. Excel.</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleExportTrips} disabled={trips.length === 0} className="w-full flex items-center justify-center gap-2 bg-gray-light text-text-main font-semibold py-2 px-4 rounded-lg hover:bg-gray-very-light/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <DownloadIcon className="w-5 h-5"/> Pobierz kursy ({trips.length})
            </button>
            <button onClick={handleExportCosts} disabled={costs.length === 0} className="w-full flex items-center justify-center gap-2 bg-gray-light text-text-main font-semibold py-2 px-4 rounded-lg hover:bg-gray-very-light/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <DownloadIcon className="w-5 h-5"/> Pobierz koszty ({costs.length})
            </button>
          </div>
        </div>
    );
};

// --- HistoryManager Component ---
const HistoryManager: React.FC<{ history: HistoryItem[], onDelete: (id: string) => void }> = ({ history, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const visibleHistory = isExpanded ? history : history.slice(0, 2);

  const handleDelete = (id: string) => {
    onDelete(id);
    setConfirmDeleteId(null);
  }
  
  const getPlatformBg = (platform?: Platform) => {
    if (platform === 'Uber') return 'bg-black text-white';
    if (platform === 'Bolt') return 'bg-green-500 text-white';
    return 'bg-gray-500 text-white';
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-text-main">Historia Aktywności</h3>
      <div className="space-y-2">
        {visibleHistory.length > 0 ? visibleHistory.map(item => (
          <div key={item.id} className="bg-gray-light p-3 rounded-lg flex justify-between items-center min-h-[58px]">
            {confirmDeleteId === item.id ? (
              <>
                <p className="text-sm text-red-400 font-semibold">Na pewno usunąć?</p>
                <div className="flex gap-2">
                    <button onClick={() => handleDelete(item.id)} className="text-xs font-bold text-text-main bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md">TAK</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-bold text-text-secondary bg-gray-dark hover:bg-gray-dark/50 px-3 py-1 rounded-md">Anuluj</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    {item.type === 'trips' ? `Import: ${item.fileName}` : `Koszt: ${item.description}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                     <span>{new Date(item.date).toLocaleDateString('pl-PL')}</span>
                     <span>•</span>
                     {item.type === 'trips' && item.tripCount && (
                         <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${getPlatformBg(item.platform)}`}>{item.tripCount} kursów</span>
                     )}
                     {item.type === 'cost' && item.amount && (
                         <span className="font-semibold text-brand-cost">{item.amount.toFixed(2)} zł</span>
                     )}
                  </div>
                </div>
                <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 rounded-full text-gray-very-light hover:text-red-500 hover:bg-red-500/10 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )) : <p className="text-sm text-text-secondary text-center py-4">Brak historii importów lub dodanych kosztów.</p>}
      </div>
      {history.length > 2 && (
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-sm font-semibold text-brand-primary hover:underline p-2">
          {isExpanded ? 'Pokaż mniej' : `Pokaż więcej (${history.length - 2})`}
        </button>
      )}
    </div>
  );
};


// --- Main SettingsModal Component ---
interface SettingsModalProps {
  settings: AppSettings;
  saveSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
  trips: Trip[];
  costs: Cost[];
  history: HistoryItem[];
  addCustomPartner: (partner: Omit<Partner, 'id' | 'isCustom'>) => void;
  updateCustomPartner: (partner: Partner) => void;
  deleteCustomPartner: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  saveSettings,
  onClose,
  trips,
  costs,
  history,
  addCustomPartner,
  updateCustomPartner,
  deleteCustomPartner,
  onDeleteHistoryItem,
}) => {
  const { allPartners } = usePartners(settings);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-medium rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-main">Ustawienia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl transition-colors -mt-4 -mr-2">&times;</button>
        </div>
        <div className="space-y-6">
          <PartnerManager 
            partners={allPartners}
            selectedPartnerId={settings.selectedPartnerId}
            onSelect={(id) => saveSettings({ selectedPartnerId: id })}
            onAdd={addCustomPartner}
            onUpdate={updateCustomPartner}
            onDelete={deleteCustomPartner}
          />
          <div className="border-t border-gray-light/50"></div>
          <DataExporter trips={trips} costs={costs} />
          <div className="border-t border-gray-light/50"></div>
          <HistoryManager history={history} onDelete={onDeleteHistoryItem} />
        </div>
      </div>
    </div>
  );
};