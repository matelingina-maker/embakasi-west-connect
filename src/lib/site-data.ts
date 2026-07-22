import type { ComponentType, SVGProps } from "react";
import {
  GraduationCap,
  Megaphone,
  Briefcase,
  HardHat,
  Users,
  Newspaper,
} from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  blurb: string;
  cta: string;
  tone: "primary" | "amber" | "blue" | "zinc" | "purple";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
};

export const WARDS = ["Umoja 1", "Umoja 2", "Mowlem", "Kariobangi South"] as const;
export type Ward = (typeof WARDS)[number];

export const services: Service[] = [
  {
    slug: "bursaries",
    title: "NG-CDF Bursaries",
    blurb:
      "Financial support for secondary and tertiary students within Embakasi West.",
    cta: "Learn more",
    tone: "primary",
    icon: GraduationCap,
    href: "/dashboard",
  },
  {
    slug: "report-issue",
    title: "Report an Issue",
    blurb:
      "Alert the constituency office about roads, drainage, streetlights, or security concerns.",
    cta: "File report",
    tone: "amber",
    icon: Megaphone,
    href: "/dashboard",
  },
  {
    slug: "internships",
    title: "Youth Internships",
    blurb:
      "Placement opportunities for graduates in various constituency departments and partner offices.",
    cta: "Browse openings",
    tone: "blue",
    icon: Users,
    href: "/opportunities",
  },
  {
    slug: "projects",
    title: "Ongoing Projects",
    blurb:
      "Transparency portal for all construction and social development works funded by NG-CDF.",
    cta: "Track progress",
    tone: "zinc",
    icon: HardHat,
    href: "/projects",
  },
  {
    slug: "jobs",
    title: "Local Jobs",
    blurb:
      "Verified employment opportunities within the Mowlem and Umoja industry zones.",
    cta: "View jobs",
    tone: "purple",
    icon: Briefcase,
    href: "/opportunities",
  },
  {
    slug: "notices",
    title: "Public Notices",
    blurb:
      "Stay updated on town hall meetings, health drives, tenders, and public holidays.",
    cta: "Read news",
    tone: "zinc",
    icon: Newspaper,
    href: "/news",
  },
];

export const toneStyles: Record<Service["tone"], string> = {
  primary: "bg-emerald-50 text-primary",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  zinc: "bg-zinc-100 text-zinc-900",
  purple: "bg-purple-50 text-purple-700",
};

export type Project = {
  id: string;
  title: string;
  description: string;
  ward: string;
  status: "Active" | "Completed" | "Planning";
  progress: number;
  image: string;
  category: string;
};

import hospitalImg from "@/assets/project-hospital.jpg";
import drainageImg from "@/assets/project-drainage.jpg";

export const projects: Project[] = [
  {
    id: "mowlem-hospital",
    title: "Mowlem Level 4 Hospital Expansion",
    description:
      "Adding a 50-bed maternity wing and new diagnostic laboratory equipment.",
    ward: "Umoja 2",
    status: "Active",
    progress: 65,
    image: hospitalImg,
    category: "Health",
  },
  {
    id: "kariobangi-drainage",
    title: "Phase 3 Drainage Reconstruction",
    description:
      "Modernizing flood management systems along Mutarakwa Road.",
    ward: "Kariobangi South",
    status: "Active",
    progress: 90,
    image: drainageImg,
    category: "Infrastructure",
  },
  {
    id: "umoja-school",
    title: "Umoja Primary Classroom Block",
    description:
      "Six new classrooms and a computer lab to relieve congestion at Umoja Primary.",
    ward: "Umoja 1",
    status: "Active",
    progress: 40,
    image: hospitalImg,
    category: "Education",
  },
  {
    id: "mountain-view-lights",
    title: "Mountain View Street Lighting",
    description:
      "Installation of 120 solar-powered high-mast streetlights across estate roads.",
    ward: "Mowlem",
    status: "Planning",
    progress: 15,
    image: drainageImg,
    category: "Security",
  },
];

export type NewsItem = {
  id: string;
  date: string;
  title: string;
  summary: string;
  tag: string;
};

export const news: NewsItem[] = [
  {
    id: "budget-2025",
    date: "24 SEP",
    title: "Upcoming Public Participation for FY 2025 Budget",
    summary:
      "Residents are invited to Mowlem Social Hall to voice priority areas for the next funding cycle.",
    tag: "Governance",
  },
  {
    id: "immunization",
    date: "22 SEP",
    title: "Health Drive: Free Immunization at Umoja Health Center",
    summary:
      "A week-long program targeting children under five years starting next Monday.",
    tag: "Health",
  },
  {
    id: "bursary-open",
    date: "15 SEP",
    title: "Bursary Applications Open for FY 2024/25",
    summary:
      "Secondary and tertiary students can now collect and submit application forms at the NG-CDF office.",
    tag: "Education",
  },
  {
    id: "sports-tournament",
    date: "08 SEP",
    title: "E-West Cup: Team Registrations Open",
    summary:
      "Youth football and netball teams are invited to register for the annual constituency tournament.",
    tag: "Youth",
  },
];

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  type: "Internship" | "Job" | "Tender" | "Attachment";
  location: string;
  deadline: string;
};

export const opportunities: Opportunity[] = [
  {
    id: "op-1",
    title: "Community Health Volunteer",
    organization: "Mowlem Level 4 Hospital",
    type: "Job",
    location: "Mowlem",
    deadline: "30 Oct 2024",
  },
  {
    id: "op-2",
    title: "Records Office Intern",
    organization: "NG-CDF Embakasi West",
    type: "Internship",
    location: "Umoja",
    deadline: "20 Oct 2024",
  },
  {
    id: "op-3",
    title: "ICT Attachment Programme",
    organization: "Constituency ICT Hub",
    type: "Attachment",
    location: "Kariobangi South",
    deadline: "05 Nov 2024",
  },
  {
    id: "op-4",
    title: "Supply of Office Stationery",
    organization: "NG-CDF Procurement",
    type: "Tender",
    location: "Constituency Office",
    deadline: "12 Oct 2024",
  },
];