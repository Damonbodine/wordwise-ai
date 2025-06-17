"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = "bottom",
  align = "center",
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = React.useCallback(() => {
    if (disabled) return;
    setIsVisible(true);
  }, [disabled]);

  const hideTooltip = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let x = 0;
    let y = 0;

    // Calculate position based on side
    switch (side) {
      case "top":
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case "bottom":
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case "left":
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case "right":
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Adjust for alignment
    if (side === "top" || side === "bottom") {
      switch (align) {
        case "start":
          x = triggerRect.left;
          break;
        case "end":
          x = triggerRect.right - tooltipRect.width;
          break;
      }
    }

    // Keep tooltip in viewport
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

    setPosition({ x, y });
  }, [side, align]);

  React.useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, updatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            side === "top" && "slide-in-from-bottom-2",
            side === "bottom" && "slide-in-from-top-2",
            side === "left" && "slide-in-from-right-2",
            side === "right" && "slide-in-from-left-2",
            className
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
          role="tooltip"
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              "absolute h-2 w-2 rotate-45 border bg-popover",
              side === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r",
              side === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2 border-l border-t",
              side === "left" && "right-[-4px] top-1/2 -translate-y-1/2 border-r border-t",
              side === "right" && "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l"
            )}
          />
        </div>
      )}
    </>
  );
}