import { useCallback, useEffect, useState } from "react";
import { estimateCo2 } from "./co2";
import type { BinKey } from "./smarteco";

export type SortRecord = {
  id: string;
  ts: number;
  category: BinKey;
  item: string;
  confidence: number;
  material: string;
  mass_g: number;
  mass_basis: string;
  co2_kg: number;
};

const KEY = "smarteco_records_v1";

function read(): SortRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useSortRecords() {
  const [records, setRecords] = useState<SortRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecords(read());
    setReady(true);
  }, []);

  const persist = useCallback((next: SortRecord[]) => {
    setRecords(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(0, 2000)));
    } catch {
      // storage full — keep in-memory state
    }
  }, []);

  const add = useCallback(
    (input: {
      category: BinKey;
      item: string;
      confidence: number;
      material?: string | null;
      massG?: number | null;
    }) => {
      const est = estimateCo2({
        category: input.category,
        material: input.material,
        massG: input.massG,
      });
      const record: SortRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        category: input.category,
        item: input.item,
        confidence: input.confidence,
        material: est.material,
        mass_g: est.mass_g,
        mass_basis: est.mass_basis,
        co2_kg: est.co2_kg,
      };
      setRecords((prev) => {
        const next = [record, ...prev];
        try {
          localStorage.setItem(KEY, JSON.stringify(next.slice(0, 2000)));
        } catch {
          /* ignore */
        }
        return next;
      });
      return record;
    },
    [],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { records, ready, add, clear };
}

export function toCSV(records: SortRecord[]) {
  const head = [
    "id",
    "timestamp",
    "category",
    "item",
    "confidence",
    "material",
    "mass_g",
    "mass_basis",
    "co2_kg",
  ];
  const rows = records.map((r) =>
    [
      r.id,
      new Date(r.ts).toISOString(),
      r.category,
      `"${(r.item || "").replace(/"/g, '""')}"`,
      r.confidence,
      r.material,
      r.mass_g,
      r.mass_basis,
      r.co2_kg,
    ].join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
