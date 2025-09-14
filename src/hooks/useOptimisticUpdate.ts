import { useState, useCallback } from 'react';
import { useAppStore } from '../lib/store';
import { useApiRetry } from './useRetry';

export interface UseOptimisticUpdateOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    showToast?: boolean;
}

export function useOptimisticUpdate<T>(
    updateFn: (data: T) => Promise<void>,
    options: UseOptimisticUpdateOptions = {}
) {
    const [error, setError] = useState<Error | null>(null);

    const retryHook = useApiRetry(updateFn, {
        onRetry: (error, attempt) => {
            console.warn(`Optimistic update retry ${attempt + 1}:`, error.message);
        },
        onMaxRetriesReached: (error) => {
            setError(error);
            options.onError?.(error);
        },
    });

    const execute = useCallback(
        async (data: T) => {
            setError(null);

            try {
                await retryHook.execute(data);
                options.onSuccess?.();
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                options.onError?.(error);
                throw error;
            }
        },
        [retryHook, options]
    );

    return {
        execute,
        isLoading: retryHook.state.isRetrying,
        error,
        retryState: retryHook.state,
        reset: () => {
            setError(null);
            retryHook.reset();
        },
        abort: retryHook.abort,
    };
}

// Specific hooks for each entity type
export function useJobActions() {
    const store = useAppStore();

    const createJob = useOptimisticUpdate(store.createJob);
    const updateJob = useOptimisticUpdate(
        (data: { id: string; updates: Parameters<typeof store.updateJob>[1] }) =>
            store.updateJob(data.id, data.updates)
    );
    const deleteJob = useOptimisticUpdate(store.deleteJob);
    const reorderJobs = useOptimisticUpdate(
        (data: { fromIndex: number; toIndex: number }) =>
            store.reorderJobs(data.fromIndex, data.toIndex)
    );

    return {
        createJob,
        updateJob,
        deleteJob,
        reorderJobs,
        loading: {
            create: store.loading.createJob || false,
            update: store.loading.updateJob || false,
            delete: store.loading.deleteJob || false,
            reorder: store.loading.reorderJobs || false,
        },
        errors: {
            create: store.errors.createJob,
            update: store.errors.updateJob,
            delete: store.errors.deleteJob,
            reorder: store.errors.reorderJobs,
        },
    };
}

export function useCandidateActions() {
    const store = useAppStore();

    const createCandidate = useOptimisticUpdate(store.createCandidate);
    const updateCandidate = useOptimisticUpdate(
        (data: { id: string; updates: Parameters<typeof store.updateCandidate>[1] }) =>
            store.updateCandidate(data.id, data.updates)
    );
    const deleteCandidate = useOptimisticUpdate(store.deleteCandidate);

    return {
        createCandidate,
        updateCandidate,
        deleteCandidate,
        loading: {
            create: store.loading.createCandidate || false,
            update: store.loading.updateCandidate || false,
            delete: store.loading.deleteCandidate || false,
        },
        errors: {
            create: store.errors.createCandidate,
            update: store.errors.updateCandidate,
            delete: store.errors.deleteCandidate,
        },
    };
}

export function useAssessmentActions() {
    const store = useAppStore();

    const createAssessment = useOptimisticUpdate(store.createAssessment);
    const updateAssessment = useOptimisticUpdate(
        (data: { id: string; updates: Parameters<typeof store.updateAssessment>[1] }) =>
            store.updateAssessment(data.id, data.updates)
    );
    const deleteAssessment = useOptimisticUpdate(store.deleteAssessment);

    return {
        createAssessment,
        updateAssessment,
        deleteAssessment,
        loading: {
            create: store.loading.createAssessment || false,
            update: store.loading.updateAssessment || false,
            delete: store.loading.deleteAssessment || false,
        },
        errors: {
            create: store.errors.createAssessment,
            update: store.errors.updateAssessment,
            delete: store.errors.deleteAssessment,
        },
    };
}