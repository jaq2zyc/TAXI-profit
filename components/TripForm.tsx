import React, { useState, useRef } from 'react';
import { Trip, Platform } from '../types';
import { analyzeScreenshot } from '../services/geminiService';
import { UploadIcon } from './icons';

interface TripFormProps {
  onAddTrip: (trip: Omit<Trip, 'id' | 'partnerId'>) => void;
  onClose: () => void;
}

const formatDateTimeLocal = (date: Date) => {
    if (isNaN(date.getTime())) {
      const now = new Date();
      return formatDateTimeLocal(now);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


export const TripForm: React.FC<TripFormProps> = ({ onAddTrip, onClose }) => {
  const [platform, setPlatform] = useState<Platform>('Uber');
  const [distance, setDistance] = useState('');
  const [fare, setFare] = useState('');
  
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  
  const [startTime, setStartTime] = useState(formatDateTimeLocal(thirtyMinutesAgo));
  const [endTime, setEndTime] = useState(formatDateTimeLocal(now));
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setDateError(null);

    try {
      const base64Image = await blobToBase64(file);
      const extractedData = await analyzeScreenshot(base64Image);
      
      if (extractedData.platform) setPlatform(extractedData.platform);
      if (extractedData.fare) setFare(extractedData.fare.toString());
      if (extractedData.distance) setDistance(extractedData.distance.toString());
      
      const now = new Date();
      const extractedStartTime = extractedData.startTime ? new Date(extractedData.startTime) : new Date(now.getTime() - 15 * 60 * 1000);
      const extractedEndTime = extractedData.endTime ? new Date(extractedData.endTime) : now;

      setStartTime(formatDateTimeLocal(extractedStartTime));
      setEndTime(formatDateTimeLocal(extractedEndTime));

    } catch (error) {
      console.error(error);
      setAnalysisError(error instanceof Error ? error.message : "Wystąpił nieznany błąd.");
    } finally {
      setIsAnalyzing(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate < startDate) {
      setDateError("Czas zakończenia nie może być wcześniejszy niż czas rozpoczęcia.");
      return;
    }
    
    setDateError(null);

    const tripData = {
      platform,
      distance: parseFloat(distance) || 0,
      fare: parseFloat(fare) || 0,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    onAddTrip(tripData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-medium rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Dodaj nowy kurs</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

        <div className="relative border-2 border-dashed border-gray-light rounded-lg p-4 text-center">
            <input 
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isAnalyzing}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadIcon className="w-8 h-8 text-gray-very-light" />
              <p className="text-sm font-semibold text-text-secondary">
                {isAnalyzing ? "Analizowanie..." : "Importuj ze zrzutu ekranu"}
              </p>
              <p className="text-xs text-gray-very-light">
                Prześlij screen z apki Uber/Bolt
              </p>
            </div>
             {isAnalyzing && (
              <div className="absolute inset-0 bg-gray-medium bg-opacity-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
              </div>
            )}
          </div>

          {analysisError && <p className="text-sm text-red-400 text-center">{analysisError}</p>}
          
          <div className="text-center text-xs text-gray-very-light my-2">LUB WPROWADŹ RĘCZNIE</div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Platforma</label>
            <div className="flex space-x-2">
              {(['Uber', 'Bolt'] as Platform[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${platform === p ? 'bg-brand-primary text-white' : 'bg-gray-light text-text-secondary'}`}
                  disabled={isAnalyzing}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fare" className="block text-sm font-medium text-text-secondary">Kwota (PLN)</label>
              <input type="number" id="fare" value={fare} onChange={e => setFare(e.target.value)}
                className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
                placeholder="np. 25.50" step="0.01" required disabled={isAnalyzing}
              />
            </div>
            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-text-secondary">Dystans (km)</label>
              <input type="number" id="distance" value={distance} onChange={e => setDistance(e.target.value)}
                className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
                placeholder="np. 10.2" step="0.1" required disabled={isAnalyzing}
              />
            </div>
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-text-secondary">Czas rozpoczęcia</label>
            <input type="datetime-local" id="startTime" value={startTime} onChange={e => { setStartTime(e.target.value); setDateError(null); }}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" required disabled={isAnalyzing}
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-text-secondary">Czas zakończenia</label>
            <input type="datetime-local" id="endTime" value={endTime} onChange={e => { setEndTime(e.target.value); setDateError(null); }}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" required disabled={isAnalyzing}
            />
          </div>
          {dateError && <p className="text-sm text-red-400 text-center">{dateError}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-light text-text-main font-semibold hover:bg-gray-very-light/50 transition-colors" disabled={isAnalyzing}>
              Anuluj
            </button>
            <button type="submit"
              className="px-4 py-2 rounded-md bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors disabled:opacity-50" disabled={isAnalyzing}>
              Zapisz kurs
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};