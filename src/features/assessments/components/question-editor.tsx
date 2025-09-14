import React, { useState } from 'react';
import { DndContext, type DragEndEvent, closestCorners, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Badge } from '../../../components/ui/badge';
import {
    Plus,
    Trash2,
    GripVertical,
    Eye,
    Settings,
    X,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { QuestionTypeSelector } from './question-type-selector';
import type { Question, AssessmentSection, ValidationRule, ConditionalRule } from '../../../types';

interface QuestionEditorProps {
    section: AssessmentSection;
    selectedQuestion?: string | null;
    onQuestionUpdate: (questionId: string, updates: Partial<Question>) => void;
    onQuestionAdd: (question: Omit<Question, 'id' | 'order'>) => void;
    onQuestionDelete: (questionId: string) => void;
    onQuestionReorder: (fromIndex: number, toIndex: number) => void;
    onQuestionSelect?: (questionId: string) => void;
}

interface SortableQuestionItemProps {
    question: Question;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
    question,
    isSelected,
    onSelect,
    onDelete
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group border rounded-lg p-3 cursor-pointer transition-all ${isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                }`}
            onClick={onSelect}
        >
            <div className="flex items-center gap-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                            {question.title || 'Untitled Question'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                            {question.type.replace('-', ' ')}
                        </Badge>
                        {question.required && (
                            <Badge variant="destructive" className="text-xs">
                                Required
                            </Badge>
                        )}
                    </div>
                    {question.description && (
                        <p className="text-xs text-muted-foreground truncate">
                            {question.description}
                        </p>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    );
};

interface QuestionFormProps {
    question: Question;
    allQuestions: Question[];
    onChange: (updates: Partial<Question>) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, allQuestions, onChange }) => {
    const [showValidation, setShowValidation] = useState(false);
    const [showConditional, setShowConditional] = useState(false);

    const addValidationRule = () => {
        const newRule: ValidationRule = {
            type: 'required',
            message: 'This field is required'
        };

        onChange({
            validation: [...(question.validation || []), newRule]
        });
    };

    const updateValidationRule = (index: number, updates: Partial<ValidationRule>) => {
        const updatedRules = [...(question.validation || [])];
        updatedRules[index] = { ...updatedRules[index], ...updates };
        onChange({ validation: updatedRules });
    };

    const removeValidationRule = (index: number) => {
        const updatedRules = [...(question.validation || [])];
        updatedRules.splice(index, 1);
        onChange({ validation: updatedRules });
    };

    const addConditionalRule = () => {
        const availableQuestions = allQuestions.filter(q => q.id !== question.id && q.order < question.order);
        if (availableQuestions.length === 0) return;

        const newRule: ConditionalRule = {
            dependsOnQuestionId: availableQuestions[0].id,
            condition: 'equals',
            value: '',
            action: 'show'
        };

        onChange({
            conditionalLogic: [...(question.conditionalLogic || []), newRule]
        });
    };

    const updateConditionalRule = (index: number, updates: Partial<ConditionalRule>) => {
        const updatedRules = [...(question.conditionalLogic || [])];
        updatedRules[index] = { ...updatedRules[index], ...updates };
        onChange({ conditionalLogic: updatedRules });
    };

    const removeConditionalRule = (index: number) => {
        const updatedRules = [...(question.conditionalLogic || [])];
        updatedRules.splice(index, 1);
        onChange({ conditionalLogic: updatedRules });
    };

    const addOption = () => {
        const newOptions = [...(question.options || []), ''];
        onChange({ options: newOptions });
    };

    const updateOption = (index: number, value: string) => {
        const updatedOptions = [...(question.options || [])];
        updatedOptions[index] = value;
        onChange({ options: updatedOptions });
    };

    const removeOption = (index: number) => {
        const updatedOptions = [...(question.options || [])];
        updatedOptions.splice(index, 1);
        onChange({ options: updatedOptions });
    };

    const availableQuestions = allQuestions.filter(q => q.id !== question.id && q.order < question.order);

    return (
        <div className="space-y-6">
            {/* Basic Question Info */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="question-title">Question Title *</Label>
                    <Input
                        id="question-title"
                        value={question.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="Enter your question..."
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="question-description">Description (Optional)</Label>
                    <Textarea
                        id="question-description"
                        value={question.description || ''}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder="Provide additional context or instructions..."
                        className="mt-1"
                        rows={2}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="question-required"
                        checked={question.required}
                        onCheckedChange={(checked) => onChange({ required: !!checked })}
                    />
                    <Label htmlFor="question-required">Required field</Label>
                </div>
            </div>

            {/* Question Type Specific Options */}
            {(question.type === 'single-choice' || question.type === 'multi-choice') && (
                <div>
                    <Label>Answer Options</Label>
                    <div className="mt-2 space-y-2">
                        {(question.options || []).map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    className="h-9 w-9 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addOption}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                        </Button>
                    </div>
                </div>
            )}

            {/* Validation Rules */}
            <div>
                <div className="flex items-center justify-between">
                    <Label>Validation Rules</Label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowValidation(!showValidation)}
                    >
                        {showValidation ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {showValidation && (
                    <div className="mt-2 space-y-3 p-3 border rounded-lg bg-muted/30">
                        {(question.validation || []).map((rule, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded bg-background">
                                <select
                                    value={rule.type}
                                    onChange={(e) => updateValidationRule(index, {
                                        type: e.target.value as ValidationRule['type']
                                    })}
                                    className="px-2 py-1 border rounded text-sm"
                                >
                                    <option value="required">Required</option>
                                    <option value="min-length">Min Length</option>
                                    <option value="max-length">Max Length</option>
                                    <option value="numeric-range">Numeric Range</option>
                                    <option value="email">Email Format</option>
                                    <option value="url">URL Format</option>
                                </select>

                                {(rule.type === 'min-length' || rule.type === 'max-length' || rule.type === 'numeric-range') && (
                                    <Input
                                        type="number"
                                        value={rule.value || ''}
                                        onChange={(e) => updateValidationRule(index, { value: parseInt(e.target.value) })}
                                        placeholder="Value"
                                        className="w-20"
                                    />
                                )}

                                <Input
                                    value={rule.message}
                                    onChange={(e) => updateValidationRule(index, { message: e.target.value })}
                                    placeholder="Error message"
                                    className="flex-1"
                                />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeValidationRule(index)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addValidationRule}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Validation Rule
                        </Button>
                    </div>
                )}
            </div>

            {/* Conditional Logic */}
            {availableQuestions.length > 0 && (
                <div>
                    <div className="flex items-center justify-between">
                        <Label>Conditional Logic</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConditional(!showConditional)}
                        >
                            {showConditional ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {showConditional && (
                        <div className="mt-2 space-y-3 p-3 border rounded-lg bg-muted/30">
                            {(question.conditionalLogic || []).map((rule, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded bg-background">
                                    <select
                                        value={rule.dependsOnQuestionId}
                                        onChange={(e) => updateConditionalRule(index, {
                                            dependsOnQuestionId: e.target.value
                                        })}
                                        className="px-2 py-1 border rounded text-sm"
                                    >
                                        {availableQuestions.map(q => (
                                            <option key={q.id} value={q.id}>
                                                {q.title || 'Untitled'}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={rule.condition}
                                        onChange={(e) => updateConditionalRule(index, {
                                            condition: e.target.value as ConditionalRule['condition']
                                        })}
                                        className="px-2 py-1 border rounded text-sm"
                                    >
                                        <option value="equals">Equals</option>
                                        <option value="not-equals">Not Equals</option>
                                        <option value="contains">Contains</option>
                                        <option value="greater-than">Greater Than</option>
                                        <option value="less-than">Less Than</option>
                                    </select>

                                    <Input
                                        value={rule.value}
                                        onChange={(e) => updateConditionalRule(index, { value: e.target.value })}
                                        placeholder="Value"
                                        className="w-24"
                                    />

                                    <select
                                        value={rule.action}
                                        onChange={(e) => updateConditionalRule(index, {
                                            action: e.target.value as ConditionalRule['action']
                                        })}
                                        className="px-2 py-1 border rounded text-sm"
                                    >
                                        <option value="show">Show</option>
                                        <option value="hide">Hide</option>
                                        <option value="require">Require</option>
                                    </select>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeConditionalRule(index)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addConditionalRule}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Conditional Rule
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface QuestionPreviewProps {
    question: Question;
    allQuestions: Question[];
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question, allQuestions }) => {
    const [previewValue, setPreviewValue] = useState<any>('');

    const renderQuestionInput = () => {
        switch (question.type) {
            case 'single-choice':
                return (
                    <RadioGroup value={previewValue} onValueChange={setPreviewValue}>
                        {(question.options || []).map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`}>{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'multi-choice':
                return (
                    <div className="space-y-2">
                        {(question.options || []).map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`option-${index}`}
                                    checked={Array.isArray(previewValue) && previewValue.includes(option)}
                                    onCheckedChange={(checked) => {
                                        const currentValues = Array.isArray(previewValue) ? previewValue : [];
                                        if (checked) {
                                            setPreviewValue([...currentValues, option]);
                                        } else {
                                            setPreviewValue(currentValues.filter((v: string) => v !== option));
                                        }
                                    }}
                                />
                                <Label htmlFor={`option-${index}`}>{option}</Label>
                            </div>
                        ))}
                    </div>
                );

            case 'short-text':
                return (
                    <Input
                        value={previewValue}
                        onChange={(e) => setPreviewValue(e.target.value)}
                        placeholder="Enter your answer..."
                    />
                );

            case 'long-text':
                return (
                    <Textarea
                        value={previewValue}
                        onChange={(e) => setPreviewValue(e.target.value)}
                        placeholder="Enter your detailed answer..."
                        rows={4}
                    />
                );

            case 'numeric':
                return (
                    <Input
                        type="number"
                        value={previewValue}
                        onChange={(e) => setPreviewValue(e.target.value)}
                        placeholder="Enter a number..."
                    />
                );

            case 'file-upload':
                return (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <div className="text-muted-foreground">
                            <p className="mb-2">File upload (stub implementation)</p>
                            <p className="text-sm">Click to select files or drag and drop</p>
                        </div>
                    </div>
                );

            default:
                return <div>Unknown question type</div>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Question Preview
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-medium">
                            {question.title || 'Untitled Question'}
                            {question.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {question.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {question.description}
                            </p>
                        )}
                    </div>

                    <div>
                        {renderQuestionInput()}
                    </div>

                    {question.validation && question.validation.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Validation Rules:</p>
                            <ul className="space-y-1">
                                {question.validation.map((rule, index) => (
                                    <li key={index}>• {rule.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {question.conditionalLogic && question.conditionalLogic.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Conditional Logic:</p>
                            <ul className="space-y-1">
                                {question.conditionalLogic.map((rule, index) => {
                                    const dependentQuestion = allQuestions.find(q => q.id === rule.dependsOnQuestionId);
                                    return (
                                        <li key={index}>
                                            • {rule.action} when "{dependentQuestion?.title || 'Unknown'}" {rule.condition} "{rule.value}"
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
    section,
    selectedQuestion,
    onQuestionUpdate,
    onQuestionAdd,
    onQuestionDelete,
    onQuestionReorder,
    onQuestionSelect
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestionType, setNewQuestionType] = useState<Question['type']>('short-text');
    const [showPreview, setShowPreview] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const selectedQuestionData = section.questions.find(q => q.id === selectedQuestion);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const oldIndex = section.questions.findIndex(q => q.id === active.id);
        const newIndex = section.questions.findIndex(q => q.id === over.id);

        if (oldIndex !== newIndex) {
            onQuestionReorder(oldIndex, newIndex);
        }
    };

    const createQuestion = () => {
        const newQuestion: Omit<Question, 'id' | 'order'> = {
            type: newQuestionType,
            title: '',
            description: '',
            required: false,
            options: ['single-choice', 'multi-choice'].includes(newQuestionType) ? ['Option 1', 'Option 2'] : undefined,
            validation: [],
            conditionalLogic: []
        };

        onQuestionAdd(newQuestion);
        setIsCreating(false);
        setNewQuestionType('short-text');
    };

    return (
        <div className="h-full flex">
            {/* Questions List */}
            <div className="w-1/3 border-r bg-muted/30 overflow-y-auto">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Questions</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                    </div>

                    {isCreating && (
                        <Card className="mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">New Question</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <QuestionTypeSelector
                                    selectedType={newQuestionType}
                                    onTypeSelect={setNewQuestionType}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={createQuestion}>
                                        Create
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreating(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={section.questions.map(q => q.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {section.questions.map((question) => (
                                    <SortableQuestionItem
                                        key={question.id}
                                        question={question}
                                        isSelected={selectedQuestion === question.id}
                                        onSelect={() => onQuestionSelect?.(question.id)}
                                        onDelete={() => onQuestionDelete(question.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {section.questions.length === 0 && !isCreating && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="mb-2">No questions yet</p>
                            <p className="text-sm">Add a question to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Question Editor/Preview */}
            <div className="flex-1 overflow-y-auto">
                {selectedQuestionData ? (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Edit Question</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                {showPreview ? (
                                    <>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </>
                                )}
                            </Button>
                        </div>

                        {showPreview ? (
                            <QuestionPreview
                                question={selectedQuestionData}
                                allQuestions={section.questions}
                            />
                        ) : (
                            <QuestionForm
                                question={selectedQuestionData}
                                allQuestions={section.questions}
                                onChange={(updates) => onQuestionUpdate(selectedQuestionData.id, updates)}
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                            <p className="mb-2">Select a question to edit</p>
                            <p className="text-sm">Or add a new question to get started</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};