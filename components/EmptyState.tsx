import React from 'react';
import { CarIcon } from './icons';

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <div className="bg-gray-medium p-8 rounded-lg text-center border-2 border-dashed border-gray-light">
      <CarIcon className="w-16 h-16 text-gray-light mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-main">{title}</h3>
      <p className="text-text-secondary mt-1">{message}</p>
    </div>
  );
};