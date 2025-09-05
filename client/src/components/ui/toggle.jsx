import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * Toggle component variants
 * @type {Function}
 */
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Toggle component variants type
 * @typedef {object} ToggleVariants
 * @property {('default'|'outline')} [variant] - The visual style variant
 * @property {('default'|'sm'|'lg')} [size] - The size variant
 * @property {string} [className] - Additional class names
 */

/**
 * Toggle component for togglable UI elements
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & React.RefAttributes<React.ElementRef<typeof TogglePrimitive.Root>>>}
 */
const Toggle = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof TogglePrimitive.Root>>} ref
   * @returns {JSX.Element} The toggle component
   */
  (props, ref) => {
    // Create safe props object with type checking
    const safeProps = props || {};
    
    // Extract properties with safe type checking using hasOwnProperty and bracket notation
    let className;
    if (
      typeof safeProps === 'object' && 
      safeProps !== null && 
      Object.prototype.hasOwnProperty.call(safeProps, 'className') && 
      typeof safeProps['className'] === 'string'
    ) {
      className = safeProps['className'];
    }
    
    // Validate variant is one of the allowed values
    /** @type {'default'|'outline'} */
    let variant = 'default'; // Default value
    if (
      typeof safeProps === 'object' && 
      safeProps !== null && 
      Object.prototype.hasOwnProperty.call(safeProps, 'variant') && 
      safeProps['variant'] === 'outline'
    ) {
      variant = 'outline';
    }
    
    // Validate size is one of the allowed values
    /** @type {'default'|'sm'|'lg'} */
    let size = 'default'; // Default value
    if (
      typeof safeProps === 'object' && 
      safeProps !== null && 
      Object.prototype.hasOwnProperty.call(safeProps, 'size')
    ) {
      const sizeValue = safeProps['size'];
      if (sizeValue === 'sm' || sizeValue === 'lg') {
        size = sizeValue;
      }
    }
    
    // Create clean props object without extracted properties
    const otherProps = {};
    if (typeof safeProps === 'object' && safeProps !== null) {
      Object.keys(safeProps).forEach(key => {
        if (!['className', 'variant', 'size'].includes(key)) {
          otherProps[key] = safeProps[key];
        }
      });
    }
    
    // Create a safe object to pass to toggleVariants
    const variantProps = {
      variant: variant || 'default',
      size: size || 'default'
    };
    
    // Only add className if it exists
    if (className) {
      variantProps.className = className;
    }
    
    return (
      <TogglePrimitive.Root
        ref={ref}
        className={cn(toggleVariants(variantProps))}
        {...otherProps}
      />
    );
  }
)

Toggle.displayName = TogglePrimitive.Root.displayName

/**
 *
 */
export { Toggle, toggleVariants }