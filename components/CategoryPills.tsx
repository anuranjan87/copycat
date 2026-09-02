
"use client";

import { useRef } from "react";

import { UI_COMPONENT_CATEGORIES } from "@/lib/UI_components";

interface CategoryPillsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activeUIComponent?: string;
  onUIComponentChange?: (subcategory: string) => void;
}

export default function CategoryPills({
  activeCategory,
  onCategoryChange,
  activeUIComponent = "Colors",
  onUIComponentChange,
}: CategoryPillsProps) {
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const showUIComponents = activeCategory === "UI Components";

  const handleUIComponentClick = (subcategory: string) => {
    onUIComponentChange?.(subcategory);
  };

  return (
    <div className="w-full min-w-0">
      {showUIComponents && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {UI_COMPONENT_CATEGORIES.map((subcategory) => {
            const isActive = activeUIComponent === subcategory;

            return (
              <button
                key={subcategory}
                type="button"
                onClick={() => handleUIComponentClick(subcategory)}
                className={
                  isActive
                    ? "group relative h-8 shrink-0 rounded-full border border-foreground bg-foreground px-3.5 text-xs font-medium text-background transition-all"
                    : "group relative h-8 shrink-0 rounded-full border border-border/60 bg-background px-3.5 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/40 hover:bg-muted hover:text-foreground"
                }
              >
                {subcategory}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

