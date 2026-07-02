"use client"

import React, { useEffect, useState } from "react"
import { useDiaryStore } from "../store"
import BlockNode from "./BlockNode"
import { format, parseISO } from "date-fns"

interface BlockEditorProps {
  date?: string; // If provided, renders this date instead of activeDate
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
  } = useDiaryStore()
  const [mounted, setMounted] = useState(false)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  const safeData = data || {}
  const safeActiveDate = dateProp || activeDate || new Date().toISOString().split("T")[0]

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
    <div className={`flex flex-col gap-1 pb-32 relative ${fontFamily}`}>
      <div className="flex flex-col items-end mb-10 pr-2 select-none font-sans">
        <div className="text-6xl font-black text-gray-800 leading-none tracking-wide">
          {dayOfMonth}
        </div>
        <div className="text-md font-normal text-gray-600">{monthYear}</div>
        <div className="text-xs font-light text-gray-400 Capitalize">
          {dayOfWeek}
        </div>
      </div>
      {blocks.map((block, index) => (
        <BlockNode
          key={block.id}
          block={block}
          index={index}
          isActive={activeBlockId === block.id}
          onUpdate={(id, updates) => updateBlock(activeDate, id, updates)}
          onAddBlock={(type, idx, content = "") => {
            addBlock(activeDate, type, content, idx)
            // We can't immediately set activeBlockId because the block isn't rendered yet,
            // but it'll be handled by the effect inside BlockNode ideally, or by relying on tab order.
            // For a perfect implementation, we'd wait for render and focus.
            setTimeout(() => {
              const newBlocks = useDiaryStore.getState().data[activeDate]
              if (newBlocks && newBlocks[idx])
                setActiveBlockId(newBlocks[idx].id)
            }, 0)
          }}
          onDelete={(id) => {
            deleteBlock(activeDate, id)
            if (index > 0) {
              setActiveBlockId(blocks[index - 1].id)
            }
          }}
          onMergeWithPrev={(idx) => {
            mergeBlockWithPrevious(activeDate, idx)
            setActiveBlockId(blocks[idx - 1].id)
          }}
          onFocus={(id) => setActiveBlockId(id)}
          onKeyDownDown={handleKeyDownDown}
        />
      ))}
    </div>
  )
}
