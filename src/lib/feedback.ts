import { LANG_META, type Lang } from "./smarteco";

const SOUNDS: Record<string, { notes: number[]; type: OscillatorType }> = {
  COMPOST: { notes: [523, 659, 784], type: "sine" },
  RECYCLE: { notes: [440, 554, 659], type: "triangle" },
  EWASTE: { notes: [330, 392, 494], type: "square" },
  LANDFILL: { notes: [220, 262, 330], type: "sine" },
  HAZARDOUS: { notes: [392, 311, 392], type: "sawtooth" },
  SCAN: { notes: [800, 1000], type: "sine" },
  ALERT: { notes: [440, 220, 440, 220], type: "sawtooth" },
};

let ctx: AudioContext | null = null;

export function playSound(name: keyof typeof SOUNDS | string, enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  const spec = SOUNDS[name];
  if (!spec) return;
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    ctx = ctx ?? new AudioCtor();
    void ctx.resume();
    spec.notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = spec.type;
      osc.frequency.value = freq;
      const start = ctx!.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch {
    // audio unavailable
  }
}

export function speak(text: string, lang: Lang, enabled = true) {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_META[lang].speech;
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang?.toLowerCase().startsWith(utter.lang.toLowerCase())) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(utter.lang.slice(0, 2)));
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
  } catch {
    // speech unavailable
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // no haptics
  }
}
