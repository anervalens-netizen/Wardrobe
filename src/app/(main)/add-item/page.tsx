"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCategories,
  SUBCATEGORIES,
  PATTERNS,
  SEASONS,
  FORMALITY,
  CONDITIONS,
  COLORS,
} from "@/lib/constants";
import { toast } from "sonner";

export default function AddItemPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userSex = session?.user?.sex;
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    size: "",
    colorPrimary: "#000000",
    colorSecondary: "",
    pattern: "solid",
    material: "",
    brand: "",
    season: "all",
    formality: "casual",
    condition: "good",
    tags: "",
  });

  function updateForm(field: string, value: string | null) {
    const val = value || "";
    setForm((prev) => ({ ...prev, [field]: val }));
    if (field === "category") {
      setForm((prev) => ({ ...prev, [field]: val, subcategory: "" }));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      setImagePath(data.path);
    } else {
      toast.error(data.error);
      setImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category || !form.colorPrimary) {
      toast.error("Completează câmpurile obligatorii");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imagePath: imagePath ?? undefined,
          tags: form.tags
            ? JSON.stringify(form.tags.split(",").map((t) => t.trim()))
            : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Haină adăugată cu succes!");
        router.push("/wardrobe");
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Eroare la salvare");
    } finally {
      setLoading(false);
    }
  }

  const subcategories = SUBCATEGORIES[form.category] || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Adaugă haină</h1>
        <p className="text-muted-foreground">
          Completează detaliile și adaugă o poză
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Poză</CardTitle>
            <CardDescription>Adaugă o fotografie cu haina</CardDescription>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="relative w-full max-w-xs mx-auto">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImagePath(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click pentru a încărca o poză
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPG, PNG sau WebP, max 5MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informații de bază</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nume *</Label>
              <Input
                id="name"
                placeholder="ex: Cămașă albastră Zara"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categorie *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => updateForm("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alege categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategories(userSex).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategorie</Label>
                  <Select
                    value={form.subcategory}
                    onValueChange={(v) => updateForm("subcategory", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alege" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="ex: Zara"
                  value={form.brand}
                  onChange={(e) => updateForm("brand", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Mărime</Label>
                <Input
                  id="size"
                  placeholder="ex: M, 42, 38"
                  value={form.size}
                  onChange={(e) => updateForm("size", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aspect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Culoare principală *</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => updateForm("colorPrimary", c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.colorPrimary === c.value
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Select
                  value={form.pattern}
                  onValueChange={(v) => updateForm("pattern", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATTERNS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  placeholder="ex: Bumbac, Polyester"
                  value={form.material}
                  onChange={(e) => updateForm("material", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalii</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sezon</Label>
                <Select
                  value={form.season}
                  onValueChange={(v) => updateForm("season", v)}
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
                  value={form.formality}
                  onValueChange={(v) => updateForm("formality", v)}
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
                  value={form.condition}
                  onValueChange={(v) => updateForm("condition", v)}
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

            <div className="space-y-2">
              <Label htmlFor="tags">Etichete</Label>
              <Textarea
                id="tags"
                placeholder="ex: lucru, weekend, sport (separate prin virgulă)"
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Anulează
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvează
          </Button>
        </div>
      </form>
    </div>
  );
}
