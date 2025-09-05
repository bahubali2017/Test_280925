"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Sheet root component
 * @type {React.FC}
 */
const Sheet = SheetPrimitive.Root

/**
 * Sheet trigger component
 * @type {React.FC}
 */
const SheetTrigger = SheetPrimitive.Trigger

/**
 * Sheet close component
 * @type {React.FC}
 */
const SheetClose = SheetPrimitive.Close

/**
 * Sheet portal component
 * A wrapper component that creates a portal for sheet content
 * @param {object} props - The component props
 * @param {React.ReactNode} props.children - Child elements to render inside the portal
 * @param {object} [props.otherProps] - Additional props to pass to the Portal
 * @returns {JSX.Element} Sheet portal component
 */
const SheetPortal = ({ children, ...otherProps }) => (
  <SheetPrimitive.Portal {...otherProps}>
    {children}
  </SheetPrimitive.Portal>
)

/**
 * Sheet overlay component
 * @typedef {object} SheetOverlayProps
 * @property {string} [className] - Additional class names
 * 
 * @param {SheetOverlayProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Sheet overlay component
 */
// Fix the type compatibility issue by using a simpler signature
const SheetOverlay = React.forwardRef((
  /** @type {SheetOverlayProps} */ props,
  ref
) => {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "" };
  // Safely destructure with default values
  const { className = "", ...otherProps } = propsWithDefaults;
  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...otherProps}
      ref={ref}
    />
  );
})
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

/**
 * Sheet variant styles
 * Defines the visual styles for different sheet positions
 * @type {Function}
 */
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

/**
 * Sheet content component
 * @typedef {object} SheetContentProps
 * @property {string} [side="right"] - Side of the sheet
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} children - Child elements
 * 
 * @param {SheetContentProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Sheet content component
 */
const SheetContent = React.forwardRef(function SheetContent(
  /** @type {SheetContentProps} */ props,
  /** @type {React.Ref<HTMLDivElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { side: "right", className: "", children: null };
  // Safely destructure with default values
  const { 
    side = "right", 
    className = "", 
    children = null, 
    ...otherProps 
  } = propsWithDefaults;
  
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...otherProps}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
})
SheetContent.displayName = SheetPrimitive.Content.displayName

/**
 * Sheet header component
 * @typedef {object} SheetHeaderProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {SheetHeaderProps} props - Component props
 * @returns {JSX.Element} Sheet header component
 */
function SheetHeader(props) {
  const { className = "", children, ...otherProps } = props || {};
  
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...otherProps}
    >
      {children}
    </div>
  );
}
SheetHeader.displayName = "SheetHeader"

/**
 * Sheet footer component
 * @typedef {object} SheetFooterProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {SheetFooterProps} props - Component props
 * @returns {JSX.Element} Sheet footer component
 */
function SheetFooter(props) {
  const { className = "", children, ...otherProps } = props || {};
  
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...otherProps}
    >
      {children}
    </div>
  );
}
SheetFooter.displayName = "SheetFooter"

/**
 * Sheet title component
 * @typedef {object} SheetTitleProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {SheetTitleProps} props - Component props
 * @param {React.Ref<HTMLHeadingElement>} ref - Forwarded ref
 * @returns {JSX.Element} Sheet title component
 */
const SheetTitle = React.forwardRef(function SheetTitle(
  /** @type {SheetTitleProps} */ props,
  /** @type {React.Ref<HTMLHeadingElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <SheetPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...otherProps}
    >
      {children}
    </SheetPrimitive.Title>
  );
})
SheetTitle.displayName = SheetPrimitive.Title.displayName

/**
 * Sheet description component
 * @typedef {object} SheetDescriptionProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {SheetDescriptionProps} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Forwarded ref
 * @returns {JSX.Element} Sheet description component
 */
const SheetDescription = React.forwardRef(function SheetDescription(
  /** @type {SheetDescriptionProps} */ props,
  /** @type {React.Ref<HTMLParagraphElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <SheetPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...otherProps}
    >
      {children}
    </SheetPrimitive.Description>
  );
})
SheetDescription.displayName = SheetPrimitive.Description.displayName

/**
 *
 */
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}