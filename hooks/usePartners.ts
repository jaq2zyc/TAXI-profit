import { useMemo } from 'react';
import { predefinedPartners } from '../data/partners';
import { AppSettings, Partner } from '../types';

export const usePartners = (settings: AppSettings) => {
  const allPartners = useMemo(() => {
    // Start with a fresh copy of predefined partners
    let partners: Partner[] = JSON.parse(JSON.stringify(predefinedPartners));
    
    // Check if "Własne Auto" has been customized and override it
    const customOwnCar = settings.customPartners.find(p => p.id === 'own_car_default');
    if (customOwnCar) {
        partners = partners.map(p => p.id === 'own_car_default' ? customOwnCar : p);
    }

    // Add other custom partners
    const otherCustomPartners = settings.customPartners.filter(p => p.id !== 'own_car_default');
    partners.push(...otherCustomPartners);

    return partners;
  }, [settings.customPartners]);

  const findPartnerById = (id: string | null) => {
    if (!id) return allPartners.find(p => p.id === 'own_car_default') || null; // Fallback to default
    return allPartners.find(p => p.id === id) || null;
  };

  const activePartner = useMemo(() => {
    return findPartnerById(settings.selectedPartnerId);
  }, [settings.selectedPartnerId, allPartners]);

  return { allPartners, activePartner, findPartnerById };
};