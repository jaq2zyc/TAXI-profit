import { useState, useEffect, useCallback } from 'react';
import { AppSettings, Partner } from '../types';

const SETTINGS_STORAGE_KEY = 'taxi-profit-tracker-app-settings-v9-unified-partner';

const initialSettings: AppSettings = {
  selectedPartnerId: 'own_car_default',
  customPartners: [],
  hasSeenWelcomeModal: false,
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Basic migration if old structure exists
        if(parsed.ownCarSettings) {
            delete parsed.ownCarSettings;
        }
        return { 
          ...initialSettings, 
          ...parsed,
        };
      }
      return initialSettings;
    } catch (error) {
      console.error("Error reading settings from localStorage", error);
      return initialSettings;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings to localStorage", error);
    }
  }, [settings]);

  const saveSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addCustomPartner = useCallback((partnerData: Omit<Partner, 'id' | 'isCustom'>) => {
    const newPartner: Partner = {
      ...partnerData,
      id: `custom_${new Date().toISOString()}_${Math.random()}`,
      isCustom: true,
    };
    setSettings(prev => ({
      ...prev,
      customPartners: [...prev.customPartners, newPartner],
    }));
  }, []);

  const updateCustomPartner = useCallback((updatedPartnerData: Partner) => {
     setSettings(prev => {
        // Handle updates for both custom partners and the special "Własne Auto"
        if(updatedPartnerData.id === 'own_car_default') {
             // This is a special case. We are "overriding" a predefined partner.
             // We'll save it into the customPartners array to persist the changes.
             const otherCustomPartners = prev.customPartners.filter(p => p.id !== 'own_car_default');
             return {
                 ...prev,
                 customPartners: [...otherCustomPartners, updatedPartnerData],
             };
        }

        return {
            ...prev,
            customPartners: prev.customPartners.map(p =>
                p.id === updatedPartnerData.id ? updatedPartnerData : p
            ),
        };
    });
  }, []);

  const deleteCustomPartner = useCallback((partnerId: string) => {
    setSettings(prev => {
      // Prevent deletion of non-custom partners, just in case.
      const partnerToDelete = prev.customPartners.find(p => p.id === partnerId);
      if (!partnerToDelete || !partnerToDelete.isCustom) return prev;

      const newSelectedPartnerId = prev.selectedPartnerId === partnerId ? 'own_car_default' : prev.selectedPartnerId;
      return {
        ...prev,
        selectedPartnerId: newSelectedPartnerId,
        customPartners: prev.customPartners.filter(p => p.id !== partnerId),
      };
    });
  }, []);
  
  return { 
    settings, 
    saveSettings,
    addCustomPartner,
    updateCustomPartner,
    deleteCustomPartner,
  };
};