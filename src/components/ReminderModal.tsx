import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, FileText } from 'lucide-react';

interface ReminderDetails {
  date: string;
  time: string;
  title: string;
  description: string;
  severity: string;
  repeat: string;
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: ReminderDetails) => void;
  currentDate: string;
}

export default function ReminderModal({ isOpen, onClose, onSave, currentDate }: ReminderModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentMonth, setCurrentMonth] = useState(parseISO(currentDate));
  
  const [details, setDetails] = useState<ReminderDetails>({
    date: currentDate,
    time: format(new Date(), 'HH:mm'),
    title: '',
    description: '',
    severity: 'normal',
    repeat: 'none'
  });

  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(parseISO(currentDate));
      setStep(1);
      setDetailsConfirmed(false);
      setDetails(prev => ({ ...prev, date: currentDate, title: '', description: '', severity: 'normal', repeat: 'none', time: format(new Date(), 'HH:mm') }));
    }
  }, [isOpen, currentDate]);

  useEffect(() => {
    if (step === 3 && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter') {
        // If we are on step 3 and focus is not on textarea
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'textarea') return;
        
        if (step === 3 && details.title.trim() !== '') {
          setDetailsConfirmed(true);
        } else if (detailsConfirmed) {
          onSave(details);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, step, details, detailsConfirmed, onSave]);

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[2px] transition-all" onClick={onClose}>
      <div 
        className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_24px_48px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] p-5 w-[360px] border border-white/50 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pills Input Area */}
        <div className="flex items-center flex-wrap gap-2 min-h-[44px] bg-white rounded-xl border border-gray-200/60 p-2 shadow-sm">
          {/* Date Pill */}
          {(step > 1 || detailsConfirmed) && (
            <button 
              onClick={() => { setStep(1); setDetailsConfirmed(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/80 text-gray-700 text-sm font-medium hover:bg-gray-200/80 transition-colors border border-gray-200/50"
            >
              <CalendarIcon size={14} className="text-gray-500" />
              {details.date}
            </button>
          )}
          
          {/* Time Pill */}
          {(step > 2 || detailsConfirmed) && (
            <button 
              onClick={() => { setStep(2); setDetailsConfirmed(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/80 text-gray-700 text-sm font-medium hover:bg-gray-200/80 transition-colors border border-gray-200/50"
            >
              <Clock size={14} className="text-gray-500" />
              {details.time}
            </button>
          )}

          {/* Details Pill */}
          {detailsConfirmed && (
            <button 
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100/80 text-red-700 text-sm font-medium hover:bg-red-200/80 transition-colors border border-red-200/50 max-w-[150px]"
            >
              <FileText size={14} className="text-red-500 shrink-0" />
              <span className="truncate">{details.title || 'Details'}</span>
            </button>
          )}

          {/* Prompt / Cursor */}
          {!detailsConfirmed && (
            <span className="text-gray-400 text-sm font-medium px-2 animate-pulse">
              {step === 1 ? 'Select date...' : step === 2 ? 'Select time...' : 'Enter details...'}
            </span>
          )}
        </div>

        {/* Dynamic Widget Area */}
        {!detailsConfirmed && step === 1 && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
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
                const isSelected = isSameDay(day, parseISO(details.date));
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => {
                      setDetails(prev => ({ ...prev, date: format(day, dateFormat) }));
                      setStep(2);
                    }}
                    className={`
                      h-10 w-10 mx-auto rounded-full flex items-center justify-center text-[14px] transition-all
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
        )}

        {!detailsConfirmed && step === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center justify-center py-6 gap-6">
            <h3 className="text-gray-600 font-medium text-sm">When do you want to be reminded?</h3>
            <input 
              type="time" 
              value={details.time}
              onChange={(e) => setDetails(prev => ({ ...prev, time: e.target.value }))}
              className="text-4xl font-semibold bg-transparent border-none outline-none focus:ring-0 text-center text-gray-800"
            />
            <button 
              onClick={() => setStep(3)}
              className="mt-4 px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        )}

        {!detailsConfirmed && step === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
            <input 
              ref={titleInputRef}
              type="text" 
              placeholder="Reminder Title" 
              value={details.title}
              onChange={(e) => setDetails(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
            <textarea 
              placeholder="Description (optional)" 
              value={details.description}
              onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={details.severity}
                onChange={(e) => setDetails(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>

              <select 
                value={details.repeat}
                onChange={(e) => setDetails(prev => ({ ...prev, repeat: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
              >
                <option value="none">Don't repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                if (details.title.trim()) {
                  setDetailsConfirmed(true);
                }
              }}
              disabled={!details.title.trim()}
              className="mt-2 w-full px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Details (Enter)
            </button>
          </div>
        )}

        {/* Final Confirmation State */}
        {detailsConfirmed && (
          <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 className="text-gray-800 font-medium mb-1">Ready to create!</h3>
            <p className="text-gray-500 text-sm mb-5">Press Enter to save your reminder</p>
            <button 
              onClick={() => {
                onSave(details);
                onClose();
              }}
              className="w-full px-6 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] active:scale-[0.98]"
            >
              Create Reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
