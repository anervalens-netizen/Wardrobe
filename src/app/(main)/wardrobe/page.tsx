"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PlusCircle, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClothingCard } from "@/components/wardrobe/clothing-card";
import { ClothingFilters } from "@/components/wardrobe/clothing-filters";
import { getCategories } from "@/lib/constants";
import { toast } from "sonner";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  colorPrimary: string;
  colorSecondary: string | null;
  pattern: string | null;
  formality: string | null;
  season: string | null;
  imagePath: string | null;
  favorite: boolean;
}

export default function WardrobePage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    season: "",
    formality: "",
  });

  const userSex = session?.user?.sex;
  const categories = getCategories(userSex);

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.season) params.set("season", filters.season);
    if (filters.formality) params.set("formality", filters.formality);

    const res = await fetch(`/api/clothes?${params}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeout);
  }, [fetchItems]);

  async function toggleFavorite(id: string, favorite: boolean) {
    await fetch(`/api/clothes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite }),
    });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite } : item))
    );
    toast.success(favorite ? "Adăugat la favorite" : "Scos de la favorite");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Garderoba</h1>
          <p className="text-muted-foreground">Toate hainele tale într-un loc</p>
        </div>
        <Link href="/add-item">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adaugă
          </Button>
        </Link>
      </div>

      <ClothingFilters
        filters={filters}
        onChange={setFilters}
        totalCount={items.length}
        sex={userSex}
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onToggleFavorite={toggleFavorite}
              categories={categories}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Shirt className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filters.search || filters.category
              ? "Niciun rezultat"
              : "Garderoba e goală"}
          </h3>
          <p className="text-muted-foreground text-center mb-4">
            {filters.search || filters.category
              ? "Încearcă alte filtre"
              : "Adaugă prima ta haină"}
          </p>
          {!filters.search && !filters.category && (
            <Link href="/add-item">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adaugă haină
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
