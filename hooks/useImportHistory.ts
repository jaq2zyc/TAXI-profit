import { useState, useEffect } from 'react';
import { HistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'taxi-profit-tracker-history';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const storedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Error reading history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving history to localStorage", error);
    }
  }, [history]);

  const sortHistory = (h: HistoryItem[]) => 
    h.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const addHistoryItem = (item: HistoryItem) => {
    setHistory(prevHistory => sortHistory([item, ...prevHistory]));
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
  };
  
  const deleteHistoryItemByRelatedId = (relatedId: string) => {
      setHistory(prev => prev.filter(item => item.type !== 'cost' || !item.relatedIds.includes(relatedId)));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addHistoryItem, deleteHistoryItem, clearHistory, deleteHistoryItemByRelatedId };
};