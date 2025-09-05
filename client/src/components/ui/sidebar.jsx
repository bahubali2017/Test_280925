import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft } from "lucide-react";
import { TooltipProvider } from "./tooltip";

import { useIsMobile } from "../../hooks/use-mobile";
import { cn } from "../../lib/utils";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/**
 * @typedef {'expanded'|'collapsed'} SidebarState
 */

/**
 * @typedef {object} SidebarContextProps
 * @property {SidebarState} state
 * @property {boolean} open
 * @property {(value: boolean | ((prev: boolean) => boolean)) => void} setOpen
 * @property {boolean} isMobile
 * @property {boolean} openMobile
 * @property {(value: boolean | ((prev: boolean) => boolean)) => void} setOpenMobile
 * @property {() => void} toggleSidebar
 */

/** @type {React.Context<SidebarContextProps|null>} */
const SidebarContext = React.createContext(null);

/**
 * @returns {SidebarContextProps}
 */
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

/**
 * @typedef {object} SidebarProviderProps
 * @property {boolean} [defaultOpen] - Whether the sidebar is open by default
 * @property {boolean} [open] - Controlled open state
 * @property {(open: boolean) => void} [onOpenChange] - Callback when open state changes
 * @property {string} [className] - Additional class names
 * @property {React.CSSProperties} [style] - Additional styles
 * @property {React.ReactNode} children - Child elements
 */

/**
 * Sidebar provider component
 * @param {SidebarProviderProps & React.HTMLAttributes<HTMLDivElement>} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Sidebar provider component
 */
const SidebarProvider = React.forwardRef(function SidebarProvider(props, ref) {
  // Use a safer approach to extract props
  const safeProps = props || {};
  
  // Safely extract individual props
  const defaultOpen = 'defaultOpen' in safeProps ? !!safeProps.defaultOpen : true;
  const openProp = 'open' in safeProps ? safeProps.open : undefined;
  const setOpenProp = 'onOpenChange' in safeProps ? safeProps.onOpenChange : undefined;
  const className = 'className' in safeProps ? safeProps.className : undefined;
  const style = 'style' in safeProps ? safeProps.style : undefined;
  // Safely type children as ReactNode
  const children = 'children' in safeProps ? /** @type {React.ReactNode} */ (safeProps.children) : null;
  
  // Create a properly typed object for HTML attributes with explicit typing
  /** @type {string|undefined} */
  const id = 'id' in safeProps ? String(safeProps.id || '') : undefined;
  
  /** @type {React.AriaRole|undefined} */
  const role = 'role' in safeProps ? 
    (typeof safeProps.role === 'string' ? safeProps.role : undefined) : 
    undefined;
  
  /** @type {number|undefined} */
  const tabIndex = 'tabIndex' in safeProps ? 
    (typeof safeProps.tabIndex === 'number' ? safeProps.tabIndex : undefined) : 
    undefined;
  
  /** @type {string|undefined} */
  const ariaLabel = 'aria-label' in safeProps ? 
    (typeof safeProps['aria-label'] === 'string' ? safeProps['aria-label'] : undefined) : 
    undefined;
  
  /** @type {string|undefined} */
  const ariaLabelledBy = 'aria-labelledby' in safeProps ? 
    (typeof safeProps['aria-labelledby'] === 'string' ? safeProps['aria-labelledby'] : undefined) : 
    undefined;
  
  /** @type {string|undefined} */
  const ariaDescribedBy = 'aria-describedby' in safeProps ? 
    (typeof safeProps['aria-describedby'] === 'string' ? safeProps['aria-describedby'] : undefined) : 
    undefined;
  
  /** @type {React.MouseEventHandler<HTMLDivElement>|undefined} */
  const onClick = 'onClick' in safeProps && typeof safeProps.onClick === 'function' ? 
    /** @type {React.MouseEventHandler<HTMLDivElement>} */ (safeProps.onClick) : 
    undefined;
  
  /** @type {React.KeyboardEventHandler<HTMLDivElement>|undefined} */
  const onKeyDown = 'onKeyDown' in safeProps && typeof safeProps.onKeyDown === 'function' ? 
    /** @type {React.KeyboardEventHandler<HTMLDivElement>} */ (safeProps.onKeyDown) : 
    undefined;
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  // Safely type the open state as boolean to satisfy TypeScript
  const open = typeof openProp === 'boolean' ? openProp : _open;

  /**
   * Handle setting the open state
   * @type {(value: boolean | ((prev: boolean) => boolean)) => void}
   */
  const setOpen = React.useCallback((value) => {
    // Handle both direct boolean values and functions that return a boolean
    let newValue;
    
    if (typeof value === "function") {
      // When a function is passed, call it with the current open state
      const valueFunction = /** @type {(prev: boolean) => boolean} */ (value);
      newValue = valueFunction(/** @type {boolean} */ (open));
    } else {
      // Otherwise use the direct boolean value
      newValue = value;
    }
    
    // Use the controlled prop function if provided, otherwise update internal state
    if (typeof setOpenProp === "function") {
      setOpenProp(newValue);
    } else {
      _setOpen(newValue);
    }
    
    // Store the state in a cookie for persistence
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${newValue}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, [open, setOpenProp]);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    /**
     * @param {KeyboardEvent} e
     */
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === SIDEBAR_KEYBOARD_SHORTCUT) {
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  /** @type {SidebarState} */
  const state = open ? "expanded" : "collapsed";

  // Create context value with proper typing to satisfy TypeScript
  const contextValue = React.useMemo(
    () => /** @type {SidebarContextProps} */ ({
      state,
      open: /** @type {boolean} */ (open),
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  // Create style object with proper typing for CSS variables
  /** @type {React.CSSProperties & {[key: string]: string|number}} */
  const combinedStyle = {};
  
  // Add CSS custom properties as special variables
  // These custom properties need to be added as string keys due to TypeScript limitations
  combinedStyle["--sidebar-width"] = SIDEBAR_WIDTH;
  combinedStyle["--sidebar-width-icon"] = SIDEBAR_WIDTH_ICON;
  
  // Safely add any custom styles if provided
  if (style && typeof style === 'object') {
    // Copy properties from provided style object
    Object.entries(style).forEach(([key, value]) => {
      if (value !== undefined) {
        combinedStyle[key] = value;
      }
    });
  }
  
  // Create a properly typed div element with all properties
  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          ref={ref}
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
            className
          )}
          style={combinedStyle}
          // Apply individually extracted attributes
          id={id}
          role={role}
          tabIndex={tabIndex}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
});

SidebarProvider.displayName = "SidebarProvider";

/**
 *
 */
export { SidebarProvider, useSidebar };
