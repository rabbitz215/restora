<div align="center">

<img src="build/icon.png" width="96" alt="Restora icon">

# Restora

**A good-looking desktop client for restoring, exporting, importing and browsing MySQL / MariaDB databases.**

Restore multi-GB `.sql` / `.sql.gz` dumps with live progress and automatic fixes for the errors that usually break them,
then browse the result, run SQL, or export it again. All from one app.

[![Release](https://img.shields.io/github/v/release/rabbitz215/restora?style=flat-square)](https://github.com/rabbitz215/restora/releases/latest)
![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux-8b6cff?style=flat-square)
![License](https://img.shields.io/github/license/rabbitz215/restora?style=flat-square)

[Download](#download) · [Features](#features) · [Requirements](#requirements) · [Build from source](#build-from-source)

</div>

---

## Why

General-purpose SQL clients are great for browsing, but restoring a real-world dump often fails halfway with
`Access denied; you need SUPER privilege`, `Unknown collation 'utf8mb4_0900_ai_ci'`, a MariaDB sandbox header,
or a `DEFINER` that doesn't exist on your server. Restora streams the dump through the official `mysql` client,
fixes those problems on the fly, shows exactly where it is, and explains any error in plain English.

## Download

Grab the latest build from the [**Releases page**](https://github.com/rabbitz215/restora/releases/latest).

| Platform | File | How to install |
| --- | --- | --- |
| **Windows** 10/11 (x64) | `Restora-Setup-x.y.z.exe` | Run the installer. Pick the install folder; Start-menu and desktop shortcuts are created. |
| **Linux** (any distro) | `Restora-x.y.z-x86_64.AppImage` | `chmod +x Restora-*.AppImage` then run it. |
| **Debian / Ubuntu** | `Restora-x.y.z-amd64.deb` | `sudo apt install ./Restora-*-amd64.deb` |

> Windows builds are not code-signed, so SmartScreen may say *"Windows protected your PC"*.
> Click **More info → Run anyway**.

**Updates:** Restora checks GitHub for new releases on startup. When one is out, an **Update** button appears at the bottom
of the sidebar: one click downloads it, **Restart & update** installs it. This works for the Windows installer, the AppImage
and the `.deb` (which asks for your password to install). You can turn automatic checks off in the update dialog.

## Features

### Home
- Opens on a **Home** page: quick actions (restore, export, CSV import, new SQL query) and your quick-restore shortcuts.
- Stats at a glance (connections, jobs this week, success rate, data restored in the last 30 days), recent activity and your open tabs.
- A live progress banner while a job runs, and a setup checklist when a connection or the `mysql` / `mysqldump` tools are missing.

### Connections & SSH tunnels
- Connect directly over TCP (optionally with SSL/TLS) or through an **SSH tunnel**.
- SSH login with a password, a private key file (with passphrase) or your SSH agent, plus an optional **bastion / jump host**.
- Everything works over the tunnel: browsing, the SQL editor, restores, exports and CSV imports. No system `ssh` needed for it.

### Restore dumps
- `.sql` and `.sql.gz`, any size: the file is streamed, never loaded into memory.
- Live progress ring, speed, elapsed time, ETA and the table currently being restored, with a **Cancel** button.
- Inspects the dump first (tool, server version, source database) and **switches on the fixes it needs**:
  - strip `DEFINER=` clauses (no more SUPER / SET_USER_ID errors)
  - ignore `USE` / `CREATE DATABASE`, so it always restores into the database *you* picked
  - remove the MariaDB `/*M!999999` sandbox header
  - convert MySQL 8 `utf8mb4_0900_*` collations for MariaDB / MySQL 5.7
  - skip triggers & routines (error 1419 when binary logging is on)
- Lists every table in the dump with the size of its rows, biggest first, and lets you restore any table **without its data** (structure only). Handy for huge log or history tables; the choice is remembered by table name.
- Fast mode (single commit), foreign-key checks off, skip the binary log (when your user may), continue-on-error.
- Errors show the MySQL code, line number and a hint for how to fix them; **Adjust options & retry** takes you straight back.
- Restore into an existing database (optionally drop & recreate it first) or a new one.

### Export
- Whole database or selected tables, to **`.sql`** or gzip-compressed **`.sql.gz`**. When choosing tables, each one can be exported with or without its data.
- Structure + data, structure only, or data only; routines, triggers, events, `DROP TABLE`, `CREATE DATABASE` toggles.
- Uses `mysqldump --single-transaction`, so exports don't lock InnoDB tables.
- Written to a `.part` file and only renamed when complete, so a failed export never leaves a broken file behind.

### Browse data
- Connection tree in the sidebar: servers → databases → tables, with search at each level.
- Create a **new database** (pick the collation) or a **new table** (columns, types, NULL, default, primary key, auto increment, with a live SQL preview) right from the tree.
- Each table opens in its own **tab**, grouped by database (even across connections); tabs come back after a restart.
- Per-column filters under every header, search across all columns, click/Shift-click sorting, paging (50–1000 rows).
  Filter syntax: `text` contains · `=x` exact · `!x` not containing · `>5` `<=5` · `ab*` wildcard · `IN a,b,c` / `NOT IN a,b,c` · `NULL` / `NOT NULL` · `EMPTY`.
  Or use the ▾ button next to a filter to pick an operator (equals, greater than, begins with, multiple values…).
- Large tables and query results scroll smoothly: only the rows on screen are drawn.
- Side panel: show/hide columns (remembered per table) and **relationships**, both what the table references and what references it.
  Click one to open the related table filtered to the selected row; foreign-key cells have a → button to jump to the referenced row.
- **Edit data like a spreadsheet**: double-click or start typing to edit, drag to select cells or rows, `Ctrl+0` sets NULL,
  `Insert` adds a row, `Ctrl+Shift+C` clones, `Ctrl+Delete` deletes. Changes are highlighted until `Ctrl+S` saves them all
  in one transaction (if anything fails, nothing is applied). Undo, revert, SQL preview and a right-click menu included.
  Editing needs a primary key; tables without one and views stay read-only.
- Ctrl+C copies the selected cells as tab-separated text; F3 opens the full value (JSON is pretty-printed).

### SQL editor
- Query tabs next to your table tabs, with syntax highlighting and line numbers.
- **Ctrl+Enter** / **F5** runs the whole script, or just the selection.
- One session per tab (`USE`, variables and temp tables carry over); **Stop** cancels a running query.
- A result grid per `SELECT` (sortable, copy as TSV) plus a **Messages** tab with rows affected, timing and errors by line.
- Asks for confirmation before `DROP`, `TRUNCATE`, and `DELETE` / `UPDATE` without a `WHERE`.

### Import CSV
- Auto-detects the delimiter; handles BOM, quotes and multi-line cells.
- Preview with column mapping and inferred column types, into a new or existing table.
- `INSERT` / `INSERT IGNORE` / `REPLACE`, empty → `NULL`, optional "empty the table first".
- Runs in a single transaction and rolls back on failure.

### Themes
- 63 built-in themes in seven groups: gradient, solid, mixed (Dracula, Nord, Tokyo Night, Catppuccin, Gruvbox…), light, neon, pastel and mono.
- Custom palette editor: dark/light, background, text, accent, optional 2- or 3-color gradient, background glow. Save as many as you like.
- Every color in the app is derived from those few base colors, so everything follows: backgrounds, buttons, charts and syntax highlighting.

### Also
- **History** of every restore, export and import, with timing, sizes and errors.
- Connections are stored locally; database and SSH passwords and key passphrases are encrypted with your OS keyring (Electron `safeStorage`).
- Drag & drop `.sql`, `.sql.gz` or `.csv` files anywhere on the window.

## Requirements

Restora drives the official command-line tools for restores and exports, so they need to be installed:

| Feature | Needs |
| --- | --- |
| Restore dumps | `mysql` (or MariaDB's `mysql`) |
| Export | `mysqldump` (or `mariadb-dump`) |
| Browse, SQL editor, CSV import | nothing extra |

**Linux:** `sudo apt install mysql-client` (or `mariadb-client`). SSH is usually already installed.

**Windows:** install the MySQL client tools, e.g. with the [MySQL Installer](https://dev.mysql.com/downloads/installer/),
or MariaDB, XAMPP or Laragon. Restora finds them on `PATH` and also looks in `C:\Program Files\MySQL\*\bin`,
`C:\Program Files\MariaDB*\bin`, `C:\xampp\mysql\bin` and `C:\laragon\bin\mysql\*\bin`.

The sidebar footer shows whether the `mysql` client was found.

## Keyboard shortcuts

| Where | Keys | Action |
| --- | --- | --- |
| SQL editor | `Ctrl+Enter` / `F5` | Run script or selection |
| SQL editor | `Ctrl+/` | Comment / uncomment lines |
| SQL editor | `Tab` / `Shift+Tab` | Indent / outdent |
| Data & SQL | `Ctrl+T` | New SQL query tab |
| Data & SQL | `Ctrl+W` | Close tab (middle-click works too) |
| Data & SQL | `Ctrl+Tab` | Next tab |
| Data grid | `Ctrl+C` / `Ctrl+Shift+H` | Copy selection / with headers |
| Data grid | double-click, `F2`, `Enter` or typing | Edit cell (`Enter` confirm, `Esc` cancel, `Tab` next) |
| Data grid | `Ctrl+0` | Set selected cells to NULL |
| Data grid | `Insert` / `Ctrl+Shift+C` / `Ctrl+Delete` | New row / clone rows / delete rows |
| Data grid | `Ctrl+S` / `Ctrl+Z` / `Ctrl+U` | Save changes / undo / revert row |
| Data grid | `Ctrl+Shift+F` / `Ctrl+H` / `F3` | Filter by value / hide column / open value |
| Sidebar table search | `Enter` / `Esc` | Open first match / clear |

## Build from source

Requires Node.js 20+.

```bash
git clone https://github.com/rabbitz215/restora.git
cd restora
npm install
npm start            # run in development
npm run dist:linux   # AppImage + .deb into dist/
npm run dist:win     # Windows installer into dist/ (run on Windows)
```

Releases are built by GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml)) on Windows and Linux
whenever a `v*` tag is pushed:

```bash
npm version patch    # bumps package.json and creates the tag
git push --follow-tags
```

### Project layout

```
main.js              Electron main process, IPC handlers
preload.js           The safe bridge the UI talks to (window.api)
lib/restore.js       Dump inspection, streaming restore, SQL fixer, error hints
lib/export.js        mysqldump-based export with progress
lib/db.js            Connections, metadata, data browser queries
lib/tunnel.js        SSH tunnels (incl. jump hosts) for every connection
lib/query.js         SQL editor sessions, statement splitter, cancel
lib/csv.js           CSV preview and import
lib/tools.js         Finds mysql / mysqldump (incl. common Windows install paths)
renderer/            UI: index.html, app.js, styles.css, theme.js
```

No frontend framework or build step: the UI is plain HTML, CSS and JavaScript.

## Privacy & safety

- Everything runs locally. Restora only talks to the database and SSH servers you add (and GitHub, to check for updates).
- Passwords (database and SSH) are encrypted with the OS keyring; restores pass credentials to `mysql` through a temporary `0600` options file that is deleted afterwards, never on the command line.
- Destructive actions (drop & recreate, risky SQL, replacing files) always ask first.

## License

[MIT](LICENSE)
