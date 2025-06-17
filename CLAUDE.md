# WordWise AI - Claude Development Guide

## 🔒 Security & Development Protocol

This file contains essential security checks and development guidelines for the WordWise AI project. Claude should **ALWAYS** follow these protocols before any git operations.

---

## 🚨 MANDATORY PRE-COMMIT SECURITY CHECKS

Before **ANY** git commit or push operation, Claude must:

### 1. **API Key & Secrets Scan**
```bash
# Check for potential API keys and secrets
rg -i "api[_-]?key|secret|token|password|auth" --type-not=md --type-not=lock
rg -i "sk-|pk-|Bearer |Authorization:" --type-not=md --type-not=lock
rg -i "OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_API_KEY" --type-not=md --type-not=lock
```

### 2. **Environment Variable Exposure Check**
```bash
# Check for exposed environment variables
rg -i "process\.env\.[A-Z_]+" --type ts --type tsx --type js --type jsx
rg -i "\.env" --type-not=md --type-not=gitignore
```

### 3. **Database Connection Strings**
```bash
# Check for database URLs and connection strings
rg -i "mongodb://|postgres://|mysql://|redis://|DATABASE_URL" --type-not=md
```

### 4. **AWS/Cloud Credentials**
```bash
# Check for cloud service credentials
rg -i "aws_access_key|aws_secret|s3_bucket" --type-not=md
rg -i "VERCEL_TOKEN|NETLIFY_TOKEN" --type-not=md
```

---

## 🛡️ SECURITY REQUIREMENTS

### **Environment Variables (.env files)**
- ✅ All `.env*` files MUST be in `.gitignore`
- ✅ Use `.env.example` for template (without real values)
- ✅ Never commit actual API keys or secrets

### **API Integration Guidelines**
- ✅ Store all API keys in environment variables only
- ✅ Use server-side API routes for external API calls
- ✅ Never expose API keys in client-side code
- ✅ Implement proper error handling without exposing sensitive info

### **Database Security**
- ✅ Use connection pooling and proper authentication
- ✅ Sanitize all user inputs
- ✅ Implement proper access controls
- ✅ Never log sensitive data

---

## 📋 PRE-COMMIT CHECKLIST

Claude must verify **ALL** of these before committing:

- [ ] **No API keys** in any tracked files
- [ ] **No passwords** or tokens in source code
- [ ] **No database credentials** exposed
- [ ] **All .env files** properly ignored
- [ ] **Security scan** completed without issues
- [ ] **Dependencies** are up to date and secure
- [ ] **No console.log** statements with sensitive data
- [ ] **No TODO comments** with credentials
- [ ] **Type safety** maintained in TypeScript
- [ ] **ESLint** passes without security warnings

---

## 🔍 AUTOMATED SECURITY COMMANDS

Claude should run these commands before any git operations:

### **Full Security Audit**
```bash
# Run comprehensive security check
npm audit
npm audit fix

# Check for sensitive patterns
echo "🔍 Scanning for API keys..."
rg -i "api[_-]?key|secret|token|password" --type-not=md || echo "✅ No API keys found"

echo "🔍 Scanning for environment variables..."
rg -i "process\.env\." --type ts --type tsx || echo "✅ No exposed env vars"

echo "🔍 Scanning for database URLs..."
rg -i "mongodb://|postgres://|mysql://" --type-not=md || echo "✅ No database URLs found"

echo "🔍 Checking .env files..."
ls -la .env* 2>/dev/null && echo "⚠️  .env files found - verify they're in .gitignore" || echo "✅ No .env files in root"
```

### **Git Safety Check**
```bash
# Verify .gitignore is working
echo "🔍 Checking .gitignore effectiveness..."
git status --porcelain | grep -E "\.(env|key|pem)$" && echo "❌ Sensitive files detected!" || echo "✅ No sensitive files staged"
```

---

## 🚀 DEVELOPMENT WORKFLOW

### **Before Starting Development**
1. Pull latest changes: `git pull origin main`
2. Install dependencies: `npm install`
3. Run security audit: `npm audit`
4. Check environment setup: `npm run dev`

### **Before Committing**
1. **MANDATORY**: Run security scan (commands above)
2. Run linter: `npm run lint`
3. Run type check: `npm run build`
4. Stage files carefully: `git add .`
5. Verify staged files: `git status`
6. Commit with descriptive message

### **Before Pushing**
1. **MANDATORY**: Re-run security scan
2. Verify remote branch: `git status`
3. Push: `git push origin main`

---

## 🔐 API INTEGRATION PATTERNS

### **Correct Pattern (Server-side)**
```typescript
// ✅ CORRECT: API route (/app/api/analyze/route.ts)
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY; // Server-side only
  // ... API logic
}
```

### **Incorrect Pattern (Client-side)**
```typescript
// ❌ WRONG: Client component
const apiKey = process.env.OPENAI_API_KEY; // Exposed to client!
```

---

## 📝 COMMIT MESSAGE FORMAT

```
type(scope): Brief description

🎯 Changes:
- Feature/fix description
- Security considerations
- Dependencies updated

🔒 Security:
- Verified no API keys exposed
- Environment variables secured
- Dependencies audited

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🛠️ EMERGENCY PROCEDURES

### **If API Key Accidentally Committed:**
1. **IMMEDIATELY** revoke the exposed key from provider
2. Generate new API key
3. Update environment variables
4. Force push with removed credentials:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/file' --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```

### **If Sensitive Data Exposed:**
1. Remove from codebase immediately
2. Rotate all potentially affected credentials
3. Review git history for other exposures
4. Consider repository privacy settings

---

## 📞 SUPPORT

For security questions or incidents:
- Review this guide thoroughly
- Check official documentation for API providers
- Implement defense-in-depth security practices
- Never sacrifice security for convenience

---

**Remember: Security is not optional. Every commit should be secure by default.**

---

## 🤖 GROQ API RATE LIMIT MANAGEMENT

### **Rate Limit Constraints (Free Tier)**
- **6,000 tokens per minute (TPM)**
- **30 requests per minute (RPM)**  
- **14,400 tokens per day**
- Each grammar analysis uses ~400 tokens

### **Smart Grammar Triggering Strategy**
To avoid rate limiting, we implement intelligent analysis triggers:

#### **Analysis Triggers (Option B - Balanced Approach)**
```typescript
// Only analyze when:
1. Significant content change (10+ characters)
2. Sentence completion (ends with ., !, ?)
3. Long pause in typing (10+ seconds)
4. First analysis of session

// Skip analysis for:
- Single character changes
- Minor edits
- Rapid typing sequences
```

#### **Token Conservation**
- **Text Length Limit**: Max 500 characters per request
- **Aggressive Caching**: Avoid re-analyzing same content
- **Debouncing**: 2-second delay after trigger
- **Smart Fallback**: Basic grammar check when API fails

#### **Rate Limit Recovery**
- **Exponential backoff** when hitting 429 errors
- **Enhanced fallback** with offline grammar checking
- **Queue requests** during rate limit periods

### **Monitoring & Debugging**
```bash
# Watch for rate limit warnings in console:
[GROQ TEST] Rate limited - using enhanced fallback
[GRAMMAR] Smart analysis trigger: { textLength: 245, analysisLength: 245 }
[GRAMMAR] Skipping analysis - minor change or recent analysis
```

### **Future Upgrade Options**
- **Pro Tier ($20/month)**: 300,000 TPM, 6,000 RPM
- **Pay-as-you-go**: $0.59 per 1M tokens
- **Enterprise**: Custom limits

### **Implementation Files**
- `components/editor/text-editor.tsx` - Smart triggering logic
- `services/groq-test-service.ts` - Rate limit handling & fallback
- `stores/grammar-store.ts` - Caching & state management

---

# 🚀 PRODUCTION DEPLOYMENT PRD
## 3-Hour Sprint Plan to Launch WordWise AI

**Timeline:** 3 hours  
**Goal:** Deploy fully functional WordWise AI with authentication, document persistence, and Vercel hosting  
**Current State:** 80% complete - excellent foundation, needs database connection layer

---

## 📊 CURRENT STATUS ANALYSIS

### ✅ **What's Working (PRESERVE)**
- **Rich Text Editor**: TipTap with auto-save, formatting toolbar
- **Grammar Analysis**: Groq AI with Correctness/Clarity/Engagement analysis
- **UI/UX**: Complete responsive design, color-coded suggestions
- **Authentication System**: Fully built (currently disabled for testing)
- **Database Schema**: Complete Supabase tables with RLS policies

### ❌ **Critical Gaps (MUST FIX)**
1. **Document Persistence**: Only in memory - documents lost on refresh
2. **Authentication Disabled**: Commented out in main app
3. **Hardcoded User IDs**: Not connected to real authenticated users

---

## 🎯 3-HOUR SPRINT BREAKDOWN

### **⏰ HOUR 1: Database Document Persistence (90 minutes)**
**Priority:** CRITICAL - Core functionality gap  
**Goal:** Connect document store to Supabase database

#### **Task 1.1: Create Supabase Document Service (30 min)**
- **File:** `/services/supabase-document-service.ts`
- **Function:** CRUD operations for documents table
- **Features:**
  - `createDocument(document, userId)`
  - `updateDocument(id, content, userId)`
  - `deleteDocument(id, userId)`
  - `getUserDocuments(userId)`
  - `shareDocument(id, emails)`

#### **Task 1.2: Update Document Store with Database Integration (45 min)**
- **File:** `/stores/document-store.ts`
- **Changes:**
  - Replace mock data with real Supabase calls
  - Add loading states for async operations
  - Implement real-time sync with database
  - Add error handling for database operations

#### **Task 1.3: Connect Auto-Save to Database (15 min)**
- **File:** `/hooks/use-auto-save.ts`
- **Update:** Save to Supabase instead of just memory
- **Test:** Verify documents persist across page refreshes

### **⏰ HOUR 2: Authentication Integration (60 minutes)**
**Priority:** HIGH - Required for user-specific documents  
**Goal:** Re-enable auth and connect to document system

#### **Task 2.1: Re-enable Authentication (15 min)**
- **File:** `/app/page.tsx`
- **Action:** Uncomment ProtectedRoute wrapper (lines 133-138)
- **Test:** Verify auth flow works end-to-end

#### **Task 2.2: Connect User Context to Documents (30 min)**
- **Files:** 
  - `/stores/document-store.ts`
  - `/components/editor/text-editor.tsx`
- **Changes:**
  - Replace hardcoded 'user-1' with real authenticated user ID
  - Load user-specific documents on login
  - Clear documents on logout

#### **Task 2.3: Fix User ID References (15 min)**
- **Search & Replace:** All hardcoded user IDs throughout codebase
- **Files to check:**
  - Document creation functions
  - Grammar analysis calls
  - Auto-save operations

### **⏰ HOUR 3: Production Preparation & Deployment (30 minutes)**
**Priority:** HIGH - Launch readiness  
**Goal:** Clean code and deploy to Vercel

#### **Task 3.1: Code Cleanup (15 min)**
- **Remove debug code:**
  - Console.log statements (17 files identified)
  - TODO comments
  - Commented-out code
- **Environment check:**
  - Verify no hardcoded URLs
  - Confirm all secrets in environment variables

#### **Task 3.2: Vercel Deployment (15 min)**
- **Environment setup:**
  - Add production environment variables to Vercel
  - Configure Supabase production instance
  - Set up custom domain if provided
- **Deploy and test:**
  - Deploy to Vercel
  - Test authentication flow in production
  - Verify document persistence works
  - Test grammar analysis with production API keys

---

## 🔥 IMPLEMENTATION STRATEGY

### **Risk Mitigation Approach**
1. **Test Each Hour's Work Immediately** - Don't move to next phase until current works
2. **Commit Frequently** - After each 30-minute task, commit working state
3. **Feature Flags** - If something breaks, have quick rollback plan
4. **Preserve Working Features** - Never modify text-editor or grammar systems

### **Quality Gates**
**End of Hour 1:** Documents persist across browser refresh  
**End of Hour 2:** Full auth flow works, user sees only their documents  
**End of Hour 3:** App deployed and functional on custom domain

---

## 📋 DETAILED TASK CHECKLIST

### **HOUR 1 TASKS**

#### ✅ **Task 1.1: Create Supabase Document Service**
- [ ] Create `/services/supabase-document-service.ts`
- [ ] Implement `createDocument(document, userId)` 
- [ ] Implement `updateDocument(id, content, userId)`
- [ ] Implement `deleteDocument(id, userId)`
- [ ] Implement `getUserDocuments(userId)`
- [ ] Add error handling and TypeScript types
- [ ] Test CRUD operations manually

#### ✅ **Task 1.2: Update Document Store**
- [ ] Import Supabase service into document store
- [ ] Replace `initialDocuments` mock data with database loading
- [ ] Update `createDocument` to call Supabase
- [ ] Update `updateDocument` to call Supabase  
- [ ] Update `deleteDocument` to call Supabase
- [ ] Add loading states (`isLoading`, `error` properties)
- [ ] Test document operations in browser

#### ✅ **Task 1.3: Connect Auto-Save**
- [ ] Update auto-save hook to call Supabase service
- [ ] Test auto-save persistence across browser refresh
- [ ] Verify no performance issues with frequent saves

### **HOUR 2 TASKS**

#### ✅ **Task 2.1: Re-enable Authentication**
- [ ] Uncomment ProtectedRoute in `/app/page.tsx`
- [ ] Test sign-in flow
- [ ] Test sign-up flow  
- [ ] Test Google OAuth
- [ ] Verify redirect after auth

#### ✅ **Task 2.2: Connect User Context**
- [ ] Replace hardcoded user IDs in document store
- [ ] Load user documents on auth state change
- [ ] Clear documents on logout
- [ ] Test user isolation (User A can't see User B's docs)

#### ✅ **Task 2.3: Fix Hardcoded References**
- [ ] Search for 'user-1' in codebase and replace
- [ ] Update grammar analysis user context
- [ ] Update auto-save user context
- [ ] Test complete user flow

### **HOUR 3 TASKS**

#### ✅ **Task 3.1: Code Cleanup**
- [ ] Remove console.log statements
- [ ] Remove TODO comments
- [ ] Remove commented-out code
- [ ] Verify no API keys in source code
- [ ] Run TypeScript build check
- [ ] Run linting

#### ✅ **Task 3.2: Vercel Deployment**
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure production Supabase project
- [ ] Deploy to Vercel
- [ ] Test production deployment
- [ ] Configure custom domain (if provided)
- [ ] Final end-to-end testing

---

## ⚠️ CRITICAL SUCCESS FACTORS

### **Non-Negotiable Requirements**
1. **Document Persistence:** Users MUST be able to close browser and return to find their documents
2. **User Isolation:** Users MUST only see their own documents
3. **Working Grammar Analysis:** Core differentiator must continue working
4. **Responsive Design:** Must work on mobile and desktop

### **Acceptable Compromises (if time runs short)**
- Document collaboration features can be postponed
- Advanced subscription features can be basic
- Some UI polish can be deferred
- Analytics and monitoring can be added post-launch

### **Emergency Fallbacks**
- If Supabase integration fails: Implement localStorage persistence
- If authentication breaks: Add guest mode with browser storage
- If deployment fails: Use development environment with custom domain

---

## 🎯 SUCCESS METRICS

**Launch Definition:** App is live at custom domain where users can:
1. ✅ Sign up / Sign in successfully
2. ✅ Create and edit documents that persist
3. ✅ Receive AI grammar suggestions
4. ✅ Documents are private to each user
5. ✅ Auto-save works and preserves content

**Timeline Check:**
- **End Hour 1:** Document persistence working locally
- **End Hour 2:** Full auth flow working locally  
- **End Hour 3:** App deployed and functional in production

---

## 🚨 EMERGENCY PROTOCOLS

**If Behind Schedule:**
1. **Hour 1 Issues:** Focus on basic create/read documents only
2. **Hour 2 Issues:** Use simplified auth (skip OAuth, email/password only)
3. **Hour 3 Issues:** Deploy with minimal cleanup, fix post-launch

**If Critical Bug:**
1. Immediately roll back to last working commit
2. Implement minimal viable version of broken feature
3. Document issue for post-launch fix

**Communication:**
- Update progress every 30 minutes
- Flag blockers immediately  
- Request guidance if any step seems too complex

---

**Ready to begin 3-hour deployment sprint! 🚀**