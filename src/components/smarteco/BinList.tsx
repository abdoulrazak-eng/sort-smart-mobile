import { BINS, BIN_KEYS, binName, type BinKey, type Lang } from "@/lib/smarteco";

export function BinList({
  counts,
  total,
  lang,
  activeBin,
  title,
}: {
  counts: Record<BinKey, number>;
  total: number;
  lang: Lang;
  activeBin: BinKey | null;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-2">
        {BIN_KEYS.map((key) => {
          const count = counts[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li
              key={key}
              className={`rounded-2xl border border-border bg-card p-3 transition-transform ${
                activeBin === key ? "scale-[1.02] ring-2 ring-ring" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                  <span
                    className="grid size-8 place-items-center rounded-xl text-base"
                    style={{ backgroundColor: `var(--${BINS[key].token})` }}
                  >
                    {BINS[key].emoji}
                  </span>
                  {binName(key, lang)}
                </span>
                <span className="text-sm font-bold tabular-nums text-card-foreground">{count}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: `var(--${BINS[key].token})` }}
                  />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {pct}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
