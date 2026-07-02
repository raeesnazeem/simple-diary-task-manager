export type BlockType = 'text' | 'heading-1' | 'heading-2' | 'heading-3' | 'todo' | 'image';

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
}

export interface DiaryData {
  [dateString: string]: Block[];
}
