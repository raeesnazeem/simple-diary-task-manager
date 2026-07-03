import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  currentDate: string;
}

export default function CalendarModal({ isOpen, onClose, onSelectDate, currentDate }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(parseISO(currentDate));

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(parseISO(currentDate));
    }
  }, [isOpen, currentDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] transition-all" onClick={onClose}>
      <div 
        className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_24px_48px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] p-5 w-[320px] border border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 px-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} className="text-gray-600" />
          </button>
          <h2 className="text-[15px] font-semibold text-gray-800 tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronRight size={18} strokeWidth={2.5} className="text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 px-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[11px] font-semibold text-gray-400 tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 gap-x-1 px-1">
          {days.map(day => {
            const isSelected = isSameDay(day, parseISO(currentDate));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toString()}
                onClick={() => {
                  onSelectDate(format(day, dateFormat));
                  onClose();
                }}
                className={`
                  h-9 w-9 rounded-full flex items-center justify-center text-[14px] transition-all
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-800'}
                  ${isSelected ? 'bg-black text-white shadow-md font-medium' : 'hover:bg-black/5'}
                  ${isToday && !isSelected ? 'text-blue-600 font-semibold' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
