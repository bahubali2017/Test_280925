"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "../../lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" }

/**
 * @typedef {object} ChartConfig
 * @property {object} [key] - Chart item configuration
 * @property {React.ReactNode} [key.label] - Label for chart item
 * @property {React.ComponentType} [key.icon] - Icon component for chart item
 * @property {string} [key.color] - Color for chart item
 * @property {object} [key.theme] - Theme colors for chart item
 */

/**
 * @typedef {object} ChartContextProps
 * @property {ChartConfig} config - Chart configuration
 */

const ChartContext = React.createContext(/** @type {ChartContextProps|null} */ (null))

/**
 * Hook to access chart context
 * @returns {ChartContextProps} Chart context
 */
function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

/**
 * Chart container component
 * @typedef {object} ChartContainerProps
 * @property {string} [id] - Chart ID
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} children - Child elements
 * @property {object} config - Chart configuration
 * 
 * @param {ChartContainerProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Chart container component
 */
/**
 * @type {React.ForwardRefExoticComponent<{
 *   id?: string; 
 *   className?: string; 
 *   children: React.ReactNode; 
 *   config: object;
 *   [key: string]: any;
 * } & React.RefAttributes<HTMLDivElement>>}
 */
const ChartContainer = React.forwardRef(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "Chart"

/**
 * Chart style component for dynamic theming
 * @param {object} props - Component props
 * @param {string} props.id - Chart ID
 * @param {ChartConfig} props.config - Chart configuration
 * @returns {JSX.Element|null} Chart style component or null
 */
const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

/**
 * Chart tooltip content component
 * @typedef {object} ChartTooltipContentProps
 * @property {boolean} [active] - Whether tooltip is active
 * @property {Array<{dataKey?: string, name?: string, value?: any, color?: string, payload?: any}>} [payload] - Tooltip payload data
 * @property {string} [className] - Additional class names
 * @property {'line'|'dot'|'dashed'} [indicator='dot'] - Indicator type
 * @property {boolean} [hideLabel=false] - Whether to hide label
 * @property {boolean} [hideIndicator=false] - Whether to hide indicator
 * @property {string|React.ReactNode} [label] - Label
 * @property {(value: any, payload: Array<any>) => React.ReactNode} [labelFormatter] - Label formatter function
 * @property {string} [labelClassName] - Label class name
 * @property {(value: any, name: string, item: any, index: number, payload: any) => React.ReactNode} [formatter] - Value formatter function
 * @property {string} [color] - Indicator color
 * @property {string} [nameKey] - Key for item name
 * @property {string} [labelKey] - Key for label
 */
/**
 * @type {React.ForwardRefExoticComponent<{
 *   active?: boolean;
 *   payload?: Array<{dataKey?: string, name?: string, value?: any, color?: string, payload?: any}>;
 *   className?: string;
 *   indicator?: 'line'|'dot'|'dashed';
 *   hideLabel?: boolean;
 *   hideIndicator?: boolean;
 *   label?: string|React.ReactNode;
 *   labelFormatter?: (value: any, payload: Array<any>) => React.ReactNode;
 *   labelClassName?: string;
 *   formatter?: (value: any, name: string, item: any, index: number, payload: any) => React.ReactNode;
 *   color?: string;
 *   nameKey?: string;
 *   labelKey?: string;
 *   [key: string]: any;
 * } & React.RefAttributes<HTMLDivElement>>}
 */
const ChartTooltipContent = React.forwardRef(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            indicator === "dot" && "h-2.5 w-2.5",
                            indicator === "line" && "w-1",
                            indicator === "dashed" && "w-0 border-[1.5px] border-dashed bg-transparent",
                            nestLabel && indicator === "dashed" && "my-0.5"
                          )}
                          
                          style={
                            indicatorColor ? 
                            Object.assign({}, {
                              backgroundColor: indicatorColor,
                              borderColor: indicatorColor 
                            }) : 
                            {}
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

/**
 * Chart legend content component
 * @typedef {object} ChartLegendContentProps
 * @property {string} [className] - Additional class names
 * @property {boolean} [hideIcon=false] - Whether to hide icon
 * @property {Array<{value?: string, dataKey?: string, color?: string}>} [payload] - Legend payload data
 * @property {'top'|'bottom'} [verticalAlign='bottom'] - Vertical alignment
 * @property {string} [nameKey] - Key for item name
 * 
 * @param {ChartLegendContentProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element|null} Chart legend content component or null
 */
/**
 * @type {React.ForwardRefExoticComponent<{
 *   className?: string;
 *   hideIcon?: boolean;
 *   payload?: Array<{value?: string, dataKey?: string, color?: string}>;
 *   verticalAlign?: 'top'|'bottom';
 *   nameKey?: string;
 *   [key: string]: any;
 * } & React.RefAttributes<HTMLDivElement>>}
 */
const ChartLegendContent = React.forwardRef(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color || "#000"
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

/**
 * Helper to extract item config from a payload
 * @param {ChartConfig} config - Chart configuration
 * @param {unknown} payload - Payload item
 * @param {string} key - Config key
 * @returns {object|undefined} Item configuration or undefined
 */
function getPayloadConfigFromPayload(
  config,
  payload,
  key
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey = key

  if (
    key in payload &&
    typeof payload[key] === "string"
  ) {
    configLabelKey = payload[key]
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key]
}

/**
 * Export Chart components
 * @module Chart
 */
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}