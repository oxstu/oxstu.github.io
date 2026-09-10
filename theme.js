// Light / dark theme toggle.
// Swap the color values below to change either palette.

const THEMES = {
  dark: {
    '--bg': '#0d0d0d',
    '--bg-elevated': '#161616',
    '--border': '#2a2a2a',
    '--text-primary': '#ececec',
    '--text-secondary': '#9a9a9a',
    '--text-body': '#c7c7c7',
    '--text-faint': '#7a7a7a',
  },
  light: {
    '--bg': '#f7f5f1',
    '--bg-elevated': '#ffffff',
    '--border': '#dedad2',
    '--text-primary': '#000000',
    '--text-secondary': '#494949',
    '--text-body': '#333333',
    '--text-faint': '#5c5c5c',
  },
};

function applyTheme(name) {
  const vars = THEMES[name];
  const root = document.documentElement.style;
  Object.entries(vars).forEach(([key, value]) => root.setProperty(key, value));
  document.body.dataset.theme = name;
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme');
  let current = saved === 'light' ? 'light' : 'dark';

  applyTheme(current);
  toggle.innerHTML = current === 'dark' ? '&#9788;' : '&#9790;';

  toggle.addEventListener('click', () => {
    current = current === 'dark' ? 'light' : 'dark';
    applyTheme(current);
    toggle.innerHTML = current === 'dark' ? '&#9788;' : '&#9790;';
    localStorage.setItem('theme', current);
  });
});
