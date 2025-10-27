import React, { useState } from 'react';
import { DaySummary } from '../types';
import { CarIcon, ReceiptIcon } from './icons';
import { formatDuration } from '../utils/analytics';

const Stat: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <div className="text-center">
    <p className="text-sm text-text-secondary">{label}</p>
    <p className={`text-lg font-bold ${className || 'text-text-main'}`}>{value}</p>
  </div>
);

export const DaySummaryCard: React.FC<{ summary: DaySummary; }> = ({ summary }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const summaryDate = new Date(summary.date);
  
  const adjustedDate = new Date(summaryDate.getTime() + summaryDate.getTimezoneOffset() * 60000);

  return (
    <div className="bg-gray-medium rounded-lg shadow-lg transition-all duration-300">
      <div 
        className="p-4 flex flex-col sm:flex-row justify-between items-center cursor-pointer hover:bg-gray-light/50 rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0">
          <p className="font-semibold text-text-main">
            {adjustedDate.toLocaleDateString('pl-PL', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
           <p className="text-xs text-text-secondary">
             Czas pracy z uwzględnieniem dodatkowych czynności
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
            <Stat label="Zysk netto" value={`${summary.netProfit.toFixed(2)} zł`} className={summary.netProfit > 0 ? 'text-brand-profit' : 'text-brand-cost'}/>
            <Stat label="Zysk/h" value={`${summary.profitPerHour.toFixed(2)} zł`} />
            <Stat label="Czas pracy" value={formatDuration(summary.workDuration)} />
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-light/50 p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-gray-dark/50 rounded-md">
                <Stat label="Przychód" value={`${summary.totalRevenue.toFixed(2)} zł`} className="text-brand-primary" />
                <Stat label="Koszty" value={`${summary.totalCosts.toFixed(2)} zł`} className="text-brand-cost" />
                <Stat label="Kursy" value={summary.tripCount.toString()} />
                <Stat label="Dystans" value={`${summary.totalDistance.toFixed(1)} km`} />
            </div>

            {summary.trips.length > 0 && (
                <div>
                    <h4 className="font-semibold text-sm mb-2 text-text-secondary">Kursy w tym dniu:</h4>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {summary.trips.map(trip => (
                            <li key={trip.id} className="flex justify-between items-center bg-gray-light p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <CarIcon className="w-4 h-4 text-brand-primary"/>
                                    <span className="text-xs">{new Date(trip.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="text-xs font-bold">{trip.platform}</span>
                                </div>
                                <span className="text-sm font-semibold">{trip.fare.toFixed(2)} zł</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {(summary.incidentalCosts.length > 0 || summary.appliedDailyCost || (summary.appliedRentalCost && summary.appliedRentalCost > 0)) && (
                 <div>
                    <h4 className="font-semibold text-sm mb-2 text-text-secondary">Koszty w tym dniu:</h4>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {summary.appliedRentalCost && summary.appliedRentalCost > 0 && (
                             <li className="flex justify-between items-center bg-gray-light p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <ReceiptIcon className="w-4 h-4 text-brand-cost"/>
                                    <span className="text-xs">Najem auta (proporcjonalnie)</span>
                                </div>
                                <span className="text-sm font-semibold">{summary.appliedRentalCost.toFixed(2)} zł</span>
                            </li>
                        )}
                        {summary.appliedDailyCost && (
                             <li className="flex justify-between items-center bg-gray-light p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <ReceiptIcon className="w-4 h-4 text-brand-cost"/>
                                    <span className="text-xs">{summary.appliedDailyCost.description} (automatyczny)</span>
                                </div>
                                <span className="text-sm font-semibold">{summary.appliedDailyCost.amount.toFixed(2)} zł</span>
                            </li>
                        )}
                        {summary.incidentalCosts.map(cost => (
                            <li key={cost.id} className="flex justify-between items-center bg-gray-light p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <ReceiptIcon className="w-4 h-4 text-brand-cost"/>
                                    <span className="text-xs">{cost.category}</span>
                                </div>
                                <span className="text-sm font-semibold">{cost.amount.toFixed(2)} zł</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};