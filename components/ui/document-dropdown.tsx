"use client";

import * as React from "react";
import { Search, FileText, Calendar, Heart, Edit3, Copy, Trash2, Download, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { useAuthStore } from "@/stores/auth-store";
import { Document } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/dialog";
import { DocumentService } from "@/services/document-service";

interface DocumentDropdownProps {
  onDocumentSelect?: (documentId: string) => void;
  onClose?: () => void;
}

export function DocumentDropdown({ onDocumentSelect, onClose }: DocumentDropdownProps) {
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

  const { user } = useAuthStore();

  // Local state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingTitleId, setEditingTitleId] = React.useState<string | null>(null);
  const [editedTitle, setEditedTitle] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);

  // Filter documents (show recent 10 by default, all when searching)
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => !doc.isArchived);
    
    if (searchQuery.trim()) {
      filtered = searchDocuments(searchQuery);
    } else {
      // Show most recent 10 documents when not searching
      filtered = [...filtered]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
    }
    
    return filtered;
  }, [documents, searchQuery, searchDocuments]);

  // Handle document selection
  const handleDocumentClick = React.useCallback((document: Document) => {
    setActiveDocument(document.id);
    onDocumentSelect?.(document.id);
    onClose?.();
  }, [setActiveDocument, onDocumentSelect, onClose]);

  // Handle new document creation
  const handleCreateDocument = React.useCallback(async () => {
    if (!user?.id) {
      console.error('❌ Cannot create document: User not authenticated');
      return;
    }

    try {
      const newDoc = await createDocument("Untitled Document", "", user.id);
      console.log('📝 DocumentDropdown created new document:', newDoc.id, newDoc.title);
      onDocumentSelect?.(newDoc.id);
      onClose?.();
    } catch (error) {
      console.error('❌ DocumentDropdown failed to create document:', error);
    }
  }, [createDocument, onDocumentSelect, onClose, user?.id]);

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
      const { backupData, auditLog } = DocumentService.prepareForDeletion(documentToDelete);
      console.log('📦 Document backup created:', auditLog);
      
      deleteDocument(documentToDelete.id);
      
      setDocumentToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  }, [documentToDelete, deleteDocument]);

  const handleDuplicateDocument = React.useCallback(async (document: Document) => {
    if (!user?.id) {
      console.error('❌ Cannot duplicate document: User not authenticated');
      return;
    }

    try {
      const duplicateData = DocumentService.duplicateDocument(document);
      const newDoc = await createDocument(duplicateData.title, duplicateData.content, user.id);
      
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
      onDocumentSelect?.(newDoc.id);
      onClose?.();
    } catch (error) {
      console.error('Failed to duplicate document:', error);
    }
  }, [createDocument, updateDocument, onDocumentSelect, onClose, user?.id]);

  const handleExportDocument = React.useCallback((document: Document, format: 'txt' | 'md' | 'html' | 'json' = 'txt') => {
    try {
      DocumentService.downloadDocument(document, format);
    } catch (error) {
      console.error('Failed to export document:', error);
    }
  }, []);

  // Format date for display
  const formatDate = React.useCallback((dateString: string) => {
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
  }, []);

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Recent Documents</h3>
          <Button
            onClick={handleCreateDocument}
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground hover:text-foreground"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No documents match your search" : "No documents yet"}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateDocument} size="sm" className="mt-2">
                <Plus className="w-3 h-3 mr-1" />
                Create First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="p-1">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={cn(
                  "group relative p-2 rounded-md cursor-pointer transition-colors hover:bg-accent",
                  activeDocumentId === document.id && "bg-primary/10 border border-primary/20"
                )}
                onClick={() => handleDocumentClick(document)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-2">
                    {editingTitleId === document.id ? (
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
                        className="h-6 text-xs font-medium"
                        autoFocus
                      />
                    ) : (
                      <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {document.title}
                      </h4>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(document.updatedAt.toISOString())}</span>
                      {document.stats?.wordCount && (
                        <>
                          <span>•</span>
                          <span>{document.stats.wordCount} words</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(document.id);
                      }}
                      className="w-6 h-6 p-0"
                      title="Toggle favorite"
                    >
                      <Heart
                        className={cn(
                          "w-3 h-3",
                          document.isFavorite && "fill-red-500 text-red-500"
                        )}
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameDocument(document);
                      }}
                      className="w-6 h-6 p-0"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateDocument(document);
                      }}
                      className="w-6 h-6 p-0"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(document);
                      }}
                      className="w-6 h-6 p-0 text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Document Preview */}
                {document.plainText && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1 leading-relaxed">
                    {document.plainText.slice(0, 80)}
                    {document.plainText.length > 80 && "..."}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!searchQuery && filteredDocuments.length === 10 && documents.filter(doc => !doc.isArchived).length > 10 && (
        <div className="p-2 border-t border-border">
          <button
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            View all {documents.filter(doc => !doc.isArchived).length} documents in sidebar
          </button>
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