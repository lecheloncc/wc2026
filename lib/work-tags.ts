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

// Split Netherlands by office (Eindhoven / Breda) and add the other offices.
// `code` goes in the DB. `short` is a 3-char tag for the leaderboard table.
export const COUNTRIES = [
  { code: "NL-EHV", label: "Netherlands · Eindhoven", short: "EHV", flag: "🇳🇱" },
  { code: "NL-BRD", label: "Netherlands · Breda",     short: "BRD", flag: "🇳🇱" },
  { code: "ES",     label: "Spain",                   short: "ES",  flag: "🇪🇸" },
  { code: "US",     label: "United States",           short: "US",  flag: "🇺🇸" },
  { code: "PL",     label: "Poland",                  short: "PL",  flag: "🇵🇱" },
  { code: "FR",     label: "France",                  short: "FR",  flag: "🇫🇷" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function isWerk(): boolean {
  return process.env.NEXT_PUBLIC_INSTANCE_THEME === "werk";
}
