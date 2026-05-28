"use client";

/**
 * Animated shimmer skeletons. Use these instead of leaving white space while
 * data loads. Build composite loaders (cards, charts) from <Skeleton />.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** A vertical stack of full-width skeleton rows for table loading states. */
export function SkeletonRows({ rows = 6, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

/** Card-shaped skeleton block. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-32 w-full ${className}`} />;
}
