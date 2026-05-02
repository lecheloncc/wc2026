// Tags for the work instance only. Used to attach a department and a country
// to each participant so we can break the leaderboard down by team / office.

export const DEPARTMENTS = [
  "Finance",
  "Sales",
  "Operations",
  "Legal",
  "HR",
  "Product",
  "IT",
  "Leadership",
  "Customer Success",
  "Marketing",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const COUNTRIES = [
  { code: "NL", label: "Netherlands", flag: "🇳🇱" },
  { code: "ES", label: "Spain",       flag: "🇪🇸" },
  { code: "US", label: "United States", flag: "🇺🇸" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function isWerk(): boolean {
  return process.env.NEXT_PUBLIC_INSTANCE_THEME === "werk";
}
