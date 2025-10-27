import React, { useState, useEffect, useRef } from 'react';
import { ChatIcon, SparklesIcon } from './icons';
import { askChatbot } from '../services/geminiService';
import { DaySummary, Trip, ChatMessage } from '../types';

interface ChatbotProps {
  daySummaries: DaySummary[];
  allTrips: Trip[];
}

const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
        <div className="w-2 h-2 bg-gray-very-light rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-very-light rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-very-light rounded-full animate-bounce"></div>
    </div>
);

export const Chatbot: React.FC<ChatbotProps> = ({ daySummaries, allTrips }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number, longitude: number } | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Could not get user location for grounding:", error.message);
        }
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const historyForApi: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: 'user', parts: [{ text: inputValue }] },
    ];
    
    try {
      const botResponse = await askChatbot(historyForApi, daySummaries, allTrips, coords);
      setMessages(prev => [...prev, { role: 'model' as const, text: botResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model' as const, text: "Wystąpił błąd. Spróbuj ponownie." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-brand-primary text-white p-4 rounded-full shadow-lg hover:bg-brand-secondary transition-transform transform hover:scale-110 z-40"
        aria-label="Otwórz czat z asystentem AI"
      >
        <ChatIcon className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-gray-medium rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-light/50">
      <header className="flex items-center justify-between p-4 border-b border-gray-light/50">
        <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-brand-primary" />
            <h3 className="text-lg font-bold text-text-main">Asystent AI</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-sm rounded-xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-light text-text-main'
              }`}
               dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}
            />
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="bg-gray-light rounded-xl px-4 py-2">
                    <TypingIndicator />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-light/50">
        <div className="flex items-center bg-gray-light rounded-full">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Zapytaj o coś..."
            className="flex-1 bg-transparent px-4 py-2 text-text-main placeholder-gray-very-light focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-brand-primary text-white rounded-full p-2 m-1 hover:bg-brand-secondary disabled:bg-gray-500 transition-colors"
            disabled={isLoading || !inputValue.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </form>
    </div>
  );
};
