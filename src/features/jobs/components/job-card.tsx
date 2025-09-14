import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  MapPin,
  Clock,
  Users,
  Briefcase,
  TrendingUp,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "../../../components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import type { Job } from "../../../types";

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onToggleStatus: (id: string, currentStatus: Job["status"]) => void;
  onDelete: (id: string) => void;
}

export function JobCard({
  job,
  onEdit,
  onToggleStatus,
  onDelete,
}: JobCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await onToggleStatus(job.id, job.status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        await onDelete(job.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Unknown";
      }
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(dateObj);
    } catch {
      return "Unknown";
    }
  };

  const getJobTypeBg = (type: Job["type"]) => {
    switch (type) {
      case "full-time":
        return "bg-emerald-600";
      case "part-time":
        return "bg-blue-600";
      case "contract":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusBg = (status: Job["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-600";
      case "archived":
        return "bg-amber-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <Card
      className="border border-gray-700 hover:shadow-lg transition-all duration-300"
      style={{ backgroundColor: "#0d1025" }}
    >
      {/* Status indicator bar */}
      <div className={`h-1 ${getStatusBg(job.status)}`}></div>

      <CardHeader className="pb-3 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-xl ${getJobTypeBg(
                  job.type
                )} text-white`}
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg leading-tight font-bold text-white">
                <Link
                  to={`/jobs/${job.id}`}
                  className="hover:text-blue-400 transition-colors"
                >
                  {job.title}
                </Link>
              </CardTitle>
            </div>
            <CardDescription className="line-clamp-2 text-sm text-gray-300 leading-relaxed">
              {job.description}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <Badge
              className={`text-xs px-3 py-1 text-white font-medium ${getStatusBg(
                job.status
              )}`}
            >
              {job.status === "active" ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Archive className="h-3 w-3 mr-1" />
                  Archived
                </>
              )}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onEdit(job)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Job
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleStatus}
                  className="cursor-pointer"
                >
                  {job.status === "active" ? (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Job
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Restore Job
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-6">
        <div className="space-y-4">
          {/* Job details */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-gray-300">{job.location}</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white ${getJobTypeBg(
                job.type
              )}`}
            >
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {job.type?.replace("-", " ") || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-gray-300">
                {formatDate(job.createdAt)}
              </span>
            </div>
          </div>

          {/* Requirements */}
          {Array.isArray(job.requirements) && job.requirements.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-blue-400" />
                <p className="text-sm font-semibold text-white">
                  Key Requirements
                </p>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                {job.requirements.slice(0, 2).join(" • ")}
                {job.requirements.length > 2 &&
                  ` • +${job.requirements.length - 2} more requirements`}
              </p>
            </div>
          )}

          {/* Tags */}
          {Array.isArray(job.tags) && job.tags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Skills & Technologies
              </div>
              <div className="flex flex-wrap gap-2">
                {job.tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs px-3 py-1 bg-gray-800 border-gray-600 text-purple-300"
                  >
                    {tag}
                  </Badge>
                ))}
                {job.tags.length > 4 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-3 py-1 bg-gray-700 border-gray-600 text-gray-300"
                  >
                    +{job.tags.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
