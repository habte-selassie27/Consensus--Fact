import { CATEGORIES, categoryBadgeClass } from "@/lib/categories";
import type { Category } from "@/lib/categories";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "xs";
}

export default function CategoryBadge({ category, size = "xs" }: CategoryBadgeProps) {
  const sizeClass =
    size === "sm"
      ? "px-2.5 py-1 text-[0.7rem]"
      : "px-2 py-0.5 text-[0.6rem]";
  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-semibold tracking-wide ${sizeClass} ${categoryBadgeClass(category)}`}
    >
      {category}
    </span>
  );
}
