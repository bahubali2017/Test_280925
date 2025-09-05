import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "../../lib/utils"

/**
 * Tabs root component
 */
const Tabs = TabsPrimitive.Root

/**
 * TabsList component props type
 * @typedef {object} TabsListProps
 * @property {string} [className] - Additional class names
 */

/**
 * Tabs list component
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>} props - Component props
 * @param {React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.List>>} ref - Forwarded ref
 * @returns {JSX.Element} Tabs list component
 */
const TabsList = React.forwardRef(function TabsList(props, ref) {
  // Safe fallback for props
  const propsObj = props || {};
  
  // Extract className safely - using explicit key access to avoid TypeScript errors
  let className;
  if (propsObj && typeof propsObj === 'object') {
    const classNameValue = propsObj['className'];
    if (typeof classNameValue === 'string') {
      className = classNameValue;
    }
  }
  
  // Create a new object for the remaining props to avoid TypeScript spreading issues
  const otherProps = {};
  if (propsObj && typeof propsObj === 'object') {
    Object.keys(propsObj).forEach(key => {
      if (key !== 'className' && key !== 'ref') {
        otherProps[key] = propsObj[key];
      }
    });
  }
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...otherProps}
    />
  );
})
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * TabsTrigger component props type
 * @typedef {object} TabsTriggerProps
 * @property {string} [className] - Additional class names
 * @property {string} value - The value of the tab trigger
 */

/**
 * Tabs trigger component
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>} props - Component props
 * @param {React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Trigger>>} ref - Forwarded ref
 * @returns {JSX.Element} Tabs trigger component
 */
const TabsTrigger = React.forwardRef(function TabsTrigger(props, ref) {
  // Safe fallback for props
  const propsObj = props || {};
  
  // Extract className safely - using bracket notation to avoid TypeScript errors
  let className;
  if (propsObj && typeof propsObj === 'object') {
    const classNameValue = propsObj['className'];
    if (typeof classNameValue === 'string') {
      className = classNameValue;
    }
  }
  
  // Ensure value prop is properly handled (required by Radix UI)
  // Default to empty string if not provided
  let value = '';
  if (propsObj && 'value' in propsObj) {
    value = String(propsObj.value || '');
  }
  
  // Create a new object for remaining props to avoid TypeScript spreading issues
  const otherProps = {};
  if (propsObj && typeof propsObj === 'object') {
    Object.keys(propsObj).forEach(key => {
      if (!['className', 'value', 'ref'].includes(key)) {
        otherProps[key] = propsObj[key];
      }
    });
  }
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...otherProps}
    />
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * TabsContent component props type
 * @typedef {object} TabsContentProps
 * @property {string} [className] - Additional class names
 * @property {string} value - The value of the tab content
 */

/**
 * Tabs content component
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>} props - Component props
 * @param {React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Content>>} ref - Forwarded ref
 * @returns {JSX.Element} Tabs content component
 */
const TabsContent = React.forwardRef(function TabsContent(props, ref) {
  // Safe fallback for props
  const propsObj = props || {};
  
  // Extract className safely - using bracket notation to avoid TypeScript errors
  let className;
  if (propsObj && typeof propsObj === 'object') {
    const classNameValue = propsObj['className'];
    if (typeof classNameValue === 'string') {
      className = classNameValue;
    }
  }
  
  // Ensure value prop is properly handled (required by Radix UI)
  // Default to empty string if not provided
  let value = '';
  if (propsObj && 'value' in propsObj) {
    value = String(propsObj.value || '');
  }
  
  // Create a new object for remaining props to avoid TypeScript spreading issues
  const otherProps = {};
  if (propsObj && typeof propsObj === 'object') {
    Object.keys(propsObj).forEach(key => {
      if (!['className', 'value', 'ref'].includes(key)) {
        otherProps[key] = propsObj[key];
      }
    });
  }
  
  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...otherProps}
    />
  );
})
TabsContent.displayName = TabsPrimitive.Content.displayName

/**
 * Export Tabs components
 * @module Tabs
 */
export { Tabs, TabsList, TabsTrigger, TabsContent }