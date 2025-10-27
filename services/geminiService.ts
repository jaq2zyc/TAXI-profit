import { GoogleGenAI, Type } from "@google/genai";
import { Trip, DaySummary, Cost, ChatMessage } from '../types';
import { getEarningsPerDayOfWeek, formatDuration, calculateAggregatedAnalytics } from '../utils/analytics';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Existing Functions ---

export const getInsightsFromGemini = async (daySummaries: DaySummary[], allTrips: Trip[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Klucz API Gemini nie jest skonfigurowany. Proszę go dodać, aby uzyskać wgląd AI.";
  }
  
  if (allTrips.length < 5) {
      return "Potrzebujesz co najmniej 5 zarejestrowanych kursów, aby uzyskać analizę AI. Kontynuuj jazdę i dodawaj kursy!";
  }

  const {
      totalRevenue,
      totalCosts,
      netProfit,
      totalWorkTimeMs,
  } = calculateAggregatedAnalytics(daySummaries);

  const totalDistance = daySummaries.reduce((sum, day) => sum + day.totalDistance, 0);
  const totalDurationHours = totalWorkTimeMs / (1000 * 60 * 60);

  const earningsPerHour = totalDurationHours > 0 ? (totalRevenue / totalDurationHours).toFixed(2) : '0.00';
  const earningsPerKm = totalDistance > 0 ? (totalRevenue / totalDistance).toFixed(2) : '0.00';

  const earningsByDay = getEarningsPerDayOfWeek(allTrips);
  
  const summary = {
    totalTrips: allTrips.length,
    totalEarnings: `${totalRevenue.toFixed(2)} PLN`,
    totalAggregatedCosts: `${totalCosts.toFixed(2)} PLN`,
    netProfit: `${netProfit.toFixed(2)} PLN`,
    totalDistance: `${totalDistance.toFixed(2)} km`,
    totalWorkTime: formatDuration(totalWorkTimeMs),
    avgEarningsPerHour: `${earningsPerHour} PLN/h`,
    avgEarningsPerKm: `${earningsPerKm} PLN/km`,
    earningsByDayOfWeek: earningsByDay,
  };

  const prompt = `
    Jesteś ekspertem w analizie danych dla kierowców taksówek. Na podstawie poniższych danych, wygeneruj krótkie, zwięzłe i praktyczne wskazówki w języku polskim, które pomogą kierowcy zmaksymalizować ZYSK NETTO. Skoncentruj się na tym, które dni są najbardziej dochodowe, jak można poprawić wskaźniki zarobków na godzinę (w oparciu o realny czas pracy, a nie sumę czasów kursów) i na kilometr oraz jak poszczególne kategorie kosztów (stałe, procentowe, incydentalne) wpływają na ogólną rentowność. Odpowiedź sformatuj używając markdown.

    Dane do analizy:
    ${JSON.stringify(summary, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Wystąpił błąd podczas generowania wskazówek AI. Spróbuj ponownie później.";
  }
};

export const analyzeScreenshot = async (base64Image: string): Promise<Partial<Omit<Trip, 'id' | 'partnerId'>>> => {
    if (!process.env.API_KEY) {
        throw new Error("Klucz API Gemini nie jest skonfigurowany.");
    }
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `Jesteś systemem OCR do analizy zrzutów ekranu z aplikacji dla kierowców, takich jak Uber i Bolt w Polsce. Przeanalizuj obraz i wyodrębnij następujące dane: platforma ('Uber' lub 'Bolt'), kwota przejazdu (fare) w PLN, dystans (distance) w km, czas rozpoczęcia (startTime) i czas zakończenia (endTime) w formacie ISO 8601. Jeśli nie możesz znaleźć którejś informacji, zwróć dla niej null. Zwróć tylko i wyłącznie obiekt JSON.`
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            platform: { type: Type.STRING, description: "Platforma, 'Uber' lub 'Bolt'." },
            fare: { type: Type.NUMBER, description: "Kwota przejazdu w PLN." },
            distance: { type: Type.NUMBER, description: "Dystans przejazdu w km." },
            startTime: { type: Type.STRING, description: "Czas rozpoczęcia w formacie ISO 8601. Może być null." },
            endTime: { type: Type.STRING, description: "Czas zakończenia w formacie ISO 8601. Może być null." }
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API for screenshot analysis:", error);
        throw new Error("Nie udało się przeanalizować zrzutu ekranu. Spróbuj ponownie.");
    }
};

export const analyzeReceipt = async (base64Image: string): Promise<Partial<Omit<Cost, 'id' | 'category'>>> => {
    if (!process.env.API_KEY) {
        throw new Error("Klucz API Gemini nie jest skonfigurowany.");
    }
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `Jesteś systemem OCR do analizy paragonów z Polski. Przeanalizuj obraz i wyodrębnij następujące dane: całkowita kwota (amount) w PLN, data transakcji (date) w formacie YYYY-MM-DD oraz krótki opis, np. nazwa sprzedawcy (description). Jeśli nie możesz znaleźć którejś informacji, zwróć dla niej null. Zwróć tylko i wyłącznie obiekt JSON.`
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            amount: { type: Type.NUMBER, description: "Całkowita kwota z paragonu w PLN." },
            date: { type: Type.STRING, description: "Data transakcji w formacie YYYY-MM-DD. Może być null." },
            description: { type: Type.STRING, description: "Krótki opis, np. nazwa sprzedawcy. Może być null." }
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (parsedData.date) {
            try {
                parsedData.date = new Date(parsedData.date).toISOString().slice(0, 10);
            } catch (e) {
                console.warn("Invalid date format from Gemini:", parsedData.date);
                parsedData.date = null;
            }
        }

        return parsedData;
    } catch (error) {
        console.error("Error calling Gemini API for receipt analysis:", error);
        throw new Error("Nie udało się przeanalizować paragonu. Spróbuj ponownie.");
    }
};

export const getDistrictFromAddress = async (address: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Nieznana";
    }
    if (!address || typeof address !== 'string' || address.trim().length < 3) {
        return "Nieznana";
    }

    const prompt = `Jesteś ekspertem od danych geograficznych w Polsce. Z podanego adresu wyodrębnij tylko i wyłącznie nazwę dzielnicy miasta (np. "Wrzeszcz", "Stogi", "Śródmieście", "Oliwa"). Jeśli adres jest poza dużym miastem lub nie da się jednoznacznie określić dzielnicy, zwróć nazwę miejscowości. Zawsze zwracaj pojedynczy ciąg znaków. Adres: "${address}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const district = response.text.trim();
        // Simple validation to avoid weird responses
        if (district.length > 30 || district.includes('\n')) {
            return "Nieznana";
        }
        return district;
    } catch (error) {
        console.error("Error calling Gemini API for district extraction:", error);
        return "Nieznana";
    }
};

export const getCoordsFromAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!process.env.API_KEY) {
        return null;
    }
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
        return null;
    }

    const textPart = {
        text: `Jesteś API do geokodowania. Na podstawie podanego adresu w Polsce, zwróć jego współrzędne geograficzne. Adres: "${address}". Zwróć tylko i wyłącznie obiekt JSON.`
    };
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            lat: { type: Type.NUMBER, description: "Szerokość geograficzna (latitude)." },
            lng: { type: Type.NUMBER, description: "Długość geograficzna (longitude)." }
        },
         required: ["lat", "lng"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            return parsed;
        }
        return null;
    } catch (error) {
        console.error("Error calling Gemini API for geocoding:", error);
        return null;
    }
};


// --- New Chatbot Functions ---

const generateContext = (daySummaries: DaySummary[], allTrips: Trip[]): string => {
    if (allTrips.length === 0) {
        return "Jesteś asystentem AI dla kierowcy taksówki. Użytkownik nie ma jeszcze żadnych zarejestrowanych danych.";
    }
    const analytics = calculateAggregatedAnalytics(daySummaries);
    const summary = {
        totalTrips: allTrips.length,
        totalEarnings: `${analytics.totalRevenue.toFixed(2)} PLN`,
        netProfit: `${analytics.netProfit.toFixed(2)} PLN`,
        totalWorkTime: formatDuration(analytics.totalWorkTimeMs),
        avgProfitPerHour: `${analytics.profitPerHour.toFixed(2)} PLN/h`,
    };
    return `Jesteś asystentem AI dla kierowcy taksówki korzystającego z aplikacji Taxi Profit. Odpowiadaj zwięźle i pomocnie. Oto podsumowanie jego aktualnych danych, użyj go do odpowiedzi na pytania: ${JSON.stringify(summary)}.`;
};

const getChatbotResponse = async (history: ChatMessage[], context: string): Promise<string> => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: context },
        history: history.slice(0, -1),
    });
    const lastMessage = history[history.length - 1]?.parts[0]?.text || '';
    const response = await chat.sendMessage({ message: lastMessage });
    return response.text;
};

const getComplexChatbotResponse = async (history: ChatMessage[], context: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: history,
        config: {
            systemInstruction: context,
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });
    return response.text;
};

const getGroundedChatbotResponse = async (
  history: ChatMessage[],
  context: string,
  coords?: { latitude: number; longitude: number }
): Promise<string> => {
    const config: any = {
        systemInstruction: context,
        tools: [{ googleMaps: {} }],
    };

    if (coords) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                }
            }
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: history,
        config,
    });

    let responseText = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks && groundingChunks.length > 0) {
        const uniqueLinks = new Set<string>();
        groundingChunks.forEach(chunk => {
            if (chunk.maps?.uri) {
                uniqueLinks.add(`[${chunk.maps.title || 'Zobacz na mapie'}](${chunk.maps.uri})`);
            }
        });

        if (uniqueLinks.size > 0) {
            responseText += `\n\n**Źródła:**\n- ${Array.from(uniqueLinks).join('\n- ')}`;
        }
    }
    
    return responseText;
};

export const askChatbot = async (
    history: ChatMessage[],
    daySummaries: DaySummary[],
    allTrips: Trip[],
    coords?: { latitude: number; longitude: number }
): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Klucz API Gemini nie jest skonfigurowany.";
    }

    const lastMessage = history[history.length - 1]?.parts[0]?.text.toLowerCase() || '';
    const context = generateContext(daySummaries, allTrips);

    const complexKeywords = ['analiza', 'optymalizacja', 'strategia', 'porównaj', 'dogłębnie', 'przeanalizuj'];
    const groundedKeywords = ['gdzie', 'restauracja', 'miejsce', 'najlepsze', 'polecasz', 'okolicy', 'pobliskie', 'znajdź'];

    try {
        if (complexKeywords.some(keyword => lastMessage.includes(keyword))) {
            return await getComplexChatbotResponse(history, context);
        }
        if (groundedKeywords.some(keyword => lastMessage.includes(keyword))) {
            return await getGroundedChatbotResponse(history, context, coords);
        }
        return await getChatbotResponse(history, context);
    } catch (error) {
        console.error("Error getting chatbot response:", error);
        return "Przepraszam, wystąpił błąd podczas przetwarzania Twojego zapytania. Spróbuj ponownie.";
    }
};