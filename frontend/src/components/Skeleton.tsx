interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const RADIUS: Record<string, string> = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
};

export default function Skeleton({
  width = "100%",
  height = "16px",
  rounded = "md",
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: RADIUS[rounded],
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card-sm space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton width="48px" height="12px" rounded="sm" />
        <Skeleton width="80px" height="12px" rounded="sm" />
      </div>
      <Skeleton width="100%" height="14px" />
      <div className="flex justify-between">
        <Skeleton width="60px" height="10px" rounded="sm" />
        <Skeleton width="40px" height="10px" rounded="sm" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
