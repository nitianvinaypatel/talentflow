import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { GripVertical, Edit2, Trash2, Check, X } from "lucide-react";
import type { AssessmentSection } from "../../../types";

interface SectionManagerProps {
  section: AssessmentSection;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<AssessmentSection>) => void;
  onDelete: () => void;
}

export const SectionManager: React.FC<SectionManagerProps> = ({
  section,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editDescription, setEditDescription] = useState(
    section.description || ""
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate({
      title: editTitle.trim() || "Untitled Section",
      description: editDescription.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(section.title);
    setEditDescription(section.description || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={{
        backgroundColor: isSelected ? "#0d1025" : "#000319",
        ...style,
      }}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border border-gray-100 ${
        isSelected
          ? "ring-2 ring-blue-100 ring-opacity-20 shadow-xl border-blue-100"
          : "hover:border-gray-600"
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={!isEditing ? onSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <button
            className={`mt-1.5 transition-colors ${
              isSelected
                ? "text-blue-400 hover:text-blue-300"
                : "text-gray-500 hover:text-gray-400"
            }`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Section title"
                  className="font-medium"
                  autoFocus
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Section description (optional)"
                  className="text-sm resize-none"
                  rows={2}
                />
              </div>
            ) : (
              <div>
                <h4
                  className={`font-medium text-sm leading-tight ${
                    isSelected ? "text-white" : "text-gray-300"
                  }`}
                >
                  {section.title}
                </h4>
                {section.description && (
                  <p
                    className={`text-xs mt-1 line-clamp-2 ${
                      isSelected ? "text-gray-300" : "text-gray-400"
                    }`}
                  >
                    {section.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="h-6 w-6 p-0"
                  data-testid="save-section-button"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="h-6 w-6 p-0"
                  data-testid="cancel-section-button"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="h-6 w-6 p-0"
                  data-testid="edit-section-button"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this section and all its questions?")) {
                      onDelete();
                    }
                  }}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  data-testid="delete-section-button"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={`text-xs ${
              isSelected
                ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                : "bg-gray-600/20 text-gray-300 border-gray-500/30"
            }`}
          >
            {section.questions.length} question
            {section.questions.length !== 1 ? "s" : ""}
          </Badge>
          {isSelected && (
            <Badge
              variant="default"
              className="text-xs bg-blue-600/20 text-blue-400 border-blue-500/30"
            >
              Selected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
