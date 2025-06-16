"use client";

import * as React from "react";
import { Search, FileText, Calendar, SortAsc, SortDesc, Plus, Heart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { Document } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
    toggleFavorite,
    searchDocuments,
  } = useDocumentStore();

  // Local state for UI controls
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("updatedAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

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
  const handleCreateDocument = React.useCallback(() => {
    try {
      const newDoc = createDocument();
      console.log('📝 DocumentList created new document:', newDoc.id, newDoc.title);
      onDocumentSelect?.(newDoc.id);
    } catch (error) {
      console.error('❌ DocumentList failed to create document:', error);
    }
  }, [createDocument, onDocumentSelect]);

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
      {/* Header with New Document Button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button
          onClick={handleCreateDocument}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
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
                      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                        {document.title}
                      </h4>
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

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(document.id);
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4",
                            document.isFavorite && "fill-red-500 text-red-500"
                          )}
                        />
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
    </div>
  );
}