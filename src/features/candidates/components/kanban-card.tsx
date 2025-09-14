import { forwardRef } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  LoaderCircle,
  GripVertical,
} from "lucide-react";
import type { Candidate } from "../../../types";

interface KanbanCardProps {
  candidate: Candidate;
  onClick: () => void;
  isDragging?: boolean;
  isUpdating?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap | undefined;
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  (
    {
      candidate,
      onClick,
      isDragging = false,
      isUpdating = false,
      dragAttributes,
      dragListeners,
    },
    ref
  ) => {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(date));
    };

    const handleCardClick = (e: React.MouseEvent) => {
      // Prevent click when dragging or if click originated from drag handle
      if (
        isDragging ||
        (e.target as HTMLElement).closest("[data-drag-handle]")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick();
    };

    return (
      <div ref={ref} {...dragAttributes}>
        <Card
          className={`
          group cursor-pointer transition-all duration-300 hover:shadow-xl border border-gray-600
          ${
            isDragging
              ? "opacity-30"
              : "hover:scale-[1.02] hover:border-blue-500/50"
          }
          ${isUpdating ? "opacity-75" : ""}
        `}
          style={{ backgroundColor: "#000319" }}
          onClick={handleCardClick}
        >
          <CardContent className="p-4 relative">
            {/* Drag handle */}
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
              data-drag-handle
              {...dragListeners}
            >
              <div className="p-1.5 rounded-md hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-colors duration-200">
                <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-200" />
              </div>
            </div>

            {/* Header with avatar and updating indicator */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-sm shadow-lg">
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-200">
                    {candidate.name}
                  </h4>
                </div>
              </div>
              {isUpdating && (
                <div className="p-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 shadow-lg">
                  <LoaderCircle className="h-4 w-4 text-blue-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Contact info with improved styling */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="p-1 rounded-full bg-blue-600/30 border border-blue-500/30 shadow-sm">
                  <Mail className="h-3 w-3 text-blue-400" />
                </div>
                <span className="truncate font-medium">{candidate.email}</span>
              </div>

              {candidate.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <div className="p-1 rounded-full bg-green-600/30 border border-green-500/30 shadow-sm">
                    <Phone className="h-3 w-3 text-green-400" />
                  </div>
                  <span className="font-medium">{candidate.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="p-1 rounded-full bg-purple-600/30 border border-purple-500/30 shadow-sm">
                  <Calendar className="h-3 w-3 text-purple-400" />
                </div>
                <span className="font-medium">
                  Applied {formatDate(candidate.appliedAt)}
                </span>
              </div>
            </div>

            {/* Notes and assessments with improved styling */}
            <div className="space-y-2">
              {candidate.notes.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-amber-600/30 border border-amber-500/30 shadow-sm">
                    <MessageSquare className="h-3 w-3 text-amber-400" />
                  </div>
                  <span className="text-xs text-gray-300 font-medium">
                    {candidate.notes.length} note
                    {candidate.notes.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {candidate.assessmentResponses.length > 0 && (
                <Badge className="text-xs bg-indigo-600/30 text-indigo-400 border-indigo-500/30 shadow-sm">
                  {candidate.assessmentResponses.length} assessment
                  {candidate.assessmentResponses.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
