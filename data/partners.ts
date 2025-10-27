import { Partner } from '../types';

export const predefinedPartners: Partner[] = [
  {
    id: 'own_car_default',
    name: 'Własne Auto',
    isCustom: false,
    commission: null,
    carConfig: {
      type: 'own',
      model: 'Toyota Prius',
      avgFuelConsumption: 5.5,
      fuelPrice: 6.85,
      deadheadMileagePercent: 15,
      insurancePolicies: [],
    },
    dailyRecurringCost: null,
    dailyRecurringTime: null,
  },
  {
    id: 'partner_a_commission',
    name: 'Partner A (prowizja 50%)',
    isCustom: false,
    commission: {
      id: 'partner_a_commission_id',
      description: 'Prowizja 50%',
      percentage: 50,
    },
    carConfig: {
      type: 'rental',
      rentalCost: {
        id: 'partner_a_rental_id',
        description: 'Najem auta (w cenie prowizji)',
        amount: 0,
        frequency: 'weekly',
        startDate: '2000-01-01',
      },
      fuelCoveredBy: 'partner',
    },
    dailyRecurringCost: null,
    dailyRecurringTime: null,
  },
  {
    id: 'partner_b_rental',
    name: 'Partner B (najem auta)',
    isCustom: false,
    commission: null,
    carConfig: {
      type: 'rental',
      rentalCost: {
        id: 'partner_b_rental_id',
        description: 'Tygodniowy najem auta',
        amount: 600,
        frequency: 'weekly',
        startDate: '2000-01-01',
      },
      fuelCoveredBy: 'driver',
      avgFuelConsumption: 8.0,
      fuelPrice: 6.85,
    },
    dailyRecurringCost: null,
    dailyRecurringTime: null,
  },
];
