# WordWise AI - Intelligent Writing Assistant

A Grammarly-like text editor powered by AI for enhanced writing with real-time grammar suggestions, style improvements, and document scoring.

## 🚀 Features

- **Real-time Grammar Analysis** - AI-powered grammar and spell checking using Groq API
- **Smart Suggestions** - Accept/dismiss grammar corrections with one click
- **Document Scoring** - Overall writing quality assessment with detailed metrics
- **Auto-save** - Automatic document saving with 2-second debounce
- **Three-column Layout** - Document list, editor, and suggestions panel
- **TipTap Editor** - Rich text editing with formatting toolbar
- **Rate Limit Optimization** - Smart triggering to avoid API limits

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.3.3, React, TypeScript
- **Editor**: TipTap (rich text editor)
- **AI**: Groq API (llama-3.1-8b-instant model)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Database**: Supabase (authentication & storage)

### Project Structure
```
wordwise-ai/
├── app/                    # Next.js app router
├── components/            
│   ├── editor/            # Text editor components
│   ├── grammar/           # Grammar suggestions UI
│   ├── layout/            # App layout components
│   └── ui/                # Reusable UI components
├── services/              # API services (Groq integration)
├── stores/                # Zustand state management
├── hooks/                 # Custom React hooks
└── supabase/             # Database & auth configuration
```

## 🤖 Groq API Rate Limit Management

### Current Strategy: Smart Triggering (Option B)

To avoid hitting Groq's free tier rate limits (6,000 TPM, 30 RPM), we implement intelligent analysis triggers:

#### Analysis Triggers
Grammar analysis only runs when:
- **Significant changes**: 10+ character difference
- **Sentence completion**: Text ends with `.`, `!`, `?`
- **Typing pauses**: 10+ seconds since last analysis
- **First analysis**: Initial document load

#### Token Conservation
- **500 character limit** per request (saves ~200 tokens)
- **2-second debouncing** after trigger
- **Aggressive caching** prevents duplicate analysis
- **Smart fallback** when API is rate limited

#### Monitoring
Watch console for rate limit optimization:
```bash
[GRAMMAR] Smart analysis trigger: { textLength: 245, lengthDiff: 15 }
[GRAMMAR] Skipping analysis - minor change or recent analysis
[GROQ TEST] Rate limited - using enhanced fallback
```

### Rate Limit Constraints
- **Free Tier**: 6,000 tokens/min, 30 requests/min, 14,400 tokens/day
- **Pro Tier**: 300,000 tokens/min, 6,000 requests/min ($20/month)
- **Each Analysis**: ~400 tokens average

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Groq API key

### Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Add your API keys:
   ```env
   NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Running the App
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linting
```

### Security Guidelines
- ⚠️ **Never commit API keys** - Use environment variables
- ✅ **All `.env*` files** must be in `.gitignore`
- ✅ **Run security scan** before committing (see CLAUDE.md)

## 📝 Usage

1. **Create Documents**: Click "New" to create a document
2. **Start Writing**: Type in the editor with real-time formatting
3. **Grammar Suggestions**: View AI-powered suggestions in right panel
4. **Accept/Dismiss**: Click buttons to apply or ignore suggestions
5. **Document Scoring**: Monitor writing quality with live scores
6. **Auto-save**: Documents save automatically every 2 seconds

## 🔧 Key Components

### Text Editor (`components/editor/text-editor.tsx`)
- TipTap integration with formatting toolbar
- Smart grammar analysis triggering
- Auto-save with debouncing
- Real-time word/character counting

### Grammar Service (`services/groq-test-service.ts`)
- Groq API integration with rate limiting
- Caching and error handling
- Fallback grammar checking
- Token usage optimization

### Grammar Store (`stores/grammar-store.ts`)
- Zustand state management
- Accept/reject suggestion tracking
- Issue filtering and scoring

## 🚨 Rate Limiting Solutions

If you hit rate limits frequently:

1. **Increase debounce delay** (currently 2s)
2. **Reduce text length limit** (currently 500 chars)
3. **Add more smart triggers** (paragraph completion, etc.)
4. **Upgrade to Pro tier** for 50x more tokens
5. **Implement offline grammar** as primary with AI as enhancement

## 🤝 Contributing

1. Read `CLAUDE.md` for development guidelines
2. Follow security protocols before committing
3. Run rate limit tests before deploying
4. Document any API changes or new triggers

## 📊 Performance Metrics

- **Grammar Analysis**: Sub-2 second response time
- **Auto-save**: 2-second debounce with retry logic
- **Rate Limit Efficiency**: 90%+ request reduction vs naive approach
- **Token Usage**: ~400 tokens per analysis (optimized)

## 🔗 Links

- [Groq API Documentation](https://console.groq.com/docs/rate-limits)
- [Supabase Dashboard](https://supabase.com)
- [TipTap Documentation](https://tiptap.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

Built with ❤️ using Next.js, Groq AI, and modern web technologies.