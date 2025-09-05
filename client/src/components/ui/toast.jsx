import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Toast provider component
 */
const ToastProvider = ToastPrimitives.Provider

/**
 * Toast viewport component
 * @typedef {object} ToastViewportProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {ToastViewportProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Viewport>>} ref - Forwarded ref
 * @returns {JSX.Element} Toast viewport component
 */
const ToastViewport = React.forwardRef(function ToastViewport(
  /** @type {ToastViewportProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof ToastPrimitives.Viewport>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || {};
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
      {...otherProps}
    >
      {children}
    </ToastPrimitives.Viewport>
  );
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

/**
 * Toast variant styles using class-variance-authority for consistent styling
 * 
 * @returns {string} Generated class names based on variant
 */
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Toast component
 * @typedef {object} ToastRootProps
 * @property {string} [className] - Additional class names
 * @property {'default' | 'destructive'} [variant] - Toast variant
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {ToastRootProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Root>>} ref - Forwarded ref
 * @returns {JSX.Element} Toast component
 */
const Toast = React.forwardRef(function Toast(
  /** @type {ToastRootProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof ToastPrimitives.Root>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || {};
  // Safely destructure with default values
  const { 
    className = "", 
    variant = /** @type {'default'} */ ('default'), 
    children = null, 
    ...otherProps 
  } = propsWithDefaults;
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...otherProps}
    >
      {children}
    </ToastPrimitives.Root>
  );
})
Toast.displayName = ToastPrimitives.Root.displayName

/**
 * Toast action component
 * @typedef {object} ToastActionProps
 * @property {string} [className] - Additional class names
 * @property {string} [altText] - Accessible text description for the action
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {ToastActionProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Action>>} ref - Forwarded ref
 * @returns {JSX.Element} Toast action component
 */
const ToastAction = React.forwardRef(function ToastAction(
  /** @type {ToastActionProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof ToastPrimitives.Action>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || {};
  // Safely destructure with default values
  const { className = "", children = null, altText = "", ...otherProps } = propsWithDefaults;
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        className
      )}
      altText={altText}
      {...otherProps}
    >
      {children}
    </ToastPrimitives.Action>
  );
})
ToastAction.displayName = ToastPrimitives.Action.displayName

/**
 * Toast close component
 * @typedef {object} ToastCloseProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements (default is X icon)
 * 
 * @param {ToastCloseProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Close>>} ref - Forwarded ref
 * @returns {JSX.Element} Toast close component
 */
const ToastClose = React.forwardRef(function ToastClose(
  /** @type {ToastCloseProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof ToastPrimitives.Close>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || {};
  // Safely destructure with default values
  const { className = "", children, ...otherProps } = propsWithDefaults;
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
        className
      )}
      toast-close=""
      {...otherProps}
    >
      {children || <X className="h-4 w-4" />}
    </ToastPrimitives.Close>
  );
})
ToastClose.displayName = ToastPrimitives.Close.displayName

/**
 * Toast title component
 * @typedef {object} ToastTitleProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {ToastTitleProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Title>>} ref - Forwarded ref
 * @returns {JSX.Element} Toast title component
 */
const ToastTitle = React.forwardRef(function ToastTitle(
  /** @type {ToastTitleProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof ToastPrimitives.Title>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || {};
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...otherProps}
    >
      {children}
    </ToastPrimitives.Title>
  );
})
ToastTitle.displayName = ToastPrimitives.Title.displayName

/**
 * Toast description component
 * @typedef {object} ToastDescriptionProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {ToastDescriptionProps} props - Component props
 * @param {React.Ref<React.ElementRef<typeof ToastPrimitives.Description>>} ref - Forwarded ref
 * @returns {JSX.Element} Toast description component
 */
const ToastDescription = React.forwardRef(function ToastDescription(
  /** @type {ToastDescriptionProps} */ props,
  /** @type {React.Ref<React.ElementRef<typeof ToastPrimitives.Description>>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || {};
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...otherProps}
    >
      {children}
    </ToastPrimitives.Description>
  );
})
ToastDescription.displayName = ToastPrimitives.Description.displayName

/**
 * ToastProps type definition
 * @typedef {object} ToastProps
 * @property {string} [className] - Additional class names
 * @property {string} [variant] - Toast variant ('default' or 'destructive')
 * @property {React.ReactNode} children - Child elements
 */

/**
 * ToastActionElement type definition
 * @typedef {React.ReactElement} ToastActionElement
 */

/**
 * Export Toast components
 * @module Toast
 */
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}