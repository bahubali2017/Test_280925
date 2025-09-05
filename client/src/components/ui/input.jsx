import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Input component props
 * @typedef {object} InputProps
 * @property {string} [className] - Additional class names
 * @property {string} [type="text"] - Input type (text, password, email, etc.)
 */

/**
 * Input component for text input fields
 * @type {React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>}
 */
const Input = React.forwardRef(
  /**
   * @param {React.InputHTMLAttributes<HTMLInputElement>} props
   * @param {React.ForwardedRef<HTMLInputElement>} ref
   * @returns {JSX.Element} The input component
   */
  (props, ref) => {
    // Create safe props object with type checking
    const safeProps = props || {};
    
    // Extract type with proper default value
    let type = "text";
    if (typeof safeProps === 'object' && safeProps !== null && 'type' in safeProps) {
      if (typeof safeProps.type === 'string') {
        type = safeProps.type;
      }
    }
    
    // Extract className with proper type checking
    let className;
    if (typeof safeProps === 'object' && safeProps !== null && 'className' in safeProps) {
      if (typeof safeProps.className === 'string') {
        className = safeProps.className;
      }
    }
    
    // Extract remaining props
    const rest = {};
    if (typeof safeProps === 'object' && safeProps !== null) {
      Object.keys(safeProps).forEach(key => {
        if (!['type', 'className'].includes(key)) {
          rest[key] = safeProps[key];
        }
      });
    }
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...rest}
      />
    );
  }
)

Input.displayName = "Input"

/**
 * Export Input component
 * @module Input
 */
export { Input }