"use client";

import React, { useState, useEffect, useRef } from 'react';
import BlockEditor from './BlockEditor';
import { parseISO } from 'date-fns';

interface PageWithTurnProps {
  /** The date this page should display */
  date: string;
  /** Outer wrapper classes (sizing, flex, paper-canvas, border-radius, etc.) */
  className?: string;
  /** Inner content padding classes — duplicated onto the turning-page front face */
  contentClassName?: string;
  style?: React.CSSProperties;
}

const TURN_DURATION = 600; // ms — slow enough to read the fold, fast enough to feel snappy
const EASING = 'cubic-bezier(0.645, 0.045, 0.355, 1.0)'; // ease-in-out-cubic

/**
 * Realistic page-turn wrapper for a diary page.
 *
 * When `date` changes the component renders three layers:
 *  1.  Base layer  — the NEW content, always visible underneath.
 *  2.  Shadow      — a fold-crease gradient that sweeps across the base.
 *  3.  Turning page — the OLD content with a visible paper back-face,
 *                     rotating 0→-180° around the left (spine) edge.
 *
 * For backward navigation the roles are swapped (new content folds in from left).
 */
export default function PageWithTurn({
  date,
  className = '',
  contentClassName = 'p-10 md:p-14 lg:p-16',
  style,
}: PageWithTurnProps) {
  // The date rendered into the base (stationary) layer
  const [visibleDate, setVisibleDate] = useState(date);
  // The date rendered onto the turning page overlay (null when idle)
  const [turningDate, setTurningDate] = useState<string | null>(null);
  const [isTurning, setIsTurning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const prevDateRef = useRef(date);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Trigger animation when `date` prop changes ────────────────────── */
  useEffect(() => {
    if (date === prevDateRef.current) return;

    // Play page turn sound
    const audio = new Audio('/page-turn.mp3');
    audio.playbackRate = 1.5;
    audio.currentTime = 0.5;
    audio.play().catch((e) => console.log('Audio play failed:', e));

    const dir =
      parseISO(date) >= parseISO(prevDateRef.current) ? 'next' : 'prev';
    const oldDate = prevDateRef.current;
    prevDateRef.current = date;

    // Cancel any in-flight turn (rapid clicks)
    if (timerRef.current) clearTimeout(timerRef.current);

    setDirection(dir);

    if (dir === 'next') {
      // Forward: old content folds away, new content visible underneath
      setVisibleDate(date);     // base = new
      setTurningDate(oldDate);  // overlay = old, rotates 0 → -180°
    } else {
      // Backward: new content folds in from left
      setVisibleDate(oldDate);  // base = old (will be covered)
      setTurningDate(date);     // overlay = new, rotates -180° → 0°
    }

    setIsTurning(true);

    timerRef.current = setTimeout(() => {
      setIsTurning(false);
      setTurningDate(null);
      setVisibleDate(date);
    }, TURN_DURATION);
  }, [date]);

  // Clean up on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  /* ── Derived animation names ───────────────────────────────────────── */
  const rotateAnim =
    direction === 'next' ? 'pageTurnForward' : 'pageTurnBackward';
  const shadowAnim =
    direction === 'next' ? 'shadowSweepForward' : 'shadowSweepBackward';

  return (
    <div
      className={`${className} relative`}
      style={{ ...style, perspective: '2000px' }}
    >
      {/* ── Base page (always visible) ──────────────────────────────── */}
      <div className={`relative z-[1] ${contentClassName}`}>
        <BlockEditor date={visibleDate} />
      </div>

      {/* ── Animation layers (only while turning) ───────────────────── */}
      {isTurning && turningDate && (
        <>
          {/* 1 · Subtle overall dim on the base page */}
          <div
            className="absolute inset-0 z-[2] pointer-events-none rounded-[inherit]"
            style={{
              background: 'rgba(0,0,0,0.06)',
              animation: `baseDim ${TURN_DURATION}ms ease-in-out forwards`,
            }}
          />

          {/* 2 · Moving fold-crease shadow on the base page */}
          <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden rounded-[inherit]">
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '200%',
                background: `linear-gradient(to right,
                  transparent 0%,
                  rgba(0,0,0,0.01) 30%,
                  rgba(0,0,0,0.06) 44%,
                  rgba(0,0,0,0.14) 48%,
                  rgba(0,0,0,0.20) 50%,
                  rgba(0,0,0,0.14) 52%,
                  rgba(0,0,0,0.06) 56%,
                  rgba(0,0,0,0.01) 70%,
                  transparent 100%
                )`,
                animation: `${shadowAnim} ${TURN_DURATION}ms ${EASING} forwards`,
              }}
            />
          </div>

          {/* 3 · The turning page (3D, with front + back faces) */}
          <div
            className="absolute inset-0 z-[5]"
            style={{
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              animation: `${rotateAnim} ${TURN_DURATION}ms ${EASING} forwards`,
            }}
          >
            {/* Front face — shows diary content */}
            <div
              className={`absolute inset-0 paper-canvas overflow-hidden rounded-[inherit] ${contentClassName}`}
              style={{
                backfaceVisibility: 'hidden',
                // Subtle shadow on the lifting edge
                boxShadow: '-2px 0 8px rgba(0,0,0,0.06)',
              }}
            >
              <BlockEditor date={turningDate} />
            </div>

            {/* Back face — paper texture with fold shadow */}
            <div
              className="absolute inset-0 rounded-[inherit]"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: `linear-gradient(
                  to right,
                  #e8e3da 0%,
                  #efe9e1 4%,
                  #f4efe7 12%,
                  #f2ede5 50%,
                  #efebe3 88%,
                  #ece7df 96%,
                  #e8e3da 100%
                )`,
                // Inner fold shadow — darkest at the spine (left edge)
                boxShadow:
                  'inset 8px 0 20px -4px rgba(0,0,0,0.14),' +
                  'inset 2px 0 6px rgba(0,0,0,0.08),' +
                  '4px 0 16px rgba(0,0,0,0.10)',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
