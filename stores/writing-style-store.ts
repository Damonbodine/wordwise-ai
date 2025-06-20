import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WRITING_STYLE, WritingStyleConfig, getWritingStyleById } from '@/lib/writing-styles';

interface WritingStyleStore {
  // Current writing style
  currentStyle: WritingStyleConfig;
  
  // Actions
  setWritingStyle: (styleId: string) => void;
  resetToDefault: () => void;
}

export const useWritingStyleStore = create<WritingStyleStore>()(
  persist(
    (set) => ({
      // Initial state
      currentStyle: DEFAULT_WRITING_STYLE,

      // Set writing style by ID
      setWritingStyle: (styleId: string) => {
        const style = getWritingStyleById(styleId);
        if (style) {
          set({ currentStyle: style });
          console.log(`[WRITING STYLE] Changed to: ${style.name} (${style.id})`);
        } else {
          console.warn(`[WRITING STYLE] Unknown style ID: ${styleId}`);
        }
      },

      // Reset to default style
      resetToDefault: () => {
        set({ currentStyle: DEFAULT_WRITING_STYLE });
        console.log('[WRITING STYLE] Reset to default: Business');
      },
    }),
    {
      name: 'writing-style-storage', // localStorage key
      version: 1,
    }
  )
);