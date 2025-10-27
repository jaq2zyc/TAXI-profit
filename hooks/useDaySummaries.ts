import { useMemo } from 'react';
import { Trip, Cost, Partner, DaySummary } from '../types';
import { startOfDay, startOfWeek } from 'date-fns';
import { calculateDayAnalytics } from '../utils/analytics';

export const useDaySummaries = (
  trips: Trip[],
  incidentalCosts: Cost[],
  allPartners: Partner[],
): DaySummary[] => {
  return useMemo(() => {
    const findPartnerById = (id: string | null): Partner | null => {
      if (!id) return allPartners.find(p => p.id === 'own_car_default') || null;
      return allPartners.find(p => p.id === id) || null;
    }

    const activityByDay: { [key: string]: { trips: Trip[], costs: Cost[] } } = {};

    trips.forEach(trip => {
      const day = startOfDay(new Date(trip.startTime)).toISOString().split('T')[0];
      if (!activityByDay[day]) activityByDay[day] = { trips: [], costs: [] };
      activityByDay[day].trips.push(trip);
    });

    incidentalCosts.forEach(cost => {
      const day = startOfDay(new Date(cost.date)).toISOString().split('T')[0];
      if (!activityByDay[day]) activityByDay[day] = { trips: [], costs: [] };
      activityByDay[day].costs.push(cost);
    });
    
    // --- NEW: Estimate daily fuel cost if not manually added ---
    Object.keys(activityByDay).forEach(day => {
        const dayActivity = activityByDay[day];
        const hasTrips = dayActivity.trips.length > 0;
        
        if (hasTrips) {
            const hasManualFuelCost = dayActivity.costs.some(c => c.category === 'Paliwo');
            if (!hasManualFuelCost) {
                const partnerForDay = findPartnerById(dayActivity.trips[0].partnerId);
                let fuelConfig: { consumption: number; price: number } | null = null;

                if (partnerForDay) {
                    const { carConfig } = partnerForDay;
                    if (carConfig.type === 'own' && carConfig.avgFuelConsumption > 0 && carConfig.fuelPrice > 0) {
                        fuelConfig = {
                            consumption: carConfig.avgFuelConsumption,
                            price: carConfig.fuelPrice,
                        };
                    } else if (carConfig.type === 'rental' && carConfig.fuelCoveredBy === 'driver' && carConfig.avgFuelConsumption && carConfig.fuelPrice && carConfig.avgFuelConsumption > 0 && carConfig.fuelPrice > 0) {
                        fuelConfig = {
                            consumption: carConfig.avgFuelConsumption,
                            price: carConfig.fuelPrice,
                        };
                    }
                }

                if (fuelConfig) {
                    const estimatedDailyDistance = 300; // As requested
                    const fuelConsumed = (estimatedDailyDistance / 100) * fuelConfig.consumption;
                    const costAmount = fuelConsumed * fuelConfig.price;
                    
                    const estimatedFuelCost: Cost = {
                        id: `estimated_fuel_${day}`,
                        amount: costAmount,
                        date: new Date(day).toISOString(),
                        category: 'Paliwo',
                        description: `Szacunkowe paliwo (przebieg ${estimatedDailyDistance} km)`,
                    };
                    
                    dayActivity.costs.push(estimatedFuelCost);
                }
            }
        }
    });

    // --- RENTAL COST LOGIC ---
    const weeklyRentalCostPortions = new Map<string, number>();

    const activityByWeek = new Map<string, { partnerId: string, day: string }[]>();

    Object.keys(activityByDay).forEach(dayString => {
        const dayTrips = activityByDay[dayString].trips;
        if (dayTrips.length > 0) {
            const partnerId = dayTrips[0].partnerId;
            if (partnerId) {
                const weekStartString = startOfWeek(new Date(dayString), { weekStartsOn: 1 }).toISOString().split('T')[0];
                if (!activityByWeek.has(weekStartString)) {
                    activityByWeek.set(weekStartString, []);
                }
                activityByWeek.get(weekStartString)!.push({ partnerId, day: dayString });
            }
        }
    });

    activityByWeek.forEach((activities, weekStartString) => {
        const partnersInWeek = new Map<string, string[]>();
        activities.forEach(activity => {
            if (!partnersInWeek.has(activity.partnerId)) {
                partnersInWeek.set(activity.partnerId, []);
            }
            if (!partnersInWeek.get(activity.partnerId)!.includes(activity.day)) {
                partnersInWeek.get(activity.partnerId)!.push(activity.day);
            }
        });
        
        partnersInWeek.forEach((activeDays, partnerId) => {
            const partner = findPartnerById(partnerId);
            if (partner?.carConfig.type === 'rental' && partner.carConfig.rentalCost?.frequency === 'weekly') {
                const rentalCost = partner.carConfig.rentalCost;
                const rentalStartDate = startOfDay(new Date(rentalCost.startDate));
                const weekStartDate = new Date(weekStartString);

                if (weekStartDate >= rentalStartDate) {
                    const numActiveDays = activeDays.length;
                    if (numActiveDays > 0) {
                        const dailyPortion = rentalCost.amount / numActiveDays;
                        activeDays.forEach(dayString => {
                            const existingPortion = weeklyRentalCostPortions.get(dayString) || 0;
                            weeklyRentalCostPortions.set(dayString, existingPortion + dailyPortion);
                        });
                    }
                }
            }
        });
    });

    const daySummaries: DaySummary[] = Object.keys(activityByDay).map(day => {
      const { trips: dayTrips, costs: dayCosts } = activityByDay[day];
      
      const partnerForDay = dayTrips.length > 0 ? findPartnerById(dayTrips[0]?.partnerId) : findPartnerById(null);

      dayTrips.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      const workDurationFromTrips = dayTrips.length > 0 ? 
        (new Date(dayTrips[dayTrips.length - 1].endTime).getTime() - new Date(dayTrips[0].startTime).getTime()) : 0;

      const dailyRecurringTime = (dayTrips.length > 0 && partnerForDay?.dailyRecurringTime) 
          ? partnerForDay.dailyRecurringTime.minutes * 60000 
          : 0;

      const totalWorkDuration = workDurationFromTrips + dailyRecurringTime;

      const rentalCostForDay = weeklyRentalCostPortions.get(day) || 0;
      
      const analytics = calculateDayAnalytics(day, dayTrips, dayCosts, partnerForDay, rentalCostForDay);

      const profitPerHour = totalWorkDuration > 0 ? (analytics.netProfit / (totalWorkDuration / 3600000)) : 0;
      
      const appliedDailyCost = (dayTrips.length > 0 && partnerForDay?.dailyRecurringCost) ? partnerForDay.dailyRecurringCost : null;
      
      return {
        id: day,
        date: day,
        workDuration: totalWorkDuration,
        totalRevenue: analytics.totalRevenue,
        totalCosts: analytics.totalCosts,
        netProfit: analytics.netProfit,
        profitPerHour: profitPerHour,
        tripCount: dayTrips.length,
        totalDistance: analytics.totalDistance,
        trips: dayTrips,
        incidentalCosts: analytics.incidentalCosts,
        partner: partnerForDay,
        appliedDailyCost: appliedDailyCost,
        appliedRentalCost: analytics.appliedRentalCost,
      };
    });

    return daySummaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trips, incidentalCosts, allPartners]);
};