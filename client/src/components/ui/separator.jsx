import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "../../lib/utils"

/**
 * Separator component props
 * @typedef {object} SeparatorProps
 * @property {string} [className] - Additional class names
 * @property {"horizontal"|"vertical"} [orientation="horizontal"] - Separator orientation
 * @property {boolean} [decorative=true] - Whether the separator is decorative
 */

/**
 * Separator component for visual division between elements
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & React.RefAttributes<React.ElementRef<typeof SeparatorPrimitive.Root>>>}
 */
const Separator = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof SeparatorPrimitive.Root>>} ref
   * @returns {JSX.Element} The separator component
   */
  (props, ref) => {
    // Extract props safely with defaults
    const safeProps = props || {};
    
    // Extract properties with proper type checking using bracket notation
    let className;
    if (typeof safeProps === 'object' && safeProps !== null && 'className' in safeProps) {
      const classNameValue = safeProps['className'];
      if (typeof classNameValue === 'string') {
        className = classNameValue;
      }
    }
    
    // Handle orientation with strong typing
    /** @type {"horizontal"|"vertical"} */
    let orientation = 'horizontal'; // Default value
    if (
      typeof safeProps === 'object' && 
      safeProps !== null && 
      'orientation' in safeProps && 
      safeProps['orientation'] === 'vertical'
    ) {
      orientation = 'vertical';
    }
    
    // Handle decorative prop with proper default
    let decorative = true; // Default value
    if (
      typeof safeProps === 'object' && 
      safeProps !== null && 
      'decorative' in safeProps && 
      safeProps['decorative'] === false
    ) {
      decorative = false;
    }
    
    // Create a clean props object without extracted properties
    const otherProps = {};
    if (typeof safeProps === 'object') {
      Object.keys(safeProps).forEach(key => {
        if (!['className', 'orientation', 'decorative'].includes(key)) {
          otherProps[key] = safeProps[key];
        }
      });
    }
    
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...otherProps}
      />
    );
  }
)

Separator.displayName = SeparatorPrimitive.Root.displayName

/**
 * Export Separator component
 * @module Separator
 */
export { Separator }