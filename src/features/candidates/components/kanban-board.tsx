import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { Users } from "lucide-react";
import { useAppStore } from "../../../lib/store";
import { KanbanColumn } from "./kanban-column";
import { DragOverlayCard } from "./drag-overlay-card";
import type { Candidate } from "../../../types";

const HIRING_STAGES = [
  {
    id: "applied",
    label: "Applied",
    color: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    lightColor: "bg-blue-600/10",
    darkColor: "bg-blue-600/20",
  },
  {
    id: "screen",
    label: "Phone Screen",
    color: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    lightColor: "bg-amber-600/10",
    darkColor: "bg-amber-600/20",
  },
  {
    id: "tech",
    label: "Technical Interview",
    color: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    lightColor: "bg-purple-600/10",
    darkColor: "bg-purple-600/20",
  },
  {
    id: "offer",
    label: "Offer",
    color: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
    lightColor: "bg-emerald-600/10",
    darkColor: "bg-emerald-600/20",
  },
  {
    id: "hired",
    label: "Hired",
    color: "bg-green-600/20 text-green-400 border-green-500/30",
    lightColor: "bg-green-600/10",
    darkColor: "bg-green-600/20",
  },
  {
    id: "rejected",
    label: "Rejected",
    color: "bg-red-600/20 text-red-400 border-red-500/30",
    lightColor: "bg-red-600/10",
    darkColor: "bg-red-600/20",
  },
] as const;

interface KanbanBoardProps {
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
}

export const KanbanBoard = ({
  candidates,
  onCandidateClick,
}: KanbanBoardProps) => {
  const { updateCandidate } = useAppStore();
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group candidates by stage
  const candidatesByStage = useMemo(() => {
    const grouped = HIRING_STAGES.reduce((acc, stage) => {
      acc[stage.id] = candidates.filter(
        (candidate) => candidate.stage === stage.id
      );
      return acc;
    }, {} as Record<string, Candidate[]>);
    return grouped;
  }, [candidates]);

  // Get all candidate IDs for the SortableContext
  const candidateIds = useMemo(
    () => candidates.map((candidate) => candidate.id),
    [candidates]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const candidate = candidates.find((c) => c.id === active.id);
    setActiveCandidate(candidate || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback during drag - could add more sophisticated logic here
    if (event.over) {
      // Could add visual indicators here
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as Candidate["stage"];

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.stage === newStage) return;

    // Optimistic update with improved error handling
    setIsUpdating(candidateId);

    try {
      await updateCandidate(candidateId, { stage: newStage });
    } catch (error) {
      console.error("Failed to update candidate stage:", error);
      // The store's optimistic update will handle rollback
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
      <div className="p-6 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 shadow-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Hiring Pipeline</h2>
            <p className="text-gray-400">
              Drag candidates between stages to update their status
            </p>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={candidateIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-6 min-w-max pb-4">
              {HIRING_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  candidates={candidatesByStage[stage.id] || []}
                  onCandidateClick={onCandidateClick}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCandidate ? (
            <DragOverlayCard candidate={activeCandidate} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
