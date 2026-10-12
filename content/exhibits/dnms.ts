import type { Img } from "../types";

// Exhibit data for the DNMS case study.
// Every screen below comes from DNMS's own Help screenshots (DNMS/public/help-shots), which are taken in
// a separate, made-up "Demo Company" (features/help/demo/dataset.ts). No real person, salary or client
// appears. The payslip is cropped to its break-up table so the payroll header is not shown.
// The screenshots use DNMS's default Charcoal theme, not Aurora.

export const DNMS_SCREENS: (Img & { module: string })[] = [
  {
    module: "Ask DNMS",
    src: "/work/dnms/ask-dnms.webp",
    alt: "An employee dashboard with the Ask DNMS panel open, offering questions such as 'What's overdue right now?'",
    width: 1400,
    height: 875,
  },
  {
    module: "HR dashboard",
    src: "/work/dnms/dashboard-hr.webp",
    alt: "The HR dashboard: headcount, new joiners, documents, a department ring chart and recent joiners",
    width: 1400,
    height: 875,
  },
  {
    module: "Org chart",
    src: "/work/dnms/org-chart.webp",
    alt: "The organisation chart of the demo company, from the director down through two levels of reports",
    width: 1400,
    height: 875,
  },
  {
    module: "Attendance",
    src: "/work/dnms/attendance-calendar.webp",
    alt: "A month of attendance as a calendar, each day showing check-in, check-out and hours, with leave, holiday and work-from-home days coloured",
    width: 1400,
    height: 875,
  },
  {
    module: "Project goals",
    src: "/work/dnms/project-goals.webp",
    alt: "A project's goals board: overall progress, goals in progress and one marked at risk",
    width: 1400,
    height: 875,
  },
  {
    module: "Deliverables",
    src: "/work/dnms/project-deliverables.webp",
    alt: "A project's deliverables by week, with the teams involved and planned versus delivered counts",
    width: 1400,
    height: 875,
  },
  {
    module: "My progress",
    src: "/work/dnms/my-progress.webp",
    alt: "A person's own deliverables as a ring chart by status, with a breakdown by project",
    width: 1400,
    height: 875,
  },
  {
    module: "SEO monitoring",
    src: "/work/dnms/seo-setup.webp",
    alt: "The SEO tab for a client website: a step-by-step setup with Search Console connected and money keywords set",
    width: 1400,
    height: 875,
  },
  {
    module: "Uptime & renewals",
    src: "/work/dnms/monitoring.webp",
    alt: "A project's monitoring tab: one site up, one staging site down for 49 minutes with an 'I'm on it' button, and renewals below",
    width: 1400,
    height: 875,
  },
  {
    module: "Project chat",
    src: "/work/dnms/project-chat.webp",
    alt: "A project chat thread about a launch plan, with mentions and a reaction",
    width: 1400,
    height: 875,
  },
  {
    module: "Payroll",
    src: "/work/dnms/payslip.webp",
    alt: "The break-up table of a demo payslip: basic, HRA and allowances, working days and the total in words",
    width: 1120,
    height: 484,
  },
  {
    module: "AI connections",
    src: "/work/dnms/ai-connections.webp",
    alt: "The AI Connections page: the connector address and steps for Claude, ChatGPT and Claude Code, with one active Claude connection",
    width: 1400,
    height: 875,
  },
  {
    module: "Themes",
    src: "/work/dnms/theme-picker.webp",
    alt: "The theme picker with eight dark palettes, Aurora among them",
    width: 1400,
    height: 542,
  },
  {
    module: "Analytics",
    src: "/work/dnms/analytics.webp",
    alt: "Four HR charts: monthly hires, headcount by department, employee status and the recruitment pipeline",
    width: 1400,
    height: 714,
  },
];

/**
 * A scripted replay of the Claude connector answering one question in the demo workspace.
 * It is asked as Rohan Verma (Creative Lead, demo company), whose direct reports are Priya, Ananya,
 * Vikram, Sneha, Arjun, Rahul and Pooja, all made-up people. Paths are real DNMS endpoints
 * (features/mcp/server/api-routes.generated.ts); the results follow the demo seed (prisma/demo/timeoff.ts).
 * Leave types are left out on purpose: DNMS's own "who is away" tool never shows them either.
 */
export const DNMS_REPLAY: {
  question: string;
  steps: { tool: "dnms_find_endpoints" | "dnms_get"; input: string; output: string }[];
  answer: string;
} = {
  question: "Who on my team is away next week?",
  steps: [
    {
      tool: "dnms_find_endpoints",
      input: "team leave requests",
      output: "GET /api/leave/my-team: your direct reports' leave requests, filterable by status",
    },
    {
      tool: "dnms_get",
      input: "/api/leave/my-team?status=APPROVED",
      output: "One approved day, Vikram Singh this Friday. Nothing approved for next week.",
    },
    {
      tool: "dnms_get",
      input: "/api/leave/my-team?status=PENDING",
      output: "4 requests waiting on you; one falls next week: Priya Sharma, Thursday and Friday.",
    },
    {
      tool: "dnms_find_endpoints",
      input: "work from home requests team",
      output: "GET /api/wfh/my-team: work-from-home requests, scope=team for your direct reports",
    },
    {
      tool: "dnms_get",
      input: "/api/wfh/my-team?scope=team&status=PENDING",
      output: "2 waiting: Sneha Reddy tomorrow, Priya Sharma next Tuesday.",
    },
  ],
  answer:
    "Just Priya Sharma. She has asked to work from home on Tuesday and to take Thursday and Friday off. Both requests are waiting for your approval, and I won't change anything until you say so.",
};
