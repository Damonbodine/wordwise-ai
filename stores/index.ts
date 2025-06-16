// Export all Zustand stores
export { useDocumentStore } from './document-store';
export { useEditorStore } from './editor-store';
export { useUserStore } from './user-store';

// Re-export store types for convenience
export type { Document, EditorSettings, User } from '@/types'; 