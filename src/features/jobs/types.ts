import { z } from 'zod';
import type { Job } from '../../types';

// Form validation schema
export const jobFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    slug: z.string().min(1, 'Slug is required').max(50, 'Slug must be less than 50 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
    location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
    type: z.enum(['full-time', 'part-time', 'contract'], {
        message: 'Job type is required',
    }),
    requirements: z.array(z.string().min(1, 'Requirement cannot be empty')).min(1, 'At least one requirement is needed'),
    tags: z.array(z.string().min(1, 'Tag cannot be empty')),
    status: z.enum(['active', 'archived']),
});

export type JobFormData = z.infer<typeof jobFormSchema>;

// Convert Job to JobFormData for editing
export function jobToFormData(job: Job): JobFormData {
    return {
        title: job.title,
        slug: job.slug,
        description: job.description,
        location: job.location,
        type: job.type,
        requirements: job.requirements,
        tags: job.tags,
        status: job.status,
    };
}

// Convert JobFormData to Job creation data
export function formDataToJob(formData: JobFormData): Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'order'> {
    return {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        requirements: formData.requirements,
        tags: formData.tags,
        status: formData.status,
    };
}