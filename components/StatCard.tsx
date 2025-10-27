import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'default' | 'hero';
  comparison?: {
    value: number;
    label: string;
  };
  sparklineData?: number[];
}

const ComparisonIndicator: React.FC<{ value: number, label: string }> = ({ value, label }) => {
    const isPositive = value >= 0;
    const colorClass = isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10';
    const sign = isPositive ? '▲' : '▼';

    if (isNaN(value) || !isFinite(value)) return null;

    return (
        <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${colorClass}`}>
            <span>{sign} {Math.abs(value).toFixed(1)}%</span>
            <span className="ml-1.5 hidden md:inline">{label}</span>
        </div>
    );
};

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  variant = 'default',
  comparison,
  sparklineData
}) => {
    
  if (variant === 'hero') {
    return (
      <div className="bg-gradient-to-br from-brand-primary/30 to-gray-medium p-6 rounded-xl shadow-2xl flex flex-col justify-between h-full border border-brand-primary/50">
        <div>
          <div className="flex items-center gap-4">
             <div className="bg-gray-dark p-3 rounded-full">
                {icon}
            </div>
            <p className="text-lg text-text-secondary font-medium">{title}</p>
          </div>
          <p className="text-5xl font-bold text-text-main mt-4">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-medium p-4 rounded-xl shadow-lg flex flex-col justify-between h-full transition-all duration-200 hover:shadow-xl hover:bg-gray-light`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <div className="bg-gray-light p-3 rounded-full">
                {icon}
            </div>
            <p className="text-md text-text-secondary font-medium">{title}</p>
        </div>
        {comparison && <ComparisonIndicator value={comparison.value} label={comparison.label} />}
      </div>
      <div className="flex justify-between items-end mt-4">
        <p className="text-3xl font-bold text-text-main">{value}</p>
        {sparklineData && sparklineData.length > 1 && (
            <div className="w-24 h-10 -mb-2 -mr-2">
                <ResponsiveContainer>
                    <LineChart data={sparklineData.map(v => ({ value: v }))}>
                        <YAxis domain={['dataMin', 'dataMax']} hide/>
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={comparison && comparison.value >= 0 ? "#22C55E" : "#EF4444"} 
                            strokeWidth={2} 
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        )}
      </div>
    </div>
  );
};