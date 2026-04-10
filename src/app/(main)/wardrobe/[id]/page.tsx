"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Heart,
  Shirt,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORIES,
  SUBCATEGORIES,
  PATTERNS,
  SEASONS,
  FORMALITY,
  CONDITIONS,
  COLORS,
} from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  size: string | null;
  colorPrimary: string;
  colorSecondary: string | null;
  pattern: string | null;
  material: string | null;
  brand: string | null;
  season: string | null;
  formality: string | null;
  condition: string | null;
  imagePath: string | null;
  tags: string | null;
  favorite: boolean;
  createdAt: string;
}

export default function ClothingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ClothingItem>>({});

  useEffect(() => {
    fetch(`/api/clothes/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setItem(data);
        setEditForm(data);
      })
      .catch(() => router.push("/wardrobe"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/clothes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setItem(updated);
      setEditing(false);
      toast.success("Salvat!");
    } else {
      toast.error("Eroare la salvare");
    }
    setSaving(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/clothes/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Haină ștearsă");
      router.push("/wardrobe");
    }
  }

  async function toggleFavorite() {
    if (!item) return;
    const res = await fetch(`/api/clothes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: !item.favorite }),
    });
    if (res.ok) {
      setItem({ ...item, favorite: !item.favorite });
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-square max-w-sm rounded-xl" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!item) return null;

  const categoryLabel = CATEGORIES.find((c) => c.value === item.category)?.label;
  const patternLabel = PATTERNS.find((p) => p.value === item.pattern)?.label;
  const seasonLabel = SEASONS.find((s) => s.value === item.season)?.label;
  const formalityLabel = FORMALITY.find((f) => f.value === item.formality)?.label;
  const conditionLabel = CONDITIONS.find((c) => c.value === item.condition)?.label;
  const tags = item.tags ? JSON.parse(item.tags) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFavorite}>
            <Heart
              className={cn(
                "h-5 w-5",
                item.favorite && "fill-red-500 text-red-500"
              )}
            />
          </Button>
          {!editing && (
            <Button variant="outline" size="icon" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Dialog>
            <DialogTrigger>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmare ștergere</DialogTitle>
                <DialogDescription>
                  Ești sigur(ă) că vrei să ștergi &quot;{item.name}&quot;? Acțiunea
                  nu poate fi anulată.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete}>
                  Șterge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Image */}
      <div className="rounded-xl overflow-hidden border">
        {item.imagePath ? (
          <img
            src={item.imagePath}
            alt={item.name}
            className="w-full max-h-[400px] object-contain bg-muted"
          />
        ) : (
          <div
            className="w-full h-64 flex items-center justify-center"
            style={{ backgroundColor: item.colorPrimary }}
          >
            <Shirt className="h-16 w-16 text-white/50" />
          </div>
        )}
      </div>

      {editing ? (
        /* Edit Mode */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Editare
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setEditForm(item);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Anulează
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Salvează
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nume</Label>
              <Input
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, category: v ?? "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mărime</Label>
                <Input
                  value={editForm.size || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, size: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Culoare principală</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setEditForm({ ...editForm, colorPrimary: c.value })
                    }
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      editForm.colorPrimary === c.value
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sezon</Label>
                <Select
                  value={editForm.season || "all"}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, season: v ?? "all" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formalitate</Label>
                <Select
                  value={editForm.formality || "casual"}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, formality: v ?? "casual" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMALITY.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stare</Label>
                <Select
                  value={editForm.condition || "good"}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, condition: v ?? "good" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={editForm.brand || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, brand: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Input
                  value={editForm.material || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, material: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge>{categoryLabel}</Badge>
              {item.subcategory && (
                <Badge variant="secondary">
                  {SUBCATEGORIES[item.category]?.find(
                    (s) => s.value === item.subcategory
                  )?.label || item.subcategory}
                </Badge>
              )}
              <div
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: item.colorPrimary }}
              />
              {item.brand && (
                <Badge variant="outline">{item.brand}</Badge>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="grid grid-cols-2 gap-4 py-4">
              {item.size && (
                <div>
                  <p className="text-sm text-muted-foreground">Mărime</p>
                  <p className="font-medium">{item.size}</p>
                </div>
              )}
              {patternLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">Pattern</p>
                  <p className="font-medium">{patternLabel}</p>
                </div>
              )}
              {item.material && (
                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <p className="font-medium">{item.material}</p>
                </div>
              )}
              {seasonLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">Sezon</p>
                  <p className="font-medium">{seasonLabel}</p>
                </div>
              )}
              {formalityLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">Formalitate</p>
                  <p className="font-medium">{formalityLabel}</p>
                </div>
              )}
              {conditionLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">Stare</p>
                  <p className="font-medium">{conditionLabel}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
