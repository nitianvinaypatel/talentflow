import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Label } from "../../../components/ui/label";
import { Upload, FileText } from "lucide-react";
import type { Assessment, Question } from "../../../types";

interface AssessmentPreviewProps {
  assessment: Assessment;
}

const QuestionPreview: React.FC<{
  question: Question;
  sectionIndex: number;
  questionIndex: number;
}> = ({ question, sectionIndex, questionIndex }) => {
  const questionNumber = `${sectionIndex + 1}.${questionIndex + 1}`;

  const renderQuestionInput = () => {
    switch (question.type) {
      case "single-choice":
        return (
          <RadioGroup className="mt-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className="text-sm text-gray-300"
                >
                  {option}
                </Label>
              </div>
            )) || (
              <div className="text-sm text-gray-400 italic">
                No options configured
              </div>
            )}
          </RadioGroup>
        );

      case "multi-choice":
        return (
          <div className="mt-3 space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox id={`${question.id}-${index}`} />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className="text-sm text-gray-300"
                >
                  {option}
                </Label>
              </div>
            )) || (
              <div className="text-sm text-gray-400 italic">
                No options configured
              </div>
            )}
          </div>
        );

      case "short-text":
        return (
          <Input
            className="mt-3 bg-gray-600 border-gray-500 text-gray-100 placeholder:text-gray-400"
            placeholder="Enter your answer..."
            disabled
          />
        );

      case "long-text":
        return (
          <Textarea
            className="mt-3 bg-gray-600 border-gray-500 text-gray-100 placeholder:text-gray-400"
            placeholder="Enter your detailed response..."
            rows={4}
            disabled
          />
        );

      case "numeric":
        return (
          <Input
            type="number"
            className="mt-3 bg-gray-600 border-gray-500 text-gray-100 placeholder:text-gray-400"
            placeholder="Enter a number..."
            disabled
          />
        );

      case "file-upload":
        return (
          <div className="mt-3">
            <Button
              variant="outline"
              disabled
              className="w-full border-gray-600 bg-gray-700 text-gray-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <p className="text-xs text-gray-400 mt-1">
              File upload functionality (stub implementation)
            </p>
          </div>
        );

      default:
        return (
          <div className="mt-3 text-sm text-gray-400 italic">
            Unknown question type: {question.type}
          </div>
        );
    }
  };

  return (
    <Card className="mb-6 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Badge
            variant="outline"
            className="mt-1 text-sm font-medium bg-purple-900/20 text-purple-300 border-purple-500/30"
          >
            {questionNumber}
          </Badge>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-lg leading-relaxed text-white">
                {question.title}
                {question.required && (
                  <span className="text-red-400 ml-1 text-xl">*</span>
                )}
              </h4>
              <Badge
                variant="secondary"
                className="text-sm ml-3 bg-gray-700 text-gray-300 px-3 py-1"
              >
                {question.type.replace("-", " ")}
              </Badge>
            </div>

            {question.description && (
              <p className="text-base text-gray-300 mb-4 leading-relaxed">
                {question.description}
              </p>
            )}

            <div className="bg-gray-700 rounded-lg p-4">
              {renderQuestionInput()}
            </div>

            {question.validation && question.validation.length > 0 && (
              <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-sm font-medium text-amber-300 mb-2">
                  Validation requirements:
                </p>
                <ul className="list-disc list-inside text-sm text-amber-200 space-y-1">
                  {question.validation.map((rule, index) => (
                    <li key={index}>{rule.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AssessmentPreview: React.FC<AssessmentPreviewProps> = ({
  assessment,
}) => {
  const totalQuestions = assessment.sections.reduce(
    (total, section) => total + section.questions.length,
    0
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-gray-900 min-h-screen">
      {/* Enhanced Assessment Header */}
      <Card className="mb-8 shadow-xl border-0 bg-gray-800 border-gray-700">
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {assessment.title}
              </CardTitle>
              {assessment.description && (
                <p className="text-lg text-gray-300 leading-relaxed max-w-3xl">
                  {assessment.description}
                </p>
              )}
            </div>
            <div className="text-right space-y-2">
              <div className="bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-500/30">
                <p className="text-sm font-medium text-blue-300">
                  {assessment.sections.length} section
                  {assessment.sections.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-500/30">
                <p className="text-sm font-medium text-emerald-300">
                  {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="bg-violet-900/20 px-4 py-2 rounded-lg border border-violet-500/30">
                <p className="text-sm font-medium text-violet-300">
                  ~{totalQuestions * 2} min
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Assessment Sections */}
      {assessment.sections.length === 0 ? (
        <Card className="shadow-lg border-dashed border-2 border-gray-600 bg-gray-800">
          <CardContent className="p-16 text-center">
            <FileText className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-medium mb-3 text-gray-200">
              No sections yet
            </h3>
            <p className="text-gray-400 text-lg">
              Add sections and questions to see the assessment preview
            </p>
          </CardContent>
        </Card>
      ) : (
        assessment.sections
          .sort((a, b) => a.order - b.order)
          .map((section, sectionIndex) => (
            <div key={section.id} className="mb-12">
              {/* Enhanced Section Header */}
              <Card className="mb-6 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <Badge className="text-lg font-semibold bg-white/20 text-white border-0 px-4 py-2">
                      Section {sectionIndex + 1}
                    </Badge>
                    <CardTitle className="text-2xl font-bold">
                      {section.title}
                    </CardTitle>
                  </div>
                  {section.description && (
                    <p className="text-blue-100 mt-3 text-lg leading-relaxed">
                      {section.description}
                    </p>
                  )}
                  <div className="mt-4 text-blue-100 text-sm">
                    {section.questions.length} question
                    {section.questions.length !== 1 ? "s" : ""} in this section
                  </div>
                </CardHeader>
              </Card>

              {/* Section Questions */}
              {section.questions.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-400">
                      No questions in this section
                    </p>
                  </CardContent>
                </Card>
              ) : (
                section.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question, questionIndex) => (
                    <QuestionPreview
                      key={question.id}
                      question={question}
                      sectionIndex={sectionIndex}
                      questionIndex={questionIndex}
                    />
                  ))
              )}
            </div>
          ))
      )}

      {/* Preview Footer */}
      <Card className="mt-8 bg-gray-800 border-gray-700">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-gray-400 mb-3">
            This is a preview of how the assessment will appear to candidates
          </p>
          <Button
            disabled
            className="bg-gray-700 text-gray-300 cursor-not-allowed"
          >
            Submit Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
