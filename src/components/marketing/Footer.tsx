import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-10">
      <div className="container-x py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo - Learn. Understand. Grow."
            width={200}
            height={100}
            className="h-16 w-auto"
          />
          <p className="mt-4 text-slate-500">Upload. Understand. Practise.</p>
        </div>
        <div>
          <div className="font-semibold">Product</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/#how-it-works">How it works</Link></li>
            <li><Link href="/#subjects">Subjects</Link></li>
            <li><Link href="/#final-cta">Try free</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Learn</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/responsible-ai">Responsible AI</Link></li>
            <li><Link href="/#responsible">Responsible AI</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Company</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/">Home</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Learnzo &middot; learnzo.online
      </div>
    </footer>
  );
}