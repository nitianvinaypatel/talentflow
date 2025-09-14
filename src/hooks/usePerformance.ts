import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Hook for memoizing expensive calculations
export function useExpensiveCalculation<T>(
    calculation: () => T,
    dependencies: React.DependencyList,
    options: {
        timeout?: number
        onCalculationStart?: () => void
        onCalculationEnd?: (result: T, duration: number) => void
    } = {}
): T {
    const { timeout = 100, onCalculationStart, onCalculationEnd } = options

    return useMemo(() => {
        const startTime = performance.now()

        onCalculationStart?.()

        // Use setTimeout to allow UI to update
        const result = calculation()

        const endTime = performance.now()
        const duration = endTime - startTime

        onCalculationEnd?.(result, duration)

        // Log slow calculations in development
        if (import.meta.env.DEV && duration > timeout) {
            console.warn(`Slow calculation detected: ${duration.toFixed(2)}ms`, {
                dependencies,
                result,
            })
        }

        return result
    }, dependencies)
}

// Hook for debounced values with performance tracking
export function useDebouncedValue<T>(
    value: T,
    delay: number,
    options: {
        maxWait?: number
        leading?: boolean
        trailing?: boolean
    } = {}
): [T, boolean] {
    const [debouncedValue, setDebouncedValue] = useState(value)
    const [isPending, setIsPending] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastCallTimeRef = useRef<number | null>(null)

    const { maxWait, leading = false, trailing = true } = options

    useEffect(() => {
        const now = Date.now()
        const timeSinceLastCall = lastCallTimeRef.current ? now - lastCallTimeRef.current : 0

        // Clear existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current)
        }

        // Leading edge execution
        if (leading && (!lastCallTimeRef.current || timeSinceLastCall >= delay)) {
            setDebouncedValue(value)
            setIsPending(false)
            lastCallTimeRef.current = now
            return
        }

        setIsPending(true)

        // Set up trailing edge execution
        if (trailing) {
            timeoutRef.current = setTimeout(() => {
                setDebouncedValue(value)
                setIsPending(false)
                lastCallTimeRef.current = Date.now()
            }, delay)
        }

        // Set up max wait execution
        if (maxWait && (!lastCallTimeRef.current || timeSinceLastCall < maxWait)) {
            const remainingMaxWait = maxWait - timeSinceLastCall
            maxWaitTimeoutRef.current = setTimeout(() => {
                setDebouncedValue(value)
                setIsPending(false)
                lastCallTimeRef.current = Date.now()
            }, remainingMaxWait)
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            if (maxWaitTimeoutRef.current) {
                clearTimeout(maxWaitTimeoutRef.current)
            }
        }
    }, [value, delay, leading, trailing, maxWait])

    return [debouncedValue, isPending]
}

// Hook for throttled callbacks
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    options: {
        leading?: boolean
        trailing?: boolean
    } = {}
): [T, boolean] {
    const { leading = true, trailing = true } = options
    const [isThrottled, setIsThrottled] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastCallTimeRef = useRef<number | null>(null)
    const lastArgsRef = useRef<Parameters<T> | null>(null)

    const throttledCallback = useCallback((...args: Parameters<T>) => {
        const now = Date.now()
        const timeSinceLastCall = lastCallTimeRef.current ? now - lastCallTimeRef.current : Infinity

        lastArgsRef.current = args

        // Leading edge execution
        if (leading && timeSinceLastCall >= delay) {
            callback(...args)
            lastCallTimeRef.current = now
            setIsThrottled(true)

            // Clear throttled state after delay
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(() => {
                setIsThrottled(false)
            }, delay)

            return
        }

        // Set up trailing edge execution
        if (trailing && !timeoutRef.current) {
            setIsThrottled(true)
            timeoutRef.current = setTimeout(() => {
                if (lastArgsRef.current) {
                    callback(...lastArgsRef.current)
                    lastCallTimeRef.current = Date.now()
                }
                setIsThrottled(false)
                timeoutRef.current = null
            }, delay - timeSinceLastCall)
        }
    }, [callback, delay, leading, trailing]) as T

    return [throttledCallback, isThrottled]
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string, enabled = import.meta.env.DEV) {
    const renderCountRef = useRef(0)
    const lastRenderTimeRef = useRef<number>(0)
    const renderTimesRef = useRef<number[]>([])

    useEffect(() => {
        if (!enabled) return

        const now = performance.now()
        renderCountRef.current += 1

        if (lastRenderTimeRef.current) {
            const renderTime = now - lastRenderTimeRef.current
            renderTimesRef.current.push(renderTime)

            // Keep only last 10 render times
            if (renderTimesRef.current.length > 10) {
                renderTimesRef.current.shift()
            }

            // Log slow renders
            if (renderTime > 16) { // 60fps threshold
                console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`, {
                    renderCount: renderCountRef.current,
                    averageRenderTime: renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length,
                })
            }
        }

        lastRenderTimeRef.current = now
    })

    return {
        renderCount: renderCountRef.current,
        averageRenderTime: renderTimesRef.current.length > 0
            ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
            : 0,
    }
}

// Hook for intersection observer with performance optimizations
export function useIntersectionObserver(
    options: IntersectionObserverInit = {},
    enabled = true
) {
    const [isIntersecting, setIsIntersecting] = useState(false)
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
    const elementRef = useRef<Element | null>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    const setElement = useCallback((element: Element | null) => {
        elementRef.current = element
    }, [])

    useEffect(() => {
        if (!enabled || !elementRef.current) return

        // Create observer with performance optimizations
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                setEntry(entry)
                setIsIntersecting(entry.isIntersecting)
            },
            {
                rootMargin: '50px', // Load content slightly before it's visible
                threshold: 0.1, // Trigger when 10% visible
                ...options,
            }
        )

        observerRef.current.observe(elementRef.current)

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [enabled, options])

    return {
        setElement,
        isIntersecting,
        entry,
    }
}

// Hook for virtual scrolling performance
export function useVirtualScrolling<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    overscan = 5
) {
    const [scrollTop, setScrollTop] = useState(0)

    const visibleRange = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
        const endIndex = Math.min(
            items.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        )

        return { startIndex, endIndex }
    }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
            item,
            index: visibleRange.startIndex + index,
            top: (visibleRange.startIndex + index) * itemHeight,
        }))
    }, [items, visibleRange, itemHeight])

    const totalHeight = items.length * itemHeight

    const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
        setScrollTop(event.currentTarget.scrollTop)
    }, [])

    return {
        visibleItems,
        totalHeight,
        handleScroll,
        visibleRange,
    }
}

// Hook for performance monitoring
export function usePerformanceMonitor(enabled = import.meta.env.DEV) {
    const metricsRef = useRef<{
        renderCount: number
        totalRenderTime: number
        slowRenders: number
        memoryUsage: number[]
    }>({
        renderCount: 0,
        totalRenderTime: 0,
        slowRenders: 0,
        memoryUsage: [],
    })

    useEffect(() => {
        if (!enabled) return

        const startTime = performance.now()

        return () => {
            const renderTime = performance.now() - startTime
            metricsRef.current.renderCount += 1
            metricsRef.current.totalRenderTime += renderTime

            if (renderTime > 16) {
                metricsRef.current.slowRenders += 1
            }

            // Track memory usage if available
            if ('memory' in performance) {
                const memory = (performance as any).memory
                metricsRef.current.memoryUsage.push(memory.usedJSHeapSize)

                // Keep only last 100 measurements
                if (metricsRef.current.memoryUsage.length > 100) {
                    metricsRef.current.memoryUsage.shift()
                }
            }
        }
    })

    const getMetrics = useCallback(() => {
        const metrics = metricsRef.current
        return {
            ...metrics,
            averageRenderTime: metrics.renderCount > 0 ? metrics.totalRenderTime / metrics.renderCount : 0,
            slowRenderPercentage: metrics.renderCount > 0 ? (metrics.slowRenders / metrics.renderCount) * 100 : 0,
            averageMemoryUsage: metrics.memoryUsage.length > 0
                ? metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length
                : 0,
        }
    }, [])

    return { getMetrics }
}