"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Star, Shirt, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface OutfitWear {
  id: string;
  wornAt: string;
  occasion: string | null;
  weather: string | null;
  rating: number | null;
  feedback: string | null;
}

interface OutfitItem {
  id: string;
  clothingItem: {
    id: string;
    name: string;
    category: string;
    colorPrimary: string;
    imagePath: string | null;
  };
}

interface Outfit {
  id: string;
  name: string;
  occasion: string | null;
  aiGenerated: boolean;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  outfitItems: OutfitItem[];
  outfitWears: OutfitWear[];
}

export default function HistoryPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/outfits")
      .then((r) => r.json())
      .then(setOutfits)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalWears = outfits.reduce(
    (sum, o) => sum + o.outfitWears.length,
    0
  );
  const avgRating = (() => {
    const ratings = outfits
      .flatMap((o) => o.outfitWears)
      .filter((w) => w.rating)
      .map((w) => w.rating!);
    return ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Istoric ținute</h1>
        <p className="text-muted-foreground">
          Toate ținutele tale salvate și purtate
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <Shirt className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-2xl font-bold">{outfits.length}</span>
            <span className="text-xs text-muted-foreground">Ținute</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <Clock className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-2xl font-bold">{totalWears}</span>
            <span className="text-xs text-muted-foreground">Purtări</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <Star className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-2xl font-bold">{avgRating || "-"}</span>
            <span className="text-xs text-muted-foreground">Rating mediu</span>
          </CardContent>
        </Card>
      </div>

      {outfits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nicio ținută salvată</h3>
            <p className="text-muted-foreground text-center">
              Cere asistentului AI o recomandare și salvează ținutele care
              îți plac
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {outfits.map((outfit) => (
            <Card key={outfit.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{outfit.name}</CardTitle>
                    <CardDescription>
                      {new Date(outfit.createdAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {outfit.occasion && ` - ${outfit.occasion}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {outfit.aiGenerated && (
                      <Badge variant="secondary">AI</Badge>
                    )}
                    {outfit.rating && (
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {outfit.rating}/5
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Outfit items */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {outfit.outfitItems.map((oi) => (
                    <div
                      key={oi.id}
                      className="flex-shrink-0 w-20 text-center"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden border">
                        {oi.clothingItem.imagePath ? (
                          <img
                            src={oi.clothingItem.imagePath}
                            alt={oi.clothingItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              backgroundColor: oi.clothingItem.colorPrimary,
                            }}
                          >
                            <Shirt className="h-6 w-6 text-white/50" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs mt-1 truncate">
                        {oi.clothingItem.name}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Wear history */}
                {outfit.outfitWears.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Istoric purtare
                      </p>
                      {outfit.outfitWears.map((wear) => (
                        <div
                          key={wear.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {new Date(wear.wornAt).toLocaleDateString("ro-RO")}
                            {wear.occasion && ` - ${wear.occasion}`}
                          </span>
                          {wear.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{wear.rating}/5</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {outfit.notes && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-sm text-muted-foreground">
                      {outfit.notes}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
