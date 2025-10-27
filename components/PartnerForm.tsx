import React, { useState, useEffect } from 'react';
import { Partner, CarConfig, InsurancePolicy } from '../types';
import { InsuranceForm } from './InsuranceForm';

interface PartnerFormProps {
  partner: Partner | null;
  onSave: (partner: Partner) => void;
  onClose: () => void;
}

export const PartnerForm: React.FC<PartnerFormProps> = ({ partner, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [commission, setCommission] = useState('');
  const [carConfigType, setCarConfigType] = useState<CarConfig['type']>('own');
  
  // State for 'own' car
  const [carModel, setCarModel] = useState('');
  const [avgFuelConsumption, setAvgFuelConsumption] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [deadheadMileagePercent, setDeadheadMileagePercent] = useState('');
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  
  // State for 'rental' car
  const [hasRentalCost, setHasRentalCost] = useState(false);
  const [rentalAmount, setRentalAmount] = useState('');
  const [rentalFrequency, setRentalFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [fuelCoveredBy, setFuelCoveredBy] = useState<'driver' | 'partner'>('driver');
  const [rentalAvgFuelConsumption, setRentalAvgFuelConsumption] = useState('');
  const [rentalFuelPrice, setRentalFuelPrice] = useState('');

  // State for daily recurring items
  const [hasDailyCost, setHasDailyCost] = useState(false);
  const [dailyCostDesc, setDailyCostDesc] = useState('');
  const [dailyCostAmount, setDailyCostAmount] = useState('');
  const [hasDailyTime, setHasDailyTime] = useState(false);
  const [dailyTimeDesc, setDailyTimeDesc] = useState('');
  const [dailyTimeMinutes, setDailyTimeMinutes] = useState('');


  // State for insurance form
  const [isPolicyFormVisible, setIsPolicyFormVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  useEffect(() => {
    if (partner) {
      setName(partner.name);
      setCommission(partner.commission?.percentage.toString() || '');
      
      const config = partner.carConfig;
      setCarConfigType(config.type);
      if (config.type === 'own') {
        setCarModel(config.model || '');
        setAvgFuelConsumption(config.avgFuelConsumption?.toString() || '');
        setFuelPrice(config.fuelPrice?.toString() || '');
        setDeadheadMileagePercent(config.deadheadMileagePercent?.toString() || '');
        setInsurancePolicies(config.insurancePolicies || []);
      } else { // rental
        setHasRentalCost(!!config.rentalCost);
        setRentalAmount(config.rentalCost?.amount.toString() || '');
        setRentalFrequency(config.rentalCost?.frequency || 'weekly');
        setFuelCoveredBy(config.fuelCoveredBy);
        setRentalAvgFuelConsumption(config.avgFuelConsumption?.toString() || '');
        setRentalFuelPrice(config.fuelPrice?.toString() || '');
      }

      setHasDailyCost(!!partner.dailyRecurringCost);
      setDailyCostDesc(partner.dailyRecurringCost?.description || '');
      setDailyCostAmount(partner.dailyRecurringCost?.amount.toString() || '');
      
      setHasDailyTime(!!partner.dailyRecurringTime);
      setDailyTimeDesc(partner.dailyRecurringTime?.description || '');
      setDailyTimeMinutes(partner.dailyRecurringTime?.minutes.toString() || '');


    } else {
      // Reset form for adding a new partner
      setName('');
      setCommission('');
      setCarConfigType('own');
      setCarModel('');
      setAvgFuelConsumption('');
      setFuelPrice('');
      setDeadheadMileagePercent('');
      setInsurancePolicies([]);
      setHasRentalCost(false);
      setRentalAmount('');
      setRentalFrequency('weekly');
      setFuelCoveredBy('driver');
      setRentalAvgFuelConsumption('');
      setRentalFuelPrice('');
      setHasDailyCost(false);
      setDailyCostDesc('');
      setDailyCostAmount('');
      setHasDailyTime(false);
      setDailyTimeDesc('');
      setDailyTimeMinutes('');
    }
  }, [partner]);

  const handleSavePolicy = (policyData: Omit<InsurancePolicy, 'id'>) => {
    if (editingPolicy) {
        setInsurancePolicies(policies => policies.map(p => p.id === editingPolicy.id ? { ...editingPolicy, ...policyData } : p));
    } else {
        const newPolicy: InsurancePolicy = { ...policyData, id: `policy_${Date.now()}` };
        setInsurancePolicies(policies => [...policies, newPolicy]);
    }
    setIsPolicyFormVisible(false);
    setEditingPolicy(null);
  };
  
  const handleDeletePolicy = (id: string) => {
    setInsurancePolicies(policies => policies.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const commissionValue = parseFloat(commission);
    
    let carConfig: CarConfig;
    if (carConfigType === 'own') {
      const avgFuelConsumptionValue = parseFloat(avgFuelConsumption);
      const fuelPriceValue = parseFloat(fuelPrice);
      const deadheadValue = parseFloat(deadheadMileagePercent);
      if (isNaN(avgFuelConsumptionValue) || avgFuelConsumptionValue <= 0 || isNaN(fuelPriceValue) || fuelPriceValue <= 0 || isNaN(deadheadValue) || deadheadValue < 0) {
          alert("Spalanie, cena paliwa i dystans dojazdów muszą być poprawnymi, nieujemnymi liczbami (spalanie i cena > 0).");
          return;
      }
      carConfig = {
        type: 'own',
        model: carModel,
        avgFuelConsumption: avgFuelConsumptionValue,
        fuelPrice: fuelPriceValue,
        deadheadMileagePercent: deadheadValue,
        insurancePolicies,
      };
    } else { // rental
      const rentalAmountValue = parseFloat(rentalAmount);
      const rentalCarConfig: Extract<CarConfig, { type: 'rental' }> = {
        type: 'rental',
        rentalCost: hasRentalCost && !isNaN(rentalAmountValue) && rentalAmountValue > 0 ? {
          id: (partner?.carConfig.type === 'rental' ? partner.carConfig.rentalCost?.id : undefined) || `rental_${Date.now()}`,
          description: `Najem auta (${name || 'Partner'})`,
          amount: rentalAmountValue,
          frequency: rentalFrequency,
          startDate: (partner?.carConfig.type === 'rental' && partner.carConfig.rentalCost) ? partner.carConfig.rentalCost.startDate : new Date().toISOString().split('T')[0],
        } : null,
        fuelCoveredBy,
      };

      if (fuelCoveredBy === 'driver') {
        const avgFuelConsumptionValue = parseFloat(rentalAvgFuelConsumption);
        const fuelPriceValue = parseFloat(rentalFuelPrice);
        if (isNaN(avgFuelConsumptionValue) || avgFuelConsumptionValue <= 0 || isNaN(fuelPriceValue) || fuelPriceValue <= 0) {
            alert("Dla auta na najem z kosztem paliwa po stronie kierowcy, spalanie i cena paliwa muszą być poprawnymi, dodatnimi liczbami.");
            return;
        }
        rentalCarConfig.avgFuelConsumption = avgFuelConsumptionValue;
        rentalCarConfig.fuelPrice = fuelPriceValue;
      }
      carConfig = rentalCarConfig;
    }

    const dailyCostAmountValue = parseFloat(dailyCostAmount);
    const dailyTimeMinutesValue = parseInt(dailyTimeMinutes, 10);

    const partnerToSave: Partner = {
      id: partner?.id || '',
      isCustom: partner?.isCustom ?? true,
      name,
      commission: !isNaN(commissionValue) && commissionValue > 0 ? {
        id: partner?.commission?.id || `commission_${Date.now()}`,
        description: `Prowizja ${name || 'Partner'}`,
        percentage: commissionValue,
      } : null,
      carConfig,
      dailyRecurringCost: hasDailyCost && dailyCostDesc && !isNaN(dailyCostAmountValue) && dailyCostAmountValue > 0 ? {
        id: partner?.dailyRecurringCost?.id || `daily_cost_${Date.now()}`,
        description: dailyCostDesc,
        amount: dailyCostAmountValue,
      } : null,
      dailyRecurringTime: hasDailyTime && dailyTimeDesc && !isNaN(dailyTimeMinutesValue) && dailyTimeMinutesValue > 0 ? {
        id: partner?.dailyRecurringTime?.id || `daily_time_${Date.now()}`,
        description: dailyTimeDesc,
        minutes: dailyTimeMinutesValue,
      } : null,
    };
    onSave(partnerToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-medium rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-text-main">
          {partner?.id ? 'Edytuj Profil' : 'Dodaj Nowego Partnera'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Nazwa Profilu</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
              required
              placeholder="np. Mój Partner Flotowy"
              disabled={!partner?.isCustom && partner?.id !== 'own_car_default'}
            />
          </div>
          <div>
            <label htmlFor="commission" className="block text-sm font-medium text-text-secondary">Prowizja od obrotu (%)</label>
            <input
              id="commission"
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
              placeholder="np. 25 (zostaw puste jeśli brak)"
              step="0.1"
            />
          </div>

          <div className="p-4 bg-gray-dark/50 rounded-lg space-y-4">
            <h3 className="block text-sm font-medium text-text-secondary">Jakim autem jeździsz?</h3>
            <div className="mt-2 flex space-x-4">
                <label className="flex items-center">
                    <input type="radio" value="own" checked={carConfigType === 'own'} onChange={() => setCarConfigType('own')} className="form-radio h-4 w-4 text-brand-primary bg-gray-light border-gray-light focus:ring-brand-primary"/>
                    <span className="ml-2 text-text-main">Własne auto</span>
                </label>
                <label className="flex items-center">
                    <input type="radio" value="rental" checked={carConfigType === 'rental'} onChange={() => setCarConfigType('rental')} className="form-radio h-4 w-4 text-brand-primary bg-gray-light border-gray-light focus:ring-brand-primary"/>
                    <span className="ml-2 text-text-main">Auto partnera (najem)</span>
                </label>
            </div>
            
            {carConfigType === 'own' && (
                <div className="space-y-4 border-t border-gray-light pt-4 mt-4">
                    <p className="text-sm font-semibold text-text-main">Dane pojazdu (do automatycznego obliczania kosztów)</p>
                    <div>
                        <label htmlFor="carModel" className="block text-sm font-medium text-text-secondary">Model auta (opcjonalnie)</label>
                        <input id="carModel" type="text" value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="np. Toyota Prius" className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                         <div>
                            <label htmlFor="avgFuelConsumption" className="block text-sm font-medium text-text-secondary">Śr. spalanie (L/100km)</label>
                            <input id="avgFuelConsumption" type="number" value={avgFuelConsumption} onChange={(e) => setAvgFuelConsumption(e.target.value)} placeholder="np. 5.5" step="0.1" required className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" />
                        </div>
                         <div>
                            <label htmlFor="fuelPrice" className="block text-sm font-medium text-text-secondary">Cena paliwa (PLN/L)</label>
                            <input id="fuelPrice" type="number" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} placeholder="np. 6.85" step="0.01" required className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" />
                        </div>
                        <div>
                            <label htmlFor="deadhead" className="block text-sm font-medium text-text-secondary">Dojazdy do klienta (%)</label>
                            <input id="deadhead" type="number" value={deadheadMileagePercent} onChange={(e) => setDeadheadMileagePercent(e.target.value)} placeholder="np. 15" step="1" required className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" />
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-gray-light/50">
                      <h4 className="text-sm font-semibold text-text-main">Polisy ubezpieczeniowe</h4>
                       <p className="text-xs text-text-secondary -mt-1">
                          Aplikacja automatycznie obliczy dzienny koszt polis i doliczy go do podsumowań.
                      </p>
                      {insurancePolicies.map(policy => (
                          <div key={policy.id} className="flex items-center justify-between bg-gray-light p-2 rounded-lg">
                              <div>
                                  <p className="text-text-main text-sm font-semibold">{policy.description}</p>
                                  <p className="text-xs text-text-secondary">{policy.amount} zł ({new Date(policy.startDate).toLocaleDateString()} - {new Date(policy.endDate).toLocaleDateString()})</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => { setEditingPolicy(policy); setIsPolicyFormVisible(true); }} className="p-1 text-gray-very-light hover:text-brand-primary">Edit</button>
                                  <button type="button" onClick={() => handleDeletePolicy(policy.id)} className="p-1 text-gray-very-light hover:text-red-500">Delete</button>
                              </div>
                          </div>
                      ))}
                      <button type="button" onClick={() => { setEditingPolicy(null); setIsPolicyFormVisible(true); }} className="w-full mt-2 bg-gray-light/50 text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-light transition-colors text-sm">Dodaj polisę</button>
                    </div>

                </div>
            )}

            {carConfigType === 'rental' && (
                <div className="space-y-4 border-t border-gray-light pt-4 mt-4">
                    <label className="flex items-center">
                        <input type="checkbox" checked={hasRentalCost} onChange={(e) => setHasRentalCost(e.target.checked)} className="form-checkbox h-4 w-4 text-brand-primary bg-gray-light border-gray-light rounded focus:ring-brand-primary"/>
                        <span className="ml-2 text-text-main">Najem auta</span>
                    </label>
                    {hasRentalCost && (
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="rentalAmount" className="block text-sm font-medium text-text-secondary">Koszt najmu (PLN)</label>
                                <input id="rentalAmount" type="number" value={rentalAmount} onChange={(e) => setRentalAmount(e.target.value)} className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" placeholder="np. 600" step="0.01" />
                            </div>
                            <div>
                                <label htmlFor="rentalFrequency" className="block text-sm font-medium text-text-secondary">Okres</label>
                                <select id="rentalFrequency" value={rentalFrequency} onChange={(e) => setRentalFrequency(e.target.value as 'weekly' | 'monthly')} className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2">
                                    <option value="weekly">Tygodniowo</option>
                                    <option value="monthly">Miesięcznie</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mt-4">Koszt paliwa pokrywa</label>
                        <div className="mt-2 flex space-x-4">
                            <label className="flex items-center">
                                <input type="radio" value="driver" checked={fuelCoveredBy === 'driver'} onChange={() => setFuelCoveredBy('driver')} className="form-radio h-4 w-4 text-brand-primary bg-gray-light border-gray-light focus:ring-brand-primary"/>
                                <span className="ml-2 text-text-main">Kierowca</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" value="partner" checked={fuelCoveredBy === 'partner'} onChange={() => setFuelCoveredBy('partner')} className="form-radio h-4 w-4 text-brand-primary bg-gray-light border-gray-light focus:ring-brand-primary"/>
                                <span className="ml-2 text-text-main">Partner</span>
                            </label>
                        </div>
                    </div>
                    {fuelCoveredBy === 'driver' && (
                        <div className="space-y-4 border-t border-gray-light/50 pt-4 mt-4">
                            <p className="text-sm font-semibold text-text-main">Dane do obliczenia kosztów paliwa</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="rentalAvgFuelConsumption" className="block text-sm font-medium text-text-secondary">Śr. spalanie (L/100km)</label>
                                    <input id="rentalAvgFuelConsumption" type="number" value={rentalAvgFuelConsumption} onChange={(e) => setRentalAvgFuelConsumption(e.target.value)} placeholder="np. 8.0" step="0.1" required className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" />
                                </div>
                                <div>
                                    <label htmlFor="rentalFuelPrice" className="block text-sm font-medium text-text-secondary">Cena paliwa (PLN/L)</label>
                                    <input id="rentalFuelPrice" type="number" value={rentalFuelPrice} onChange={(e) => setRentalFuelPrice(e.target.value)} placeholder="np. 6.85" step="0.01" required className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>

           <div className="p-4 bg-gray-dark/50 rounded-lg space-y-4">
              <h3 className="block text-sm font-medium text-text-secondary">Koszty i Czas Po Zakończeniu Pracy</h3>
              <p className="text-xs text-text-secondary -mt-3">Zdefiniuj czynności, które będą automatycznie dodawane do każdego dnia, w którym wykonano kursy.</p>
              
              <div className="space-y-4 border-t border-gray-light pt-4">
                  <label className="flex items-center">
                      <input type="checkbox" checked={hasDailyCost} onChange={(e) => setHasDailyCost(e.target.checked)} className="form-checkbox h-4 w-4 text-brand-primary bg-gray-light border-gray-light rounded focus:ring-brand-primary"/>
                      <span className="ml-2 text-text-main">Stały koszt dzienny (np. myjnia)</span>
                  </label>
                  {hasDailyCost && (
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label htmlFor="dailyCostDesc" className="block text-sm font-medium text-text-secondary">Opis</label>
                              <input id="dailyCostDesc" type="text" value={dailyCostDesc} onChange={(e) => setDailyCostDesc(e.target.value)} className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm p-2" placeholder="np. Myjnia po zmianie" required={hasDailyCost} />
                          </div>
                          <div>
                              <label htmlFor="dailyCostAmount" className="block text-sm font-medium text-text-secondary">Kwota (PLN)</label>
                              <input id="dailyCostAmount" type="number" value={dailyCostAmount} onChange={(e) => setDailyCostAmount(e.target.value)} className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm p-2" placeholder="np. 20" step="0.01" required={hasDailyCost} />
                          </div>
                      </div>
                  )}
              </div>
               <div className="space-y-4 border-t border-gray-light pt-4">
                  <label className="flex items-center">
                      <input type="checkbox" checked={hasDailyTime} onChange={(e) => setHasDailyTime(e.target.checked)} className="form-checkbox h-4 w-4 text-brand-primary bg-gray-light border-gray-light rounded focus:ring-brand-primary"/>
                      <span className="ml-2 text-text-main">Dodatkowy czas pracy (np. tankowanie)</span>
                  </label>
                  {hasDailyTime && (
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label htmlFor="dailyTimeDesc" className="block text-sm font-medium text-text-secondary">Opis</label>
                              <input id="dailyTimeDesc" type="text" value={dailyTimeDesc} onChange={(e) => setDailyTimeDesc(e.target.value)} className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm p-2" placeholder="np. Tankowanie" required={hasDailyTime} />
                          </div>
                          <div>
                              <label htmlFor="dailyTimeMinutes" className="block text-sm font-medium text-text-secondary">Czas (minuty)</label>
                              <input id="dailyTimeMinutes" type="number" value={dailyTimeMinutes} onChange={(e) => setDailyTimeMinutes(e.target.value)} className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm p-2" placeholder="np. 20" step="1" required={hasDailyTime} />
                          </div>
                      </div>
                  )}
              </div>
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-light text-text-main font-semibold hover:bg-gray-very-light/50 transition-colors">
              Anuluj
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors">
              Zapisz
            </button>
          </div>
        </form>
         {isPolicyFormVisible && (
            <InsuranceForm 
                policy={editingPolicy}
                onSave={handleSavePolicy}
                onClose={() => setIsPolicyFormVisible(false)}
            />
        )}
      </div>
    </div>
  );
};