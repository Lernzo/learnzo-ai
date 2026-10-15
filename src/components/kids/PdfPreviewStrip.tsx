"use client";

import { useEffect, useState } from "react";

interface Props {
  url: string;
  pages?: number[];
  label?: string;
}

export function PdfPreviewStrip({ url, pages = [1, 4, 8], label }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const pdfjs: any = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const pdf = await pdfjs.getDocument({ url }).promise;
        const urls: string[] = [];
        for (const n of pages) {
          if (n > pdf.numPages) continue;
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 0.55 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL("image/png"));
        }
        if (!alive) return;
        setImages(urls);
      } catch (e) {
        console.error("[preview]", e);
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Loading preview pages...
      </div>
    );
  }

  if (error || images.length === 0) return null;

  return (
    <div>
      {label && (
        <p className="text-sm font-semibold text-slate-700 mb-3 text-center">
          {label}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-3xl mx-auto">
        {images.map((src, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft"
          >
            <img
              src={src}
              alt={"Preview page " + (i + 1)}
              className="block w-full h-auto"
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500 text-center">
        Sample pages. The full workbook is 100 pages.
      </p>
    </div>
  );
}