import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Textarea component props
 * @typedef {object} TextareaProps
 * @property {string} [className] - Additional class names
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [value] - Input value
 * @property {boolean} [disabled] - Whether the textarea is disabled
 * @property {string} [id] - Element ID
 * @property {string} [name] - Form field name
 * @property {number} [rows] - Number of rows to display
 */

/**
 * Textarea component for multi-line text input
 * @type {React.ForwardRefExoticComponent<React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.RefAttributes<HTMLTextAreaElement>>}
 */
const Textarea = React.forwardRef(
  /**
   * @param {React.TextareaHTMLAttributes<HTMLTextAreaElement>} props
   * @param {React.ForwardedRef<HTMLTextAreaElement>} ref
   * @returns {JSX.Element} The textarea component
   */
  (props, ref) => {
    // Create safe props object with type checking
    const safeProps = props || {};
    
    // Extract className with proper type checking
    let className;
    if (typeof safeProps === 'object' && safeProps !== null) {
      const classNameValue = safeProps['className'];
      if (typeof classNameValue === 'string') {
        className = classNameValue;
      }
    }
    
    // Extract remaining props (excluding className which we handle explicitly)
    const rest = {};
    if (typeof safeProps === 'object' && safeProps !== null) {
      Object.keys(safeProps).forEach(key => {
        if (key !== 'className') {
          rest[key] = safeProps[key];
        }
      });
    }
    
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...rest}
      />
    );
  }
)

Textarea.displayName = "Textarea"

/**
 * Export Textarea component
 * @module Textarea
 */
export { Textarea }