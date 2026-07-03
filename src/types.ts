export type BlockType = 'text' | 'heading-1' | 'heading-2' | 'heading-3' | 'todo' | 'image' | 'code' | 'draw' | 'audio' | 'video-embed';

export type BlockAlign = 'left' | 'center' | 'right';
export type BlockColor = 'default' | 'gray' | 'red' | 'blue' | 'green';
export type BlockSize = 'small' | 'medium' | 'large';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  timestamp: string; // HH:MM
  align?: BlockAlign;
  color?: BlockColor;
  size?: BlockSize;
  checked?: boolean; // For todo items
  width?: number; // Custom width for images and canvas
  height?: number; // Custom height for canvas
}

export interface DiaryData {
  [dateString: string]: Block[];
}

declare global {
  interface Window {
    electronAPI: {
      saveImage: (buffer: ArrayBuffer, extension: string) => Promise<string>;
      saveData: (data: string) => Promise<boolean>;
      loadDataSync: () => string | null;
    };
  }
}
