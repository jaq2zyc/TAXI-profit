import React, { useState } from 'react';
import { Partner } from '../types';
import { TrashIcon, PlusIcon } from './icons';
import { PartnerForm } from './PartnerForm';

interface PartnerManagerProps {
  partners: Partner[];
  selectedPartnerId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (partner: Omit<Partner, 'id' | 'isCustom'>) => void;
  onUpdate: (partner: Partner) => void;
  onDelete: (id: string) => void;
}

const EditIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

export const PartnerManager: React.FC<PartnerManagerProps> = ({
  partners,
  selectedPartnerId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const handleSave = (partnerData: Partner) => {
    // This is a unified save function.
    if (editingPartner && editingPartner.id) {
      // It's an update to an existing partner (could be custom or 'own_car_default')
      onUpdate({ ...partnerData, id: editingPartner.id, isCustom: editingPartner.isCustom });
    } else {
      // This is for creating a brand new custom partner
      const { id, isCustom, ...rest } = partnerData;
      onAdd(rest);
    }
    setIsFormVisible(false);
    setEditingPartner(null);
  };
  
  const handleAddNew = () => {
      // Create a blank partner structure for the form
      const blankPartner: Partner = {
        id: '', // Temporary empty ID
        name: '',
        isCustom: true,
        commission: null,
        carConfig: {
            type: 'own',
            model: '',
            avgFuelConsumption: 5.5,
            fuelPrice: 6.8,
            deadheadMileagePercent: 15,
            insurancePolicies: [],
        },
        dailyRecurringCost: null,
        dailyRecurringTime: null,
      };
      setEditingPartner(blankPartner);
      setIsFormVisible(true);
  }

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setIsFormVisible(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="partner-select" className="block text-sm font-medium text-text-secondary mb-1">
          Aktywny profil rozliczeniowy
        </label>
        <select
          id="partner-select"
          value={selectedPartnerId || ''}
          onChange={(e) => onSelect(e.target.value || 'own_car_default')}
          className="block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-3"
        >
          {partners.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-very-light mt-1">
          Wybrany profil będzie używany do analizy danych na pulpicie głównym.
        </p>
      </div>
      
      <div className="space-y-2">
         <h4 className="text-sm font-medium text-text-secondary">Twoje Profile</h4>
         <div className="space-y-2">
             {partners.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-gray-light p-2 rounded-lg">
                    <span className="text-text-main font-semibold">{p.name}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1 text-gray-very-light hover:text-brand-primary"><EditIcon className="w-4 h-4" /></button>
                        {p.isCustom && (
                            <button onClick={() => onDelete(p.id)} className="p-1 text-gray-very-light hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                        )}
                    </div>
                </div>
             ))}
         </div>
         <button 
            onClick={handleAddNew}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-light/50 text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-light transition-colors"
        >
            <PlusIcon className="w-5 h-5"/>
            Dodaj nowy profil partnerski
        </button>
      </div>

      {isFormVisible && (
        <PartnerForm
          partner={editingPartner}
          onSave={handleSave}
          onClose={() => { setIsFormVisible(false); setEditingPartner(null); }}
        />
      )}
    </div>
  );
};