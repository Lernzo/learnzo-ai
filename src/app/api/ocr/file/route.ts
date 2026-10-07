import { NextResponse, type NextRequest } from "next/server";
import { getOCRProvider } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PDF_PAGES = 10;

type Kind = "pdf" | "image" | "docx" | "xlsx" | "text" | "unknown";

function detectKind(file: File): Kind {
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("wordprocessingml") || name.endsWith(".docx")) return "docx";
  if (mime.includes("spreadsheetml") || name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".csv") || name.endsWith(".md")) return "text";
  return "unknown";
}

function countQuestions(text: string): number {
  const pattern = /(?:^|\n)\s*(?:Q(?:uestion)?\s*)?\d+[\.\):\-]\s+/gi;
  const matches = text.match(pattern) || [];
  return Math.max(1, matches.length);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 8 MB." },
        { status: 413 }
      );
    }

    const kind = detectKind(file);

    // ---------- IMAGE ----------
    if (kind === "image") {
      const buf = Buffer.from(await file.arrayBuffer());
      const ocr = getOCRProvider();
      const result = await ocr.extract(buf.toString("base64"), file.type || "image/jpeg");
      const text = (result.text || "").trim();

      if (text.length < 5) {
        return NextResponse.json(
          { error: "We could not read this image clearly. Try a brighter photo." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        text,
        pageCount: 1,
        questionCount: Math.max(1, (result.questions || []).length),
        confidence: result.confidence,
      });
    }

    // ---------- PDF ----------
    if (kind === "pdf") {
      const buf = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse");

      let data;
      try {
        data = await pdfParse(buf, { max: MAX_PDF_PAGES });
      } catch {
        return NextResponse.json(
          {
            error:
              "We could not read this PDF. It may be a scanned document. Try uploading it as a photo.",
          },
          { status: 422 }
        );
      }

      const text = (data.text || "").trim();
      if (text.length < 10) {
        return NextResponse.json(
          {
            error:
              "This PDF does not contain readable text. It looks like a scan. Please upload it as a photo.",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        text,
        pageCount: data.numpages,
        questionCount: countQuestions(text),
        confidence: "high",
      });
    }

    // ---------- DOCX ----------
    if (kind === "docx") {
      const buf = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mammoth = require("mammoth");

      let result;
      try {
        result = await mammoth.extractRawText({ buffer: buf });
      } catch {
        return NextResponse.json(
          { error: "We could not read this Word file. Please try again." },
          { status: 422 }
        );
      }

      const text = (result.value || "").trim();
      if (text.length < 5) {
        return NextResponse.json(
          { error: "This Word file appears to be empty." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        text,
        pageCount: 1,
        questionCount: countQuestions(text),
        confidence: "high",
      });
    }

    // ---------- EXCEL ----------
    if (kind === "xlsx") {
      const buf = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const XLSX = require("xlsx");

      let workbook;
      try {
        workbook = XLSX.read(buf, { type: "buffer" });
      } catch {
        return NextResponse.json(
          { error: "We could not read this Excel file. Please try again." },
          { status: 422 }
        );
      }

      let text = "";
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim().length > 0) {
          text += "Sheet: " + name + "\n" + csv + "\n\n";
        }
      }
      text = text.trim();

      if (text.length < 5) {
        return NextResponse.json(
          { error: "This Excel file appears to be empty." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        text,
        pageCount: workbook.SheetNames.length,
        questionCount: countQuestions(text),
        confidence: "high",
      });
    }

    // ---------- PLAIN TEXT ----------
    if (kind === "text") {
      const text = (await file.text()).trim();
      if (text.length < 5) {
        return NextResponse.json(
          { error: "This file appears to be empty." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        text,
        pageCount: 1,
        questionCount: countQuestions(text),
        confidence: "high",
      });
    }

    // ---------- UNKNOWN ----------
    return NextResponse.json(
      {
        error:
          "This file type is not supported yet. Please upload an image, PDF, Word, Excel or text file.",
      },
      { status: 415 }
    );
  } catch (e) {
    console.error("[ocr/file]", e);
    return NextResponse.json(
      { error: "Could not read the file. Please try again." },
      { status: 500 }
    );
  }
}