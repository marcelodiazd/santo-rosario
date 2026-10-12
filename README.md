# Santo Rosario

Rosario interactivo en español. This static web app paces the Catholic rosary step by step. A drawing
of the rosary on the left shows the current bead in gold, and the panel on the right shows each
step's prayer. The prayer text and order follow
[elsantorosario.es: Cómo rezar el Rosario](https://www.elsantorosario.es/como-rezar-el-rosario/)
(Radio María España).

It is hosted on GitHub Pages at a subdomain of the parish's Squarespace domain, for example
`rosario.virgendelaasuncion.org`. It runs from any folder on any host that serves files.

## How it works

- **React 18 + TypeScript**, built by **Vite** into plain static files.
- **SQLite in the browser** through [sql.js](https://sql.js.org), which is SQLite compiled to
  WebAssembly. No server is needed: the database is one file, `rosario.sqlite`, shipped next to the page.
- `db/schema.sql` and `db/seed.sql` are the source of truth. `scripts/build-db.mjs` turns them into
  `public/rosario.sqlite` before every dev run, test run and build.
- At runtime, `src/data/loadDb.ts` fetches the database and `src/data/repository.ts` reads it once
  into a typed `RosaryData` object. React renders only from that object.
- **Read-aloud** uses the browser's built-in voices (Web Speech API), so there is nothing to
  download or pay for. The voice reads the leader's part and leaves a silent pause for the people's
  responses, highlighting the line. Voice quality depends on the device; on iPhone, Settings →
  Accessibility → Spoken Content → Voices → Spanish offers better "enhanced" voices.
- Each browser saves its position, mystery set, speed and settings in `localStorage` under the key
  `santo-rosario:v1`. On a new day, the app starts again at the first step with that day's mysteries.

| Folder | What lives there |
| --- | --- |
| `db/` | Schema and seed data (prayers, mysteries, the 75 steps) |
| `src/data/` | Types, the browser database loader, typed queries |
| `src/lib/` | Pure logic: sequence and navigation, mysteries of the day, prayer text parsing, pacing, bead geometry, saved progress, read-aloud |
| `src/components/` | `RosaryApp` (state and layout), `RosaryView` (SVG rosary), `PrayerPanel` (text and controls) |
| `.github/workflows/ci.yml` | Compile, test, build, dependency audit, CodeQL, Gitleaks, deploy to GitHub Pages |

## Run it

Requires Node.js 22. Run `npm ci` first to install the exact versions in `package-lock.json`.

| Task | Command |
| --- | --- |
| Run locally with live reload | `npm run dev` |
| Run tests in watch mode | `npm test` |
| Run tests once with coverage | `npm run db:build && npm run test:ci` |
| Type-check | `npm run typecheck` |
| Production build into `dist/` | `npm run build` |
| Preview the production build | `npm run preview` |

## Change a prayer's wording

1. Edit `db/seed.sql`. Prayer bodies use a small format:
   - A blank line starts a new paragraph; a newline starts a new line.
   - A line starting with `R/ ` is the people's response. It is shown in italics, without the `R/`.
   - A line containing `|` is a litany line: `invocation | response`.
   - For prayers said in two halves (Padrenuestro, Avemaría, Gloria), `response_line` is the line
     where the people's half starts. Read-aloud pauses there instead of reading it.
2. Run `npm test`. The tests rebuild the database from the seed and check, among other things, that
   every step's prayers exist and that there are 69 steps (75 with the traditional opening).
3. Open a pull request. CI must be green before it can merge.

## Deploy

The domain is on Squarespace. Squarespace only serves its own site builder and cannot host
uploaded files, so the app is published to **GitHub Pages**. A DNS record in Squarespace points a
subdomain at it, and the Squarespace site links to that subdomain or embeds it.

CI runs on every push and pull request to `main`, and once a week. After all checks pass, the deploy
job publishes `dist/` to GitHub Pages. It runs only on `main`, and only after you switch it on.

### Switch on deploy (once)

1. **Turn on GitHub Pages.** In the repo, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
2. **Turn deploy on:** `gh variable set DEPLOY_ENABLED --body true --repo marcelodiazd/santo-rosario`.
   You can also add it under **Settings → Secrets and variables → Actions → Variables**.
3. **Run it:** use `gh workflow run CI/CD --repo marcelodiazd/santo-rosario`, push to `main`, or
   click **Run workflow** on the Actions tab. The site appears at
   <https://marcelodiazd.github.io/santo-rosario/>.

### Use your own domain (once)

1. **Add a DNS record in Squarespace.** Open **Domains → virgendelaasuncion.org → DNS settings** and
   add a custom record. If the domain's DNS is managed somewhere else, add it there instead.

   | Type | Host | Data |
   | --- | --- | --- |
   | CNAME | `rosario` | `marcelodiazd.github.io` |

2. **Tell GitHub the domain.** In **Settings → Pages → Custom domain**, enter
   `rosario.virgendelaasuncion.org` and save. When the DNS check passes, tick **Enforce HTTPS**.
   DNS changes can take up to a day.
3. **Open <https://rosario.virgendelaasuncion.org>** and check that the rosary loads.

Because the deploy uses GitHub's Pages actions, the custom domain lives in the Pages settings. No
`CNAME` file is needed, and deploys will not reset it.

### Link it from the Squarespace site

Add a navigation link to `https://rosario.virgendelaasuncion.org`, or embed it on a page with a
Code Block:

```html
<iframe src="https://rosario.virgendelaasuncion.org" title="Santo Rosario" style="width:100%;height:90vh;border:0"></iframe>
```

Embed the subdomain address, not the `github.io` one. The subdomain belongs to the same site as the
Squarespace page, so the browser keeps each person's saved place. Inside a frame from another site,
Safari on iPhone blocks that storage.

### Protect `main` (once, in GitHub settings)

- **Settings → Rules → Rulesets → New branch ruleset** for `main`: require a pull request and the
  status checks "Compile, test and build", "Dependency audit", "CodeQL" and "Secret scan (Gitleaks)".
- **Settings → Code security**: turn on Dependabot alerts, Dependabot security updates, secret
  scanning and push protection.
- **Settings → Environments → production** (created on the first deploy): optionally add yourself
  as a required reviewer, so each deploy waits for your approval.
