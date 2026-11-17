'use client';

import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  endDate: string;
  className?: string;
}

export function DateSelector({ 
  selectedDate, 
  onDateChange, 
  endDate,
  className 
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate last 7 days dynamically
  const generateLast7Days = () => {
    const dates = [];
    const end = new Date(endDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(end);
      date.setDate(end.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    if (dateString === today) {
      return 'Today';
    } else if (dateString === yesterdayString) {
      return 'Yesterday';
    }
    
    // Format: "Mon, Jan 6"
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

  const availableDates = generateLast7Days();

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <span className="text-sm text-gray-600">Data as of</span>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md text-sm text-gray-800 transition-shadow cursor-pointer"
        >
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="font-medium">{getFormattedDate(selectedDate)}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
              <div className="p-1">
                {availableDates.map((date) => {
                  const isSelected = date === selectedDate;
                  
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm ${
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
    </div>
  );
}