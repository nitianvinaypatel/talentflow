import { useState, useCallback, useRef } from 'react'

export interface RetryOptions {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
    jitter?: boolean
    retryCondition?: (error: Error, attempt: number) => boolean
    onRetry?: (error: Error, attempt: number) => void
    onMaxRetriesReached?: (error: Error) => void
}

export interface RetryState {
    isRetrying: boolean
    attempt: number
    lastError: Error | null
    canRetry: boolean
}

const defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: () => true,
    onRetry: () => { },
    onMaxRetriesReached: () => { },
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
) {
    const opts = { ...defaultOptions, ...options }
    const [state, setState] = useState<RetryState>({
        isRetrying: false,
        attempt: 0,
        lastError: null,
        canRetry: true,
    })

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const calculateDelay = useCallback((attempt: number): number => {
        let delay = opts.baseDelay * Math.pow(opts.backoffFactor, attempt)

        if (opts.jitter) {
            // Add jitter to prevent thundering herd
            const jitterAmount = delay * 0.1
            delay += (Math.random() - 0.5) * 2 * jitterAmount
        }

        return Math.min(delay, opts.maxDelay)
    }, [opts.baseDelay, opts.backoffFactor, opts.maxDelay, opts.jitter])

    const executeWithRetry = useCallback(async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Create new abort controller for this execution
        abortControllerRef.current = new AbortController()

        let lastError: Error

        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                setState(prev => ({
                    ...prev,
                    isRetrying: attempt > 0,
                    attempt,
                    canRetry: attempt < opts.maxRetries,
                }))

                const result = await fn(...args)

                // Success - reset state
                setState({
                    isRetrying: false,
                    attempt: 0,
                    lastError: null,
                    canRetry: true,
                })

                return result
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error))

                setState(prev => ({
                    ...prev,
                    lastError,
                    canRetry: attempt < opts.maxRetries,
                }))

                // Check if we should retry this error
                if (!opts.retryCondition(lastError, attempt)) {
                    break
                }

                // Don't wait after the last attempt
                if (attempt < opts.maxRetries) {
                    opts.onRetry(lastError, attempt)

                    const delay = calculateDelay(attempt)

                    // Wait for delay or until aborted
                    await new Promise<void>((resolve, reject) => {
                        timeoutRef.current = setTimeout(resolve, delay)

                        abortControllerRef.current?.signal.addEventListener('abort', () => {
                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current)
                            }
                            reject(new Error('Retry aborted'))
                        })
                    })
                }
            }
        }

        // Max retries reached
        setState(prev => ({
            ...prev,
            isRetrying: false,
            canRetry: false,
        }))

        opts.onMaxRetriesReached(lastError!)
        throw lastError!
    }, [fn, opts, calculateDelay])

    const abort = useCallback(() => {
        abortControllerRef.current?.abort()
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setState(prev => ({
            ...prev,
            isRetrying: false,
        }))
    }, [])

    const reset = useCallback(() => {
        abort()
        setState({
            isRetrying: false,
            attempt: 0,
            lastError: null,
            canRetry: true,
        })
    }, [abort])

    return {
        execute: executeWithRetry,
        abort,
        reset,
        state,
    }
}

// Specialized retry hook for API calls
export function useApiRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
) {
    const defaultApiOptions: RetryOptions = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        retryCondition: (error: Error) => {
            // Don't retry client errors (4xx) except for specific cases
            if (error.message.includes('4')) {
                const is408 = error.message.includes('408') // Timeout
                const is429 = error.message.includes('429') // Rate limit
                return is408 || is429
            }

            // Retry server errors (5xx) and network errors
            return (
                error.message.includes('5') || // Server errors
                error.message.toLowerCase().includes('network') ||
                error.message.toLowerCase().includes('timeout') ||
                error.message.toLowerCase().includes('fetch')
            )
        },
        onRetry: (error: Error, attempt: number) => {
            console.warn(`API call failed (attempt ${attempt + 1}), retrying...`, {
                error: error.message,
                attempt: attempt + 1,
            })
        },
        onMaxRetriesReached: (error: Error) => {
            console.error('API call failed after all retry attempts:', error.message)
        },
        ...options,
    }

    return useRetry(fn, defaultApiOptions)
}

// Hook for retrying with exponential backoff and circuit breaker pattern
export function useCircuitBreakerRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions & {
        failureThreshold?: number
        recoveryTimeout?: number
    } = {}
) {
    const [circuitState, setCircuitState] = useState<'closed' | 'open' | 'half-open'>('closed')
    const [failureCount, setFailureCount] = useState(0)
    const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const {
        failureThreshold = 5,
        recoveryTimeout = 60000, // 1 minute
        ...retryOptions
    } = options

    const retryHook = useRetry(fn, {
        ...retryOptions,
        retryCondition: (error: Error, attempt: number) => {
            // Don't retry if circuit is open
            if (circuitState === 'open') {
                return false
            }

            return retryOptions.retryCondition?.(error, attempt) ?? true
        },
    })

    const executeWithCircuitBreaker = useCallback(async (...args: Parameters<T>) => {
        if (circuitState === 'open') {
            throw new Error('Circuit breaker is open - service temporarily unavailable')
        }

        try {
            const result = await retryHook.execute(...args)

            // Success - reset failure count and close circuit
            setFailureCount(0)
            setCircuitState('closed')

            return result
        } catch (error) {
            const newFailureCount = failureCount + 1
            setFailureCount(newFailureCount)

            // Open circuit if threshold reached
            if (newFailureCount >= failureThreshold) {
                setCircuitState('open')

                // Set recovery timeout
                if (recoveryTimeoutRef.current) {
                    clearTimeout(recoveryTimeoutRef.current)
                }

                recoveryTimeoutRef.current = setTimeout(() => {
                    setCircuitState('half-open')
                    setFailureCount(0)
                }, recoveryTimeout)
            }

            throw error
        }
    }, [circuitState, failureCount, failureThreshold, recoveryTimeout, retryHook])

    return {
        execute: executeWithCircuitBreaker,
        abort: retryHook.abort,
        reset: () => {
            retryHook.reset()
            setCircuitState('closed')
            setFailureCount(0)
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current)
            }
        },
        state: {
            ...retryHook.state,
            circuitState,
            failureCount,
        },
    }
}