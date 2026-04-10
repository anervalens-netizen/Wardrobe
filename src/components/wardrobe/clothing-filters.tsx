"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CATEGORIES, SEASONS, FORMALITY } from "@/lib/constants";

interface Filters {
  search: string;
  category: string;
  season: string;
  formality: string;
}

interface ClothingFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  totalCount: number;
}

export function ClothingFilters({
  filters,
  onChange,
  totalCount,
}: ClothingFiltersProps) {
  const activeCount = [
    filters.category,
    filters.season,
    filters.formality,
  ].filter(Boolean).length;

  const filterContent = (
    <div className="space-y-4">
      {/* Category chips inside sheet */}
      <div>
        <label className="text-sm font-medium mb-2 block">Categorie</label>
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border-0",
              !filters.category
                ? "gradient-primary text-white shadow-ava-sm"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
            onClick={() => onChange({ ...filters, category: "" })}
          >
            Toate
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border-0",
                filters.category === c.value
                  ? "gradient-primary text-white shadow-ava-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
              onClick={() => onChange({ ...filters, category: c.value })}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Sezon</label>
        <Select
          value={filters.season}
          onValueChange={(v) => onChange({ ...filters, season: !v || v === "all" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toate sezoanele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate sezoanele</SelectItem>
            {SEASONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Formalitate</label>
        <Select
          value={filters.formality}
          onValueChange={(v) => onChange({ ...filters, formality: !v || v === "all" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Orice formalitate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Orice formalitate</SelectItem>
            {FORMALITY.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() =>
            onChange({ search: filters.search, category: "", season: "", formality: "" })
          }
        >
          <X className="h-4 w-4 mr-2" />
          Resetează filtrele
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută haine..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Desktop season filter */}
        <div className="hidden md:flex items-center gap-2">
          <Select
            value={filters.season || "all"}
            onValueChange={(v) => onChange({ ...filters, season: !v || v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sezon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              {SEASONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile filter button */}
        <Sheet>
          <SheetTrigger>
            <Button variant="outline" size="icon" className="md:hidden relative">
              <SlidersHorizontal className="h-4 w-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtre</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category chips — visible on all screen sizes */}
      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        <button
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border-0",
            !filters.category
              ? "gradient-primary text-white shadow-ava-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
          onClick={() => onChange({ ...filters, category: "" })}
        >
          Toate
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border-0",
              filters.category === c.value
                ? "gradient-primary text-white shadow-ava-sm"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
            onClick={() => onChange({ ...filters, category: c.value })}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Active filters badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "piesă" : "piese"}
        </span>
        {filters.category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            {CATEGORIES.find((c) => c.value === filters.category)?.label}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onChange({ ...filters, category: "" })}
            />
          </span>
        )}
        {filters.season && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            {SEASONS.find((s) => s.value === filters.season)?.label}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onChange({ ...filters, season: "" })}
            />
          </span>
        )}
        {filters.formality && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            {FORMALITY.find((f) => f.value === filters.formality)?.label}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onChange({ ...filters, formality: "" })}
            />
          </span>
        )}
      </div>
    </div>
  );
}
