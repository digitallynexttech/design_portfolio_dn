// The studio, from DNMS (8 Oct 2026). Public titles show discipline, not seniority grade.
// No individual portraits exist; the About page sets names in type over real studio photos.

import type { CaseStudy } from "./types";
import { CASE_STUDIES } from "./work";

export type Person = {
  id: string;
  name: string;
  title: string;
  group: "WEM" | "VIM" | "Studio";
};

export const TEAM: Person[] = [
  { id: "diwakar-jha", name: "Diwakar Jha", title: "Web Lead", group: "WEM" },
  { id: "mridul-singh-bisht", name: "Mridul Singh Bisht", title: "Full Stack Developer", group: "WEM" },
  { id: "karan-joshi", name: "Karan Joshi", title: "Full Stack Developer", group: "WEM" },
  { id: "pratik-paul", name: "Pratik Paul", title: "Designer", group: "VIM" },
  { id: "komal-gautam", name: "Komal Gautam", title: "Designer", group: "VIM" },
  { id: "anukriti-singh", name: "Anukriti Singh", title: "Designer", group: "VIM" },
  { id: "dev-lal", name: "Dev Lal", title: "Video & Motion", group: "VIM" },
  { id: "teesha-jain", name: "Teesha Jain", title: "Social & Accounts", group: "Studio" },
  { id: "gokul-menon", name: "Gokul Menon", title: "Alliances & Partnerships", group: "Studio" },
  { id: "harsh-kumar", name: "Harsh Kumar", title: "PR", group: "Studio" },
  { id: "ayushi-pandey", name: "Ayushi Pandey", title: "People & HR", group: "Studio" },
];

export const LEADERSHIP = { name: "Deepak Goel", title: "Group CEO" };

const byId = new Map(TEAM.map((person) => [person.id, person]));

export function person(id: string): Person {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown team member "${id}" — add them to content/team.ts`);
  return found;
}

/** The case studies a person is credited on, in site order (from each study's `credits`). */
export function creditsFor(personId: string): CaseStudy[] {
  return CASE_STUDIES.filter((study) => study.credits.some((credit) => credit.people.includes(personId)));
}
