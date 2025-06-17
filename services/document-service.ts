import { Document, WritingStyle } from '@/types';
import { nanoid } from 'nanoid';

// =============================================================================
// DOCUMENT TEMPLATES
// =============================================================================

interface DocumentTemplate {
  title: string;
  content: string;
  plainText: string;
  tags: string[];
  writingStyle: WritingStyle;
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  blank: {
    title: 'Untitled Document',
    content: '<p></p>',
    plainText: '',
    tags: [],
    writingStyle: 'general',
  },
  
  // SOCIAL MEDIA TEMPLATES
  twitterThread: {
    title: 'Twitter/X Thread',
    content: `<h1>🧵 Thread Title</h1>
<p><strong>1/</strong> Hook: Start with something that grabs attention. What's the problem, insight, or question you're addressing? (240 chars)</p>
<p><strong>2/</strong> Context: Provide background or set up the story. Why should people care about this? (280 chars)</p>
<p><strong>3/</strong> Main point 1: First key insight or step. Use bullet points or numbers for clarity. (280 chars)</p>
<p><strong>4/</strong> Main point 2: Second key insight. Include data, examples, or personal experience. (280 chars)</p>
<p><strong>5/</strong> Main point 3: Third key insight. Keep building your argument or story. (280 chars)</p>
<p><strong>6/</strong> Conclusion: Summarize the key takeaway. What action do you want readers to take? (280 chars)</p>
<p><strong>7/</strong> CTA: "Retweet if this helped you" or "Follow for more [topic]" or ask an engaging question. (280 chars)</p>`,
    plainText: `🧵 Thread Title

1/ Hook: Start with something that grabs attention. What's the problem, insight, or question you're addressing? (240 chars)

2/ Context: Provide background or set up the story. Why should people care about this? (280 chars)

3/ Main point 1: First key insight or step. Use bullet points or numbers for clarity. (280 chars)

4/ Main point 2: Second key insight. Include data, examples, or personal experience. (280 chars)

5/ Main point 3: Third key insight. Keep building your argument or story. (280 chars)

6/ Conclusion: Summarize the key takeaway. What action do you want readers to take? (280 chars)

7/ CTA: "Retweet if this helped you" or "Follow for more [topic]" or ask an engaging question. (280 chars)`,
    tags: ['social-media', 'twitter', 'thread'],
    writingStyle: 'casual',
  },

  linkedinPost: {
    title: 'LinkedIn Post',
    content: `<h1>Professional LinkedIn Post</h1>
<p><strong>Hook (First Line):</strong> Start with a bold statement, question, or surprising fact that stops the scroll.</p>
<p><strong>Personal Story/Context:</strong> Share a brief personal experience, lesson learned, or industry insight. Make it relatable.</p>
<p><strong>Key Insight/Value:</strong> What's the main takeaway? What can your audience learn or apply?</p>
<ul>
<li>Point 1: Specific, actionable advice</li>
<li>Point 2: Supporting evidence or example</li>
<li>Point 3: Practical application</li>
</ul>
<p><strong>Call to Action:</strong> Ask a question, encourage engagement, or invite connections.</p>
<p><strong>Hashtags:</strong> #Industry #Skill #Trending (3-5 relevant hashtags)</p>`,
    plainText: `Professional LinkedIn Post

Hook (First Line): Start with a bold statement, question, or surprising fact that stops the scroll.

Personal Story/Context: Share a brief personal experience, lesson learned, or industry insight. Make it relatable.

Key Insight/Value: What's the main takeaway? What can your audience learn or apply?

• Point 1: Specific, actionable advice
• Point 2: Supporting evidence or example  
• Point 3: Practical application

Call to Action: Ask a question, encourage engagement, or invite connections.

Hashtags: #Industry #Skill #Trending (3-5 relevant hashtags)`,
    tags: ['social-media', 'linkedin', 'professional'],
    writingStyle: 'business',
  },

  instagramCaption: {
    title: 'Instagram Caption',
    content: `<h1>📸 Instagram Caption</h1>
<p><strong>Hook:</strong> Start with an emoji or attention-grabbing first line that relates to your image.</p>
<p><strong>Story/Context:</strong> Tell the story behind the photo. What was happening? How did you feel?</p>
<p><strong>Value/Insight:</strong> Share a lesson, tip, or insight your audience can use. Make it valuable.</p>
<p><strong>Personal Touch:</strong> Add vulnerability, humor, or behind-the-scenes details to build connection.</p>
<p><strong>Call to Action:</strong> Ask a question, encourage saves/shares, or direct to link in bio.</p>
<p><strong>Hashtags:</strong> 
#yourbrand #niche #trending #community #engagement #content #creator #lifestyle #inspiration #motivation</p>`,
    plainText: `📸 Instagram Caption

Hook: Start with an emoji or attention-grabbing first line that relates to your image.

Story/Context: Tell the story behind the photo. What was happening? How did you feel?

Value/Insight: Share a lesson, tip, or insight your audience can use. Make it valuable.

Personal Touch: Add vulnerability, humor, or behind-the-scenes details to build connection.

Call to Action: Ask a question, encourage saves/shares, or direct to link in bio.

Hashtags: 
#yourbrand #niche #trending #community #engagement #content #creator #lifestyle #inspiration #motivation`,
    tags: ['social-media', 'instagram', 'visual-content'],
    writingStyle: 'casual',
  },

  // VIDEO CONTENT TEMPLATES
  youtubeScript: {
    title: 'YouTube Video Script',
    content: `<h1>🎬 [Video Title] - YouTube Script</h1>
<h2>Hook (0-15 seconds)</h2>
<p><strong>Pattern A:</strong> "In this video, I'm going to show you [specific outcome] that [specific audience] can use to [specific benefit]."</p>
<p><strong>Pattern B:</strong> Start with the end result: "This is what [success looks like], and by the end of this video, you'll know exactly how to [achieve it]."</p>

<h2>Introduction (15-30 seconds)</h2>
<p>Quick personal intro: "Hey everyone, it's [name] and today we're talking about [topic]."</p>
<p>Value proposition: "If you're [target audience], this video will help you [specific benefit]."</p>
<p>Content preview: "We'll cover [point 1], [point 2], and [point 3]."</p>

<h2>Main Content (2-8 minutes)</h2>
<h3>Point 1: [Title]</h3>
<p>[Explanation, examples, demonstrations]</p>

<h3>Point 2: [Title]</h3>
<p>[Explanation, examples, demonstrations]</p>

<h3>Point 3: [Title]</h3>
<p>[Explanation, examples, demonstrations]</p>

<h2>Conclusion & CTA (30-60 seconds)</h2>
<p><strong>Summary:</strong> "So to recap, we covered [brief summary]."</p>
<p><strong>Value reinforcement:</strong> "Now you have [specific tools/knowledge] to [achieve outcome]."</p>
<p><strong>Subscribe CTA:</strong> "If this helped you, smash that like button and subscribe for more [content type]."</p>
<p><strong>Next video tease:</strong> "Next week, I'm showing you [related topic]."</p>`,
    plainText: `🎬 [Video Title] - YouTube Script

Hook (0-15 seconds)
Pattern A: "In this video, I'm going to show you [specific outcome] that [specific audience] can use to [specific benefit]."
Pattern B: Start with the end result: "This is what [success looks like], and by the end of this video, you'll know exactly how to [achieve it]."

Introduction (15-30 seconds)
Quick personal intro: "Hey everyone, it's [name] and today we're talking about [topic]."
Value proposition: "If you're [target audience], this video will help you [specific benefit]."
Content preview: "We'll cover [point 1], [point 2], and [point 3]."

Main Content (2-8 minutes)
Point 1: [Title]
[Explanation, examples, demonstrations]

Point 2: [Title]
[Explanation, examples, demonstrations]

Point 3: [Title]
[Explanation, examples, demonstrations]

Conclusion & CTA (30-60 seconds)
Summary: "So to recap, we covered [brief summary]."
Value reinforcement: "Now you have [specific tools/knowledge] to [achieve outcome]."
Subscribe CTA: "If this helped you, smash that like button and subscribe for more [content type]."
Next video tease: "Next week, I'm showing you [related topic]."`,
    tags: ['video', 'youtube', 'script', 'content-creation'],
    writingStyle: 'casual',
  },

  youtubeDescription: {
    title: 'YouTube Description',
    content: `<h1>📺 YouTube Video Description</h1>
<p><strong>Hook & Summary (First 125 chars):</strong> Compelling description that appears in search results and before "show more."</p>

<p><strong>Detailed Description:</strong> Expand on what viewers will learn, why it matters, and what makes this video valuable.</p>

<p><strong>🎯 Key Takeaways:</strong></p>
<ul>
<li>Main point 1 with timestamp</li>
<li>Main point 2 with timestamp</li>
<li>Main point 3 with timestamp</li>
</ul>

<p><strong>⏰ Timestamps:</strong></p>
<ul>
<li>0:00 Introduction</li>
<li>1:15 [Section 1]</li>
<li>3:30 [Section 2]</li>
<li>6:45 [Section 3]</li>
<li>9:20 Conclusion</li>
</ul>

<p><strong>🔗 Useful Links:</strong></p>
<ul>
<li>Resource mentioned: [link]</li>
<li>Free template: [link]</li>
<li>Related video: [link]</li>
</ul>

<p><strong>📱 Connect with me:</strong></p>
<ul>
<li>Website: [link]</li>
<li>Twitter: [handle]</li>
<li>Instagram: [handle]</li>
</ul>

<p><strong>🏷️ Tags:</strong> #keyword1 #keyword2 #keyword3 #niche #contentcreator</p>`,
    plainText: `📺 YouTube Video Description

Hook & Summary (First 125 chars): Compelling description that appears in search results and before "show more."

Detailed Description: Expand on what viewers will learn, why it matters, and what makes this video valuable.

🎯 Key Takeaways:
• Main point 1 with timestamp
• Main point 2 with timestamp  
• Main point 3 with timestamp

⏰ Timestamps:
• 0:00 Introduction
• 1:15 [Section 1]
• 3:30 [Section 2]
• 6:45 [Section 3]
• 9:20 Conclusion

🔗 Useful Links:
• Resource mentioned: [link]
• Free template: [link]
• Related video: [link]

📱 Connect with me:
• Website: [link]
• Twitter: [handle]
• Instagram: [handle]

🏷️ Tags: #keyword1 #keyword2 #keyword3 #niche #contentcreator`,
    tags: ['video', 'youtube', 'description', 'seo'],
    writingStyle: 'casual',
  },

  // MARKETING CONTENT
  emailNewsletter: {
    title: 'Email Newsletter',
    content: `<h1>📧 Newsletter: [Subject Line]</h1>
<p><strong>Subject Line:</strong> [Keep it under 50 characters, create curiosity, avoid spam words]</p>
<p><strong>Preview Text:</strong> [Complements subject line, 90-110 characters]</p>

<h2>Header</h2>
<p>Hey [First Name],</p>
<p>[Personal greeting or quick check-in - build rapport]</p>

<h2>Main Content</h2>
<h3>📰 This Week's Highlights</h3>
<ul>
<li><strong>[Topic 1]:</strong> Brief description with value for reader</li>
<li><strong>[Topic 2]:</strong> Brief description with value for reader</li>
<li><strong>[Topic 3]:</strong> Brief description with value for reader</li>
</ul>

<h3>💡 Quick Tip</h3>
<p>[One actionable tip they can implement immediately]</p>

<h3>📚 What I'm Reading/Watching</h3>
<p>[Book, article, or video recommendation with why it's valuable]</p>

<h2>Call to Action</h2>
<p><strong>Primary CTA:</strong> [One clear action - reply, click, share]</p>

<h2>Footer</h2>
<p>That's all for this week!</p>
<p>Reply and let me know [specific question related to content].</p>
<p>Talk soon,<br/>[Your name]</p>

<p><em>P.S. [Additional value, personal note, or secondary CTA]</em></p>`,
    plainText: `📧 Newsletter: [Subject Line]

Subject Line: [Keep it under 50 characters, create curiosity, avoid spam words]
Preview Text: [Complements subject line, 90-110 characters]

Header
Hey [First Name],
[Personal greeting or quick check-in - build rapport]

Main Content
📰 This Week's Highlights
• [Topic 1]: Brief description with value for reader
• [Topic 2]: Brief description with value for reader
• [Topic 3]: Brief description with value for reader

💡 Quick Tip
[One actionable tip they can implement immediately]

📚 What I'm Reading/Watching
[Book, article, or video recommendation with why it's valuable]

Call to Action
Primary CTA: [One clear action - reply, click, share]

Footer
That's all for this week!
Reply and let me know [specific question related to content].

Talk soon,
[Your name]

P.S. [Additional value, personal note, or secondary CTA]`,
    tags: ['email', 'newsletter', 'marketing'],
    writingStyle: 'casual',
  },

  seoBlogPost: {
    title: 'SEO Blog Post',
    content: `<h1>[Primary Keyword]: [Compelling Title]</h1>
<p><strong>Meta Description:</strong> [150-160 characters including primary keyword and compelling reason to click]</p>

<h2>Introduction</h2>
<p>[Hook that addresses the reader's pain point or desire]</p>
<p>[Include primary keyword naturally in first 100 words]</p>
<p>[Brief overview of what they'll learn and why it matters]</p>

<h2>[H2 with Secondary Keyword]</h2>
<p>[Content that provides value and answers search intent]</p>
<p>[Include related keywords naturally]</p>

<h2>[H2 with Long-tail Keyword]</h2>
<ul>
<li>[Actionable point 1]</li>
<li>[Actionable point 2]</li>
<li>[Actionable point 3]</li>
</ul>

<h2>Common Mistakes to Avoid</h2>
<p>[Address common problems or misconceptions]</p>

<h2>Tools and Resources</h2>
<ul>
<li>[Helpful tool 1] - [brief description]</li>
<li>[Helpful tool 2] - [brief description]</li>
</ul>

<h2>Conclusion</h2>
<p>[Summarize key points and reinforce value]</p>
<p>[Include call-to-action: comment, share, subscribe]</p>

<p><strong>Internal Links:</strong> [Link to 2-3 related posts on your site]</p>
<p><strong>Target Keywords:</strong> [Primary], [Secondary], [Long-tail]</p>
<p><strong>Word Count Target:</strong> 1,500-2,500 words</p>`,
    plainText: `[Primary Keyword]: [Compelling Title]

Meta Description: [150-160 characters including primary keyword and compelling reason to click]

Introduction
[Hook that addresses the reader's pain point or desire]
[Include primary keyword naturally in first 100 words]
[Brief overview of what they'll learn and why it matters]

[H2 with Secondary Keyword]
[Content that provides value and answers search intent]
[Include related keywords naturally]

[H2 with Long-tail Keyword]
• [Actionable point 1]
• [Actionable point 2]  
• [Actionable point 3]

Common Mistakes to Avoid
[Address common problems or misconceptions]

Tools and Resources
• [Helpful tool 1] - [brief description]
• [Helpful tool 2] - [brief description]

Conclusion
[Summarize key points and reinforce value]
[Include call-to-action: comment, share, subscribe]

Internal Links: [Link to 2-3 related posts on your site]
Target Keywords: [Primary], [Secondary], [Long-tail]
Word Count Target: 1,500-2,500 words`,
    tags: ['blog', 'seo', 'content-marketing', 'organic-traffic'],
    writingStyle: 'business',
  },

  contentBrief: {
    title: 'Content Brief',
    content: `<h1>📋 Content Brief: [Project Title]</h1>

<h2>Project Overview</h2>
<p><strong>Content Type:</strong> [Blog post, video, social media, email, etc.]</p>
<p><strong>Platform:</strong> [Where this will be published]</p>
<p><strong>Due Date:</strong> [Deadline]</p>
<p><strong>Word Count:</strong> [Target length]</p>

<h2>Audience & Goals</h2>
<p><strong>Target Audience:</strong> [Who is this for? Demographics, interests, pain points]</p>
<p><strong>Primary Goal:</strong> [Education, awareness, conversion, engagement]</p>
<p><strong>Success Metrics:</strong> [How will you measure success?]</p>

<h2>Content Strategy</h2>
<p><strong>Main Topic:</strong> [Core subject]</p>
<p><strong>Angle/Hook:</strong> [Unique perspective or approach]</p>
<p><strong>Key Message:</strong> [Main takeaway for audience]</p>
<p><strong>Tone:</strong> [Professional, casual, friendly, authoritative]</p>

<h2>SEO & Keywords</h2>
<p><strong>Primary Keyword:</strong> [Main keyword to rank for]</p>
<p><strong>Secondary Keywords:</strong> [Supporting keywords]</p>
<p><strong>Search Intent:</strong> [Informational, navigational, transactional]</p>

<h2>Content Outline</h2>
<ul>
<li><strong>Hook:</strong> [How to grab attention]</li>
<li><strong>Section 1:</strong> [Key point]</li>
<li><strong>Section 2:</strong> [Key point]</li>
<li><strong>Section 3:</strong> [Key point]</li>
<li><strong>CTA:</strong> [Desired action]</li>
</ul>

<h2>Resources & References</h2>
<ul>
<li>[Research source 1]</li>
<li>[Research source 2]</li>
<li>[Competitor examples]</li>
</ul>`,
    plainText: `📋 Content Brief: [Project Title]

Project Overview
Content Type: [Blog post, video, social media, email, etc.]
Platform: [Where this will be published]
Due Date: [Deadline]
Word Count: [Target length]

Audience & Goals
Target Audience: [Who is this for? Demographics, interests, pain points]
Primary Goal: [Education, awareness, conversion, engagement]
Success Metrics: [How will you measure success?]

Content Strategy
Main Topic: [Core subject]
Angle/Hook: [Unique perspective or approach]
Key Message: [Main takeaway for audience]
Tone: [Professional, casual, friendly, authoritative]

SEO & Keywords
Primary Keyword: [Main keyword to rank for]
Secondary Keywords: [Supporting keywords]
Search Intent: [Informational, navigational, transactional]

Content Outline
• Hook: [How to grab attention]
• Section 1: [Key point]
• Section 2: [Key point]
• Section 3: [Key point]
• CTA: [Desired action]

Resources & References
• [Research source 1]
• [Research source 2]
• [Competitor examples]`,
    tags: ['planning', 'content-strategy', 'brief'],
    writingStyle: 'business',
  },
};

// =============================================================================
// DOCUMENT SERVICE CLASS
// =============================================================================

export class DocumentService {
  /**
   * Creates a new document with optional template
   */
  static createNewDocument(
    template: keyof typeof DOCUMENT_TEMPLATES = 'blank',
    customTitle?: string
  ): Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed'> {
    const templateData = DOCUMENT_TEMPLATES[template] || DOCUMENT_TEMPLATES.blank;
    const wordCount = templateData.plainText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      title: customTitle || templateData.title,
      content: templateData.content,
      plainText: templateData.plainText,
      userId: 'user-1', // TODO: Get from auth context
      tags: [...templateData.tags],
      stats: {
        wordCount: wordCount,
        characterCount: templateData.plainText.length,
        characterCountNoSpaces: templateData.plainText.replace(/\s/g, '').length,
        paragraphCount: templateData.plainText.split(/\n\s*\n/).filter(p => p.trim()).length || 1,
        sentenceCount: templateData.plainText.split(/[.!?]+/).filter(s => s.trim()).length || 1,
        avgWordsPerSentence: wordCount / (templateData.plainText.split(/[.!?]+/).filter(s => s.trim()).length || 1),
        readingTime: Math.ceil(wordCount / 200),
        readabilityScore: 85, // Default score
      },
      analysis: {
        grammarScore: 100,
        styleScore: 100,
        clarityScore: 100,
        engagementScore: 100,
        grammarIssues: [],
        styleSuggestions: [],
        clarityIssues: [],
        tone: {
          primaryTone: 'neutral',
          confidence: 0.8,
          tones: [],
          sentiment: 0,
          formality: 0.5,
        },
        lastAnalyzedAt: new Date(),
        isAnalyzing: false,
      },
      settings: {
        autoSave: true,
        autoSaveInterval: 30,
        grammarChecking: true,
        styleSuggestions: true,
        claritySuggestions: true,
        realTimeAnalysis: true,
        language: 'en',
        writingStyle: templateData.writingStyle,
        targetAudience: 'general',
      },
      sharing: {
        isPublic: false,
        accessLevel: 'edit',
        collaborators: [],
        commentsEnabled: true,
        suggestionsEnabled: true,
      },
      status: 'draft',
      version: 1,
      isFavorite: false,
      isArchived: false,
    };
  }

  /**
   * Duplicates an existing document
   */
  static duplicateDocument(document: Document): Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed'> {
    return {
      title: `${document.title} (Copy)`,
      content: document.content,
      plainText: document.plainText,
      userId: document.userId,
      tags: [...(document.tags || [])],
      stats: document.stats ? { ...document.stats } : {
        wordCount: 0,
        characterCount: 0,
        characterCountNoSpaces: 0,
        paragraphCount: 0,
        sentenceCount: 0,
        avgWordsPerSentence: 0,
        readingTime: 0,
        readabilityScore: 0,
      },
      analysis: { ...document.analysis },
      settings: { ...document.settings },
      sharing: { ...document.sharing },
      status: document.status,
      folderId: document.folderId,
      templateId: document.templateId,
      version: 1, // Reset version for copy
      isFavorite: false, // Don't copy favorite status
      isArchived: false, // Don't copy archive status
    };
  }

  /**
   * Exports a document to various formats
   */
  static exportDocument(document: Document, format: 'txt' | 'md' | 'html' | 'json' = 'txt'): {
    content: string;
    filename: string;
    mimeType: string;
  } {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}`;

    switch (format) {
      case 'txt':
        return {
          content: this.exportToPlainText(document),
          filename: `${baseFilename}.txt`,
          mimeType: 'text/plain',
        };
      
      case 'md':
        return {
          content: this.exportToMarkdown(document),
          filename: `${baseFilename}.md`,
          mimeType: 'text/markdown',
        };
      
      case 'html':
        return {
          content: this.exportToHtml(document),
          filename: `${baseFilename}.html`,
          mimeType: 'text/html',
        };
      
      case 'json':
        return {
          content: this.exportToJson(document),
          filename: `${baseFilename}.json`,
          mimeType: 'application/json',
        };
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Downloads the exported document
   */
  static downloadDocument(doc: Document, format: 'txt' | 'md' | 'html' | 'json' = 'txt'): void {
    const { content, filename, mimeType } = this.exportDocument(doc, format);
    
    // Create a blob with the content
    const blob = new Blob([content], { type: mimeType });
    
    // Create a temporary download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validates document before deletion
   */
  static canDeleteDocument(document: Document): {
    canDelete: boolean;
    reason?: string;
  } {
    // Add business rules for deletion here
    // For example, you might prevent deletion of:
    // - Documents that are currently being edited by others
    // - Documents with specific tags or metadata
    // - Documents created within a certain timeframe
    
    // Example business rule: prevent deletion of shared documents
    if (document.sharing.isPublic) {
      return {
        canDelete: false,
        reason: 'This document is public and cannot be deleted. Make it private first.',
      };
    }

    return { canDelete: true };
  }

  /**
   * Prepares document data for deletion (e.g., backup, audit log)
   */
  static prepareForDeletion(document: Document): {
    backupData: string;
    auditLog: {
      documentId: string;
      title: string;
      deletedAt: Date;
      wordCount: number;
      tags: string[];
    };
  } {
    return {
      backupData: JSON.stringify(document, null, 2),
      auditLog: {
        documentId: document.id,
        title: document.title,
        deletedAt: new Date(),
        wordCount: document.stats.wordCount,
        tags: document.tags || [],
      },
    };
  }

  // =============================================================================
  // PRIVATE EXPORT METHODS
  // =============================================================================

  private static exportToPlainText(doc: Document): string {
    const header = `${doc.title}
${'='.repeat(doc.title.length)}

Created: ${doc.createdAt.toLocaleDateString()}
Last Modified: ${doc.updatedAt.toLocaleDateString()}
Word Count: ${doc.stats.wordCount}
Tags: ${doc.tags?.join(', ') || 'None'}

${'='.repeat(40)}

`;
    
    return header + doc.plainText;
  }

  private static exportToMarkdown(doc: Document): string {
    // Convert HTML to Markdown (simplified version)
    let markdown = doc.content
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')
      .replace(/<h5>(.*?)<\/h5>/g, '##### $1\n')
      .replace(/<h6>(.*?)<\/h6>/g, '###### $1\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '\n')
      .replace(/<ol>/g, '')
      .replace(/<\/ol>/g, '\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n')
      .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags

    const header = `# ${doc.title}

**Created:** ${doc.createdAt.toLocaleDateString()}  
**Last Modified:** ${doc.updatedAt.toLocaleDateString()}  
**Word Count:** ${doc.stats.wordCount}  
**Tags:** ${doc.tags?.join(', ') || 'None'}

---

`;

    return header + markdown;
  }

  private static exportToHtml(doc: Document): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
        }
        .metadata {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            font-size: 14px;
        }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin-left: 0;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <strong>Created:</strong> ${doc.createdAt.toLocaleDateString()}<br>
        <strong>Last Modified:</strong> ${doc.updatedAt.toLocaleDateString()}<br>
        <strong>Word Count:</strong> ${doc.stats.wordCount}<br>
        <strong>Tags:</strong> ${doc.tags?.join(', ') || 'None'}
    </div>
    
    <h1>${doc.title}</h1>
    
    ${doc.content}
</body>
</html>`;
  }

  private static exportToJson(doc: Document): string {
    const exportData = {
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}