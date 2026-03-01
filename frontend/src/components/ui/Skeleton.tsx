/**
 * Skeleton loading components.
 *
 * All elements share the `.skeleton` CSS class which carries the shimmer
 * animation defined in index.css.
 */

/* ─── SkeletonCard ──────────────────────────────────────────────────────────
   A single shimmer rectangle. Width and height are configurable.            */
interface SkeletonCardProps {
  height?: number | string;
  width?: number | string;
  className?: string;
}

export function SkeletonCard({
  height = 112,
  width = "100%",
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={`skeleton rounded-card ${className}`}
      style={{ height, width }}
    />
  );
}

/* ─── SkeletonText ──────────────────────────────────────────────────────────
   Stacked lines that mimic a paragraph of text.                             */
const LINE_WIDTHS = ["100%", "82%", "68%", "50%"];

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 2, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: Math.min(lines, 4) }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: LINE_WIDTHS[i] ?? "55%" }}
        />
      ))}
    </div>
  );
}

/* ─── SkeletonList ──────────────────────────────────────────────────────────
   Renders N skeleton cards in a grid or a stacked list.                     */
const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
};

interface SkeletonListProps {
  count?: number;
  layout?: "grid" | "list";
  /** Only used when layout="grid" */
  columns?: 2 | 3 | 4;
  /** Card height in px. Defaults to 112 for grid, 60 for list. */
  cardHeight?: number;
  className?: string;
}

export function SkeletonList({
  count = 6,
  layout = "grid",
  columns = 3,
  cardHeight,
  className = "",
}: SkeletonListProps) {
  const h = cardHeight ?? (layout === "list" ? 60 : 112);

  if (layout === "list") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} height={h} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${GRID_COLS[columns]} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={h} />
      ))}
    </div>
  );
}
