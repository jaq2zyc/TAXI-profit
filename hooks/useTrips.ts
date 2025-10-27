import { useState, useEffect } from 'react';
import { Trip } from '../types';

const TRIPS_STORAGE_KEY = 'taxi-profit-tracker-trips';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const storedTrips = window.localStorage.getItem(TRIPS_STORAGE_KEY);
      return storedTrips ? JSON.parse(storedTrips) : [];
    } catch (error) {
      console.error("Error reading trips from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (error) {
      console.error("Error saving trips to localStorage", error);
    }
  }, [trips]);

  const addTrip = (trip: Trip) => {
    setTrips(prevTrips => [trip, ...prevTrips]);
  };

  const addMultipleTrips = (newTrips: Trip[]) => {
    setTrips(prev => [...newTrips, ...prev].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
  };

  const deleteTrip = (id: string) => {
    setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id));
  };

  const deleteMultipleTrips = (ids: string[]) => {
    const idsSet = new Set(ids);
    setTrips(prevTrips => prevTrips.filter(trip => !idsSet.has(trip.id)));
  };

  const clearTrips = () => {
    setTrips([]);
  };

  return { trips, addTrip, addMultipleTrips, deleteTrip, deleteMultipleTrips, clearTrips };
};