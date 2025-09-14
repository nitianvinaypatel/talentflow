import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import {
  CheckCircle,
  CheckSquare,
  Type,
  FileText,
  Hash,
  Upload,
} from "lucide-react";
import type { Question } from "../../../types";

interface QuestionTypeOption {
  type: Question["type"];
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const questionTypes: QuestionTypeOption[] = [
  {
    type: "single-choice",
    label: "Single Choice",
    description: "Select one option from multiple choices",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    type: "multi-choice",
    label: "Multiple Choice",
    description: "Select multiple options from choices",
    icon: <CheckSquare className="h-5 w-5" />,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    type: "short-text",
    label: "Short Text",
    description: "Brief text response (single line)",
    icon: <Type className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    type: "long-text",
    label: "Long Text",
    description: "Extended text response (paragraph)",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    type: "numeric",
    label: "Numeric",
    description: "Number input with optional range validation",
    icon: <Hash className="h-5 w-5" />,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  {
    type: "file-upload",
    label: "File Upload",
    description: "File attachment (stub implementation)",
    icon: <Upload className="h-5 w-5" />,
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
];

interface QuestionTypeSelectorProps {
  selectedType?: Question["type"];
  onTypeSelect: (type: Question["type"]) => void;
  className?: string;
}

export const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      {questionTypes.map((questionType) => (
        <Card
          key={questionType.type}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedType === questionType.type
              ? "ring-2 ring-primary shadow-md"
              : "hover:border-muted-foreground/50"
          }`}
          onClick={() => onTypeSelect(questionType.type)}
        >
          <CardContent className="p-2">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${questionType.color}`}>
                {questionType.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-xs">{questionType.label}</h4>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { questionTypes };
