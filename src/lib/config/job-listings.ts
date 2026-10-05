export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Internship" | "Remote" | "Government" | "Walk-in";
  category: "IT/Tech" | "Non-Tech" | "Internship" | "Remote" | "Government" | "Commerce";
  qualification: string;
  salary: string;
  deadline?: string;
  applyLink: string;
  description: string;
  postedAt: string;
  isActive: boolean;
  isVerified: boolean;
}

export const JOB_LISTINGS: JobListing[] = [
  // ---------- IT / TECH ----------
  {
    id: "job-infosys-set-2026",
    title: "Systems Engineer Trainee",
    company: "Infosys",
    location: "Pan India",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech, ME/MTech, MCA, MSc",
    salary: "â‚¹3.6 LPA",
    applyLink: "https://tinyurl.com/infosys-fresher",
    description: "Infosys is hiring freshers for the Systems Engineer Trainee role across Pan India. Candidates with BE/BTech, ME/MTech, MCA, or MSc degrees are eligible.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-tcs-nqt-2026",
    title: "NQT â€” Prime & Digital Cadre",
    company: "TCS",
    location: "Pan India",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech, MCA, MSc, BCA, BSc",
    salary: "â‚¹3.36 LPA â€“ â‚¹9.30 LPA",
    applyLink: "https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring",
    description: "TCS All India NQT Hiring 2026 for Prime and Digital cadres. Open to 2024, 2025 and 2026 graduates. In-centre test at TCS iON centres.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-cognizant-ga-2026",
    title: "Graduate Analyst (2026)",
    company: "Cognizant",
    location: "Chennai, Hyderabad, Bengaluru",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech, BCA, BSc (IT/CS)",
    salary: "â‚¹4 LPA â€“ â‚¹6.5 LPA",
    applyLink: "https://careers.cognizant.com",
    description: "Cognizant Graduate Program 2026. Roles in Quality Engineering, Application Development, AI & Analytics. Bachelor's degree in IT, CS, or Software Engineering required.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-heizen-swe-2026",
    title: "Software Engineer (Remote)",
    company: "Heizen",
    location: "Remote",
    type: "Remote",
    category: "IT/Tech",
    qualification: "BE/BTech or equivalent",
    salary: "â‚¹12 LPA â€“ â‚¹18 LPA + ESOPs",
    applyLink: "https://education.sakshi.com",
    description: "Heizen is hiring Software Engineers for remote roles. Freshers can apply. Salary up to â‚¹18 LPA plus ESOPs and performance bonuses.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-red6-ai-intern",
    title: "AI Engineer Intern",
    company: "red6.ai",
    location: "Remote (India)",
    type: "Internship",
    category: "IT/Tech",
    qualification: "BE/BTech (CS/IT) or final year students",
    salary: "â‚¹20,000 â€“ â‚¹30,000/month",
    applyLink: "https://wellfound.com",
    description: "AI Engineering Intern for Document & Voice Systems. Remote, India. Work on real AI projects. Apply via Wellfound.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: false
  },

  // ---------- NON-TECH ----------
  {
    id: "job-accenture-banking-2026",
    title: "Banking Operations New Associate",
    company: "Accenture",
    location: "Chennai",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "BBA, BCom",
    salary: "Not Disclosed",
    applyLink: "https://www.accenture.com",
    description: "Banking Operations New Associate at Accenture Chennai. 0-1 years experience. BBA/BCom graduates eligible.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-hcl-process-associate",
    title: "Process Associate (Non-Tech Freshers)",
    company: "HCLTech",
    location: "Gurugram",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "BA, BCom, BBA (Non-Tech Graduates only)",
    salary: "Not Disclosed",
    applyLink: "https://www.naukri.com",
    description: "HCL invites Non-Tech freshers for the Process Associate role in Gurugram. Any non-technical graduate (BA, BCom, BBA) can apply. Technical graduates not eligible.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-invest-india-junior-specialist",
    title: "Junior Specialist â€” Procurement",
    company: "Invest India",
    location: "New Delhi",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "Bachelor's/Master's in Supply Chain, BBA, Commerce",
    salary: "Not Disclosed",
    applyLink: "https://www.investindia.gov.in",
    description: "Invest India is hiring Junior Specialists for procurement functions. 0-2 years experience. Ideal for early-career professionals building a foundation in public procurement.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },

  // ---------- INTERNSHIPS ----------
  {
    id: "intern-codesoar-it-sales",
    title: "IT Sales Executive Intern",
    company: "CodeSoar Technologies",
    location: "Remote â€” Pan India",
    type: "Internship",
    category: "Internship",
    qualification: "Any graduate / final year student",
    salary: "â‚¹10,000/month",
    applyLink: "https://internship.aicte-india.org",
    description: "Full-time remote internship for freshers and recent graduates. Performance-based full-time opportunity after the internship period.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "intern-whatbytes-ux",
    title: "UX/UI Designer Internship",
    company: "WhatBytes",
    location: "Remote",
    type: "Internship",
    category: "Internship",
    qualification: "Any graduate with design interest",
    salary: "â‚¹8,000 â€“ â‚¹15,000/month",
    applyLink: "https://wellfound.com",
    description: "Remote UX/UI Designer internship at an early-stage startup. No prior experience required. Portfolio helps.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: false
  },
  {
    id: "intern-club-mahindra-hr",
    title: "Human Resource Intern",
    company: "Club Mahindra",
    location: "Pune",
    type: "Internship",
    category: "Internship",
    qualification: "MBA/BBA/PGDM (HR)",
    salary: "Not Disclosed",
    applyLink: "https://www.naukri.com",
    description: "HR internship at Club Mahindra, Pune. Assist in end-to-end recruitment for entry-level and mid-level roles.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },

  // ---------- COMMERCE ----------
  {
    id: "job-dmart-accounts",
    title: "Accounts Officer â€” SAP",
    company: "DMart",
    location: "Bhiwandi, Mumbai",
    type: "Full-time",
    category: "Commerce",
    qualification: "B.Com, BBA, M.Com",
    salary: "Not Disclosed",
    applyLink: "https://www.naukri.com",
    description: "Accounts & SAP Executive (Fresher Friendly). B.Com / BBA / M.Com freshers welcome. 0-2 years experience.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-adecco-o2c-trainee",
    title: "Trainee â€” Order to Cash (O2C)",
    company: "Adecco India",
    location: "Bengaluru",
    type: "Full-time",
    category: "Commerce",
    qualification: "B.Com, BBA, Finance graduates",
    salary: "Not Disclosed",
    applyLink: "https://www.naukri.com",
    description: "Adecco is hiring fresh graduates for the Order to Cash team in Bengaluru. Commerce/Finance graduates preferred.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },

  // ---------- GOVERNMENT ----------
  {
    id: "job-trai-associate-consultant",
    title: "Associate Consultant (Technical-ECE)",
    company: "TRAI",
    location: "New Delhi",
    type: "Government",
    category: "Government",
    qualification: "B.E./B.Tech in Electronics & Communication",
    salary: "â‚¹80,000/month",
    applyLink: "https://www.ndtv.com",
    description: "Telecom Regulatory Authority of India (TRAI) is hiring freshers for Associate Consultant roles. No prior work experience required. Salary â‚¹80,000/month.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "job-nabard-young-professional",
    title: "Young Professionals",
    company: "NABARD",
    location: "Multiple Locations",
    type: "Government",
    category: "Government",
    qualification: "Post-graduation in relevant field",
    salary: "Not Disclosed",
    applyLink: "https://www.linkedin.com",
    description: "NABARD is hiring Young Professionals across multiple locations. Part of 300+ Young Professional roles in Ministries, PSUs and national institutions in 2026.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: false
  }
];

export const CATEGORIES = [
  { id: "all", label: "All Jobs" },
  { id: "IT/Tech", label: "IT & Tech" },
  { id: "Non-Tech", label: "Non-Tech" },
  { id: "Internship", label: "Internships" },
  { id: "Remote", label: "Remote" },
  { id: "Commerce", label: "Commerce" },
  { id: "Government", label: "Government" }
] as const;

export function getActiveListings() {
  return JOB_LISTINGS.filter((j) => j.isActive);
}

export function getListingsByCategory(category: string) {
  if (category === "all") return getActiveListings();
  return getActiveListings().filter((j) => j.category === category);
}