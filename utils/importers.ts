import { Trip, Platform } from '../types';

const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
};


const parseBoltDate = (dateStr: string): Date | null => {
  // Format: "DD.MM.YYYY HH:MM"
  const parts = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/);
  if (!parts) return null;
  // parts[3] = YYYY, parts[2] = MM, parts[1] = DD, parts[4] = HH, parts[5] = MM
  return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:00`);
};

const parseUberDate = (dateStr: string): Date | null => {
  // Format: "YYYY-MM-DD HH:MM:SS" (assuming local timezone of the report)
  if (!dateStr) return null;
  return new Date(dateStr);
};

const detectPlatform = (headerLine: string): Platform => {
    if (headerLine.includes("Data przejazdu") && headerLine.includes("Numer faktury")) {
        return 'Bolt';
    }
    if (headerLine.toLowerCase().includes("begin trip time") || headerLine.toLowerCase().includes("fare amount")) {
        return 'Uber';
    }
    throw new Error("Nie rozpoznano formatu pliku. Upewnij się, że plik pochodzi z raportu Bolt lub Uber.");
}

export const parseCsv = (csvText: string): { trips: Omit<Trip, 'id' | 'partnerId'>[], platform: Platform } => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("Plik CSV jest pusty lub nieprawidłowy.");
    }
    const headerLine = lines[0].replace(/\uFEFF/g, '');
    const platform = detectPlatform(headerLine);

    if (platform === 'Bolt') return { trips: parseBoltCsvContent(lines), platform };
    if (platform === 'Uber') return { trips: parseUberCsvContent(lines), platform };
    return { trips: [], platform };
};

const parseBoltCsvContent = (lines: string[]): Omit<Trip, 'id' | 'partnerId'>[] => {
    const headerLine = lines[0].replace(/\uFEFF/g, ''); // Remove BOM character
    const headers = parseCsvLine(headerLine);
    
    const requiredHeaders = ["Data przejazdu", "Suma", "Data", "Adres odbioru", "Metoda płatności"];
    const headerIndices: Record<string, number> = {};
    
    requiredHeaders.forEach(h => {
        const index = headers.findIndex(header => header.trim() === h);
        if (index === -1) {
            throw new Error(`Brak wymaganej kolumny w pliku Bolt CSV: "${h}"`);
        }
        headerIndices[h] = index;
    });

    // FIX: Explicitly type the return of the map callback to ensure type safety and correct inference.
    return lines.slice(1).map((line): Omit<Trip, 'id' | 'partnerId'> | null => {
        if (!line.trim()) return null;

        const values = parseCsvLine(line);

        const tripDateStr = values[headerIndices["Data przejazdu"]];
        const invoiceDateStr = values[headerIndices["Data"]];
        const fareStr = values[headerIndices["Suma"]];
        const pickupAddress = values[headerIndices["Adres odbioru"]];
        const paymentMethod = values[headerIndices["Metoda płatności"]];
        
        const startTime = parseBoltDate(tripDateStr);
        const endTime = parseBoltDate(invoiceDateStr);
        
        const fare = parseFloat(fareStr.replace(',', '.'));

        if (!startTime || !endTime || isNaN(fare)) {
            console.warn("Skipping invalid Bolt line:", line);
            return null;
        }
        
        return {
            platform: 'Bolt',
            distance: 0, // Not available in Bolt report
            fare,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            pickupAddress,
            paymentMethod,
        };
    }).filter((trip): trip is Omit<Trip, 'id' | 'partnerId'> => trip !== null);
};


const parseUberCsvContent = (lines: string[]): Omit<Trip, 'id' | 'partnerId'>[] => {
    const headerLine = lines[0].replace(/\uFEFF/g, '');
    const headers = parseCsvLine(headerLine);

    const headerMapping: Record<string, string[]> = {
        startTime: ['Begin Trip Time', 'Data rozpoczęcia'],
        endTime: ['End Trip Time', 'Data zakończenia'],
        fare: ['Fare Amount', 'Opłata', 'Your Earnings'], 
        distance: ['Distance (miles)', 'Dystans (km)'],
    };

    const headerIndices: Record<string, number> = {};

    for (const key in headerMapping) {
        const possibleHeaders = headerMapping[key];
        const index = headers.findIndex(h => possibleHeaders.includes(h.trim()));
        if (index === -1) {
            throw new Error(`Brak wymaganej kolumny w pliku Uber CSV: "${possibleHeaders.join(' lub ')}"`);
        }
        headerIndices[key] = index;
    }

    const isMiles = headers[headerIndices.distance].includes('miles');

    return lines.slice(1).map(line => {
        if (!line.trim()) return null;
        const values = parseCsvLine(line);

        const startTime = parseUberDate(values[headerIndices.startTime]);
        const endTime = parseUberDate(values[headerIndices.endTime]);
        const fare = parseFloat(values[headerIndices.fare]);
        let distance = parseFloat(values[headerIndices.distance]);

        if (!startTime || !endTime || isNaN(fare) || isNaN(distance)) {
            console.warn("Skipping invalid Uber line:", line);
            return null;
        }

        if (isMiles) {
            distance *= 1.60934; // Convert miles to km
        }

        return {
            platform: 'Uber',
            distance,
            fare,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        };
    }).filter((trip): trip is Omit<Trip, 'id' | 'partnerId'> => trip !== null);
};