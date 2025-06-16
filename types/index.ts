// =============================================================================
// CORE TYPE DEFINITIONS FOR WORDWISE AI
// =============================================================================

/**
 * Document interface representing a user's document
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  
  /** Document title */
  title: string;
  
  /** Document content in HTML format */
  content: string;
  
  /** Plain text version of content for analysis */
  plainText: string;
  
  /** Document creation timestamp */
  createdAt: Date;
  
  /** Last modification timestamp */
  updatedAt: Date;
  
  /** User ID who owns this document */
  userId: string;
  
  /** Document statistics */
  stats: DocumentStats;
  
  /** Grammar and style analysis results */
  analysis: DocumentAnalysis;
  
  /** Document settings and preferences */
  settings: DocumentSettings;
  
  /** Collaboration and sharing settings */
  sharing: SharingSettings;
  
  /** Document status */
  status: DocumentStatus;
  
  /** Tags associated with the document */
  tags: string[];
  
  /** Folder/category organization */
  folderId?: string;
  
  /** Document template used (if any) */
  templateId?: string;
  
  /** Version history tracking */
  version: number;
  
  /** Whether the document is archived */
  isArchived: boolean;
  
  /** Whether the document is favorited */
  isFavorite: boolean;
}

/**
 * Document statistics interface
 */
export interface DocumentStats {
  /** Total word count */
  wordCount: number;
  
  /** Total character count */
  characterCount: number;
  
  /** Character count excluding spaces */
  characterCountNoSpaces: number;
  
  /** Paragraph count */
  paragraphCount: number;
  
  /** Sentence count */
  sentenceCount: number;
  
  /** Average words per sentence */
  avgWordsPerSentence: number;
  
  /** Reading time estimate in minutes */
  readingTime: number;
  
  /** Readability score (0-100) */
  readabilityScore: number;
}

/**
 * Document analysis results interface
 */
export interface DocumentAnalysis {
  /** Overall grammar score (0-100) */
  grammarScore: number;
  
  /** Overall style score (0-100) */
  styleScore: number;
  
  /** Clarity score (0-100) */
  clarityScore: number;
  
  /** Engagement score (0-100) */
  engagementScore: number;
  
  /** Array of grammar issues found */
  grammarIssues: GrammarIssue[];
  
  /** Array of style suggestions */
  styleSuggestions: StyleSuggestion[];
  
  /** Array of clarity improvements */
  clarityIssues: ClarityIssue[];
  
  /** Tone analysis */
  tone: ToneAnalysis;
  
  /** Last analysis timestamp */
  lastAnalyzedAt: Date;
  
  /** Whether analysis is currently in progress */
  isAnalyzing: boolean;
}

/**
 * Grammar issue interface
 */
export interface GrammarIssue {
  /** Unique identifier for the issue */
  id: string;
  
  /** Type of grammar issue */
  type: GrammarIssueType;
  
  /** Issue severity level */
  severity: IssueSeverity;
  
  /** Position in document where issue occurs */
  position: TextPosition;
  
  /** Original text with issue */
  originalText: string;
  
  /** Suggested correction */
  suggestion: string;
  
  /** Explanation of the issue */
  explanation: string;
  
  /** Whether the issue has been resolved */
  isResolved: boolean;
  
  /** Whether the issue has been ignored by user */
  isIgnored: boolean;
}

/**
 * Style suggestion interface
 */
export interface StyleSuggestion {
  /** Unique identifier for the suggestion */
  id: string;
  
  /** Type of style suggestion */
  type: StyleSuggestionType;
  
  /** Suggestion severity/priority */
  priority: SuggestionPriority;
  
  /** Position in document */
  position: TextPosition;
  
  /** Original text */
  originalText: string;
  
  /** Suggested improvement */
  suggestion: string;
  
  /** Explanation of the suggestion */
  explanation: string;
  
  /** Whether suggestion has been applied */
  isApplied: boolean;
  
  /** Whether suggestion has been dismissed */
  isDismissed: boolean;
}

/**
 * Clarity issue interface
 */
export interface ClarityIssue {
  /** Unique identifier for the issue */
  id: string;
  
  /** Type of clarity issue */
  type: ClarityIssueType;
  
  /** Position in document */
  position: TextPosition;
  
  /** Text that needs clarification */
  text: string;
  
  /** Suggested improvement */
  suggestion: string;
  
  /** Explanation */
  explanation: string;
  
  /** Whether issue has been addressed */
  isAddressed: boolean;
}

/**
 * Document settings interface
 */
export interface DocumentSettings {
  /** Auto-save enabled */
  autoSave: boolean;
  
  /** Auto-save interval in seconds */
  autoSaveInterval: number;
  
  /** Grammar checking enabled */
  grammarChecking: boolean;
  
  /** Style suggestions enabled */
  styleSuggestions: boolean;
  
  /** Clarity suggestions enabled */
  claritySuggestions: boolean;
  
  /** Real-time analysis enabled */
  realTimeAnalysis: boolean;
  
  /** Document language */
  language: string;
  
  /** Writing style preference */
  writingStyle: WritingStyle;
  
  /** Target audience */
  targetAudience: TargetAudience;
}

/**
 * Sharing settings interface
 */
export interface SharingSettings {
  /** Whether document is publicly shared */
  isPublic: boolean;
  
  /** Share link if public */
  shareLink?: string;
  
  /** Access level for shared document */
  accessLevel: AccessLevel;
  
  /** List of collaborators */
  collaborators: Collaborator[];
  
  /** Whether comments are enabled */
  commentsEnabled: boolean;
  
  /** Whether suggestions are enabled */
  suggestionsEnabled: boolean;
}

/**
 * Collaborator interface
 */
export interface Collaborator {
  /** User ID of collaborator */
  userId: string;
  
  /** User email */
  email: string;
  
  /** User name */
  name: string;
  
  /** Access level granted */
  accessLevel: AccessLevel;
  
  /** When they were added as collaborator */
  addedAt: Date;
  
  /** Whether they've accepted the invitation */
  hasAccepted: boolean;
}

/**
 * User interface representing application users
 */
export interface User {
  /** Unique user identifier */
  id: string;
  
  /** User's email address */
  email: string;
  
  /** User's full name */
  name: string;
  
  /** User's avatar URL */
  avatar?: string;
  
  /** User's subscription plan */
  subscription: SubscriptionPlan;
  
  /** User's preferences and settings */
  preferences: UserPreferences;
  
  /** User's usage statistics */
  usage: UserUsage;
  
  /** Account creation date */
  createdAt: Date;
  
  /** Last login timestamp */
  lastLoginAt: Date;
  
  /** Whether user account is verified */
  isVerified: boolean;
  
  /** Whether user account is active */
  isActive: boolean;
  
  /** User's time zone */
  timezone: string;
  
  /** User's preferred language */
  language: string;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  /** Theme preference */
  theme: ThemeMode;
  
  /** Editor font family */
  fontFamily: string;
  
  /** Editor font size */
  fontSize: number;
  
  /** Line height preference */
  lineHeight: number;
  
  /** Default document settings */
  defaultDocumentSettings: DocumentSettings;
  
  /** Notification preferences */
  notifications: NotificationSettings;
  
  /** Privacy settings */
  privacy: PrivacySettings;
  
  /** Keyboard shortcuts enabled */
  keyboardShortcuts: boolean;
  
  /** Auto-dark mode based on system */
  autoTheme: boolean;
}

/**
 * Editor settings interface for application-wide editor configuration
 */
export interface EditorSettings {
  /** Current theme mode */
  theme: ThemeMode;
  
  /** Editor appearance settings */
  appearance: EditorAppearance;
  
  /** Editor behavior settings */
  behavior: EditorBehavior;
  
  /** Analysis settings */
  analysis: AnalysisSettings;
  
  /** Collaboration settings */
  collaboration: CollaborationSettings;
  
  /** Accessibility settings */
  accessibility: AccessibilitySettings;
  
  /** Performance settings */
  performance: PerformanceSettings;
}

/**
 * Editor appearance settings
 */
export interface EditorAppearance {
  /** Font family for editor */
  fontFamily: string;
  
  /** Font size in pixels */
  fontSize: number;
  
  /** Line height multiplier */
  lineHeight: number;
  
  /** Maximum line width */
  maxLineWidth: number;
  
  /** Show line numbers */
  showLineNumbers: boolean;
  
  /** Show word count */
  showWordCount: boolean;
  
  /** Show reading time */
  showReadingTime: boolean;
  
  /** Highlight current line */
  highlightCurrentLine: boolean;
  
  /** Show invisible characters */
  showInvisibles: boolean;
}

/**
 * Editor behavior settings
 */
export interface EditorBehavior {
  /** Auto-save enabled */
  autoSave: boolean;
  
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  
  /** Spell check enabled */
  spellCheck: boolean;
  
  /** Auto-correct enabled */
  autoCorrect: boolean;
  
  /** Tab size in spaces */
  tabSize: number;
  
  /** Insert spaces instead of tabs */
  insertSpaces: boolean;
  
  /** Word wrap enabled */
  wordWrap: boolean;
  
  /** Auto-focus on new documents */
  autoFocus: boolean;
}

/**
 * Analysis settings interface
 */
export interface AnalysisSettings {
  /** Real-time analysis enabled */
  realTime: boolean;
  
  /** Analysis debounce delay in milliseconds */
  debounceDelay: number;
  
  /** Grammar checking enabled */
  grammarCheck: boolean;
  
  /** Style suggestions enabled */
  styleCheck: boolean;
  
  /** Clarity analysis enabled */
  clarityCheck: boolean;
  
  /** Tone analysis enabled */
  toneAnalysis: boolean;
  
  /** Plagiarism checking enabled */
  plagiarismCheck: boolean;
  
  /** Minimum text length for analysis */
  minTextLength: number;
}

// =============================================================================
// ENUMS AND UNION TYPES
// =============================================================================

export type DocumentStatus = 'draft' | 'published' | 'archived' | 'shared';

export type GrammarIssueType = 
  | 'spelling' 
  | 'grammar' 
  | 'punctuation' 
  | 'capitalization'
  | 'agreement'
  | 'tense'
  | 'word-choice';

export type StyleSuggestionType = 
  | 'wordiness' 
  | 'passive-voice' 
  | 'sentence-structure'
  | 'vocabulary'
  | 'transition'
  | 'repetition'
  | 'formality';

export type ClarityIssueType = 
  | 'unclear-reference' 
  | 'ambiguous-wording'
  | 'complex-sentence'
  | 'jargon'
  | 'redundancy';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SuggestionPriority = 'low' | 'medium' | 'high';

export type WritingStyle = 
  | 'academic' 
  | 'business' 
  | 'creative' 
  | 'casual' 
  | 'technical'
  | 'journalistic'
  | 'general';

export type TargetAudience = 
  | 'general' 
  | 'expert' 
  | 'knowledgeable' 
  | 'beginner';

export type AccessLevel = 'view' | 'comment' | 'suggest' | 'edit' | 'admin';

export type SubscriptionPlan = 'free' | 'premium' | 'business' | 'enterprise';

export type ThemeMode = 'light' | 'dark' | 'system';

// =============================================================================
// UTILITY INTERFACES
// =============================================================================

/**
 * Text position interface for tracking locations in documents
 */
export interface TextPosition {
  /** Starting position in the text */
  start: number;
  
  /** Ending position in the text */
  end: number;
  
  /** Line number (1-indexed) */
  line?: number;
  
  /** Column number (1-indexed) */
  column?: number;
}

/**
 * Tone analysis results
 */
export interface ToneAnalysis {
  /** Primary tone detected */
  primaryTone: string;
  
  /** Confidence score for primary tone */
  confidence: number;
  
  /** All detected tones with scores */
  tones: ToneScore[];
  
  /** Overall sentiment score (-1 to 1) */
  sentiment: number;
  
  /** Formality score (0 to 1) */
  formality: number;
}

/**
 * Individual tone score
 */
export interface ToneScore {
  /** Tone name */
  tone: string;
  
  /** Score (0 to 1) */
  score: number;
}

/**
 * User usage statistics
 */
export interface UserUsage {
  /** Total documents created */
  documentsCreated: number;
  
  /** Total words written */
  totalWords: number;
  
  /** Documents edited this month */
  documentsThisMonth: number;
  
  /** Words written this month */
  wordsThisMonth: number;
  
  /** Grammar issues fixed */
  issuesFixed: number;
  
  /** Suggestions accepted */
  suggestionsAccepted: number;
  
  /** Last usage date */
  lastUsed: Date;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  /** Email notifications enabled */
  email: boolean;
  
  /** Push notifications enabled */
  push: boolean;
  
  /** Grammar issue notifications */
  grammarIssues: boolean;
  
  /** Collaboration notifications */
  collaboration: boolean;
  
  /** System update notifications */
  systemUpdates: boolean;
  
  /** Marketing notifications */
  marketing: boolean;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  /** Allow usage analytics */
  analytics: boolean;
  
  /** Allow improvement suggestions */
  improvementSuggestions: boolean;
  
  /** Profile visibility */
  profileVisibility: 'public' | 'private' | 'limited';
  
  /** Document visibility default */
  defaultDocumentVisibility: 'private' | 'shared' | 'public';
}

/**
 * Collaboration settings
 */
export interface CollaborationSettings {
  /** Real-time collaboration enabled */
  realTimeCollab: boolean;
  
  /** Show cursors of other users */
  showCursors: boolean;
  
  /** Show user selections */
  showSelections: boolean;
  
  /** Auto-save during collaboration */
  autoSaveCollab: boolean;
  
  /** Conflict resolution mode */
  conflictResolution: 'manual' | 'automatic' | 'prompt';
}

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  /** High contrast mode */
  highContrast: boolean;
  
  /** Reduced motion */
  reducedMotion: boolean;
  
  /** Screen reader optimizations */
  screenReader: boolean;
  
  /** Keyboard navigation enhanced */
  keyboardNavigation: boolean;
  
  /** Focus indicators enhanced */
  focusIndicators: boolean;
}

/**
 * Performance settings
 */
export interface PerformanceSettings {
  /** Analysis throttling enabled */
  throttleAnalysis: boolean;
  
  /** Maximum document size for real-time analysis */
  maxDocumentSize: number;
  
  /** Lazy loading enabled */
  lazyLoading: boolean;
  
  /** Virtualization for large documents */
  virtualization: boolean;
} 