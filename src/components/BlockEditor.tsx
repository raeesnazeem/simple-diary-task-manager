"use client"

import React, { useEffect, useState } from "react"
import { useDiaryStore } from "../store"
import BlockNode from "./BlockNode"
import { format, parseISO } from "date-fns"
import {
  Clock,
  Image as ImageIcon,
  Music,
  Bookmark,
  Youtube,
  CheckSquare,
  Code,
} from "lucide-react"

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
  const [editedText, setEditedText] = useState<string | null>(null)
  const [editedBlockId, setEditedBlockId] = useState<string | null>(null)

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

    if (mounted && safeActiveDate) {
      const saved = localStorage.getItem(`edited-${safeActiveDate}`)
      setEditedText(saved ? saved : null)
      const savedBlockId = localStorage.getItem(
        `edited-blockId-${safeActiveDate}`,
      )
      setEditedBlockId(savedBlockId ? savedBlockId : null)
    }
  }, [safeActiveDate, mounted, safeData, addBlock])

  const recordEdit = (blockId?: string) => {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    if (safeActiveDate < todayStr) {
      const timeStr = `edited - on ${format(new Date(), "MMM d, yyyy 'and' h:mm a")}`
      localStorage.setItem(`edited-${safeActiveDate}`, timeStr)
      setEditedText(timeStr)
      if (blockId) {
        localStorage.setItem(`edited-blockId-${safeActiveDate}`, blockId)
        setEditedBlockId(blockId)
      }
    }
  }

  if (!mounted)
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    )

  const blocks = safeData[safeActiveDate] || []

  const hasReminder = blocks.some((b) => b.type === "reminder")
  const hasBookmark = false
  const hasImage = blocks.some((b) => b.type === "image")
  const hasAudio = blocks.some((b) => b.type === "audio")
  const hasYoutube = blocks.some((b) => b.type === "video-embed")
  const hasCode = blocks.some((b) => b.type === "code")
  const todoBlocks = blocks.filter((b) => b.type === "todo")
  const hasTodo = todoBlocks.length > 0
  const hasUncheckedTodo = todoBlocks.some((b) => !b.checked)

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
          recordEdit()
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

        <div className="absolute bottom-4 left-0 flex gap-3 pointer-events-none select-none help-mode-icons">
          <div className="relative group/icon">
            <Clock
              size={16}
              strokeWidth={2}
              className={
                hasReminder ? "text-purple-500" : "text-gray-400 opacity-50"
              }
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              Indicates a reminder is set for this date
            </div>
          </div>

          <div className="relative group/icon">
            <ImageIcon
              size={16}
              strokeWidth={2}
              className={
                hasImage ? "text-blue-500" : "text-gray-400 opacity-50"
              }
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              Indicates images are present in the page
            </div>
          </div>

          <div className="relative group/icon">
            <Music
              size={16}
              strokeWidth={2}
              className={hasAudio ? "text-black" : "text-gray-400 opacity-50"}
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              Indicates audio recordings are present in the page
            </div>
          </div>

          <div className="relative group/icon">
            <Bookmark
              size={16}
              strokeWidth={2}
              className={
                hasBookmark ? "text-amber-800" : "text-gray-400 opacity-50"
              }
              fill={hasBookmark ? "currentColor" : "none"}
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              Indicates that the page is bookmarked if highlghted
            </div>
          </div>

          <div className="relative group/icon">
            <Youtube
              size={16}
              strokeWidth={2}
              className={
                hasYoutube ? "text-red-500" : "text-gray-400 opacity-50"
              }
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              Indicates video embeds are present in the page
            </div>
          </div>

          <div className="relative group/icon">
            <CheckSquare
              size={16}
              strokeWidth={2}
              className={
                hasTodo
                  ? hasUncheckedTodo
                    ? "text-yellow-500 animate-scale-pulse"
                    : "text-yellow-500"
                  : "text-gray-400 opacity-50"
              }
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              - Indicates to-do lists are present in the page.
              <br /> - Pulsing indicates there are incomplete items.
              <br /> - Golden Yellow indicates all tasks completed.
            </div>
          </div>

          <div className="relative group/icon">
            <Code
              size={16}
              strokeWidth={2}
              className={
                hasCode ? "text-green-500" : "text-gray-400 opacity-50"
              }
            />
            <div className="hidden group-hover/icon:flex absolute left-0 bottom-full mb-2 bg-white border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-[9999] font-figtree">
              Indicates code snippets are present in the page
            </div>
          </div>
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
        <React.Fragment key={block.id}>
          <BlockNode
            block={block}
            index={index}
            isActive={activeBlockId === block.id}
            onUpdate={(id, updates) => {
              updateBlock(safeActiveDate, id, updates)
              recordEdit(id)
            }}
            onAddBlock={(type, idx, content = "") => {
              addBlock(safeActiveDate, type, content, idx)
              recordEdit()
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
              recordEdit()
              if (index > 0) {
                setActiveBlockId(blocks[index - 1].id)
              }
            }}
            onMergeWithPrev={(idx) => {
              mergeBlockWithPrevious(safeActiveDate, idx)
              recordEdit()
              setActiveBlockId(blocks[idx - 1].id)
            }}
            onFocus={(id) => setActiveBlockId(id)}
            onKeyDownDown={handleKeyDownDown}
            draggedIndex={draggedIndex}
            setDraggedIndex={setDraggedIndex}
            onReorder={(sourceIdx, destIdx) => {
              reorderBlocks(safeActiveDate, sourceIdx, destIdx)
              recordEdit()
            }}
          />
          {editedBlockId === block.id && editedText && (
            <div className="font-figtree text-xs text-amber-700 italic bg-amber-50/80 backdrop-blur-sm py-1 px-3 rounded-full shadow-sm border border-amber-200/60 pointer-events-none select-none self-end -mt-3 mr-4 z-10 transition-all opacity-100">
              {editedText}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
