"use client";

import Header from "../src/components/Header"
import BlockEditor from "../src/components/BlockEditor"
import PageWithTurn from "../src/components/PageWithTurn"
import GlobalSearch from "../src/components/GlobalSearch"
import { useDiaryStore } from "../src/store"
import { format, addDays, subDays, parseISO } from "date-fns"
import { useEffect, useState, useRef } from "react"

export default function Home() {
  const { viewMode, activeDate, setActiveDate } = useDiaryStore();

  const safeActiveDate = activeDate || format(new Date(), 'yyyy-MM-dd');
  const nextDate = format(addDays(parseISO(safeActiveDate), 1), 'yyyy-MM-dd');

  // Delay the left page update so it doesn't change until the right page's turn animation finishes
  const [delayedLeftDate, setDelayedLeftDate] = useState(safeActiveDate);
  const prevDateRef = useRef(safeActiveDate);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (safeActiveDate === prevDateRef.current) return;

    const isForward = parseISO(safeActiveDate) > parseISO(prevDateRef.current);
    prevDateRef.current = safeActiveDate;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isForward) {
      // Forward: wait for right page to land (600ms) before updating left
      timerRef.current = setTimeout(() => {
        setDelayedLeftDate(safeActiveDate);
      }, 600); // Matches TURN_DURATION in PageWithTurn.tsx
    } else {
      // Backward: update left immediately so it's ready when the page lifts off it
      setDelayedLeftDate(safeActiveDate);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [safeActiveDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an editor, input, or textarea
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true' ||
        activeEl.tagName === 'SELECT'
      );

      if (e.key === 'Escape') {
        if (isInput) {
          (activeEl as HTMLElement).blur();
        }
        return;
      }

      if (isInput) return;

      if (e.key === 'ArrowRight') {
        setActiveDate(format(addDays(parseISO(safeActiveDate), 1), 'yyyy-MM-dd'));
      } else if (e.key === 'ArrowLeft') {
        setActiveDate(format(subDays(parseISO(safeActiveDate), 1), 'yyyy-MM-dd'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeActiveDate, setActiveDate]);

  return (
    <div 
      className="flex h-screen flex-col bg-[#f5f5f5] overflow-hidden relative"
      onClick={(e) => {
        // Blur active element if clicking outside the paper canvas (e.g. on the grey background)
        if (!(e.target as HTMLElement).closest('.paper-canvas')) {
          (document.activeElement as HTMLElement)?.blur();
        }
      }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundRepeat: "repeat",
          backgroundSize: "35%",
          opacity: 0.075,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <Header />

        {viewMode === 'single' ? (
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full py-12 px-4 scroll-smooth">
            <PageWithTurn
              date={safeActiveDate}
              className="mx-auto w-full max-w-6xl paper-canvas min-h-[85vh] rounded-xl"
              contentClassName="p-10 md:p-16 lg:p-20"
            />
          </main>
        ) : (
          <main className="flex-1 overflow-hidden w-full py-10 px-8 flex items-start justify-center">
            {/* Book wrapper — two pages joined at center */}
            <div
              className="flex w-[95vw] max-w-[1600px] min-h-[85vh] rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              }}
            >
              {/* Left page — active date (no animation, just swaps) */}
              <div
                key={delayedLeftDate}
                className="flex-1 paper-canvas relative p-10 md:p-14 lg:p-16 overflow-y-auto animate-quick-fade"
                style={{ borderRadius: '0.75rem 0 0 0.75rem' }}
              >
                <BlockEditor date={delayedLeftDate} />
              </div>

              {/* Realistic Center Crease / Spine Shadow */}
              <div
                className="w-16 flex-shrink-0 -mx-8 z-10 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.02) 80%, transparent)',
                }}
              />

              {/* Right page — next day (page-turn animation) */}
              <PageWithTurn
                date={nextDate}
                className="flex-1 paper-canvas"
                contentClassName="p-10 md:p-14 lg:p-16"
                style={{ borderRadius: '0 0.75rem 0.75rem 0' }}
              />
            </div>
          </main>
        )}
      </div>

      <GlobalSearch />
    </div>
  )
}
