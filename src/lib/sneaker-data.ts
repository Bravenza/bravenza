// Dados de marcas e modelos de tênis para seletores

export interface BrandOption {
  value: string;
  label: string;
}

export interface ModelOption {
  value: string;
  label: string;
}

export const SNEAKER_BRANDS: BrandOption[] = [
  { value: "nike", label: "Nike" },
  { value: "jordan", label: "Jordan" },
  { value: "adidas", label: "Adidas" },
  { value: "new-balance", label: "New Balance" },
  { value: "yeezy", label: "Yeezy" },
  { value: "puma", label: "Puma" },
  { value: "asics", label: "Asics" },
  { value: "reebok", label: "Reebok" },
  { value: "converse", label: "Converse" },
  { value: "vans", label: "Vans" },
  { value: "under-armour", label: "Under Armour" },
  { value: "salomon", label: "Salomon" },
  { value: "balenciaga", label: "Balenciaga" },
  { value: "gucci", label: "Gucci" },
  { value: "louis-vuitton", label: "Louis Vuitton" },
  { value: "off-white", label: "Off-White" },
  { value: "fear-of-god", label: "Fear of God" },
  { value: "other", label: "Outro" },
];

export const MODELS_BY_BRAND: Record<string, ModelOption[]> = {
  nike: [
    { value: "air-force-1", label: "Air Force 1" },
    { value: "air-max-1", label: "Air Max 1" },
    { value: "air-max-90", label: "Air Max 90" },
    { value: "air-max-95", label: "Air Max 95" },
    { value: "air-max-97", label: "Air Max 97" },
    { value: "air-max-plus", label: "Air Max Plus (TN)" },
    { value: "dunk-low", label: "Dunk Low" },
    { value: "dunk-high", label: "Dunk High" },
    { value: "sb-dunk-low", label: "SB Dunk Low" },
    { value: "sb-dunk-high", label: "SB Dunk High" },
    { value: "blazer-mid", label: "Blazer Mid" },
    { value: "blazer-low", label: "Blazer Low" },
    { value: "cortez", label: "Cortez" },
    { value: "vapormax", label: "VaporMax" },
    { value: "zoom-vomero", label: "Zoom Vomero" },
    { value: "pegasus", label: "Pegasus" },
    { value: "other", label: "Outro" },
  ],
  jordan: [
    { value: "air-jordan-1-low", label: "Air Jordan 1 Low" },
    { value: "air-jordan-1-mid", label: "Air Jordan 1 Mid" },
    { value: "air-jordan-1-high", label: "Air Jordan 1 High OG" },
    { value: "air-jordan-2", label: "Air Jordan 2" },
    { value: "air-jordan-3", label: "Air Jordan 3" },
    { value: "air-jordan-4", label: "Air Jordan 4" },
    { value: "air-jordan-5", label: "Air Jordan 5" },
    { value: "air-jordan-6", label: "Air Jordan 6" },
    { value: "air-jordan-11", label: "Air Jordan 11" },
    { value: "air-jordan-12", label: "Air Jordan 12" },
    { value: "air-jordan-13", label: "Air Jordan 13" },
    { value: "jordan-travis-scott", label: "Jordan x Travis Scott" },
    { value: "other", label: "Outro" },
  ],
  adidas: [
    { value: "superstar", label: "Superstar" },
    { value: "stan-smith", label: "Stan Smith" },
    { value: "gazelle", label: "Gazelle" },
    { value: "samba", label: "Samba" },
    { value: "campus", label: "Campus" },
    { value: "forum-low", label: "Forum Low" },
    { value: "forum-high", label: "Forum High" },
    { value: "ultraboost", label: "Ultraboost" },
    { value: "nmd", label: "NMD" },
    { value: "ozweego", label: "Ozweego" },
    { value: "response-cl", label: "Response CL" },
    { value: "other", label: "Outro" },
  ],
  yeezy: [
    { value: "yeezy-350-v2", label: "Yeezy Boost 350 V2" },
    { value: "yeezy-500", label: "Yeezy 500" },
    { value: "yeezy-700", label: "Yeezy Boost 700" },
    { value: "yeezy-700-v3", label: "Yeezy 700 V3" },
    { value: "yeezy-slide", label: "Yeezy Slide" },
    { value: "yeezy-foam-runner", label: "Yeezy Foam Runner" },
    { value: "yeezy-450", label: "Yeezy 450" },
    { value: "other", label: "Outro" },
  ],
  "new-balance": [
    { value: "nb-550", label: "550" },
    { value: "nb-574", label: "574" },
    { value: "nb-990v3", label: "990v3" },
    { value: "nb-990v4", label: "990v4" },
    { value: "nb-990v5", label: "990v5" },
    { value: "nb-990v6", label: "990v6" },
    { value: "nb-992", label: "992" },
    { value: "nb-993", label: "993" },
    { value: "nb-2002r", label: "2002R" },
    { value: "nb-1906r", label: "1906R" },
    { value: "nb-530", label: "530" },
    { value: "other", label: "Outro" },
  ],
  puma: [
    { value: "suede", label: "Suede" },
    { value: "rs-x", label: "RS-X" },
    { value: "cali", label: "Cali" },
    { value: "palermo", label: "Palermo" },
    { value: "speedcat", label: "Speedcat" },
    { value: "other", label: "Outro" },
  ],
  asics: [
    { value: "gel-lyte-iii", label: "Gel-Lyte III" },
    { value: "gel-lyte-v", label: "Gel-Lyte V" },
    { value: "gel-kayano-14", label: "Gel-Kayano 14" },
    { value: "gel-nyc", label: "Gel-NYC" },
    { value: "gel-1130", label: "Gel-1130" },
    { value: "other", label: "Outro" },
  ],
  reebok: [
    { value: "club-c", label: "Club C 85" },
    { value: "classic-leather", label: "Classic Leather" },
    { value: "instapump-fury", label: "Instapump Fury" },
    { value: "question-mid", label: "Question Mid" },
    { value: "other", label: "Outro" },
  ],
  converse: [
    { value: "chuck-70-low", label: "Chuck 70 Low" },
    { value: "chuck-70-high", label: "Chuck 70 High" },
    { value: "chuck-taylor-low", label: "Chuck Taylor All Star Low" },
    { value: "chuck-taylor-high", label: "Chuck Taylor All Star High" },
    { value: "one-star", label: "One Star" },
    { value: "other", label: "Outro" },
  ],
  vans: [
    { value: "old-skool", label: "Old Skool" },
    { value: "sk8-hi", label: "Sk8-Hi" },
    { value: "authentic", label: "Authentic" },
    { value: "era", label: "Era" },
    { value: "slip-on", label: "Slip-On" },
    { value: "other", label: "Outro" },
  ],
  "under-armour": [
    { value: "curry-flow", label: "Curry Flow" },
    { value: "hovr", label: "HOVR" },
    { value: "other", label: "Outro" },
  ],
  salomon: [
    { value: "xt-6", label: "XT-6" },
    { value: "acs-pro", label: "ACS Pro" },
    { value: "speedcross", label: "Speedcross" },
    { value: "other", label: "Outro" },
  ],
  balenciaga: [
    { value: "track", label: "Track" },
    { value: "triple-s", label: "Triple S" },
    { value: "speed-trainer", label: "Speed Trainer" },
    { value: "defender", label: "Defender" },
    { value: "other", label: "Outro" },
  ],
  gucci: [
    { value: "rhyton", label: "Rhyton" },
    { value: "ace", label: "Ace" },
    { value: "screener", label: "Screener" },
    { value: "other", label: "Outro" },
  ],
  "louis-vuitton": [
    { value: "lv-trainer", label: "LV Trainer" },
    { value: "lv-skate", label: "LV Skate" },
    { value: "lv-archlight", label: "Archlight" },
    { value: "other", label: "Outro" },
  ],
  "off-white": [
    { value: "out-of-office", label: "Out of Office" },
    { value: "odsy-1000", label: "Odsy-1000" },
    { value: "vulc", label: "Vulcanized" },
    { value: "other", label: "Outro" },
  ],
  "fear-of-god": [
    { value: "essentials", label: "Essentials" },
    { value: "athletics", label: "Athletics" },
    { value: "other", label: "Outro" },
  ],
};

export function getModelsForBrand(brandValue: string): ModelOption[] {
  if (brandValue === "other" || !brandValue) {
    return [{ value: "other", label: "Outro" }];
  }
  return MODELS_BY_BRAND[brandValue] || [{ value: "other", label: "Outro" }];
}

export function getBrandLabel(value: string): string {
  const brand = SNEAKER_BRANDS.find((b) => b.value === value);
  return brand?.label || value;
}

export function getModelLabel(brandValue: string, modelValue: string): string {
  const models = getModelsForBrand(brandValue);
  const model = models.find((m) => m.value === modelValue);
  return model?.label || modelValue;
}

// Encontrar a key da marca a partir do label
export function findBrandKey(brandLabel: string | null | undefined): string {
  if (!brandLabel) return "";
  const normalizedLabel = brandLabel.toLowerCase().trim();
  const brand = SNEAKER_BRANDS.find(
    (b) => b.label.toLowerCase() === normalizedLabel || b.value === normalizedLabel
  );
  return brand?.value || "other";
}

// Encontrar a key do modelo a partir do label e marca
export function findModelKey(brandKey: string, modelLabel: string | null | undefined): string {
  if (!modelLabel || !brandKey) return "";
  const models = getModelsForBrand(brandKey);
  const normalizedLabel = modelLabel.toLowerCase().trim();
  const model = models.find(
    (m) => m.label.toLowerCase() === normalizedLabel || m.value === normalizedLabel
  );
  return model?.value || "other";
}
