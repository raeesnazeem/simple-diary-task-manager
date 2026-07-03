"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Block, BlockType } from '../types';
import { CheckSquare, Square, GripVertical, Plus, Image as ImageIcon, Undo2, Eraser, Pen, Trash2, Mic, Play, Pause } from 'lucide-react';
import BlockControls from './BlockControls';
import SlashMenu from './SlashMenu';
import { useDiaryStore } from '../store';
import { format } from 'date-fns';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';

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
  draggedIndex?: number | null;
  setDraggedIndex?: (index: number | null) => void;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
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
  onKeyDownDown,
  draggedIndex,
  setDraggedIndex,
  onReorder
}: BlockNodeProps) {
  const { pendingPageTurn, setPendingPageTurn, setIsRecordingAudio, setActiveDate } = useDiaryStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState('');
  const [imageWidth, setImageWidth] = useState<number | undefined>(block.width);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDragHandleActive, setIsDragHandleActive] = useState(false);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStrokeRef = useRef<{x: number, y: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState<number>(block.width || 400);
  const [canvasHeight, setCanvasHeight] = useState<number>(block.height || 250);

  // New Drawing Tools State
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');
  const [drawSize, setDrawSize] = useState<number>(3);
  const [drawSmoothness, setDrawSmoothness] = useState<number>(1);

  useEffect(() => {
    if (block.type === 'draw') {
      setCanvasWidth(block.width || 400);
      setCanvasHeight(block.height || 250);
    }
  }, [block.width, block.height, block.type]);

  // Re-draw strokes when canvas mounts, resizes, or content changes
  useEffect(() => {
    if (block.type === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#374151'; // gray-700

      // Read strokes
      try {
        const parsed = block.content ? JSON.parse(block.content) : [];
        const strokes = parsed.map((s: any) => 
          Array.isArray(s) ? { tool: 'pen', size: 3, points: s } : s
        );

        let isNormalized = true;
        if (strokes.length > 0 && strokes[0].points && strokes[0].points.length > 0) {
          if (strokes[0].points[0].x > 1.5 || strokes[0].points[0].y > 1.5) isNormalized = false;
        }

        strokes.forEach((stroke: any) => {
          if (!stroke.points || stroke.points.length === 0) return;
          
          ctx.beginPath();
          ctx.lineWidth = stroke.size || 3;
          ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
          
          const getX = (p: {x: number}) => isNormalized ? p.x * canvas.width : p.x;
          const getY = (p: {y: number}) => isNormalized ? p.y * canvas.height : p.y;
          const pts = stroke.points;

          if (drawSmoothness > 0 && pts.length > 2) {
             ctx.moveTo(getX(pts[0]), getY(pts[0]));
             for (let i = 1; i < pts.length - 1; i++) {
               const xc = (getX(pts[i]) + getX(pts[i + 1])) / 2;
               const yc = (getY(pts[i]) + getY(pts[i + 1])) / 2;
               ctx.quadraticCurveTo(getX(pts[i]), getY(pts[i]), xc, yc);
             }
             ctx.lineTo(getX(pts[pts.length - 1]), getY(pts[pts.length - 1]));
          } else {
             ctx.moveTo(getX(pts[0]), getY(pts[0]));
             for (let i = 1; i < pts.length; i++) {
               ctx.lineTo(getX(pts[i]), getY(pts[i]));
             }
          }
          ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over'; // reset
      } catch (e) {
        console.error('Failed to parse strokes', e);
      }
    }
  }, [block.type, block.content, canvasWidth, canvasHeight, drawSmoothness]);

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
    if (block.type !== 'image' && block.type !== 'code' && contentRef.current && contentRef.current.innerHTML !== block.content) {
      contentRef.current.innerHTML = block.content;
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
    let html = e.currentTarget.innerHTML || '';
    const text = e.currentTarget.textContent || '';

    // Slash menu logic
    const lastSlashIndex = text.lastIndexOf('/');
    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || text[lastSlashIndex - 1] === ' ' || text[lastSlashIndex - 1] === '\n')) {
      setShowSlashMenu(true);
      setSlashSearch(text.slice(lastSlashIndex + 1));
    } else {
      setShowSlashMenu(false);
    }

    if (html.includes('@time')) {
       const timeStr = format(new Date(), 'h:mm a');
       const pillHtml = `<span contenteditable="false" class="inline-flex items-center bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 mx-1 align-baseline pointer-events-none">${timeStr}</span>&nbsp;`;
       html = html.replace('@time', pillHtml);
       e.currentTarget.innerHTML = html;
       
       // Move cursor to the end
       const selection = window.getSelection();
       const range = document.createRange();
       range.selectNodeContents(e.currentTarget);
       range.collapse(false);
       if (selection) {
         selection.removeAllRanges();
         selection.addRange(range);
       }
    }

    onUpdate(block.id, { content: html });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.textContent || '';

    // Check if cursor is at the beginning
    const isAtStart = window.getSelection()?.focusOffset === 0;

    if (block.type === 'image' || block.type === 'draw' || block.type === 'audio') {
      if (e.key === 'Enter') {
         e.preventDefault();
         onAddBlock('text', index + 1);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
         e.preventDefault();
         if (block.content === '' || block.content === '[]') {
           onDelete(block.id);
         } else {
           setShowDeleteModal(true);
         }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        try {
          const fileUrl = await window.electronAPI.saveImage(arrayBuffer, '.webm');
          onUpdate(block.id, { content: fileUrl });
        } catch (err: any) {
          console.error("Failed to save audio", err);
          alert("Failed to save audio: " + err.message);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access microphone.");
    }
  };

  const togglePauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  };

  const stopRecording = (save: boolean = true) => {
    if (mediaRecorderRef.current && isRecording) {
      if (!save) {
        // Discard
        mediaRecorderRef.current.onstop = null; // Remove the onstop handler that saves it
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        setIsRecordingAudio(false);
        if (timerRef.current) clearInterval(timerRef.current);
        // Turn it back to text since it's empty and discarded
        onUpdate(block.id, { type: 'text', content: '' });
      } else {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        setIsRecordingAudio(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
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
      return;
    }

    // Strip HTML formatting for text-based blocks
    if (!['image', 'draw', 'audio', 'code'].includes(block.type)) {
      const textData = e.clipboardData.getData('text/plain');
      if (textData) {
        e.preventDefault();
        // Convert plain text to HTML, preserving line breaks and double spaces
        const htmlData = textData
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
          .replace(/  /g, ' &nbsp;');
        document.execCommand('insertHTML', false, htmlData);
      }
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

  const handleCanvasResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startY = e.pageY;
    const startW = canvasWidth;
    const startH = canvasHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setCanvasWidth(Math.max(50, startW + (moveEvent.pageX - startX)));
      setCanvasHeight(Math.max(50, startH + (moveEvent.pageY - startY)));
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const finalW = Math.max(50, startW + (upEvent.pageX - startX));
      const finalH = Math.max(50, startH + (upEvent.pageY - startY));
      setCanvasWidth(finalW);
      setCanvasHeight(finalH);
      onUpdate(block.id, { width: finalW, height: finalH });
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (block.type !== 'draw' || !canvasRef.current) return;
    setIsDrawing(true);
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const absX = e.clientX - rect.left;
    const absY = e.clientY - rect.top;
    
    const x = absX / canvasWidth;
    const y = absY / canvasHeight;
    
    currentStrokeRef.current = [{x, y}];
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineWidth = drawSize;
      ctx.globalCompositeOperation = drawTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#374151';
      ctx.beginPath();
      ctx.moveTo(absX, absY);
      ctx.lineTo(absX, absY);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || block.type !== 'draw' || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const absX = e.clientX - rect.left;
    const absY = e.clientY - rect.top;
    
    const x = absX / canvasWidth;
    const y = absY / canvasHeight;
    
    currentStrokeRef.current.push({x, y});
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineWidth = drawSize;
      ctx.globalCompositeOperation = drawTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#374151';
      ctx.lineTo(absX, absY);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || block.type !== 'draw') return;
    setIsDrawing(false);
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
    
    let existingStrokes = [];
    try {
      existingStrokes = block.content ? JSON.parse(block.content) : [];
    } catch(err) {}
    
    const newStrokes = [...existingStrokes, currentStrokeRef.current];
    onUpdate(block.id, { content: JSON.stringify(newStrokes) });
    currentStrokeRef.current = [];
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
    <div 
      className={`group relative flex items-start -ml-12 pl-12 pr-4 py-1 hover:bg-black/[0.02] focus-within:bg-black/[0.03] rounded-lg transition-all 
        ${draggedIndex === index ? 'opacity-30' : ''}
      `}
      draggable={isDragHandleActive}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        if (setDraggedIndex) setDraggedIndex(index);
      }}
      onDragEnd={() => {
        setIsDragHandleActive(false);
        if (setDraggedIndex) setDraggedIndex(null);
      }}
      onDragOver={(e) => {
        if (draggedIndex !== null && draggedIndex !== index) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          if (y < rect.height / 2) {
            setDropPosition('top');
          } else {
            setDropPosition('bottom');
          }
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDropPosition(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const pos = dropPosition;
        setDropPosition(null);
        setIsDragHandleActive(false);
        if (setDraggedIndex) setDraggedIndex(null);
        
        if (draggedIndex !== null && draggedIndex !== index && onReorder) {
          let dest = index;
          if (pos === 'bottom') dest += 1;
          if (draggedIndex < dest) dest -= 1;
          onReorder(draggedIndex, dest);
        }
      }}
    >
      {/* Drop Indicators */}
      {dropPosition === 'top' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-50 pointer-events-none" />}
      {dropPosition === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full z-50 pointer-events-none" />}

      {/* Absolute Timestamp margin */}
      <div className={`absolute left-0 top-3 text-[10px] text-gray-300 transition-opacity select-none w-10 text-right pr-2 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        {block.timestamp}
      </div>

      {/* Block Controls Margin */}
      <div className={`absolute left-6 top-2.5 transition-opacity flex flex-col gap-1 z-10 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          className="text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          title="Drag to move"
          onMouseEnter={() => setIsDragHandleActive(true)}
          onMouseLeave={() => setIsDragHandleActive(false)}
        >
          <GripVertical size={16} />
        </button>
        <button
          className="text-gray-300 hover:text-red-500"
          onClick={() => {
            if (block.type === 'text' && (!block.content || block.content.trim() === '')) {
              onDelete(block.id); // fast delete for empty lines
            } else {
              setShowDeleteModal(true);
            }
          }}
          title="Delete block"
        >
          <Trash2 size={16} />
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

        {block.type === 'code' ? (
          <div 
            className="w-full h-48 relative mt-2 mb-2 font-mono text-sm rounded-md overflow-y-auto bg-[#2d2d2d] shadow-sm text-gray-100 custom-scrollbar"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowSlashMenu(false);
              }
            }}
            onClick={() => onFocus(block.id)}
          >
            <Editor
              value={block.content || ''}
              onValueChange={code => onUpdate(block.id, { content: code })}
              highlight={code => Prism.languages.javascript ? Prism.highlight(code, Prism.languages.javascript, 'javascript') : code}
              padding={16}
              style={{
                fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Consolas, monospace',
                minHeight: '80px',
                width: '100%',
                outline: 'none'
              }}
              textareaClassName="outline-none focus:outline-none"
            />
          </div>
        ) : block.type === 'audio' ? (
          <div 
            className="w-full relative mt-2 mb-4 group/audio outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocus(block.id)}
          >
            {block.content ? (
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-3 w-full max-w-sm">
                <audio controls src={block.content} className="w-full h-10" />
              </div>
            ) : (
              <div className="flex items-center justify-between w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium font-mono text-gray-600">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button onClick={startRecording} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-full transition-colors" title="Start Recording">
                      <Mic size={18} />
                    </button>
                  ) : (
                    <>
                      <button onClick={togglePauseRecording} className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors" title={isPaused ? "Resume" : "Pause"}>
                        {isPaused ? <Play size={18} /> : <Pause size={18} />}
                      </button>
                      <button onClick={() => stopRecording(true)} className="p-2 bg-gray-900 text-white hover:bg-black rounded-full transition-colors" title="Stop Recording">
                        <Square size={18} fill="currentColor" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Page Turn Intercept Modal */}
            {pendingPageTurn && isRecording && !isPaused && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Recording in Progress</h3>
                  <p className="text-gray-500 text-sm mb-6">You are actively recording an audio note. Would you like to save or discard it before turning the page?</p>
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => {
                        stopRecording(false);
                        setActiveDate(pendingPageTurn);
                        setPendingPageTurn(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={() => {
                        stopRecording(true);
                        setActiveDate(pendingPageTurn);
                        setPendingPageTurn(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      Save & Turn Page
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : block.type === 'image' ? (
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
        ) : block.type === 'draw' ? (
          <div 
            className="relative mt-2 mb-4 group/draw outline-none inline-block border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocus(block.id)}
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="touch-none w-full h-full rounded-lg cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {isActive && (
              <>
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-br-lg rounded-tl-sm cursor-nwse-resize opacity-0 group-hover/draw:opacity-100 transition-opacity"
                  onPointerDown={handleCanvasResizeStart}
                />
                
                {/* Drawing Toolbar */}
                <div 
                  className="absolute -top-14 right-0 flex items-center gap-1.5 bg-white/95 backdrop-blur-md shadow-sm p-1.5 rounded-lg z-50 border border-gray-200 pointer-events-auto"
                  onPointerDown={e => e.stopPropagation()}
                >
                  <button onClick={() => {
                     try {
                       const strokes = block.content ? JSON.parse(block.content) : [];
                       if (strokes.length > 0) {
                          onUpdate(block.id, { content: JSON.stringify(strokes.slice(0, -1)) });
                       }
                     } catch(e) {}
                  }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="Undo">
                    <Undo2 size={16} />
                  </button>
                  <button onClick={() => onUpdate(block.id, { content: '[]' })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Clear Canvas">
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  
                  <button onClick={() => setDrawTool('pen')} className={`p-1.5 rounded-md transition-colors ${drawTool === 'pen' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`} title="Pen">
                    <Pen size={16} />
                  </button>
                  <button onClick={() => setDrawTool('eraser')} className={`p-1.5 rounded-md transition-colors ${drawTool === 'eraser' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`} title="Eraser">
                    <Eraser size={16} />
                  </button>
                  
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  
                  <div className="flex flex-col gap-0.5 w-16 px-1">
                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider leading-none">Size</span>
                    <input type="range" min="1" max="20" value={drawSize} onChange={e => setDrawSize(parseInt(e.target.value))} className="w-full h-1" />
                  </div>
                  
                  <div className="flex flex-col gap-0.5 w-16 px-1">
                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider leading-none">Smooth</span>
                    <input type="range" min="0" max="1" step="1" value={drawSmoothness} onChange={e => setDrawSmoothness(parseInt(e.target.value))} className="w-full h-1" />
                  </div>
                </div>
              </>
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

        {isActive && ['text', 'heading-1', 'heading-2', 'heading-3', 'todo'].includes(block.type) && (
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Block</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this block? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  onDelete(block.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
