import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Checkbox component props
 * @typedef {object} CheckboxProps
 * @property {string} [className] - Additional class names
 */

/**
 * Checkbox component for form inputs
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & React.RefAttributes<React.ElementRef<typeof CheckboxPrimitive.Root>>>}
 */
const Checkbox = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof CheckboxPrimitive.Root>>} ref
   * @returns {JSX.Element} The checkbox component
   */
  (props, ref) => {
    // Create safe props object with type checking
    const safeProps = props || {};
    
    // Extract className with type checking
    let className;
    if (
      typeof safeProps === 'object' && 
      safeProps !== null && 
      Object.prototype.hasOwnProperty.call(safeProps, 'className') && 
      typeof safeProps['className'] === 'string'
    ) {
      className = safeProps['className'];
    }
    
    // Create clean props object without extracted properties
    const otherProps = {};
    if (typeof safeProps === 'object' && safeProps !== null) {
      Object.keys(safeProps).forEach(key => {
        if (key !== 'className') {
          otherProps[key] = safeProps[key];
        }
      });
    }
    
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          className
        )}
        {...otherProps}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}
        >
          <Check className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
)

Checkbox.displayName = CheckboxPrimitive.Root.displayName

/**
 * Export Checkbox component
 * @module Checkbox
 */
export { Checkbox }