import * as React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
    errorId: string | null
    retryCount: number
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error: Error; retry: () => void; errorId: string }>
    level?: 'page' | 'component' | 'feature'
    onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private retryTimeouts: NodeJS.Timeout[] = []

    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        return {
            hasError: true,
            error,
            errorId,
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        this.setState({
            error,
            errorInfo,
            errorId,
        })

        // Log error with context
        const errorContext = {
            errorId,
            level: this.props.level || 'component',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            retryCount: this.state.retryCount,
        }

        console.error('ErrorBoundary caught an error:', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            errorInfo,
            context: errorContext,
        })

        // Call custom error handler
        this.props.onError?.(error, errorInfo, errorId)

        // In production, send to error reporting service
        if (import.meta.env.PROD) {
            this.reportError(error, errorInfo, errorContext)
        }

        // Auto-retry for transient errors (max 2 times)
        if (this.isTransientError(error) && this.state.retryCount < 2) {
            const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000)
            const timeout = setTimeout(() => {
                this.handleRetry(true)
            }, retryDelay)
            this.retryTimeouts.push(timeout)
        }
    }

    componentWillUnmount() {
        // Clear any pending retry timeouts
        this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    }

    private isTransientError(error: Error): boolean {
        const transientPatterns = [
            /network/i,
            /timeout/i,
            /fetch/i,
            /loading chunk \d+ failed/i,
            /dynamically imported module/i,
        ]
        return transientPatterns.some(pattern => pattern.test(error.message))
    }

    private async reportError(error: Error, errorInfo: React.ErrorInfo, context: any) {
        try {
            // In a real app, send to error reporting service like Sentry
            console.log('Would report error to service:', { error, errorInfo, context })
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError)
        }
    }

    handleRetry = (isAutoRetry = false) => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: isAutoRetry ? prevState.retryCount + 1 : 0,
        }))
    }

    render() {
        if (this.state.hasError) {
            const { fallback: Fallback, level = 'component' } = this.props

            if (Fallback && this.state.error && this.state.errorId) {
                return <Fallback error={this.state.error} retry={this.handleRetry} errorId={this.state.errorId} />
            }

            return (
                <DefaultErrorFallback
                    error={this.state.error}
                    retry={this.handleRetry}
                    level={level}
                    errorId={this.state.errorId}
                    retryCount={this.state.retryCount}
                />
            )
        }

        return this.props.children
    }
}

interface ErrorFallbackProps {
    error: Error | null
    retry: () => void
    level?: 'page' | 'component' | 'feature'
    errorId?: string | null
    retryCount?: number
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    retry,
    level = 'component',
    errorId,
    retryCount = 0
}) => {
    const getErrorSeverity = () => {
        if (level === 'page') return 'critical'
        if (level === 'feature') return 'high'
        return 'medium'
    }

    const getErrorMessage = () => {
        if (level === 'page') {
            return 'This page encountered an error and cannot be displayed.'
        }
        if (level === 'feature') {
            return 'This feature is temporarily unavailable due to an error.'
        }
        return 'A component failed to load properly.'
    }

    const getMinHeight = () => {
        if (level === 'page') return 'min-h-[60vh]'
        if (level === 'feature') return 'min-h-[300px]'
        return 'min-h-[200px]'
    }

    const severity = getErrorSeverity()
    const severityColors = {
        critical: 'bg-red-100 text-red-800',
        high: 'bg-orange-100 text-orange-800',
        medium: 'bg-yellow-100 text-yellow-800',
    }

    return (
        <div className={`flex items-center justify-center ${getMinHeight()} p-4`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CardTitle className="text-lg">Something went wrong</CardTitle>
                        <Badge className={severityColors[severity]} variant="secondary">
                            {severity}
                        </Badge>
                    </div>
                    <CardDescription>
                        {getErrorMessage()}
                    </CardDescription>
                    {retryCount > 0 && (
                        <div className="mt-2">
                            <Badge variant="outline">
                                Retry attempt: {retryCount}/2
                            </Badge>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {import.meta.env.DEV && error && (
                        <details className="rounded-md bg-gray-50 p-3 text-sm">
                            <summary className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
                                <Bug className="h-4 w-4" />
                                Error Details (Development)
                            </summary>
                            <div className="mt-2 space-y-2">
                                <div>
                                    <strong>Error ID:</strong> <code className="text-xs">{errorId}</code>
                                </div>
                                <div>
                                    <strong>Type:</strong> {error.name}
                                </div>
                                <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                    {error.message}
                                </pre>
                                {error.stack && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-xs font-medium">Stack Trace</summary>
                                        <pre className="mt-1 whitespace-pre-wrap text-xs text-gray-500 bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                                            {error.stack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </details>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button onClick={retry} className="flex-1" disabled={retryCount >= 2}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {retryCount >= 2 ? 'Max Retries Reached' : 'Try Again'}
                        </Button>
                        {level === 'page' && (
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                                className="flex-1"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="flex-1"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
    return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        console.error('Error caught by useErrorHandler:', {
            errorId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            errorInfo,
            timestamp: new Date().toISOString(),
        })

        // In a real app, you might want to show a toast notification
        // or send the error to a reporting service
        if (import.meta.env.PROD) {
            // Example: sendErrorToService(error, errorInfo, errorId)
        }

        return errorId
    }, [])
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ErrorBoundary level="page">{children}</ErrorBoundary>
)

export const FeatureErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ErrorBoundary level="feature">{children}</ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ErrorBoundary level="component">{children}</ErrorBoundary>
)