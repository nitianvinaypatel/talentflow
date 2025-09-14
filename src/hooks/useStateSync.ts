import { useEffect, useCallback } from 'react';
import { useAppStore } from '../lib/store';

export function useStateSync() {
    const store = useAppStore();

    // Load initial data from storage on mount
    useEffect(() => {
        store.loadFromStorage();
    }, []);

    // Sync with API periodically or on focus
    const syncWithAPI = useCallback(() => {
        store.syncWithAPI().catch((error) => {
            console.error('Failed to sync with API:', error);
        });
    }, [store]);

    // Auto-sync on window focus
    useEffect(() => {
        const handleFocus = () => {
            syncWithAPI();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [syncWithAPI]);

    // Auto-sync on network reconnection
    useEffect(() => {
        const handleOnline = () => {
            syncWithAPI();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [syncWithAPI]);

    return {
        syncWithAPI,
        isLoading: store.loading.sync || store.loading.loadFromStorage || false,
        error: store.errors.sync || store.errors.loadFromStorage,
        pendingUpdates: store.pendingUpdates,
    };
}

// Hook for monitoring connection status and pending updates
export function useOfflineStatus() {
    const store = useAppStore();
    const pendingUpdates = store.pendingUpdates;

    return {
        isOnline: navigator.onLine,
        hasPendingUpdates: pendingUpdates.length > 0,
        pendingUpdatesCount: pendingUpdates.length,
        pendingUpdates,
    };
}