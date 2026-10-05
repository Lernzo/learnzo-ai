export interface DirectJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Internship" | "Government" | "Walk-in" | "Remote";
  category: "IT/Tech" | "Non-Tech" | "Internship" | "Government" | "Commerce" | "Engineering";
  qualification: string;
  salary: string;
  deadline?: string;
  applyLink: string;
  description: string;
  postedAt: string;
  isActive: boolean;
  isVerified: boolean;
}

export const DIRECT_JOBS: DirectJob[] = [
  {
    id: "tcs-nqt-2026",
    title: "TCS NQT - Prime & Digital Cadre",
    company: "TCS",
    location: "Pan India",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech, MCA, MSc, BCA, BSc",
    salary: "Rs. 3.36 LPA - Rs. 9.30 LPA",
    applyLink: "https://nextstep.tcsapps.com/indiacampus/#/",
    description: "TCS All India NQT Hiring for Prime and Digital cadres. 2024, 2025 and 2026 graduates eligible. In-centre test at TCS iON centres. Register on the official TCS NextStep portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "tcs-bps-2026",
    title: "TCS BPS Hiring - Arts & Commerce Graduates",
    company: "TCS",
    location: "Pan India",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "B.Com, BA, BAF, BBI, BBA, BBM, BMS (2026 batch)",
    salary: "Rs. 2.30 LPA - Rs. 3.0 LPA",
    applyLink: "https://www.tcs.com/careers/india/tcs-bps-fresher-hiring",
    description: "TCS Business Processing Services hiring for 2026 batch. Arts and Commerce graduates eligible. Apply through the TCS BPS page which redirects to the official NextStep registration.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "infosys-set-2026",
    title: "Systems Engineer Trainee",
    company: "Infosys",
    location: "Pan India",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech, ME/MTech, MCA, MSc",
    salary: "Rs. 3.6 LPA",
    applyLink: "https://www.infosys.com/careers/apply.html",
    description: "Infosys is hiring freshers for Systems Engineer Trainee. Apply on the official Infosys careers portal with your academic details, CGPA and graduation year.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "wipro-elite-nth-2026",
    title: "Wipro Elite NTH - Project Engineer",
    company: "Wipro",
    location: "Pan India",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech (2024-2026 batch)",
    salary: "Rs. 3.5 LPA",
    applyLink: "https://careers.wipro.com/careers-home/",
    description: "Wipro National Talent Hunt for 2026 freshers. Online test at home. Direct registration on careers.wipro.com - search for Elite NTH in the current openings.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "wipro-trainee-gurugram",
    title: "Trainee",
    company: "Wipro",
    location: "Gurugram",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "Any graduate with testing interest",
    salary: "Not Disclosed",
    applyLink: "https://careers.wipro.com/job/Trainee/203199-en_US",
    description: "Wipro Trainee role in Gurugram. Support testing activities, prepare test data and assist in unit testing. Full-time position. Apply directly on Wipro careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "accenture-banking-chennai",
    title: "Banking Operations New Associate",
    company: "Accenture",
    location: "Chennai",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "BBA, BCom",
    salary: "Not Disclosed",
    applyLink: "https://www.accenture.com/in-en/careers",
    description: "Banking Operations New Associate at Accenture Chennai. 0-1 years experience. BBA and BCom graduates. Apply on the official Accenture careers page.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "cognizant-graduate-analyst-2026",
    title: "Graduate Analyst (2026)",
    company: "Cognizant",
    location: "Chennai, Hyderabad, Bengaluru",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "Diploma or Bachelor in CS, Analytics, Maths, Engineering",
    salary: "Rs. 4 LPA - Rs. 6.5 LPA",
    applyLink: "https://careers.cognizant.com/india-en/",
    description: "Cognizant Graduate Analyst 2026 program. 12-month graduate development program with full-stack development training. Apply on the official Cognizant careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "capgemini-fresher-2026",
    title: "Fresher Roles - Multiple Domains",
    company: "Capgemini",
    location: "Bengaluru, Mumbai, Pune, Kolkata",
    type: "Full-time",
    category: "IT/Tech",
    qualification: "BE/BTech, BSc, BCA, MCA",
    salary: "Rs. 3.4 LPA - Rs. 4.2 LPA",
    applyLink: "https://www.capgemini.com/in-en/careers/join-capgemini/students-and-graduates/",
    description: "Capgemini India fresher openings across IT, finance and operations. Search current openings on the official students and graduates portal and apply directly.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "hcl-early-career",
    title: "Early Career Associate - Sales",
    company: "HCLTech",
    location: "Multiple",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "Any graduate with sales interest",
    salary: "Not Disclosed",
    applyLink: "https://careers.hcltech.com/",
    description: "HCLTech Early Career Associate role for fresh graduates. Structured learning on IT services and sales process. Full-time position. Apply on HCLTech careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "hcl-process-associate-gurugram",
    title: "Process Associate - Non-Tech Freshers",
    company: "HCLTech",
    location: "Gurugram",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "BA, BCom, BBA (non-tech graduates only)",
    salary: "Not Disclosed",
    applyLink: "https://www.hcltech.com/careers",
    description: "HCLTech invites non-tech freshers for the Process Associate role in Gurugram. Any non-technical graduate can apply. Register on HCLTech official careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "techmahindra-customer-support",
    title: "Customer Support Associate",
    company: "Tech Mahindra",
    location: "Visakhapatnam",
    type: "Full-time",
    category: "Non-Tech",
    qualification: "10+2 or 3-year diploma",
    salary: "Not Disclosed",
    applyLink: "https://careers.techmahindra.com/",
    description: "Tech Mahindra hiring Customer Support Associates in Visakhapatnam. Freshers welcome. Good Hindi and English communication required. Apply on Tech Mahindra careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "zoho-intern-2026",
    title: "Software Developer / Product Intern",
    company: "Zoho",
    location: "Chennai, Hyderabad, Tenkasi",
    type: "Internship",
    category: "Internship",
    qualification: "BE/BTech/MCA/MSc (CS/IT) - 2026 batch",
    salary: "Competitive stipend",
    applyLink: "https://careers.zohocorp.com/",
    description: "Zoho Software Developer / Product Intern 2026 for Java, Python and .NET tracks. Work on real products (Zoho Creator, CRM, Books). Apply on the official Zoho careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "freshworks-intern-2026",
    title: "Full Stack Developer Intern",
    company: "Freshworks",
    location: "Bengaluru",
    type: "Internship",
    category: "Internship",
    qualification: "BE/BTech/BCA/MCA/BSc (CS, IT) - 2026 batch",
    salary: "Rs. 48,000 per month",
    applyLink: "https://www.freshworks.com/company/careers/",
    description: "Freshworks Full Stack Developer Intern in Bengaluru. Hands-on work on a live product. 2026 freshers and final-year students. Apply on Freshworks official careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "rbi-grade-b-2026",
    title: "Grade B Officer",
    company: "Reserve Bank of India",
    location: "Multiple",
    type: "Government",
    category: "Government",
    qualification: "Graduation with 60 percent (varies by post)",
    salary: "Rs. 1.41 Lakh per month",
    applyLink: "https://opportunities.rbi.org.in/scripts/vacancies.aspx",
    description: "RBI Grade B Officer recruitment 2026. 60 vacancies. Apply online on the official RBI opportunities portal. Check eligibility, dates and full notification on rbi.org.in.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "sbi-clerk-2026",
    title: "Junior Associate (Customer Support & Sales)",
    company: "State Bank of India",
    location: "All India",
    type: "Government",
    category: "Government",
    qualification: "Graduation in any discipline",
    salary: "Rs. 64,000 per month starting",
    applyLink: "https://sbi.co.in/web/careers",
    description: "SBI Clerk recruitment 2026. Over 9,000 Junior Associate vacancies across India. Apply online on the official SBI careers portal. Check notification for state-wise vacancies.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  },
  {
    id: "nabard-yp-2026",
    title: "Young Professionals",
    company: "NABARD",
    location: "Mumbai, Delhi, Chennai",
    type: "Government",
    category: "Government",
    qualification: "Post-graduation in relevant field",
    salary: "Rs. 70,000 per month",
    applyLink: "https://www.nabard.org/careers.aspx",
    description: "NABARD Young Professionals 2026 for 44 posts across IT, Finance, Agri and other disciplines. Contract basis. Apply through the official NABARD careers portal.",
    postedAt: "2026-10-05",
    isActive: true,
    isVerified: true
  }
];

export const CATEGORIES = [
  { id: "all", label: "All Jobs" },
  { id: "IT/Tech", label: "IT & Tech" },
  { id: "Non-Tech", label: "Non-Tech" },
  { id: "Internship", label: "Internships" },
  { id: "Government", label: "Government" },
  { id: "Commerce", label: "Commerce" }
] as const;

export function getActiveDirectJobs() {
  return DIRECT_JOBS.filter((j) => j.isActive);
}

export function getDirectJobsByCategory(category: string) {
  if (category === "all") return getActiveDirectJobs();
  return getActiveDirectJobs().filter((j) => j.category === category);
}