import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

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

// Removed unused isBoolean function

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
 * @typedef {object} PaginationProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Pagination component
 * @param {PaginationProps} props - Component props
 * @returns {JSX.Element} Pagination component
 */
const Pagination = (props) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...otherProps}
    />
  );
};

Pagination.displayName = "Pagination";

/**
 * @typedef {object} PaginationContentProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Pagination content component
 * @param {PaginationContentProps} props - Component props
 * @param {React.Ref<HTMLUListElement>} ref - Forwarded ref
 * @returns {JSX.Element} Pagination content component
 */
const PaginationContent = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <ul
      ref={ref}
      className={cn("flex flex-row items-center gap-1", className)}
      {...otherProps}
    />
  );
});

PaginationContent.displayName = "PaginationContent";

/**
 * @typedef {object} PaginationItemProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Pagination item component
 * @param {PaginationItemProps} props - Component props
 * @param {React.Ref<HTMLLIElement>} ref - Forwarded ref
 * @returns {JSX.Element} Pagination item component
 */
const PaginationItem = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <li ref={ref} className={cn("", className)} {...otherProps} />
  );
});

PaginationItem.displayName = "PaginationItem";

/**
 * @typedef {object} PaginationLinkProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {boolean} [isActive] - Whether this link represents the current page
 * @property {string} [size] - Size of the link, corresponds to button size variants
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Pagination link component with proper TypeScript support
 * @param {PaginationLinkProps} props - Component props
 * @param {React.Ref<HTMLAnchorElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Pagination link component
 */
const PaginationLink = React.forwardRef((props, ref) => {
  // Initialize with safe default values
  let className = "";
  let isActive = false; 
  let size = "icon";
  let children = null;
  const otherProps = {};
  
  // Use a better approach with Object.entries to avoid TypeScript errors
  if (props) {
    // Use `Object.entries` to get type-safe key-value pairs
    const safeProps = /** @type {Record<string, any>} */ (props);
    
    // Extract known properties more safely
    if (typeof safeProps.className === 'string') {
      className = safeProps.className;
    }
    
    if (typeof safeProps.isActive === 'boolean') {
      isActive = safeProps.isActive;
    }
    
    if (typeof safeProps.size === 'string') {
      size = safeProps.size;
    }
    
    if ('children' in safeProps) {
      // Cast children to ReactNode to satisfy TypeScript
      children = /** @type {import('react').ReactNode} */ (safeProps.children);
    }
    
    // Extract remaining props
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'isActive', 'size', 'children'].includes(key)) {
        otherProps[key] = safeProps[key];
      }
    });
  }
  
  // Validate that size is one of the allowed values
  const validButtonSizes = ["default", "sm", "lg", "icon"];
  const validSize = validButtonSizes.includes(size) ? size : "icon";
  
  // Cast the size to a type-safe value for buttonVariants
  // This ensures TypeScript knows it's receiving a valid size value
  const typedSize = /** @type {("default"|"sm"|"lg"|"icon")} */ (validSize);
  
  return (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size: typedSize,
        }),
        className
      )}
      {...otherProps}
    >
      {children}
    </a>
  );
});

PaginationLink.displayName = "PaginationLink";

/**
 * @typedef {object} PaginationPreviousProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Pagination previous component
 * @param {PaginationPreviousProps} props - Component props
 * @param {React.Ref<HTMLAnchorElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Pagination previous component
 */
const PaginationPrevious = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...otherProps}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </PaginationLink>
  );
});

PaginationPrevious.displayName = "PaginationPrevious";

/**
 * @typedef {object} PaginationNextProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Pagination next component
 * @param {PaginationNextProps} props - Component props
 * @param {React.Ref<HTMLAnchorElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Pagination next component
 */
const PaginationNext = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...otherProps}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
});

PaginationNext.displayName = "PaginationNext";

/**
 * @typedef {object} PaginationEllipsisProps
 * @property {string} [className] - Additional class names to apply to the component
 */

/**
 * Pagination ellipsis component
 * @param {PaginationEllipsisProps} props - Component props
 * @param {React.Ref<HTMLSpanElement>} ref - Reference to the underlying DOM element
 * @returns {JSX.Element} Pagination ellipsis component
 */
const PaginationEllipsis = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...otherProps}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
});

PaginationEllipsis.displayName = "PaginationEllipsis";

/**
 *
 */
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}