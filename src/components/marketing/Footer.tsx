import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-10">
      <div className="container-x py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-8">

          <div className="shrink-0">
            <Link href="/" aria-label="Learnzo home" className="inline-block">
              <Image
                src="/learnzo-logo.png"
                alt="Learnzo"
                width={800}
                height={400}
                style={{ height: '160px', width: 'auto' }}
              />
            </Link>
          </div>

          <div className="flex-1 flex flex-wrap md:justify-end gap-x-6 gap-y-3 text-sm text-slate-700">
            <Link href="/about" className="hover:text-brand-600">About</Link>
            <Link href="/solve" className="hover:text-brand-600">Solve</Link>
            <Link href="/kids" className="hover:text-brand-600">Kids</Link>
            <Link href="/pricing" className="hover:text-brand-600">Pricing</Link>
            <Link href="/faq" className="hover:text-brand-600">FAQ</Link>
            <Link href="/how-it-works" className="hover:text-brand-600">How it works</Link>
            <Link href="/history" className="hover:text-brand-600">History</Link>
          </div>

        </div>
      </div>

      <div className="border-t border-slate-100 py-5">
        <div className="container-x flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Learnzo &middot; learnzo.online</span>
          <Link href="/privacy" className="hover:text-brand-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-brand-600">Terms of Service</Link>
          <Link href="/refund-policy" className="hover:text-brand-600">Refund &amp; Cancellation</Link>
        </div>
      </div>
    </footer>
  );
}
