import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils.js"

/**
 * Badge variant styles using class-variance-authority
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Badge component that displays a small status indicator
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names to apply to the component
 * @param {'default' | 'secondary' | 'destructive' | 'outline'} [props.variant='default'] - Visual variant of the badge
 * @param {React.ReactNode} [props.children] - Content to display inside the badge
 * @returns {JSX.Element} Badge component
 */
function Badge(props) {
  const { className, variant = 'default', ...otherProps } = props || {};
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...otherProps} />
  )
}

/**
 * Export Badge component and variants
 * @module Badge
 */
export { Badge, badgeVariants }