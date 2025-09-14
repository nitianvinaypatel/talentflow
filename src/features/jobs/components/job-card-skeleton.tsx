import { Card, CardContent, CardHeader } from "../../../components/ui";
import { Skeleton } from "../../../components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <Card
      className="border border-gray-700"
      style={{ backgroundColor: "#0d1025" }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-6 w-48 bg-gray-700" />
              <Skeleton className="h-5 w-16 bg-gray-700" />
            </div>
            <Skeleton className="h-4 w-full mb-1 bg-gray-700" />
            <Skeleton className="h-4 w-3/4 bg-gray-700" />
          </div>
          <Skeleton className="h-8 w-8 rounded bg-gray-700" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Job details skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24 bg-gray-700" />
            <Skeleton className="h-4 w-20 bg-gray-700" />
            <Skeleton className="h-4 w-28 bg-gray-700" />
          </div>

          {/* Requirements skeleton */}
          <div>
            <Skeleton className="h-4 w-20 mb-1 bg-gray-700" />
            <Skeleton className="h-4 w-full mb-1 bg-gray-700" />
            <Skeleton className="h-4 w-2/3 bg-gray-700" />
          </div>

          {/* Tags skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 bg-gray-700" />
            <Skeleton className="h-6 w-20 bg-gray-700" />
            <Skeleton className="h-6 w-14 bg-gray-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  );
}
