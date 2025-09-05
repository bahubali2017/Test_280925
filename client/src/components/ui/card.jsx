import * as React from "react"

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
 * @typedef {object} CardProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Card component that provides a container for related content
 * @param {object} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Card component
 */
const Card = React.forwardRef(
  function CardComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...otherProps}
      />
    );
  }
)
Card.displayName = "Card"

/**
 * @typedef {object} CardHeaderProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Card header component that contains the card title and description
 * @param {object} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Card header component
 */
const CardHeader = React.forwardRef(
  function CardHeaderComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...otherProps}
      />
    );
  }
)
CardHeader.displayName = "CardHeader"

/**
 * @typedef {object} CardTitleProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Card title component that displays the main heading of the card
 * @param {object} props - Component props
 * @param {React.Ref<HTMLHeadingElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Card title component
 */
const CardTitle = React.forwardRef(
  function CardTitleComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <h3
        ref={ref}
        className={cn(
          "text-2xl font-semibold leading-none tracking-tight",
          className
        )}
        {...otherProps}
      />
    );
  }
)
CardTitle.displayName = "CardTitle"

/**
 * @typedef {object} CardDescriptionProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Card description component that displays supplementary text for the card
 * @param {object} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Card description component
 */
const CardDescription = React.forwardRef(
  function CardDescriptionComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...otherProps}
      />
    );
  }
)
CardDescription.displayName = "CardDescription"

/**
 * @typedef {object} CardContentProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Card content component that contains the main body content of the card
 * @param {object} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Card content component
 */
const CardContent = React.forwardRef(
  function CardContentComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <div 
        ref={ref} 
        className={cn("p-6 pt-0", className)} 
        {...otherProps} 
      />
    );
  }
)
CardContent.displayName = "CardContent"

/**
 * @typedef {object} CardFooterProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Card footer component that contains actions or supplementary information
 * @param {object} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Card footer component
 */
const CardFooter = React.forwardRef(
  function CardFooterComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...otherProps}
      />
    );
  }
)
CardFooter.displayName = "CardFooter"

/**
 * Export Card components
 * @module Card
 */
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }