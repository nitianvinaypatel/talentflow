import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import type { Candidate } from "../../../types";

interface DragOverlayCardProps {
  candidate: Candidate;
}

export const DragOverlayCard = ({ candidate }: DragOverlayCardProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card
      className="w-80 cursor-grabbing shadow-2xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm rotate-2 scale-105"
      style={{ backgroundColor: "#000319" }}
    >
      <CardContent className="p-4 relative">
        {/* Drag handle - always visible during drag */}
        <div className="absolute top-2 right-2">
          <div className="p-1 rounded bg-blue-600/30 border border-blue-500/50">
            <GripVertical className="h-4 w-4 text-blue-300" />
          </div>
        </div>

        {/* Header with avatar */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-600/40 border-2 border-blue-500/50 flex items-center justify-center text-blue-300 font-semibold text-sm shadow-lg">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">
                {candidate.name}
              </h4>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-200">
            <div className="p-1 rounded-full bg-blue-600/30 border border-blue-500/50">
              <Mail className="h-3 w-3 text-blue-300" />
            </div>
            <span className="truncate font-medium">{candidate.email}</span>
          </div>

          {candidate.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-200">
              <div className="p-1 rounded-full bg-green-600/30 border border-green-500/50">
                <Phone className="h-3 w-3 text-green-300" />
              </div>
              <span className="font-medium">{candidate.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-200">
            <div className="p-1 rounded-full bg-purple-600/30 border border-purple-500/50">
              <Calendar className="h-3 w-3 text-purple-300" />
            </div>
            <span className="font-medium">
              Applied {formatDate(candidate.appliedAt)}
            </span>
          </div>
        </div>

        {/* Notes and assessments */}
        <div className="space-y-2">
          {candidate.notes.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-amber-600/30 border border-amber-500/50">
                <MessageSquare className="h-3 w-3 text-amber-300" />
              </div>
              <span className="text-xs text-gray-200 font-medium">
                {candidate.notes.length} note
                {candidate.notes.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {candidate.assessmentResponses.length > 0 && (
            <Badge className="text-xs bg-indigo-600/30 text-indigo-300 border-indigo-500/50">
              {candidate.assessmentResponses.length} assessment
              {candidate.assessmentResponses.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
