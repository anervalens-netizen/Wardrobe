# Ava — Design System Spec
**Data:** 2026-04-10  
**Status:** Aprobat de user (sesiune brainstorming)

---

## 1. Brand Identity

**Numele aplicației:** Ava  
**Tagline:** *Your personal AI stylist*  
**Public țintă:** Femei, 25–45 ani, interesate de modă și stil personal  
**Personalitate brand:** Elegantă, caldă, conversațională — ca un stilist personal de încredere, nu un tool rece

**Logo:** Umeraș auriu cu floare (fișier: `Img/logo.png`) — versiunea mare pentru splash/auth, versiunea mică pentru sidebar

---

## 2. Paleta de Culori

Tema este **exclusiv light** — nu există dark mode. Culoarea face parte din identitatea brandului.

### Culori principale

| Token | Valoare OKLCH | Utilizare |
|---|---|---|
| `--primary` | `oklch(0.55 0.18 300)` | Violet lavender — acțiuni principale, accente |
| `--primary-foreground` | `oklch(0.99 0 0)` | Text pe fundal primary |
| `--secondary` | `oklch(0.65 0.14 185)` | Teal/mint — accent secundar, AI elements |
| `--background` | `oklch(0.985 0.008 300)` | Fundal principal — alb cu nuanță lavender |
| `--card` | `oklch(1 0 0)` | Cards pure white |
| `--muted` | `oklch(0.96 0.015 300)` | Fundal muted — lavender ultra-pal |
| `--muted-foreground` | `oklch(0.52 0.04 300)` | Text secundar — gri-lavender |
| `--border` | `oklch(0.91 0.02 300)` | Borduri — lavender subtil |
| `--gold` | `#C9A84C` | Logo, elemente premium, highlights |

### Culori gradient (pentru tiles și hero)

```css
--gradient-primary: linear-gradient(135deg, #8B5CF6, #a78bfa);
--gradient-teal: linear-gradient(135deg, #14b8a6, #2dd4bf);
--gradient-lilac: linear-gradient(135deg, #c084fc, #d8b4fe);
--gradient-blush: linear-gradient(135deg, #f9a8d4, #fce7f3);
--gradient-hero: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 50%, #14b8a6 100%);
```

### Culori per categorie vestimentară

| Categorie | Gradient |
|---|---|
| Rochii | violet → lavender |
| Bluze/Topuri | teal → mint |
| Pantaloni | lilac → purple |
| Jachete/Paltoane | blush → roz |
| Accesorii | gold → amber |
| Pantofi | sage → green |

---

## 3. Tipografie

### Fonturi

| Font | Utilizare | Google Fonts |
|---|---|---|
| **DM Serif Display** | Titluri H1, H2, nume Ava, greeting | `DM+Serif+Display:ital@0;1` |
| **Nunito** | Tot restul: body, labels, butoane, nav | `Nunito:wght@300;400;600;700` |

### Scale tipografică

```css
/* Titluri — DM Serif Display */
--font-heading: 'DM Serif Display', serif;
h1 { font-size: 32px; font-style: italic; }     /* "Ava", pagini principale */
h2 { font-size: 24px; }                           /* Secțiuni, card titles */
h3 { font-size: 18px; }                           /* Subtitluri */

/* Corp — Nunito */
--font-body: 'Nunito', sans-serif;
body  { font-size: 15px; font-weight: 400; line-height: 1.6; }
.small { font-size: 13px; }
.label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
```

---

## 4. Componente UI

### Border Radius
Rotunjit generos — aplicația trebuie să simtă moale și prietenoas.

```css
--radius: 1rem;         /* cards, inputs */
--radius-sm: 0.625rem;  /* badges, chips */
--radius-lg: 1.25rem;   /* modal, sheets */
--radius-xl: 1.5rem;    /* hero sections */
--radius-full: 9999px;  /* butoane pill, avatare */
```

### Umbre
```css
--shadow-sm: 0 2px 8px rgba(139, 92, 246, 0.06);
--shadow-md: 0 4px 20px rgba(139, 92, 246, 0.10);
--shadow-lg: 0 8px 32px rgba(139, 92, 246, 0.15);
--shadow-glow: 0 0 0 4px rgba(139, 92, 246, 0.15);  /* focus/selected */
```

### Butoane

```
Primary pill:   bg gradient-primary, text white, rounded-full, shadow-md
Secondary:      bg muted, text primary, rounded-full
Ghost:          transparent, text muted-foreground, hover bg muted
AI button:      bg gradient-teal (culoarea AI Ava), text white
```

### Cards
- `bg-white`, `rounded-xl` (1.25rem), `shadow-sm`
- Hover: `translateY(-2px)`, `shadow-md`
- Selected/active: `ring-2 ring-primary shadow-glow`
- Fără border explicit — umbra definește conturul

---

## 5. Layout & Navigare

### Desktop (≥768px)
- **Sidebar stânga** 260px fixed
- Logo Ava (mic, auriu) + numele "Ava" în DM Serif Display italic
- Fundal sidebar: `--muted` (lavender ultra-pal)
- Link activ: `bg-primary/10 text-primary font-semibold`
- Link inactiv: `text-muted-foreground hover:bg-muted`
- Conținut principal: padding `1.5rem`, max-width `900px`

### Mobil (<768px)
- **Bottom navigation** cu 5 itemuri: Acasă | Garderobă | + (FAB) | Ava AI | Profil
- FAB central (buton `+`): gradient `--gradient-primary`, ridicat `-14px`, `shadow-glow`
- Fără header — logo apare pe pagina principală
- Bottom nav: `bg-white`, `border-top: 1px solid --border`, `shadow` în sus

---

## 6. Dashboard — Layout Editorial

Conceptul: **"Ediția ta de azi"** — fiecare zi e un număr nou al revistei tale personale de modă.

### Structura paginii (de sus în jos):

1. **Header minimal**
   - Stânga: logo Ava mic (auriu) + "Ava" în DM Serif italic
   - Dreapta: data curentă ("Joi, 10 Apr") în `--label` style
   - Pe mobil: fără sidebar, logoUl e în pagină

2. **Hero Card — "Ediția ta de azi"**
   - Fundal: `linear-gradient(180deg, #e9d5ff 0%, #f3eeff 100%)`
   - `border-radius: 1.5rem`, `padding: 2rem`
   - Text centrat:
     - Label: `EDIȚIA TA DE AZI` (uppercase, letter-spacing)
     - Titlu: *"Ce porți azi, [Prenume]?"* (DM Serif Display, italic, 24px)
     - Subtitlu: "Ava are 3 sugestii pentru vremea de azi" (Nunito, muted)
     - CTA: buton pill gradient primary `✦ Vezi sugestiile`

3. **Stats Row** — 3 cards orizontale
   - Piese | Favorite | Ținute
   - Număr în DM Serif Display, label în uppercase mic
   - Accent color primary pe număr

4. **Secțiunea "Recent adăugate"** — scroll orizontal pe mobil, grid pe desktop
   - Cards mici cu imagine/culoare + nume + categorie badge

5. **Secțiunea "Nepurtate"** (dacă există) — subtle reminder

---

## 7. Pagini individuale

### Login / Register
- Full screen background: gradient diagonal `#f3eeff → #e9d5ff → #ccfbf1`
- Card central cu `glassmorphism` ușor: `bg-white/80 backdrop-blur-sm`
- Logo mare (PNG auriu) centrat sus
- "Ava" în DM Serif Display, italic, 40px, culoare primary
- Tagline: *"Your personal AI stylist"* — Nunito, uppercase, letter-spacing
- Form curat cu labels flotante sau above

### Garderobă
- Grid: 2 coloane mobil / 3–4 desktop
- Fiecare card: imagine ocupă ~70% din card, badge categorie (colorat per categorie), hover lift
- Filtere: chips pill orizontal scroll (nu dropdown)
- Empty state: ilustrație elegantă + CTA

### Asistent Ava AI
- Chat interface cu două tipuri de bule:
  - User: `bg-primary text-white`, dreapta, rounded-full stil
  - Ava: `bg-muted`, stânga, cu avatar mic (iconița ✦ în gradient teal)
- Header: "✦ Ava" cu tagline "AI Stylist"
- Input area: input rotunjit, buton send gradient teal

### Adaugă haină
- Wizard pe pași: Foto → Detalii → Culori → Salvare
- Progress bar lavender
- Upload zone: dashed border lavender, drag & drop

### Profil
- Avatar mare cu gradient border
- Stats vizuale
- Setări stil personal (culori preferate, stil)

---

## 8. Animații & Micro-interacțiuni

- Card hover: `transform: translateY(-2px)` cu `transition: 0.2s ease`
- Butoane: `active:scale-95`
- Page transitions: fade subtil
- Skeleton loading: shimmer lavender (`#e9d5ff → #f3eeff`)
- FAB: `hover:scale-110`
- Toast notifications: Sonner cu culori brand

---

## 9. Fișiere de modificat

| Fișier | Schimbare |
|---|---|
| `src/app/globals.css` | Paleta completă OKLCH, fonturi, variabile custom |
| `src/app/layout.tsx` | Import DM Serif Display + Nunito din Google Fonts |
| `src/components/layout/sidebar.tsx` | Logo auriu, culori brand, styling nou |
| `src/components/layout/mobile-nav.tsx` | Bottom nav cu FAB central |
| `src/components/layout/header.tsx` | Header minimal editorial |
| `src/app/(main)/dashboard/page.tsx` | Layout editorial complet |
| `src/app/(auth)/login/page.tsx` | Full-screen cu gradient + glassmorphism |
| `src/app/(auth)/register/page.tsx` | Același stil ca login |
| `src/components/wardrobe/clothing-card.tsx` | Cards cu badge categorie + hover lift |
| `src/app/(main)/assistant/page.tsx` | Chat UI cu stilul Ava |
| `src/app/(main)/wardrobe/page.tsx` | Grid + filtre chips |

---

## 10. Faze de implementare (prioritate)

1. **Fundație** — `globals.css` (culori + fonturi) → impact imediat pe tot app-ul
2. **Navigare** — Sidebar desktop + Bottom nav mobil
3. **Dashboard** — Layout editorial complet
4. **Auth** — Login/Register cu full-screen design
5. **Garderobă** — Cards redesign + filtre chips
6. **Asistent** — Chat UI rebrand
7. **Adaugă haină** — Wizard redesign
8. **Polish** — Animații, micro-interacțiuni, empty states
