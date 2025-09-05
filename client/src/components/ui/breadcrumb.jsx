import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

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
 * @typedef {object} BreadcrumbProps
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 * @property {React.ReactNode} [separator] - Custom separator element
 */

/**
 * Breadcrumb navigation component for displaying hierarchical navigation
 * @param {BreadcrumbProps & React.HTMLAttributes<HTMLElement>} props - Component props
 * @param {React.ForwardedRef<HTMLElement>} ref - Reference to the underlying DOM element
 * @returns {React.ReactElement} Breadcrumb component
 */
const Breadcrumb = React.forwardRef(
  function BreadcrumbComponent(props, ref) {
    // No need for destructuring here as we're passing all props directly
    return <nav ref={ref} aria-label="breadcrumb" {...(props || {})} />;
  }
)
Breadcrumb.displayName = "Breadcrumb"

/**
 * @typedef {object} BreadcrumbListProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Breadcrumb list component that contains the entire breadcrumb trail
 * @param {object} props - Component props
 * @param {React.Ref<HTMLOListElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Breadcrumb list component
 */
const BreadcrumbList = React.forwardRef(
  function BreadcrumbListComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <ol
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
          className
        )}
        {...otherProps}
      />
    );
  }
)
BreadcrumbList.displayName = "BreadcrumbList"

/**
 * @typedef {object} BreadcrumbItemProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Breadcrumb item component that represents a single step in the breadcrumb trail
 * @param {object} props - Component props
 * @param {React.Ref<HTMLLIElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Breadcrumb item component
 */
const BreadcrumbItem = React.forwardRef(
  function BreadcrumbItemComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <li
        ref={ref}
        className={cn("inline-flex items-center gap-1.5", className)}
        {...otherProps}
      />
    );
  }
)
BreadcrumbItem.displayName = "BreadcrumbItem"

/**
 * @typedef {object} BreadcrumbLinkProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {string} [href] - URL that the link points to
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Breadcrumb link component that renders a clickable link in the breadcrumb trail
 * @param {object} props - Component props
 * @param {React.Ref<HTMLAnchorElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Breadcrumb link component
 */
const BreadcrumbLink = React.forwardRef(
  function BreadcrumbLinkComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <a
        ref={ref}
        className={cn("transition-colors hover:text-foreground", className)}
        {...otherProps}
      />
    );
  }
)
BreadcrumbLink.displayName = "BreadcrumbLink"

/**
 * @typedef {object} BreadcrumbPageProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Breadcrumb page component representing the current page (non-interactive)
 * @param {object} props - Component props
 * @param {React.Ref<HTMLSpanElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Breadcrumb page component
 */
const BreadcrumbPage = React.forwardRef(
  function BreadcrumbPageComponent(props, ref) {
    // Use our utility function to safely extract props
    const { className, otherProps } = extractSafeProps(props, ["className"]);
    
    return (
      <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        className={cn("font-normal text-foreground", className)}
        {...otherProps}
      />
    );
  }
)
BreadcrumbPage.displayName = "BreadcrumbPage"

/**
 * @typedef {object} BreadcrumbSeparatorProps
 * @property {React.ReactNode} [children] - Custom separator content, defaults to ChevronRight icon
 * @property {string} [className] - Additional class names to apply to the component
 */

/**
 * Breadcrumb separator component that visually separates items in the trail
 * @param {BreadcrumbSeparatorProps & Omit<React.LiHTMLAttributes<HTMLLIElement>, 'children' | 'className'>} props - Component props
 * @returns {React.ReactElement} Breadcrumb separator component
 */
function BreadcrumbSeparator(props) {
  // Extract props safely using our utility
  const safeProps = props || {};
  
  // Use type-safe property access
  const children = hasProp(safeProps, 'children') ? safeProps.children : <ChevronRight />;
  
  // Use our utility function to safely extract other props
  const { className, otherProps } = extractSafeProps(safeProps, ["children"]);
  
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
      {...otherProps}
    >
      {children}
    </li>
  );
}
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

/**
 * @typedef {object} BreadcrumbEllipsisProps
 * @property {string} [className] - Additional class names to apply to the component
 */

/**
 * Breadcrumb ellipsis component for indicating truncated items in the trail
 * @param {BreadcrumbEllipsisProps & Omit<React.HTMLAttributes<HTMLSpanElement>, 'className'>} props - Component props
 * @returns {React.ReactElement} Breadcrumb ellipsis component
 */
function BreadcrumbEllipsis(props) {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props, ["className"]);
  
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...otherProps}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  );
}
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

/**
 * Export all Breadcrumb components
 * @module Breadcrumb
 */
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}