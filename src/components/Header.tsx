"use client";

import React, { useEffect, useState } from 'react';
import { useDiaryStore } from '../store';
import { ChevronLeft, ChevronRight, Cloud, Search } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';

export default function Header() {
  const { activeDate, setActiveDate } = useDiaryStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrevDay = () => {
    const prevDate = subDays(parseISO(activeDate), 1);
    setActiveDate(format(prevDate, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const nextDate = addDays(parseISO(activeDate), 1);
    setActiveDate(format(nextDate, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setActiveDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (!mounted) return <header className="h-14 border-b border-gray-200" />;

  const displayDate = format(parseISO(activeDate), 'EEEE, MMMM do, yyyy');

  return (
    <header className="h-14 w-full border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10 sticky top-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 overflow-hidden shadow-sm">
          <button
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 focus:outline-none"
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 transition-colors border-l border-r border-gray-200 text-gray-700 focus:outline-none"
          >
            Today
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 focus:outline-none"
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="text-lg font-semibold text-gray-800 ml-4 font-inter tracking-tight">
          {displayDate}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button
          className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors group"
          title="Search (Cmd+K)"
        >
          <Search size={16} />
          <span className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 group-hover:bg-gray-200 transition-colors">Cmd K</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-green-600 font-medium">
          <Cloud size={14} />
          <span>Synced with [User Email]</span>
        </div>
      </div>
    </header>
  );
}
