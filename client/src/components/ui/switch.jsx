import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "../../lib/utils"

/**
 * Switch component props
 * @typedef {object} SwitchProps
 * @property {string} [className] - Additional class names
 * @property {boolean} [checked] - Whether the switch is checked
 * @property {boolean} [defaultChecked] - Default checked state
 * @property {(checked: boolean) => void} [onCheckedChange] - Callback when checked state changes
 */

/**
 * Switch component for toggling between two states
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & React.RefAttributes<React.ElementRef<typeof SwitchPrimitives.Root>>>}
 */
const Switch = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof SwitchPrimitives.Root>>} ref
   * @returns {JSX.Element} The switch component
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
    
    // Extract remaining props (excluding className which we handle explicitly)
    /** @type {Record<string, any>} */
    const rest = {};
    if (typeof safeProps === 'object' && safeProps !== null) {
      Object.keys(safeProps).forEach(key => {
        if (key !== 'className') {
          rest[key] = safeProps[key];
        }
      });
    }
    
    return (
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          className
        )}
        {...rest}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitives.Root>
    );
  }
)

Switch.displayName = SwitchPrimitives.Root.displayName

/**
 * Export Switch component
 * @module Switch
 */
export { Switch }