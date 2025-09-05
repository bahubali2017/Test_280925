"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "../../lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

/**
 * HoverCardContent component props
 * @typedef {object} HoverCardContentProps
 * @property {string} [className] - Additional class names
 * @property {'center'|'start'|'end'} [align='center'] - Alignment of the content relative to the trigger
 * @property {number} [sideOffset=4] - Offset from the trigger element
 */

/**
 * Hover card content component for displaying information on hover
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof HoverCardPrimitive.Content>>>}
 */
const HoverCardContent = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>} props
   * @param {React.ForwardedRef<React.ElementRef<typeof HoverCardPrimitive.Content>>} ref
   * @returns {JSX.Element} The hover card content component
   */
  (props, ref) => {
    // Safe props access with defaults
    const {
      className,
      align = "center",
      sideOffset = 4,
      ...restProps
    } = props || {};

    return (
      <HoverCardPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",
          className
        )}
        {...restProps}
      />
    );
  }
);

HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

/**
 * Export HoverCard components
 * @module HoverCard
 */
export { HoverCard, HoverCardTrigger, HoverCardContent }