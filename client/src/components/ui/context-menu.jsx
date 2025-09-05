import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "../../lib/utils.js";

/**
 * @typedef {object} SharedProps
 * @property {string} [className]
 * @property {boolean} [inset]
 * @property {React.ReactNode} [children]
 */

/** Base context menu structure */
const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuPortal = ContextMenuPrimitive.Portal;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu sub trigger component
 */
const ContextMenuSubTrigger = React.forwardRef((props, ref) => {
  const { className, inset, children, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </ContextMenuPrimitive.SubTrigger>
  );
});
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu sub content component
 */
const ContextMenuSubContent = React.forwardRef((props, ref) => {
  const { className, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
        className
      )}
      {...rest}
    />
  );
});
ContextMenuSubContent.displayName = "ContextMenuSubContent";

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu content component
 */
const ContextMenuContent = React.forwardRef((props, ref) => {
  const { className, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        className={cn(
          "z-50 max-h-[--radix-context-menu-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
          className
        )}
        {...rest}
      />
    </ContextMenuPrimitive.Portal>
  );
});
ContextMenuContent.displayName = "ContextMenuContent";

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu item component
 */
const ContextMenuItem = React.forwardRef((props, ref) => {
  const { className, inset, children, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...rest}
    >
      {children}
    </ContextMenuPrimitive.Item>
  );
});
ContextMenuItem.displayName = "ContextMenuItem";

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & { checked?: boolean } & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps & { checked?: boolean }} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu checkbox item component
 */
const ContextMenuCheckboxItem = React.forwardRef((props, ref) => {
  const { className, children, checked, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
});
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & { value: string } & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps & { value: string }} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu radio item component
 */
const ContextMenuRadioItem = React.forwardRef((props, ref) => {
  const { className, children, value, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.RadioItem
      ref={ref}
      value={value}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
});
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

/** 
 * @type {React.ForwardRefExoticComponent<SharedProps & React.RefAttributes<HTMLDivElement>>}
 * @param {SharedProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu label component
 */
const ContextMenuLabel = React.forwardRef((props, ref) => {
  const { className, inset, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold text-foreground",
        inset && "pl-8",
        className
      )}
      {...rest}
    />
  );
});
ContextMenuLabel.displayName = "ContextMenuLabel";

/** 
 * @type {React.ForwardRefExoticComponent<{ className?: string } & React.RefAttributes<HTMLDivElement>>}
 * @param {{ className?: string }} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Context menu separator component
 */
const ContextMenuSeparator = React.forwardRef((props, ref) => {
  const { className, ...rest } = props ?? {};
  return (
    <ContextMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...rest}
    />
  );
});
ContextMenuSeparator.displayName = "ContextMenuSeparator";

/**
 * @param {{ className?: string }} props
 * @returns {JSX.Element}
 */
const ContextMenuShortcut = ({ className, ...rest }) => (
  <span
    className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
    {...rest}
  />
);
ContextMenuShortcut.displayName = "ContextMenuShortcut";

/**
 * Export Context Menu components
 * @module ContextMenu
 */
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
