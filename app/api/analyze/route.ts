import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    console.log('[ANALYZE API] 🔥 Received text:', text.substring(0, 100) + '...');

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    console.log('[ANALYZE API] 🔑 API key present:', !!apiKey, 'Length:', apiKey?.length);
    if (!apiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an expert writing assistant with specialized expertise in CORRECTNESS, CLARITY, and ENGAGEMENT. Analyze text comprehensively across all three dimensions with equal focus.

## ANALYSIS FRAMEWORK

### 1. CORRECTNESS (High Priority)
**Grammar Errors**:
- Subject-verb disagreement ("The team are" → "The team is")
- Incorrect pronoun case ("between you and I" → "between you and me") 
- Dangling modifiers ("Walking to the store, the rain started")
- Run-on sentences and fragments
- Incorrect verb tense consistency
- Misplaced apostrophes ("it's" vs "its")

**Spelling & Punctuation**:
- Misspelled words and typos
- Homophones ("there/their/they're", "effect/affect")
- Missing or incorrect commas, semicolons, periods

### 2. CLARITY (High Priority)
**Sentence Structure**:
- Ambiguous pronoun references ("it", "this", "that" without clear antecedents)
- Overly complex sentences that obscure meaning
- Unclear subject-verb relationships
- Misplaced modifiers creating confusion

**Readability Issues**:
- Excessive wordiness ("in order to" → "to", "due to the fact that" → "because")
- Redundant phrases ("advance planning" → "planning")
- Vague language ("very good" → "excellent", "a lot of" → "many")
- Unclear transitions between ideas

**Word Choice**:
- Imprecise vocabulary that creates ambiguity
- Jargon without explanation for general audiences
- Inconsistent terminology for the same concept

### 3. ENGAGEMENT (Medium Priority)
**Writing Energy**:
- Passive voice overuse (when active voice is clearer and more dynamic)
- Weak verb choices ("is located" → "sits", "has the ability to" → "can")
- Monotonous sentence structure (all short or all long sentences)

**Reader Interest**:
- Generic or clichéd phrases ("think outside the box", "at the end of the day")
- Repetitive word choice within paragraphs
- Lack of specific, concrete details

**Tone & Style**:
- Inconsistent formality level
- Overly formal language for casual contexts
- Missing personality or voice in appropriate contexts

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "issues": [
    {
      "type": "grammar",
      "category": "Grammar Error",
      "severity": "high",
      "message": "Clear, actionable description (max 80 chars)",
      "explanation": "Why this improves readability, understanding, or engagement",
      "originalText": "exact text from input",
      "suggestedText": "improved version",
      "start": 0,
      "end": 0,
      "confidence": 0.85
    }
  ],
  "scores": {
    "correctness": 85,
    "clarity": 90,
    "engagement": 75,
    "delivery": 80
  }
}

FIELD VALUES:
- type: Choose ONE: "grammar", "spelling", "punctuation", "clarity", "engagement", "style"
- category: Choose ONE: "Grammar Error", "Spelling Error", "Punctuation", "Clarity Issue", "Engagement", "Style"
- severity: Choose ONE: "high", "medium", "low"

## SCORING GUIDELINES
- **Correctness**: Grammar, spelling, punctuation accuracy (100 = perfect, 80+ = good)
- **Clarity**: How easily readers understand the message (100 = crystal clear, 80+ = mostly clear)
- **Engagement**: How compelling and interesting the writing is (100 = captivating, 80+ = engaging)
- **Delivery**: How well tone and style match the intended purpose (100 = perfect match)

## ANALYSIS PRIORITIES
1. **Always flag CORRECTNESS issues** (grammar/spelling errors undermine credibility)
2. **Prioritize CLARITY improvements** that significantly improve understanding
3. **Suggest ENGAGEMENT enhancements** that don't sacrifice clarity or correctness
4. **Focus on high-impact changes** rather than minor stylistic preferences

## CRITICAL RULES
- Only suggest changes you're 85%+ confident will improve the writing
- Provide specific, actionable suggestions
- Explain WHY each change improves the text
- Respect the author's voice while enhancing clarity and engagement
- Prioritize reader understanding above all else`
          },
          {
            role: 'user',
            content: `Please analyze this text: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Analysis service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();
    console.log('[ANALYZE API] 📡 GROQ API response status:', response.status);
    console.log('[ANALYZE API] 📦 GROQ API data:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log('[ANALYZE API] ❌ No content in GROQ response');
      return NextResponse.json(
        { error: 'No analysis result' },
        { status: 500 }
      );
    }

    // Debug: Log the raw response from Groq
    console.log('[ANALYZE API] 📄 GROQ RAW RESPONSE LENGTH:', content.length);
    console.log('[ANALYZE API] 📄 GROQ RAW RESPONSE:', content);

    // Clean up the response - remove any non-JSON text
    let cleanedContent = content;
    
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // GROQ returns analysis framework + JSON, need to extract just the JSON
    console.log('[DEBUG] Looking for JSON in content of length:', cleanedContent.length);
    
    // Find the complete JSON object that contains "issues" and "scores"
    const jsonStartIndex = cleanedContent.indexOf('{');
    if (jsonStartIndex !== -1) {
      // Find the matching closing brace by counting braces
      let braceCount = 0;
      let jsonEndIndex = -1;
      
      for (let i = jsonStartIndex; i < cleanedContent.length; i++) {
        if (cleanedContent[i] === '{') braceCount++;
        if (cleanedContent[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEndIndex = i;
          break;
        }
      }
      
      if (jsonEndIndex !== -1) {
        cleanedContent = cleanedContent.substring(jsonStartIndex, jsonEndIndex + 1);
        console.log('[DEBUG] Found complete JSON, length:', cleanedContent.length);
      } else {
        console.log('[DEBUG] Could not find complete JSON - malformed response');
      }
    } else {
      // Fallback: look for any JSON object with issues array
      const issuesMatch = cleanedContent.match(/\{[\s\S]*?"issues":\s*\[[\s\S]*?\]/);
      if (issuesMatch) {
        cleanedContent = issuesMatch[0];
        // Close the JSON if it was truncated
        if (!cleanedContent.includes(']}')) {
          // Find the last complete issue object
          const lastCompleteIssue = cleanedContent.lastIndexOf('},');
          if (lastCompleteIssue > -1) {
            cleanedContent = cleanedContent.substring(0, lastCompleteIssue + 1) + ']}';
          } else {
            cleanedContent += ']}';
          }
        } else {
          cleanedContent += '}';
        }
        console.log('[DEBUG] Found issues-only JSON, length:', cleanedContent.length);
      } else {
        console.log('[DEBUG] No JSON found in content');
      }
    }

    // Fix common JSON issues from GROQ responses
    console.log('[DEBUG] Before fixing JSON issues, length:', cleanedContent.length);
    
    // 1. Fix incomplete JSON (GROQ often gets cut off)
    if (cleanedContent.includes('"issues"') && !cleanedContent.includes('"scores"')) {
      // Add missing scores object if it's not there
      cleanedContent = cleanedContent.replace(/(\]\s*)(}?)$/, '$1,"scores":{"correctness":70,"clarity":80,"engagement":80,"delivery":80}$2');
    }
    
    // 2. Fix incomplete issues array
    if (cleanedContent.includes('"issues"') && !cleanedContent.match(/\]\s*[,}]/)) {
      // Close incomplete issues array
      cleanedContent = cleanedContent.replace(/,?\s*\{[^}]*$/, '') + ']}';
      if (!cleanedContent.includes('"scores"')) {
        cleanedContent = cleanedContent.replace(/\](\s*}?)$/, '],"scores":{"correctness":70,"clarity":80,"engagement":80,"delivery":80}$1');
      }
    }
    
    // 3. Ensure proper JSON object structure
    if (!cleanedContent.endsWith('}') && cleanedContent.includes('"issues"')) {
      cleanedContent += '}';
    }
    
    console.log('[DEBUG] After fixing JSON issues, length:', cleanedContent.length);

    // Parse the JSON response from Groq
    let parsedResponse;
    console.log('[DEBUG] Final cleaned content to parse:', cleanedContent.substring(0, 200) + '...');
    try {
      parsedResponse = JSON.parse(cleanedContent);
      console.log('[DEBUG] Successfully parsed JSON, found issues:', parsedResponse.issues?.length || 0);
      
      // Ensure we have the expected structure
      if (!parsedResponse.issues || !Array.isArray(parsedResponse.issues)) {
        console.log('GROQ RESPONSE MISSING ISSUES ARRAY:', parsedResponse);
        parsedResponse = {
          issues: Array.isArray(parsedResponse) ? parsedResponse : [],
          scores: parsedResponse.scores || { correctness: 80, clarity: 80, engagement: 80, delivery: 80 }
        };
      }
      
      // Convert GROQ response format to our internal format
      parsedResponse.issues = parsedResponse.issues.map((issue: any, index: number) => {
        // Handle GROQ returning multiple values separated by |
        const parseMultiValue = (value: string) => {
          if (typeof value === 'string' && value.includes('|')) {
            return value.split('|')[0].trim();
          }
          return value;
        };
        
        return {
          id: `issue_${Date.now()}_${index}`,
          type: parseMultiValue(issue.type) || 'spelling',
          category: parseMultiValue(issue.category) || 'Spelling Error',
          severity: parseMultiValue(issue.severity) || 'medium',
          message: issue.message || 'Issue found',
          explanation: issue.explanation || 'This needs attention',
          originalText: issue.originalText || '',
          suggestedText: issue.suggestedText || '',
          confidence: issue.confidence || 0.8,
          position: {
            start: issue.start || issue.startIndex || 0,
            end: issue.end || issue.endIndex || (issue.start || issue.startIndex || 0) + (issue.originalText?.length || 0)
          }
        };
      });
      
      if (!parsedResponse.scores) {
        // Calculate scores based on issues if not provided
        const issues = parsedResponse.issues;
        const correctnessIssues = issues.filter(i => i.type === 'spelling' || i.type === 'grammar').length;
        const clarityIssues = issues.filter(i => i.type === 'clarity').length;
        const engagementIssues = issues.filter(i => i.type === 'engagement').length;
        
        parsedResponse.scores = {
          correctness: Math.max(60, 100 - (correctnessIssues * 12)),
          clarity: Math.max(70, 100 - (clarityIssues * 10)),
          engagement: Math.max(75, 100 - (engagementIssues * 8)),
          delivery: Math.max(80, 100 - (issues.length * 5))
        };
      }
      
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError);
      console.error('Raw content length:', content.length);
      console.error('Cleaned content length:', cleanedContent.length);
      
      // Try to extract any valid issues from malformed JSON
      const issueMatches = content.match(/"originalText":"([^"]+)","suggestedText":"([^"]+)"/g);
      if (issueMatches && issueMatches.length > 0) {
        console.log(`[FALLBACK] Found ${issueMatches.length} partial matches, creating basic issues`);
        const fallbackIssues = issueMatches.slice(0, 5).map((match, index) => {
          const textMatch = match.match(/"originalText":"([^"]+)","suggestedText":"([^"]+)"/);
          if (textMatch) {
            const startPos = text.indexOf(textMatch[1]);
            return {
              id: `fallback_${Date.now()}_${index}`,
              type: 'spelling',
              category: 'Spelling Error',
              severity: 'high',
              message: 'Misspelled word',
              explanation: 'Correct spelling needed',
              originalText: textMatch[1],
              suggestedText: textMatch[2],
              confidence: 0.9,
              position: {
                start: startPos,
                end: startPos + textMatch[1].length
              }
            };
          }
          return null;
        }).filter(Boolean);
        
        parsedResponse = {
          issues: fallbackIssues,
          scores: {
            correctness: Math.max(60, 100 - (fallbackIssues.length * 15)),
            clarity: 80,
            engagement: 80,
            delivery: 75
          }
        };
      } else {
        parsedResponse = {
          issues: [],
          scores: { correctness: 100, clarity: 100, engagement: 100, delivery: 100 }
        };
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Grammar analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}