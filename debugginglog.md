# WordWise AI - Debugging Log

## Purpose
This file tracks failed attempts at fixing issues to avoid repeating the same mistakes and going down unsuccessful paths.

---

## Current Issue: Cannot access 'editor' before initialization

### Error Details
- **Error**: `Uncaught Error: Cannot access 'editor' before initialization`
- **Location**: `text-editor.tsx:192:7`
- **Root Cause**: useEffect dependency array includes `editor` before `useEditor` hook is called

### Failed Attempts

#### Attempt 1: Adding editor to dependency arrays
- **Date**: 2025-06-19
- **Change**: Added `editor` to multiple useEffect dependency arrays
- **Files**: `components/editor/text-editor.tsx` lines 192, 243
- **Result**: FAILED - Caused "Cannot access 'editor' before initialization" error
- **Reason**: useEffect hooks with `editor` in dependencies run before `useEditor` hook initializes the editor
- **Lesson**: Never put `editor` in useEffect dependency arrays that are defined before the `useEditor` hook call

#### Attempt 2: Adding handleSuggestionClick to dependencies
- **Date**: 2025-06-19  
- **Change**: Added `handleSuggestionClick` to useEffect dependency array
- **Files**: `components/editor/text-editor.tsx` line 243
- **Result**: FAILED - Created circular dependency causing compilation errors
- **Reason**: handleSuggestionClick is passed to editor extension, creating circular reference
- **Lesson**: Avoid including callback functions that are passed to editor extensions in useEffect dependencies

---

## Grammar Highlighting Issues

### Failed Attempts

#### Attempt 1: Using inline styles for text decoration
- **Date**: 2025-06-19
- **Change**: Applied `border-bottom: 2px wavy` via inline styles in grammar-highlight-extension.ts
- **Files**: `components/editor/grammar-highlight-extension.ts` lines 22-42
- **Result**: FAILED - Spelling underlines didn't appear
- **Reason**: `border-bottom: wavy` is invalid CSS syntax, only works with solid/dotted/dashed
- **Lesson**: Use CSS classes with `text-decoration: wavy` instead of inline styles for wavy underlines

---

## Rules for Future Debugging

1. **Test incrementally** - Make one small change at a time
2. **Document failures immediately** - Add to this log when attempts fail
3. **Check browser console** - Always verify no new errors introduced
4. **Verify compilation** - Ensure TypeScript compiles without errors
5. **Clear cache when needed** - Run `rm -rf .next` if webpack cache issues occur

---

## Current Issue: Grammar underlines not appearing

### Error Details
- **Error**: Blue grammar underlines not showing in editor
- **Root Cause**: GROQ API returning empty issues array `{"issues":[]}`
- **Location**: Grammar detection failing at API level, not rendering level

### Failed Attempts

#### Attempt 1: Debugging underline rendering system
- **Date**: 2025-06-19
- **Change**: Investigated useEffect, extension updates, decoration creation
- **Files**: N/A - investigation only
- **Result**: FAILED - Root cause is earlier in flow (GROQ not detecting errors)
- **Reason**: API returns empty issues array, so no issues to underline
- **Lesson**: Always verify data source before debugging rendering

---

---

## Voice Assistant Transcription Issues

### Error Details  
- **Error**: `Invalid query string` from Deepgram API
- **Location**: `/api/voice/transcribe` endpoint
- **Root Cause**: Incorrect query parameters in Deepgram API URL based on Deepgram error testing (scripts/deepgram-error-report-detailed.json)

### Failed Attempts

#### Attempt 1: Adding encoding parameter to query string
- **Date**: 2025-06-20
- **Change**: Added `&encoding=webm` to Deepgram API URL query parameters  
- **Files**: `app/api/voice/transcribe/route.ts` line 33
- **Result**: FAILED - Deepgram returned "Invalid query string" error
- **Reason**: Deepgram doesn't accept `encoding` as a query parameter; format specified via Content-Type header only
- **Lesson**: Check Deepgram API documentation for valid query parameters

#### Attempt 2: Removing encoding but keeping malformed parameters
- **Date**: 2025-06-20
- **Change**: Removed `&encoding=webm` but kept `model=nova-2&punctuate=true&smart_format=true&language=en`
- **Files**: `app/api/voice/transcribe/route.ts` line 33  
- **Result**: FAILED - Still getting "Invalid query string" error
- **Reason**: According to scripts/deepgram-error-report-detailed.json, boolean parameters may need different formatting
- **Lesson**: Use Deepgram error handler from scripts/deepgram-error-handler-implementation.ts for parameter validation

#### Attempt 3: Removing language parameter, keeping core parameters
- **Date**: 2025-06-20
- **Change**: Removed `&language=en`, kept only `model=nova-2&punctuate=true&smart_format=true`
- **Files**: `app/api/voice/transcribe/route.ts` line 33
- **Result**: PARTIAL SUCCESS - Fixed "Invalid query string" but now getting "corrupt or unsupported data" 
- **Evidence**: One successful transcription logged, then failures
- **Reason**: Audio chunk combination method creates invalid WebM files
- **Lesson**: WebM chunks from MediaRecorder cannot be simply concatenated - need proper audio handling

#### Attempt 4: Lowering minimum file size threshold
- **Date**: 2025-06-20
- **Change**: Reduced minimum file size from 1000 bytes to 500 bytes to allow smaller chunks
- **Files**: `app/api/voice/transcribe/route.ts` line 20
- **Result**: FAILED - Still getting "Deepgram API error: 400" for most chunks
- **Evidence**: Audio chunks now processed (not skipped) but Deepgram rejects them with 400 errors
- **Reason**: Individual WebM chunks from MediaRecorder are not valid standalone audio files
- **Lesson**: Need to accumulate chunks into complete WebM container or use different audio format/approach

---

---

## Current Issue: Zustand Grammar Store Syntax Error

### Error Details
- **Error**: `Expression expected` at line 455 pointing to closing parenthesis
- **Location**: `stores/grammar-store.ts:455:1`
- **Root Cause**: Incorrect Zustand store syntax structure causing parser confusion

### Failed Attempts

#### Attempt 1: Adding missing closing brace without understanding structure
- **Date**: 2025-06-21
- **Change**: Added closing brace `};` before final closing parentheses
- **Files**: `stores/grammar-store.ts` line 449
- **Result**: FAILED - Created syntax error "Expression expected" 
- **Reason**: Misunderstood Zustand `create()()` double parentheses structure
- **Lesson**: Must understand Zustand syntax: `create<Type>()(devtools(fn, options))`

#### Attempt 2: Removing extra closing parenthesis without fixing structure
- **Date**: 2025-06-21
- **Change**: Tried to remove extra `)` at end but kept wrong structure
- **Files**: `stores/grammar-store.ts` lines 454-455
- **Result**: FAILED - Same "Expression expected" error persists
- **Reason**: Fixed symptom not root cause - devtools function structure still wrong
- **Lesson**: Need to verify entire Zustand store structure, not just end parentheses

#### Attempt 3: Using sed command to fix syntax
- **Date**: 2025-06-21
- **Change**: Used `sed -i '' 's/));$/);/'` to remove extra parenthesis
- **Files**: `stores/grammar-store.ts` 
- **Result**: FAILED - Command didn't work as expected, syntax error remained
- **Reason**: sed didn't match the exact pattern, manual edit needed
- **Lesson**: Use Edit tool for precise syntax fixes instead of sed commands

#### Attempt 4: Adding missing closing parenthesis for create()() syntax
- **Date**: 2025-06-21
- **Change**: Changed `);` to `));` at end assuming create()() needs double closing
- **Files**: `stores/grammar-store.ts` line 455
- **Result**: FAILED - Still getting "Declaration or statement expected" on lines 455:1 and 455:2
- **Reason**: May be misunderstanding Zustand syntax - need to check existing working stores
- **Lesson**: Verify correct Zustand syntax by examining working examples in codebase

### SUCCESSFUL RESOLUTION
- **Date**: 2025-06-21
- **Solution**: Fixed Zustand store structure by correcting return statement
- **Change**: Changed `}` to `};` on line 449 to properly close the return object
- **Files**: `stores/grammar-store.ts` lines 448-449
- **Result**: SUCCESS - Development server starts without syntax errors
- **Root Cause**: Missing semicolon in return statement within Zustand store function
- **Lesson**: Zustand stores require proper JavaScript object syntax: `return { ... };` not `return { ... }`

---

## Note
This log tracks FAILED attempts to avoid repeating unsuccessful approaches. When successful resolutions are found, they are documented for reference.