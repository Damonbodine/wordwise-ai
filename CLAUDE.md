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