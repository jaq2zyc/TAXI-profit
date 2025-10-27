import React, { useState, useRef } from 'react';
import { Cost, CostCategory } from '../types';
import { UploadIcon } from './icons';
import { analyzeReceipt } from '../services/geminiService';

interface CostFormProps {
  onAddCost: (cost: Omit<Cost, 'id'>) => void;
  onClose: () => void;
}

const CATEGORIES: CostCategory[] = ['Paliwo', 'Myjnia', 'Serwis', 'Ubezpieczenie', 'Inne'];

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

export const CostForm: React.FC<CostFormProps> = ({ onAddCost, onClose }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<CostCategory>('Paliwo');
  const [description, setDescription] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const base64Image = await blobToBase64(file);
      const extractedData = await analyzeReceipt(base64Image);
      
      if (extractedData.amount) setAmount(extractedData.amount.toString());
      if (extractedData.date) setDate(extractedData.date);
      if (extractedData.description) setDescription(extractedData.description);

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
    
    const costData = {
      amount: parseFloat(amount) || 0,
      date: new Date(date).toISOString(),
      category,
      description,
    };

    onAddCost(costData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-medium rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Dodaj nowy koszt</h2>
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
                {isAnalyzing ? "Analizowanie..." : "Skanuj paragon"}
              </p>
              <p className="text-xs text-gray-very-light">
                Prześlij zdjęcie paragonu
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
            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary">Kwota (PLN)</label>
            <input 
              type="number" 
              id="amount" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
              placeholder="np. 150.00" 
              step="0.01" 
              required
              disabled={isAnalyzing}
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Data</label>
            <input 
              type="date" 
              id="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2" 
              required
              disabled={isAnalyzing}
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Kategoria</label>
            <select 
              id="category" 
              value={category} 
              onChange={e => setCategory(e.target.value as CostCategory)}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
              disabled={isAnalyzing}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Opis (opcjonalnie)</label>
            <input 
              type="text" 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-2"
              placeholder="np. Tankowanie Orlen" 
              disabled={isAnalyzing}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-light text-text-main font-semibold hover:bg-gray-very-light/50 transition-colors" disabled={isAnalyzing}>
              Anuluj
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors" disabled={isAnalyzing}>
              Zapisz koszt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};