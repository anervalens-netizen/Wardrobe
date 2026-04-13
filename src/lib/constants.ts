export const CATEGORIES = [
  { value: "tops", label: "Topuri" },
  { value: "bottoms", label: "Pantaloni / Fuste" },
  { value: "dresses", label: "Rochii / Salopete" },
  { value: "outerwear", label: "Geci / Paltoane" },
  { value: "shoes", label: "Încălțăminte" },
  { value: "accessories", label: "Accesorii" },
] as const;

export const CATEGORIES_ADAM = [
  { value: "costume", label: "Costume" },
  { value: "sacouri", label: "Sacouri & Blazere" },
  { value: "camasi", label: "Cămăși" },
  { value: "tricouri", label: "Tricouri & Polo" },
  { value: "pantaloni", label: "Pantaloni" },
  { value: "outerwear", label: "Outerwear" },
  { value: "pantofi", label: "Pantofi" },
  { value: "accesorii", label: "Accesorii" },
] as const;

export function getCategories(sex?: string | null) {
  return sex === "male" ? CATEGORIES_ADAM : CATEGORIES;
}

export const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  tops: [
    { value: "tricou", label: "Tricou" },
    { value: "camasa", label: "Cămașă" },
    { value: "bluza", label: "Bluză" },
    { value: "pulover", label: "Pulover" },
    { value: "hanorac", label: "Hanorac" },
    { value: "vesta", label: "Vestă" },
    { value: "maiou", label: "Maiou" },
  ],
  bottoms: [
    { value: "jeans", label: "Jeans" },
    { value: "pantaloni", label: "Pantaloni" },
    { value: "shorts", label: "Pantaloni scurți" },
    { value: "fusta", label: "Fustă" },
    { value: "leggings", label: "Colanti" },
  ],
  dresses: [
    { value: "rochie", label: "Rochie" },
    { value: "salopeta", label: "Salopetă" },
    { value: "compleu", label: "Compleu" },
  ],
  outerwear: [
    { value: "geaca", label: "Geacă" },
    { value: "palton", label: "Palton" },
    { value: "trenci", label: "Trenci" },
    { value: "blazer", label: "Blazer" },
    { value: "cardigan", label: "Cardigan" },
  ],
  shoes: [
    { value: "adidasi", label: "Adidași" },
    { value: "pantofi", label: "Pantofi" },
    { value: "cizme", label: "Cizme" },
    { value: "sandale", label: "Sandale" },
    { value: "balerini", label: "Balerini" },
    { value: "mocasini", label: "Mocasini" },
  ],
  accessories: [
    { value: "geanta", label: "Geantă" },
    { value: "curea", label: "Curea" },
    { value: "sapca", label: "Șapcă / Pălărie" },
    { value: "esarfa", label: "Eșarfă / Fular" },
    { value: "ceas", label: "Ceas" },
    { value: "bijuterie", label: "Bijuterie" },
    { value: "ochelari", label: "Ochelari" },
  ],
};

export const PATTERNS = [
  { value: "solid", label: "Uni / Solid" },
  { value: "striped", label: "Dungi" },
  { value: "plaid", label: "Carouri" },
  { value: "floral", label: "Floral" },
  { value: "dots", label: "Buline" },
  { value: "geometric", label: "Geometric" },
  { value: "abstract", label: "Abstract" },
  { value: "animal", label: "Animal print" },
] as const;

export const SEASONS = [
  { value: "all", label: "Toate sezoanele" },
  { value: "spring", label: "Primăvară" },
  { value: "summer", label: "Vară" },
  { value: "autumn", label: "Toamnă" },
  { value: "winter", label: "Iarnă" },
] as const;

export const FORMALITY = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart Casual" },
  { value: "business", label: "Business" },
  { value: "formal", label: "Formal" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "Nouă" },
  { value: "good", label: "Bună" },
  { value: "worn", label: "Uzată" },
  { value: "damaged", label: "Deteriorată" },
] as const;

export const BODY_TYPES = [
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Mediu" },
  { value: "curvy", label: "Curvy" },
  { value: "plus", label: "Plus size" },
] as const;

export const SKIN_TONES = [
  { value: "light", label: "Deschis" },
  { value: "medium", label: "Mediu" },
  { value: "olive", label: "Măsliniu" },
  { value: "dark", label: "Închis" },
] as const;

export const STYLE_PREFERENCES = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart Casual" },
  { value: "business", label: "Business" },
  { value: "formal", label: "Formal" },
  { value: "streetwear", label: "Streetwear" },
  { value: "bohemian", label: "Bohemian" },
  { value: "minimalist", label: "Minimalist" },
  { value: "sporty", label: "Sporty" },
  { value: "vintage", label: "Vintage" },
  { value: "elegant", label: "Elegant" },
] as const;

export const COLORS = [
  { value: "#000000", label: "Negru" },
  { value: "#FFFFFF", label: "Alb" },
  { value: "#808080", label: "Gri" },
  { value: "#000080", label: "Bleumarin" },
  { value: "#0000FF", label: "Albastru" },
  { value: "#87CEEB", label: "Bleu" },
  { value: "#FF0000", label: "Roșu" },
  { value: "#FFC0CB", label: "Roz" },
  { value: "#008000", label: "Verde" },
  { value: "#FFFF00", label: "Galben" },
  { value: "#FFA500", label: "Portocaliu" },
  { value: "#800080", label: "Mov" },
  { value: "#A52A2A", label: "Maro" },
  { value: "#F5F5DC", label: "Bej" },
  { value: "#C0C0C0", label: "Argintiu" },
  { value: "#FFD700", label: "Auriu" },
] as const;
