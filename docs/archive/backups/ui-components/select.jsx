"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

// Fix path to ensure correct imports
import { cn } from "../../lib/utils"

/**
 * Select root component
 */
const Select = SelectPrimitive.Root

/**
 * Select group component
 */
const SelectGroup = SelectPrimitive.Group

/**
 * Select value component
 */
const SelectValue = SelectPrimitive.Value

/**
 * Select trigger component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} props.children - Child elements
 * @param {React.ForwardedRef<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select trigger component
 */
/**
 * Select trigger component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & React.RefAttributes<HTMLButtonElement>>}
 */
const SelectTrigger = React.forwardRef(
  /**
   * @param {object} props - Component props
   * @param {string} [props.className] - Additional class names
   * @param {React.ReactNode} props.children - Child elements
   * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref
   */
  (props, ref) => {
    // Explicitly type props as a record with string keys to satisfy TypeScript
    const propsRecord = /** @type {Record<string, any>} */ (props);
    const className = propsRecord.className;
    const children = propsRecord.children;
    
    // Create a safe copy of props without the extracted properties
    const otherProps = {};
    for (const key in propsRecord) {
      if (key !== 'className' && key !== 'children') {
        otherProps[key] = propsRecord[key];
      }
    }
    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...otherProps}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    )
  }
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

/**
 * Select scroll up button component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select scroll up button component
 */
/**
 * Select scroll up button component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & React.RefAttributes<HTMLDivElement>>}
 */
const SelectScrollUpButton = React.forwardRef(
  /**
   * @param {object} props - Component props
   * @param {string} [props.className] - Additional class names
   * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
   */
  (props, ref) => {
    // Explicitly type props as a record with string keys to satisfy TypeScript
    const propsRecord = /** @type {Record<string, any>} */ (props);
    const className = propsRecord.className;
    
    // Create a safe copy of props without the extracted properties
    const otherProps = {};
    for (const key in propsRecord) {
      if (key !== 'className') {
        otherProps[key] = propsRecord[key];
      }
    }
    return (
      <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn(
          "flex cursor-default items-center justify-center py-1",
          className
        )}
        {...otherProps}
      >
        <ChevronUp className="h-4 w-4" />
      </SelectPrimitive.ScrollUpButton>
    )
  }
)
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

/**
 * Select scroll down button component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select scroll down button component
 */
const SelectScrollDownButton = React.forwardRef(
  (props, ref) => {
    const className = props.className
    const otherProps = {}
    
    // Safely extract other props
    Object.keys(props).forEach(key => {
      if (key !== 'className') {
        otherProps[key] = props[key]
      }
    })
    return (
      <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn(
          "flex cursor-default items-center justify-center py-1",
          className
        )}
        {...otherProps}
      >
        <ChevronDown className="h-4 w-4" />
      </SelectPrimitive.ScrollDownButton>
    )
  }
)
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

/**
 * Select content component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} props.children - Child elements
 * @param {string} [props.position="popper"] - Position of the content
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select content component
 */
const SelectContent = React.forwardRef(
  (props, ref) => {
    const className = props.className
    const children = props.children
    const position = props.position || "popper"
    const otherProps = {}
    
    // Safely extract other props
    Object.keys(props).forEach(key => {
      if (!['className', 'children', 'position'].includes(key)) {
        otherProps[key] = props[key]
      }
    })
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className
          )}
          position={position}
          {...otherProps}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              "p-1",
              position === "popper" &&
                "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    )
  }
)
SelectContent.displayName = SelectPrimitive.Content.displayName

/**
 * Select label component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select label component
 */
const SelectLabel = React.forwardRef(
  (props, ref) => {
    const className = props.className
    const children = props.children
    const otherProps = {}
    
    // Safely extract other props
    Object.keys(props).forEach(key => {
      if (!['className', 'children'].includes(key)) {
        otherProps[key] = props[key]
      }
    })
    return (
      <SelectPrimitive.Label
        ref={ref}
        className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
        {...otherProps}
      >
        {children}
      </SelectPrimitive.Label>
    )
  }
)
SelectLabel.displayName = SelectPrimitive.Label.displayName

/**
 * Select item component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} props.children - Child elements
 * @param {string} props.value - The value of the select item
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select item component
 */
const SelectItem = React.forwardRef(
  (props, ref) => {
    const className = props.className
    const children = props.children
    const value = props.value || '' // Ensure value is always defined
    const otherProps = {}
    
    // Safely extract other props
    Object.keys(props).forEach(key => {
      if (!['className', 'children'].includes(key)) {
        otherProps[key] = props[key]
      }
    })
    return (
      <SelectPrimitive.Item
        ref={ref}
        value={value}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        {...otherProps}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="h-4 w-4" />
          </SelectPrimitive.ItemIndicator>
        </span>

        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    )
  }
)
SelectItem.displayName = SelectPrimitive.Item.displayName

/**
 * Select separator component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Select separator component
 */
const SelectSeparator = React.forwardRef(
  (props, ref) => {
    const className = props.className
    const otherProps = {}
    
    // Safely extract other props
    Object.keys(props).forEach(key => {
      if (key !== 'className') {
        otherProps[key] = props[key]
      }
    })
    return (
      <SelectPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...otherProps}
      />
    )
  }
)
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

/**
 * Export Select components
 * @module Select
 */
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}