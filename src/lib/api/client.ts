// API client for TalentFlow application with retry mechanisms and error handling

interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryCondition?: (error: Error) => boolean;
}

interface ApiClientOptions {
    baseURL?: string;
    timeout?: number;
    retryOptions?: RetryOptions;
    enableMetrics?: boolean;
    onRequestStart?: (url: string, options: RequestInit) => void;
    onRequestEnd?: (url: string, duration: number, success: boolean) => void;
}

class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

class ApiClient {
    private baseURL: string;
    private timeout: number;
    private retryOptions: RetryOptions;
    private enableMetrics: boolean;
    private onRequestStart?: (url: string, options: RequestInit) => void;
    private onRequestEnd?: (url: string, duration: number, success: boolean) => void;
    private metrics: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        totalDuration: number;
        retryCount: number;
    };

    constructor(options: ApiClientOptions = {}) {
        this.baseURL = options.baseURL || '';
        this.timeout = options.timeout || 30000; // 30 seconds
        this.enableMetrics = options.enableMetrics ?? true; // Enable metrics in production
        this.onRequestStart = options.onRequestStart;
        this.onRequestEnd = options.onRequestEnd;

        this.retryOptions = {
            maxRetries: 3,
            baseDelay: 1000, // 1 second
            maxDelay: 10000, // 10 seconds
            retryCondition: (error: Error) => {
                // Retry on network errors and 5xx server errors
                if (error instanceof ApiError) {
                    return error.status >= 500 || error.status === 0 || error.status === 408 || error.status === 429;
                }
                // Retry on network/timeout errors
                const retryablePatterns = [
                    /network/i,
                    /timeout/i,
                    /fetch/i,
                    /connection/i,
                    /aborted/i
                ];
                return retryablePatterns.some(pattern => pattern.test(error.message));
            },
            ...options.retryOptions,
        };

        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalDuration: 0,
            retryCount: 0,
        };
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private calculateDelay(attempt: number): number {
        // Exponential backoff with full jitter
        const exponentialDelay = this.retryOptions.baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * exponentialDelay; // Full jitter instead of 10%
        return Math.min(jitter, this.retryOptions.maxDelay);
    }

    private async requestWithTimeout(
        url: string,
        config: RequestInit
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = performance.now();

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.enableMetrics) {
            this.metrics.totalRequests++;
        }

        this.onRequestStart?.(url, config);

        let lastError: Error = new Error('Unknown error');
        let isRetry = false;

        for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
            try {
                if (isRetry && this.enableMetrics) {
                    this.metrics.retryCount++;
                }

                const response = await this.requestWithTimeout(url, config);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const apiError = new ApiError(
                        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                        response.status,
                        errorData.code,
                        errorData.details
                    );

                    // Don't retry client errors (4xx) except for specific cases
                    if (response.status >= 400 && response.status < 500 &&
                        response.status !== 408 && response.status !== 429) {
                        throw apiError;
                    }

                    lastError = apiError;
                } else {
                    const data = await response.json().catch(() => ({}));

                    // Success metrics
                    if (this.enableMetrics) {
                        this.metrics.successfulRequests++;
                        const duration = performance.now() - startTime;
                        this.metrics.totalDuration += duration;
                        this.onRequestEnd?.(url, duration, true);
                    }

                    return data;
                }
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                // Don't retry if it's not a retryable error
                if (!this.retryOptions.retryCondition?.(lastError)) {
                    break;
                }
            }

            // Don't wait after the last attempt
            if (attempt < this.retryOptions.maxRetries) {
                isRetry = true;
                const delay = this.calculateDelay(attempt);

                if (import.meta.env.DEV) {
                    console.warn(
                        `API request failed (attempt ${attempt + 1}/${this.retryOptions.maxRetries + 1}). ` +
                        `Retrying in ${Math.round(delay)}ms...`,
                        {
                            url,
                            method: config.method || 'GET',
                            error: lastError.message,
                            attempt: attempt + 1,
                            maxRetries: this.retryOptions.maxRetries + 1
                        }
                    );
                }

                await this.sleep(delay);
            }
        }

        // Failure metrics
        if (this.enableMetrics) {
            this.metrics.failedRequests++;
            const duration = performance.now() - startTime;
            this.metrics.totalDuration += duration;
            this.onRequestEnd?.(url, duration, false);
        }

        console.error(`API request failed after ${this.retryOptions.maxRetries + 1} attempts:`, {
            url,
            method: config.method || 'GET',
            error: lastError.message,
            totalAttempts: this.retryOptions.maxRetries + 1,
            finalError: {
                name: lastError.name,
                message: lastError.message,
                ...(lastError instanceof ApiError && {
                    status: lastError.status,
                    code: lastError.code
                })
            }
        });

        throw lastError;
    }

    // GET request
    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const url = params
            ? `${endpoint}?${new URLSearchParams(params).toString()}`
            : endpoint;

        return this.request<T>(url, { method: 'GET' });
    }

    // POST request
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PATCH request
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PUT request
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // DELETE request
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Utility method to check if an error is retryable
    isRetryableError(error: Error): boolean {
        return this.retryOptions.retryCondition?.(error) ?? false;
    }

    // Method to configure retry options
    setRetryOptions(options: Partial<RetryOptions>): void {
        this.retryOptions = { ...this.retryOptions, ...options };
    }

    // Get performance metrics
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.totalRequests > 0
                ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
                : 0,
            averageRequestDuration: this.metrics.totalRequests > 0
                ? this.metrics.totalDuration / this.metrics.totalRequests
                : 0,
            retryRate: this.metrics.totalRequests > 0
                ? (this.metrics.retryCount / this.metrics.totalRequests) * 100
                : 0,
        };
    }

    // Reset metrics
    resetMetrics(): void {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalDuration: 0,
            retryCount: 0,
        };
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        try {
            await this.get('/api/health');
            return true;
        } catch {
            return false;
        }
    }
}

// Export both the class and a default instance
export { ApiClient, ApiError };
export const apiClient = new ApiClient();

// Convenience methods for common operations
export const api = {
    // Jobs API
    jobs: {
        list: (params?: Record<string, string>) => apiClient.get('/api/jobs', params),
        get: (id: string) => apiClient.get(`/api/jobs/${id}`),
        create: (data: any) => apiClient.post('/api/jobs', data),
        update: (id: string, data: any) => apiClient.patch(`/api/jobs/${id}`, data),
        delete: (id: string) => apiClient.delete(`/api/jobs/${id}`),
        reorder: (fromIndex: number, toIndex: number) => apiClient.patch('/api/jobs/reorder', { fromIndex, toIndex }),
    },

    // Candidates API
    candidates: {
        list: (params?: Record<string, string>) => apiClient.get('/api/candidates', params),
        get: (id: string) => apiClient.get(`/api/candidates/${id}`),
        create: (data: any) => apiClient.post('/api/candidates', data),
        update: (id: string, data: any) => apiClient.patch(`/api/candidates/${id}`, data),
        delete: (id: string) => apiClient.delete(`/api/candidates/${id}`),
        addNote: (id: string, note: any) => apiClient.post(`/api/candidates/${id}/notes`, note),
        getTimeline: (id: string) => apiClient.get(`/api/candidates/${id}/timeline`),
    },

    // Assessments API
    assessments: {
        list: (params?: Record<string, string>) => apiClient.get('/api/assessments', params),
        get: (id: string) => apiClient.get(`/api/assessments/${id}`),
        create: (data: any) => apiClient.post('/api/assessments', data),
        update: (id: string, data: any) => apiClient.put(`/api/assessments/${id}`, data),
        delete: (id: string) => apiClient.delete(`/api/assessments/${id}`),
    },

    // Assessment Responses API
    assessmentResponses: {
        list: (params?: Record<string, string>) => apiClient.get('/api/assessment-responses', params),
        create: (data: any) => apiClient.post('/api/assessment-responses', data),
        update: (id: string, data: any) => apiClient.patch(`/api/assessment-responses/${id}`, data),
    },
};