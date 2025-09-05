"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "../../lib/utils.js" // fixed path alias

/**
 * Drawer component from Vaul
 * @param {object} props - Component props
 * @param {boolean} [props.shouldScaleBackground=true] - Whether to scale the background when drawer is open
 * @returns {JSX.Element} Drawer component
 */
const Drawer = ({
  shouldScaleBackground = true,
  ...props
}) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef(
  /**
   * @param {{ className?: string }} props
   * @param {React.Ref<HTMLDivElement>} ref
   * @returns {JSX.Element} The drawer overlay component
   */
  function DrawerOverlay(props, ref) {
    const safeProps = props || {}
    const { className = "", ...rest } = safeProps
    return (
      <DrawerPrimitive.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/80", className)}
        {...rest}
      />
    )
  }
)
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef(
  /**
   * @param {{ className?: string, children?: React.ReactNode }} props
   * @param {React.Ref<HTMLDivElement>} ref
   * @returns {JSX.Element} The drawer content component
   */
  function DrawerContent(props, ref) {
    const safeProps = props || {}
    const { className = "", children = null, ...rest } = safeProps

    return (
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          ref={ref}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
            className
          )}
          {...rest}
        >
          <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          {children}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    )
  }
)
DrawerContent.displayName = "DrawerContent"

/**
 * DrawerHeader component for drawer header content
 * @param {object} props - Component props
 * @param {string} [props.className=""] - Additional CSS class names
 * @returns {JSX.Element} DrawerHeader component
 */
const DrawerHeader = (props) => {
  const { className = "", ...rest } = props || {}
  return (
    <div
      className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
      {...rest}
    />
  )
}
DrawerHeader.displayName = "DrawerHeader"

/**
 * DrawerFooter component for drawer footer content
 * @param {object} props - Component props
 * @param {string} [props.className=""] - Additional CSS class names
 * @returns {JSX.Element} DrawerFooter component
 */
const DrawerFooter = (props) => {
  const { className = "", ...rest } = props || {}
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...rest}
    />
  )
}
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef(
  /**
   * @param {object} props - Component props
   * @param {string} [props.className=""] - Additional CSS class names
   * @param {React.ReactNode} [props.children] - Child elements
   * @param {React.Ref<HTMLHeadingElement>} ref - Forwarded ref
   * @returns {JSX.Element} DrawerTitle component
   */
  function DrawerTitle(props, ref) {
    const { className = "", ...rest } = props || {}
    return (
      <DrawerPrimitive.Title
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...rest}
      />
    )
  }
)
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef(
  /**
   * @param {object} props - Component props
   * @param {string} [props.className=""] - Additional CSS class names
   * @param {React.ReactNode} [props.children] - Child elements
   * @param {React.Ref<HTMLParagraphElement>} ref - Forwarded ref
   * @returns {JSX.Element} DrawerDescription component
   */
  function DrawerDescription(props, ref) {
    const { className = "", ...rest } = props || {}
    return (
      <DrawerPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...rest}
      />
    )
  }
)
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

/**
 * Export drawer components for use in the application
 * @module Drawer
 */
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
