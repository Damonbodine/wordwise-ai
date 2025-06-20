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
  searchQuery?: string;
}

export function DocumentList({ className, onDocumentSelect, searchQuery = "" }: DocumentListProps) {
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

  // Local state for UI controls (searchQuery now comes from props)
  const [sortBy, setSortBy] = React.useState<SortOption>("updatedAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  // State for document actions
  const [editingTitleId, setEditingTitleId] = React.useState<string | null>(null);
  const [editedTitle, setEditedTitle] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);

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


  // Format date for display (client-side only to prevent hydration errors)
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);


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

      {/* Filters and Sort Controls */}
      <div className="p-4 border-b border-border bg-gradient-to-b from-background/50 to-background">
        {/* Filter and Sort Controls */}
        <div className="flex items-center justify-between">
          {/* Favorites Filter */}
          <Button
            variant={showFavoritesOnly ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              showFavoritesOnly && "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
            )}
          >
            <Heart className={cn("w-4 h-4 transition-all", showFavoritesOnly && "fill-current scale-110")} />
            <span>Favorites</span>
            {showFavoritesOnly && (
              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200">
                {documents.filter(doc => doc.isFavorite && !doc.isArchived).length}
              </span>
            )}
          </Button>

          {/* Sort Options */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1">
            <span className="text-xs text-muted-foreground mr-2 px-2">Sort:</span>
            <Button
              variant={sortBy === "title" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSortChange("title")}
              className="flex items-center gap-1 text-xs h-7 px-2"
            >
              <span>Title</span>
              {getSortIcon("title")}
            </Button>
            <Button
              variant={sortBy === "updatedAt" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSortChange("updatedAt")}
              className="flex items-center gap-1 text-xs h-7 px-2"
            >
              <span>Modified</span>
              {getSortIcon("updatedAt")}
            </Button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedDocuments.length === 0 ? (
          /* Enhanced Empty State */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl scale-150"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-2xl">
                {searchQuery ? (
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ) : showFavoritesOnly ? (
                  <Heart className="w-12 h-12 text-muted-foreground" />
                ) : (
                  <FileText className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {searchQuery ? "No matches found" : showFavoritesOnly ? "No favorites yet" : "Ready to start writing?"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
              {searchQuery
                ? `No documents match "${searchQuery}". Try adjusting your search or browse all documents.`
                : showFavoritesOnly
                ? "Mark documents as favorites by clicking the heart icon. They'll appear here for quick access."
                : "Create your first document and let AI help you write better, faster, and with more confidence."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {!searchQuery && !showFavoritesOnly && (
                <Button onClick={handleCreateDocument} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4" />
                  Create First Document
                </Button>
              )}
              {showFavoritesOnly && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowFavoritesOnly(false)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  View All Documents
                </Button>
              )}
            </div>
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