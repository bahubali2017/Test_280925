import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Custom Radix UI event handler that matches the required signature
 * @callback RadixSelectHandler
 * @param {Event} event - DOM event
 * @returns {void}
 */

/**
 * @typedef {object} DropdownBaseProps
 * @property {string} [className] - Additional CSS class names
 * @property {boolean} [inset] - Whether the item should be inset (indented)
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * @typedef {object} RadixDropdownProps
 * @property {RadixSelectHandler} [onSelect] - Selection event handler
 */

/**
 * @typedef {object} DropdownMenuContentProps
 * @property {string} [className] - Additional CSS class names
 * @property {React.ReactNode} [children] - Child elements
 * @property {number} [sideOffset] - Offset from the trigger element
 * @property {RadixSelectHandler} [onSelect] - Selection event handler
 */

/**
 * @typedef {DropdownBaseProps & React.HTMLAttributes<HTMLDivElement> & RadixDropdownProps} DropdownItemProps
 */

/**
 * Helper to create properly typed safe props with consistent defaults
 * @param {object|null|undefined} props - The props to make safe
 * @returns {object} The safely typed props with defaults
 */
function getSafeProps(props) {
  return typeof props === 'object' && props !== null ? props : {};
}

/** Root DropdownMenu container */
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * Dropdown menu subtrigger component
 * @type {React.ForwardRefExoticComponent<DropdownItemProps & React.RefAttributes<HTMLDivElement>>}
 * @param {DropdownItemProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu subtrigger component
 */
const DropdownMenuSubTrigger = React.forwardRef(function SubTrigger(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with proper defaults
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  const inset = Boolean(safeProps.inset);
  const children = safeProps.children;
  
  // Extract remaining props
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'inset', 'children'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

/**
 * Dropdown menu sub-content component
 * @type {React.ForwardRefExoticComponent<DropdownItemProps & React.RefAttributes<HTMLDivElement>>}
 * @param {DropdownItemProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu subcontent component
 */
const DropdownMenuSubContent = React.forwardRef(function SubContent(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with proper defaults
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  
  // Extract remaining props
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
      {...rest}
    />
  );
});

/* Removed duplicate type definition */

/**
 * Dropdown menu content component
 * @type {React.ForwardRefExoticComponent<DropdownMenuContentProps & React.RefAttributes<HTMLDivElement>>}
 * @param {DropdownMenuContentProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu content component
 */
const DropdownMenuContent = React.forwardRef(function Content(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with proper defaults
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  const sideOffset = typeof safeProps.sideOffset === 'number' ? safeProps.sideOffset : 4;
  
  // Extract remaining props
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'sideOffset'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

/**
 * A dropdown menu item component
 * @type {React.ForwardRefExoticComponent<DropdownItemProps & React.RefAttributes<HTMLDivElement>>}
 * @param {DropdownItemProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu item component
 */
const DropdownMenuItem = React.forwardRef(function Item(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with proper type checking
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  const inset = Boolean(safeProps.inset);
  const children = safeProps.children;
  
  // Extract remaining props
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'inset', 'children'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...rest}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
});

/**
 * @typedef {object} CustomCheckboxItemProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * @property {boolean} [checked] - Whether the checkbox is checked
 * @property {boolean} [inset] - Whether the item is inset
 */

/**
 * A dropdown menu checkbox item component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & React.RefAttributes<HTMLDivElement>>}
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu checkbox item component
 */
const DropdownMenuCheckboxItem = React.forwardRef(function CheckboxItem(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with type checking and proper defaults
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  const children = safeProps.children;
  const checked = Boolean(safeProps.checked);
  
  // Extract remaining props excluding special properties
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'children', 'checked'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

/**
 * @typedef {object} CustomRadioItemProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * @property {string} value - The radio item's value
 * @property {boolean} [inset] - Whether the item is inset
 */

/**
 * A dropdown menu radio item component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & React.RefAttributes<HTMLDivElement>>}
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu radio item component
 */
const DropdownMenuRadioItem = React.forwardRef(function RadioItem(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with type checking and proper defaults
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  const children = safeProps.children;
  
  // Ensure value is a string
  const value = typeof safeProps.value !== 'undefined' 
    ? String(safeProps.value) 
    : "";
  
  // Extract remaining props excluding special properties
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'children', 'value'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      value={value}
      className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

/**
 * A dropdown menu label component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {inset?: boolean} & React.RefAttributes<HTMLDivElement>>}
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {boolean} [props.inset] - Whether the label is inset
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu label component
 */
const DropdownMenuLabel = React.forwardRef(function Label(props, ref) {
  // Safely handle props
  const safeProps = getSafeProps(props);
  
  // Extract known props with type safety
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  const children = safeProps.children;
  const inset = Boolean(safeProps.inset);
  
  // Create a filtered props object to pass to the component
  const filteredProps = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className', 'children', 'inset'].includes(key)) {
        filteredProps[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...filteredProps}
    >
      {children}
    </DropdownMenuPrimitive.Label>
  );
});

/**
 * A dropdown menu separator component
 * @type {React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & React.RefAttributes<HTMLDivElement>>}
 * @param {React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The dropdown menu separator component
 */
const DropdownMenuSeparator = React.forwardRef(function Separator(props, ref) {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with proper defaults
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  
  // Extract remaining props safely
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...rest}
    />
  );
});

/**
 * @typedef {object} ShortcutProps
 * @property {string} [className] - Additional CSS class names
 */

/**
 * A dropdown menu shortcut component for displaying keyboard shortcuts
 * @type {(props: ShortcutProps & React.HTMLAttributes<HTMLSpanElement>) => JSX.Element}
 * @param {ShortcutProps & React.HTMLAttributes<HTMLSpanElement>} props - Component props
 * @returns {JSX.Element} The dropdown menu shortcut component
 */
const DropdownMenuShortcut = (props) => {
  // Safely handle null/undefined props
  const safeProps = getSafeProps(props);
  
  // Safely extract properties with type safety
  const className = typeof safeProps.className === 'string' ? safeProps.className : "";
  
  // Extract remaining props safely
  const rest = {};
  if (typeof safeProps === 'object') {
    Object.keys(safeProps).forEach(key => {
      if (!['className'].includes(key)) {
        rest[key] = safeProps[key];
      }
    });
  }
  
  return (
    <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...rest} />
  );
};

/**
 * Export Dropdown Menu components
 * @module DropdownMenu
 */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
