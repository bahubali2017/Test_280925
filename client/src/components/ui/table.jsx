import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Table component
 * @typedef {object} TableProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableProps} props - Component props
 * @param {React.Ref<HTMLTableElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table component
 */
const Table = React.forwardRef(function Table(
  /** @type {TableProps} */ props,
  /** @type {React.Ref<HTMLTableElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...otherProps}
      >
        {children}
      </table>
    </div>
  );
})
Table.displayName = "Table"

/**
 * Table header component
 * @typedef {object} TableHeaderProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableHeaderProps} props - Component props
 * @param {React.Ref<HTMLTableSectionElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table header component
 */
const TableHeader = React.forwardRef(function TableHeader(
  /** @type {TableHeaderProps} */ props,
  /** @type {React.Ref<HTMLTableSectionElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <thead 
      ref={ref} 
      className={cn("[&_tr]:border-b", className)} 
      {...otherProps}
    >
      {children}
    </thead>
  );
})
TableHeader.displayName = "TableHeader"

/**
 * Table body component
 * @typedef {object} TableBodyProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableBodyProps} props - Component props
 * @param {React.Ref<HTMLTableSectionElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table body component
 */
const TableBody = React.forwardRef(function TableBody(
  /** @type {TableBodyProps} */ props,
  /** @type {React.Ref<HTMLTableSectionElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...otherProps}
    >
      {children}
    </tbody>
  );
})
TableBody.displayName = "TableBody"

/**
 * Table footer component
 * @typedef {object} TableFooterProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableFooterProps} props - Component props
 * @param {React.Ref<HTMLTableSectionElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table footer component
 */
const TableFooter = React.forwardRef(function TableFooter(
  /** @type {TableFooterProps} */ props,
  /** @type {React.Ref<HTMLTableSectionElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <tfoot
      ref={ref}
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...otherProps}
    >
      {children}
    </tfoot>
  );
})
TableFooter.displayName = "TableFooter"

/**
 * Table row component
 * @typedef {object} TableRowProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableRowProps} props - Component props
 * @param {React.Ref<HTMLTableRowElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table row component
 */
const TableRow = React.forwardRef(function TableRow(
  /** @type {TableRowProps} */ props,
  /** @type {React.Ref<HTMLTableRowElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...otherProps}
    >
      {children}
    </tr>
  );
})
TableRow.displayName = "TableRow"

/**
 * Table head component
 * @typedef {object} TableHeadProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableHeadProps} props - Component props
 * @param {React.Ref<HTMLTableCellElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table head component
 */
const TableHead = React.forwardRef(function TableHead(
  /** @type {TableHeadProps} */ props,
  /** @type {React.Ref<HTMLTableCellElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...otherProps}
    >
      {children}
    </th>
  );
})
TableHead.displayName = "TableHead"

/**
 * Table cell component
 * @typedef {object} TableCellProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableCellProps} props - Component props
 * @param {React.Ref<HTMLTableCellElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table cell component
 */
const TableCell = React.forwardRef(function TableCell(
  /** @type {TableCellProps} */ props,
  /** @type {React.Ref<HTMLTableCellElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...otherProps}
    >
      {children}
    </td>
  );
})
TableCell.displayName = "TableCell"

/**
 * Table caption component
 * @typedef {object} TableCaptionProps
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} [children] - Child elements
 * 
 * @param {TableCaptionProps} props - Component props
 * @param {React.Ref<HTMLTableCaptionElement>} ref - Forwarded ref
 * @returns {JSX.Element} Table caption component
 */
const TableCaption = React.forwardRef(function TableCaption(
  /** @type {TableCaptionProps} */ props,
  /** @type {React.Ref<HTMLTableCaptionElement>} */ ref
) {
  // Initialize props as an empty object if it's null or undefined
  const propsWithDefaults = props || { className: "", children: null };
  // Safely destructure with default values
  const { className = "", children = null, ...otherProps } = propsWithDefaults;
  
  return (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...otherProps}
    >
      {children}
    </caption>
  );
})
TableCaption.displayName = "TableCaption"

/**
 * Export Table components for use in other components
 * @returns {object} Table components collection
 */
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}