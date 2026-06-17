// Lightweight i18n. Keys are plain English strings. NL maps each key to its
// Dutch equivalent. EN provides overrides for keys whose default English
// rendering should differ from the key text (e.g. shorter abbreviations like
// "pts" should expand to "points"). Missing keys fall back to the key.

export type Lang = "nl" | "en";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

// English overrides — used when the displayed text should differ from the key.
export const EN: Record<string, string> = {
  "3 pts": "3 points",
  "+1 pt": "+1 point",
  "+2 pts": "+2 points",
  "+5 pt bonus": "+5 point bonus",
  "11 pts": "11 points",
  "pts on the line — plus the topscorer stream.":
    "points on the line — plus the topscorer stream.",
  "30 pts if your pick lifts the trophy":
    "30 points if your pick lifts the trophy",
  "10 pts per correct team · +10 bonus if both right (max 30). Order doesn't matter.":
    "10 points per correct team · +10 bonus if both right (max 30). Order doesn't matter.",
  "Pick 3 players. 2 pts per goal · +10 if one of your picks wins the Golden Boot.":
    "Pick 3 players. 2 points per goal · +10 if one of your picks wins the Golden Boot.",
  "pts)": "points)",
  "Champion: 30 pts if your pick wins the trophy":
    "Champion: 30 points if your pick wins the trophy",
  "Finalists pair: 10 pts per correct finalist · +10 if both right (max 30)":
    "Finalists pair: 10 points per correct finalist · +10 if both right (max 30)",
  "Topscorer picks (3 players): 2 pts per goal · +10 Golden Boot bonus":
    "Topscorer picks (3 players): 2 points per goal · +10 Golden Boot bonus",
  "Rank 1st → 4th. 3 pts per correct slot · 5 pt bonus for a perfect group. Locks at the opening match.":
    "Rank 1st → 4th. 3 points per correct slot · 5 point bonus for a perfect group. Locks at the opening match.",
  // Knockout multiplier lines — spelled out instead of abbreviated.
  "Knockout multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4":
    "Knockout multipliers: Round of 16 ×1.5 · Quarter-finals ×2 · Semi-finals ×3 · Third-place/Final ×4",
  "Knockout multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4.":
    "Knockout multipliers: Round of 16 ×1.5 · Quarter-finals ×2 · Semi-finals ×3 · Third-place/Final ×4.",
  "Scoring multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4.":
    "Scoring multipliers: Round of 16 ×1.5 · Quarter-finals ×2 · Semi-finals ×3 · Third-place/Final ×4.",
  "One Pot 3 / Pot 4 team. R16 = 10 · QF = +10 · SF = +15 (max 35)":
    "One Pot 3 / Pot 4 team. Round of 16 = 10 · Quarter-finals = +10 · Semi-finals = +15 (max 35)",
  "Scoring: R16 = 10 · QF = +10 · SF = +15 (max 35)":
    "Scoring: Round of 16 = 10 · Quarter-finals = +10 · Semi-finals = +15 (max 35)",
  "Dark Horse (Pot 3 or Pot 4 team): 10 if reaches R16 · +10 QF · +15 SF (max 35)":
    "Dark Horse (Pot 3 or Pot 4 team): 10 if they reach the Round of 16 · +10 Quarter-finals · +15 Semi-finals (max 35)",
};

// Dutch translations.
export const NL: Record<string, string> = {
  // Nav
  "Dashboard": "Dashboard",
  "Matches": "Wedstrijden",
  "Groups": "Groepen",
  "Predictions": "Voorspellingen",
  "Bracket": "Knockout",
  "Leaderboard": "Stand",
  "Stats": "Stats",
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
  "Points breakdown": "Puntenverdeling",
  "Topscorers": "Topscoorders",
  "Rank": "Positie",
  "Next Match": "Volgende wedstrijd",
  "Next Matches": "Volgende wedstrijden",
  "Predict": "Voorspel",
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
    "Rangschik 1e → 4e. 3 punten per juiste plek · 5 punten bonus voor een perfect ingevulde groep. Sluit bij de openingswedstrijd.",
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
  "30 pts if your pick lifts the trophy":
    "30 punten als jouw keuze de beker pakt",
  "Finalists": "Finalisten",
  "10 pts per correct team · +10 bonus if both right (max 30). Order doesn't matter.":
    "10 punten per juist team · +10 bonus als beide kloppen (max 30). Volgorde maakt niet uit.",
  "Finalist A": "Finalist A",
  "Finalist B": "Finalist B",
  "Dark Horse": "Dark Horse",
  "One Pot 3 / Pot 4 team. R16 = 10 · QF = +10 · SF = +15 (max 35)":
    "Eén team uit Pot 3 of Pot 4. Achtste finale = 10 · Kwartfinale = +10 · Halve finale = +15 (max 35)",
  "A 'dark horse' is an underdog — a team that's not expected to go far. Pick one from Pot 3 or Pot 4 (the lower-ranked half of the draw, by FIFA ranking). If they surprise everyone and reach the knockout rounds, you score big bonus points.":
    "A 'dark horse' is an underdog; a team that's not expected to go far. Pick one lower-ranked team and if they surprise everyone and reach the knockout rounds, you score big bonus points.",
  "A 'dark horse' is an underdog; a team that's not expected to go far. Pick one lower-ranked team and if they surprise everyone and reach the knockout rounds, you score big bonus points.":
    "Een 'dark horse' is een outsider; een team dat niet wordt verwacht ver te komen. Kies een lager geplaatst team en als ze iedereen verrassen en de volgende rondes halen, scoor je flink wat bonuspunten.",
  "Scoring: R16 = 10 · QF = +10 · SF = +15 (max 35)":
    "Punten: Achtste finale = 10 · Kwartfinale = +10 · Halve finale = +15 (max 35)",
  "Pick 3 players. 2 pts per goal · +10 if one of your picks wins the Golden Boot.":
    "Kies 3 spelers. 2 punten per goal · +10 als één van je keuzes de Gouden Schoen wint.",
  "Your picks": "Jouw keuzes",
  "No players selected yet.": "Nog geen spelers gekozen.",
  "Combined goals so far:": "Goals tot nu toe:",
  "pts)": "punten)",
  "Save Topscorer Picks": "Topscoorders opslaan",
  "Picks locked": "Keuzes gesloten",
  "Search player or team…": "Zoek speler of land…",
  "All": "Alle",
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
  "Match": "Wedstr.",
  "Scorer": "Top",
  "Bonus": "Bonus",
  "No scores yet. Come back after the opening match!":
    "Nog geen punten. Kom terug na de openingswedstrijd!",

  // Save-time lock guards
  "This match has just locked. Refresh to see the live result.":
    "Deze wedstrijd is zojuist gesloten. Vernieuw de pagina om de live uitslag te zien.",
  "Predictions have just locked. Refresh to see the live results.":
    "De voorspellingen zijn zojuist gesloten. Vernieuw de pagina om de live uitslagen te zien.",

  // My points detail
  "See points details": "Bekijk puntenoverzicht",
  "Pred": "Pred",
  "Actual": "Actueel",
  "Pts": "Pts",
  "pts": "pts",
  "No match predictions yet.": "Nog geen wedstrijdvoorspellingen.",
  "No group predictions yet.": "Nog geen groepsvoorspellingen.",
  "No topscorer picks.": "Geen topscoorderkeuzes.",
  "No bonus picks.": "Geen bonusvoorspellingen.",
  "Not scored yet": "Nog niet gescoord",
  "Your pick": "Jouw keuze",
  "Golden Boot bonus": "Golden Boot bonus",

  // Bracket
  "Knockout Bracket": "Knockout-schema",
  "Scoring multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4.":
    "Punten-vermenigvuldigers: Achtste finale ×1,5 · Kwartfinale ×2 · Halve finale ×3 · Troostfinale/Finale ×4.",

  // Rules
  "Rules & Scoring": "Regels & punten",
  "Match predictions (all 104 matches)": "Wedstrijdvoorspellingen (alle 104)",
  "Correct outcome (Win/Draw/Loss):": "Juiste uitslag (winst/gelijk/verlies):",
  "3 pts": "3 punten",
  "Correct goal difference:": "Juist doelsaldo:",
  "+2 pts": "+2 punten",
  "One team's score exact:": "Score van één team exact:",
  "+1 pt": "+1 punt",
  "Fully exact score:": "Volledig exacte uitslag:",
  "+5 pt bonus": "+5 punten bonus",
  "Perfect pick = 3 + 2 + 1 + 5 =": "Perfecte voorspelling = 3 + 2 + 1 + 5 =",
  "11 pts": "11 punten",
  "Knockout multipliers: R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4":
    "Knockout-vermenigvuldigers: Achtste finale ×1,5 · Kwartfinale ×2 · Halve finale ×3 · Troostfinale/Finale ×4",
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
    "Kampioen: 30 punten als jouw keuze de beker pakt",
  "Finalists pair: 10 pts per correct finalist · +10 if both right (max 30)":
    "Finalisten: 10 punten per juiste finalist · +10 als beide kloppen (max 30)",
  "Dark Horse (Pot 3 or Pot 4 team): 10 if reaches R16 · +10 QF · +15 SF (max 35)":
    "Dark Horse (team uit Pot 3 of 4): 10 bij achtste finale · +10 kwartfinale · +15 halve finale (max 35)",
  "Topscorer picks (3 players): 2 pts per goal · +10 Golden Boot bonus":
    "Topscoorders (3 spelers): 2 punten per goal · +10 Gouden Schoen-bonus",
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
  "From your matches:": "Vanuit jouw wedstrijden:",
  "Apply": "Toepassen",

  // Rules of engagement / payments
  "Rules of engagement": "Spelregels (deelname)",
  "Entry fee: € 10 per player.": "Inschrijfgeld: € 10 per speler.",
  "Transfer to NL00 BANK 0000 0000 00 (account holder: Robin Franken) before the tournament kicks off on 11 June 2026. Mention your display name in the description so I can match the payment.":
    "Maak € 10 over naar NL00 BANK 0000 0000 00 t.n.v. Robin Franken vóór de aftrap van het toernooi (11 juni 2026). Zet je weergavenaam in de omschrijving, zodat ik de betaling kan koppelen.",
  "Accounts that haven't paid by kickoff will be removed (kindly). All paid players play for the prize pool.":
    "Accounts die niet betaald hebben vóór de aftrap worden (vriendelijk) verwijderd. Alle betalende spelers spelen mee om de prijzenpot.",
  "International players: trouble transferring to a Dutch IBAN? Reach out in time and we'll find an alternative (Wise, Revolut, PayPal, etc.). Don't leave it to the last minute.":
    "Buitenlandse deelnemers: lukt overmaken naar een Nederlands IBAN niet? Neem op tijd contact op zodat we een alternatief regelen (Wise, Revolut, PayPal, enz.). Doe het niet op het laatste moment.",
  "Payment status is shown on the leaderboard.":
    "Betaalstatus is zichtbaar op de stand.",

  // Prize pool
  "Prize pool": "Prijzenpot",
  "The prize pool is the total of all entry fees (number of paid players × € 10). It's split among the top finishers.":
    "De prijzenpot is het totaal van alle inschrijfgelden (aantal betalende spelers × € 10) en wordt verdeeld onder de hoogst geëindigden.",
  "Placeholder split — the exact percentages may still shift depending on how many players join, but this is the direction.":
    "Voorlopige verdeling — de exacte percentages kunnen nog wijzigen afhankelijk van het aantal deelnemers, maar dit is de richting.",
  "1st place": "1e plek",
  "2nd place": "2e plek",
  "3rd place": "3e plek",
  "4th place": "4e plek",
  "5th place": "5e plek",

  // Leaderboard paid column
  "Paid": "Betaald",
  "Unpaid": "Niet betaald",
  "No players yet.": "Nog geen spelers.",
  "Two ways to use this page: rank manually with the up/down arrows, OR fill in all 6 group matches first — then a one-click 'Apply' shortcut appears per group.":
    "Twee manieren om deze pagina te gebruiken: rangschik handmatig met de pijltjes, OF vul eerst alle 6 groepswedstrijden in — dan verschijnt per groep een 'Toepassen'-knop voor één klik.",

  // Inline match editing
  "Hide predicted": "Verberg voorspeld",
  "Show all": "Toon alles",
  "voorspeld": "voorspeld",
  "All matches predicted!": "Alle wedstrijden voorspeld!",
  "No matches yet.": "Nog geen wedstrijden.",
  "Group stage. Knockout matches live on the Bracket page.":
    "Groepsfase. Knockout-wedstrijden staan op de Knockout-pagina.",

  // Stats page
  "Aggregate metrics across N participants": "Geaggregeerde statistieken van N deelnemers",
  "Stats available after tournament kickoff.": "Statistieken beschikbaar na de aftrap van de eerste wedstrijd.",
  "Participants": "Deelnemers",
  "Predictions made": "Voorspellingen ingevoerd",
  "Matches played": "Gespeelde wedstrijden",
  "Avg score": "Gem. score",
  "Champion picks": "Kampioen-keuzes",
  "Finalist picks": "Finalist-keuzes",
  "Combined finalist appearances per team": "Gecombineerde finalist-keuzes per team",
  "Dark horse picks": "Dark horse-keuzes",
  "Only low-ranked teams eligible": "Alleen laag gerankte teams komen in aanmerking",
  "Topscorer ownership": "Topscoorder-keuzes",
  "3 picks per participant": "3 keuzes per deelnemer",
  "By ownership": "Op keuzes",
  "By goals": "Op doelpunten",
  "No topscorer picks yet.": "Nog geen topscoorder-keuzes.",
  "No picks yet.": "Nog geen keuzes.",
  "Group order consensus": "Groepsvolgorde consensus",
  "Most popular pick per position in each group": "Meest populaire keuze per positie per groep",
  "Match prediction accuracy": "Nauwkeurigheid wedstrijdvoorspellingen",
  "How well did everyone predict the completed matches": "Hoe goed waren de voorspellingen voor de gespeelde wedstrijden",
  "Tap a match to see everyone's predictions": "Tik op een wedstrijd om ieders voorspelling te zien",
  "Exact score": "Exacte score",
  "No predictions for this match": "Geen voorspellingen voor deze wedstrijd",
  "Exact": "Exact",
  "Wrong": "Fout",
  "Points by category": "Punten per categorie",
  "Average points per participant": "Gemiddelde punten per deelnemer",
  "Top scoring players": "Topscoorders (doelpunten)",
  "Goals scored — with topscorer pick ownership": "Doelpunten gescoord — met topscoorder-keuze percentage",
  "Goals": "Goals",
  "Owned": "Gekozen",

  // Misc
  "Language": "Taal",
  "min": "min",
  "Log": "Log",
};

export function tFor(lang: Lang, key: string): string {
  if (lang === "en") return EN[key] ?? key;
  return NL[key] ?? key;
}

// Knockout / group stage codes spelled out per language. Used wherever the
// raw `stage` column or `knockout_slot` codes (e.g. R32, R16, QF, SF, 3rd,
// final) need to be shown to a user.
const STAGE_NL: Record<string, string> = {
  group: "Groep",
  R32: "Zestiende finale",
  R16: "Achtste finale",
  QF: "Kwartfinale",
  SF: "Halve finale",
  "3rd": "Troostfinale",
  final: "Finale",
};

const STAGE_EN: Record<string, string> = {
  group: "Group",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3rd": "Third-place play-off",
  final: "Final",
};

export function stageLabel(lang: Lang, stage: string | null | undefined): string {
  if (!stage) return "";
  const dict = lang === "en" ? STAGE_EN : STAGE_NL;
  return dict[stage] ?? stage;
}
