import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { KanbanCard } from "./kanban-card";
import type { Candidate } from "../../../types";

interface Stage {
  id: string;
  label: string;
  color: string;
  lightColor: string;
  darkColor: string;
}

interface KanbanColumnProps {
  stage: Stage;
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  isUpdating: string | null;
}

const DraggableCandidate = ({
  candidate,
  onCandidateClick,
  isUpdating,
}: {
  candidate: Candidate;
  onCandidateClick?: (candidate: Candidate) => void;
  isUpdating: string | null;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCard
        candidate={candidate}
        onClick={() => onCandidateClick?.(candidate)}
        isUpdating={isUpdating === candidate.id}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
};

export const KanbanColumn = ({
  stage,
  candidates,
  onCandidateClick,
  isUpdating,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="w-80 flex-shrink-0">
      <Card
        className={`h-full border-2 overflow-hidden transition-all duration-300 shadow-lg ${
          isOver
            ? "ring-2 ring-blue-500/50 border-blue-500/50 bg-blue-900/10 transform scale-[1.02]"
            : "border-gray-700/50 hover:border-gray-600/50"
        }`}
        style={{ backgroundColor: "#0d1025" }}
      >
        <CardHeader className="pb-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${
                  stage.color.includes("blue")
                    ? "bg-blue-500 shadow-blue-500/50"
                    : stage.color.includes("amber")
                    ? "bg-amber-500 shadow-amber-500/50"
                    : stage.color.includes("purple")
                    ? "bg-purple-500 shadow-purple-500/50"
                    : stage.color.includes("emerald")
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : stage.color.includes("green")
                    ? "bg-green-500 shadow-green-500/50"
                    : "bg-red-500 shadow-red-500/50"
                } ${isOver ? "scale-125 shadow-lg" : ""}`}
              ></div>
              <CardTitle className="text-lg font-semibold text-white">
                {stage.label}
              </CardTitle>
            </div>
            <Badge
              className={`${
                stage.color
              } transition-all duration-300 font-medium ${
                isOver ? "scale-110 shadow-md" : ""
              }`}
            >
              {candidates.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-4">
          <div
            ref={setNodeRef}
            className={`min-h-[500px] space-y-3 transition-all duration-300 ${
              isOver
                ? "bg-blue-900/5 rounded-lg p-2 border-2 border-dashed border-blue-500/30"
                : ""
            }`}
          >
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <div
                  className={`w-16 h-16 rounded-full ${
                    stage.darkColor
                  } border-2 border-gray-600 flex items-center justify-center mb-3 transition-all duration-300 ${
                    isOver ? "border-blue-500/50 bg-blue-600/10 scale-110" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                </div>
                <p className="text-sm font-medium">No candidates</p>
                <p className="text-xs text-gray-500">Drag candidates here</p>
              </div>
            ) : (
              candidates.map((candidate) => (
                <DraggableCandidate
                  key={candidate.id}
                  candidate={candidate}
                  onCandidateClick={onCandidateClick}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
