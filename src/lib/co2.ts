// SmartEco — CO2e avoidance model (mass x material emission factor).
// Factors from EPA WARM, against a Kigali open-dumpsite baseline.

const SHORT_TON_KG = 907.185;
const perShortTon = (mtco2e: number) => (mtco2e / SHORT_TON_KG) * 1000;

export const LANDFILL_BASELINE = "KIGALI_OPEN_DUMPSITE" as const;

export const MATERIAL_FACTORS: Record<string, number> = {
  PET: perShortTon(1.04 + 0.02),
  HDPE: perShortTon(0.76 + 0.02),
  PP: perShortTon(0.79 + 0.02),
  PLASTIC_OTHER: perShortTon(0.93 + 0.02),
  GLASS: perShortTon(0.28 + 0.04),
  ALUMINIUM: perShortTon(9.11 + 0.02),
  ELECTRONICS: 1.2125 - 0.022,
  FOOD: 1.2,
  GARDEN: 0.85,
  PAPER: perShortTon(0.93 + 0.02),
  STEEL: perShortTon(0.93 + 0.02),
  OTHER: perShortTon(0.93 + 0.02),
  NONE: 0,
  HAZARDOUS: 0,
};

export const DEFAULT_MASS_G: Record<string, number> = {
  PET: 25,
  HDPE: 40,
  PP: 20,
  PLASTIC_OTHER: 25,
  GLASS: 250,
  ALUMINIUM: 15,
  STEEL: 60,
  PAPER: 30,
  FOOD: 120,
  GARDEN: 200,
  ELECTRONICS: 150,
  HAZARDOUS: 25,
  OTHER: 50,
  NONE: 0,
};

export const MASS_BOUNDS_G: Record<string, [number, number]> = {
  PET: [5, 2000],
  HDPE: [5, 3000],
  PP: [2, 2000],
  PLASTIC_OTHER: [2, 3000],
  GLASS: [30, 5000],
  ALUMINIUM: [5, 2000],
  STEEL: [10, 5000],
  PAPER: [2, 5000],
  FOOD: [5, 3000],
  GARDEN: [5, 10000],
  ELECTRONICS: [5, 15000],
  HAZARDOUS: [2, 5000],
  OTHER: [2, 5000],
  NONE: [0, 0],
};

const CATEGORY_MATERIALS: Record<string, string[]> = {
  COMPOST: ["FOOD", "GARDEN", "PAPER", "OTHER"],
  RECYCLE: ["PET", "HDPE", "PP", "PLASTIC_OTHER", "GLASS", "ALUMINIUM", "STEEL", "PAPER", "OTHER"],
  EWASTE: ["ELECTRONICS", "OTHER"],
  HAZARDOUS: ["HAZARDOUS", "OTHER"],
  LANDFILL: ["OTHER", "PLASTIC_OTHER", "PAPER", "NONE"],
};

const CATEGORY_FALLBACK_MATERIAL: Record<string, string> = {
  COMPOST: "FOOD",
  RECYCLE: "PLASTIC_OTHER",
  EWASTE: "ELECTRONICS",
  HAZARDOUS: "HAZARDOUS",
  LANDFILL: "OTHER",
};

export const CLASSIFICATION_YIELD = 1.0;

export type Co2Estimate = {
  co2_kg: number;
  mass_g: number;
  mass_basis: "estimated" | "default" | "clamped";
  material: string;
  factor: number;
};

export function estimateCo2({
  category,
  material,
  massG,
}: {
  category: string;
  material?: string | null;
  massG?: number | null;
}): Co2Estimate {
  const allowed = CATEGORY_MATERIALS[category] || ["OTHER"];
  const fallback = CATEGORY_FALLBACK_MATERIAL[category] || "OTHER";

  const code = String(material || "").toUpperCase();
  const resolved =
    allowed.includes(code) && MATERIAL_FACTORS[code] !== undefined ? code : fallback;

  const bounds = MASS_BOUNDS_G[resolved] || [0, 0];
  const raw = Number(massG);

  let mass: number;
  let basis: Co2Estimate["mass_basis"];
  if (!Number.isFinite(raw) || raw <= 0) {
    mass = DEFAULT_MASS_G[resolved] ?? 0;
    basis = "default";
  } else if (raw < bounds[0] || raw > bounds[1]) {
    mass = DEFAULT_MASS_G[resolved] ?? 0;
    basis = "clamped";
  } else {
    mass = raw;
    basis = "estimated";
  }

  const factor = MATERIAL_FACTORS[resolved] ?? 0;
  const co2 = category === "LANDFILL" ? 0 : (mass / 1000) * factor * CLASSIFICATION_YIELD;

  return {
    co2_kg: Math.round(co2 * 10000) / 10000,
    mass_g: Math.round(mass),
    mass_basis: basis,
    material: resolved,
    factor: Math.round(factor * 100000) / 100000,
  };
}

export const MATERIAL_CODES = Object.keys(MATERIAL_FACTORS).filter((c) => c !== "NONE");
