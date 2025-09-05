import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * A simplified Radio Group component using Radix UI primitives
 */

const RadioGroup = React.forwardRef(
  /** 
   * @param {import("react").ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>} props 
   * @param {import("react").Ref<React.ElementRef<typeof RadioGroupPrimitive.Root>>} ref 
   * @returns {JSX.Element} The radio group component
   */
  (props, ref) => {
    // Safely extract and use props with defaults
    const { className, ...restProps } = props || {}
    
    return (
      <RadioGroupPrimitive.Root
        className={cn("grid gap-2", className)}
        ref={ref}
        {...restProps}
      />
    )
  }
)

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef(
  /**
   * @param {import("react").ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>} props
   * @param {import("react").Ref<React.ElementRef<typeof RadioGroupPrimitive.Item>>} ref
   * @returns {JSX.Element} The radio group item component
   */
  (props, ref) => {
    // Safely extract and use props with defaults
    const { className, value = "", ...restProps } = props || {}
    
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        value={value}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...restProps}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-current text-current" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    )
  }
)

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

/**
 *
 */
export { RadioGroup, RadioGroupItem }