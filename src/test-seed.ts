import { seedDatabase, shouldSeedDatabase, forceSeedDatabase, resetAndSeedDatabase } from './lib/db/seed';
import { DatabaseService } from './lib/db/operations';

// Extend window interface for development utilities
declare global {
    interface Window {
        talentflowDB?: {
            seed: () => Promise<void>;
            forceSeed: () => Promise<void>;
            resetAndSeed: () => Promise<void>;
            checkNeedsSeeding: () => Promise<boolean>;
            getStats: () => Promise<{
                jobsCount: number;
                candidatesCount: number;
                assessmentsCount: number;
                timelineEventsCount: number;
                responsesCount: number;
            }>;
            clearAll: () => Promise<void>;
            clearSeedFlag: () => void;
            clearInProgressFlag: () => void;
            removeDuplicates: () => Promise<void>;
        };
    }
}

// Initialize test data for development
async function initializeTestData() {
    try {
        console.log('Checking if database needs seeding...');
        
        // Check localStorage flag as an additional check
        const lastSeeded = localStorage.getItem('talentflow-last-seeded');
        const seedingInProgress = localStorage.getItem('talentflow-seeding-in-progress');
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // If seeding is already in progress, skip
        if (seedingInProgress) {
            console.log('Seeding already in progress. Skipping.');
            return;
        }
        
        // If we seeded within the last day and the flag exists, skip database check
        if (lastSeeded && (now - parseInt(lastSeeded)) < oneDayMs) {
            console.log('Database was recently seeded. Skipping seed check.');
            return;
        }
        
        // Set flag to prevent concurrent seeding
        localStorage.setItem('talentflow-seeding-in-progress', 'true');
        
        try {
            const needsSeeding = await shouldSeedDatabase();
            
            if (needsSeeding) {
                console.log('Database is empty or incomplete. Seeding with test data...');
                await seedDatabase();
                
                // Set flag to indicate successful seeding
                localStorage.setItem('talentflow-last-seeded', now.toString());
                console.log('Test data seeded successfully!');
            } else {
                console.log('Database already contains sufficient data. Skipping seeding.');
                // Update the timestamp to avoid unnecessary checks
                localStorage.setItem('talentflow-last-seeded', now.toString());
            }
        } finally {
            // Always clear the in-progress flag
            localStorage.removeItem('talentflow-seeding-in-progress');
        }
    } catch (error) {
        console.error('Failed to initialize test data:', error);
        // Clear the flags on error so we retry next time
        localStorage.removeItem('talentflow-last-seeded');
        localStorage.removeItem('talentflow-seeding-in-progress');
    }
}

// Expose utility functions globally for development/debugging
if (import.meta.env.DEV) {
    // Make these available in the browser console for debugging
    window.talentflowDB = {
        seed: seedDatabase,
        forceSeed: forceSeedDatabase,
        resetAndSeed: resetAndSeedDatabase,
        checkNeedsSeeding: shouldSeedDatabase,
        getStats: () => DatabaseService.getStats(),
        clearAll: () => DatabaseService.clearAll(),
        clearSeedFlag: () => localStorage.removeItem('talentflow-last-seeded'),
        clearInProgressFlag: () => localStorage.removeItem('talentflow-seeding-in-progress'),
        removeDuplicates: async () => {
            console.log('Removing duplicate jobs...');
            const db = (await import('./lib/db')).db;
            
            // Get all jobs
            const allJobs = await db.jobs.toArray();
            
            // Group by title and remove duplicates, keeping the first one
            const seen = new Set();
            const duplicateIds = [];
            
            for (const job of allJobs) {
                if (seen.has(job.title)) {
                    duplicateIds.push(job.id);
                } else {
                    seen.add(job.title);
                }
            }
            
            if (duplicateIds.length > 0) {
                console.log(`Removing ${duplicateIds.length} duplicate jobs`);
                await db.jobs.bulkDelete(duplicateIds);
                
                // Also remove candidates and assessments for the deleted jobs
                const candidatesToDelete = await db.candidates
                    .where('jobId')
                    .anyOf(duplicateIds)
                    .toArray();
                
                const assessmentsToDelete = await db.assessments
                    .where('jobId')
                    .anyOf(duplicateIds)
                    .toArray();
                
                if (candidatesToDelete.length > 0) {
                    await db.candidates.bulkDelete(candidatesToDelete.map(c => c.id));
                    console.log(`Removed ${candidatesToDelete.length} candidates for duplicate jobs`);
                }
                
                if (assessmentsToDelete.length > 0) {
                    await db.assessments.bulkDelete(assessmentsToDelete.map(a => a.id));
                    console.log(`Removed ${assessmentsToDelete.length} assessments for duplicate jobs`);
                }
                
                console.log('Duplicate removal completed');
            } else {
                console.log('No duplicates found');
            }
        }
    };
    
    console.log('TalentFlow DB utilities available at window.talentflowDB');
    initializeTestData();
}