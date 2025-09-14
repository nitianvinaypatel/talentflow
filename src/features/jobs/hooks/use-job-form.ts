import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobFormSchema, type JobFormData } from '../types';

interface UseJobFormOptions {
    defaultValues?: Partial<JobFormData>;
    onSubmit?: (data: JobFormData) => Promise<void>;
}

export function useJobForm({ defaultValues, onSubmit }: UseJobFormOptions) {
    const form = useForm<JobFormData>({
        resolver: zodResolver(jobFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            location: '',
            type: 'full-time',
            requirements: [''],
            tags: [],
            status: 'active',
            ...defaultValues,
        },
    });

    const handleSubmit = form.handleSubmit(async (data) => {
        if (!onSubmit) return;
        
        // Filter out empty requirements and ensure proper structure
        const cleanedData: JobFormData = {
            title: data.title,
            slug: data.slug,
            description: data.description,
            location: data.location,
            type: data.type,
            requirements: data.requirements.filter((req: string) => req.trim() !== ''),
            tags: data.tags?.filter((tag: string) => tag.trim() !== '') || [],
            status: data.status || 'active',
        };

        await onSubmit(cleanedData);
    });

    // Auto-generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    };

    const handleTitleChange = (title: string) => {
        // Get current values before updating
        const currentSlug = form.getValues('slug');
        const currentTitle = form.getValues('title');
        const expectedSlug = generateSlug(currentTitle);

        // Update title
        form.setValue('title', title);

        // Auto-generate slug if it's empty or matches the previous auto-generated slug
        if (!currentSlug || currentSlug === expectedSlug) {
            form.setValue('slug', generateSlug(title));
        }
    };

    return {
        form,
        handleSubmit,
        generateSlug,
        handleTitleChange,
        isSubmitting: form.formState.isSubmitting,
        errors: form.formState.errors,
    };
}