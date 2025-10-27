import React from 'react';
import { DaySummary } from '../types';
import { EmptyState } from './EmptyState';
import { DaySummaryCard } from './DaySummaryCard';

interface DailySummaryListProps {
  daySummaries: DaySummary[];
}

export const DailySummaryList: React.FC<DailySummaryListProps> = ({ daySummaries }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-main px-1">Podsumowanie Dzienne</h2>
      {daySummaries.length > 0 ? (
        daySummaries.map(summary => (
          <DaySummaryCard key={summary.id} summary={summary} />
        ))
      ) : (
        <EmptyState
          title="Brak podsumowań"
          message="Zaimportuj raport z kursami, aby zobaczyć dzienne podsumowania."
        />
      )}
    </div>
  );
};