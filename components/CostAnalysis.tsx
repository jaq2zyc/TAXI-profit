import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DaySummary } from '../types';
import { getCostsByCategory } from '../utils/analytics';

interface CostAnalysisProps {
  daySummaries: DaySummary[];
}

const BASE_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#6366F1', '#6B7280', '#EC4899', '#8B5CF6'];

const generateColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(BASE_COLORS[i % BASE_COLORS.length]);
  }
  return colors;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (!percent || percent < 0.05) return null; // Hide label for small slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const CostAnalysis: React.FC<CostAnalysisProps> = ({ daySummaries }) => {
  const data = getCostsByCategory(daySummaries);
  const colors = generateColors(data.length);

  if (data.length === 0) {
    return (
        <div className="bg-gray-medium p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-text-main mb-4">Podział Kosztów</h3>
            <div className="flex items-center justify-center h-[300px] text-center text-text-secondary">
                <p>Dodaj lub zaimportuj dane, aby zobaczyć analizę kosztów.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-medium p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-text-main mb-4">Podział Kosztów</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={110}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} stroke={colors[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                borderColor: '#4B5563',
                color: '#F9FAFB',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(2)} zł`, name]}
            />
            <Legend iconSize={10} wrapperStyle={{fontSize: '14px', paddingTop: '10px'}}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};