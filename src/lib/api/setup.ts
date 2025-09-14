import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Start the worker
export async function startMSW() {
    if (typeof window !== 'undefined') {
        await worker.start({
            onUnhandledRequest: 'warn',
            // Disable MSW devtools in production
            serviceWorker: {
                url: '/mockServiceWorker.js'
            }
        });
        console.log('🔶 MSW worker started');
        console.log('🔶 Available handlers:', handlers.length);
        // Only log handler patterns in development
        if (import.meta.env.DEV) {
            handlers.forEach((handler, index) => {
                console.log(`🔶 Handler ${index}:`, handler.info.method, handler.info.path);
            });
        }
    }
}