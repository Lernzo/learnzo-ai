import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Learnzo - Learn. Understand. Grow.",
  description:
    "Step-by-step homework help for CBSE, ICSE and State Board students. Coming soon."
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-2xl w-full text-center">
        <Image
          src="/learnzo-logo.png"
          alt="Learnzo - Learn. Understand. Grow."
          width={720}
          height={360}
          priority
          className="w-full h-auto max-w-xl mx-auto"
        />
        <p className="mt-10 text-sm text-slate-500 tracking-wide">
          Coming soon
        </p>
      </div>
    </main>
  );
}