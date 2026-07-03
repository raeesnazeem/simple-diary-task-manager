"use client"

import React, { useEffect, useState } from "react"
import { useDiaryStore } from "../store"
import BlockNode from "./BlockNode"
import { format, parseISO } from "date-fns"

interface BlockEditorProps {
  date?: string // If provided, renders this date instead of activeDate
}

export default function BlockEditor({ date: dateProp }: BlockEditorProps = {}) {
  const {
    data,
    activeDate,
    fontFamily,
    addBlock,
    updateBlock,
    deleteBlock,
    mergeBlockWithPrevious,
    reorderBlocks,
    activeBlockId,
    setActiveBlockId,
  } = useDiaryStore()
  const [mounted, setMounted] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const safeData = data || {}
  const safeActiveDate =
    dateProp || activeDate || new Date().toISOString().split("T")[0]

  useEffect(() => {
    setMounted(true)
    // Ensure at least one block exists for the active date
    if (
      mounted &&
      (!safeData[safeActiveDate] || safeData[safeActiveDate].length === 0)
    ) {
      addBlock(safeActiveDate, "text")
    }
  }, [safeActiveDate, mounted, safeData, addBlock])

  if (!mounted)
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    )

  const blocks = safeData[safeActiveDate] || []

  const handleKeyDownDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault()
      setActiveBlockId(blocks[index - 1].id)
    } else if (e.key === "ArrowDown" && index < blocks.length - 1) {
      e.preventDefault()
      setActiveBlockId(blocks[index + 1].id)
    }
  }

  const dateObj = parseISO(safeActiveDate)
  const dayOfMonth = format(dateObj, "dd")
  const monthYear = format(dateObj, "MMMM yyyy")
  const dayOfWeek = format(dateObj, "EEEE")

  return (
    <div
      className={`flex flex-col gap-1 pb-32 relative min-h-full ${fontFamily}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1]
            if (lastBlock.type === "text" && !lastBlock.content) {
              setActiveBlockId(lastBlock.id)
              return
            }
          }
          addBlock(safeActiveDate, "text")
          setTimeout(() => {
            const newBlocks = useDiaryStore.getState().data[safeActiveDate]
            if (newBlocks && newBlocks.length > 0) {
              setActiveBlockId(newBlocks[newBlocks.length - 1].id)
            }
          }, 0)
        }
      }}
    >
      <div className="sticky top-0 z-10 relative pointer-events-none -mt-4 md:-mt-6 lg:-mt-8 mb-6">
        <div className="absolute -top-6 md:-top-8 lg:-top-8 -left-10 md:-left-14 lg:-left-16 -right-10 md:-right-14 lg:-right-16 bottom-0 bg-[#fdfbf7]/80 backdrop-blur-md border-b border-gray-200 shadow-sm -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.avif')] bg-repeat opacity-15 pointer-events-none" />
        </div>
        <div
          className="absolute top-0 left-0 pointer-events-none select-none"
          style={{
            opacity: 0.3,
            transform: "scale(0.6)",
            transformOrigin: "top left",
            color: "#1C1C1E",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-1.5px",
            lineHeight: 1,
            textShadow:
              "1px 1px 1px rgba(255,255,255,0.8), -1px -1px 1px rgba(0,0,0,0.1)",
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
        <div className="flex flex-col items-end pb-4 pr-2 select-none font-sans pointer-events-none">
          <div className="text-6xl font-black text-gray-800 leading-none tracking-wide">
            {dayOfMonth}
          </div>
          <div className="text-md font-normal text-gray-600">{monthYear}</div>
          <div className="text-xs font-light text-gray-400 Capitalize">
            {dayOfWeek}
          </div>
        </div>
      </div>
      {blocks.map((block, index) => (
        <BlockNode
          key={block.id}
          block={block}
          index={index}
          isActive={activeBlockId === block.id}
          onUpdate={(id, updates) => updateBlock(safeActiveDate, id, updates)}
          onAddBlock={(type, idx, content = "") => {
            addBlock(safeActiveDate, type, content, idx)
            // We can't immediately set activeBlockId because the block isn't rendered yet,
            // but it'll be handled by the effect inside BlockNode ideally, or by relying on tab order.
            // For a perfect implementation, we'd wait for render and focus.
            setTimeout(() => {
              const newBlocks = useDiaryStore.getState().data[safeActiveDate]
              if (newBlocks && newBlocks[idx])
                setActiveBlockId(newBlocks[idx].id)
            }, 0)
          }}
          onDelete={(id) => {
            deleteBlock(safeActiveDate, id)
            if (index > 0) {
              setActiveBlockId(blocks[index - 1].id)
            }
          }}
          onMergeWithPrev={(idx) => {
            mergeBlockWithPrevious(safeActiveDate, idx)
            setActiveBlockId(blocks[idx - 1].id)
          }}
          onFocus={(id) => setActiveBlockId(id)}
          onKeyDownDown={handleKeyDownDown}
          draggedIndex={draggedIndex}
          setDraggedIndex={setDraggedIndex}
          onReorder={(sourceIdx, destIdx) =>
            reorderBlocks(safeActiveDate, sourceIdx, destIdx)
          }
        />
      ))}
    </div>
  )
}
