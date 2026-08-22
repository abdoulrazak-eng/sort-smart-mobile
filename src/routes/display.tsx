import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { CameraScanner, type CameraHandle } from "@/components/smarteco/CameraScanner";
import { classifyWaste } from "@/lib/classify.functions";
import { playSound, speak } from "@/lib/feedback";
import {
  BINS,
  BIN_KEYS,
  LANG_META,
  LANG_ORDER,
  STRINGS,
  binColorName,
  binName,
  type BinKey,
  type Lang,
} from "@/lib/smarteco";
import { useSortRecords } from "@/lib/useSortRecords";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "SmartEco Big Screen — Smart Bin Display for TV & Monitors" },
      {
        name: "description",
        content:
          "Full-screen SmartEco kiosk display for TVs and PC monitors: live AI waste scanning, bin guidance and sorting stats at a glance.",
      },
      { property: "og:title", content: "SmartEco Big Screen — Smart Bin Display" },
      {
        property: "og:description",
        content:
          "Run SmartEco AI waste sorting on a TV or monitor with a large-format kiosk layout and live bin statistics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b1120" },
    ],
  }),
  component: DisplayScreen,
});

const AUTO_INTERVAL = 5000;

function DisplayScreen() {
  const classify = useServerFn(classifyWaste);
  const { records, add } = useSortRecords();

  const [lang, setLang] = useState<Lang>("en");
  const [autoMode, setAutoMode] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeBin, setActiveBin] = useState<BinKey | null>(null);
  const [result, setResult] = useState<{ bin: BinKey | null; item: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const cameraRef = useRef<CameraHandle | null>(null);
  const busyRef = useRef(false);

  const t = STRINGS[lang];

  useEffect(() => {
    const saved = localStorage.getItem("smarteco_lang") as Lang | null;
    if (saved && LANG_ORDER.includes(saved)) setLang(saved);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const base = Object.fromEntries(BIN_KEYS.map((k) => [k, 0])) as Record<BinKey, number>;
    for (const r of records) base[r.category] = (base[r.category] ?? 0) + 1;
    return base;
  }, [records]);

  const todayCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return records.filter((r) => r.ts >= start.getTime()).length;
  }, [records]);

  const divertedCount = useMemo(
    () => records.filter((r) => r.category !== "LANDFILL" && r.category !== "HAZARDOUS").length,
    [records],
  );

  const co2 = useMemo(
    () => records.reduce((sum, r) => sum + (r.co2_kg || 0), 0),
    [records],
  );

  const onCameraReady = useCallback((handle: CameraHandle | null) => {
    cameraRef.current = handle;
  }, []);

  const scan = useCallback(async () => {
    if (busyRef.current) return;
    const image = cameraRef.current?.capture();
    if (!image) {
      setError(t.cameraBlocked);
      return;
    }
    busyRef.current = true;
    setScanning(true);
    setError(null);
    setResult(null);
    playSound("SCAN", true);

    try {
      const res = await classify({ data: { image, lang } });
      const category = res.category;

      if (category === "NONE" || !(category in BINS)) {
        setResult({ bin: null, item: category === "NONE" ? t.noItemDetected : t.couldNotClassify });
        setTimeout(() => setResult(null), 2500);
        return;
      }

      const bin = category as BinKey;
      add({
        category: bin,
        item: res.item,
        confidence: res.confidence,
        material: res.material,
        massG: res.mass_g,
      });
      setResult({ bin, item: res.item });
      setActiveBin(bin);
      playSound(bin, true);
      speak(t.disposeVoice(res.item, binName(bin, lang), binColorName(bin, lang)), lang, true);
      setTimeout(() => setActiveBin(null), 3500);
    } catch (err) {
      setError(t.analysisFailed(err instanceof Error ? err.message : String(err)));
      setAutoMode(false);
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  }, [add, classify, lang, t]);

  useEffect(() => {
    if (!autoMode) return;
    const id = setInterval(() => void scan(), AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [autoMode, scan]);

  const headline = scanning ? t.promptScan : result?.bin ? t.promptResult : t.promptIdle;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-border px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-3xl text-primary-foreground">
            ♻️
          </span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight xl:text-3xl">{t.appTitle}</h1>
            <p className="text-sm text-muted-foreground xl:text-base">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tabular-nums text-muted-foreground xl:text-3xl">
            {clock}
          </span>
          {LANG_ORDER.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                lang === code
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {LANG_META[code].label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoMode((v) => !v)}
            className={`rounded-full px-5 py-2 text-sm font-bold ${
              autoMode ? "bg-warning text-warning-foreground" : "border border-border"
            }`}
          >
            {autoMode ? `⏸ ${t.stopAuto}` : `▶ ${t.autoMode}`}
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="flex min-h-0 flex-col gap-4 rounded-[2rem] bg-[image:var(--gradient-hero)] p-6">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-[color:var(--hero-foreground)] xl:text-6xl">
              {headline}
            </h2>
            <p className="mt-2 text-lg text-[color:var(--hero-foreground)]/80 xl:text-2xl">
              {result?.bin
                ? t.disposeInstruction(
                    result.item,
                    binName(result.bin, lang),
                    binColorName(result.bin, lang),
                  )
                : t.promptIdleSub}
            </p>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl">
            <CameraScanner
              onReady={onCameraReady}
              labelCamera={t.camera}
              labelTap={t.tapToEnable}
              labelStarting={t.startingCamera}
              labelBlocked={t.cameraBlocked}
              overlay={
                scanning ? (
                  <div className="absolute inset-0 grid place-items-center bg-background/40 backdrop-blur-sm">
                    <span className="animate-pulse rounded-full bg-background/80 px-8 py-4 text-2xl font-bold xl:text-4xl">
                      🔍 {t.scanning}
                    </span>
                  </div>
                ) : result?.bin ? (
                  <div
                    className="absolute inset-x-8 bottom-8 rounded-3xl px-8 py-6 text-center"
                    style={{ backgroundColor: `var(--${BINS[result.bin].token})` }}
                  >
                    <p className="text-lg font-semibold opacity-90 xl:text-2xl">{t.putInBin}</p>
                    <p className="text-3xl font-extrabold xl:text-5xl">
                      {BINS[result.bin].emoji} {binName(result.bin, lang)}
                    </p>
                  </div>
                ) : result ? (
                  <div className="absolute inset-x-8 bottom-8 rounded-3xl bg-background/85 px-8 py-5 text-center text-2xl font-semibold">
                    {result.item}
                  </div>
                ) : null
              }
            />
          </div>
          <button
            type="button"
            onClick={() => void scan()}
            disabled={scanning}
            className="shrink-0 rounded-2xl bg-primary px-8 py-5 text-xl font-extrabold text-primary-foreground disabled:opacity-50 xl:text-2xl"
          >
            {scanning ? t.scanning : `📷 ${t.scanItem}`}
          </button>
        </section>

        <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <BigStat value={records.length} label={t.statTotal} tone="text-primary" />
            <BigStat value={todayCount} label={t.statToday} tone="text-info" />
            <BigStat value={divertedCount} label={t.statDiverted} tone="text-accent-foreground" />
            <BigStat value={`${co2.toFixed(1)} kg`} label={t.impactCO2} tone="text-primary" />
          </div>

          <h2 className="shrink-0 text-lg font-bold uppercase tracking-wide text-muted-foreground">
            {t.smartBins}
          </h2>
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {BIN_KEYS.map((key) => {
              const count = counts[key] ?? 0;
              const pct = records.length > 0 ? Math.round((count / records.length) * 100) : 0;
              return (
                <li
                  key={key}
                  className={`rounded-3xl border border-border bg-card p-4 transition-transform ${
                    activeBin === key ? "scale-[1.03] ring-4 ring-ring" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-3 text-xl font-bold text-card-foreground xl:text-2xl">
                      <span
                        className="grid size-12 place-items-center rounded-2xl text-2xl"
                        style={{ backgroundColor: `var(--${BINS[key].token})` }}
                      >
                        {BINS[key].emoji}
                      </span>
                      {binName(key, lang)}
                    </span>
                    <span className="text-2xl font-extrabold tabular-nums text-card-foreground xl:text-3xl">
                      {count}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, backgroundColor: `var(--${BINS[key].token})` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </main>

      {error && (
        <div
          role="alert"
          className="flex shrink-0 items-center justify-between gap-4 border-t border-destructive/40 bg-destructive/10 px-8 py-3 text-base text-destructive-foreground"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function BigStat({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 text-center">
      <p className={`text-3xl font-extrabold tabular-nums xl:text-4xl ${tone}`}>{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
