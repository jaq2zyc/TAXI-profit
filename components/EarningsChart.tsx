import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label } from 'recharts';
import { Trip } from '../types';
import { getEarningsPerDayOfWeek } from '../utils/analytics';

interface EarningsChartProps {
  trips: Trip[];
}

// Custom Tooltip for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-dark p-3 rounded-lg border border-gray-light shadow-2xl">
        <p className="text-sm font-bold text-text-secondary">{label}</p>
        <p className="text-lg font-bold text-brand-primary">{`Zarobki: ${payload[0].value.toFixed(2)} zł`}</p>
      </div>
    );
  }
  return null;
};


export const EarningsChart: React.FC<EarningsChartProps> = ({ trips }) => {
  const data = getEarningsPerDayOfWeek(trips);
  const maxEarnings = Math.max(...data.map(d => d.zarobki));

  return (
    <div className="bg-gray-medium p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-text-main mb-4">Zarobki w Tygodniu</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#D1D5DB', fontSize: 12 }}>
               <Label value="Dzień Tygodnia" offset={-15} position="insideBottom" fill="#9CA3AF" fontSize={14} />
            </XAxis>
            <YAxis stroke="#9CA3AF" unit="zł" tick={{ fill: '#D1D5DB', fontSize: 12 }}>
                <Label value="Zarobki (PLN)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#9CA3AF', fontSize: 14 }} />
            </YAxis>
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="zarobki" name="Zarobki" fill="#10B981" unit="zł" radius={[4, 4, 0, 0]}>
                {
                    data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.zarobki === maxEarnings && maxEarnings > 0 ? "#34D399" : "#10B981"} />
                    ))
                }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
