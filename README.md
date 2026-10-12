# Santo Rosario

Rosario interactivo en español. This static web app paces the Catholic rosary step by step. A drawing
of the rosary on the left shows the current bead in gold, and the panel on the right shows each
step's prayer. The prayer text and order follow
[elsantorosario.es: Cómo rezar el Rosario](https://www.elsantorosario.es/como-rezar-el-rosario/)
(Radio María España).

It is built for `virgendelaasuncion.org/rosario/`, but it runs from any folder on any host that
serves files.

## How it works

- **React 18 + TypeScript**, built by **Vite** into plain static files.
- **SQLite in the browser** through [sql.js](https://sql.js.org), which is SQLite compiled to
  WebAssembly. No server is needed: the database is one file, `rosario.sqlite`, shipped next to the page.
- `db/schema.sql` and `db/seed.sql` are the source of truth. `scripts/build-db.mjs` turns them into
  `public/rosario.sqlite` before every dev run, test run and build.
- At runtime, `src/data/loadDb.ts` fetches the database and `src/data/repository.ts` reads it once
  into a typed `RosaryData` object. React renders only from that object.
- Each browser saves its position, mystery set, speed and settings in `localStorage` under the key
  `santo-rosario:v1`. On a new day, the app starts again at the first step with that day's mysteries.

| Folder | What lives there |
| --- | --- |
| `db/` | Schema and seed data (prayers, mysteries, the 75 steps) |
| `src/data/` | Types, the browser database loader, typed queries |
| `src/lib/` | Pure logic: sequence and navigation, mysteries of the day, prayer text parsing, pacing, bead geometry, saved progress |
| `src/components/` | `RosaryApp` (state and layout), `RosaryView` (SVG rosary), `PrayerPanel` (text and controls) |
| `.github/workflows/ci.yml` | Compile, test, build, dependency audit, CodeQL, Gitleaks, deploy |

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
2. Run `npm test`. The tests rebuild the database from the seed and check, among other things, that
   every step's prayers exist and that there are 69 steps (75 with the traditional opening).
3. Open a pull request. CI must be green before it can merge.

## Deploy

CI runs on every push and pull request to `main`, and once a week. After all checks pass, the deploy
job uploads `dist/` by FTPS. It runs only on `main`, and only after you switch it on.

### Switch on deploy

1. Add the FTP secrets. Each command prompts for the value, so it never lands in your shell history:
   - `gh secret set FTP_SERVER --repo marcelodiazd/santo-rosario` (host name only, for example `ftp.virgendelaasuncion.org`)
   - `gh secret set FTP_USERNAME --repo marcelodiazd/santo-rosario`
   - `gh secret set FTP_PASSWORD --repo marcelodiazd/santo-rosario`
2. Set the target folder (it must end with `/`) and the protocol:
   - `gh variable set FTP_SERVER_DIR --body "/public_html/rosario/" --repo marcelodiazd/santo-rosario`
   - `gh variable set FTP_PROTOCOL --body "ftps" --repo marcelodiazd/santo-rosario` (use `ftp` only if the host has no FTPS)
3. Turn deploy on: `gh variable set DEPLOY_ENABLED --body true --repo marcelodiazd/santo-rosario`
4. Run it with `gh workflow run CI/CD --repo marcelodiazd/santo-rosario`, or push to `main`.
5. Open <https://virgendelaasuncion.org/rosario/> and check that the rosary loads.

Some hosts are site builders with no file access, such as Wix or Squarespace. For those, deploy to
GitHub Pages instead and embed the app with the iframe below. Only the deploy job changes.

### Link it from the parish site

Add a menu item pointing to `/rosario/`, or paste this into an HTML block on an existing page:

```html
<iframe src="/rosario/" title="Santo Rosario" style="width:100%;height:90vh;border:0"></iframe>
```

### Protect `main` (once, in GitHub settings)

- **Settings → Rules → Rulesets → New branch ruleset** for `main`: require a pull request and the
  status checks "Compile, test and build", "Dependency audit", "CodeQL" and "Secret scan (Gitleaks)".
- **Settings → Code security**: turn on Dependabot alerts, Dependabot security updates, secret
  scanning and push protection.
- **Settings → Environments → production** (created on the first deploy): optionally add yourself
  as a required reviewer, so each deploy waits for your approval.
