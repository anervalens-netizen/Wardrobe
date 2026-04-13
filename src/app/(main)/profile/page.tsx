"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, User, Moon, Sun } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BODY_TYPES,
  SKIN_TONES,
  STYLE_PREFERENCES,
  COLORS,
} from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RerunOnboardingButton } from "@/components/onboarding/rerun-onboarding-button";

const AGE_BANDS = [
  { value: "under_25", label: "Sub 25 ani" },
  { value: "25_34", label: "25–34 ani" },
  { value: "35_44", label: "35–44 ani" },
  { value: "45_54", label: "45–54 ani" },
  { value: "55_plus", label: "55+ ani" },
];

const SEX_OPTIONS = [
  { value: "female", label: "Feminin" },
  { value: "male", label: "Masculin" },
];

interface Profile {
  name: string | null;
  sex: string | null;
  ageBand: string | null;
  themeVariant: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyType: string | null;
  skinTone: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  favoriteColors: string | null;
  avoidColors: string | null;
  stylePreferences: string | null;
  notes: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const isAdam =
    process.env.NEXT_PUBLIC_PERSONA_ADAM_ENABLED === "true" &&
    session?.user?.sex === "male";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favColors, setFavColors] = useState<string[]>([]);
  const [avoidColors, setAvoidColors] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile(data);
          setFavColors(data.favoriteColors ? JSON.parse(data.favoriteColors) : []);
          setAvoidColors(data.avoidColors ? JSON.parse(data.avoidColors) : []);
          setStyles(data.stylePreferences ? JSON.parse(data.stylePreferences) : []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleColor(
    color: string,
    list: string[],
    setList: (v: string[]) => void
  ) {
    if (list.includes(color)) {
      setList(list.filter((c) => c !== color));
    } else {
      setList([...list, color]);
    }
  }

  function toggleStyle(style: string) {
    if (styles.includes(style)) {
      setStyles(styles.filter((s) => s !== style));
    } else {
      setStyles([...styles, style]);
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        favoriteColors: JSON.stringify(favColors),
        avoidColors: JSON.stringify(avoidColors),
        stylePreferences: JSON.stringify(styles),
      }),
    });

    if (res.ok) {
      toast.success("Profil salvat!");
      // Reload so the server layout can re-read themeVariant and apply/remove dark class
      window.location.reload();
    } else {
      toast.error("Eroare la salvare");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profil</h1>
          <p className="text-muted-foreground">
            Completează profilul pentru recomandări mai bune
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvează
        </Button>
      </div>

      {/* Personal Info — from onboarding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            Informații personale
          </CardTitle>
          <CardDescription>
            Date completate în timpul onboarding-ului
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nume preferat</Label>
            <Input
              placeholder="ex: Maria"
              value={profile?.name || ""}
              onChange={(e) => setProfile({ ...profile!, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gen</Label>
              <Select
                value={profile?.sex || ""}
                onValueChange={(v) => setProfile({ ...profile!, sex: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alege" />
                </SelectTrigger>
                <SelectContent>
                  {SEX_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupă de vârstă</Label>
              <Select
                value={profile?.ageBand || ""}
                onValueChange={(v) => setProfile({ ...profile!, ageBand: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alege" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_BANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informații fizice</CardTitle>
          <CardDescription>
            Ajută asistentul să facă recomandări potrivite corpului tău
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Înălțime (cm)</Label>
              <Input
                type="number"
                placeholder="ex: 175"
                value={profile?.heightCm || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile!,
                    heightCm: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Greutate (kg)</Label>
              <Input
                type="number"
                placeholder="ex: 70"
                value={profile?.weightKg || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile!,
                    weightKg: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tip corp</Label>
              <Select
                value={profile?.bodyType || ""}
                onValueChange={(v) =>
                  setProfile({ ...profile!, bodyType: v ?? "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alege" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ton piele</Label>
              <Select
                value={profile?.skinTone || ""}
                onValueChange={(v) =>
                  setProfile({ ...profile!, skinTone: v ?? "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alege" />
                </SelectTrigger>
                <SelectContent>
                  {SKIN_TONES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Culoare păr</Label>
              <Input
                placeholder="ex: Șaten, Blond"
                value={profile?.hairColor || ""}
                onChange={(e) =>
                  setProfile({ ...profile!, hairColor: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Culoare ochi</Label>
              <Input
                placeholder="ex: Căprui, Verzi"
                value={profile?.eyeColor || ""}
                onChange={(e) =>
                  setProfile({ ...profile!, eyeColor: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferințe de stil</CardTitle>
          <CardDescription>
            Ce stiluri te reprezintă? Selectează toate care ți se potrivesc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STYLE_PREFERENCES.map((s) => (
              <Badge
                key={s.value}
                variant={styles.includes(s.value) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors py-1.5 px-3",
                  styles.includes(s.value) && "bg-primary"
                )}
                onClick={() => toggleStyle(s.value)}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Culori favorite</CardTitle>
          <CardDescription>Culorile pe care le preferi la haine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleColor(c.value, favColors, setFavColors)}
                className={cn(
                  "w-9 h-9 rounded-full border-2 transition-all",
                  favColors.includes(c.value)
                    ? "border-primary ring-2 ring-primary/30 scale-110"
                    : "border-border hover:scale-105"
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Colors to Avoid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Culori de evitat</CardTitle>
          <CardDescription>Culorile care nu ți se potrivesc</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() =>
                  toggleColor(c.value, avoidColors, setAvoidColors)
                }
                className={cn(
                  "w-9 h-9 rounded-full border-2 transition-all",
                  avoidColors.includes(c.value)
                    ? "border-destructive ring-2 ring-destructive/30 scale-110"
                    : "border-border hover:scale-105"
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note adiționale</CardTitle>
          <CardDescription>
            Orice altceva vrei să știe asistentul despre preferințele tale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="ex: Prefer ținute lejere, nu-mi place să port cravată, am nevoie de haine practice pentru birou..."
            rows={4}
            value={profile?.notes || ""}
            onChange={(e) =>
              setProfile({ ...profile!, notes: e.target.value })
            }
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvează profilul
      </Button>

      {/* Theme toggle — Adam only */}
      {isAdam && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temă vizuală</CardTitle>
            <CardDescription>Alege între modul luminos și întunecat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={profile?.themeVariant !== "dark" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setProfile({ ...profile!, themeVariant: "light" })}
              >
                <Sun className="h-4 w-4" />
                Luminos
              </Button>
              <Button
                variant={profile?.themeVariant === "dark" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setProfile({ ...profile!, themeVariant: "dark" })}
              >
                <Moon className="h-4 w-4" />
                Întunecat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="mt-8 pt-6 border-t">
        <h2 className="font-semibold mb-2">AI Stylist</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Vorbește din nou cu stilistul tău dacă vrei să-ți actualizezi preferințele.
        </p>
        <RerunOnboardingButton />
      </section>
    </div>
  );
}
