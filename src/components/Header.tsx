"use client"

import React, { useEffect, useState } from "react"
import { useDiaryStore } from "../store"
import { ChevronLeft, ChevronRight, Cloud, Search, Type } from "lucide-react"
import { format, addDays, subDays, parseISO } from "date-fns"

export default function Header() {
  const {
    activeDate,
    setActiveDate,
    fontFamily,
    setFontFamily,
    viewMode,
    setViewMode,
  } = useDiaryStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePrevDay = () => {
    const prevDate = subDays(parseISO(activeDate), 1)
    setActiveDate(format(prevDate, "yyyy-MM-dd"))
  }

  const handleNextDay = () => {
    const nextDate = addDays(parseISO(activeDate), 1)
    setActiveDate(format(nextDate, "yyyy-MM-dd"))
  }

  const handleToday = () => {
    setActiveDate(format(new Date(), "yyyy-MM-dd"))
  }

  if (!mounted) return null

  const safeActiveDate = activeDate || format(new Date(), "yyyy-MM-dd")
  const displayDate = format(parseISO(safeActiveDate), "EEEE, MMMM do, yyyy")

  return (
    <div className="h-14 w-full border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10 sticky top-0">
      {/* Left: date navigation */}
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
            Turn Pages
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 focus:outline-none"
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center space-x-6">
        {/* Font family picker */}
        <div className="flex items-center space-x-2 text-gray-500">
          <Type size={14} className="opacity-70" />
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="text-xs bg-transparent border-none outline-none font-medium cursor-pointer hover:text-gray-900 transition-colors appearance-none"
          >
            <option value="font-kalam">Kalam</option>
            <option value="font-architects">Architects Daughter</option>
            <option value="font-inter">Inter</option>
            <option value="font-instrument-sans">Instrument Sans</option>
            <option value="font-figtree">Figtree</option>
            <option value="font-urbanist">Urbanist</option>
            <option value="font-instrument-serif">Instrument Serif</option>
            <option value="font-newsreader">Newsreader</option>
            <option value="font-plus-jakarta">Plus Jakarta Sans</option>
            <option value="font-geist-mono">Geist Mono</option>
            <option value="font-charter">Charter</option>
            <option value="font-sn-pro">SN Pro</option>
            <option value="font-caveat">Caveat</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2 text-gray-500">
          <label className="text-xs font-medium">View:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "single" | "double")}
            className="text-xs bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 transition-colors appearance-none"
          >
            <option value="single">Single Page</option>
            <option value="double">Double Page</option>
          </select>
        </div>

        {/* Search shortcut */}
        <button
          className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors group"
          title="Search (Cmd+K)"
        >
          <Search size={16} />
          <span className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 group-hover:bg-gray-200 transition-colors">
            Cmd K
          </span>
        </button>

        {/* Sync status */}
        <div className="flex items-center space-x-2 text-xs text-green-600 font-medium">
          <Cloud size={14} />
          <span>Synced locally</span>
        </div>
      </div>
    </div>
  )
}
