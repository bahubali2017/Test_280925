import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Skeleton component for loading states
 * Creates a placeholder loading animation for content that hasn't loaded yet
 */
const Skeleton = React.forwardRef(
  /**
   * @param {{ className?: string }} props 
   * @param {React.Ref<HTMLDivElement>} ref
   * @returns {JSX.Element}
   */
  function Skeleton(props, ref) {
    // Type-safe property extraction
    const className = props?.className;
    
    // Extract other props excluding className
    const rest = {};
    if (props) {
      for (const key in props) {
        if (key !== 'className' && Object.prototype.hasOwnProperty.call(props, key)) {
          rest[key] = props[key];
        }
      }
    }

    return (
      <div
        ref={ref}
        className={cn("animate-pulse rounded-md bg-muted", className)}
        {...rest}
      />
    );
  }
);

// Add display name for better debugging
Skeleton.displayName = "Skeleton";

/**
 *
 */
export { Skeleton }