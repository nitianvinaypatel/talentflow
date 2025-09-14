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
import { FileText, Clock, Users, ArrowRight } from "lucide-react";

export const AssessmentFormDemo: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assessment Form Demo
          </h1>
          <p className="text-muted-foreground">
            Interactive demonstration of our assessment forms
          </p>
        </div>
      </div>

      {/* Demo Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-emerald-900">
                Skills Assessment
              </CardTitle>
            </div>
            <CardDescription className="text-emerald-700">
              Technical skills evaluation for developers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">45 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">15 questions</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">JavaScript</Badge>
              <Badge variant="secondary">React</Badge>
              <Badge variant="secondary">Node.js</Badge>
            </div>
            <Button className="w-full">
              Start Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-rose-600" />
              <CardTitle className="text-rose-900">
                Personality Assessment
              </CardTitle>
            </div>
            <CardDescription className="text-rose-700">
              Cultural fit and personality evaluation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-rose-600" />
              <span className="text-sm text-rose-700">20 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-600" />
              <span className="text-sm text-rose-700">25 questions</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">Leadership</Badge>
              <Badge variant="secondary">Teamwork</Badge>
              <Badge variant="secondary">Communication</Badge>
            </div>
            <Button className="w-full">
              Start Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Assessment Forms</CardTitle>
          <CardDescription>
            Step-by-step guide to creating and managing assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Create Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  Define questions, time limits, and scoring criteria
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Send to Candidates</h4>
                <p className="text-sm text-muted-foreground">
                  Share assessment links with candidates via email
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Review Results</h4>
                <p className="text-sm text-muted-foreground">
                  Analyze responses and generate detailed reports
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
