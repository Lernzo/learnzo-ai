import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { MathWorksheetPDF, type MathQuestion } from "@/lib/tools/math-pdf";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  grade: z.string().min(1),
  topic: z.enum(["addition", "subtraction", "multiplication", "division", "mixed"]),
  count: z.coerce.number().int().min(5).max(40).default(20)
});

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addition(g: string): MathQuestion {
  const max = g === "1-2" ? 20 : g === "3-4" ? 500 : 5000;
  const a = rnd(2, max), b = rnd(2, max);
  return { question: `${a} + ${b} = ____`, answer: `${a + b}` };
}

function subtraction(g: string): MathQuestion {
  const max = g === "1-2" ? 20 : g === "3-4" ? 500 : 5000;
  let a = rnd(2, max), b = rnd(2, max);
  if (a < b) [a, b] = [b, a];
  return { question: `${a} - ${b} = ____`, answer: `${a - b}` };
}

function multiplication(g: string): MathQuestion {
  const max = g === "1-2" ? 5 : g === "3-4" ? 12 : 30;
  const a = rnd(2, max), b = rnd(2, max);
  return { question: `${a} x ${b} = ____`, answer: `${a * b}` };
}

function division(g: string): MathQuestion {
  const max = g === "1-2" ? 5 : g === "3-4" ? 12 : 20;
  const b = rnd(2, max);
  const a = b * rnd(2, max);
  return { question: `${a} Ã· ${b} = ____`, answer: `${a / b}` };
}

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { grade, topic, count } = parsed.data;

    const questions: MathQuestion[] = [];
    const topics: Array<"addition" | "subtraction" | "multiplication" | "division"> = [
      "addition", "subtraction", "multiplication", "division"
    ];
    for (let i = 0; i < count; i++) {
      const t = topic === "mixed" ? topics[rnd(0, 3)] : topic;
      const q = t === "addition" ? addition(grade)
        : t === "subtraction" ? subtraction(grade)
        : t === "multiplication" ? multiplication(grade)
        : division(grade);
      questions.push(q);
    }

    const titleMap: Record<string, string> = {
      addition: "Addition Practice",
      subtraction: "Subtraction Practice",
      multiplication: "Multiplication Practice",
      division: "Division Practice",
      mixed: "Mixed Math Practice"
    };

    const pdf = await renderToBuffer(
      <MathWorksheetPDF
        title={titleMap[topic]}
        grade={grade === "1-2" ? "Grades 1-2" : grade === "3-4" ? "Grades 3-4" : "Grades 5-7"}
        topic={titleMap[topic]}
        questions={questions}
      />
    );

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="learnzo-math-${Date.now()}.pdf"`
      }
    });
  } catch (e) {
    console.error("[tools/math]", e);
    return NextResponse.json({ error: "Could not build the worksheet." }, { status: 500 });
  }
}