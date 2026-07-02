"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Block, BlockType } from '../types';
import { CheckSquare, Square, GripVertical, Plus, Image as ImageIcon } from 'lucide-react';
import BlockControls from './BlockControls';
import SlashMenu from './SlashMenu';

interface BlockNodeProps {
  block: Block;
  index: number;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onAddBlock: (type: BlockType, index: number, content?: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');
  const [imageWidth, setImageWidth] = useState<number | undefined>(block.width);

  useEffect(() => {
    setImageWidth(block.width);
  }, [block.width]);

  useEffect(() => {
    if (isActive && contentRef.current) {
      // Focus and place cursor at end
      contentRef.current.focus();
      if (block.type !== 'image') {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [isActive, block.type]);

  useEffect(() => {
    if (block.type !== 'image' && contentRef.current && contentRef.current.textContent !== block.content) {
      contentRef.current.textContent = block.content;
      // If active, try to move cursor to the end
      if (isActive) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [block.content, isActive, block.type]);

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

    if (block.type === 'image') {
      if (e.key === 'Enter') {
         e.preventDefault();
         onAddBlock('text', index + 1);
      } else if (e.key === 'Backspace' && block.content === '') {
         e.preventDefault();
         onDelete(block.id);
      } else if (e.key === 'Backspace') {
         // Allow deleting filled image blocks if they want
         e.preventDefault();
         onDelete(block.id);
      } else {
         onKeyDownDown(e, index);
      }
      return;
    }

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

  const processImageFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const parts = file.name.split('.');
      const extension = parts.length > 1 ? '.' + parts.pop() : '.png';
      
      const imageUrl = await window.electronAPI.saveImage(arrayBuffer, extension);
      
      if (block.type === 'image' && !block.content) {
        onUpdate(block.id, { content: imageUrl });
      } else if (!block.content) {
        onUpdate(block.id, { type: 'image', content: imageUrl });
      } else {
        onAddBlock('image', index + 1, imageUrl);
      }
    } catch (err: any) {
      console.error("Failed to save image", err);
      alert("Failed to save image: " + err.message + "\n\nDid you restart the app terminal?");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }
    
    if (imageFile) {
      e.preventDefault();
      await processImageFile(imageFile);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    // Get current visual width or default
    const imgElement = contentRef.current?.querySelector('img');
    const startWidth = imageWidth || (imgElement ? imgElement.offsetWidth : 400);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      setImageWidth(newWidth);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalWidth = Math.max(50, startWidth + (upEvent.pageX - startX));
      setImageWidth(finalWidth);
      onUpdate(block.id, { width: finalWidth });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
    'text': 'leading-relaxed',
    'heading-1': 'text-4xl font-bold mt-6 mb-2',
    'heading-2': 'text-3xl font-semibold mt-5 mb-2',
    'heading-3': 'text-2xl font-medium mt-4 mb-2',
    'todo': 'flex-1',
    'image': 'text-gray-400 italic' // Mock image block
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
    'medium': 'text-xl',
    'large': 'text-2xl'
  };

  return (
    <div className="group relative flex items-start -ml-12 pl-12 pr-4 py-1 hover:bg-black/[0.02] focus-within:bg-black/[0.03] rounded-lg transition-colors">
      {/* Absolute Timestamp margin */}
      <div className="absolute left-0 top-3 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity select-none w-10 text-right pr-2">
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

        {block.type === 'image' ? (
          <div 
            ref={contentRef}
            className="w-full relative mt-2 mb-4 group/img outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocus(block.id)}
            onPaste={handlePaste}
          >
            {block.content ? (
              <div className="relative inline-block group/resize">
                <img 
                  src={block.content} 
                  alt="Diary entry" 
                  className="rounded-lg shadow-sm object-contain" 
                  style={{ width: imageWidth ? `${imageWidth}px` : 'auto', maxWidth: '100%' }}
                />
                {isActive && (
                  <div 
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-br-lg rounded-tl-sm cursor-se-resize opacity-0 group-hover/resize:opacity-100 transition-opacity"
                    onMouseDown={handleResizeStart}
                  />
                )}
              </div>
            ) : (
              <div 
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.indexOf('image') !== -1) {
                    processImageFile(file);
                  }
                }}
              >
                <ImageIcon className="mb-2 text-gray-300" size={32} />
                <span className="text-sm font-sans font-medium text-gray-500">Click to upload an image, or paste one here</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>
            )}
          </div>
        ) : (
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
            onPaste={handlePaste}
            data-placeholder={isActive && block.type === 'text' ? "Type '/' for commands" : undefined}
            data-active={isActive ? "true" : undefined}
          />
        )}

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
