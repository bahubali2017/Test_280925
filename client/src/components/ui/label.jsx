import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * Label variant styles using class-variance-authority
 * @type {Function}
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * Label component with proper TypeScript typing
 * @typedef {object} LabelProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * @property {string} [htmlFor] - Associated form control id
 * 
 * @param {LabelProps} props - Component props with proper type definition
 * @param {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} ref - Forwarded ref
 * @returns {JSX.Element} Label component
 */
const Label = React.forwardRef(function Label(
  /** @type {LabelProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...otherProps}
    >
      {children}
    </LabelPrimitive.Root>
  );
})

Label.displayName = LabelPrimitive.Root.displayName

/**
 * Export Label component
 * @module Label
 */
export { Label }