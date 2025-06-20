'use client';

import React from 'react';
import { useWritingStyleStore } from '@/stores/writing-style-store';
import { WRITING_STYLES } from '@/lib/writing-styles';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WritingStyleSelector() {
  const { currentStyle, setWritingStyle } = useWritingStyleStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStyleSelect = (styleId: string) => {
    setWritingStyle(styleId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 text-sm font-normal text-muted-foreground hover:text-foreground"
      >
        <span className="text-xs text-muted-foreground mr-2 hidden md:inline">Writing Style:</span>
        <span className="mr-1">{currentStyle.emoji}</span>
        <span className="hidden sm:inline">{currentStyle.name}</span>
        <ChevronDown className={cn(
          "ml-1 h-3 w-3 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-[220px] bg-background border border-border rounded-md shadow-lg z-50">
          <div className="p-1">
            {WRITING_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
                  currentStyle.id === style.id && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{style.emoji}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{style.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {style.shortDesc}
                      </span>
                    </div>
                  </div>
                  {currentStyle.id === style.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}