// FIX: Updated component to be dynamic based on the selected output type for better UX.
import React from 'react';
import { OutputType } from '../types';

interface HeaderProps {
  outputType: OutputType;
  onToggleHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ outputType, onToggleHistory }) => {
  const title = `Bulk ${outputType} Generator`;
  const description = `Generate stunning, high-quality ${outputType.toLowerCase()}s in batches. Simply provide your prompts, choose your style, and let AI do the rest.`;

  return (
    <header className="bg-base-200 shadow-md">
      <div className="container mx-auto px-4 py-6 text-center relative">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {title} <span className="text-brand-secondary">Pro</span>
        </h1>
        <p className="mt-3 text-lg text-text-secondary max-w-2xl mx-auto">
          {description}
        </p>
        <button
          onClick={onToggleHistory}
          className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full hover:bg-base-300/50 focus:outline-none focus:ring-2 focus:ring-brand-light transform hover:scale-110 active:scale-100 transition-all duration-200"
          aria-label="Open history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;