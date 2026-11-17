/* Restora themes: a theme is a handful of base colors; every UI color is derived from them. */
(function () {
  const hex = (h) => { h = String(h || '').replace('#', '').trim(); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r}, ${g}, ${b}, ${a})`; };
  const lum = (c) => { const [r, g, b] = hex(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const readable = (c, on, min = 3) => { let out = c; for (let i = 0; i < 10 && contrast(out, on) < min; i++) out = mix(out, lum(on) < 0.5 ? '#ffffff' : '#000000', 0.12); return out; };

  // group: solid | gradient | mixed | light | neon | pastel | mono
  const P = (id, name, group, mode, bg, accent, accent2 = null, o = {}) => ({ id, name, group, mode, bg, accent, accent2, mid: o.mid || null, text: o.text || null, glow: o.glow ?? (group !== 'solid' && group !== 'mono' && mode === 'dark') });
  const PRESETS = [
    // Gradients (dark, glowing)
    P('restora', 'Restora', 'gradient', 'dark', '#0a0b0f', '#8b6cff', '#22d3ee', { mid: '#5b8cff' }),
    P('aurora', 'Aurora', 'gradient', 'dark', '#081013', '#22d3ee', '#a3e635', { mid: '#34d399' }),
    P('sunset', 'Sunset', 'gradient', 'dark', '#120b10', '#f97316', '#8b5cf6', { mid: '#ec4899' }),
    P('ocean', 'Ocean', 'gradient', 'dark', '#07101b', '#0ea5e9', '#6366f1', { mid: '#2563eb' }),
    P('flamingo', 'Flamingo', 'gradient', 'dark', '#130a11', '#f472b6', '#fbbf24', { mid: '#fb7185' }),
    P('royal', 'Royal', 'gradient', 'dark', '#0b0a18', '#6366f1', '#d946ef', { mid: '#8b5cf6' }),
    P('lava', 'Lava', 'gradient', 'dark', '#110806', '#ef4444', '#facc15', { mid: '#f97316' }),
    P('lagoon', 'Lagoon', 'gradient', 'dark', '#06110f', '#10b981', '#06b6d4', { mid: '#14b8a6' }),
    P('berry', 'Berry', 'gradient', 'dark', '#11070f', '#be185d', '#7c3aed', { mid: '#a21caf' }),
    P('citrus', 'Citrus', 'gradient', 'dark', '#0e0f07', '#facc15', '#22c55e', { mid: '#a3e635' }),
    P('ember', 'Ember', 'gradient', 'dark', '#100a08', '#f59e0b', '#dc2626', { mid: '#ea580c' }),
    P('glacier', 'Glacier', 'gradient', 'dark', '#080d14', '#93c5fd', '#a5f3fc', { mid: '#7dd3fc' }),
    // Solid (no gradient)
    P('violet', 'Violet', 'solid', 'dark', '#0b0b10', '#8b5cf6'),
    P('indigo', 'Indigo', 'solid', 'dark', '#0a0b11', '#6366f1'),
    P('blue', 'Blue', 'solid', 'dark', '#0a0c11', '#3b82f6'),
    P('sky', 'Sky', 'solid', 'dark', '#090d11', '#0ea5e9'),
    P('teal', 'Teal', 'solid', 'dark', '#090f0f', '#14b8a6'),
    P('emerald', 'Emerald', 'solid', 'dark', '#090f0c', '#10b981'),
    P('lime', 'Lime', 'solid', 'dark', '#0c0f09', '#84cc16'),
    P('amber', 'Amber', 'solid', 'dark', '#100d08', '#f59e0b'),
    P('orange', 'Orange', 'solid', 'dark', '#110c09', '#f97316'),
    P('red', 'Red', 'solid', 'dark', '#110a0a', '#ef4444'),
    P('rose', 'Rose', 'solid', 'dark', '#110a0c', '#f43f5e'),
    P('pink', 'Pink', 'solid', 'dark', '#110a0f', '#ec4899'),
    // Mixed: tinted backgrounds + accents
    P('dracula', 'Dracula', 'mixed', 'dark', '#1e1f29', '#bd93f9', '#ff79c6', { text: '#f8f8f2' }),
    P('nord', 'Nord', 'mixed', 'dark', '#2e3440', '#88c0d0', '#81a1c1', { text: '#eceff4', glow: false }),
    P('tokyo', 'Tokyo Night', 'mixed', 'dark', '#1a1b26', '#7aa2f7', '#bb9af7', { text: '#c0caf5' }),
    P('mocha', 'Catppuccin Mocha', 'mixed', 'dark', '#1e1e2e', '#cba6f7', '#89b4fa', { text: '#cdd6f4' }),
    P('gruvbox', 'Gruvbox', 'mixed', 'dark', '#282828', '#fe8019', '#fabd2f', { text: '#ebdbb2', glow: false }),
    P('monokai', 'Monokai', 'mixed', 'dark', '#272822', '#a6e22e', '#66d9ef', { text: '#f8f8f2', glow: false }),
    P('onedark', 'One Dark', 'mixed', 'dark', '#282c34', '#61afef', '#c678dd', { text: '#abb2bf' }),
    P('solardark', 'Solarized Dark', 'mixed', 'dark', '#002b36', '#268bd2', '#2aa198', { text: '#93a1a1', glow: false }),
    P('rosepine', 'Rosé Pine', 'mixed', 'dark', '#191724', '#ebbcba', '#c4a7e7', { text: '#e0def4' }),
    P('everforest', 'Everforest', 'mixed', 'dark', '#2d353b', '#a7c080', '#83c092', { text: '#d3c6aa', glow: false }),
    P('forest', 'Midnight Forest', 'mixed', 'dark', '#0c1410', '#4ade80', '#22d3ee', { text: '#d8e8de' }),
    P('coffee', 'Coffee', 'mixed', 'dark', '#1b1512', '#c08552', '#e6b17e', { text: '#ede0d4' }),
    P('navy', 'Navy', 'mixed', 'dark', '#0f1a2e', '#38bdf8', '#818cf8', { text: '#dbe7ff' }),
    P('plum', 'Plum', 'mixed', 'dark', '#1d1224', '#e879f9', '#f0abfc', { text: '#f3e8ff' }),
    // Light
    P('paper', 'Paper', 'light', 'light', '#f5f6fa', '#6d4aff', '#0ea5e9', { mid: '#4f6bff' }),
    P('clean', 'Clean White', 'light', 'light', '#fafafa', '#2563eb'),
    P('latte', 'Catppuccin Latte', 'light', 'light', '#eff1f5', '#8839ef', '#1e66f5', { text: '#4c4f69' }),
    P('sollight', 'Solarized Light', 'light', 'light', '#fdf6e3', '#268bd2', '#2aa198', { text: '#586e75' }),
    P('sakura', 'Sakura', 'light', 'light', '#fff5f7', '#db2777', '#f472b6', { text: '#4a2c35' }),
    P('mint', 'Mint', 'light', 'light', '#f2fbf7', '#059669', '#0891b2', { text: '#1f3a33' }),
    P('sand', 'Sand', 'light', 'light', '#faf6ef', '#b45309', null, { text: '#3d2f1e' }),
    P('sky-light', 'Daylight', 'light', 'light', '#f3f8fd', '#0284c7', '#7c3aed', { text: '#14263b' }),
    P('peach', 'Peach', 'light', 'light', '#fff7f2', '#ea580c', '#e11d48', { text: '#40261b' }),
    // Neon (pure black, vivid)
    P('neon-pink', 'Neon Pink', 'neon', 'dark', '#05030a', '#ff2bd6', '#7b2bff'),
    P('matrix', 'Matrix', 'neon', 'dark', '#020604', '#00ff6a', null, { text: '#c8ffd4' }),
    P('electric', 'Electric', 'neon', 'dark', '#02040a', '#00e5ff', '#2979ff'),
    P('acid', 'Acid', 'neon', 'dark', '#050505', '#d4ff00', '#00ff9d'),
    P('vapor', 'Vaporwave', 'neon', 'dark', '#0e0620', '#ff71ce', '#05ffa1', { mid: '#01cdfe' }),
    P('synth', 'Synthwave', 'neon', 'dark', '#140b24', '#f92aad', '#fdb52a', { text: '#f5e6ff' }),
    // Pastel
    P('dream', 'Pastel Dream', 'pastel', 'dark', '#16151c', '#c4b5fd', '#a5f3fc'),
    P('candy', 'Cotton Candy', 'pastel', 'dark', '#1a1520', '#f9a8d4', '#a5b4fc'),
    P('seafoam', 'Seafoam', 'pastel', 'dark', '#121816', '#a7f3d0', '#bae6fd'),
    P('lavender', 'Lavender', 'pastel', 'dark', '#17141f', '#d8b4fe'),
    P('apricot', 'Apricot', 'pastel', 'dark', '#1a1512', '#fdba74', '#fda4af'),
    // Mono / minimal
    P('graphite', 'Graphite', 'mono', 'dark', '#0b0b0c', '#e5e5e5'),
    P('amoled', 'AMOLED', 'mono', 'dark', '#000000', '#8b6cff', '#22d3ee', { mid: '#5b8cff' }),
    P('slate', 'Slate', 'mono', 'dark', '#0f172a', '#94a3b8', null, { text: '#e2e8f0' }),
    P('ink', 'Ink', 'mono', 'light', '#fafafa', '#18181b'),
    P('newsprint', 'Newsprint', 'mono', 'light', '#f1efe9', '#3f3f46', null, { text: '#27272a' }),
  ];

  function derive(t) {
    const dark = t.mode !== 'light';
    const bg = t.bg, fg = t.text || (dark ? '#e9ebf2' : '#161925');
    const grad = !!t.accent2;
    const a1 = readable(t.accent, dark ? mix(bg, fg, 0.05) : '#ffffff', 2.2);
    const a2 = t.accent2 || mix(t.accent, fg, 0.3);
    const mid = t.mid || mix(t.accent, a2, 0.5);
    const avg = grad ? mix(mix(t.accent, mid, 0.5), a2, 0.33) : t.accent;
    const onAccent = contrast(avg, '#ffffff') >= 2.6 ? '#ffffff' : '#111114';
    const success = dark ? '#34d399' : '#059669', warn = dark ? '#fbbf24' : '#b45309', danger = dark ? '#f87171' : '#dc2626';
    return {
      '--bg': bg,
      '--bg-grad': t.glow ? `radial-gradient(1200px 600px at 85% -10%, ${rgba(t.accent, dark ? 0.1 : 0.08)}, transparent 60%), radial-gradient(900px 500px at -10% 110%, ${rgba(a2, dark ? 0.07 : 0.07)}, transparent 60%)` : 'none',
      '--sidebar': dark ? mix(bg, fg, 0.02) : mix(bg, fg, 0.035),
      '--surface': dark ? mix(bg, fg, 0.045) : mix(bg, '#ffffff', 0.8),
      '--surface-2': dark ? mix(bg, fg, 0.075) : mix(bg, fg, 0.03),
      '--surface-3': dark ? mix(bg, fg, 0.11) : mix(bg, fg, 0.07),
      '--border': rgba(fg, dark ? 0.07 : 0.09),
      '--border-strong': rgba(fg, dark ? 0.13 : 0.16),
      '--text': fg,
      '--text-2': mix(fg, bg, 0.25),
      '--muted': mix(fg, bg, 0.46),
      '--accent': a1,
      '--accent-2': readable(a2, dark ? mix(bg, fg, 0.05) : '#ffffff', 2.2),
      '--accent-grad': grad ? `linear-gradient(135deg, ${t.accent} 0%, ${mid} 55%, ${a2} 100%)` : t.accent,
      '--accent-soft': rgba(t.accent, dark ? 0.15 : 0.11),
      '--on-accent': onAccent,
      '--g1': t.accent, '--g2': grad ? mid : t.accent, '--g3': grad ? a2 : t.accent,
      '--success': success, '--success-soft': rgba(success, dark ? 0.12 : 0.1),
      '--warn': warn, '--warn-soft': rgba(warn, 0.12),
      '--danger': danger, '--danger-soft': rgba(danger, dark ? 0.12 : 0.09),
      '--shadow': dark ? '0 1px 0 rgba(255, 255, 255, .03) inset, 0 10px 30px -12px rgba(0, 0, 0, .6)' : `0 1px 2px ${rgba(fg, 0.04)}, 0 8px 24px -12px ${rgba(fg, 0.15)}`,
      '--syn-k': readable(t.accent, bg, 4), '--syn-f': readable(a2, bg, 4),
      '--syn-s': dark ? '#7ee2a8' : '#047857', '--syn-n': dark ? '#ffb86b' : '#c2410c', '--syn-i': dark ? '#f5d778' : '#a16207', '--syn-v': dark ? '#ff8fb1' : '#be185d',
    };
  }

  const KEY = 'restora.theme';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } }
  function apply(t, save = true) {
    t = t || PRESETS[0];
    const vars = derive(t), root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    root.dataset.mode = t.mode === 'light' ? 'light' : 'dark';
    root.style.colorScheme = root.dataset.mode;
    Theme.current = t;
    if (save) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} }
    try { window.api?.setWindowBg?.(t.bg); } catch {}
    return vars;
  }
  const Theme = { PRESETS, derive, apply, load, mix, hex, toHex, current: null };
  window.Theme = Theme;
  apply(load() || PRESETS[0], false);
})();
