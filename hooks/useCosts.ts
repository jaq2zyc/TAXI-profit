import { useState, useEffect } from 'react';
import { Cost, Partner, Trip } from '../types';

const COSTS_STORAGE_KEY = 'taxi-profit-tracker-costs';

export const useCosts = () => {
  const [costs, setCosts] = useState<Cost[]>(() => {
    try {
      const storedCosts = window.localStorage.getItem(COSTS_STORAGE_KEY);
      return storedCosts ? JSON.parse(storedCosts) : [];
    } catch (error) {
      console.error("Error reading costs from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(COSTS_STORAGE_KEY, JSON.stringify(costs));
    } catch (error)
    {
      console.error("Error saving costs to localStorage", error);
    }
  }, [costs]);

  const sortCosts = (costs: Cost[]) => costs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const addCost = (cost: Omit<Cost, 'id'>): Cost => {
    const newCost: Cost = { ...cost, id: new Date().toISOString() };
    setCosts(prevCosts => sortCosts([newCost, ...prevCosts]));
    return newCost;
  };

  const deleteCost = (id: string) => {
    setCosts(prevCosts => prevCosts.filter(cost => cost.id !== id));
  };

  const clearCosts = () => {
    setCosts([]);
  };

  return { costs, addCost, deleteCost, clearCosts };
};