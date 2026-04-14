# Garderoba — Design System

Decizii de design active. Referință pentru orice modificare UI viitoare.

---

## Persona system

Două asistente AI cu identitate vizuală separată:

| | **Ava** (feminin) | **Adam** (masculin) |
|---|---|---|
| Activare | default | `NEXT_PUBLIC_PERSONA_ADAM_ENABLED=true` + `user.sex === "male"` |
| Palette | lavender + teal | navy + cognac/gold |
| Font heading | Playfair Display (italic) | Cormorant Garamond |
| Dark mode | nu există | suportat (`themeVariant` din DB) |
| CSS selector | `:root` | `[data-persona="adam"]` / `[data-persona="adam"].dark` |

---

## Ava — Palette

Light only. Culoarea e parte din identitatea brandului.

| Token CSS | Valoare | Utilizare |
|---|---|---|
| `--primary` | `oklch(0.59 0.21 293)` | violet lavender — acțiuni principale |
| `--secondary` | `oklch(0.70 0.14 185)` | teal/mint — elemente AI |
| `--background` | `oklch(0.985 0.008 300)` | fundal alb cu nuanță lavender |
| `--card` | `oklch(1 0 0)` | carduri pure white |
| `--muted` | `oklch(0.96 0.015 300)` | fundal muted lavender |
| `--muted-foreground` | `oklch(0.50 0.05 300)` | text secundar |
| `--border` | `oklch(0.91 0.02 300)` | borduri subtile |
| `--radius` | `0.875rem` | border radius de bază |

**Gradiente:**
```css
.gradient-primary  → oklch(0.59 0.21 293) → oklch(0.70 0.18 293)  /* violet */
.gradient-teal     → oklch(0.70 0.14 185) → oklch(0.78 0.12 185)  /* teal AI */
.gradient-hero     → lavender pal (fundal hero card dashboard)
.gradient-hero-banner → violet → teal (banner plin)
```

**Umbre:**
```css
.shadow-ava-sm  → 0 2px 8px oklch(0.59 0.21 293 / 0.08)
.shadow-ava     → 0 4px 20px oklch(0.59 0.21 293 / 0.12)
.shadow-ava-lg  → 0 8px 32px oklch(0.59 0.21 293 / 0.18)
```

---

## Adam — Palette

### Light mode
| Token | Valoare | Utilizare |
|---|---|---|
| `--primary` | `oklch(0.25 0.06 250)` | navy profund |
| `--secondary` | `oklch(0.55 0.10 60)` | cognac/gold |
| `--background` | `oklch(0.975 0.005 240)` | alb cu nuanță albastră |
| `--sidebar` | `oklch(0.97 0.005 240)` | sidebar alb/gri deschis |
| `--radius` | `0.5rem` | colțuri mai puțin rotunjite (masculin) |

### Dark mode (`.dark` pe outer div)
| Token | Valoare | Utilizare |
|---|---|---|
| `--background` | `oklch(0.12 0.03 250)` | navy închis |
| `--card` | `oklch(0.16 0.04 250)` | card navy |
| `--sidebar` | `oklch(0.20 0.05 250)` | sidebar navy închis |
| `--sidebar-primary` | `oklch(0.55 0.10 60)` | accent cognac/gold |

---

## Tipografie

| Font | CSS var | Utilizare |
|---|---|---|
| **Playfair Display** | `--font-heading` (Ava) | H1–H3, italic, tone editorial |
| **Cormorant Garamond** | `--font-heading-adam` | H1–H3 pentru Adam |
| **Geist / system sans** | `--font-sans` | body, labels, butoane, nav |

Regulă: `h1, h2, h3` folosesc `font-family: var(--font-heading)`. Clasa `.font-heading` aplică același font pe orice element.

---

## Layout

### Desktop (≥768px)
- Sidebar stânga 256px fixed (`md:pl-64` pe main)
- Conținut: `max-w-2xl mx-auto`, padding `p-4 md:p-6`

### Mobil
- Bottom navigation cu 5 tab-uri: Acasă | Garderobă | + | AI | Profil
- Header minimal cu titlu pagină
- Padding bottom `pb-20` pentru a evita suprapunerea cu nav-ul

---

## Dashboard — concept editorial

**"Ediția ta de azi"** — fiecare zi e un număr nou al revistei tale personale.

Structura paginii:
1. Header cu data curentă (uppercase, tracking wide)
2. Hero card cu gradient + CTA principal ("Ce porți azi?")
3. Stats row: 3 carduri (Piese / Favorite / Ținute)
4. Acțiuni rapide: grid 2×2
5. Recent adăugate: grid imagini haine

---

## Componente — convenții

**Carduri:** `bg-card rounded-2xl border border-border/50 shadow-ava-sm`  
Hover: `hover:shadow-ava hover:-translate-y-0.5 transition-all duration-200`

**Butoane primare:** `rounded-full gradient-primary text-white border-0 shadow-ava`

**Butoane pill cu icon:** `rounded-full px-6 hover:opacity-90 transition-opacity`

**Labels secțiuni:** `text-[10px] uppercase tracking-widest text-muted-foreground font-semibold`

**Carduri culoare per categorie** (în lipsa imaginii):
| Categorie | Gradient |
|---|---|
| Rochii | violet → lavender |
| Bluze/Topuri | teal → mint |
| Pantaloni | lilac → purple |
| Jachete | blush → roz |
| Accesorii | gold → amber |
| Pantofi | sage → green |

---

## Culori categorii vestimentare (coding în JS/CSS)

```ts
// src/lib/constants.ts conține CATEGORIES_AVA și CATEGORIES_ADAM
// getCategories(sex) returnează lista corectă per persona
```
