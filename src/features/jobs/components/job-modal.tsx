import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui";
import { Textarea } from "../../../components/ui/textarea";
import { useJobForm } from "../hooks/use-job-form";
import { jobToFormData, type JobFormData } from "../types";
import type { Job } from "../../../types";

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: JobFormData) => Promise<void>;
  job?: Job | null;
  title?: string;
  readOnly?: boolean;
}

export function JobModal({
  isOpen,
  onClose,
  onSubmit,
  job,
  title,
  readOnly = false,
}: JobModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { form, handleSubmit, handleTitleChange } = useJobForm({
    defaultValues: job ? jobToFormData(job) : undefined,
    onSubmit: readOnly
      ? undefined
      : async (data) => {
          if (!onSubmit) return;
          setIsSubmitting(true);
          setError(null);
          try {
            await onSubmit(data);
            onClose();
            form.reset();
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "An error occurred";
            setError(errorMessage);

            // Handle specific validation errors
            if (errorMessage.includes("Slug must be unique")) {
              form.setError("slug", {
                type: "manual",
                message:
                  "This slug is already taken. Please choose a different one.",
              });
            }
          } finally {
            setIsSubmitting(false);
          }
        },
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedRequirements = watch("requirements");
  const watchedTags = watch("tags");

  // Reset form when modal opens/closes or job changes
  useEffect(() => {
    if (isOpen) {
      if (job) {
        const formData = jobToFormData(job);
        Object.entries(formData).forEach(([key, value]) => {
          setValue(key as keyof JobFormData, value);
        });
      } else {
        form.reset();
      }
      setError(null);
    }
  }, [isOpen, job, form, setValue]);

  const addRequirement = () => {
    const current = watchedRequirements || [];
    setValue("requirements", [...current, ""]);
  };

  const removeRequirement = (index: number) => {
    const current = watchedRequirements || [];
    setValue(
      "requirements",
      current.filter((_, i) => i !== index)
    );
  };

  const updateRequirement = (index: number, value: string) => {
    const current = watchedRequirements || [];
    const updated = [...current];
    updated[index] = value;
    setValue("requirements", updated);
  };

  const addTag = (tagValue: string) => {
    if (!tagValue.trim()) return;
    const current = watchedTags || [];
    if (!current.includes(tagValue.trim())) {
      setValue("tags", [...current, tagValue.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const current = watchedTags || [];
    setValue(
      "tags",
      current.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700"
        style={{ backgroundColor: "#0d1025" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">
            {title || (job ? "Edit Job" : "Create New Job")}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {job
              ? "Update the job details below."
              : "Fill in the details to create a new job posting."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-600 text-red-300 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Job Title *
              </label>
              <Input
                id="title"
                {...register("title")}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className={errors.title ? "border-red-500" : ""}
                disabled={readOnly}
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="md:col-span-2">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                URL Slug *
              </label>
              <div className="space-y-2">
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder="e.g. senior-software-engineer"
                  className={errors.slug ? "border-red-500" : ""}
                  disabled={readOnly}
                />
                {watch("slug") && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded border">
                    <span className="font-medium">Preview URL:</span>{" "}
                    <code className="text-primary">/jobs/{watch("slug")}</code>
                  </div>
                )}
              </div>
              {errors.slug && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.slug.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                Used in the job URL. Will be auto-generated from title if left
                empty.
              </p>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Location *
              </label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g. San Francisco, CA"
                className={errors.location ? "border-red-500" : ""}
                disabled={readOnly}
              />
              {errors.location && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Job Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Job Type *
              </label>
              <Select
                value={watch("type")}
                onValueChange={(value) => {
                  setValue(
                    "type",
                    value as "full-time" | "part-time" | "contract"
                  );
                  register("type");
                }}
                disabled={readOnly}
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Status
              </label>
              <Select
                value={watch("status")}
                onValueChange={(value) => {
                  setValue("status", value as "active" | "archived");
                  register("status");
                }}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Job Description *
            </label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
              disabled={readOnly}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Requirements *
              </label>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRequirement}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Requirement
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {(watchedRequirements || [""]).map((requirement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={requirement}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                    className="flex-1"
                    disabled={readOnly}
                  />
                  {!readOnly &&
                    watchedRequirements &&
                    watchedRequirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              ))}
            </div>
            {errors.requirements && (
              <p className="text-red-400 text-sm mt-1">
                {errors.requirements.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Tags
            </label>
            {!readOnly && (
              <Input
                placeholder="Type a tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    addTag(input.value);
                    input.value = "";
                  }
                }}
              />
            )}
            {watchedTags && watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watchedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600 h-auto p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Saving..." : job ? "Update Job" : "Create Job"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
