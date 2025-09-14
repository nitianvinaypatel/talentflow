import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Archive, Trash2, Eye } from "lucide-react";
import { Button, Card, CardContent, Badge } from "../../../components/ui";
import type { Job } from "../../../types";

interface SortableJobItemProps {
  job: Job;
  onEdit: (job: Job) => void;
  onToggleStatus: (id: string, currentStatus: Job["status"]) => void;
  onDelete: (id: string) => void;
  onView: (job: Job) => void;
}

function SortableJobItem({
  job,
  onEdit,
  onToggleStatus,
  onDelete,
  onView,
}: SortableJobItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`transition-all duration-200 border border-gray-600 ${
          isDragging ? "shadow-lg" : "hover:shadow-md"
        }`}
        style={{ backgroundColor: "#000319" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-700 rounded"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white truncate">{job.title}</h3>
                <Badge
                  variant={job.status === "active" ? "default" : "secondary"}
                  className={
                    job.status === "active"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-600 text-gray-200 border-gray-600"
                  }
                >
                  {job.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-300 truncate">
                {job.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">{job.location}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{job.type}</span>
                {job.tags.length > 0 && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <div className="flex gap-1">
                      {job.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs bg-gray-800 border-gray-600 text-purple-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {job.tags.length > 2 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-gray-700 border-gray-600 text-gray-300"
                        >
                          +{job.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(job)}
                className="h-8 w-8 p-0 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(job)}
                className="h-8 w-8 p-0 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(job.id, job.status)}
                className="h-8 w-8 p-0 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(job.id)}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface JobReorderListProps {
  jobs: Job[];
  onReorder: (fromIndex: number, toIndex: number) => Promise<void>;
  onEdit: (job: Job) => void;
  onToggleStatus: (id: string, currentStatus: Job["status"]) => void;
  onDelete: (id: string) => void;
  onView: (job: Job) => void;
  isReordering?: boolean;
}

export function JobReorderList({
  jobs,
  onReorder,
  onEdit,
  onToggleStatus,
  onDelete,
  onView,
  isReordering = false,
}: JobReorderListProps) {
  const [localJobs, setLocalJobs] = useState(jobs);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local jobs when props change
  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localJobs.findIndex((job) => job.id === active.id);
      const newIndex = localJobs.findIndex((job) => job.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Optimistic update
        const newJobs = arrayMove(localJobs, oldIndex, newIndex);
        setLocalJobs(newJobs);

        try {
          await onReorder(oldIndex, newIndex);
        } catch (error) {
          // Rollback on error
          setLocalJobs(jobs);
          console.error("Failed to reorder jobs:", error);
        }
      }
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No jobs to display</p>
      </div>
    );
  }

  return (
    <div
      className={`transition-opacity duration-200 ${
        isReordering ? "opacity-50" : ""
      }`}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localJobs.map((job) => job.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localJobs.map((job) => (
              <SortableJobItem
                key={job.id}
                job={job}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {isDragging && (
        <div className="fixed inset-0 bg-black bg-opacity-10 pointer-events-none z-40" />
      )}
    </div>
  );
}
