import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Plus,
  Settings,
  Eye,
  Save,
  FileText,
  Clock,
  BarChart,
} from "lucide-react";

export const AssessmentBuilder: React.FC = () => {
  // Mock data for existing assessments
  const assessments = [
    {
      id: 1,
      title: "Frontend Developer Assessment",
      description: "Comprehensive evaluation for React developers",
      status: "active",
      questions: 12,
      duration: 45,
      responses: 23,
    },
    {
      id: 2,
      title: "Leadership Skills Assessment",
      description: "Evaluating management and leadership capabilities",
      status: "draft",
      questions: 8,
      duration: 30,
      responses: 0,
    },
    {
      id: 3,
      title: "UX Design Portfolio Review",
      description: "Portfolio-based assessment for UX designers",
      status: "active",
      questions: 15,
      duration: 60,
      responses: 18,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assessment Builder
          </h1>
          <p className="text-muted-foreground">
            Create and manage custom assessments for your hiring process
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Assessment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assessments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(assessments || []).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {(assessments || []).filter((a) => a.status === "active").length}{" "}
              active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Responses
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.reduce((sum, a) => sum + a.responses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (assessments || []).reduce((sum, a) => sum + a.duration, 0) /
                  Math.max((assessments || []).length, 1)
              )}{" "}
              min
            </div>
            <p className="text-xs text-muted-foreground">
              Average completion time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Assessments</h2>
        <div className="grid gap-4">
          {(assessments || []).map((assessment) => (
            <Card
              key={assessment.id}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-blue-900">
                      {assessment.title}
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      {assessment.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      assessment.status === "active" ? "default" : "secondary"
                    }
                    className={
                      assessment.status === "active"
                        ? "bg-green-500 hover:bg-green-600"
                        : ""
                    }
                  >
                    {assessment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-blue-600">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {assessment.questions} questions
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {assessment.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart className="h-4 w-4" />
                      {assessment.responses} responses
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    {assessment.status === "draft" && (
                      <Button size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Create your first assessment in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Choose Assessment Type</h4>
                <p className="text-sm text-muted-foreground">
                  Select from technical skills, personality, or custom
                  assessment templates
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Add Questions</h4>
                <p className="text-sm text-muted-foreground">
                  Create multiple choice, text, or coding questions with our
                  intuitive builder
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Configure & Publish</h4>
                <p className="text-sm text-muted-foreground">
                  Set time limits, scoring, and publish to start collecting
                  responses
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
