import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getActiveDirectJobs, CATEGORIES } from "@/lib/config/direct-jobs";

export const metadata: Metadata = {
  title: "Latest Job Openings for Freshers - Learnzo",
  description:
    "Direct-apply fresher jobs in India. TCS, Infosys, Wipro, Accenture, Cognizant, RBI, SBI and more. Every link goes straight to the employer's official application page."
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function JobsPage() {
  const jobs = getActiveDirectJobs();

  return (
    <>
      <Nav />
      <main>

        <section className="bg-gradient-to-b from-brand-50/70 to-white">
          <div className="container-x py-12 lg:py-16 max-w-4xl">
            <Badge>Direct employer links</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Latest Job Openings
              <span className="text-brand-600"> for freshers.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-700 leading-relaxed max-w-2xl">
              Every link on this page goes straight to the employer&apos;s official
              application page. No middlemen, no redirects, no third-party job boards.
              Apply directly to TCS, Infosys, Wipro, Accenture, RBI, SBI and more.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white border border-slate-200 px-4 py-2">
                <strong className="text-brand-700">{jobs.length}</strong> live openings
              </span>
              <span className="rounded-full bg-white border border-slate-200 px-4 py-2">
                Updated {formatDate("2026-10-05")}
              </span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="https://www.linkedin.com/in/siddhswam-s-ba0838320/" target="_blank" rel="noopener noreferrer">
                <Button size="lg">Follow on LinkedIn for daily updates</Button>
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white border-y border-slate-100">
          <div className="container-x py-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={cat.id === "all" ? "#jobs" : `#cat-${cat.id.replace(/[^a-z]/gi, "")}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition"
                >
                  {cat.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="jobs" className="container-x py-12 lg:py-16">
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition" id={`cat-${job.category.replace(/[^a-z]/gi, "")}`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-brand-50 text-brand-700 px-3 py-1 font-semibold">{job.category}</span>
                      <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1">{job.location}</span>
                      <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1">{job.type}</span>
                      {job.isVerified && (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 font-medium">Verified</span>
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-slate-900">{job.title}</h2>
                    <div className="mt-1 text-base font-semibold text-slate-700">{job.company}</div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Qualification: </span>
                        <span className="text-slate-800">{job.qualification}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Salary: </span>
                        <span className="text-emerald-700 font-semibold">{job.salary}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{job.description}</p>
                    <div className="mt-3 text-xs text-slate-400">Posted {formatDate(job.postedAt)}</div>
                  </div>
                  <div className="shrink-0 lg:pt-4">
                    <a href={job.applyLink} target="_blank" rel="noopener noreferrer">
                      <Button>Apply Now</Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 text-white">
          <div className="container-x py-14">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-bold">Get daily job updates on LinkedIn</h2>
              <p className="mt-3 text-slate-300">
                New fresher openings are added every morning. Follow me on LinkedIn to see them in your feed first.
              </p>
              <div className="mt-6">
                <a href="https://www.linkedin.com/in/siddhswam-s-ba0838320/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="secondary">Follow on LinkedIn</Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="container-x py-14 max-w-3xl">
          <Card className="bg-brand-50/60 border-brand-100">
            <h2 className="text-xl font-bold">Know someone looking for a job?</h2>
            <p className="mt-2 text-slate-700">Share this page with friends and classmates.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="https://wa.me/?text=Latest%20fresher%20job%20openings%20with%20direct%20apply%20links%20https%3A%2F%2Flearnzo.online%2Fjobs" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Share on WhatsApp</Button>
              </a>
              <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Flearnzo.online%2Fjobs" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Share on LinkedIn</Button>
              </a>
            </div>
          </Card>
        </section>

      </main>
      <Footer />
    </>
  );
}