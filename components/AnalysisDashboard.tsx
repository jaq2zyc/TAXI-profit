import React, { useState, useEffect, useMemo } from 'react';
import { Trip, DaySummary } from '../types';
import { calculateHourlyProfitability } from '../utils/analytics';
import { getDistrictFromAddress } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { EarningsHeatmap } from './EarningsHeatmap';
import { useGeocodedTrips } from '../hooks/useGeocodedTrips';
import { MapIcon } from './icons';

// --- Helper Components ---

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
    </div>
);

const EmptyAnalysisState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-48 text-center text-text-secondary">
        <p>{message}</p>
    </div>
);

// --- TimeAnalysisView Component ---

type HeatmapMetric = 'profitPerHour' | 'tripCount' | 'avgFare';

const TimeAnalysisView: React.FC<{ daySummaries: DaySummary[] }> = ({ daySummaries }) => {
    const [metric, setMetric] = useState<HeatmapMetric>('profitPerHour');

    const heatmapData = useMemo(() => {
        const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
        const countMatrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
        
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

                const dayOfWeek = start.getUTCDay();
                const hour = start.getUTCHours();

                if (metric === 'profitPerHour') {
                    matrix[dayOfWeek][hour] += netProfit;
                    countMatrix[dayOfWeek][hour] += durationHours;
                } else if (metric === 'tripCount') {
                    matrix[dayOfWeek][hour] += 1;
                } else if (metric === 'avgFare') {
                    matrix[dayOfWeek][hour] += trip.fare;
                    countMatrix[dayOfWeek][hour] += 1;
                }
            });
        });

        const resultMatrix: (number | null)[][] = Array(7).fill(0).map(() => Array(24).fill(null));
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                if (metric === 'profitPerHour' && countMatrix[d][h] > 0) {
                    resultMatrix[d][h] = matrix[d][h] / countMatrix[d][h];
                } else if (metric === 'tripCount' && matrix[d][h] > 0) {
                    resultMatrix[d][h] = matrix[d][h];
                } else if (metric === 'avgFare' && countMatrix[d][h] > 0) {
                    resultMatrix[d][h] = matrix[d][h] / countMatrix[d][h];
                }
            }
        }
        return resultMatrix;
    }, [daySummaries, metric]);

    const heatmapValues = heatmapData.flat().filter(v => v !== null && isFinite(v)) as number[];
    const minValue = heatmapValues.length > 0 ? Math.min(...heatmapValues) : 0;
    const maxValue = heatmapValues.length > 0 ? Math.max(...heatmapValues) : 0;

    const getColor = (value: number | null) => {
        if (value === null) return 'bg-gray-light/20';
        if (metric === 'profitPerHour' && value <= 0) return 'bg-red-500/30';
        if (maxValue - minValue === 0) return 'bg-green-500/60';
        
        const percentage = (value - minValue) / (maxValue - minValue);
        if (percentage < 0.33) return 'bg-yellow-500/50';
        if (percentage < 0.66) return 'bg-green-500/60';
        return 'bg-green-500/90';
    };
    
    const metricLabels: Record<HeatmapMetric, { title: string, unit: string }> = {
        profitPerHour: { title: "Mapa Cieplna Rentowności (Zysk/h)", unit: "zł/h" },
        tripCount: { title: "Mapa Cieplna Ilości Kursów", unit: "kursów" },
        avgFare: { title: "Mapa Cieplna Średniej Wartości Kursu", unit: "zł" },
    };

    return (
        <div className="bg-gray-medium p-4 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-lg font-bold text-text-main">{metricLabels[metric].title}</h3>
                <div className="flex items-center bg-gray-light rounded-lg p-1 self-start">
                    {(Object.keys(metricLabels) as HeatmapMetric[]).map(key => (
                        <button key={key} onClick={() => setMetric(key)} className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${metric === key ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-gray-very-light/10'}`}>
                           {metricLabels[key].unit}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto p-1">
                <div className="grid grid-cols-[auto_repeat(24,minmax(0,1fr))] gap-1 text-xs min-w-[700px]">
                    <div />
                    {Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`).map(hour => <div key={hour} className="text-center text-gray-400 text-[10px] transform -rotate-45 h-8 flex items-end justify-center">{hour}</div>)}
                    {['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'].map((day, dayIndex) => (
                        <React.Fragment key={day}>
                            <div className="font-bold text-gray-300 flex items-center pr-2">{day}</div>
                            {heatmapData[dayIndex].map((value, hourIndex) => (
                                <div 
                                    key={`${day}-${hourIndex}`}
                                    className={`w-full aspect-square rounded ${getColor(value)}`}
                                    title={value !== null ? `${value.toFixed(2)} ${metricLabels[metric].unit}` : 'Brak danych'}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- LocationAnalysisView Component ---

const locationCache = new Map<string, string>();

const LocationAnalysisView: React.FC<{ allTrips: Trip[], daySummaries: DaySummary[] }> = ({ allTrips, daySummaries }) => {
    const [districts, setDistricts] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDistricts = async () => {
            setIsLoading(true);
            const newDistricts: Record<string, string> = {};
            const uniqueAddresses = [...new Set(allTrips.map(t => t.pickupAddress).filter(Boolean) as string[])];
            
            for (const address of uniqueAddresses) {
                if (locationCache.has(address)) {
                    newDistricts[address] = locationCache.get(address)!;
                } else {
                    const district = await getDistrictFromAddress(address);
                    locationCache.set(address, district);
                    newDistricts[address] = district;
                }
            }
            setDistricts(newDistricts);
            setIsLoading(false);
        };

        if (allTrips.length > 0) {
            fetchDistricts();
        } else {
            setIsLoading(false);
        }
    }, [allTrips]);

    const locationData = useMemo(() => {
        if (isLoading || Object.keys(districts).length === 0) return [];

        const dataByDistrict: Record<string, { totalProfit: number; tripCount: number; totalFare: number }> = {};
        
        daySummaries.forEach(day => {
            const partner = day.partner;
            day.trips.forEach(trip => {
                const district = trip.pickupAddress ? districts[trip.pickupAddress] : 'Nieznana';
                if (!district) return;

                if (!dataByDistrict[district]) {
                    dataByDistrict[district] = { totalProfit: 0, tripCount: 0, totalFare: 0 };
                }

                let tripPartnerCost = 0;
                if (partner?.commission) {
                    tripPartnerCost = trip.fare * (partner.commission.percentage / 100);
                }
                const netProfit = trip.fare - tripPartnerCost;

                dataByDistrict[district].totalProfit += netProfit;
                dataByDistrict[district].tripCount += 1;
                dataByDistrict[district].totalFare += trip.fare;
            });
        });

        return Object.entries(dataByDistrict).map(([district, data]) => ({
            district,
            totalProfit: data.totalProfit,
            tripCount: data.tripCount,
            avgProfitPerTrip: data.tripCount > 0 ? data.totalProfit / data.tripCount : 0,
            avgFarePerTrip: data.tripCount > 0 ? data.totalFare / data.tripCount : 0,
        })).sort((a, b) => b.totalProfit - a.totalProfit);

    }, [districts, isLoading, daySummaries]);

    if (isLoading) return <LoadingSpinner />;
    if (locationData.length === 0) return <EmptyAnalysisState message="Brak danych do analizy lokalizacji. Zaimportuj raport z adresami." />;

    return (
        <div className="bg-gray-medium p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-text-main mb-2">Analiza Rentowności wg Dzielnic</h3>
            <p className="text-sm text-text-secondary mb-4">Tabela pokazuje, które lokalizacje startowe przynoszą największy zysk.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-light">
                        <tr>
                            <th className="p-2">Dzielnica</th>
                            <th className="p-2 text-right">Łączny Zysk</th>
                            <th className="p-2 text-right">Kursy</th>
                            <th className="p-2 text-right">Śr. Zysk/Kurs</th>
                            <th className="p-2 text-right">Śr. Przychód/Kurs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locationData.map(item => (
                            <tr key={item.district} className="border-b border-gray-light/50 hover:bg-gray-light/30">
                                <td className="p-2 font-semibold">{item.district}</td>
                                <td className="p-2 text-right font-bold text-brand-profit">{item.totalProfit.toFixed(2)} zł</td>
                                <td className="p-2 text-right">{item.tripCount}</td>
                                <td className="p-2 text-right">{item.avgProfitPerTrip.toFixed(2)} zł</td>
                                <td className="p-2 text-right text-text-secondary">{item.avgFarePerTrip.toFixed(2)} zł</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- PaymentAnalysisView Component ---

const PaymentAnalysisView: React.FC<{ allTrips: Trip[] }> = ({ allTrips }) => {
    const paymentData = useMemo(() => {
        const dataByMethod: Record<string, { totalFare: number, tripCount: number }> = {};
        
        allTrips.forEach(trip => {
            const method = trip.paymentMethod || 'Nieznana';
            if (!dataByMethod[method]) {
                dataByMethod[method] = { totalFare: 0, tripCount: 0 };
            }
            dataByMethod[method].totalFare += trip.fare;
            dataByMethod[method].tripCount += 1;
        });

        return Object.entries(dataByMethod).map(([method, data]) => ({
            method,
            tripCount: data.tripCount,
            avgFare: data.tripCount > 0 ? data.totalFare / data.tripCount : 0,
        })).sort((a,b) => b.tripCount - a.tripCount);
    }, [allTrips]);

    if (paymentData.length === 0 || paymentData.every(d => d.method === 'Nieznana')) {
        return <EmptyAnalysisState message="Brak danych do analizy płatności. Zaimportuj raport z metodami płatności." />;
    }

    return (
        <div className="bg-gray-medium p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-text-main mb-4">Analiza Metod Płatności</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-light">
                        <tr>
                            <th className="p-2">Metoda Płatności</th>
                            <th className="p-2 text-right">Liczba Kursów</th>
                            <th className="p-2 text-right">Śr. Wartość Kursu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentData.map(item => (
                            <tr key={item.method} className="border-b border-gray-light/50 hover:bg-gray-light/30">
                                <td className="p-2 font-semibold">{item.method}</td>
                                <td className="p-2 text-right">{item.tripCount}</td>
                                <td className="p-2 text-right font-bold text-brand-primary">{item.avgFare.toFixed(2)} zł</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main AnalysisDashboard Component ---

type AnalysisView = 'location' | 'time' | 'payment' | 'heatmap';

export const AnalysisDashboard: React.FC<{ allTrips: Trip[], daySummaries: DaySummary[] }> = ({ allTrips, daySummaries }) => {
    const [activeView, setActiveView] = useState<AnalysisView>('location');
    const { geocodedTrips, isLoading: isGeocoding } = useGeocodedTrips(allTrips);

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-light/50 flex space-x-2 flex-wrap">
                <button onClick={() => setActiveView('location')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'location' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Lokalizacja</button>
                <button onClick={() => setActiveView('heatmap')} className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${activeView === 'heatmap' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>
                    <MapIcon className="w-5 h-5"/>
                    Mapa Cieplna
                </button>
                <button onClick={() => setActiveView('time')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'time' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Czas</button>
                <button onClick={() => setActiveView('payment')} className={`px-4 py-2 font-semibold transition-colors ${activeView === 'payment' ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}>Płatności</button>
            </div>
            
            {activeView === 'location' && <LocationAnalysisView allTrips={allTrips} daySummaries={daySummaries} />}
            {activeView === 'heatmap' && <EarningsHeatmap trips={geocodedTrips} isLoading={isGeocoding} />}
            {activeView === 'time' && <TimeAnalysisView daySummaries={daySummaries} />}
            {activeView === 'payment' && <PaymentAnalysisView allTrips={allTrips} />}
        </div>
    );
};