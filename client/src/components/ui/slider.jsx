import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

/**
 * Slider component props
 * @typedef {object} SliderProps
 * @property {string} [className] - Additional class names
 * @property {number[]} [defaultValue] - Default slider values
 * @property {number} [min] - Minimum value
 * @property {number} [max] - Maximum value
 * @property {number} [step] - Step increment
 * @property {(values: number[]) => void} [onValueChange] - Value change handler
 */

/**
 * Slider component for selecting numeric values
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & React.RefAttributes<React.ElementRef<typeof SliderPrimitive.Root>>>}
 */
const Slider = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof SliderPrimitive.Root>>} ref
   * @returns {JSX.Element} The slider component
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
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...rest}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    );
  }
)
Slider.displayName = SliderPrimitive.Root.displayName

/**
 * Export Slider component
 * @module Slider
 */
export { Slider }