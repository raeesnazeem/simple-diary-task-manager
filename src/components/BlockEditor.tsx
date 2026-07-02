"use client";

import React, { useEffect, useState } from 'react';
import { useDiaryStore } from '../store';
import BlockNode from './BlockNode';

export default function BlockEditor() {
  const { data, activeDate, addBlock, updateBlock, deleteBlock, mergeBlockWithPrevious } = useDiaryStore();
  const [mounted, setMounted] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Ensure at least one block exists for the active date
    if (mounted && (!data[activeDate] || data[activeDate].length === 0)) {
      addBlock(activeDate, 'text');
    }
  }, [activeDate, mounted, data, addBlock]);

  if (!mounted) return <div className="animate-pulse space-y-4">
     <div className="h-6 bg-gray-200 rounded w-1/4"></div>
     <div className="h-4 bg-gray-200 rounded w-full"></div>
     <div className="h-4 bg-gray-200 rounded w-full"></div>
  </div>;

  const blocks = data[activeDate] || [];

  const handleKeyDownDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      setActiveBlockId(blocks[index - 1].id);
    } else if (e.key === 'ArrowDown' && index < blocks.length - 1) {
      e.preventDefault();
      setActiveBlockId(blocks[index + 1].id);
    }
  };

  return (
    <div className="flex flex-col gap-1 pb-32">
      {blocks.map((block, index) => (
        <BlockNode
          key={block.id}
          block={block}
          index={index}
          isActive={activeBlockId === block.id}
          onUpdate={(id, updates) => updateBlock(activeDate, id, updates)}
          onAddBlock={(type, idx) => {
             addBlock(activeDate, type, '', idx);
             // We can't immediately set activeBlockId because the block isn't rendered yet,
             // but it'll be handled by the effect inside BlockNode ideally, or by relying on tab order.
             // For a perfect implementation, we'd wait for render and focus.
             setTimeout(() => {
                const newBlocks = useDiaryStore.getState().data[activeDate];
                if(newBlocks && newBlocks[idx]) setActiveBlockId(newBlocks[idx].id);
             }, 0);
          }}
          onDelete={(id) => {
             deleteBlock(activeDate, id);
             if (index > 0) {
                setActiveBlockId(blocks[index - 1].id);
             }
          }}
          onMergeWithPrev={(idx) => {
             mergeBlockWithPrevious(activeDate, idx);
             setActiveBlockId(blocks[idx - 1].id);
          }}
          onFocus={(id) => setActiveBlockId(id)}
          onKeyDownDown={handleKeyDownDown}
        />
      ))}
    </div>
  );
}
