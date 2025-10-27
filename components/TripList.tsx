import React from 'react';
import { Trip } from '../types';
import { TrashIcon } from './icons';
import { formatDuration } from '../utils/analytics';
import { EmptyState } from './EmptyState';

interface TripListProps {
  trips: Trip[];
  onDeleteTrip: (id: string) => void;
}

const TripItem: React.FC<{ trip: Trip; onDelete: (id: string) => void }> = ({ trip, onDelete }) => {
  const tripDuration = new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime();

  return (
    <div className="bg-gray-medium p-4 rounded-lg shadow-lg flex justify-between items-center transition-transform hover:scale-[1.02]">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${trip.platform === 'Uber' ? 'bg-black text-white' : 'bg-green-500 text-white'}`}>
            {trip.platform}
          </span>
          <p className="text-sm text-text-secondary">
            {new Date(trip.startTime).toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' })}
            {' • '}
            {new Date(trip.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-baseline space-x-4 sm:space-x-6">
          <p className="text-2xl font-bold text-brand-primary">{trip.fare.toFixed(2)} zł</p>
          <p className="text-md text-text-secondary">{trip.distance.toFixed(1)} km</p>
          <p className="text-md text-text-secondary">{formatDuration(tripDuration)}</p>
        </div>
      </div>
      <button onClick={() => onDelete(trip.id)} className="p-2 rounded-full text-gray-very-light hover:text-red-500 hover:bg-red-500/10 transition-colors">
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};


export const TripList: React.FC<TripListProps> = ({ trips, onDeleteTrip }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-main px-1">Ostatnie kursy</h2>
      {trips.length > 0 ? (
        trips.map(trip => (
          <TripItem key={trip.id} trip={trip} onDelete={onDeleteTrip} />
        ))
      ) : (
        <EmptyState 
          title="Brak zarejestrowanych kursów"
          message="Kliknij przycisk +, aby dodać swój pierwszy przejazd."
        />
      )}
    </div>
  );
};