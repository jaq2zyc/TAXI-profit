export type Platform = 'Uber' | 'Bolt';

export interface Trip {
  id: string;
  platform: Platform;
  distance: number; // in kilometers
  fare: number; // in PLN
  startTime: string; // ISO string
  endTime: string; // ISO string
  partnerId: string | null;
  pickupAddress?: string;
  paymentMethod?: string;
  lat?: number;
  lng?: number;
}

export type CostCategory = 'Paliwo' | 'Myjnia' | 'Ubezpieczenie' | 'Serwis' | 'Inne';

export interface Cost {
  id: string;
  amount: number; // in PLN
  date: string; // ISO string
  category: CostCategory;
  description?: string;
}

export interface FixedCost {
  id: string;
  description: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  startDate: string;
}

export interface PercentageCost {
  id: string;
  description: string;
  percentage: number;
}

export interface InsurancePolicy {
  id: string;
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
}

export type CarConfig = 
  | {
      type: 'own';
      model?: string;
      avgFuelConsumption: number;
      fuelPrice: number;
      deadheadMileagePercent: number;
      insurancePolicies: InsurancePolicy[];
    }
  | {
      type: 'rental';
      rentalCost: FixedCost | null;
      fuelCoveredBy: 'partner' | 'driver';
      avgFuelConsumption?: number;
      fuelPrice?: number;
    };

export interface DailyRecurringCost {
    id: string;
    description: string;
    amount: number;
}

export interface DailyRecurringTime {
    id: string;
    description: string;
    minutes: number;
}

export interface Partner {
  id: string;
  name: string;
  isCustom?: boolean;
  commission: PercentageCost | null;
  carConfig: CarConfig;
  dailyRecurringCost: DailyRecurringCost | null;
  dailyRecurringTime: DailyRecurringTime | null;
}

export interface DaySummary {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  workDuration: number; // in ms
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitPerHour: number;
  tripCount: number;
  totalDistance: number;
  trips: Trip[];
  incidentalCosts: Cost[];
  partner: Partner | null;
  appliedDailyCost: DailyRecurringCost | null;
  appliedRentalCost?: number;
}

export interface AppSettings {
  selectedPartnerId: string | null;
  customPartners: Partner[];
  hasSeenWelcomeModal?: boolean;
}

export interface HistoryItem {
  id: string;
  date: string; // ISO string
  type: 'trips' | 'cost';

  // For 'trips'
  fileName?: string;
  platform?: Platform;
  tripCount?: number;

  // For 'cost'
  amount?: number;
  description?: string; 

  relatedIds: string[]; // tripIds for 'trips', a single costId in an array for 'cost'
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}