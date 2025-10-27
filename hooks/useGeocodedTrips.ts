import { useState, useEffect, useRef } from 'react';
import { Trip } from '../types';
import { getCoordsFromAddress } from '../services/geminiService';

const GEOCODING_CACHE_KEY = 'taxi-profit-tracker-geocoding-cache-v2';

interface GeocodingCache {
  [address: string]: { lat: number; lng: number } | 'failed';
}

const loadCache = (): GeocodingCache => {
  try {
    const cached = window.localStorage.getItem(GEOCODING_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error loading geocoding cache:', error);
    return {};
  }
};

const saveCache = (cache: GeocodingCache) => {
  try {
    window.localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving geocoding cache:', error);
  }
};

export const useGeocodedTrips = (allTrips: Trip[]) => {
  const [geocodedTrips, setGeocodedTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cache = useRef<GeocodingCache>(loadCache());
  const isProcessing = useRef(new Set<string>());

  useEffect(() => {
    let isMounted = true;

    const processTrips = async () => {
      if (allTrips.length === 0) {
        setGeocodedTrips([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      const addressesToFetch = new Set<string>();
      const tripsWithCoords: Trip[] = allTrips.map(trip => {
        if (trip.lat && trip.lng) {
          return trip;
        }
        if (trip.pickupAddress) {
          const cachedCoords = cache.current[trip.pickupAddress];
          if (cachedCoords && cachedCoords !== 'failed') {
            return { ...trip, lat: cachedCoords.lat, lng: cachedCoords.lng };
          }
          if (!cachedCoords) {
            addressesToFetch.add(trip.pickupAddress);
          }
        }
        return trip;
      });

      if (isMounted) {
        setGeocodedTrips(tripsWithCoords);
      }

      if (addressesToFetch.size === 0) {
        if (isMounted) setIsLoading(false);
        return;
      }

      let updatesMade = false;
      for (const address of Array.from(addressesToFetch)) {
        if (isProcessing.current.has(address)) continue;

        isProcessing.current.add(address);
        try {
          const coords = await getCoordsFromAddress(address);
          if (coords) {
            cache.current[address] = coords;
            updatesMade = true;
          } else {
            cache.current[address] = 'failed';
          }
        } catch (error) {
          console.error(`Failed to geocode address: ${address}`, error);
          cache.current[address] = 'failed';
        } finally {
          isProcessing.current.delete(address);
        }
      }
      
      if (updatesMade) {
        saveCache(cache.current);
        const newlyGeocodedTrips = tripsWithCoords.map(trip => {
            if (!trip.lat && !trip.lng && trip.pickupAddress) {
                const newCoords = cache.current[trip.pickupAddress];
                if (newCoords && newCoords !== 'failed') {
                    return {...trip, lat: newCoords.lat, lng: newCoords.lng };
                }
            }
            return trip;
        });
        if (isMounted) {
            setGeocodedTrips(newlyGeocodedTrips);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    processTrips();

    return () => {
      isMounted = false;
    };
  }, [allTrips]);

  return { geocodedTrips, isLoading };
};