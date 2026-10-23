import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS } from "@/lib/config/socials";

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-10">
      <div className="container-x py-12 grid md:grid-cols-4 gap-8 text-sm">
        
        {/* Column 1: Brand & Socials */}
        <div>
          <Image
            src="/learnzo-logo.png"
            alt="Learnzo"
            width={200}
            height={100}
            className="h-16 w-auto"
          />
          <p className="mt-4 text-slate-500">Upload. Understand. Practise.</p>
          
          <div className="mt-6">
            <p className="font-semibold text-slate-800 mb-3">Follow Learnzo</p>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Follow Learnzo for free children's learning resources, creative activities, educational videos, and updates.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href={SOCIAL_LINKS.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" 
                aria-label="Follow Learnzo on Facebook"
              >
                <FacebookIcon />
              </a>
              <a 
                href={SOCIAL_LINKS.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" 
                aria-label="Follow Learnzo on Instagram"
              >
                <InstagramIcon />
              </a>
              <a 
                href={SOCIAL_LINKS.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" 
                aria-label="Follow Learnzo on YouTube"
              >
                <YoutubeIcon />
              </a>
              <a 
                href={SOCIAL_LINKS.linkedin} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" 
                aria-label="Follow Learnzo on LinkedIn"
              >
                <LinkedinIcon />
              </a>
            </div>
          </div>
        </div>
        
        {/* Column 2 */}
        <div>
          <div className="font-semibold">Product</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/#how-it-works" className="hover:text-brand-600">How it works</Link></li>
            <li><Link href="/kids" className="hover:text-brand-600">Kids Activities</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-600">Pricing</Link></li>
          </ul>
        </div>
        
        {/* Column 3 */}
        <div>
          <div className="font-semibold">Learn</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/#why" className="hover:text-brand-600">Why Learnzo</Link></li>
            <li><Link href="/faq" className="hover:text-brand-600">FAQ</Link></li>
            <li><Link href="/responsible-ai" className="hover:text-brand-600">Responsible AI</Link></li>
          </ul>
        </div>
        
        {/* Column 4 */}
        <div>
          <div className="font-semibold">Company</div>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link href="/" className="hover:text-brand-600">Home</Link></li>
            <li><Link href="/about" className="hover:text-brand-600">About</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-600">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-brand-600">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Learnzo &middot; Online platform &middot; learnzo.online
      </div>
    </footer>
  );
}