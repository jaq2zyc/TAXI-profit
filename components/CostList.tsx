import React, { useState } from 'react';
import { Cost, CostCategory } from '../types';
import { TrashIcon, ReceiptIcon } from './icons';
import { EmptyState } from './EmptyState';

interface CostListProps {
  costs: Cost[];
  onDeleteCost: (id: string) => void;
}

const CATEGORY_STYLES: Record<CostCategory, { bg: string; text: string; icon: React.FC<{className?: string}> }> = {
  'Paliwo': { bg: 'bg-red-500/10', text: 'text-red-400', icon: ReceiptIcon },
  'Myjnia': { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: ReceiptIcon },
  'Serwis': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: ReceiptIcon },
  'Ubezpieczenie': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: ReceiptIcon },
  'Inne': { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: ReceiptIcon },
};

const CostItem: React.FC<{ cost: Cost; onDelete: (id: string) => void }> = ({ cost, onDelete }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const style = CATEGORY_STYLES[cost.category] || CATEGORY_STYLES['Inne'];

  const handleDelete = () => {
    onDelete(cost.id);
    setIsConfirmingDelete(false);
  }

  return (
    <div className="bg-gray-medium p-4 rounded-lg shadow-lg flex justify-between items-center transition-all duration-300 min-h-[80px]">
      <div className="flex-1 flex items-center space-x-4">
        {isConfirmingDelete ? (
            <div className="flex-1 w-full">
                <p className="text-sm text-red-400 font-semibold">Na pewno usunąć?</p>
            </div>
        ) : (
          <>
            <div className={`p-3 rounded-full ${style.bg}`}>
              <style.icon className={`w-6 h-6 ${style.text}`} />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <p className="font-semibold text-text-main">{cost.category}</p>
              </div>
              <div className="flex items-center space-x-2">
                 {cost.description && <p className="text-sm text-gray-very-light">{cost.description}</p>}
                 <p className="text-xs text-text-secondary">
                  ({new Date(cost.date).toLocaleDateString('pl-PL')})
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {isConfirmingDelete ? (
            <div className="flex gap-2">
                <button onClick={handleDelete} className="text-xs font-bold text-text-main bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md">TAK</button>
                <button onClick={() => setIsConfirmingDelete(false)} className="text-xs font-bold text-text-secondary bg-gray-dark hover:bg-gray-dark/50 px-3 py-1 rounded-md">Anuluj</button>
            </div>
        ) : (
          <>
            <p className="text-lg font-bold text-brand-cost">{cost.amount.toFixed(2)} zł</p>
            <button onClick={() => setIsConfirmingDelete(true)} className="p-2 rounded-full text-gray-very-light hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <TrashIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};


export const CostList: React.FC<CostListProps> = ({ costs, onDeleteCost }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-main px-1">Ostatnie koszty</h2>
      {costs.length > 0 ? (
        costs.map(cost => (
          <CostItem key={cost.id} cost={cost} onDelete={onDeleteCost} />
        ))
      ) : (
        <EmptyState
          title="Brak zarejestrowanych kosztów"
          message="Kliknij przycisk +, aby dodać swój pierwszy wydatek."
        />
      )}
    </div>
  );
};