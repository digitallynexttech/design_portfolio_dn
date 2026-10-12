export const SITE_URL = "https://design.digitallynext.com";
export const MAIN_SITE = "https://www.digitallynext.com";
export const CONTACT_URL = `${MAIN_SITE}/contact`;
export const CAREERS_URL = `${MAIN_SITE}/careers`;
export const JOURNAL_URL = `${MAIN_SITE}/blog`;
export const PRIVACY_URL = `${MAIN_SITE}/privacy-policy`;

export const NAV = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
] as const;

export const SOCIALS = [
  { href: "https://www.instagram.com/digitallynext/", label: "Instagram" },
  { href: "https://www.linkedin.com/company/digitallynext/", label: "LinkedIn" },
  { href: "https://www.youtube.com/@digitallynext", label: "YouTube" },
] as const;

/** Static so pages stay prerendered (reading the clock in a server component opts out of caching). */
export const COPYRIGHT_YEAR = 2026;

/** Company facts (Karan, 8 Oct 2026). Tenure is always "12+ years"; never a founding year. */
export const FACTS = {
  years: "12+",
  brands: "50+",
  city: "New Delhi",
} as const;
