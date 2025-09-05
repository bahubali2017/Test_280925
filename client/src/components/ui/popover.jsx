import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils"

/**
 * Popover root component
 */
const Popover = PopoverPrimitive.Root

/**
 * Popover trigger component
 */
const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Popover content component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof PopoverPrimitive.Content>>>}
 */
const PopoverContent = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof PopoverPrimitive.Content>>} ref
   * @returns {JSX.Element} The popover content component
   */
  (props, ref) => {
    // Create safe props object
    const safeProps = props || {};
    
    // Extract properties safely with type checking
    const className = typeof safeProps.className === 'string' ? safeProps.className : undefined;
    
    // Default align to "center" if not provided or invalid
    /** @type {'center' | 'start' | 'end'} */
    const align = safeProps.align === 'start' || safeProps.align === 'end' 
      ? safeProps.align 
      : 'center';
    
    // Default sideOffset to 4 if not provided or invalid
    const sideOffset = typeof safeProps.sideOffset === 'number' ? safeProps.sideOffset : 4;
    
    // Extract remaining props
    const otherProps = {};
    if (typeof safeProps === 'object') {
      Object.keys(safeProps).forEach(key => {
        if (!['className', 'align', 'sideOffset'].includes(key)) {
          otherProps[key] = safeProps[key];
        }
      });
    }
    
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
            className
          )}
          {...otherProps}
        />
      </PopoverPrimitive.Portal>
    );
  }
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/**
 * Export Popover components
 * @module Popover
 */
export { Popover, PopoverTrigger, PopoverContent }