import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { CameraScanner, type CameraHandle } from "@/components/smarteco/CameraScanner";
import { BinList } from "@/components/smarteco/BinList";
import { HistoryList } from "@/components/smarteco/HistoryList";
import { ImpactPanel } from "@/components/smarteco/ImpactPanel";
import { classifyWaste } from "@/lib/classify.functions";
import { playSound, speak, vibrate } from "@/lib/feedback";
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
import { download, toCSV, useSortRecords } from "@/lib/useSortRecords";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartEco AI Sorting — Smart Waste Sorting on Your Phone" },
      {
        name: "description",
        content:
          "Point your camera at any item and SmartEco's AI tells you which bin it belongs in, then tracks the CO₂e you avoid. Trilingual EN/RW/FR.",
      },
      { property: "og:title", content: "SmartEco AI Sorting — Smart Waste Sorting on Your Phone" },
      {
        property: "og:description",
        content:
          "AI waste sorting for compost, recycling, e-waste, landfill and hazardous items, with live CO₂e impact tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b1120" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
  }),
  component: SmartEcoApp,
});

type Tab = "scan" | "history" | "impact" | "settings";
type Mood = "idle" | "scanning" | "result";

const AUTO_INTERVAL = 4500;

function SmartEcoApp() {
  const classify = useServerFn(classifyWaste);
  const { records, add, clear } = useSortRecords();

  const [tab, setTab] = useState<Tab>("scan");
  const [lang, setLang] = useState<Lang>("en");
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [activeBin, setActiveBin] = useState<BinKey | null>(null);
  const [result, setResult] = useState<{ bin: BinKey | null; item: string; note?: string } | null>(
    null,
  );
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const busyRef = useRef(false);

  const t = STRINGS[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("smarteco_lang") as Lang | null;
    if (savedLang && LANG_ORDER.includes(savedLang)) setLang(savedLang);
    setSoundOn(localStorage.getItem("smarteco_sound") !== "0");
    setVoiceOn(localStorage.getItem("smarteco_voice") !== "0");
  }, []);

  useEffect(() => {
    localStorage.setItem("smarteco_lang", lang);
    localStorage.setItem("smarteco_sound", soundOn ? "1" : "0");
    localStorage.setItem("smarteco_voice", voiceOn ? "1" : "0");
  }, [lang, soundOn, voiceOn]);

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

  const onCameraReady = useCallback((handle: CameraHandle | null) => {
    cameraRef.current = handle;
  }, []);

  const scan = useCallback(async () => {
    if (busyRef.current || phoneWarning) return;
    const image = cameraRef.current?.capture();
    if (!image) {
      setError(t.cameraBlocked);
      return;
    }
    busyRef.current = true;
    setScanning(true);
    setError(null);
    setResult(null);
    playSound("SCAN", soundOn);

    try {
      const res = await classify({ data: { image, lang } });
      const category = res.category;

      const keepablePhone =
        res.is_phone && res.looks_undamaged && (res.screen_lit || res.is_working_device);

      if (category === "WORKING_PHONE" || keepablePhone) {
        setPhoneWarning(true);
        setResult({ bin: null, item: res.item || t.electronicDevice, note: t.phoneWorking });
        playSound("ALERT", soundOn);
        vibrate([120, 80, 120]);
        speak(t.phoneVoiceAlert, lang, voiceOn);
        setAutoMode(false);
        return;
      }

      if (category === "NONE" || !(category in BINS)) {
        setResult({
          bin: null,
          item: category === "NONE" ? t.noItemDetected : t.couldNotClassify,
        });
        setTimeout(() => setResult(null), 2200);
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
      playSound(bin, soundOn);
      vibrate(60);
      speak(t.disposeVoice(res.item, binName(bin, lang), binColorName(bin, lang)), lang, voiceOn);
      setTimeout(() => setActiveBin(null), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(t.analysisFailed(message));
      setAutoMode(false);
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  }, [add, classify, lang, phoneWarning, soundOn, t, voiceOn]);

  useEffect(() => {
    if (!autoMode) return;
    const id = setInterval(() => void scan(), AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [autoMode, scan]);

  const mood: Mood = scanning ? "scanning" : result?.bin ? "result" : "idle";
  const promptHead =
    mood === "scanning" ? t.promptScan : mood === "result" ? t.promptResult : t.promptIdle;

  const exportRecords = (kind: "csv" | "json") => {
    if (records.length === 0) {
      setError(t.nothingToExport);
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    if (kind === "csv") {
      download(`smarteco-${stamp}.csv`, toCSV(records), "text/csv;charset=utf-8");
    } else {
      download(
        `smarteco-${stamp}.json`,
        JSON.stringify(records, null, 2),
        "application/json",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg text-primary-foreground">
            ♻️
          </span>
          <div>
            <h1 className="text-sm font-bold leading-tight">{t.appTitle}</h1>
            <p className="text-[11px] leading-tight text-muted-foreground">{t.appSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setLang(LANG_ORDER[(LANG_ORDER.indexOf(lang) + 1) % LANG_ORDER.length] as Lang)
          }
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
        >
          {LANG_META[lang].flag} {LANG_META[lang].label}
        </button>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4">
        {error && (
          <div
            role="alert"
            className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
          >
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {tab === "scan" && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-[image:var(--gradient-hero)] p-4">
              <h2 className="text-center text-lg font-extrabold text-[color:var(--hero-foreground)]">
                {promptHead}
              </h2>
              <p className="mb-3 text-center text-xs text-[color:var(--hero-foreground)]/80">
                {mood === "result" && result?.bin
                  ? t.disposeInstruction(
                      result.item,
                      binName(result.bin, lang),
                      binColorName(result.bin, lang),
                    )
                  : t.promptIdleSub}
              </p>
              <CameraScanner
                onReady={onCameraReady}
                labelCamera={t.camera}
                labelTap={t.tapToEnable}
                labelStarting={t.startingCamera}
                labelBlocked={t.cameraBlocked}
                overlay={
                  scanning ? (
                    <div className="absolute inset-0 grid place-items-center bg-background/40 backdrop-blur-sm">
                      <span className="animate-pulse rounded-full bg-background/80 px-4 py-2 text-sm font-semibold">
                        🔍 {t.scanning}
                      </span>
                    </div>
                  ) : result?.bin ? (
                    <div
                      className="absolute inset-x-4 bottom-4 rounded-2xl px-4 py-3 text-center"
                      style={{ backgroundColor: `var(--${BINS[result.bin].token})` }}
                    >
                      <p className="text-xs font-medium opacity-90">{t.putInBin}</p>
                      <p className="text-base font-bold">
                        {BINS[result.bin].emoji} {binName(result.bin, lang)}
                      </p>
                    </div>
                  ) : result ? (
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-background/85 px-4 py-3 text-center text-sm font-medium">
                      {result.item}
                    </div>
                  ) : null
                }
              />
            </section>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void scan()}
                disabled={scanning || phoneWarning}
                className="rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {scanning ? t.scanning : `📷 ${t.scanItem}`}
              </button>
              <button
                type="button"
                onClick={() => setAutoMode((v) => !v)}
                disabled={phoneWarning}
                className={`rounded-2xl px-4 py-3.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  autoMode
                    ? "bg-warning text-warning-foreground"
                    : "border border-border bg-card text-card-foreground"
                }`}
              >
                {autoMode ? `⏸️ ${t.stopAuto}` : `▶️ ${t.autoMode}`}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat value={records.length} label={t.statTotal} tone="text-primary" />
              <Stat value={todayCount} label={t.statToday} tone="text-info" />
              <Stat value={divertedCount} label={t.statDiverted} tone="text-accent-foreground" />
            </div>

            <BinList
              counts={counts}
              total={records.length}
              lang={lang}
              activeBin={activeBin}
              title={t.smartBins}
            />
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              📋 {t.recentItems}
            </h2>
            <HistoryList records={records} lang={lang} />
          </div>
        )}

        {tab === "impact" && <ImpactPanel records={records} lang={lang} />}

        {tab === "settings" && (
          <div className="space-y-4">
            <section className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-card-foreground">⚙️ {t.settings}</h2>
              <p className="mt-3 text-xs font-medium text-muted-foreground">{t.languageLabel}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {LANG_ORDER.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`rounded-xl px-2 py-2 text-xs font-semibold ${
                      lang === code
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {LANG_META[code].flag} {LANG_META[code].label}
                  </button>
                ))}
              </div>

              <Toggle
                label={t.soundEffects}
                on={soundOn}
                onLabel={t.on}
                offLabel={t.off}
                onToggle={() => setSoundOn((v) => !v)}
              />
              <Toggle
                label={t.voice}
                on={voiceOn}
                onLabel={t.on}
                offLabel={t.off}
                onToggle={() => setVoiceOn((v) => !v)}
              />
              <button
                type="button"
                onClick={() => speak(t.promptIdle + " " + t.promptIdleSub, lang, true)}
                className="mt-3 w-full rounded-xl border border-border px-4 py-2.5 text-xs font-semibold"
              >
                ▶ {t.testVoice}
              </button>
            </section>

            <section className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-card-foreground">📤 {t.dataSection}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t.dataHint}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => exportRecords("csv")}
                  className="rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-secondary-foreground"
                >
                  ⬇️ {t.exportCsv}
                </button>
                <button
                  type="button"
                  onClick={() => exportRecords("json")}
                  className="rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-secondary-foreground"
                >
                  ⬇️ {t.exportJson}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t.clearConfirm)) clear();
                }}
                className="mt-2 w-full rounded-xl border border-destructive/40 px-3 py-2.5 text-xs font-semibold text-destructive"
              >
                🗑️ {t.clearData}
              </button>
            </section>

            <section className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-card-foreground">📱 {t.installTitle}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t.installHint}</p>
            </section>

            <section className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-card-foreground">🖥️ Big screen display</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Open the full-screen kiosk layout on a TV or PC monitor.
              </p>
              <Link
                to="/display"
                className="mt-3 block w-full rounded-xl bg-secondary px-3 py-2.5 text-center text-xs font-semibold text-secondary-foreground"
              >
                Open display mode
              </Link>
            </section>
          </div>
        )}
      </main>

      {phoneWarning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-6 backdrop-blur">
          <div className="w-full max-w-sm rounded-3xl border border-destructive/50 bg-card p-6 text-center">
            <p className="text-4xl">📱</p>
            <h2 className="mt-2 text-xl font-extrabold text-destructive">{t.wait}</h2>
            <p className="mt-1 text-sm font-semibold text-card-foreground">{t.phoneWorking}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t.phoneDontThrow}</p>
            <button
              type="button"
              onClick={() => {
                setPhoneWarning(false);
                setResult(null);
              }}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              {t.phoneKeepIt}
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {(
            [
              ["scan", "📷", t.tabScan],
              ["history", "📋", t.tabHistory],
              ["impact", "🌍", t.tabImpact],
              ["settings", "⚙️", t.tabSettings],
            ] as const
          ).map(([key, icon, label]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setTab(key)}
                className={`flex w-full flex-col items-center gap-0.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 text-[11px] font-medium transition-colors ${
                  tab === key ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className={`text-lg font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Toggle({
  label,
  on,
  onLabel,
  offLabel,
  onToggle,
}: {
  label: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2.5">
      <span className="text-xs font-medium text-secondary-foreground">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
          on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {on ? onLabel : offLabel}
      </button>
    </div>
  );
}
