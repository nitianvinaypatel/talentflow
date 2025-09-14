import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import {
  DndContext,
  closestCorners,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import { Plus, Save, Eye, EyeOff, FileText, ArrowLeft } from "lucide-react";
import { useAppStore } from "../../../lib/store";
import { SectionManager } from "./section-manager";
import { QuestionEditor } from "./question-editor";
import { AssessmentPreviewPane } from "./assessment-preview-pane";
import type { Assessment, AssessmentSection, Question } from "../../../types";

interface AssessmentBuilderProps {
  jobId?: string; // Made optional to support standalone assessments
  assessmentId?: string;
}

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({
  jobId,
  assessmentId,
}) => {
  const navigate = useNavigate();
  const {
    assessments,
    assessmentBuilder,
    setCurrentAssessment,
    setAssessmentBuilder,
    createAssessment,
    updateAssessment,
    setLoading,
    setError,
  } = useAppStore();

  const [localAssessment, setLocalAssessment] = useState<Assessment | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize assessment
  useEffect(() => {
    if (assessmentId) {
      const existingAssessment = (assessments || []).find(
        (a) => a.id === assessmentId
      );
      if (existingAssessment) {
        setLocalAssessment(existingAssessment);
        setCurrentAssessment(existingAssessment);
        setAssessmentBuilder({
          currentAssessment: existingAssessment,
          selectedSection: existingAssessment.sections[0]?.id || null,
          selectedQuestion: null,
          previewMode: false,
        });
      }
    } else {
      // Create new assessment
      const newAssessment: Assessment = {
        id: nanoid(),
        jobId, // This will be undefined for standalone assessments
        title: "New Assessment",
        description: "",
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setLocalAssessment(newAssessment);
      setCurrentAssessment(newAssessment);
      setAssessmentBuilder({
        currentAssessment: newAssessment,
        selectedSection: null,
        selectedQuestion: null,
        previewMode: false,
      });
    }
  }, [
    assessmentId,
    assessments,
    jobId,
    setCurrentAssessment,
    setAssessmentBuilder,
  ]);

  const handleAssessmentChange = (
    field: keyof Assessment,
    value: Assessment[keyof Assessment]
  ) => {
    if (!localAssessment) return;

    const updatedAssessment = {
      ...localAssessment,
      [field]: value,
      updatedAt: new Date(),
    };

    setLocalAssessment(updatedAssessment);
    setCurrentAssessment(updatedAssessment);
    setAssessmentBuilder({
      currentAssessment: updatedAssessment,
    });
    setHasUnsavedChanges(true);
  };

  const handleSectionReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !localAssessment) return;

    const oldIndex = localAssessment.sections.findIndex(
      (s) => s.id === active.id
    );
    const newIndex = localAssessment.sections.findIndex(
      (s) => s.id === over.id
    );

    if (oldIndex !== newIndex) {
      const reorderedSections = arrayMove(
        localAssessment.sections,
        oldIndex,
        newIndex
      ).map((section, index) => ({
        ...section,
        order: index,
      }));

      handleAssessmentChange("sections", reorderedSections);
    }
  };

  const addSection = () => {
    if (!localAssessment) return;

    const newSection: AssessmentSection = {
      id: nanoid(),
      title: `Section ${localAssessment.sections.length + 1}`,
      description: "",
      questions: [],
      order: localAssessment.sections.length,
    };

    const updatedSections = [...localAssessment.sections, newSection];
    handleAssessmentChange("sections", updatedSections);

    setAssessmentBuilder({
      selectedSection: newSection.id,
    });
  };

  const updateSection = (
    sectionId: string,
    updates: Partial<AssessmentSection>
  ) => {
    if (!localAssessment) return;

    const updatedSections = localAssessment.sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    );

    handleAssessmentChange("sections", updatedSections);
  };

  const deleteSection = (sectionId: string) => {
    if (!localAssessment) return;

    const updatedSections = localAssessment.sections
      .filter((section) => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));

    handleAssessmentChange("sections", updatedSections);

    // Update selected section if deleted
    if (assessmentBuilder.selectedSection === sectionId) {
      setAssessmentBuilder({
        selectedSection: updatedSections[0]?.id || null,
        selectedQuestion: null,
      });
    }
  };

  const saveAssessment = async () => {
    if (!localAssessment) return;

    try {
      setLoading("saveAssessment", true);
      setError("saveAssessment", null);

      if (assessmentId) {
        await updateAssessment(localAssessment.id, localAssessment);
      } else {
        await createAssessment(localAssessment);
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save assessment:", error);
    } finally {
      setLoading("saveAssessment", false);
    }
  };

  const togglePreview = () => {
    setAssessmentBuilder({
      previewMode: !assessmentBuilder.previewMode,
    });
  };

  if (!localAssessment) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ backgroundColor: "#000319" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "#000319" }}
    >
      {/* Enhanced Header */}
      <div
        className="border-b border-gray-700 p-6 shadow-sm"
        style={{ backgroundColor: "#0d1025" }}
      >
        <div className="flex items-center justify-between">
          {/* Back Button and Title Section */}
          <div className="flex items-start gap-4 flex-1 max-w-3xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/assessments")}
              className="mt-2 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-200 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {!assessmentId ? "Cancel Creation" : "Back to Assessments"}
            </Button>
            <div className="flex-1">
              {!assessmentId}
              <Input
                value={localAssessment.title}
                onChange={(e) =>
                  handleAssessmentChange("title", e.target.value)
                }
                className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-gray-500 text-white"
                placeholder={
                  !assessmentId
                    ? "Enter assessment title..."
                    : "Assessment Title"
                }
              />
              <Textarea
                value={localAssessment.description}
                onChange={(e) =>
                  handleAssessmentChange("description", e.target.value)
                }
                className="mt-3 border-none p-0 resize-none focus-visible:ring-0 bg-transparent placeholder:text-gray-500 text-gray-300"
                placeholder={
                  !assessmentId
                    ? "Describe what this assessment will evaluate..."
                    : "Add a description to help candidates understand this assessment..."
                }
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Badge
                variant="outline"
                className="text-amber-300 border-amber-600 bg-amber-900 animate-pulse"
              >
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-blue-300 transition-all duration-200"
            >
              {assessmentBuilder.previewMode ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
            <Button
              onClick={saveAssessment}
              disabled={!hasUnsavedChanges}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 flex items-center text-sm text-gray-400">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                {localAssessment.sections.length} section
                {localAssessment.sections.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                {localAssessment.sections.reduce(
                  (total, section) => total + section.questions.length,
                  0
                )}{" "}
                questions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                ~
                {localAssessment.sections.reduce(
                  (total, section) => total + section.questions.length,
                  0
                ) * 2}{" "}
                min duration
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {assessmentBuilder.previewMode ? (
          <div
            className="w-full overflow-y-auto"
            style={{ backgroundColor: "#0d1025" }}
          >
            <div className="max-w-4xl mx-auto p-8">
              <AssessmentPreviewPane
                assessment={localAssessment}
                responses={{}}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Sections Panel */}
            <div
              className="w-1/3 border-r border-gray-700 overflow-y-auto"
              style={{ backgroundColor: "#0d1025" }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Assessment Sections
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSection}
                    className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-800/30 hover:border-blue-400 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragEnd={handleSectionReorder}
                >
                  <SortableContext
                    items={localAssessment.sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localAssessment.sections.map((section) => (
                        <SectionManager
                          key={section.id}
                          section={section}
                          isSelected={
                            assessmentBuilder.selectedSection === section.id
                          }
                          onSelect={() =>
                            setAssessmentBuilder({
                              selectedSection: section.id,
                              selectedQuestion: null,
                            })
                          }
                          onUpdate={(updates) =>
                            updateSection(section.id, updates)
                          }
                          onDelete={() => deleteSection(section.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {localAssessment.sections.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">
                      No sections yet
                    </h4>
                    <p className="text-gray-400 mb-4">
                      Create your first section to start building your
                      assessment
                    </p>
                    <Button
                      onClick={addSection}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Section
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Questions Panel */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ backgroundColor: "#000319" }}
            >
              {assessmentBuilder.selectedSection ? (
                (() => {
                  const selectedSection = localAssessment.sections.find(
                    (s) => s.id === assessmentBuilder.selectedSection
                  );
                  if (!selectedSection) return null;

                  return (
                    <div className="h-full">
                      <QuestionEditor
                        section={selectedSection}
                        selectedQuestion={assessmentBuilder.selectedQuestion}
                        onQuestionUpdate={(questionId, updates) => {
                          const updatedSections = localAssessment.sections.map(
                            (section) => {
                              if (section.id === selectedSection.id) {
                                return {
                                  ...section,
                                  questions: section.questions.map((q) =>
                                    q.id === questionId
                                      ? { ...q, ...updates }
                                      : q
                                  ),
                                };
                              }
                              return section;
                            }
                          );
                          handleAssessmentChange("sections", updatedSections);
                        }}
                        onQuestionAdd={(questionData) => {
                          const newQuestion: Question = {
                            ...questionData,
                            id: nanoid(),
                            order: selectedSection.questions.length,
                          };

                          const updatedSections = localAssessment.sections.map(
                            (section) => {
                              if (section.id === selectedSection.id) {
                                return {
                                  ...section,
                                  questions: [
                                    ...section.questions,
                                    newQuestion,
                                  ],
                                };
                              }
                              return section;
                            }
                          );

                          handleAssessmentChange("sections", updatedSections);
                          setAssessmentBuilder({
                            selectedQuestion: newQuestion.id,
                          });
                        }}
                        onQuestionDelete={(questionId) => {
                          const updatedSections = localAssessment.sections.map(
                            (section) => {
                              if (section.id === selectedSection.id) {
                                return {
                                  ...section,
                                  questions: section.questions
                                    .filter((q) => q.id !== questionId)
                                    .map((q, index) => ({
                                      ...q,
                                      order: index,
                                    })),
                                };
                              }
                              return section;
                            }
                          );

                          handleAssessmentChange("sections", updatedSections);

                          if (
                            assessmentBuilder.selectedQuestion === questionId
                          ) {
                            setAssessmentBuilder({ selectedQuestion: null });
                          }
                        }}
                        onQuestionReorder={(fromIndex, toIndex) => {
                          const updatedSections = localAssessment.sections.map(
                            (section) => {
                              if (section.id === selectedSection.id) {
                                const reorderedQuestions = arrayMove(
                                  section.questions,
                                  fromIndex,
                                  toIndex
                                ).map((q, index) => ({ ...q, order: index }));

                                return {
                                  ...section,
                                  questions: reorderedQuestions,
                                };
                              }
                              return section;
                            }
                          );

                          handleAssessmentChange("sections", updatedSections);
                        }}
                        onQuestionSelect={(questionId) => {
                          setAssessmentBuilder({
                            selectedQuestion: questionId,
                          });
                        }}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-gray-500" />
                    </div>
                    <h4 className="text-xl font-medium text-white mb-2">
                      Select a section to manage questions
                    </h4>
                    <p className="text-gray-400 mb-4">
                      Choose a section from the left panel to add and edit
                      questions
                    </p>
                    {localAssessment.sections.length === 0 && (
                      <Button
                        onClick={addSection}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Section
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
