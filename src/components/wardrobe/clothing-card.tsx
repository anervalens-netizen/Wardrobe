"use client";

import Link from "next/link";
import { Heart, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

interface ClothingCardProps {
  item: {
    id: string;
    name: string;
    category: string;
    colorPrimary: string;
    pattern?: string | null;
    formality?: string | null;
    imagePath?: string | null;
    favorite: boolean;
  };
  onToggleFavorite?: (id: string, favorite: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  dresses: "bg-violet-100 text-violet-700",
  tops: "bg-teal-100 text-teal-700",
  bottoms: "bg-purple-100 text-purple-700",
  outerwear: "bg-pink-100 text-pink-700",
  shoes: "bg-emerald-100 text-emerald-700",
  accessories: "bg-amber-100 text-amber-700",
};

export function ClothingCard({ item, onToggleFavorite }: ClothingCardProps) {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === item.category)?.label || item.category;
  const categoryColor = CATEGORY_COLORS[item.category] || "bg-primary/10 text-primary";

  return (
    <Link href={`/wardrobe/${item.id}`}>
      <div className="group rounded-2xl border border-border/50 bg-card overflow-hidden shadow-ava-sm hover:shadow-ava hover:-translate-y-1 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square">
          {item.imagePath ? (
            <img
              src={item.imagePath}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: item.colorPrimary }}
            >
              <Shirt className="h-10 w-10 text-white/50" />
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(item.id, !item.favorite);
            }}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full bg-white/85 backdrop-blur-sm shadow-sm transition-all duration-200",
              item.favorite
                ? "text-rose-500 opacity-100"
                : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", item.favorite && "fill-current")}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold truncate text-sm mb-1.5">{item.name}</p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                categoryColor
              )}
            >
              {categoryLabel}
            </span>
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0"
              style={{ backgroundColor: item.colorPrimary }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
