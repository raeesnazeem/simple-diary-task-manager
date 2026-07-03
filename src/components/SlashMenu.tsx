"use client";

import React, { useEffect, useState } from 'react';
import { BlockType } from '../types';
import { Type, Heading1, Heading2, Heading3, CheckSquare, Image as ImageIcon, Code, PenTool, Mic } from 'lucide-react';

interface SlashMenuProps {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: 'text', label: 'Text', icon: Type, description: 'Just start typing with plain text.' },
  { id: 'heading-1', label: 'Heading 1', icon: Heading1, description: 'Big section heading.' },
  { id: 'heading-2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading.' },
  { id: 'heading-3', label: 'Heading 3', icon: Heading3, description: 'Small section heading.' },
  { id: 'todo', label: 'To-do List', icon: CheckSquare, description: 'Track tasks with a to-do list.' },
  { id: 'image', label: 'Image', icon: ImageIcon, description: 'Upload or embed an image.' },
  { id: 'code', label: 'Code Block', icon: Code, description: 'Write syntax-highlighted code.' },
  { id: 'draw', label: 'Drawing Canvas', icon: PenTool, description: 'Freehand sketch.' },
  { id: 'audio', label: 'Audio Note', icon: Mic, description: 'Record a voice note.' },
];

export default function SlashMenu({ query, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex].id as BlockType);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect]);

  if (filteredItems.length === 0) return null;

  return (
    <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 font-sans">
      <div className="px-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Basic Blocks
      </div>
      <ul className="max-h-64 overflow-y-auto">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;

          return (
            <li
              key={item.id}
              className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              onClick={() => onSelect(item.id as BlockType)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={`p-1 rounded ${isSelected ? 'bg-white shadow-sm' : 'bg-gray-50 border border-gray-100'}`}>
                <Icon size={18} className={isSelected ? 'text-gray-900' : 'text-gray-500'} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-500">{item.description}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
