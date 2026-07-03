"use client"

import React, { useEffect, useState, useRef } from "react"
import { useDiaryStore } from "../store"
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  Search,
  Settings,
} from "lucide-react"
import { format, addDays, subDays, parseISO } from "date-fns"

const FONTS = [
  { value: "font-kalam", label: "Kalam" },
  { value: "font-architects", label: "Architects Daughter" },
  { value: "font-figtree", label: "Figtree" },
  { value: "font-urbanist", label: "Urbanist" },
  { value: "font-geist-mono", label: "Geist Mono" },
  { value: "font-sn-pro", label: "SN Pro" },
  { value: "font-caveat", label: "Caveat" },
  { value: "font-patrick-hand", label: "Patrick Hand" },
  { value: "font-handlee", label: "Handlee" },
  { value: "font-shadows-into-light", label: "Shadows Into Light" },
  { value: "font-neucha", label: "Neucha" },
  { value: "font-permanent-marker", label: "Permanent Marker" },
  { value: "font-homemade-apple", label: "Homemade Apple" },
  { value: "font-nanum-pen-script", label: "Nanum Pen Script" },
  { value: "font-indie-flower", label: "Indie Flower" },
  { value: "font-gochi-hand", label: "Gochi Hand" },
]

const LAYOUTS = [
  { value: "single", label: "Single Page" },
  { value: "double", label: "Double Page" },
]

export default function Header() {
  const {
    activeDate,
    setActiveDate,
    fontFamily,
    setFontFamily,
    viewMode,
    setViewMode,
    isRecordingAudio,
    setPendingPageTurn,
    autoSyncEnabled,
    setAutoSyncEnabled,
    data,
  } = useDiaryStore()
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const settingsRef = useRef<HTMLDivElement>(null)
  const originalFontRef = useRef(fontFamily)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && autoSyncEnabled) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        handleManualSync();
      }, 5000); // 5 seconds debounce
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    }
  }, [data, autoSyncEnabled, mounted]);

  const handleManualSync = async () => {
    if (!window.electronAPI || !window.electronAPI.syncToDrive) return;
    setIsSyncing(true);
    setSyncStatus("syncing");
    try {
      const res = await window.electronAPI.syncToDrive();
      if (res.success) {
        setSyncStatus("success");
      } else {
        console.error("Sync error:", res.error);
        setSyncStatus("error");
      }
    } catch (e) {
      console.error("Sync caught error:", e);
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const handleDateChange = (newDate: string) => {
    if (isRecordingAudio) {
      setPendingPageTurn(newDate)
    } else {
      setActiveDate(newDate)
    }
  }

  const handlePrevDay = () => {
    const prevDate = subDays(parseISO(activeDate), 1)
    handleDateChange(format(prevDate, "yyyy-MM-dd"))
  }

  const handleNextDay = () => {
    const nextDate = addDays(parseISO(activeDate), 1)
    handleDateChange(format(nextDate, "yyyy-MM-dd"))
  }

  const handleToday = () => {
    handleDateChange(format(new Date(), "yyyy-MM-dd"))
  }

  if (!mounted) return null

  return (
    <div className="h-14 w-full border-b border-gray-200 bg-[#F9F9FB]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 shadow-sm z-10 sticky top-0" style={{ minHeight: '64px' }}>
      {/* Left: date navigation */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-50 rounded-md overflow-hidden">
          <div
            className="px-3 py-1.5 flex items-center justify-center"
            style={{
              color: "#1C1C1E",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-1.5px",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            itsNoted
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                verticalAlign: "super",
                color: "#54AFEC",
                letterSpacing: "0.5px",
                marginLeft: "3px",
                textTransform: "uppercase",
              }}
            >
              app
            </span>
          </div>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center space-x-6" style={{ transform: 'scale(1.1)', transformOrigin: 'right center' }}>
        {/* Search shortcut */}
        <button
          className="flex items-center text-gray-400 hover:text-gray-600 transition-all duration-200 group h-7"
          title="Search (Cmd+F)"
        >
          <Search size={16} className="group-hover:scale-110 transition-transform duration-200" />
        </button>

        {/* Sync Controls Group */}
        <div className="flex items-center space-x-2">
          {/* Sync status */}
          <div className="flex items-center space-x-1.5 text-[11px] text-green-600 font-medium bg-green-50/80 px-3 h-7 rounded-full border border-green-300 shadow-sm">
            <Cloud size={14} className="text-green-500" />
            <span>Synced locally</span>
          </div>
          
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center space-x-1.5 text-[11px] font-semibold px-3 h-7 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.05)] border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
              syncStatus === "success" 
                ? "bg-green-50 border-green-400 text-green-700" 
                : syncStatus === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <Cloud size={14} className={isSyncing ? "animate-pulse" : ""} />
            <span>
              {syncStatus === "syncing" ? "Syncing..." : syncStatus === "success" ? "Synced to Drive!" : syncStatus === "error" ? "Sync Failed" : "Sync to Google Drive"}
            </span>
          </button>
        </div>

        {/* Settings Dropdown */}
        <div className="relative flex items-center h-7">
          <button
            onClick={() => {
              if (!showSettings) {
                originalFontRef.current = fontFamily
              }
              setShowSettings(!showSettings)
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${showSettings ? "bg-gray-200 text-gray-900 shadow-inner" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
            title="Settings"
          >
            <Settings size={16} />
          </button>

          {showSettings && (
            <>
              {/* Transparent overlay for click-outside that doesn't break native OS selects */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  if (originalFontRef.current) {
                    setFontFamily(originalFontRef.current)
                  }
                  setShowSettings(false)
                }}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-1 px-2 py-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Typography
                  </span>
                  <div
                    className="max-h-36 overflow-y-auto custom-scrollbar flex flex-col rounded-md border border-gray-100 bg-gray-50 p-1 gap-0.5"
                    onMouseLeave={() => {
                      if (originalFontRef.current) {
                        setFontFamily(originalFontRef.current)
                      }
                    }}
                  >
                    {FONTS.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => {
                          originalFontRef.current = font.value
                          setFontFamily(font.value)
                          setShowSettings(false) // Optionally auto-close on selection
                        }}
                        onMouseEnter={() => {
                          setFontFamily(font.value)
                        }}
                        className={`text-left text-xs px-2 py-1.5 rounded-sm hover:bg-gray-200/60 transition-colors ${fontFamily === font.value ? "bg-white shadow-sm font-semibold text-gray-900 border border-gray-200" : "text-gray-600 border border-transparent"}`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-1 w-full" />

                <div className="flex flex-col gap-1 px-2 py-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Layout
                  </span>
                  <div className="flex flex-col rounded-md border border-gray-100 bg-gray-50 p-1 gap-0.5">
                    {LAYOUTS.map((layout) => (
                      <button
                        key={layout.value}
                        onClick={() => {
                          setViewMode(layout.value as "single" | "double")
                          setShowSettings(false)
                        }}
                        className={`text-left text-xs px-2 py-1.5 rounded-sm hover:bg-gray-200/60 transition-colors ${viewMode === layout.value ? "bg-white shadow-sm font-semibold text-gray-900 border border-gray-200" : "text-gray-600 border border-transparent"}`}
                      >
                        {layout.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-1 w-full" />

                <div className="flex flex-col gap-1 px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Auto Save to Drive
                    </span>
                    <button 
                      onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${autoSyncEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoSyncEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
