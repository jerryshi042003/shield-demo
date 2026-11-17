'use client';

import { getLocalizedDate } from '@/lib/utils/date';
import { sub } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MinimalDateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  endDate: string;
  className?: string;
}

export function MinimalDateSelector({ 
  selectedDate, 
  onDateChange, 
  endDate,
  className = ''
}: MinimalDateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateLast7Days = () => {
    const dates = [];
    const end = getLocalizedDate(endDate);
    
    for (let i = 0; i < 7; i++) {
      const date = getLocalizedDate(endDate);
      date.setDate(end.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getFormattedDate = (dateString: string) => {
    const date = getLocalizedDate(dateString);
    const today = getLocalizedDate().toISOString().split('T')[0];
    const yesterday = sub(today, {days: 1});
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Treat both today and yesterday as "Today" since data is current
    if (dateString === today) {
      return 'Today';
    } else if (dateString === yesterdayString) {
      return 'Yesterday'
    }

    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `${weekday}, ${monthDay}`;
  };

  const handleDateSelect = (date: string) => {
    onDateChange(date);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableDates = generateLast7Days();

  return (
    <div className={`relative text-sm text-gray-600 ${className}`} ref={dropdownRef}>
      <span
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        Data as of {getFormattedDate(selectedDate)}
        <ChevronDown className="ml-1 w-3 h-3 text-gray-400 inline" />
      </span>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 whitespace-nowrap">
            <div className="p-1">
              {availableDates.map((date) => {
                const isSelected = date === selectedDate;
                
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`text-left px-3 py-2 rounded hover:bg-gray-50 text-sm ${
                      isSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {getFormattedDate(date)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}