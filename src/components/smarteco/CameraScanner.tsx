import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onFrame: (dataUrl: string) => void;
  labelCamera: string;
  labelTap: string;
  labelStarting: string;
  labelBlocked: string;
};

export type CameraHandle = { capture: () => string | null };

export function CameraScanner({
  onReady,
  labelCamera,
  labelTap,
  labelStarting,
  labelBlocked,
  overlay,
}: {
  onReady: (handle: CameraHandle | null) => void;
  labelCamera: string;
  labelTap: string;
  labelStarting: string;
  labelBlocked: string;
  overlay?: React.ReactNode;
} & Partial<Props>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "ready" | "blocked">("idle");

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  const start = useCallback(async () => {
    if (state === "starting" || state === "ready") return;
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState("ready");
    } catch {
      setState("blocked");
    }
  }, [state]);

  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onReady(state === "ready" ? { capture } : null);
  }, [state, capture, onReady]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border bg-secondary shadow-[var(--shadow-lift)]">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      <span className="absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
        ● {labelCamera}
      </span>

      {/* viewfinder corners */}
      <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-primary/40" />

      {state !== "ready" && (
        <button
          type="button"
          onClick={() => void start()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 px-6 text-center text-sm text-muted-foreground"
        >
          <span className="text-3xl">📷</span>
          {state === "starting"
            ? labelStarting
            : state === "blocked"
              ? labelBlocked
              : labelTap}
        </button>
      )}

      {overlay}
    </div>
  );
}
