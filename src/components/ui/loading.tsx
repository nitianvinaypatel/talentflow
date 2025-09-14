import * as React from "react";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "bars";
  color?: "primary" | "secondary" | "muted";
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      className,
      size = "md",
      variant = "spinner",
      color = "primary",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    };

    const colorClasses = {
      primary: "border-gray-300 border-t-blue-600",
      secondary: "border-gray-200 border-t-gray-600",
      muted: "border-gray-100 border-t-gray-400",
    };

    if (variant === "spinner") {
      return (
        <div
          ref={ref}
          className={cn(
            "animate-spin rounded-full border-2",
            sizeClasses[size],
            colorClasses[color],
            className
          )}
          {...props}
        />
      );
    }

    if (variant === "dots") {
      return (
        <div ref={ref} className={cn("flex space-x-1", className)} {...props}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-blue-600 animate-pulse",
                sizeClasses[size]
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === "pulse") {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-full bg-blue-600 animate-pulse",
            sizeClasses[size],
            className
          )}
          {...props}
        />
      );
    }

    if (variant === "bars") {
      return (
        <div
          ref={ref}
          className={cn("flex items-end space-x-1", className)}
          {...props}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 bg-blue-600 animate-pulse"
              style={{
                height: `${12 + (i % 2) * 8}px`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: "1.2s",
              }}
            />
          ))}
        </div>
      );
    }

    return null;
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse" | "bars";
  showIcon?: boolean;
  icon?: React.ReactNode;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  className,
  size = "lg",
  variant = "spinner",
  showIcon = false,
  icon,
}) => (
  <div
    className={cn("flex flex-col items-center justify-center p-8", className)}
  >
    {showIcon && icon ? (
      <div className="mb-4 text-gray-400">{icon}</div>
    ) : (
      <LoadingSpinner size={size} variant={variant} />
    )}
    <p className="mt-4 text-sm text-gray-600">{message}</p>
  </div>
);

interface SkeletonCardProps {
  variant?: "default" | "job" | "candidate" | "assessment";
  showAvatar?: boolean;
  showActions?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = "default",
  showAvatar = false,
  showActions = false,
}) => {
  if (variant === "job") {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            {showActions && (
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "candidate") {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex space-x-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          {showActions && <Skeleton className="h-8 w-8" />}
        </div>
      </div>
    );
  }

  if (variant === "assessment") {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
};

interface SkeletonListProps {
  count?: number;
  variant?: "default" | "job" | "candidate" | "assessment";
  showAvatar?: boolean;
  showActions?: boolean;
}

const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  variant = "default",
  showAvatar = false,
  showActions = false,
}) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard
        key={i}
        variant={variant}
        showAvatar={showAvatar}
        showActions={showActions}
      />
    ))}
  </div>
);

// Skeleton for table rows
const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            className={cn(
              "h-4",
              colIndex === 0
                ? "w-1/4"
                : colIndex === 1
                ? "w-1/3"
                : colIndex === 2
                ? "w-1/6"
                : "w-1/5"
            )}
          />
        ))}
      </div>
    ))}
  </div>
);

// Skeleton for forms
const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-2 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-16" />
    </div>
  </div>
);

// Simple Loading component for tests
const Loading: React.FC = () => (
  <div data-testid="loading" className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Inline loading component for buttons and small spaces
interface InlineLoadingProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = "sm",
  className,
}) => <LoadingSpinner size={size} className={cn("inline-block", className)} />;

// Loading overlay for content areas
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = "Loading...",
  className,
}) => (
  <div className={cn("relative", className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-2">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// Progressive loading component
interface ProgressiveLoadingProps {
  stages: Array<{
    message: string;
    duration?: number;
  }>;
  onComplete?: () => void;
}

const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  stages,
  onComplete,
}) => {
  const [currentStage, setCurrentStage] = React.useState(0);

  React.useEffect(() => {
    if (currentStage >= stages.length) {
      onComplete?.();
      return;
    }

    const stage = stages[currentStage];
    const duration = stage.duration || 1000;

    const timer = setTimeout(() => {
      setCurrentStage((prev) => prev + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentStage, stages, onComplete]);

  if (currentStage >= stages.length) {
    return null;
  }

  return <LoadingState message={stages[currentStage].message} variant="dots" />;
};

export {
  LoadingSpinner,
  LoadingState,
  Loading,
  InlineLoading,
  LoadingOverlay,
  ProgressiveLoading,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonForm,
};
