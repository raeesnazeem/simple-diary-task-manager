"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Block, BlockType } from '../types';
import { CheckSquare, Square, GripVertical, Plus } from 'lucide-react';
import BlockControls from './BlockControls';
import SlashMenu from './SlashMenu';

interface BlockNodeProps {
  block: Block;
  index: number;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onAddBlock: (type: BlockType, index: number) => void;
  onDelete: (id: string) => void;
  onMergeWithPrev: (index: number) => void;
  onFocus: (id: string) => void;
  onKeyDownDown: (e: React.KeyboardEvent, index: number) => void;
}

export default function BlockNode({
  block,
  index,
  isActive,
  onUpdate,
  onAddBlock,
  onDelete,
  onMergeWithPrev,
  onFocus,
  onKeyDownDown
}: BlockNodeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');

  useEffect(() => {
    if (isActive && contentRef.current) {
      // Focus and place cursor at end
      contentRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isActive]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';

    // Slash menu logic
    const lastSlashIndex = text.lastIndexOf('/');
    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || text[lastSlashIndex - 1] === ' ' || text[lastSlashIndex - 1] === '\n')) {
      setShowSlashMenu(true);
      setSlashSearch(text.slice(lastSlashIndex + 1));
    } else {
      setShowSlashMenu(false);
    }

    onUpdate(block.id, { content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';

    // Check if cursor is at the beginning
    const isAtStart = window.getSelection()?.focusOffset === 0;

    if (e.key === 'Enter') {
      e.preventDefault();

      if (showSlashMenu) {
         // Let SlashMenu handle it
         return;
      }

      // If we're an empty non-text block and hit enter, convert to text
      if (block.type !== 'text' && text === '') {
        onUpdate(block.id, { type: 'text' });
        return;
      }

      // Default: create new text block below
      // If it's a list/todo, might want to continue list type
      const nextType = block.type === 'todo' ? 'todo' : 'text';
      onAddBlock(nextType, index + 1);
      setShowSlashMenu(false);
    } else if (e.key === 'Backspace' && isAtStart) {
      if (text === '') {
        e.preventDefault();
        if (block.type !== 'text') {
           onUpdate(block.id, { type: 'text' });
        } else {
           onDelete(block.id);
        }
      } else if (index > 0) {
        e.preventDefault();
        onMergeWithPrev(index);
      }
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    } else {
      onKeyDownDown(e, index);
    }
  };

  const selectSlashItem = (type: BlockType) => {
    const text = contentRef.current?.textContent || '';
    const lastSlashIndex = text.lastIndexOf('/');
    const newText = text.slice(0, lastSlashIndex);

    onUpdate(block.id, {
      type,
      content: newText
    });

    if (contentRef.current) {
      contentRef.current.textContent = newText;
    }
    setShowSlashMenu(false);
  };

  const toggleTodo = () => {
    onUpdate(block.id, { checked: !block.checked });
  };

  // Type-specific styles
  const typeStyles = {
    'text': 'text-xl leading-relaxed',
    'heading-1': 'text-4xl font-bold mt-6 mb-2',
    'heading-2': 'text-3xl font-semibold mt-5 mb-2',
    'heading-3': 'text-2xl font-medium mt-4 mb-2',
    'todo': 'text-xl flex-1',
    'image': 'text-xl text-gray-400 italic' // Mock image block
  };

  const alignStyles = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  };

  const colorStyles = {
    'default': 'text-gray-900',
    'gray': 'text-gray-500',
    'red': 'text-red-600',
    'blue': 'text-blue-600',
    'green': 'text-green-600'
  };

  const sizeStyles = {
    'small': 'text-lg',
    'medium': '',
    'large': 'text-2xl'
  };

  return (
    <div className="group relative flex items-start -ml-12 pl-12 pr-4 py-1 hover:bg-gray-50/50 rounded-lg transition-colors font-caveat">
      {/* Absolute Timestamp margin */}
      <div className="absolute left-0 top-3 text-[10px] text-gray-300 font-inter opacity-0 group-hover:opacity-100 transition-opacity select-none w-10 text-right pr-2">
        {block.timestamp}
      </div>

      {/* Block Controls Margin */}
      <div className="absolute left-6 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
        <button
          className="text-gray-300 hover:text-gray-600 cursor-grab"
          title="Drag to move"
        >
          <GripVertical size={16} />
        </button>
        <button
          className="text-gray-300 hover:text-gray-600"
          onClick={() => onAddBlock('text', index + 1)}
          title="Add block below"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 min-w-0 relative flex items-start gap-2 pt-1">
        {block.type === 'todo' && (
          <button
            className="mt-1.5 text-gray-500 hover:text-gray-800 focus:outline-none shrink-0"
            onClick={toggleTodo}
          >
            {block.checked ? <CheckSquare size={20} className="text-gray-400" /> : <Square size={20} />}
          </button>
        )}

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className={`outline-none w-full min-h-[1.5em] break-words whitespace-pre-wrap
            ${typeStyles[block.type]}
            ${alignStyles[block.align || 'left']}
            ${colorStyles[block.color || 'default']}
            ${block.type !== 'heading-1' && block.type !== 'heading-2' && block.type !== 'heading-3' ? sizeStyles[block.size || 'medium'] : ''}
            ${block.checked && block.type === 'todo' ? 'line-through text-gray-400' : ''}
          `}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus(block.id)}
          data-placeholder={block.type === 'text' ? "Type '/' for commands" : block.type.replace('-', ' ')}
        >
          {/* Only render content initially if it exists and we're not active,
              otherwise react might fight with contentEditable */}
          {block.content}
        </div>

        {isActive && (
          <BlockControls block={block} onUpdate={(updates) => onUpdate(block.id, updates)} />
        )}

        {showSlashMenu && (
          <SlashMenu
            query={slashSearch}
            onSelect={selectSlashItem}
            onClose={() => setShowSlashMenu(false)}
          />
        )}
      </div>
    </div>
  );
}
