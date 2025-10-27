import { Trip, Cost } from '../types';

const escapeCsvCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) {
        return '';
    }
    const cellStr = String(cell);
    if (/[",\n]/.test(cellStr)) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
};

const convertToCsv = (data: any[], headers: Record<string, string>): string => {
    const headerKeys = Object.keys(headers);
    const headerRow = headerKeys.join(',');
    
    const rows = data.map(row => 
        headerKeys.map(headerKey => {
            const objectKey = headers[headerKey];
            return escapeCsvCell(row[objectKey]);
        }).join(',')
    );
    
    return [headerRow, ...rows].join('\n');
};

export const exportTripsToCsv = (trips: Trip[]): string => {
    const headers = {
        'ID': 'id',
        'Platforma': 'platform',
        'Dystans (km)': 'distance',
        'Kwota (PLN)': 'fare',
        'Czas rozpoczęcia': 'startTime',
        'Czas zakończenia': 'endTime',
        'ID Partnera': 'partnerId',
    };
    const data = trips.map(trip => ({
        ...trip,
        distance: trip.distance.toFixed(2).replace('.', ','),
        fare: trip.fare.toFixed(2).replace('.', ','),
    }));
    return convertToCsv(data, headers);
};

export const exportCostsToCsv = (costs: Cost[]): string => {
    const headers = {
        'ID': 'id',
        'Kwota (PLN)': 'amount',
        'Data': 'date',
        'Kategoria': 'category',
        'Opis': 'description',
    };
     const data = costs.map(cost => ({
        ...cost,
        amount: cost.amount.toFixed(2).replace('.', ','),
        date: new Date(cost.date).toLocaleDateString('pl-PL'),
    }));
    return convertToCsv(data, headers);
};