"use client";

import * as React from "react";
import { Tooltip } from "./tooltip";
import { useShortcutHelpers } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcut {
  action: string;
  description: string;
  shortcut: string;
}

interface KeyboardShortcutsTooltipProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsTooltip({ children }: KeyboardShortcutsTooltipProps) {
  const { getShortcut, isMac } = useShortcutHelpers();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const shortcuts: KeyboardShortcut[] = [
    {
      action: "save",
      description: "Save document",
      shortcut: getShortcut("save"),
    },
    {
      action: "new",
      description: "New document",
      shortcut: getShortcut("new"),
    },
    {
      action: "bold",
      description: "Bold text",
      shortcut: getShortcut("bold"),
    },
    {
      action: "italic",
      description: "Italic text",
      shortcut: getShortcut("italic"),
    },
    {
      action: "undo",
      description: "Undo",
      shortcut: getShortcut("undo"),
    },
    {
      action: "redo",
      description: "Redo",
      shortcut: getShortcut("redo"),
    },
  ];

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-medium text-foreground mb-2">Keyboard Shortcuts</div>
      <div className="grid gap-1.5">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.action} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1">
              {isClient && shortcut.shortcut.split("+").map((key, index, array) => (
                <React.Fragment key={index}>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {key}
                  </kbd>
                  {index < array.length - 1 && (
                    <span className="text-muted-foreground text-xs">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-2 mt-2">
        <div className="text-xs text-muted-foreground">
          {isMac ? "⌘ Command key" : "Ctrl key"} + letter
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      side="bottom"
      align="end"
      className="w-72"
    >
      {children}
    </Tooltip>
  );
}