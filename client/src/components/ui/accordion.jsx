import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "../../lib/utils.js";

/**
 * @typedef {React.ElementRef<typeof AccordionPrimitive.Root>} AccordionRef
 * @typedef {React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>} AccordionProps
 */

/**
 * Accordion wrapper component (Radix Root passthrough)
 * @type {React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<AccordionRef>>}
 */
const Accordion = AccordionPrimitive.Root;

/**
 * @typedef {React.ElementRef<typeof AccordionPrimitive.Item>} AccordionItemRef
 * @typedef {React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>} AccordionItemProps
 */

/**
 * Accordion item component
 * @type {React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<AccordionItemRef>>}
 */
const AccordionItem = React.forwardRef(
/**
 * @param {AccordionItemProps} props - Component props
 * @param {React.Ref<AccordionItemRef>} ref - Forwarded ref
 * @returns {JSX.Element} The accordion item component
 */
function AccordionItem(
  {
    className = "",
    value = "",
    ...props
  },
  ref
) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      value={value}
      className={cn("border-b", className)}
      {...props}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

/**
 * @typedef {React.ElementRef<typeof AccordionPrimitive.Trigger>} AccordionTriggerRef
 * @typedef {React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>} AccordionTriggerProps
 */

/**
 * Accordion trigger component
 * @type {React.ForwardRefExoticComponent<AccordionTriggerProps & React.RefAttributes<AccordionTriggerRef>>}
 */
const AccordionTrigger = React.forwardRef(
/**
 * @param {AccordionTriggerProps} props - Component props
 * @param {React.Ref<AccordionTriggerRef>} ref - Forwarded ref
 * @returns {JSX.Element} The accordion trigger component
 */
function AccordionTrigger(
  {
    className = "",
    children = null,
    ...props
  },
  ref
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

/**
 * @typedef {React.ElementRef<typeof AccordionPrimitive.Content>} AccordionContentRef
 * @typedef {React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>} AccordionContentProps
 */

/**
 * Accordion content component
 * @type {React.ForwardRefExoticComponent<AccordionContentProps & React.RefAttributes<AccordionContentRef>>}
 */
const AccordionContent = React.forwardRef(
/**
 * @param {AccordionContentProps} props - Component props
 * @param {React.Ref<AccordionContentRef>} ref - Forwarded ref
 * @returns {JSX.Element} The accordion content component
 */
function AccordionContent(
  {
    className = "",
    children = null,
    ...props
  },
  ref
) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = "AccordionContent";

/**
 * Export Accordion components
 * @module Accordion
 */
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
