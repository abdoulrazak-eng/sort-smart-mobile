import type { SortRecord } from "@/lib/useSortRecords";
import { STRINGS, type Lang } from "@/lib/smarteco";

export function ImpactPanel({ records, lang }: { records: SortRecord[]; lang: Lang }) {
  const t = STRINGS[lang];
  const total = records.length;
  const diverted = records.filter(
    (r) => r.category !== "LANDFILL" && r.category !== "HAZARDOUS",
  ).length;
  const recyclable = records.filter(
    (r) => r.category === "RECYCLE" || r.category === "COMPOST" || r.category === "EWASTE",
  ).length;
  const co2 = records.reduce((sum, r) => sum + (r.co2_kg || 0), 0);
  const massKg = records.reduce((sum, r) => sum + (r.mass_g || 0), 0) / 1000;
  const rate = total > 0 ? Math.round((recyclable / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-card-foreground">🌍 {t.impactTitle}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric value={String(diverted)} label={t.impactDiverted} tone="text-primary" />
          <Metric value={`${rate}%`} label={t.impactRate} tone="text-info" />
          <Metric value={`${co2.toFixed(2)} kg`} label={t.impactCO2} tone="text-warning" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t.impactNote}</p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground">🌍 {t.co2HowTitle}</h3>
        <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
          {t.co2Formula}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.co2Explain}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Row label={t.statTotal} value={String(total)} />
          <Row label="kg" value={massKg.toFixed(2)} />
        </dl>
      </section>
    </div>
  );
}

function Metric({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <p className={`text-base font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-card-foreground">{value}</dd>
    </div>
  );
}
