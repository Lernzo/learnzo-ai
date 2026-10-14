"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#facc15",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#78350f",
  "#94a3b8", "#fbbf24"
];

interface Props {
  page: number;
}

export function PaintCanvas({ page }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const snapshotsRef = useRef<string[]>([]);
  const [color, setColor] = useState("#ef4444");
  const [size, setSize] = useState(16);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setStatus("loading");
        setErrorMsg("");

        const pdfjs: any = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url: "/kids/downloads/learnzo-coloring-book.pdf"
        });
        const pdf = await loadingTask.promise;
        const pdfPage = await pdf.getPage(page);
        const viewport = pdfPage.getViewport({ scale: 1.6 });

        if (!alive) return;

        const off = document.createElement("canvas");
        off.width = viewport.width;
        off.height = viewport.height;
        const offCtx = off.getContext("2d");
        if (!offCtx) throw new Error("Canvas 2D context unavailable");

        offCtx.fillStyle = "#ffffff";
        offCtx.fillRect(0, 0, off.width, off.height);

        const renderTask = pdfPage.render({
          canvasContext: offCtx,
          viewport: viewport
        });
        await renderTask.promise;

        if (!alive) return;

        const dataUrl = off.toDataURL("image/png");
        const img = new Image();
        img.onload = () => {
          if (!alive) return;
          bgImageRef.current = img;

          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          snapshotsRef.current = [canvas.toDataURL("image/png")];
          setStatus("ready");
        };
        img.onerror = () => {
          if (!alive) return;
          setStatus("error");
          setErrorMsg("Rendered page could not be displayed.");
        };
        img.src = dataUrl;
      } catch (e: any) {
        console.error("[paint] load error:", e);
        const message = e?.message ? String(e.message) : "Unknown error";
        if (alive) {
          setStatus("error");
          setErrorMsg("Load failed: " + message);
        }
      }
    })();

    return () => { alive = false; };
  }, [page]);

  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (status !== "ready") return;
    e.preventDefault();
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch {}
    drawingRef.current = true;
    lastPosRef.current = getPos(e.clientX, e.clientY);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e.clientX, e.clientY);
    const last = lastPosRef.current;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = tool === "eraser" ? size * 2.5 : size;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    snapshotsRef.current.push(canvas.toDataURL("image/png"));
    if (snapshotsRef.current.length > 25) snapshotsRef.current.shift();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snaps = snapshotsRef.current;
    if (snaps.length <= 1) return;
    snaps.pop();
    const prev = snaps[snaps.length - 1];
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    const bg = bgImageRef.current;
    if (!canvas || !bg) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    snapshotsRef.current = [canvas.toDataURL("image/png")];
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "learnzo-coloring-page-" + String(page).padStart(3, "0") + ".png";
    a.click();
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">

          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setTool("brush"); }}
                className={
                  "h-8 w-8 rounded-full border-2 transition " +
                  (color === c && tool === "brush"
                    ? "border-brand-600 scale-110"
                    : "border-slate-300")
                }
                style={{ backgroundColor: c }}
                aria-label={"Color " + c}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            More
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setTool("brush"); }}
              className="h-8 w-10 cursor-pointer rounded border border-slate-300"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            Size
            <input
              type="range"
              min={4}
              max={48}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              className="w-32"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTool("brush")}
              className={
                "rounded-xl px-3 py-1.5 text-sm font-semibold border " +
                (tool === "brush"
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50")
              }
            >
              Brush
            </button>
            <button
              type="button"
              onClick={() => setTool("eraser")}
              className={
                "rounded-xl px-3 py-1.5 text-sm font-semibold border " +
                (tool === "eraser"
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50")
              }
            >
              Eraser
            </button>
            <button
              type="button"
              onClick={undo}
              className="rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={download}
              className="rounded-xl px-4 py-1.5 text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700"
            >
              Save PNG
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        {status === "loading" && (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            Loading coloring page...
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center justify-center py-20 text-rose-600 text-sm text-center px-6">
            {errorMsg}
          </div>
        )}
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          onPointerLeave={endDraw}
          className={
            "mx-auto block max-w-full touch-none select-none " +
            (status === "ready" ? "cursor-crosshair" : "")
          }
          style={{
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            borderRadius: "12px",
            display: status === "ready" ? "block" : "none"
          }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500 text-center">
        Tip: on a tablet, use your finger or a stylus. Save the finished page as a PNG.
      </p>
    </div>
  );
}