import { Trip, Cost, Partner, DaySummary } from './types';
import { startOfDay, subDays, eachDayOfInterval, endOfToday, startOfToday, endOfDay, startOfYesterday, endOfYesterday, isAfter, differenceInDays } from 'date-fns';

const getProratedFixedCostsForDay = (
  partner: Partner | null,
  day: Date
): number => {
  let dailyFixedCost = 0;
  if (!partner) return 0;

  const { carConfig } = partner;
  const dayStart = startOfDay(day);

  // Handle car rental - ONLY MONTHLY. Weekly is handled separately.
  if (carConfig.type === 'rental' && carConfig.rentalCost && carConfig.rentalCost.frequency === 'monthly') {
    const rentalStart = startOfDay(new Date(carConfig.rentalCost.startDate));
    if (dayStart >= rentalStart) {
      const dailyRate = carConfig.rentalCost.amount / 30; // Assuming 30 days for simplicity
      dailyFixedCost += dailyRate;
    }
  }

  // Handle own car insurance policies
  if (carConfig.type === 'own' && carConfig.insurancePolicies) {
    carConfig.insurancePolicies.forEach(policy => {
      const policyStart = startOfDay(new Date(policy.startDate));
      const policyEnd = endOfDay(new Date(policy.endDate));
      
      if (dayStart >= policyStart && dayStart <= policyEnd) {
        const policyDurationDays = differenceInDays(policyEnd, policyStart) + 1;
        if (policyDurationDays > 0) {
          const dailyRate = policy.amount / policyDurationDays;
          dailyFixedCost += dailyRate;
        }
      }
    });
  }

  return dailyFixedCost;
};


export const calculateDayAnalytics = (
  dayString: string,
  dayTrips: Trip[],
  dayIncidentalCosts: Cost[],
  partner: Partner | null,
  weeklyRentalCost: number = 0
) => {
  let relevantIncidentalCosts = dayIncidentalCosts;
  
  const partnerCoversFuel = partner?.carConfig.type === 'rental' && partner.carConfig.fuelCoveredBy === 'partner';
  
  const totalRevenue = dayTrips.reduce((sum, trip) => sum + trip.fare, 0);
  const totalDistance = dayTrips.reduce((sum, trip) => sum + trip.distance, 0);

  const incidentalCostsAmount = relevantIncidentalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  
  const dayDate = new Date(dayString);

  const fixedCostsAmount = getProratedFixedCostsForDay(partner, dayDate);
  
  const percentageCosts = partner?.commission ? [partner.commission] : [];
  const percentageCostsAmount = percentageCosts.reduce((sum, cost) => {
    return sum + (totalRevenue * (cost.percentage / 100));
  }, 0);
  
  const dailyRecurringCostAmount = (dayTrips.length > 0 && partner?.dailyRecurringCost) ? partner.dailyRecurringCost.amount : 0;

  const totalCosts = incidentalCostsAmount + fixedCostsAmount + percentageCostsAmount + dailyRecurringCostAmount + weeklyRentalCost;
  const netProfit = totalRevenue - totalCosts;

  return {
    totalRevenue,
    totalDistance,
    tripCount: dayTrips.length,
    totalCosts,
    netProfit,
    incidentalCosts: dayIncidentalCosts, // Return all incidental costs for details view
    appliedRentalCost: weeklyRentalCost,
  };
};

export const calculateAggregatedAnalytics = (daySummaries: DaySummary[]) => {
  const allTimeMetrics = daySummaries.reduce((acc, day) => {
    acc.totalRevenue += day.totalRevenue;
    acc.totalCosts += day.totalCosts;
    acc.netProfit += day.netProfit;
    acc.totalWorkTimeMs += day.workDuration;
    return acc;
  }, { totalRevenue: 0, totalCosts: 0, netProfit: 0, totalWorkTimeMs: 0 });

  const profitPerHour = allTimeMetrics.totalWorkTimeMs > 0 ? (allTimeMetrics.netProfit / (allTimeMetrics.totalWorkTimeMs / 3600000)) : 0;

  const getMetricsForPeriod = (start: Date, end: Date) => {
    return daySummaries
      .filter(s => {
          const dayDate = new Date(s.date);
          const dayStart = startOfDay(dayDate);
          return dayStart >= start && dayStart <= end;
      })
      .reduce((acc, day) => {
        acc.revenue += day.totalRevenue;
        acc.costs += day.totalCosts;
        acc.profit += day.netProfit;
        return acc;
      }, { revenue: 0, costs: 0, profit: 0 });
  };
  
  const todayMetrics = getMetricsForPeriod(startOfToday(), endOfToday());
  const yesterdayMetrics = getMetricsForPeriod(startOfYesterday(), endOfYesterday());
  
  const calculateComparison = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    if (current === 0 && previous > 0) return -100;
    return ((current - previous) / previous) * 100;
  };

  const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
  const dateInterval = eachDayOfInterval({ start: sevenDaysAgo, end: endOfToday() });

  const generateSparklineData = (itemSelector: (metrics: ReturnType<typeof getMetricsForPeriod>) => number) => {
    return dateInterval.map(day => {
      const dayMetrics = getMetricsForPeriod(startOfDay(day), endOfDay(day));
      return itemSelector(dayMetrics);
    });
  };

  return {
    totalRevenue: allTimeMetrics.totalRevenue,
    totalCosts: allTimeMetrics.totalCosts,
    netProfit: allTimeMetrics.netProfit,
    totalWorkTimeMs: allTimeMetrics.totalWorkTimeMs,
    profitPerHour: profitPerHour,
    revenueComparison: calculateComparison(todayMetrics.revenue, yesterdayMetrics.revenue),
    costsComparison: calculateComparison(todayMetrics.costs, yesterdayMetrics.costs),
    profitComparison: calculateComparison(todayMetrics.profit, yesterdayMetrics.profit),
    revenueSparkline: generateSparklineData(m => m.revenue),
    costsSparkline: generateSparklineData(m => m.costs),
    profitSparkline: generateSparklineData(m => m.profit),
  };
};

export const calculateHourlyProfitability = (daySummaries: DaySummary[]) => {
  const profitMatrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
  const hoursMatrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
  
  daySummaries.forEach(day => {
    const partner = day.partner;
    day.trips.forEach(trip => {
      const start = new Date(trip.startTime);
      const end = new Date(trip.endTime);
      const durationHours = (end.getTime() - start.getTime()) / 3600000;
      if (durationHours <= 0) return;

      let tripPartnerCost = 0;
      if (partner?.commission) {
        tripPartnerCost = trip.fare * (partner.commission.percentage / 100);
      }
      
      const netProfit = trip.fare - tripPartnerCost;

      const dayOfWeek = start.getUTCDay(); // Sunday = 0
      const hour = start.getUTCHours();

      profitMatrix[dayOfWeek][hour] += netProfit;
      hoursMatrix[dayOfWeek][hour] += durationHours;
    });
  });

  const profitabilityMatrix: (number | null)[][] = Array(7).fill(0).map(() => Array(24).fill(null));

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (hoursMatrix[d][h] > 0) {
        profitabilityMatrix[d][h] = profitMatrix[d][h] / hoursMatrix[d][h];
      }
    }
  }
  return profitabilityMatrix;
};


export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return "0h 0m";
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const getEarningsPerDayOfWeek = (trips: Trip[]): { name: string; zarobki: number }[] => {
  const earningsByDay: { [key: string]: number } = {
    'Niedz.': 0, 'Pon.': 0, 'Wt.': 0, 'Śr.': 0, 'Czw.': 0, 'Pt.': 0, 'Sob.': 0,
  };
  const dayLabels = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];

  trips.forEach(trip => {
    const dayIndex = new Date(trip.startTime).getUTCDay();
    const dayName = dayLabels[dayIndex];
    earningsByDay[dayName] += trip.fare;
  });

  return dayLabels.map(name => ({ name, zarobki: earningsByDay[name] }));
};

export const getCostsByCategory = (daySummaries: DaySummary[]) => {
    const costsByCategory: { [key: string]: number } = {};

    let allIncidentalCosts: Cost[] = [];
    daySummaries.forEach(day => {
        allIncidentalCosts = [...allIncidentalCosts, ...day.incidentalCosts];
    });

    allIncidentalCosts.forEach(cost => {
        costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.amount;
    });

    if (daySummaries.length > 0) {
        const fixedCostsByDesc: { [key: string]: number } = {};
        const percentageCostsByDesc: { [key: string]: number } = {};
        const dailyRecurringCostsByDesc: { [key: string]: number } = {};
        const rentalCostsByDesc: { [key: string]: number } = {};

        daySummaries.forEach(day => {
            const dayDate = new Date(day.date);
            
            const fixedCost = getProratedFixedCostsForDay(day.partner, dayDate);
            
            if (fixedCost > 0) {
              if (day.partner?.carConfig.type === 'rental' && day.partner.carConfig.rentalCost) {
                  const desc = day.partner.carConfig.rentalCost.description;
                  fixedCostsByDesc[desc] = (fixedCostsByDesc[desc] || 0) + fixedCost;
              } else if (day.partner?.carConfig.type === 'own') {
                  day.partner.carConfig.insurancePolicies.forEach(policy => {
                     const policyStart = startOfDay(new Date(policy.startDate));
                     const policyEnd = endOfDay(new Date(policy.endDate));
                     const policyDurationDays = differenceInDays(policyEnd, policyStart) + 1;
                     if(policyDurationDays > 0) {
                         const dailyRate = policy.amount / policyDurationDays;
                         if (dayDate >= policyStart && dayDate <= policyEnd) {
                            fixedCostsByDesc[policy.description] = (fixedCostsByDesc[policy.description] || 0) + dailyRate;
                         }
                     }
                  });
              }
            }

            if (day.partner?.commission) {
                const desc = day.partner.commission.description;
                const percentageAmount = day.totalRevenue * (day.partner.commission.percentage / 100);
                percentageCostsByDesc[desc] = (percentageCostsByDesc[desc] || 0) + percentageAmount;
            }

            if (day.appliedDailyCost) {
                const desc = day.appliedDailyCost.description;
                dailyRecurringCostsByDesc[desc] = (dailyRecurringCostsByDesc[desc] || 0) + day.appliedDailyCost.amount;
            }

            if (day.appliedRentalCost && day.appliedRentalCost > 0 && day.partner?.carConfig.type === 'rental' && day.partner.carConfig.rentalCost) {
                const desc = day.partner.carConfig.rentalCost.description;
                rentalCostsByDesc[desc] = (rentalCostsByDesc[desc] || 0) + day.appliedRentalCost;
            }
        });
        
        Object.entries(fixedCostsByDesc).forEach(([desc, amount]) => {
            costsByCategory[desc] = (costsByCategory[desc] || 0) + amount;
        });
        Object.entries(percentageCostsByDesc).forEach(([desc, amount]) => {
            costsByCategory[desc] = (costsByCategory[desc] || 0) + amount;
        });
        Object.entries(dailyRecurringCostsByDesc).forEach(([desc, amount]) => {
            costsByCategory[desc] = (costsByCategory[desc] || 0) + amount;
        });
        Object.entries(rentalCostsByDesc).forEach(([desc, amount]) => {
            costsByCategory[desc] = (costsByCategory[desc] || 0) + amount;
        });
    }

    return Object.entries(costsByCategory)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
};