import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

/**
 * @typedef {object} CarouselProps
 * @property {Record<string, any>} [opts] - Carousel options for embla carousel
 * @property {any[]} [plugins] - Carousel plugins for embla carousel
 * @property {"horizontal"|"vertical"} [orientation="horizontal"] - Carousel orientation
 * @property {Function} [setApi] - Function to set carousel API externally
 * @property {string} [className] - Additional class names
 * @property {React.ReactNode} children - Child components
 */

/**
 * @typedef {object} CarouselContextProps
 * @property {React.RefObject<HTMLDivElement>} carouselRef - Reference to carousel element
 * @property {any} api - Embla carousel API
 * @property {Function} scrollPrev - Function to scroll to previous slide
 * @property {Function} scrollNext - Function to scroll to next slide
 * @property {boolean} canScrollPrev - Whether carousel can scroll to previous slide
 * @property {boolean} canScrollNext - Whether carousel can scroll to next slide
 * @property {object} [opts] - Carousel options
 * @property {"horizontal"|"vertical"} [orientation] - Carousel orientation
 */

/** @type {React.Context<CarouselContextProps|null>} */
const CarouselContext = React.createContext(/** @type {CarouselContextProps|null} */ (null))

/**
 * Hook to access carousel context
 * @returns {CarouselContextProps} Carousel context
 */
function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

/**
 * Carousel component
 * @param {CarouselProps} props - Component props
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Carousel component
 */
const Carousel = React.forwardRef(
  /** 
   * @param {CarouselProps} props - Component props 
   * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
   * @returns {JSX.Element} Carousel component
   */
  (props, ref) => {
    /** @type {CarouselProps} */
    const propsCast = props;
    const {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...otherProps
    } = propsCast;

    /** @type {[any, any]} */
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((/** @type {any} */ api) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (/** @type {React.KeyboardEvent} */ event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    // Create a properly typed value object for the context
    /** @type {{
      carouselRef: any,
      api: any,
      opts: any,
      orientation: "horizontal" | "vertical",
      scrollPrev: () => void,
      scrollNext: () => void,
      canScrollPrev: boolean,
      canScrollNext: boolean
    }} */
    const contextValue = {
      carouselRef,
      api: api,
      opts,
      orientation:
        orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    };

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...otherProps}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

/**
 * Carousel content component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} props.children - Child elements
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Carousel content component
 */
const CarouselContent = React.forwardRef(
  /** 
   * @param {{className?: string, children: React.ReactNode}} props - Component props
   * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
   * @returns {JSX.Element} Carousel content component
   */
  (props, ref) => {
    /** @type {{className?: string, children: React.ReactNode}} */
    const typedProps = props;
    const { className, children, ...otherProps } = typedProps;
    const { carouselRef, orientation } = useCarousel()
    
    /** @type {import('react').RefObject<HTMLDivElement>} */
    const typedCarouselRef = carouselRef;

    return (
      <div ref={typedCarouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            "flex",
            orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
            className
          )}
          {...otherProps}
        >
          {children}
        </div>
      </div>
    )
  }
)
CarouselContent.displayName = "CarouselContent"

/**
 * Carousel item component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} props.children - Child elements
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Carousel item component
 */
const CarouselItem = React.forwardRef(
  /** 
   * @param {{className?: string, children: React.ReactNode}} props - Component props
   * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
   * @returns {JSX.Element} Carousel item component
   */
  (props, ref) => {
    /** @type {{className?: string, children: React.ReactNode}} */
    const typedProps = props;
    const { className, children, ...otherProps } = typedProps;
    const { orientation } = useCarousel()

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className
        )}
        {...otherProps}
      >
        {children}
      </div>
    )
  }
)
CarouselItem.displayName = "CarouselItem"

/**
 * Carousel previous button component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {string} [props.variant="outline"] - Button variant
 * @param {string} [props.size="icon"] - Button size
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {React.ForwardedRef<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} Carousel previous button component
 */
const CarouselPrevious = React.forwardRef(
  /** 
   * @param {{className?: string, variant?: string, size?: string, children?: React.ReactNode}} props - Component props
   * @param {React.ForwardedRef<HTMLButtonElement>} ref - Forwarded ref
   * @returns {JSX.Element} Carousel previous button
   */
  (props, ref) => {
    /** @type {{className?: string, variant?: string, size?: string, children?: React.ReactNode}} */
    const typedProps = props;
    const { className, variant = "outline", size = "icon", ...otherProps } = typedProps;
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    // Build className directly (no intermediate unused variables)
    const combinedClassName = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      variant === "outline" ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground" : "",
      size === "icon" ? "h-10 w-10" : "",
      "absolute h-8 w-8 rounded-full",
      orientation === "horizontal"
        ? "-left-12 top-1/2 -translate-y-1/2"
        : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
      className
    );
    
    // Create a properly typed onClick handler
    /** @type {React.MouseEventHandler<HTMLButtonElement>} */
    const handleClick = React.useCallback((event) => {
      if (typeof scrollPrev === 'function') {
        scrollPrev(event);
      }
    }, [scrollPrev]);
    
    return (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        disabled={!canScrollPrev}
        onClick={handleClick}
        aria-label="Previous slide"
        {...otherProps}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </button>
    );
  }
)
CarouselPrevious.displayName = "CarouselPrevious"

/**
 * Carousel next button component
 * @param {object} props - Component props
 * @param {string} [props.className] - Additional class names
 * @param {string} [props.variant="outline"] - Button variant
 * @param {string} [props.size="icon"] - Button size
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {React.ForwardedRef<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} Carousel next button component
 */
const CarouselNext = React.forwardRef(
  /** 
   * @param {{className?: string, variant?: string, size?: string, children?: React.ReactNode}} props - Component props
   * @param {React.ForwardedRef<HTMLButtonElement>} ref - Forwarded ref
   * @returns {JSX.Element} Carousel next button
   */
  (props, ref) => {
    /** @type {{className?: string, variant?: string, size?: string, children?: React.ReactNode}} */
    const typedProps = props;
    const { className, variant = "outline", size = "icon", ...otherProps } = typedProps;
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    // Build className directly without intermediate unused variables
    const combinedClassName = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      variant === "outline" ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground" : "",
      size === "icon" ? "h-10 w-10" : "",
      "absolute h-8 w-8 rounded-full",
      orientation === "horizontal"
        ? "-right-12 top-1/2 -translate-y-1/2"
        : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
      className
    );
    
    // Create a properly typed onClick handler
    /** @type {React.MouseEventHandler<HTMLButtonElement>} */
    const handleClick = React.useCallback((event) => {
      if (typeof scrollNext === 'function') {
        scrollNext(event);
      }
    }, [scrollNext]);
    
    return (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        disabled={!canScrollNext}
        onClick={handleClick}
        aria-label="Next slide"
        {...otherProps}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </button>
    );
  }
)
CarouselNext.displayName = "CarouselNext"

/**
 * Export Carousel components
 * @module Carousel
 */
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}