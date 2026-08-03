# Tankify

**Live:** https://kristiyan-donchev.github.io/tankify/

A freshwater aquarium **species catalog and tank-compatibility tool**. Browse a curated database of
fish, shrimp, snails, and plants with their real water-parameter needs, build a "My Tank" list of
what you keep, and get compatibility recommendations for what to add next — with the actual
parameter conflicts spelled out, not just a yes/no.

> ⚠️ **Data caveat:** the parameter ranges in this catalog reflect commonly-cited freshwater-hobby
> guidelines (general consensus across hobbyist references), not lab-verified data for every
> strain/locale of every species. They're a solid starting point, not a substitute for further
> research before you stock a real tank — especially for anything borderline or for
> breeding-specific conditions.
>
> **Scope:** the aquarium hobby spans roughly 3,000 fish species alone, plus inverts and plants —
> this catalog covers 129 widely-kept ones, not the whole hobby. It's sized to what can be
> hand-curated with genuine care about accuracy rather than padded out with guessed numbers for
> species outside real working knowledge.

## What it does

- **Species catalog** — 129 real, widely-kept freshwater species (93 fish, 7 shrimp, 6 snails, 23
  plants) spanning tetras, barbs, danios/rasboras, corydoras/loaches/plecos, gouramis, livebearers,
  killifish, rainbowfish, and both New World and African rift-lake cichlids, with: temperature range
  (°F), pH range, GH/KH hardness range (dGH/dKH), minimum tank size (gallons), lighting need (plants),
  diet, temperament, schooling minimums, water type, and flags for fin-nipping, long fins, and
  shrimp/small-fish predation — plus a free-text notes field with the hobby-relevant caveats for that
  species.
- **Browse & filter** the catalog independently of your tank, by category, water type, temperament,
  or difficulty, with text search by common/scientific name.
- **"My Tank"** — add/remove species you keep, and optionally set your tank's own parameters
  explicitly (temp, pH, GH, KH, size, lighting). Anything you don't set explicitly is *inferred* as
  the overlap of ranges across everything currently stocked, shown live on the My Tank tab.
- **Multiple named tanks** — create, rename, and delete as many tanks as you want (e.g. "Community
  55g", "Shrimp tank") from the tank switcher above the tabs. Catalog additions, parameters, and
  recommendations all apply to whichever tank is currently selected.
- **Recommendations** — every other catalog species, evaluated against your tank and sorted into
  **Compatible**, **Compatible with caution**, and **Not compatible**, each with the specific
  reasons (which parameter conflicted, which existing tankmate is a problem and why).
- **Accounts required** — sign up or log in (email/password or Google) to use the app. Your tanks are
  saved to your account in Firestore, so they follow you across browsers/devices instead of living in
  one browser's `localStorage`.

## How the compatibility algorithm works

See [`src/lib/compatibility.js`](src/lib/compatibility.js).

**1. Determine target tank parameters** (`getTargetParams`), independently per field
(temp / pH / GH / KH):
   - If you set it explicitly on the My Tank tab, that value wins.
   - Otherwise, it's inferred as the **intersection** of that field's range across every species
     currently stocked (e.g. if you keep a Betta (75–82°F) and Cardinal Tetras (74–82°F), the
     inferred target temperature is 75–82°F — the range both need). If stocked species' ranges
     don't actually overlap, that's surfaced as a conflict rather than silently picked.
   - If nothing is stocked and nothing is set, that field is unconstrained.
   - Tank size and lighting have no way to be inferred from stocked species, so they're only used
     when set explicitly.

**2. Evaluate each candidate species** (`evaluateCandidate`) against that target, producing reasons
   at one of three severities:
   - **Block** (→ Not compatible): water type mismatch; temp/pH/GH/KH range doesn't overlap the
     target at all; tank too small for the candidate's minimum; a "no conspecifics" species (e.g.
     Betta) already has one in the tank; a known predator/prey pairing exists between the candidate
     and something already stocked (e.g. the candidate eats shrimp and you have shrimp, or
     vice versa).
   - **Caution** (→ Compatible with caution): fin-nipper species paired with a long-finned
     tankmate (in either direction); a species that can eventually eat small fish paired with small
     fish already in the tank; an aggressive/semi-aggressive candidate joining a tank with peaceful
     fish already in it.
   - **Info** (doesn't affect status): schooling minimum reminders (e.g. "best kept in a group of
     6+") are always shown for schooling species, since it's a stocking requirement, not a
     conflict.
   - A candidate with any *block* reason is **Not compatible**; with only *caution* reasons it's
     **Compatible with caution**; with neither it's **Compatible**.

**3. Sort and group** the results by status for the Recommendations view.

This is a **static, offline, single-tank model** — it doesn't account for total bioload/filtration
capacity, plant CO2/fertilization needs interacting with fish stocking, quarantine, or aggression
that only emerges from tank-specific hierarchies. It's meant to catch the common, well-documented
compatibility problems (water chemistry mismatches, fin-nipping, predation, schooling), not to be a
complete stocking-plan tool.

## Tech stack

- **React 18 + Vite**, plain CSS (light/dark aware).
- **Auth + persistence:** [Firebase Authentication](https://firebase.google.com/docs/auth) (email/password
  and Google sign-in) and [Cloud Firestore](https://firebase.google.com/docs/firestore) for storing
  each user's tank, keyed by their user ID. The species catalog itself is still a static JS module
  ([`src/data/species.js`](src/data/species.js)) — only "My Tank" is backed by the database.

## Project structure

```
aquarium-catalog/
├── src/
│   ├── data/species.js          # the species catalog (dataset)
│   ├── lib/compatibility.js     # target-parameter inference + compatibility algorithm
│   ├── lib/firebase.js          # Firebase app/auth/Firestore initialization
│   ├── lib/storage.js           # Firestore CRUD for tanks (list/create/rename/delete/save),
│   │                            # one doc per tank under tanks/{uid}/userTanks/{tankId}
│   ├── context/AuthContext.jsx  # auth state + signUp/logIn/logInWithGoogle/logOut
│   ├── components/              # CatalogBrowser, MyTank, Recommendations, SpeciesCard,
│   │                            # Header, AuthScreen (login/signup gate), TankSwitcher
│   └── App.jsx                  # auth gate + tank list/active-tank state + tab navigation
├── firestore.rules              # security rules: a user may only read/write their own tanks
└── index.html
```

## Setup & running locally

Requires [Node.js](https://nodejs.org/) 18+ and npm, plus a free [Firebase](https://firebase.google.com/)
project.

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a new project
   (Google Analytics is not needed).
2. **Add a web app** to the project (the `</>` icon on the project overview page) and copy the
   `firebaseConfig` values it gives you.
3. **Enable Authentication:** in the console, go to *Build → Authentication → Sign-in method* and
   enable the **Email/Password** and **Google** providers.
4. **Enable Firestore:** go to *Build → Firestore Database → Create database* (production mode is
   fine — the rules below lock it down).
5. **Apply the security rules** in [`firestore.rules`](firestore.rules) (paste them into
   *Firestore Database → Rules* in the console, or deploy with the Firebase CLI). They restrict each
   `tanks/{userId}` document so only the matching signed-in user can read or write it.

### 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with the `firebaseConfig` values from step 1:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run it

```bash
npm install
npm run dev
```

This starts the Vite dev server, by default at `http://localhost:5173`. Open that URL, create an
account (or sign in with Google), and start building your tank — it's saved to your account.

**Production build:**

```bash
npm run build
npm run preview
```

## Deployment

The app is hosted on **GitHub Pages** at https://kristiyan-donchev.github.io/tankify/, built and
deployed automatically by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push
to `master`. To point this at your own fork/Firebase project:

1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions**, add the same 6 `VITE_FIREBASE_*` values from
   your `.env` as repository secrets (the workflow injects them at build time).
3. In the Firebase console, go to **Authentication → Settings → Authorized domains** and add your
   `<username>.github.io` domain, or sign-in will be rejected from the hosted site.

## Image licensing

Every species photo comes from [Wikimedia Commons](https://commons.wikimedia.org), fetched via
Wikipedia/Commons' public APIs (real, verified file URLs — not guessed) rather than photographed or
generated for this app. Each photo is used under whatever Creative Commons or public-domain license
its original contributor published it under; nothing here claims copyright over the photos
themselves.

- Attribution (author + license + source link) is baked in two places: a small caption under every
  photo in the catalog, and the full list on the in-app **Credits** tab
  ([`src/components/Credits.jsx`](src/components/Credits.jsx)).
- The source-of-truth mapping is [`src/data/imageCredits.js`](src/data/imageCredits.js) — regenerate
  it if you swap in different images (see the `id → {author, license, licenseUrl, sourceUrl}` shape).
- Licenses in use across the current set: public domain, CC0, CC BY, and CC BY-SA (2.5–4.0). CC
  BY-SA requires that *modified/derivative versions of the image itself* carry a compatible license;
  it does not require the surrounding app or its code to be CC-licensed. If you plan to monetize a
  fork of this app, get your own legal sign-off rather than relying on this note.

## Limitations

- **Freshwater-only starter dataset.** The schema supports `waterType: 'brackish' | 'saltwater'`
  for future additions, but every species currently in the catalog is freshwater-native (a few —
  Molly, Guppy, Nerite Snail — tolerate brackish conditions, noted in their entries). No saltwater
  reef species are included; that's a meaningfully different dataset this starter set doesn't
  attempt.
- **42 species, not exhaustive.** This covers commonly-kept community freshwater species, not every
  fish/plant/invert in the hobby.
- **Requires a Firebase project.** There's no shared/hosted backend — each deployment needs its own
  Firebase project (free tier is enough) configured as described above.
- Doesn't model bioload/filtration limits, CO2/fertilization interactions for plants, or
  tank-specific social hierarchies — see the compatibility algorithm section above for exactly what
  it does and doesn't check.
