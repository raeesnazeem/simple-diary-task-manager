"use client";

import React from 'react';
import { Block, BlockAlign, BlockColor, BlockSize } from '../types';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface BlockControlsProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function BlockControls({ block, onUpdate }: BlockControlsProps) {
  // Only show alignment for non-todos, and size for non-headings
  const showAlign = block.type !== 'todo';
  const showSize = !['heading-1', 'heading-2', 'heading-3'].includes(block.type);

  const colors: { id: BlockColor; bg: string }[] = [
    { id: 'default', bg: 'bg-gray-900' },
    { id: 'gray', bg: 'bg-gray-500' },
    { id: 'red', bg: 'bg-red-500' },
    { id: 'blue', bg: 'bg-blue-500' },
    { id: 'green', bg: 'bg-green-500' },
  ];

  return (
    <div className="absolute right-0 top-0 -mt-10 bg-white border border-gray-200 rounded-lg shadow-lg flex items-center p-1 gap-1 z-20 font-inter opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">

      {/* Colors */}
      <div className="flex gap-1 border-r border-gray-200 pr-1">
        {colors.map(color => (
          <button
            key={color.id}
            onClick={() => onUpdate({ color: color.id })}
            className={`w-5 h-5 rounded-full ${color.bg} ${block.color === color.id ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-70 hover:opacity-100'} transition-all`}
            title={`Color: ${color.id}`}
          />
        ))}
      </div>

      {/* Alignment */}
      {showAlign && (
        <div className="flex gap-1 border-r border-gray-200 px-1">
          <button onClick={() => onUpdate({ align: 'left' })} className={`p-1 rounded hover:bg-gray-100 ${block.align === 'left' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}><AlignLeft size={16} /></button>
          <button onClick={() => onUpdate({ align: 'center' })} className={`p-1 rounded hover:bg-gray-100 ${block.align === 'center' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}><AlignCenter size={16} /></button>
          <button onClick={() => onUpdate({ align: 'right' })} className={`p-1 rounded hover:bg-gray-100 ${block.align === 'right' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}><AlignRight size={16} /></button>
        </div>
      )}

      {/* Size */}
      {showSize && (
        <div className="flex gap-1 pl-1">
          <button onClick={() => onUpdate({ size: 'small' })} className={`px-2 py-0.5 text-xs font-medium rounded hover:bg-gray-100 ${block.size === 'small' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}>S</button>
          <button onClick={() => onUpdate({ size: 'medium' })} className={`px-2 py-0.5 text-sm font-medium rounded hover:bg-gray-100 ${block.size === 'medium' || !block.size ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}>M</button>
          <button onClick={() => onUpdate({ size: 'large' })} className={`px-2 py-0.5 text-base font-medium rounded hover:bg-gray-100 ${block.size === 'large' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}>L</button>
        </div>
      )}
    </div>
  );
}
