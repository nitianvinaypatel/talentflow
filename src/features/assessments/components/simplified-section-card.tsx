import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { AssessmentSection, Question } from "../../../types";

interface SimplifiedSectionCardProps {
  section: AssessmentSection;
  sectionNumber: number;
  onUpdate: (updates: Partial<AssessmentSection>) => void;
  onDelete: () => void;
  onAddQuestion: (questionData: Partial<Question>) => void;
  onUpdateQuestion: (questionId: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (questionId: string) => void;
}

export const SimplifiedSectionCard: React.FC<SimplifiedSectionCardProps> = ({
  section,
  sectionNumber,
  onUpdate,
  onDelete,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState(section.title);
  const [sectionDescription, setSectionDescription] = useState(
    section.description || ""
  );

  const handleSaveSection = () => {
    onUpdate({
      title: sectionTitle.trim() || `Section ${sectionNumber}`,
      description: sectionDescription.trim(),
    });
    setIsEditingSection(false);
  };

  const handleAddQuestion = () => {
    const newQuestion: Partial<Question> = {
      type: "short-text",
      title: "New Question",
      description: "",
      required: false,
      options: [],
      validation: [],
      conditionalLogic: [],
    };
    onAddQuestion(newQuestion);
  };

  return (
    <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 hover:from-indigo-50 hover:to-purple-50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              Section {sectionNumber}
            </Badge>
            {isEditingSection ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Section title"
                  className="font-medium"
                />
                <Textarea
                  value={sectionDescription}
                  onChange={(e) => setSectionDescription(e.target.value)}
                  placeholder="Section description (optional)"
                  rows={2}
                />
              </div>
            ) : (
              <div className="flex-1">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-slate-600 mt-1">
                    {section.description}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditingSection ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSaveSection}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSectionTitle(section.title);
                    setSectionDescription(section.description || "");
                    setIsEditingSection(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingSection(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDelete}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Questions */}
            {section.questions.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-slate-600 mb-3">
                  No questions in this section
                </p>
                <Button
                  onClick={handleAddQuestion}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {section.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question, index) => (
                    <div
                      key={question.id}
                      className="border rounded-lg p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {question.type.replace("-", " ")}
                            </Badge>
                            {question.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {editingQuestion === question.id ? (
                            <div className="space-y-2">
                              <Input
                                value={question.title}
                                onChange={(e) =>
                                  onUpdateQuestion(question.id, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Question title"
                              />
                              <Textarea
                                value={question.description || ""}
                                onChange={(e) =>
                                  onUpdateQuestion(question.id, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Question description (optional)"
                                rows={2}
                              />
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-medium text-slate-900">
                                {question.title}
                              </h4>
                              {question.description && (
                                <p className="text-sm text-slate-600 mt-1">
                                  {question.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {editingQuestion === question.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setEditingQuestion(null)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQuestion(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQuestion(question.id)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeleteQuestion(question.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                <Button
                  onClick={handleAddQuestion}
                  variant="outline"
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
