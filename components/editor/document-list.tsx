"use client";

import * as React from "react";
import { Search, FileText, Calendar, SortAsc, SortDesc, Plus, Heart, Clock, MoreHorizontal, Edit3, Copy, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { useAuthStore } from "@/stores/auth-store";
import { Document } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/dialog";
import { DocumentService, DOCUMENT_TEMPLATES } from "@/services/document-service";

type SortOption = "title" | "updatedAt" | "createdAt" | "wordCount";
type SortDirection = "asc" | "desc";

interface DocumentListProps {
  className?: string;
  onDocumentSelect?: (documentId: string) => void;
}

export function DocumentList({ className, onDocumentSelect }: DocumentListProps) {
  const {
    documents,
    activeDocumentId,
    setActiveDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    searchDocuments,
  } = useDocumentStore();

  // Get user for database operations
  const { user } = useAuthStore();

  // Local state for UI controls
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("updatedAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  // State for document actions
  const [editingTitleId, setEditingTitleId] = React.useState<string | null>(null);
  const [editedTitle, setEditedTitle] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = React.useState(false);

  // Filter and sort documents
  const filteredAndSortedDocuments = React.useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchDocuments(searchQuery);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(doc => doc.isFavorite);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "wordCount":
          comparison = (a.stats?.wordCount || 0) - (b.stats?.wordCount || 0);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [documents, searchQuery, sortBy, sortDirection, showFavoritesOnly, searchDocuments]);

  // Handle document selection
  const handleDocumentClick = React.useCallback((document: Document) => {
    console.log('📄 Selecting document:', document.id, document.title);
    setActiveDocument(document.id);
    onDocumentSelect?.(document.id);
  }, [setActiveDocument, onDocumentSelect]);

  // Handle new document creation
  const handleCreateDocument = React.useCallback(async () => {
    if (!user?.id) {
      console.error('❌ Cannot create document: User not authenticated');
      return;
    }

    try {
      const newDoc = await createDocument("Untitled Document", "", user.id);
      console.log('📝 DocumentList created new document:', newDoc.id, newDoc.title);
      onDocumentSelect?.(newDoc.id);
    } catch (error) {
      console.error('❌ DocumentList failed to create document:', error);
    }
  }, [createDocument, onDocumentSelect, user?.id]);

  // Handle sort change
  const handleSortChange = React.useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      // Toggle direction if same sort option
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set new sort option with default direction
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "title" ? "asc" : "desc");
    }
  }, [sortBy]);

  // Document action handlers
  const handleRenameDocument = React.useCallback((document: Document) => {
    setEditingTitleId(document.id);
    setEditedTitle(document.title);
  }, []);

  const handleSaveTitle = React.useCallback(async (documentId: string) => {
    if (!editedTitle.trim()) return;
    
    try {
      await updateDocument(documentId, { title: editedTitle.trim() });
      setEditingTitleId(null);
      setEditedTitle("");
    } catch (error) {
      console.error('Failed to update document title:', error);
    }
  }, [editedTitle, updateDocument]);

  const handleCancelEdit = React.useCallback(() => {
    setEditingTitleId(null);
    setEditedTitle("");
  }, []);

  const handleDuplicateDocument = React.useCallback(async (document: Document) => {
    if (!user?.id) {
      console.error('❌ Cannot duplicate document: User not authenticated');
      return;
    }

    try {
      const duplicateData = DocumentService.duplicateDocument(document);
      const newDoc = await createDocument(duplicateData.title, duplicateData.content, user.id);
      
      // Update the newly created document with additional data from duplicate
      setTimeout(async () => {
        await updateDocument(newDoc.id, {
          tags: duplicateData.tags,
          stats: duplicateData.stats,
          settings: duplicateData.settings,
          analysis: duplicateData.analysis,
          sharing: duplicateData.sharing,
          status: duplicateData.status,
          folderId: duplicateData.folderId,
          templateId: duplicateData.templateId,
        }, user.id);
      }, 100);
      
      console.log('📋 Document duplicated:', newDoc.title);
    } catch (error) {
      console.error('Failed to duplicate document:', error);
    }
  }, [createDocument, updateDocument, user?.id]);

  const handleDeleteDocument = React.useCallback((document: Document) => {
    const validation = DocumentService.canDeleteDocument(document);
    if (!validation.canDelete) {
      alert(validation.reason);
      return;
    }
    
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!documentToDelete) return;
    
    try {
      // Prepare backup before deletion
      const { backupData, auditLog } = DocumentService.prepareForDeletion(documentToDelete);
      console.log('📦 Document backup created:', auditLog);
      
      deleteDocument(documentToDelete.id);
      
      setDocumentToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  }, [documentToDelete, deleteDocument]);

  const handleExportDocument = React.useCallback((document: Document, format: 'txt' | 'md' | 'html' | 'json' = 'txt') => {
    try {
      DocumentService.downloadDocument(document, format);
    } catch (error) {
      console.error('Failed to export document:', error);
    }
  }, []);

  const handleCreateFromTemplate = React.useCallback(async (templateKey: keyof typeof DOCUMENT_TEMPLATES) => {
    if (!user?.id) {
      console.error('❌ Cannot create document from template: User not authenticated');
      return;
    }

    try {
      const templateData = DocumentService.createNewDocument(templateKey);
      const newDoc = await createDocument(templateData.title, templateData.content, user.id);
      
      // Update the newly created document with additional data from template
      setTimeout(async () => {
        await updateDocument(newDoc.id, {
          tags: templateData.tags,
          stats: templateData.stats,
          settings: templateData.settings,
          analysis: templateData.analysis,
          sharing: templateData.sharing,
          status: templateData.status,
        }, user.id);
      }, 100);
      
      console.log('📋 Document created from template:', templateKey, newDoc.title);
      onDocumentSelect?.(newDoc.id);
      setShowTemplateMenu(false);
    } catch (error) {
      console.error('Failed to create document from template:', error);
    }
  }, [createDocument, updateDocument, onDocumentSelect, user?.id]);

  // Format date for display (client-side only to prevent hydration errors)
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Close template menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTemplateMenu && !target.closest('.template-menu-container')) {
        setShowTemplateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplateMenu]);

  const formatDate = React.useCallback((dateString: string) => {
    if (!isClient) {
      // Return a static format for SSR to prevent hydration mismatches
      return new Date(dateString).toLocaleDateString();
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, [isClient]);

  // Get sort icon
  const getSortIcon = React.useCallback((option: SortOption) => {
    if (sortBy !== option) return null;
    return sortDirection === "asc" ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />;
  }, [sortBy, sortDirection]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with New Document Button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="relative template-menu-container">
          <Button
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
          
          {/* Template Selection Menu */}
          {showTemplateMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Content Templates</div>
                
                {/* Quick blank document */}
                <button
                  onClick={() => handleCreateFromTemplate('blank')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md flex items-center gap-3"
                >
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Blank Document</div>
                    <div className="text-xs text-muted-foreground">Start from scratch</div>
                  </div>
                </button>
                
                <div className="border-t my-2"></div>
                
                {/* Social Media Templates */}
                <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Social Media</div>
                <button
                  onClick={() => handleCreateFromTemplate('twitterThread')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  🧵 Twitter/X Thread
                </button>
                <button
                  onClick={() => handleCreateFromTemplate('linkedinPost')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  💼 LinkedIn Post
                </button>
                <button
                  onClick={() => handleCreateFromTemplate('instagramCaption')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  📸 Instagram Caption
                </button>
                
                <div className="border-t my-2"></div>
                
                {/* Video Content */}
                <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Video Content</div>
                <button
                  onClick={() => handleCreateFromTemplate('youtubeScript')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  🎬 YouTube Script
                </button>
                <button
                  onClick={() => handleCreateFromTemplate('youtubeDescription')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  📺 YouTube Description
                </button>
                
                <div className="border-t my-2"></div>
                
                {/* Marketing */}
                <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Marketing</div>
                <button
                  onClick={() => handleCreateFromTemplate('emailNewsletter')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  📧 Email Newsletter
                </button>
                <button
                  onClick={() => handleCreateFromTemplate('seoBlogPost')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  📝 SEO Blog Post
                </button>
                <button
                  onClick={() => handleCreateFromTemplate('contentBrief')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                >
                  📋 Content Brief
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-3 border-b border-border">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center justify-between">
          {/* Favorites Filter */}
          <Button
            variant={showFavoritesOnly ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="flex items-center gap-2"
          >
            <Heart className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
            Favorites
          </Button>

          {/* Sort Options */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Sort:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSortChange("title")}
              className="flex items-center gap-1 text-xs"
            >
              Title {getSortIcon("title")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSortChange("updatedAt")}
              className="flex items-center gap-1 text-xs"
            >
              Modified {getSortIcon("updatedAt")}
            </Button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedDocuments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || showFavoritesOnly ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {searchQuery
                ? `No documents match "${searchQuery}". Try a different search term.`
                : showFavoritesOnly
                ? "You haven't favorited any documents yet. Click the heart icon on any document to add it to favorites."
                : "Create your first document to get started with your writing journey."
              }
            </p>
            {!searchQuery && !showFavoritesOnly && (
              <Button onClick={handleCreateDocument} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create First Document
              </Button>
            )}
          </div>
        ) : (
          /* Document Items */
          <div className="p-2 space-y-2">
            {filteredAndSortedDocuments.map((document) => (
              <Card
                key={document.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border",
                  "hover:border-primary/20 group",
                  activeDocumentId === document.id && "ring-2 ring-primary border-primary bg-primary/5"
                )}
                onClick={() => handleDocumentClick(document)}
              >
                <CardContent className="p-4">
                  {/* Document Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      {editingTitleId === document.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                handleSaveTitle(document.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={() => handleSaveTitle(document.id)}
                            className="text-sm font-medium"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                          {document.title}
                        </h4>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(document.updatedAt.toISOString())}
                        </span>
                        {document.stats?.wordCount && (
                          <span>{document.stats.wordCount} words</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Favorite */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(document.id);
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Toggle favorite"
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4",
                            document.isFavorite && "fill-red-500 text-red-500"
                          )}
                        />
                      </Button>

                      {/* Rename */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameDocument(document);
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Rename document"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      {/* Duplicate */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateDocument(document);
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Duplicate document"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      {/* Export */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportDocument(document, 'txt');
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Export as text file"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(document);
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Document Preview */}
                  {document.plainText && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {document.plainText.slice(0, 120)}
                      {document.plainText.length > 120 && "..."}
                    </p>
                  )}

                  {/* Document Tags */}
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {document.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                          {tag}
                        </span>
                      ))}
                      {document.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{document.tags.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Document Status Indicators */}
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {document.stats?.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {document.stats.readingTime} min read
                        </span>
                      )}
                      {document.stats?.characterCount && (
                        <span>{document.stats.characterCount} chars</span>
                      )}
                    </div>
                    
                    {/* Active Document Indicator */}
                    {activeDocumentId === document.id && (
                      <span className="text-primary font-medium">Active</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Document Count */}
      {filteredAndSortedDocuments.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            {filteredAndSortedDocuments.length} {filteredAndSortedDocuments.length === 1 ? "document" : "documents"}
            {searchQuery && ` matching "${searchQuery}"`}
            {showFavoritesOnly && " in favorites"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Document"
        description={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDocumentToDelete(null);
          setDeleteDialogOpen(false);
        }}
      />
    </div>
  );
}