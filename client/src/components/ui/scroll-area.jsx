import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "../../lib/utils"

/**
 * A simpler approach to ScrollArea using proper typing patterns
 */

const ScrollArea = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>>} ref
   * @returns {JSX.Element} The scroll area component
   */
  (props, ref) => {
    // Extract props safely
    const { className, children, ...otherProps } = props || {};
    
    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...otherProps}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }
);

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>>} ref
   * @returns {JSX.Element} The scroll bar component
   */
  (props, ref) => {
    // Extract props safely with defaults
    const safeProps = props || {};
    
    // Use type-safe property extraction
    const className = typeof safeProps.className === 'string' ? safeProps.className : undefined;
    
    // Ensure orientation is one of the valid values
    /** @type {'vertical'|'horizontal'} */
    const orientation = safeProps.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    
    // Create a clean props object without className and orientation
    const otherProps = {};
    if (typeof safeProps === 'object') {
      Object.keys(safeProps).forEach(key => {
        if (!['className', 'orientation', 'ref'].includes(key)) {
          otherProps[key] = safeProps[key];
        }
      });
    }
    
    return (
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
          "flex touch-none select-none transition-colors",
          orientation === "vertical" &&
            "h-full w-2.5 border-l border-l-transparent p-[1px]",
          orientation === "horizontal" &&
            "h-2.5 flex-col border-t border-t-transparent p-[1px]",
          className
        )}
        {...otherProps}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
  }
);

ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

/**
 * Export ScrollArea components
 * @module ScrollArea
 */
export { ScrollArea, ScrollBar };