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

## Note
This log only tracks FAILED attempts to avoid repeating unsuccessful approaches. Do not assume solutions that worked in one area will work in another.