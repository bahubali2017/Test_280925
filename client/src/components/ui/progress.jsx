"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

/**
 * Progress component props
 * @typedef {object} ProgressProps
 * @property {string} [className] - Additional class names
 * @property {number} [value] - Current progress value (0-100)
 */

/**
 * Progress component for displaying progress bars
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {value?: number} & React.RefAttributes<React.ElementRef<typeof ProgressPrimitive.Root>>>}
 */
const Progress = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {value?: number}} props
   * @param {React.ForwardedRef<React.ElementRef<typeof ProgressPrimitive.Root>>} ref
   * @returns {JSX.Element} The progress component
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
    
    // Extract value with proper default and type checking using bracket notation
    let value = 0;
    if (typeof safeProps === 'object' && safeProps !== null) {
      const rawValue = safeProps['value'];
      if (typeof rawValue === 'number' && !isNaN(rawValue)) {
        value = rawValue;
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
        if (key !== 'className' && key !== 'value') {
          rest[key] = safeProps[key];
        }
      }
    }
    
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...rest}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    );
  }
)
Progress.displayName = ProgressPrimitive.Root.displayName

/**
 * Export Progress component
 * @module Progress
 */
export { Progress }