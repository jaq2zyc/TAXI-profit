import React, { useState, useRef } from 'react';
import { Trip, Platform, Partner } from '../types';
import { parseCsv } from '../utils/importers';
import { ExternalLinkIcon, UploadIcon, CarIcon } from './icons';

interface SmartImportModalProps {
  onClose: () => void;
  onImport: (trips: Omit<Trip, 'id' | 'partnerId'>[], partnerId: string | null, fileName: string, platform: Platform) => void;
  partners: Partner[];
}

type ImportStep = 'initial' | 'confirm';

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ onClose, onImport, partners }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('initial');
  const [parsedTrips, setParsedTrips] = useState<Omit<Trip, 'id' | 'partnerId'>[]>([]);
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('Uber');
  const [importedFileName, setImportedFileName] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const csvText = await file.text();
      const { trips, platform } = parseCsv(csvText);
      if (trips.length === 0) {
        throw new Error("Nie znaleziono żadnych kursów w pliku. Sprawdź, czy wczytujesz poprawny raport.");
      }
      setParsedTrips(trips);
      setDetectedPlatform(platform);
      setImportedFileName(file.name);
      setStep('confirm');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd podczas przetwarzania pliku.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = () => {
    onImport(parsedTrips, selectedPartnerId, importedFileName, detectedPlatform);
    onClose();
  };
  
  const platformLinks = [
      { name: "Bolt Driver", link: "https://partners.bolt.eu/rider-invoices" },
      { name: "Uber Partner", link: "https://partners.uber.com/p3/money/statements" },
  ]

  const renderInitialStep = () => (
    <>
      <div className="space-y-4 text-sm text-text-secondary">
        <div className="p-3 bg-gray-dark/50 rounded-lg">
          <p className="font-bold text-text-main mb-1">Krok 1: Przejdź do portalu i pobierz raport CSV</p>
          <p>Użyj poniższych linków, aby otworzyć stronę z raportami w nowej karcie.</p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            {platformLinks.map(p => (
                 <a
                    key={p.name}
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center inline-flex items-center justify-center gap-2 text-brand-primary font-semibold hover:underline"
                >
                    {p.name} <ExternalLinkIcon className="w-4 h-4" />
                </a>
            ))}
          </div>
        </div>
        <div className="p-3 bg-gray-dark/50 rounded-lg">
          <p className="font-bold text-text-main mb-1">Krok 2: Wczytaj raport CSV</p>
          <p>Po pobraniu pliku, wróć i kliknij przycisk poniżej. Aplikacja sama rozpozna, czy to plik z Bolta czy Ubera.</p>
          <div className="relative mt-3">
            <input
              type="file"
              accept=".csv,text/csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Przetwarzanie..." : <><UploadIcon className="w-5 h-5" /> Wczytaj plik CSV</>}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-2 text-center">{error}</p>}
        </div>
      </div>
       <div className="flex justify-end pt-4 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-light text-text-main font-semibold hover:bg-gray-very-light/50 transition-colors">
            Anuluj
            </button>
        </div>
    </>
  );

  const renderConfirmStep = () => (
     <div className="space-y-4">
        <div className="text-center p-4 bg-gray-dark/50 rounded-lg">
            <CarIcon className="w-12 h-12 mx-auto text-brand-primary mb-2" />
            <p className="font-bold text-text-main">Znaleziono {parsedTrips.length} kursów ({detectedPlatform}) do zaimportowania.</p>
        </div>
        <div>
            <label htmlFor="partner-select-import" className="block text-sm font-medium text-text-secondary mb-1">
                Wybierz profil, z którym chcesz powiązać te kursy
            </label>
            <select
                id="partner-select-import"
                value={selectedPartnerId || ''}
                onChange={(e) => setSelectedPartnerId(e.target.value || null)}
                className="block w-full bg-gray-light border-gray-light rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-text-main p-3"
            >
                {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            <p className="text-xs text-gray-very-light mt-1">
                Wybrane zasady rozliczeń (prowizja, koszty) zostaną trwale przypisane do tych kursów.
            </p>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setStep('initial')} className="px-4 py-2 rounded-md bg-gray-light text-text-main font-semibold hover:bg-gray-very-light/50 transition-colors">
                Wróć
            </button>
            <button onClick={handleConfirmImport} className="px-4 py-2 rounded-md bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors">
                Zatwierdź i importuj
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-medium rounded-lg p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-main">Importuj Raport CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl transition-colors -mt-4 -mr-2">&times;</button>
        </div>
        {step === 'initial' ? renderInitialStep() : renderConfirmStep()}
      </div>
    </div>
  );
};