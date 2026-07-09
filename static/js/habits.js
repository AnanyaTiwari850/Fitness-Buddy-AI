/**
 * habits.js — Habit Tracker
 * Manages daily habit tracking, water intake, streaks, and AI motivation.
 */

// ── State ──────────────────────────────────────────────────────────────────
let completedHabits = new Set();
let waterGlasses    = new Set();
let currentStreak   = parseInt(localStorage.getItem('fb-streak') || '0', 10);

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCounts();
  document.getElementById('streakValue').innerHTML =
    `${currentStreak} <span class="fb-stat-unit">days</span>`;
});


// ── Habit toggling ─────────────────────────────────────────────────────────
function toggleHabit(btn) {
  const item = btn.closest('.fb-habit-item');
  const name = item.dataset.habit;
  const icon = btn.querySelector('i');

  if (completedHabits.has(name)) {
    completedHabits.delete(name);
    icon.className = 'bi bi-circle text-muted fs-5';
    btn.classList.remove('checked');
    item.classList.remove('completed');
  } else {
    completedHabits.add(name);
    icon.className = 'bi bi-check-circle-fill text-success fs-5';
    btn.classList.add('checked');
    item.classList.add('completed');
  }
  updateCounts();
}

function updateCounts() {
  const all = document.querySelectorAll('.fb-habit-item');
  document.getElementById('completedCount').textContent = completedHabits.size;
  document.getElementById('totalCount').textContent     = all.length;

  // Auto-save streak if all habits done
  if (all.length > 0 && completedHabits.size === all.length) {
    const today = new Date().toDateString();
    const last  = localStorage.getItem('fb-streak-date');
    if (last !== today) {
      currentStreak++;
      localStorage.setItem('fb-streak', currentStreak);
      localStorage.setItem('fb-streak-date', today);
      document.getElementById('streakValue').innerHTML =
        `${currentStreak} <span class="fb-stat-unit">days</span>`;
      showToast(`🔥 All habits done! Streak: ${currentStreak} days`, 'success');
    }
  }
}


// ── Add / remove habits ────────────────────────────────────────────────────
function addHabit() {
  const name  = document.getElementById('newHabitName').value.trim();
  const desc  = document.getElementById('newHabitDesc').value.trim() || 'Daily habit';
  const color = document.getElementById('newHabitCategory').value;

  if (!name) { showToast('Please enter a habit name.', 'warning'); return; }

  const icons = {
    warning: 'bi-sunrise', primary: 'bi-droplet-fill',
    success: 'bi-apple',   info:    'bi-moon-stars-fill',
    secondary:'bi-wind',   danger:  'bi-heart-fill',
  };

  const item = document.createElement('div');
  item.className = 'fb-habit-item';
  item.dataset.habit = name;
  item.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <button class="fb-habit-check" onclick="toggleHabit(this)" aria-label="Toggle ${name}">
        <i class="bi bi-circle text-muted fs-5"></i>
      </button>
      <div class="fb-habit-icon bg-${color} bg-opacity-10 text-${color}">
        <i class="bi ${icons[color] || 'bi-check2'}"></i>
      </div>
      <div class="flex-grow-1">
        <div class="fw-semibold">${name}</div>
        <small class="text-muted">${desc}</small>
      </div>
      <button class="btn btn-sm btn-link text-danger p-0" onclick="removeHabit(this)" title="Remove">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>`;

  const list = document.getElementById('habitList');
  const noMsg = document.getElementById('noHabitsMsg');
  if (noMsg) noMsg.style.display = 'none';
  list.appendChild(item);
  updateCounts();
  showToast(`Habit "${name}" added!`, 'success');
}

function removeHabit(btn) {
  const item = btn.closest('.fb-habit-item');
  completedHabits.delete(item.dataset.habit);
  item.remove();
  updateCounts();
}


// ── Water tracker ──────────────────────────────────────────────────────────
function toggleGlass(idx) {
  const btn = document.getElementById(`glass${idx}`);
  if (waterGlasses.has(idx)) {
    waterGlasses.delete(idx);
    btn.classList.remove('filled');
  } else {
    waterGlasses.add(idx);
    btn.classList.add('filled');
  }
  const count = waterGlasses.size;
  document.getElementById('waterCount').textContent = count;
  document.getElementById('waterProgress').style.width = `${count / 8 * 100}%`;
  if (count === 8) showToast('💧 Hydration goal reached! Great job!', 'success');
}


// ── AI Motivation ──────────────────────────────────────────────────────────
async function getMotivation() {
  const habits = Array.from(document.querySelectorAll('.fb-habit-item'))
                      .map(el => el.dataset.habit);

  const emptyEl   = document.getElementById('motivationEmpty');
  const loadingEl = document.getElementById('motivationLoading');
  const contentEl = document.getElementById('motivationContent');

  emptyEl.classList.add('d-none');
  contentEl.classList.add('d-none');
  loadingEl.classList.remove('d-none');

  try {
    const res = await fetch('/api/habits/motivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits, streak: currentStreak }),
    });
    const data = await res.json();

    loadingEl.classList.add('d-none');
    if (!res.ok) {
      contentEl.innerHTML = `<div class="text-danger small"><i class="bi bi-exclamation-circle me-1"></i>${data.error || 'Could not load motivation.'}</div>`;
    } else {
      contentEl.innerHTML = data.motivation.replace(/\n/g, '<br>');
    }
    contentEl.classList.remove('d-none');
  } catch (err) {
    loadingEl.classList.add('d-none');
    contentEl.innerHTML = '<div class="text-danger small">Network error. Please try again.</div>';
    contentEl.classList.remove('d-none');
  }
}
