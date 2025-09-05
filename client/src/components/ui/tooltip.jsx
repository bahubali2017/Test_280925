"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "../../lib/utils"

/**
 * Tooltip provider component
 */
const TooltipProvider = TooltipPrimitive.Provider

/**
 * Tooltip root component
 */
const Tooltip = TooltipPrimitive.Root

/**
 * Tooltip trigger component
 */
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Tooltip content component props
 * @typedef {object} TooltipContentProps
 * @property {string} [className] - Additional class names
 * @property {number} [sideOffset=4] - Offset from the trigger
 */

/**
 * Tooltip content component that displays additional information when hovering
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof TooltipPrimitive.Content>>>}
 */
const TooltipContent = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof TooltipPrimitive.Content>>} ref
   * @returns {JSX.Element} The tooltip content component
   */
  (props, ref) => {
    // Create safe props object with type checking
    const safeProps = props || {};
    
    // Extract className with proper type checking using bracket notation
    let className;
    if (typeof safeProps === 'object' && safeProps !== null) {
      const classNameValue = safeProps['className'];
      if (typeof classNameValue === 'string') {
        className = classNameValue;
      }
    }
    
    // Extract sideOffset with proper default and type checking using bracket notation
    let sideOffset = 4; // Default value
    if (typeof safeProps === 'object' && safeProps !== null) {
      const sideOffsetValue = safeProps['sideOffset'];
      if (typeof sideOffsetValue === 'number' && !isNaN(sideOffsetValue)) {
        sideOffset = sideOffsetValue;
      }
    }
    
    // Extract remaining props with a type-safe approach
    /** @type {Record<string, any>} */
    const rest = {};
    if (typeof safeProps === 'object' && safeProps !== null) {
      // Use a for loop instead of Object.keys().forEach for better type safety
      const keys = Object.keys(safeProps);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== 'className' && key !== 'sideOffset') {
          rest[key] = safeProps[key];
        }
      }
    }
    
    return (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
          className
        )}
        {...rest}
      />
    );
  }
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/**
 * Export Tooltip components
 * @module Tooltip
 */
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }