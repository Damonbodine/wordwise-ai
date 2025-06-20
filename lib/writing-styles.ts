// Writing Style Configurations for WordWise AI
// Each style defines unique analysis priorities and rules

export interface WritingStyleConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  shortDesc: string;
  color: string;
  focus: string;
  priorities: {
    correctness: 'low' | 'medium' | 'high' | 'very_high';
    clarity: 'low' | 'medium' | 'high' | 'very_high';
    engagement: 'low' | 'medium' | 'high' | 'very_high';
    delivery: 'low' | 'medium' | 'high' | 'very_high';
  };
  allowances: {
    passiveVoice?: boolean;
    complexSentences?: boolean;
    formalLanguage?: boolean;
    contractions?: boolean;
    informalLanguage?: boolean;
    fragmentSentences?: boolean;
    unconventionalGrammar?: boolean;
  };
  restrictions: {
    jargon?: 'none' | 'minimal' | 'moderate' | 'allowed';
    wordiness?: boolean;
    colloquialisms?: boolean;
    firstPerson?: 'avoided' | 'limited' | 'encouraged';
  };
  suggestions: {
    activeVoice?: boolean;
    conciseSentences?: boolean;
    actionVerbs?: boolean;
    sensoryDetails?: boolean;
    showDontTell?: boolean;
    accessibility?: boolean;
    personalVoice?: boolean;
  };
}

export const WRITING_STYLES: WritingStyleConfig[] = [
  {
    id: 'academic',
    name: 'Academic',
    emoji: '📚',
    description: 'Formal, precise, evidence-based writing for scholarly work, research papers, and academic contexts',
    shortDesc: 'Formal & precise',
    color: 'blue',
    focus: 'Precision, formality, evidence-based language',
    priorities: {
      correctness: 'very_high',  // Grammar must be perfect
      clarity: 'high',           // Complex sentences OK if clear
      engagement: 'medium',      // Objective tone preferred
      delivery: 'very_high'      // Formal style required
    },
    allowances: {
      passiveVoice: true,        // Often appropriate in academic writing
      complexSentences: true,    // Necessary for complex ideas
      formalLanguage: true       // Required formality level
    },
    restrictions: {
      jargon: 'moderate',        // Academic terminology expected
      wordiness: false,          // Precision over brevity
      colloquialisms: false,     // No casual expressions
      firstPerson: 'limited'     // Use sparingly
    },
    suggestions: {
      activeVoice: false,        // Don't force active voice
      conciseSentences: false,   // Allow complexity when needed
      actionVerbs: false,        // Precision matters more
      sensoryDetails: false,     // Objective analysis preferred
      showDontTell: false,       // Direct statements preferred
      accessibility: false,     // Technical language acceptable
      personalVoice: false       // Objective tone required
    }
  },
  {
    id: 'business',
    name: 'Business',
    emoji: '💼',
    description: 'Clear, concise, action-oriented writing for professional communications, reports, and business contexts',
    shortDesc: 'Clear & concise',
    color: 'green',
    focus: 'Clarity, conciseness, action-oriented language',
    priorities: {
      correctness: 'high',       // Professional credibility
      clarity: 'very_high',      // Must be immediately clear
      engagement: 'high',        // Action-oriented
      delivery: 'high'           // Professional tone
    },
    allowances: {
      passiveVoice: false,       // Prefer active voice
      complexSentences: false,   // Keep it simple
      formalLanguage: true       // Professional tone
    },
    restrictions: {
      jargon: 'minimal',         // Unless industry-standard
      wordiness: true,           // Cut unnecessary words
      colloquialisms: false,     // Professional language
      firstPerson: 'limited'     // Use strategically
    },
    suggestions: {
      activeVoice: true,         // Prefer action verbs
      conciseSentences: true,    // Shorter is better
      actionVerbs: true,         // "Drive results" vs "results occur"
      sensoryDetails: false,     // Focus on facts
      showDontTell: false,       // Direct communication
      accessibility: true,      // Clear to all stakeholders
      personalVoice: false      // Professional tone
    }
  },
  {
    id: 'creative',
    name: 'Creative',
    emoji: '✨',
    description: 'Expressive, narrative-focused writing for stories, creative content, and artistic expression',
    shortDesc: 'Expressive & artistic',
    color: 'purple',
    focus: 'Voice, narrative flow, emotional engagement',
    priorities: {
      correctness: 'medium',     // Grammar serves story
      clarity: 'medium',         // Style may override clarity
      engagement: 'very_high',   // Primary goal
      delivery: 'very_high'      // Voice consistency
    },
    allowances: {
      passiveVoice: true,        // For style and rhythm
      complexSentences: true,    // Varied structure
      formalLanguage: false,     // Flexible tone
      contractions: true,        // Natural dialogue
      informalLanguage: true,    // Character voice
      fragmentSentences: true,   // For effect
      unconventionalGrammar: true // Artistic license
    },
    restrictions: {
      jargon: 'none',           // Accessible language
      wordiness: false,         // Rich description OK
      colloquialisms: true,     // Character authenticity
      firstPerson: 'encouraged' // Personal narrative
    },
    suggestions: {
      activeVoice: false,       // Style over rules
      conciseSentences: false,  // Rhythm matters more
      actionVerbs: true,        // Dynamic storytelling
      sensoryDetails: true,     // Add visual/emotional elements
      showDontTell: true,       // Narrative techniques
      accessibility: true,     // Readable for audience
      personalVoice: true       // Unique voice encouraged
    }
  },
  {
    id: 'casual',
    name: 'Casual',
    emoji: '💬',
    description: 'Conversational, accessible writing for blogs, personal content, and informal communication',
    shortDesc: 'Conversational & friendly',
    color: 'orange',
    focus: 'Conversational tone, accessibility, personality',
    priorities: {
      correctness: 'medium',     // Less strict
      clarity: 'high',           // Must be understandable
      engagement: 'high',        // Personal connection
      delivery: 'medium'         // Relaxed formality
    },
    allowances: {
      passiveVoice: true,        // Natural speech patterns
      complexSentences: false,   // Keep it simple
      formalLanguage: false,     // Conversational tone
      contractions: true,        // "Don't" instead of "do not"
      informalLanguage: true,    // Conversational expressions
      fragmentSentences: true,   // Natural speech
      unconventionalGrammar: true // Conversational flexibility
    },
    restrictions: {
      jargon: 'minimal',        // Keep it accessible
      wordiness: true,          // Get to the point
      colloquialisms: true,     // Natural expressions OK
      firstPerson: 'encouraged' // Personal stories welcomed
    },
    suggestions: {
      activeVoice: true,        // Natural and direct
      conciseSentences: true,   // Easy to read
      actionVerbs: true,        // Conversational energy
      sensoryDetails: true,     // Personal anecdotes
      showDontTell: false,      // Direct communication OK
      accessibility: true,     // Simple vocabulary
      personalVoice: true       // Encourage personality
    }
  }
];

// Default style
export const DEFAULT_WRITING_STYLE = WRITING_STYLES[1]; // Business

// Helper functions
export const getWritingStyleById = (id: string): WritingStyleConfig | undefined => {
  return WRITING_STYLES.find(style => style.id === id);
};

export const getWritingStylePromptModifications = (style: WritingStyleConfig): string => {
  let modifications = `\n\n## WRITING STYLE: ${style.name.toUpperCase()}\n`;
  modifications += `**Context**: ${style.focus}\n\n`;
  
  // Priority adjustments
  modifications += `**Analysis Priority Adjustments**:\n`;
  if (style.priorities.correctness === 'very_high') {
    modifications += `- CORRECTNESS: Maximum priority - flag all grammar/spelling errors\n`;
  } else if (style.priorities.correctness === 'medium') {
    modifications += `- CORRECTNESS: Moderate priority - allow artistic/stylistic flexibility\n`;
  }
  
  if (style.priorities.clarity === 'very_high') {
    modifications += `- CLARITY: Maximum priority - everything must be immediately clear\n`;
  } else if (style.priorities.clarity === 'medium') {
    modifications += `- CLARITY: Moderate priority - style may override absolute clarity\n`;
  }
  
  if (style.priorities.engagement === 'very_high') {
    modifications += `- ENGAGEMENT: Maximum priority - focus on reader connection and interest\n`;
  }
  
  // Allowances
  if (Object.keys(style.allowances).length > 0) {
    modifications += `\n**Style Allowances** (do NOT flag these as errors):\n`;
    if (style.allowances.passiveVoice) {
      modifications += `- Passive voice is acceptable and often preferred\n`;
    }
    if (style.allowances.complexSentences) {
      modifications += `- Complex sentences are acceptable for complex ideas\n`;
    }
    if (style.allowances.contractions) {
      modifications += `- Contractions ("don't", "can't") are encouraged\n`;
    }
    if (style.allowances.fragmentSentences) {
      modifications += `- Sentence fragments are acceptable for effect\n`;
    }
    if (style.allowances.unconventionalGrammar) {
      modifications += `- Non-standard grammar is acceptable for artistic/stylistic effect\n`;
    }
  }
  
  // Suggestions to emphasize
  if (Object.keys(style.suggestions).length > 0) {
    modifications += `\n**Enhanced Suggestions** (actively promote these):\n`;
    if (style.suggestions.activeVoice) {
      modifications += `- Suggest active voice for more dynamic communication\n`;
    }
    if (style.suggestions.conciseSentences) {
      modifications += `- Suggest breaking up long sentences for clarity\n`;
    }
    if (style.suggestions.actionVerbs) {
      modifications += `- Suggest stronger, more specific action verbs\n`;
    }
    if (style.suggestions.sensoryDetails) {
      modifications += `- Suggest adding sensory details and emotional elements\n`;
    }
    if (style.suggestions.accessibility) {
      modifications += `- Suggest simpler vocabulary when complex terms aren't necessary\n`;
    }
    if (style.suggestions.personalVoice) {
      modifications += `- Encourage personal voice and authentic expression\n`;
    }
  }
  
  return modifications;
};