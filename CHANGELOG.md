# Changelog

## 1.0.11 — 2026-11-23
- Right-click a database in the sidebar for a menu with New SQL query, New table, Refresh, Restore and Export
- Drop database from the right-click menu: deletes the database and everything in it, after a confirmation that shows how many tables and rows will be lost
- Purge database from the right-click menu: drops every table, view, routine and event but keeps the empty database, handy before restoring a fresh dump
- Table tabs of a dropped or purged database are closed automatically; your SQL query tabs stay open
- New startup screen while Restora loads your connections and reopens your last table. If a big table or SSH tunnel makes it slow, you can choose to continue without waiting

## 1.0.10 — 2026-11-21
- Your open table and SQL tabs are restored when you reopen Restora. If you closed it in Data & SQL, it opens straight back there on the tab you had active
- SQL typed just before closing the window is no longer lost
- JSON columns open in a dedicated editor: double-click a JSON cell (or press Enter or F2 on it) to edit it in a large modal, with live validation that flags invalid JSON before you apply it
- Pretty print switch in the JSON editor to toggle between indented and compact JSON; your choice is remembered
- The JSON editor also works with MariaDB JSON columns (stored as longtext) when the value is a JSON object or array
- Ctrl+Enter applies the JSON edit, Tab indents, and "Set NULL" clears nullable columns. Reformatting alone doesn't count as a change

## 1.0.9 — 2026-11-19
- Restore: after you pick a dump, Restora lists every table in it with the size of its rows, biggest first
- Restore: switch any table to "No data" to create it without its rows, so a huge log or history table no longer slows the restore down. Your choice is remembered by table name for the next restore
- Restore: much faster on dumps with very long INSERT lines; reading a large .sql.gz is no longer the bottleneck
- Restore: new "Skip binary log" option (on by default) so rows are written to disk once instead of twice, when your MySQL user is allowed to
- Export: when choosing tables, each table now has a Data / No data switch to export it with or without its rows, plus All data / No data buttons

## 1.0.8 — 2026-11-18
- Connect through an SSH tunnel: a new SSH Tunnel tab in the connection dialog, with password, key file (with passphrase) or SSH agent login, and an optional bastion / jump host
- Browsing, the SQL editor, restores, exports and CSV imports all work over the tunnel; Test connection says when it went through SSH
- SSH passwords and key passphrases are encrypted with your OS keyring, like database passwords
- Filter options button next to every column filter: equals, does not equal, greater / less than, contains, begins / ends with, is (not) NULL, is (not) empty
- New "Filter multiple values" filter: type IN a,b,c (or NOT IN a,b,c) to match a list of values
- Large tables and query results scroll smoothly: only the rows on screen are drawn
- New Home page, shown when Restora opens: quick actions for restore, export, CSV import and a new SQL query, plus your quick-restore shortcuts
- A "Get set up" checklist on Home when something is missing: no connection yet, or the mysql / mysqldump tools aren't found
- Stats on Home: connections, jobs this week, success rate and how much data you restored in the last 30 days
- Recent activity on Home: your last jobs with status, target and duration; click one to open it in History
- Reopen your table and SQL tabs straight from Home
- Your connections on Home, with buttons to query, restore, export or edit each one
- A running restore, export or import shows a live progress banner on Home, so you can leave the job screen while it works
- "What's new" can now be opened any time from the Home page

## 1.0.7 — 2026-11-17
- Clearer message when installing an update fails on Linux, including the command to install it yourself
- Update activity is written to updater.log in Restora's settings folder, to make update problems easy to diagnose
- An install error no longer shows as "Couldn't check for updates"

## 1.0.6 — 2026-11-17
- Edit data right in the grid: double-click or just start typing, Enter to confirm, Esc to cancel
- Select cells by dragging (or Shift+click / Shift+arrows), whole rows by dragging the row numbers
- Ctrl+0 sets the selected cells to NULL, Insert adds a row, Ctrl+Shift+C clones rows, Ctrl+Delete deletes rows
- Changes are highlighted (edited cells amber, new rows green, deleted rows red) until you press Ctrl+S, which saves everything in one transaction
- Undo (Ctrl+Z), revert a row (Ctrl+U) or everything, preview the SQL, and a right-click menu with all actions
- Ctrl+C copies the selected cells (paste straight into a spreadsheet)

## 1.0.5 — 2026-11-17
- New app icon
- "What's new" window after each update, listing every change since the version you had before
- Release notes on GitHub now come from this changelog

## 1.0.4 — 2026-11-17
- Windows: updates now install silently and reopen Restora, without showing the setup wizard

## 1.0.3 — 2026-11-17
- Create a new database or a new table straight from the sidebar (table designer with types, NULL, defaults, primary key, auto increment and a live SQL preview)
- Removed the File / Edit / View / Window menu (Alt no longer shows it)
- Developer tools and reload shortcuts are disabled in installed builds

## 1.0.2 — 2026-11-17
- Restora can now update itself: an Update button appears at the bottom of the sidebar when a new version is out

## 1.0.1 — 2026-11-17
- Fixed activity log lines being squeezed into a narrow column during restores

## 1.0.0 — 2026-11-17
- First release: restore .sql / .sql.gz dumps with automatic fixes, export to .sql / .sql.gz, data browser with tabs and relationships, SQL editor, CSV import, and 63 themes
