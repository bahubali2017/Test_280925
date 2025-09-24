import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "../../lib/utils"

/**
 * Props for TabsList component
 * @typedef {{
 *   className?: string;
 *   children?: React.ReactNode;
 *   [key: string]: unknown;
 * }} TabsListProps
 */

/**
 * Props for TabsTrigger component  
 * @typedef {{
 *   className?: string;
 *   value: string;
 *   children?: React.ReactNode;
 *   disabled?: boolean;
 *   [key: string]: unknown;
 * }} TabsTriggerProps
 */

/**
 * Props for TabsContent component
 * @typedef {{
 *   className?: string;
 *   value: string;
 *   children?: React.ReactNode;
 *   [key: string]: unknown;
 * }} TabsContentProps
 */

/**
 * Safely extract props from an object, excluding specified keys
 * @param {unknown} props - The props object
 * @param {string[]} excludeKeys - Keys to exclude from extraction
 * @returns {Record<string, unknown>} Filtered props object
 */
function extractSafeProps(props, excludeKeys = []) {
  /** @type {Record<string, unknown>} */
  const safeProps = {};
  
  if (props && typeof props === 'object' && props !== null) {
    Object.keys(props).forEach(key => {
      if (!excludeKeys.includes(key)) {
        safeProps[key] = /** @type {Record<string, unknown>} */ (props)[key];
      }
    });
  }
  
  return safeProps;
}

/**
 * Type guard to check if a value is a valid React ref
 * @param {unknown} ref - The ref to validate
 * @returns {boolean} True if ref is valid
 */
function isValidRef(ref) {
  return ref !== null && ref !== undefined;
}

/**
 * Safely get a string property from an object
 * @param {unknown} obj - Object to extract from
 * @param {string} key - Property key to extract
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Extracted string value or default
 */
function safeGetString(obj, key, defaultValue = '') {
  if (obj && typeof obj === 'object' && obj !== null && key in obj) {
    const value = /** @type {Record<string, unknown>} */ (obj)[key];
    return typeof value === 'string' ? value : defaultValue;
  }
  return defaultValue;
}

/**
 * Tabs root component - provides the main tab container
 */
const Tabs = TabsPrimitive.Root;

/**
 * Tabs list component - renders the tab navigation
 * @param {TabsListProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.List>>} ref - Forward ref
 * @returns {React.ReactElement} Rendered TabsList component
 */
const TabsList = React.forwardRef(function TabsList(props, ref) {
  if (!props || typeof props !== 'object') {
    console.warn('[TabsList] Invalid props provided');
    return <div data-testid="tabs-list-fallback" />;
  }

  // Extract props with safe access
  const className = safeGetString(props, 'className');
  const otherProps = extractSafeProps(props, ['className']);
  
  return (
    <TabsPrimitive.List
      ref={isValidRef(ref) ? ref : null}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      role="tablist"
      data-testid="tabs-list"
      {...otherProps}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Tabs trigger component - renders individual tab buttons
 * @param {TabsTriggerProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>} ref - Forward ref
 * @returns {React.ReactElement} Rendered TabsTrigger component
 */
const TabsTrigger = React.forwardRef(function TabsTrigger(props, ref) {
  if (!props || typeof props !== 'object') {
    console.warn('[TabsTrigger] Invalid props provided');
    return <button data-testid="tabs-trigger-fallback" disabled />;
  }

  // Extract props with safe access
  const className = safeGetString(props, 'className');
  const value = safeGetString(props, 'value');
  
  if (!value) {
    console.warn('[TabsTrigger] Missing required value prop');
  }

  const otherProps = extractSafeProps(props, ['className', 'value']);
  
  return (
    <TabsPrimitive.Trigger
      ref={isValidRef(ref) ? ref : null}
      value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      role="tab"
      data-testid={`tabs-trigger-${value}`}
      aria-selected="false"
      aria-controls={`tabs-content-${value}`}
      tabIndex={-1}
      {...otherProps}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * Tabs content component - renders the content panel for each tab
 * @param {TabsContentProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>} ref - Forward ref
 * @returns {React.ReactElement} Rendered TabsContent component
 */
const TabsContent = React.forwardRef(function TabsContent(props, ref) {
  if (!props || typeof props !== 'object') {
    console.warn('[TabsContent] Invalid props provided');
    return <div data-testid="tabs-content-fallback" />;
  }

  // Extract props with safe access
  const className = safeGetString(props, 'className');
  const value = safeGetString(props, 'value');
  
  if (!value) {
    console.warn('[TabsContent] Missing required value prop');
  }

  const otherProps = extractSafeProps(props, ['className', 'value']);
  
  return (
    <TabsPrimitive.Content
      ref={isValidRef(ref) ? ref : null}
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      role="tabpanel"
      id={`tabs-content-${value}`}
      data-testid={`tabs-content-${value}`}
      aria-labelledby={`tabs-trigger-${value}`}
      tabIndex={0}
      {...otherProps}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

console.info('[Tabs] Tab components initialized with accessibility support');

/**
 * Export all tab components for building tab interfaces
 */
export { Tabs, TabsList, TabsTrigger, TabsContent };