"use client";

import Header from "../src/components/Header"
import BlockEditor from "../src/components/BlockEditor"
import PageWithTurn from "../src/components/PageWithTurn"
import GlobalSearch from "../src/components/GlobalSearch"
import { useDiaryStore } from "../src/store"
import { format, addDays, subDays, parseISO } from "date-fns"
import { useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react"

export default function Home() {
  const { viewMode, activeDate, setActiveDate, isRecordingAudio, setPendingPageTurn, setActiveBlockId } = useDiaryStore();

  const safeActiveDate = activeDate || format(new Date(), 'yyyy-MM-dd');
  const nextDate = format(addDays(parseISO(safeActiveDate), 1), 'yyyy-MM-dd');

  // Delay the left page update so it doesn't change until the right page's turn animation finishes
  const [delayedLeftDate, setDelayedLeftDate] = useState(safeActiveDate);
  const prevDateRef = useRef(safeActiveDate);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);

  const scrollLeftBy = (amount: number) => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  const handleDateChange = (newDate: string) => {
    if (isRecordingAudio) {
      setPendingPageTurn(newDate);
    } else {
      setActiveDate(newDate);
    }
  };

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
        setActiveBlockId(null);
        return;
      }

      if (isInput) return;

      if (e.key === 'ArrowRight') {
        handleDateChange(format(addDays(parseISO(safeActiveDate), viewMode === 'double' ? 2 : 1), 'yyyy-MM-dd'));
      } else if (e.key === 'ArrowLeft') {
        handleDateChange(format(subDays(parseISO(safeActiveDate), viewMode === 'double' ? 2 : 1), 'yyyy-MM-dd'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeActiveDate, setActiveDate, isRecordingAudio, setPendingPageTurn, viewMode]);

  return (
    <div 
      className="flex h-screen flex-col bg-[#f5f5f5] overflow-hidden relative"
      onClick={(e) => {
        // Blur active element if clicking outside the paper canvas (e.g. on the grey background)
        if (!(e.target as HTMLElement).closest('.paper-canvas')) {
          (document.activeElement as HTMLElement)?.blur();
          setActiveBlockId(null);
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
          <main className="flex-1 overflow-hidden w-full py-12 px-4 flex items-center justify-center relative group" style={{ overflow: 'auto' }}>
            <button
              onClick={() => handleDateChange(format(subDays(parseISO(safeActiveDate), 1), 'yyyy-MM-dd'))}
              className="absolute left-8 p-4 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-gray-800 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20"
              title="Previous Day"
            >
              <ChevronLeft size={32} />
            </button>
            <PageWithTurn
              date={safeActiveDate}
              className="w-full max-w-3xl h-[85vh] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.10)]"
              style={{ minWidth: '768px', minHeight: '1105px', maxWidth: '768px', maxHeight: '1105px', flexShrink: 0 }}
              contentClassName="paper-canvas p-10 md:p-16 lg:p-20 overflow-y-auto h-full w-full rounded-[inherit]"
            />
            <button
              onClick={() => handleDateChange(format(addDays(parseISO(safeActiveDate), 1), 'yyyy-MM-dd'))}
              className="absolute right-8 p-4 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-gray-800 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20"
              title="Next Day"
            >
              <ChevronRight size={32} />
            </button>
          </main>
        ) : (
          <main className="flex-1 overflow-hidden w-full py-10 px-8 flex items-center justify-center relative group" style={{ overflow: 'auto' }}>
            <button
              onClick={() => handleDateChange(format(subDays(parseISO(safeActiveDate), 2), 'yyyy-MM-dd'))}
              className="absolute left-8 p-4 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-gray-800 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20"
              title="Previous Day"
            >
              <ChevronLeft size={32} />
            </button>
            {/* Book wrapper — two pages joined at center */}
            <div
              className="flex w-[95vw] max-w-[1600px] h-[85vh] rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
                minWidth: '1536px', minHeight: '1105px', maxWidth: '1536px', maxHeight: '1105px', flexShrink: 0
              }}
            >
              {/* Left page — active date (no animation, just swaps) */}
              <div className="flex-1 relative group overflow-hidden" style={{ borderRadius: '0.75rem 0 0 0.75rem' }}>
                {/* ── Scroll Overlays ─────────────────────────────────────────── */}
                <div className="absolute top-0 left-0 right-0 h-[25%] z-20 flex items-start justify-center pt-8 opacity-0 hover:opacity-100 hover:bg-gradient-to-b from-black/[0.04] to-transparent transition-all duration-150 pointer-events-none">
                  <button
                    onClick={() => scrollLeftBy(-400)}
                    className="p-3 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] text-gray-600 hover:text-black hover:bg-gray-50 hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all pointer-events-auto"
                  >
                    <ChevronUp size={28} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[25%] z-20 flex items-end justify-center pb-8 opacity-0 hover:opacity-100 hover:bg-gradient-to-t from-black/[0.04] to-transparent transition-all duration-150 pointer-events-none">
                  <button
                    onClick={() => scrollLeftBy(400)}
                    className="p-3 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] text-gray-600 hover:text-black hover:bg-gray-50 hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all pointer-events-auto"
                  >
                    <ChevronDown size={28} strokeWidth={2.5} />
                  </button>
                </div>

                <div
                  ref={leftScrollRef}
                  key={delayedLeftDate}
                  className="paper-canvas relative p-10 md:p-14 lg:p-16 overflow-y-auto animate-quick-fade h-full w-full no-scrollbar"
                >
                  <BlockEditor date={delayedLeftDate} />
                </div>
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
                className="flex-1 h-[85vh]"
                contentClassName="paper-canvas p-10 md:p-14 lg:p-16 overflow-y-auto h-full w-full"
                style={{ borderRadius: '0 0.75rem 0.75rem 0', height: '100%' }}
              />
            </div>
            <button
              onClick={() => handleDateChange(format(addDays(parseISO(safeActiveDate), 2), 'yyyy-MM-dd'))}
              className="absolute right-8 p-4 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-gray-800 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-20"
              title="Next Day"
            >
              <ChevronRight size={32} />
            </button>
          </main>
        )}
      </div>

      <GlobalSearch />
    </div>
  )
}
