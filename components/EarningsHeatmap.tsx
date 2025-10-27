import React, { useEffect, useRef } from 'react';
import { Trip } from '../types';

interface EarningsHeatmapProps {
  trips: Trip[];
  isLoading: boolean;
}

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        <p className="text-text-secondary mt-4">Geokodowanie adresów...</p>
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-center text-text-secondary">
        <p>{message}</p>
    </div>
);

export const EarningsHeatmap: React.FC<EarningsHeatmapProps> = ({ trips, isLoading }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<any>(null); // To store heatmap instance

  useEffect(() => {
    // FIX: Property 'google' does not exist on type 'Window & typeof globalThis'. Use window.google to access the global variable.
    if (!mapRef.current || typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
      return;
    }

    // FIX: Property 'google' does not exist on type 'Window & typeof globalThis'. Use window.google to access the global variable.
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 52.237049, lng: 21.017532 }, // Center of Poland
      zoom: 6,
      styles: mapStyles,
      disableDefaultUI: true,
      zoomControl: true,
    });

    const heatmapData = trips
      .filter(trip => trip.lat && trip.lng)
      .map(trip => ({
        // FIX: Property 'google' does not exist on type 'Window & typeof globalThis'. Use window.google to access the global variable.
        location: new window.google.maps.LatLng(trip.lat!, trip.lng!),
        weight: trip.fare,
      }));

    if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
    }
    
    // FIX: Property 'google' does not exist on type 'Window & typeof globalThis'. Use window.google to access the global variable.
    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
    });
    
    heatmapRef.current.set('radius', 20);
    heatmapRef.current.set('opacity', 0.8);
    heatmapRef.current.set('gradient', [
        "rgba(0, 255, 255, 0)",
        "rgba(0, 255, 255, 1)",
        "rgba(0, 191, 255, 1)",
        "rgba(0, 127, 255, 1)",
        "rgba(0, 63, 255, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 0, 223, 1)",
        "rgba(0, 0, 191, 1)",
        "rgba(0, 0, 159, 1)",
        "rgba(0, 0, 127, 1)",
        "rgba(63, 0, 91, 1)",
        "rgba(127, 0, 63, 1)",
        "rgba(191, 0, 31, 1)",
        "rgba(255, 0, 0, 1)",
    ]);

  }, [trips]);

  const hasLocationData = trips.some(t => t.lat && t.lng);

  return (
    <div className="bg-gray-medium p-4 rounded-lg shadow-lg h-[600px]">
        <h3 className="text-lg font-bold text-text-main mb-4">Mapa Cieplna Zarobków</h3>
        <div className="h-[calc(100%-40px)] rounded-md overflow-hidden">
        {isLoading ? (
            <LoadingSpinner />
        ) : !hasLocationData ? (
            <EmptyState message="Brak danych do analizy na mapie. Zaimportuj raport z adresami, aby rozpocząć." />
        ) : (
            <div ref={mapRef} className="w-full h-full" />
        )}
        </div>
    </div>
  );
};
