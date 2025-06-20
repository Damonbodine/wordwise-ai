# Document Upload Feature Implementation Plan

## 🎯 **Goal**: Add .doc file upload capability to the "New" button dropdown that integrates seamlessly with existing document management.

---

## 📋 **Requirements Analysis**
✅ **Integration Point**: "New" button dropdown menu  
✅ **File Type**: .doc files only (Microsoft Word)  
✅ **File Size Limit**: 1 megabyte maximum  
✅ **Storage**: Save to Supabase (same as other documents)  
✅ **User Experience**: Add to user's document list automatically  
✅ **Editor Compatibility**: Must work in existing TipTap editor  

---

## 🏗️ **Technical Architecture**

### **File Processing Flow**:
```
User clicks "Upload Document" → File Input → Validate (.doc, <1MB) → Parse with mammoth.js → Extract HTML + Plain Text → Create Document → Save to Supabase → Add to Document List → Navigate to Editor
```

### **Key Components Needed**:
1. **Document Parser Service** (`services/document-parser.ts`)
2. **Upload UI Component** (integrate into header template menu)
3. **File Validation Utilities**
4. **Error Handling & User Feedback**

---

## 🔧 **Implementation Steps**

### **Phase 1: Dependencies & Parser Service (30 min)**

#### **1.1: Install Required Dependencies**
```bash
npm install mammoth @types/mammoth
```
- **mammoth**: Converts .doc/.docx files to HTML and plain text
- **@types/mammoth**: TypeScript definitions

#### **1.2: Create Document Parser Service**
**File**: `/services/document-parser.ts`
```typescript
interface ParsedDocument {
  title: string;
  content: string;
  plainText: string;
}

class DocumentParserService {
  async parseDocFile(file: File): Promise<ParsedDocument> {
    // Validate file first
    this.validateFileSize(file);
    this.validateFileType(file);
    
    // Parse with mammoth
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const plainTextResult = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      title: this.extractTitleFromContent(result.value) || file.name.replace('.doc', ''),
      content: result.value,
      plainText: plainTextResult.value
    };
  }
  
  private extractTitleFromContent(content: string): string {
    // Extract first h1, h2, or first sentence as title
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '');
    
    const h2Match = content.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (h2Match) return h2Match[1].replace(/<[^>]*>/g, '');
    
    // Fallback to first sentence
    const textContent = content.replace(/<[^>]*>/g, '');
    const firstSentence = textContent.split('.')[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }
  
  private validateFileSize(file: File): void {
    if (file.size > 1048576) { // 1MB
      throw new Error('File size must be less than 1MB');
    }
  }
  
  private validateFileType(file: File): void {
    if (!file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
      throw new Error('Only .doc and .docx files are supported');
    }
  }
}

export const documentParserService = new DocumentParserService();
```

### **Phase 2: UI Integration (45 min)**

#### **2.1: Add Upload Option to New Button Menu**
**File**: `/components/layout/header.tsx`

**Import additions**:
```typescript
import { FileUp } from 'lucide-react';
import { documentParserService } from '@/services/document-parser';
```

**Add after the "Blank Document" button**:
```typescript
{/* Upload Document */}
<div className="border-t my-2"></div>
<div className="text-xs font-medium text-muted-foreground mb-1 px-2">Import</div>

{/* Hidden file input */}
<input
  ref={fileInputRef}
  type="file"
  accept=".doc,.docx"
  onChange={handleFileUpload}
  style={{ display: 'none' }}
/>

<button
  onClick={triggerFileUpload}
  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md flex items-center gap-3"
>
  <FileUp className="w-4 h-4 text-muted-foreground" />
  <div>
    <div className="font-medium">Upload Document</div>
    <div className="text-xs text-muted-foreground">Import .doc file (max 1MB)</div>
  </div>
</button>
```

**Handler functions**:
```typescript
const fileInputRef = useRef<HTMLInputElement>(null);
const [isUploading, setIsUploading] = useState(false);

const triggerFileUpload = () => {
  fileInputRef.current?.click();
};

const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  setIsUploading(true);
  setShowTemplateMenu(false);
  
  try {
    // Parse the document
    const parsedDoc = await documentParserService.parseDocFile(file);
    
    // Create document in store
    const newDoc = await createDocument(
      parsedDoc.title,
      parsedDoc.content,
      userId
    );
    
    // Update the document with parsed plain text
    await updateDocument(newDoc.id, {
      plainText: parsedDoc.plainText,
      tags: [...(newDoc.tags || []), 'imported', 'doc-file']
    }, userId);
    
    // Navigate to the new document
    onDocumentSelect?.(newDoc.id);
    
    // Success feedback
    console.log('📄 Document uploaded successfully:', parsedDoc.title);
    
  } catch (error) {
    console.error('Failed to upload document:', error);
    // Show error toast here
    alert(error instanceof Error ? error.message : 'Failed to upload document');
    
  } finally {
    setIsUploading(false);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};
```

#### **2.2: Loading State Integration**
Add loading indicator to the template menu when uploading:
```typescript
{isUploading && (
  <div className="px-3 py-2 text-sm text-center">
    <div className="flex items-center gap-2">
      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
      <span>Processing document...</span>
    </div>
  </div>
)}
```

### **Phase 3: Integration with Document System (30 min)**

#### **3.1: Document Creation Flow**
- Use existing `createDocument` function from document store
- Pass parsed HTML content and plain text
- Auto-generate title from document content or filename
- Set appropriate tags (e.g., "imported", "doc-file")
- Use default writing style (user can change later)

#### **3.2: Error Handling & User Feedback**
```typescript
// Add to utils or create separate file
export const uploadErrorMessages = {
  FILE_TOO_LARGE: 'File too large. Please select a file under 1MB.',
  INVALID_FILE_TYPE: 'Please select a .doc or .docx file.',
  PARSE_ERROR: 'Unable to read document. Please check the file and try again.',
  SAVE_ERROR: 'Failed to save document. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.'
};
```

### **Phase 4: Testing & Polish (15 min)**

#### **4.1: Edge Case Handling**
- Empty .doc files → Create document with placeholder content
- Large files (near 1MB limit) → Clear size validation message
- Files with complex formatting → Preserve basic formatting, strip advanced features
- Files with images → Extract text only, ignore images
- Corrupted files → Clear error message with suggestion to try another file

#### **4.2: User Experience Enhancements**
- Progress indicator during upload
- Success/error toast notifications
- Automatic navigation to uploaded document
- Preserve file metadata where possible

---

## 🛡️ **Security & Validation**

### **File Validation**:
```typescript
const validateFile = (file: File) => {
  // Check file extension
  const allowedExtensions = ['.doc', '.docx'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Only .doc and .docx files are supported');
  }
  
  // Check file size (1MB = 1,048,576 bytes)
  if (file.size > 1048576) {
    throw new Error('File size must be less than 1MB');
  }
  
  // Check MIME type as additional validation
  const validMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  // Note: Some browsers may not set MIME type correctly, so this is optional validation
  if (file.type && !validMimeTypes.includes(file.type)) {
    console.warn('Unexpected MIME type:', file.type);
  }
};
```

### **Content Sanitization**:
```typescript
const sanitizeHtml = (html: string): string => {
  // Use DOMPurify or similar library to clean HTML
  // Remove script tags, event handlers, dangerous attributes
  // Preserve formatting tags like <p>, <h1>, <strong>, etc.
  return html; // Implement proper sanitization
};
```

---

## 📱 **User Experience Flow**

### **Happy Path**:
1. User clicks "New" button in header
2. Dropdown menu opens showing templates
3. User sees "Upload Document" option under "Import" section
4. User clicks "Upload Document"
5. File picker opens, filtered to .doc/.docx files
6. User selects a .doc file under 1MB
7. Loading indicator shows "Processing document..."
8. Document appears in document list with extracted title
9. User is automatically navigated to editor with imported content
10. Success feedback (console log or toast): "Document imported successfully!"

### **Error Scenarios**:
- **File too large**: "File too large. Please select a file under 1MB."
- **Wrong file type**: "Please select a .doc or .docx file."
- **Corrupted file**: "Unable to read document. Please check the file and try again."
- **Network error**: "Failed to save document. Please try again."
- **Empty file**: Creates document with title but empty content

---

## 🔄 **Integration Points**

### **Existing Systems Used**:
✅ **Document Store**: Uses `createDocument` and `updateDocument` functions  
✅ **Supabase Integration**: Leverages existing document persistence  
✅ **Header Component**: Extends existing template menu  
✅ **TipTap Editor**: Works with current editor setup  
✅ **Authentication**: Uses current user context  

### **No Breaking Changes**:
✅ All existing document creation methods continue to work  
✅ Template system remains unchanged  
✅ Document list functionality preserved  
✅ Grammar analysis will work on uploaded content  
✅ Writing style profiles apply to uploaded documents  

---

## ⚡ **Performance Considerations**

- **Client-side Processing**: File parsing done in browser to reduce server load
- **Memory Management**: Large files processed efficiently with ArrayBuffer
- **Network Efficiency**: Only send processed HTML/text to server, not raw file
- **Async Operations**: File reading and parsing don't block UI

---

## 📦 **Dependencies to Add**

```json
{
  "dependencies": {
    "mammoth": "^1.6.0"
  },
  "devDependencies": {
    "@types/mammoth": "^1.6.0"
  }
}
```

---

## 🧪 **Testing Checklist**

### **File Validation Tests**:
- [ ] Valid .doc file under 1MB → Should import successfully
- [ ] Valid .docx file under 1MB → Should import successfully  
- [ ] File exactly 1MB → Should import successfully
- [ ] File over 1MB → Should show size error
- [ ] .txt file → Should show file type error
- [ ] .pdf file → Should show file type error
- [ ] No file selected → Should do nothing

### **Content Processing Tests**:
- [ ] Document with headings → Should extract first heading as title
- [ ] Document without headings → Should use filename as title
- [ ] Empty document → Should create with filename, empty content
- [ ] Document with complex formatting → Should preserve basic formatting
- [ ] Document with images → Should extract text, ignore images

### **Integration Tests**:
- [ ] Uploaded document appears in document list
- [ ] User automatically navigated to uploaded document
- [ ] Document persists after page refresh
- [ ] Grammar analysis works on uploaded content
- [ ] Writing style selection works with uploaded document

---

## 📝 **Implementation Notes**

### **Future Enhancements** (not in initial scope):
- Support for .pdf files
- Support for .txt files  
- Batch upload multiple files
- Drag & drop file upload
- Image extraction and handling
- Advanced formatting preservation
- Document conversion between formats

### **Alternative Libraries** (if mammoth.js doesn't work):
- **docx-preview**: For .docx files only
- **pizzip + docxtemplater**: More complex but powerful
- **Server-side parsing**: Move parsing to backend API

---

## 🎯 **Success Criteria**

### **Functional Requirements**:
✅ Users can upload .doc files through the New button menu  
✅ Files under 1MB are processed successfully  
✅ Document content is extracted and editable in TipTap  
✅ Uploaded documents are saved to Supabase  
✅ Documents appear in the user's document list  
✅ Clear error messages for validation failures  

### **User Experience Requirements**:
✅ Upload process feels fast and responsive  
✅ Clear visual feedback during processing  
✅ Intuitive integration with existing UI  
✅ Graceful error handling with helpful messages  
✅ Automatic navigation to uploaded document  

---

**This plan provides a complete blueprint for implementing document upload functionality when ready to proceed! 🚀**