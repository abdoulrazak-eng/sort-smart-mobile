import { BINS, binName, STRINGS, type Lang } from "@/lib/smarteco";
import type { SortRecord } from "@/lib/useSortRecords";

export function HistoryList({
  records,
  lang,
  limit,
}: {
  records: SortRecord[];
  lang: Lang;
  limit?: number;
}) {
  const t = STRINGS[lang];
  const shown = limit ? records.slice(0, limit) : records;

  if (shown.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-2xl">🗑️</p>
        <p className="mt-2 text-sm font-medium text-card-foreground">{t.noItemsYet}</p>
        <p className="text-xs text-muted-foreground">{t.noItemsHint}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {shown.map((r) => (
        <li
          key={r.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
        >
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl text-base"
            style={{ backgroundColor: `var(--${BINS[r.category].token})` }}
          >
            {BINS[r.category].emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-card-foreground">
              {r.item || binName(r.category, lang)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {binName(r.category, lang)} · {r.mass_g} g · {r.co2_kg.toFixed(3)} kg CO₂e
            </p>
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {new Date(r.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </li>
      ))}
    </ul>
  );
}
