import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

/**
 * Alert dialog root component
 */
const AlertDialog = AlertDialogPrimitive.Root

/**
 * Alert dialog trigger component
 */
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/**
 * Alert dialog portal component
 */
const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
 * Alert dialog overlay component
 * @typedef {object} AlertDialogOverlayProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogOverlayProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>} ref - Forwarded ref
 * @returns {JSX.Element} Alert dialog overlay component
 */
const AlertDialogOverlay = React.forwardRef(function AlertDialogOverlay(
  /** @type {AlertDialogOverlayProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...otherProps}
      ref={ref}
    >
      {children}
    </AlertDialogPrimitive.Overlay>
  );
})
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/**
 * Alert dialog content component
 * @typedef {object} AlertDialogContentProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogContentProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>} ref - Forwarded ref
 * @returns {JSX.Element} Alert dialog content component
 */
const AlertDialogContent = React.forwardRef(function AlertDialogContent(
  /** @type {AlertDialogContentProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...otherProps}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

/**
 * Alert dialog header component
 * @typedef {object} AlertDialogHeaderProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogHeaderProps} props - Component props
 * @returns {JSX.Element} Alert dialog header component
 */
const AlertDialogHeader = function AlertDialogHeader(props) {
  const { className, children, ...otherProps } = props;
  
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
AlertDialogHeader.displayName = "AlertDialogHeader"

/**
 * Alert dialog footer component
 * @typedef {object} AlertDialogFooterProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogFooterProps} props - Component props
 * @returns {JSX.Element} Alert dialog footer component
 */
const AlertDialogFooter = function AlertDialogFooter(props) {
  const { className, children, ...otherProps } = props;
  
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
AlertDialogFooter.displayName = "AlertDialogFooter"

/**
 * Alert dialog title component
 * @typedef {object} AlertDialogTitleProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogTitleProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>} ref - Forwarded ref
 * @returns {JSX.Element} Alert dialog title component
 */
const AlertDialogTitle = React.forwardRef(function AlertDialogTitle(
  /** @type {AlertDialogTitleProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...otherProps}
    >
      {children}
    </AlertDialogPrimitive.Title>
  );
})
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

/**
 * Alert dialog description component
 * @typedef {object} AlertDialogDescriptionProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogDescriptionProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>} ref - Forwarded ref
 * @returns {JSX.Element} Alert dialog description component
 */
const AlertDialogDescription = React.forwardRef(function AlertDialogDescription(
  /** @type {AlertDialogDescriptionProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...otherProps}
    >
      {children}
    </AlertDialogPrimitive.Description>
  );
})
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

/**
 * Alert dialog action component
 * @typedef {object} AlertDialogActionProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogActionProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>} ref - Forwarded ref
 * @returns {JSX.Element} Alert dialog action component
 */
const AlertDialogAction = React.forwardRef(function AlertDialogAction(
  /** @type {AlertDialogActionProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(buttonVariants(), className)}
      {...otherProps}
    >
      {children}
    </AlertDialogPrimitive.Action>
  );
})
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

/**
 * Alert dialog cancel component
 * @typedef {object} AlertDialogCancelProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {AlertDialogCancelProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>} ref - Forwarded ref
 * @returns {JSX.Element} Alert dialog cancel component
 */
const AlertDialogCancel = React.forwardRef(function AlertDialogCancel(
  /** @type {AlertDialogCancelProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      {...otherProps}
    >
      {children}
    </AlertDialogPrimitive.Cancel>
  );
})
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

/**
 * Export all Alert Dialog components for use in other files
 * @module AlertDialog
 */
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}