import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils.js"

/**
 * Safely check if a property exists on an object with type guards
 * @param {any} obj - The object to check
 * @param {string} prop - The property name to check for
 * @returns {boolean} Whether the property exists on the object
 */
function hasProp(obj, prop) {
  return obj !== null && 
         typeof obj === 'object' && 
         Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Type guard for string values
 * @param {any} value - The value to check
 * @returns {boolean} Whether the value is a string
 */
function isString(value) {
  return typeof value === 'string';
}

/**
 * Extract and safely provide component props with type checking
 * @param {object | null | undefined} props - Raw component props
 * @param {string[]} excludeList - List of prop names to exclude from otherProps
 * @returns {{className: string, otherProps: object}} An object containing processed props
 */
function extractSafeProps(props, excludeList = []) {
  // Initialize with default empty values
  const result = {
    className: "",
    otherProps: {}
  };
  
  // Early return if props is not a valid object
  if (props === null || typeof props !== 'object') {
    return result;
  }
  
  // Type-safe extraction of className
  if (hasProp(props, 'className') && isString(props.className)) {
    result.className = props.className;
  }
  
  // Add all non-excluded properties to otherProps
  Object.keys(props).forEach(key => {
    if (!excludeList.includes(key) && key !== 'className') {
      result.otherProps[key] = props[key];
    }
  });
  
  return result;
}

/**
 * @typedef {object} ButtonProps
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [asChild] - Whether to render as a child component
 * @property {('default'|'destructive'|'outline'|'secondary'|'ghost'|'link')} [variant] - Button style variant
 * @property {('default'|'sm'|'lg'|'icon')} [size] - Button size
 * @property {React.ReactNode} [children] - Button content
 */

// Variant constants for button styling
const DEFAULT_VARIANT = "default";
const DESTRUCTIVE_VARIANT = "destructive";
const OUTLINE_VARIANT = "outline";
const SECONDARY_VARIANT = "secondary";
const GHOST_VARIANT = "ghost";
const LINK_VARIANT = "link";

// Size constants for button styling
const DEFAULT_SIZE = "default";
const SM_SIZE = "sm";
const LG_SIZE = "lg";
const ICON_SIZE = "icon";

// Button styling configuration using class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        [DEFAULT_VARIANT]: "bg-primary text-primary-foreground hover:bg-primary/90",
        [DESTRUCTIVE_VARIANT]: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        [OUTLINE_VARIANT]: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        [SECONDARY_VARIANT]: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        [GHOST_VARIANT]: "hover:bg-accent hover:text-accent-foreground",
        [LINK_VARIANT]: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        [DEFAULT_SIZE]: "h-10 px-4 py-2",
        [SM_SIZE]: "h-9 rounded-md px-3",
        [LG_SIZE]: "h-11 rounded-md px-8",
        [ICON_SIZE]: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: DEFAULT_VARIANT,
      size: DEFAULT_SIZE,
    },
  }
)

/**
 * Button component for rendering buttons with configurable styling
 * @param {object} props - Component props
 * @param {React.Ref<HTMLButtonElement>} ref - Reference to the button element
 * @returns {JSX.Element} Button component
 */
const Button = React.forwardRef(function Button(props, ref) {
  // Extract all props we need to consider explicitly
  const excludeProps = ['className', 'variant', 'size', 'asChild'];
  const { className, otherProps } = extractSafeProps(props, excludeProps);
  
  // Extract asChild with Boolean type coercion for safety
  let asChild = false;
  if (typeof props === 'object' && props !== null && 'asChild' in props) {
    asChild = Boolean(props.asChild);
  }
  
  // Map for valid variant values with proper typing
  const variantMap = {
    [DEFAULT_VARIANT]: DEFAULT_VARIANT,
    [DESTRUCTIVE_VARIANT]: DESTRUCTIVE_VARIANT,
    [OUTLINE_VARIANT]: OUTLINE_VARIANT,
    [SECONDARY_VARIANT]: SECONDARY_VARIANT,
    [GHOST_VARIANT]: GHOST_VARIANT,
    [LINK_VARIANT]: LINK_VARIANT
  };
  
  // Default variant with validation to ensure type safety
  // Instead of a generic string, we use the specific string literal values
  let variant = DEFAULT_VARIANT;
  if (typeof props === 'object' && props !== null && 
      'variant' in props && typeof props.variant === 'string') {
    // Use the map to ensure we get a valid variant value or the default
    variant = variantMap[props.variant] || DEFAULT_VARIANT;
  }
  
  // Map for valid size values with proper typing
  const sizeMap = {
    [DEFAULT_SIZE]: DEFAULT_SIZE,
    [SM_SIZE]: SM_SIZE,
    [LG_SIZE]: LG_SIZE,
    [ICON_SIZE]: ICON_SIZE
  };
  
  // Default size with validation to ensure type safety
  let size = DEFAULT_SIZE;
  if (typeof props === 'object' && props !== null && 
      'size' in props && typeof props.size === 'string') {
    // Use the map to ensure we get a valid size value or the default
    size = sizeMap[props.size] || DEFAULT_SIZE;
  }
  
  // Use Slot or standard button based on asChild prop
  const Component = asChild ? Slot : "button";
  
  // Cast validated values to appropriate types for buttonVariants
  // These are safe casts because our validation guarantees these are valid values
  const safeVariant = /** @type {import('class-variance-authority').VariantProps<typeof buttonVariants>['variant']} */ (variant);
  const safeSize = /** @type {import('class-variance-authority').VariantProps<typeof buttonVariants>['size']} */ (size);
  
  return (
    <Component
      className={cn(
        buttonVariants({
          variant: safeVariant,
          size: safeSize,
          className
        })
      )}
      ref={ref}
      {...otherProps}
    />
  );
})

Button.displayName = "Button";

// Export components and constants
/**
 * Button component and related utilities
 * @module Button
 */
export { 
  Button, 
  buttonVariants,
  // Export variant constants for external use
  DEFAULT_VARIANT as BUTTON_DEFAULT,
  DESTRUCTIVE_VARIANT as BUTTON_DESTRUCTIVE,
  OUTLINE_VARIANT as BUTTON_OUTLINE,
  SECONDARY_VARIANT as BUTTON_SECONDARY,
  GHOST_VARIANT as BUTTON_GHOST,
  LINK_VARIANT as BUTTON_LINK,
  // Export size constants for external use
  DEFAULT_SIZE as SIZE_DEFAULT,
  SM_SIZE as SIZE_SM,
  LG_SIZE as SIZE_LG,
  ICON_SIZE as SIZE_ICON
};