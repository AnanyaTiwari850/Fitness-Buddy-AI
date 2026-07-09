/**
 * main.js — Fitness Buddy
 * Global utilities: theme toggle, daily tips.
 */

// ── Theme Toggle ─────────────────────────────────────────────────────────────
(function initTheme() {
  const htmlEl = document.documentElement;
  const btn    = document.getElementById('themeToggle');
  const icon   = document.getElementById('themeIcon');

  const saved = localStorage.getItem('fb-theme') || 'light';
  applyTheme(saved);

  if (btn) btn.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('fb-theme', next);
  });

  function applyTheme(theme) {
    htmlEl.setAttribute('data-bs-theme', theme);
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }
  }
})();


// ── Daily Tips ────────────────────────────────────────────────────────────────
const DAILY_TIPS = [
  "Start your morning with a glass of warm water and 5 minutes of deep breathing.",
  "A 20-minute brisk walk after dinner can significantly improve blood sugar levels.",
  "Eat slowly and mindfully — it takes 20 minutes for your brain to register fullness.",
  "Include one source of protein (dal, paneer, eggs, nuts) in every meal.",
  "Replace one sugary drink per day with water or green tea to cut hidden calories.",
  "Do 10 squats every time you boil a kettle or wait for chai to brew!",
  "Sleep and recovery are just as important as exercise. Aim for 7–9 hours nightly.",
  "Stretch for 5 minutes before bed to improve flexibility and sleep quality.",
  "Take the stairs instead of the lift — small habits add up over months.",
  "Prepare healthy snacks (chana, makhana, fruits) in advance to avoid junk food.",
  "Drink a glass of water before each meal to manage portions naturally.",
  "Consistency beats intensity. A short daily workout is better than one long session weekly.",
  "Add one handful of seasonal vegetables to every cooked meal.",
  "Practice 'exercise snacks' — 2-minute movement breaks every hour at your desk.",
  "Rest days are essential. Your muscles repair and grow when you rest, not while exercising.",
  "Track what you eat for just 3 days — most people are surprised by portion sizes.",
  "Morning sunlight for 10 minutes boosts Vitamin D and regulates your circadian rhythm.",
  "Surround yourself with health-conscious people — habits are contagious!",
  "Set a consistent sleep and wake time, even on weekends.",
  "Every body is different. Focus on progress, not comparison.",
];

function loadDailyTip() {
  const el = document.getElementById('dailyTip');
  if (!el) return;
  const idx = Math.floor(Math.random() * DAILY_TIPS.length);
  el.style.opacity = '0';
  el.style.transform = 'translateY(8px)';
  el.style.transition = 'opacity .3s, transform .3s';
  setTimeout(() => {
    el.textContent = '"' + DAILY_TIPS[idx] + '"';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  loadDailyTip();
});


// ── Toast helper ──────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer') || (() => {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `alert alert-${type} mb-0 shadow-sm animate-fade-in`;
  toast.style.cssText = 'min-width:260px;max-width:360px;padding:.65rem 1rem;font-size:.85rem;';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
