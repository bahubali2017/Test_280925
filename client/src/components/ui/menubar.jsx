"use client";

import * as React from "react";
// eslint-disable-next-line no-unused-vars
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "../../lib/utils.js";

// Utility typedef for common props
/**
 * @typedef {object} BaseProps
 * @property {string} [className]
 * @property {boolean} [inset]
 * @property {React.ReactNode} [children]
 * @property {string} [value]
 * @property {string} [align]
 * @property {number} [alignOffset]
 * @property {number} [sideOffset]
 * @property {boolean} [checked]
 */

// Short component wrappers
/**
 * Menubar menu component
 * @param {object} props - Component props
 * @returns {JSX.Element} The menubar menu component
 */
export function MenubarMenu(/** @type {any} */ props) {
  return <MenubarPrimitive.Menu {...props} />;
}
/**
 * Menubar group component
 * @param {object} props - Component props
 * @returns {JSX.Element} The menubar group component
 */
export function MenubarGroup(/** @type {any} */ props) {
  return <MenubarPrimitive.Group {...props} />;
}
/**
 * Menubar portal component
 * @param {object} props - Component props
 * @returns {JSX.Element} The menubar portal component
 */
export function MenubarPortal(/** @type {any} */ props) {
  return <MenubarPrimitive.Portal {...props} />;
}
/**
 * Menubar radio group component
 * @param {object} props - Component props
 * @returns {JSX.Element} The menubar radio group component
 */
export function MenubarRadioGroup(/** @type {any} */ props) {
  return <MenubarPrimitive.RadioGroup {...props} />;
}
/**
 * Menubar sub component
 * @param {object} props - Component props
 * @returns {JSX.Element} The menubar sub component
 */
export function MenubarSub(/** @type {any} */ props) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

// Root
/**
 * Menubar root component 
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar root component
 */
export const Menubar = React.forwardRef(function Menubar(/** @type {BaseProps} */ props, ref) {
  const { className, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.Root
      ref={ref}
      className={cn("flex h-10 items-center space-x-1 rounded-md border bg-background p-1", className)}
      {...rest}
    />
  );
});
Menubar.displayName = "Menubar";

// Trigger
/**
 * Menubar trigger component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLButtonElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar trigger component
 */
export const MenubarTrigger = React.forwardRef(function MenubarTrigger(/** @type {BaseProps} */ props, ref) {
  const { className, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      className={cn("flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", className)}
      {...rest}
    />
  );
});
MenubarTrigger.displayName = "MenubarTrigger";

// Sub Trigger
/**
 * Menubar sub trigger component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar sub trigger component
 */
export const MenubarSubTrigger = React.forwardRef(function MenubarSubTrigger(/** @type {BaseProps} */ props, ref) {
  const { className, inset, children, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.SubTrigger
      ref={ref}
      className={cn("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground", inset && "pl-8", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  );
});
MenubarSubTrigger.displayName = "MenubarSubTrigger";

// Sub Content
/**
 * Menubar sub content component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar sub content component
 */
export const MenubarSubContent = React.forwardRef(function MenubarSubContent(/** @type {BaseProps} */ props, ref) {
  const { className, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.SubContent
      ref={ref}
      className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground", className)}
      {...rest}
    />
  );
});
MenubarSubContent.displayName = "MenubarSubContent";

/**
 * Extended props for MenubarContent
 * @typedef {object} MenubarContentProps
 * @property {string} [className] - Additional class names
 * @property {'start' | 'center' | 'end'} [align='start'] - Content alignment
 * @property {number} [alignOffset=-4] - Alignment offset
 * @property {number} [sideOffset=8] - Side offset
 * @property {React.ReactNode} [children] - Child elements
 */

// Content
/**
 * Menubar content component
 * @type {React.ForwardRefExoticComponent<MenubarContentProps & React.RefAttributes<HTMLDivElement>>}
 */
export const MenubarContent = React.forwardRef(
  /**
   * @param {MenubarContentProps} props - Component props
   * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
   * @returns {JSX.Element} The menubar content component
   */
  function MenubarContent(props, ref) {
    // Create safe props object with type checking
    const safeProps = props || {};
    
    // Default and type-safe property extraction
    const className = typeof safeProps.className === 'string' ? safeProps.className : undefined;
    
    // Handle alignment with strict typing
    /** @type {'start' | 'center' | 'end'} */
    const align = (safeProps.align === 'center' || safeProps.align === 'end') 
      ? safeProps.align 
      : 'start';
    
    // Handle numeric offsets with validation
    const alignOffset = typeof safeProps.alignOffset === 'number' ? safeProps.alignOffset : -4;
    const sideOffset = typeof safeProps.sideOffset === 'number' ? safeProps.sideOffset : 8;
    
    // Extract remaining props safely
    const otherProps = {};
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'align', 'alignOffset', 'sideOffset'].includes(key)) {
        otherProps[key] = safeProps[key];
      }
    });
    
    return (
      <MenubarPrimitive.Portal>
        <MenubarPrimitive.Content
          ref={ref}
          align={align}
          alignOffset={alignOffset}
          sideOffset={sideOffset}
          className={cn("z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
          {...otherProps}
        />
      </MenubarPrimitive.Portal>
    );
  }
);
MenubarContent.displayName = "MenubarContent";

// Item
/**
 * Menubar item component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar item component
 */
export const MenubarItem = React.forwardRef(function MenubarItem(/** @type {BaseProps} */ props, ref) {
  const { className, inset, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.Item
      ref={ref}
      className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground", inset && "pl-8", className)}
      {...rest}
    />
  );
});
MenubarItem.displayName = "MenubarItem";

// Checkbox Item
/**
 * Menubar checkbox item component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar checkbox item component
 */
export const MenubarCheckboxItem = React.forwardRef(function MenubarCheckboxItem(/** @type {BaseProps} */ props, ref) {
  const { className, children, checked, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
});
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

// Radio Item
/**
 * Menubar radio item component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar radio item component
 */
export const MenubarRadioItem = React.forwardRef(function MenubarRadioItem(/** @type {BaseProps} */ props, ref) {
  const { className, children, value, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.RadioItem
      ref={ref}
      value={value}
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
});
MenubarRadioItem.displayName = "MenubarRadioItem";

// Label
/**
 * Menubar label component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar label component
 */
export const MenubarLabel = React.forwardRef(function MenubarLabel(/** @type {BaseProps} */ props, ref) {
  const { className, inset, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...rest}
    />
  );
});
MenubarLabel.displayName = "MenubarLabel";

// Separator
/**
 * Menubar separator component
 * @type {React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLDivElement>>}
 * @param {BaseProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The menubar separator component
 */
export const MenubarSeparator = React.forwardRef(function MenubarSeparator(/** @type {BaseProps} */ props, ref) {
  const { className, ...rest } = props ?? {};
  return (
    <MenubarPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...rest}
    />
  );
});
MenubarSeparator.displayName = "MenubarSeparator";

// Shortcut
/**
 * Menubar shortcut component for displaying keyboard shortcuts
 * @param {BaseProps} props - Component props
 * @returns {JSX.Element} The menubar shortcut component
 */
export function MenubarShortcut(/** @type {BaseProps} */ props) {
  const { className, ...rest } = props ?? {};
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...rest}
    />
  );
}
MenubarShortcut.displayName = "MenubarShortcut";
