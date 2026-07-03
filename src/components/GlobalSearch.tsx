"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDiaryStore } from '../store';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SearchResult {
  date: string;
  blockId: string;
  content: string;
  type: string;
  timestamp: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data, setActiveDate } = useDiaryStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const foundResults: SearchResult[] = [];
    const safeData = data || {};

    Object.entries(safeData).forEach(([dateString, blocks]) => {
      blocks.forEach(block => {
        if (block.content && block.content.toLowerCase().includes(searchQuery)) {
          foundResults.push({
            date: dateString,
            blockId: block.id,
            content: block.content,
            type: block.type,
            timestamp: block.timestamp
          });
        }
      });
    });

    // Sort by date descending
    foundResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setResults(foundResults);
    setSelectedIndex(0);
  }, [query, data]);

  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleNavigation);
    }
    return () => document.removeEventListener('keydown', handleNavigation);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    setActiveDate(result.date);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] font-figtree">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <Search size={20} className="text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-lg"
            placeholder="Search all entries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs font-medium text-gray-400 border border-gray-200 bg-white px-1.5 py-0.5 rounded shadow-sm shrink-0">
            ESC
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length > 0 && results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="py-2">
              {results.map((result, index) => {
                const isSelected = index === selectedIndex;
                const formattedDate = format(parseISO(result.date), 'MMM d, yyyy');

                return (
                  <li
                    key={result.blockId}
                    className={`px-4 py-3 cursor-pointer flex flex-col gap-1 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <Calendar size={12} />
                        <span>{formattedDate}</span>
                        <ChevronRight size={12} className="text-gray-300" />
                        <span className="text-gray-400">{result.timestamp}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                        {result.type}
                      </div>
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-2">
                      {/* Basic highlighting could be added here */}
                      {result.content}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
