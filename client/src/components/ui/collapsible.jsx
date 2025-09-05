"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

/**
 * Collapsible root component
 * @type {React.ForwardRefExoticComponent}
 */
const Collapsible = CollapsiblePrimitive.Root

/**
 * Collapsible trigger component
 * @type {React.ForwardRefExoticComponent}
 */
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

/**
 * Collapsible content component
 * @type {React.ForwardRefExoticComponent}
 */
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

/**
 * Export Collapsible components for use in other components
 * @returns {object} Collapsible components
 */
export { Collapsible, CollapsibleTrigger, CollapsibleContent }