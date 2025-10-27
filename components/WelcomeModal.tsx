import React, { useState } from 'react';
import { WelcomeGraphic } from './WelcomeGraphic';
import { FileUpIcon, SparklesIcon, ChatIcon } from './icons';

interface WelcomeModalProps {
    onClose: (dontShowAgain: boolean) => void;
}

const slides = [
    {
        icon: <WelcomeGraphic />,
        title: 'Witaj w Taxi Profit',
        text: 'Twoje centrum dowodzenia do maksymalizacji zysków. Zaczynajmy!'
    },
    {
        icon: <FileUpIcon className="w-20 h-20 text-brand-primary" />,
        title: 'Inteligentny import',
        text: 'Błyskawicznie importuj dane ze zrzutów ekranu i raportów CSV z Ubera i Bolta.'
    },
    {
        icon: <SparklesIcon className="w-20 h-20 text-brand-primary" />,
        title: 'Wskazówki od AI',
        text: 'Otrzymuj spersonalizowane wskazówki od AI, aby maksymalizować swoje zyski.'
    },
    {
        icon: <ChatIcon className="w-20 h-20 text-brand-primary" />,
        title: 'Asystent AI',
        text: 'Rozmawiaj z inteligentnym asystentem, aby uzyskać szybkie odpowiedzi na swoje pytania.'
    }
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleClose();
        }
    };
    
    const handleClose = () => {
        onClose(dontShowAgain);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-medium rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col text-center">
                <div className="flex-grow flex flex-col items-center justify-center min-h-[300px]">
                    {slides[currentSlide].icon}
                    <h2 className="text-2xl font-bold mt-6 mb-2 text-text-main">
                        {slides[currentSlide].title}
                    </h2>
                    <p className="text-text-secondary px-4">
                        {slides[currentSlide].text}
                    </p>
                </div>
                
                <div className="flex items-center justify-center space-x-2 my-6">
                    {slides.map((_, index) => (
                        <button 
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? 'bg-brand-primary' : 'bg-gray-light'}`}
                            aria-label={`Idź do slajdu ${index + 1}`}
                        />
                    ))}
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleNext} 
                        className="w-full px-4 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors"
                    >
                        {currentSlide < slides.length - 1 ? 'Dalej' : 'Zaczynajmy!'}
                    </button>
                     <button 
                        onClick={handleClose} 
                        className="w-full px-4 py-2 rounded-md text-sm text-gray-very-light font-semibold hover:text-text-secondary transition-colors"
                    >
                        Pomiń
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        id="dont-show-again"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="h-4 w-4 rounded text-brand-primary bg-gray-light border-gray-light focus:ring-brand-primary"
                    />
                    <label htmlFor="dont-show-again" className="ml-2 text-sm text-text-secondary">
                        Nie pokazuj ponownie
                    </label>
                </div>
            </div>
        </div>
    );
};