import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  image: z.string().min(100), // data URL or bare base64 JPEG
  lang: z.enum(["en", "rw", "fr"]).default("en"),
});

const LANG_NAME = { en: "English", rw: "Kinyarwanda", fr: "French" } as const;

const buildPrompt = (langName: string) => `You are a waste classification AI. Classify the item in this image into ONE category.

CLASSIFICATION RULES:
1. HAZARDOUS - Batteries, paint, chemicals, medications, aerosols, fluorescent bulbs, needles, toxic materials.
2. EWASTE - ANY electronic device being disposed of: old/broken phones, tablets, computers, phones with cracked screens, phones turned OFF, cables, chargers, keyboards, mice, small appliances.
3. RECYCLE - Paper, cardboard, plastic bottles, aluminium cans, glass jars, metal containers.
4. COMPOST - Food scraps, fruit peels, vegetables, coffee grounds, tea bags, eggshells, yard waste.
5. LANDFILL - Styrofoam, plastic bags, chip bags, candy wrappers, diapers, tissues.
6. NONE - No item visible or image unclear.
7. WORKING_PHONE - ONLY if you see a smartphone/tablet with its screen VISIBLY LIT showing content, and the device looks undamaged.

IMPORTANT DISTINCTIONS:
- Phone screen BLACK/OFF -> EWASTE, but still set is_phone true, and looks_undamaged true if no visible cracks.
- Phone with ANY crack or damage -> EWASTE with looks_undamaged false.
- Phone screen GLOWING with visible content -> WORKING_PHONE.
- Any doubt about a phone being "working" -> default to EWASTE.

ESTIMATE THE MASS AND MATERIAL. Avoided CO2e is computed as mass x per-material emission factor, so a wrong mass makes the climate figure wrong by the same proportion. Judge size against familiar references visible in frame and give your best physical estimate; do NOT default to a round number.

Reference masses: 500 ml PET bottle ~25 g, aluminium can ~15 g, glass bottle ~250 g, banana peel ~40 g, plate of food scraps ~250 g, USB cable ~30 g, smartphone ~190 g, laptop ~2000 g, AA battery ~23 g.

If the item is partly hidden or you cannot judge size, set mass_g to null rather than guessing; a documented default is substituted.

MATERIAL must be one of: PET, HDPE, PP, PLASTIC_OTHER, GLASS, ALUMINIUM, STEEL, PAPER, FOOD, GARDEN, ELECTRONICS, HAZARDOUS, OTHER. Use PET for clear drink bottles, HDPE for opaque milk/detergent bottles, PP for yoghurt pots, tubs and caps, FOOD for edible waste and peels, GARDEN for leaves and trimmings, ELECTRONICS for any powered device or cable.

Write the "item" name in ${langName}.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: {
      type: "string",
      enum: ["COMPOST", "RECYCLE", "EWASTE", "LANDFILL", "HAZARDOUS", "NONE", "WORKING_PHONE"],
    },
    item: { type: "string" },
    confidence: { type: "number" },
    material: {
      type: "string",
      enum: [
        "PET",
        "HDPE",
        "PP",
        "PLASTIC_OTHER",
        "GLASS",
        "ALUMINIUM",
        "STEEL",
        "PAPER",
        "FOOD",
        "GARDEN",
        "ELECTRONICS",
        "HAZARDOUS",
        "OTHER",
        "NONE",
      ],
    },
    mass_g: { type: ["number", "null"] },
    is_working_device: { type: "boolean" },
    screen_lit: { type: "boolean" },
    is_phone: { type: "boolean" },
    looks_undamaged: { type: "boolean" },
  },
  required: [
    "category",
    "item",
    "confidence",
    "material",
    "mass_g",
    "is_working_device",
    "screen_lit",
    "is_phone",
    "looks_undamaged",
  ],
} as const;

export type Classification = {
  category: string;
  item: string;
  confidence: number;
  material: string;
  mass_g: number | null;
  is_working_device: boolean;
  screen_lit: boolean;
  is_phone: boolean;
  looks_undamaged: boolean;
};

export const classifyWaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<Classification> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured on this server");

    const base64 = data.image.includes(",") ? data.image.split(",")[1] : data.image;
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        stream: true,
        store: false,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: buildPrompt(LANG_NAME[data.lang]) },
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "waste_classification",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Too many scans — please wait a moment");
      if (res.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error ${res.status}${detail ? ` – ${detail.slice(0, 180)}` : ""}`);
    }

    // Read the SSE stream and accumulate the output text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
          } else if (
            event.type === "response.completed" &&
            typeof event.response?.output_text === "string" &&
            !text
          ) {
            text = event.response.output_text;
          }
        } catch {
          // ignore keep-alive / partial frames
        }
      }
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The AI did not return a result — try again");

    const parsed = JSON.parse(match[0]) as Classification;
    return {
      category: String(parsed.category || "NONE").toUpperCase(),
      item: String(parsed.item || ""),
      confidence: Number(parsed.confidence) || 0,
      material: String(parsed.material || "OTHER").toUpperCase(),
      mass_g: parsed.mass_g == null ? null : Number(parsed.mass_g),
      is_working_device: Boolean(parsed.is_working_device),
      screen_lit: Boolean(parsed.screen_lit),
      is_phone: Boolean(parsed.is_phone),
      looks_undamaged: Boolean(parsed.looks_undamaged),
    };
  });
