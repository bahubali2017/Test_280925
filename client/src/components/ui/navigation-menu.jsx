import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Navigation menu component
 * @typedef {object} NavigationMenuProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {NavigationMenuProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Navigation menu component
 */
const NavigationMenu = React.forwardRef(function NavigationMenu(
  /** @type {NavigationMenuProps} */ props,
  /** @type {React.Ref<HTMLDivElement>} */ ref
) {
  // Safely destructure with default values to avoid undefined
  const { className = "", children = null, ...otherProps } = props || {};
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn(
        "relative z-10 flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...otherProps}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  );
})
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

/**
 * Navigation menu list component
 * @typedef {object} NavigationMenuListProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {NavigationMenuListProps} props - Component props
 * @param {React.Ref<HTMLUListElement>} ref - Forwarded ref
 * @returns {JSX.Element} Navigation menu list component
 */
const NavigationMenuList = React.forwardRef(function NavigationMenuList(
  /** @type {NavigationMenuListProps} */ props,
  /** @type {React.Ref<HTMLUListElement>} */ ref
) {
  // Safely destructure with default values to avoid undefined
  const { className = "", children = null, ...otherProps } = props || {};
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cn(
        "group flex flex-1 list-none items-center justify-center space-x-1",
        className
      )}
      {...otherProps}
    >
      {children}
    </NavigationMenuPrimitive.List>
  );
})
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

/**
 * Navigation menu item component
 * @type {typeof NavigationMenuPrimitive.Item}
 */
const NavigationMenuItem = NavigationMenuPrimitive.Item

/**
 * Navigation menu trigger style
 * Function for generating navigation menu trigger class names
 * @returns {string} The generated class names
 */
const navigationMenuTriggerStyle = () => {
  return "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent";
}

/**
 * Navigation menu trigger component
 * @typedef {object} NavigationMenuTriggerProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {NavigationMenuTriggerProps} props - Component props
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} Navigation menu trigger component
 */
const NavigationMenuTrigger = React.forwardRef(function NavigationMenuTrigger(
  /** @type {NavigationMenuTriggerProps} */ props,
  /** @type {React.Ref<HTMLButtonElement>} */ ref
) {
  // Safely destructure with default values to avoid undefined
  const { className = "", children = null, ...otherProps } = props || {};
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...otherProps}
    >
      {children}{" "}
      <ChevronDown
        className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
})
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

/**
 * Navigation menu content component
 * @typedef {object} NavigationMenuContentProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {NavigationMenuContentProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Navigation menu content component
 */
const NavigationMenuContent = React.forwardRef(function NavigationMenuContent(
  /** @type {NavigationMenuContentProps} */ props,
  /** @type {React.Ref<HTMLDivElement>} */ ref
) {
  // Safely destructure with default values to avoid undefined
  const { className = "", children = null, ...otherProps } = props || {};
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn(
        "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
        className
      )}
      {...otherProps}
    >
      {children}
    </NavigationMenuPrimitive.Content>
  );
})
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

/**
 * Navigation menu link component
 * @type {typeof NavigationMenuPrimitive.Link}
 */
const NavigationMenuLink = NavigationMenuPrimitive.Link

/**
 * Navigation menu viewport component
 * @typedef {object} NavigationMenuViewportProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {NavigationMenuViewportProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Navigation menu viewport component
 */
const NavigationMenuViewport = React.forwardRef(function NavigationMenuViewport(
  /** @type {NavigationMenuViewportProps} */ props,
  /** @type {React.Ref<HTMLDivElement>} */ ref
) {
  // Safely destructure with default values to avoid undefined
  const { className = "", children = null, ...otherProps } = props || {};
  return (
    <div className={cn("absolute left-0 top-full flex justify-center")}>
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        ref={ref}
        {...otherProps}
      >
        {children}
      </NavigationMenuPrimitive.Viewport>
    </div>
  );
})
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

/**
 * Navigation menu indicator component
 * @typedef {object} NavigationMenuIndicatorProps
 * @property {string} [className] - Additional class names
 * 
 * @param {NavigationMenuIndicatorProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Navigation menu indicator component
 */
const NavigationMenuIndicator = React.forwardRef(function NavigationMenuIndicator(
  /** @type {NavigationMenuIndicatorProps} */ props,
  /** @type {React.Ref<HTMLDivElement>} */ ref
) {
  // Safely destructure with default values to avoid undefined
  const { className = "", ...otherProps } = props || {};
  return (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      className={cn(
        "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
        className
      )}
      {...otherProps}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
})
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

/**
 * Export navigation menu components
 * @module navigation-menu
 */
export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}