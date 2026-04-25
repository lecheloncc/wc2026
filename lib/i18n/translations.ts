// Lightweight i18n. Keys are plain English strings; the NL dictionary maps each
// to its Dutch equivalent. Missing keys fall back to the key itself (English).

export type Lang = "nl" | "en";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

// Dutch translations. English is the fallback (returns the key).
export const NL: Record<string, string> = {
  // Nav
  "Matches": "Wedstrijden",
  "Groups": "Groepen",
  "Predictions": "Voorspellingen",
  "Bracket": "Knockout",
  "Leaderboard": "Stand",
  "Rules": "Regels",
  "Admin": "Beheer",
  "Account": "Account",
  "Sign Out": "Uitloggen",
  "Profile menu": "Profielmenu",
  "Playing as": "Speelt als",
  "(you)": "(jij)",

  // Dashboard
  "Welcome back": "Welkom terug",
  "Total Points": "Totaal punten",
  "Rank": "Positie",
  "Next Match": "Volgende wedstrijd",
  "Enter Prediction": "Voorspelling invoeren",
  "All Matches": "Alle wedstrijden",
  "Group Order": "Groepsvolgorde",
  "Pre-tournament Deadline": "Deadline vóór toernooi",
  "Locked — tournament has started": "Gesloten — toernooi is begonnen",
  "left": "te gaan",
  "Opening kickoff": "Openingswedstrijd",
  "Champion / Finalists / Dark Horse": "Kampioen / Finalisten / Dark Horse",
  "Topscorer Picks": "Topscoorders",

  // Auth
  "Coach Login": "Coach inloggen",
  "Back to the dugout": "Terug naar de dug-out",
  "Join the Tournament": "Doe mee aan het toernooi",
  "Create your account": "Maak je account aan",
  "Email Address": "E-mailadres",
  "Password": "Wachtwoord",
  "Forgot Password?": "Wachtwoord vergeten?",
  "Enter Dashboard": "Naar dashboard",
  "Create Account": "Account aanmaken",
  "Already have an account? Log In": "Heb je al een account? Log in",
  "New here? Create an account": "Nieuw hier? Maak een account aan",
  "Reset Password": "Wachtwoord opnieuw instellen",
  "We'll send you a recovery link": "We sturen je een herstellink",
  "Check Your Email": "Check je e-mail",
  "We've sent a password reset link to": "We hebben een herstellink gestuurd naar",
  "Send Reset Link": "Stuur herstellink",
  "Back to Login": "Terug naar inloggen",
  "Back": "Terug",
  "New Password": "Nieuw wachtwoord",
  "New password": "Nieuw wachtwoord",
  "Update Password": "Wachtwoord bijwerken",
  "Password updated. You can now log in.":
    "Wachtwoord bijgewerkt. Je kunt nu inloggen.",
  "Go to App": "Naar de app",

  // Account
  "Signed in as": "Ingelogd als",
  "Manage your display name and add play accounts for kids.":
    "Beheer je weergavenaam en voeg speelaccounts voor kinderen toe.",
  "Your Profile": "Jouw profiel",
  "Display name": "Weergavenaam",
  "Shown on the leaderboard.": "Wordt getoond op de stand.",
  "Save": "Opslaan",
  "Kid Accounts": "Kinderaccounts",
  "Add play accounts for kids. Each one has its own predictions and leaderboard ranking. Switch who you're playing as via the dropdown in the top nav.":
    "Voeg speelaccounts toe voor kinderen. Elk account heeft eigen voorspellingen en eigen plek in de stand. Wissel wie je speelt via het menu rechtsboven.",
  "No kid accounts yet.": "Nog geen kinderaccounts.",
  "Add a kid account": "Kinderaccount toevoegen",
  "Child name (e.g. Alex)": "Naam van het kind (bv. Alex)",
  "Will be saved as:": "Wordt opgeslagen als:",
  "A kid with this name already exists.": "Een kind met deze naam bestaat al.",
  "Add": "Toevoegen",
  "Rename": "Hernoemen",
  "Cancel": "Annuleren",
  "Confirm": "Bevestig",
  "Delete (also wipes predictions)": "Verwijderen (wist ook voorspellingen)",
  "Display name updated.": "Weergavenaam bijgewerkt.",
  "Kid account added.": "Kinderaccount toegevoegd.",
  "Kid account updated.": "Kinderaccount bijgewerkt.",
  "Kid account deleted (predictions wiped).":
    "Kinderaccount verwijderd (voorspellingen gewist).",

  // Matches
  "Loading…": "Laden…",
  "Group": "Groep",
  "Pick": "Keuze",
  "Pick:": "Keuze:",
  "No pick": "Geen keuze",
  "locked": "gesloten",
  "Saving as": "Opslaan als",
  "Save Prediction": "Voorspelling opslaan",
  "Saved!": "Opgeslagen!",
  "Saving…": "Opslaan…",
  "Locked at kickoff": "Gesloten bij aftrap",
  "Save failed:": "Opslaan mislukt:",
  "Result:": "Uitslag:",
  "Correct outcome": "Juiste uitslag (W/G/V)",
  "Goal difference": "Doelsaldo",
  "One side exact": "Eén kant exact",
  "Exact bonus": "Exact bonus",
  "Total": "Totaal",
  "Perfect score!": "Perfecte voorspelling!",
  "Home": "Thuis",
  "Away": "Uit",
  "TBD": "Nog onbekend",

  // Groups
  "Group Stage Order": "Volgorde groepsfase",
  "Rank 1st → 4th. 3 pts per correct slot · 5 pt bonus for a perfect group. Locks at the opening match.":
    "Rangschik 1e → 4e. 3 ptn per juiste plek · 5 pt bonus voor een perfect ingevulde groep. Sluit bij de openingswedstrijd.",
  "Save Order": "Volgorde opslaan",
  "Correct slots": "Juiste plekken",
  "Perfect bonus": "Perfect-bonus",
  "Perfect group!": "Perfecte groep!",

  // Predictions / Tournament
  "Pre-tournament picks: champion, finalists, dark horse, topscorers. Locks at the opening match. Up to":
    "Pre-toernooi voorspellingen: kampioen, finalisten, dark horse, topscoorders. Sluit bij de openingswedstrijd. Maximaal",
  "pts on the line — plus the topscorer stream.":
    "punten te verdienen — plus de topscoorder-bonus.",
  "Champion": "Kampioen",
  "30 pts if your pick lifts the trophy": "30 ptn als jouw keuze de beker pakt",
  "Finalists": "Finalisten",
  "10 pts per correct team · +10 bonus if both right (max 30). Order doesn't matter.":
    "10 ptn per juist team · +10 bonus als beide kloppen (max 30). Volgorde maakt niet uit.",
  "Finalist A": "Finalist A",
  "Finalist B": "Finalist B",
  "Dark Horse": "Dark Horse",
  "One Pot 3 / Pot 4 team. R16 = 10 · QF = +10 · SF = +15 (max 35)":
    "Eén team uit Pot 3 of Pot 4. 1/8 = 10 · 1/4 = +10 · 1/2 = +15 (max 35)",
  "Pick 3 players. 2 pts per goal · +10 if one of your picks wins the Golden Boot.":
    "Kies 3 spelers. 2 ptn per goal · +10 als één van je keuzes de Gouden Schoen wint.",
  "Your picks": "Jouw keuzes",
  "No players selected yet.": "Nog geen spelers gekozen.",
  "Combined goals so far:": "Goals tot nu toe:",
  "pts)": "ptn)",
  "Save Topscorer Picks": "Topscoorders opslaan",
  "Picks locked": "Keuzes gesloten",
  "Search player or team…": "Zoek speler of land…",
  "No players match.": "Geen spelers gevonden.",
  "— Select team —": "— Kies team —",
  "Picked:": "Gekozen:",
  "Save Picks": "Keuzes opslaan",
  "Save Champion / Finalists / Dark Horse":
    "Kampioen / Finalisten / Dark Horse opslaan",
  "Saves all completed sections (Champion · Finalists · Dark Horse · Topscorer). Sections that aren't fully filled in are skipped.":
    "Slaat alle volledig ingevulde onderdelen op (Kampioen · Finalisten · Dark Horse · Topscoorders). Niet-volledige onderdelen worden overgeslagen.",
  "Topscorer picks have their own Save button above.":
    "Topscoorders hebben hun eigen knop hierboven.",
  "Picks locked at tournament kickoff": "Keuzes gesloten bij start toernooi",
  "Your bonus score": "Jouw bonuspunten",
  "Both finalists bonus": "Bonus beide finalisten",

  // Leaderboard
  "Player": "Speler",
  "Match": "Wedstrijd",
  "Scorer": "Topscoorder",
  "Bonus": "Bonus",
  "No scores yet. Come back after the opening match!":
    "Nog geen punten. Kom terug na de openingswedstrijd!",

  // Bracket
  "Knockout Bracket": "Knockout-schema",
  "Scoring multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4.":
    "Punten-vermenigvuldigers: 1/8 ×1,5 · 1/4 ×2 · 1/2 ×3 · 3e plek/Finale ×4.",

  // Rules
  "Rules & Scoring": "Regels & punten",
  "Match predictions (all 104 matches)": "Wedstrijdvoorspellingen (alle 104)",
  "Correct outcome (Win/Draw/Loss):": "Juiste uitslag (winst/gelijk/verlies):",
  "3 pts": "3 ptn",
  "Correct goal difference:": "Juist doelsaldo:",
  "+2 pts": "+2 ptn",
  "One team's score exact:": "Score van één team exact:",
  "+1 pt": "+1 pt",
  "Fully exact score:": "Volledig exacte uitslag:",
  "+5 pt bonus": "+5 ptn bonus",
  "Perfect pick = 3 + 2 + 1 + 5 =": "Perfecte voorspelling = 3 + 2 + 1 + 5 =",
  "11 pts": "11 ptn",
  "Knockout multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4":
    "Knockout-vermenigvuldigers: 1/8 ×1,5 · 1/4 ×2 · 1/2 ×3 · 3e plek/Finale ×4",
  "Group-stage order (12 groups)": "Groepsvolgorde (12 groepen)",
  "per team placed in the correct slot (1st–4th)":
    "per team op de juiste plek (1e–4e)",
  "if all four slots are perfect": "als alle vier plekken kloppen",
  "Locks at the tournament's opening kickoff (same as topscorer picks)":
    "Sluit bij de aftrap van de openingswedstrijd (zelfde als topscoorders)",
  "Tournament picks (all bonus)": "Toernooi-voorspellingen (allemaal bonus)",
  "Set-and-forget pre-tournament predictions, all on the":
    "Doe-en-vergeet voorspellingen vóór het toernooi, allemaal op het",
  "tab. Lock at the opening match.": "tabblad. Sluit bij de openingswedstrijd.",
  "Champion: 30 pts if your pick wins the trophy":
    "Kampioen: 30 ptn als jouw keuze de beker pakt",
  "Finalists pair: 10 pts per correct finalist · +10 if both right (max 30)":
    "Finalisten: 10 ptn per juiste finalist · +10 als beide kloppen (max 30)",
  "Dark Horse (Pot 3 or Pot 4 team): 10 if reaches R16 · +10 QF · +15 SF (max 35)":
    "Dark Horse (team uit Pot 3 of 4): 10 bij 1/8 · +10 1/4 · +15 1/2 (max 35)",
  "Topscorer picks (3 players): 2 pts per goal · +10 Golden Boot bonus":
    "Topscoorders (3 spelers): 2 ptn per goal · +10 Gouden Schoen-bonus",
  "Deadlines": "Deadlines",
  "Group order & topscorers": "Groepsvolgorde & topscoorders",
  "lock at the tournament's opening kickoff. Set them before the World Cup starts.":
    "sluiten bij de aftrap van de openingswedstrijd. Zet ze klaar vóór het WK begint.",
  "Match predictions": "Wedstrijdvoorspellingen",
  "lock individually at each match's kickoff. Change any unfinished pick freely until then.":
    "sluiten per wedstrijd bij de aftrap. Tot dat moment kun je vrij wijzigen.",

  // Groups: predicted state
  "groups predicted": "groepen voorspeld",
  "Predicted": "Voorspeld",
  "Open": "Open",
  "Unsaved changes": "Niet opgeslagen",

  // Misc
  "Language": "Taal",
  "min": "min",
  "Log": "Log",
};

export function tFor(lang: Lang, key: string): string {
  if (lang === "en") return key;
  return NL[key] ?? key;
}
