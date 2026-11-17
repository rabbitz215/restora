# Changelog

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
