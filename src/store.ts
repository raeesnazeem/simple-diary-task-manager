import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';


const electronStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.loadDataSync) {
      try {
        const data = window.electronAPI.loadDataSync();
        if (data) return data;
      } catch (e) {
        console.error('Failed to load from electron API', e);
      }
    }
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.saveData) {
      window.electronAPI.saveData(value).catch(console.error);
    }
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  }
};
import { format } from 'date-fns';
import { Block, BlockType, DiaryData } from './types';

interface DiaryState {
  data: DiaryData;
  activeDate: string;
  setActiveDate: (date: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  viewMode: 'single' | 'double';
  setViewMode: (mode: 'single' | 'double') => void;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  isRecordingAudio: boolean;
  setIsRecordingAudio: (isRecording: boolean) => void;
  pendingPageTurn: string | null;
  setPendingPageTurn: (date: string | null) => void;
  addBlock: (date: string, type: BlockType, content?: string, index?: number) => void;
  updateBlock: (date: string, id: string, updates: Partial<Block>) => void;
  deleteBlock: (date: string, id: string) => void;
  mergeBlockWithPrevious: (date: string, currentIndex: number) => void;
  reorderBlocks: (date: string, sourceIndex: number, destinationIndex: number) => void;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
}

const createNewBlock = (type: BlockType, content: string = ''): Block => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
  type,
  content,
  timestamp: format(new Date(), 'HH:mm'),
  align: 'left',
  color: 'default',
  size: 'medium',
});

export const useDiaryStore = create<DiaryState>()(
  temporal(
    persist(
      (set) => ({
      data: {},
      activeDate: format(new Date(), 'yyyy-MM-dd'),
      fontFamily: 'font-inter',
      viewMode: 'single',
      activeBlockId: null,
      isRecordingAudio: false,
      pendingPageTurn: null,
      autoSyncEnabled: false,
      setActiveDate: (date) => set({ activeDate: date, activeBlockId: null }),
      setFontFamily: (font) => set({ fontFamily: font }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveBlockId: (id) => set({ activeBlockId: id }),
      setIsRecordingAudio: (val) => set({ isRecordingAudio: val }),
      setPendingPageTurn: (date) => set({ pendingPageTurn: date }),
      setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),

      addBlock: (date, type, content = '', index) => set((state) => {
        const blocks = state.data[date] || [createNewBlock('text')];
        const newBlock = createNewBlock(type, content);
        const newBlocks = [...blocks];

        if (typeof index === 'number' && index >= 0 && index <= newBlocks.length) {
          newBlocks.splice(index, 0, newBlock);
        } else {
          newBlocks.push(newBlock);
        }

        return {
          data: {
            ...state.data,
            [date]: newBlocks
          }
        };
      }),

      updateBlock: (date, id, updates) => set((state) => {
        const blocks = state.data[date] || [];
        const newBlocks = blocks.map(block =>
          block.id === id ? { ...block, ...updates } : block
        );
        return {
          data: {
            ...state.data,
            [date]: newBlocks
          }
        };
      }),

      deleteBlock: (date, id) => set((state) => {
        const blocks = state.data[date] || [];
        const newBlocks = blocks.filter(block => block.id !== id);

        // Always ensure at least one block exists
        if (newBlocks.length === 0) {
          newBlocks.push(createNewBlock('text'));
        }

        return {
          data: {
            ...state.data,
            [date]: newBlocks
          }
        };
      }),

      mergeBlockWithPrevious: (date, currentIndex) => set((state) => {
        if (currentIndex <= 0) return state;

        const blocks = state.data[date] || [];
        const currentBlock = blocks[currentIndex];
        const prevBlock = blocks[currentIndex - 1];

        const newBlocks = [...blocks];
        // Merge content to previous block
        newBlocks[currentIndex - 1] = {
          ...prevBlock,
          content: prevBlock.content + currentBlock.content
        };
        // Remove current block
        newBlocks.splice(currentIndex, 1);

        return {
          data: {
            ...state.data,
            [date]: newBlocks
          }
        };
      }),

      reorderBlocks: (date, sourceIndex, destinationIndex) => set((state) => {
        const blocks = state.data[date] || [];
        const newBlocks = Array.from(blocks);
        const [reorderedItem] = newBlocks.splice(sourceIndex, 1);
        newBlocks.splice(destinationIndex, 0, reorderedItem);

        return {
          data: {
            ...state.data,
            [date]: newBlocks
          }
        };
      })
    }),
    {
      name: 'simple-diary-storage',
      storage: createJSONStorage(() => electronStorage),
      merge: (persistedState: any, currentState: DiaryState) => {
        return {
          ...currentState,
          ...persistedState,
          data: persistedState?.data || currentState.data,
          activeDate: persistedState?.activeDate || currentState.activeDate,
          autoSyncEnabled: persistedState?.autoSyncEnabled ?? currentState.autoSyncEnabled,
        };
      },
    }
  ), { limit: 50 }
  )
);
