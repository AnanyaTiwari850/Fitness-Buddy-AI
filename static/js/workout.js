/**
 * workout.js — Workout Planner
 * Handles AI workout plan generation and display.
 */

async function generateWorkoutPlan() {
  const btn        = document.getElementById('generateBtn');
  const emptyEl    = document.getElementById('emptyPlan');
  const loadingEl  = document.getElementById('planLoading');
  const contentEl  = document.getElementById('planContent');
  const actionsEl  = document.getElementById('planActions');

  const goal       = document.getElementById('goalSelect').value;
  const experience = document.getElementById('experienceSelect').value;
  const duration   = document.getElementById('durationRange').value;
  const days       = document.getElementById('daysRange').value;
  const equipment  = document.querySelector('input[name="equipment"]:checked')?.value || 'No equipment';

  emptyEl.classList.add('d-none');
  contentEl.classList.add('d-none');
  actionsEl.classList.add('d-none');
  loadingEl.classList.remove('d-none');
  btn.disabled = true;

  try {
    const res = await fetch('/api/workout/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, experience, duration: +duration, days: +days, equipment }),
    });
    const data = await res.json();

    loadingEl.classList.add('d-none');

    if (!res.ok) {
      contentEl.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>${data.error || 'Failed to generate plan.'}</div>`;
    } else {
      contentEl.innerHTML = formatPlan(data.plan);
      actionsEl.classList.remove('d-none');
    }
    contentEl.classList.remove('d-none');
  } catch (err) {
    loadingEl.classList.add('d-none');
    contentEl.innerHTML = `<div class="alert alert-danger"><i class="bi bi-wifi-off me-2"></i>Network error. Please try again.</div>`;
    contentEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
  }
}


/**
 * Format plain-text plan into styled HTML.
 */
function formatPlan(text) {
  return text
    .replace(/^### (.+)$/gm, '<h5 class="mt-3 mb-1 text-primary">$1</h5>')
    .replace(/^## (.+)$/gm,  '<h4 class="mt-4 mb-2 fw-bold">$1</h4>')
    .replace(/^# (.+)$/gm,   '<h3 class="mt-4 mb-2 fw-bold">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[•\-\*] (.+)$/gm, '<li class="mb-1">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, match => `<ul class="ps-3 mb-2">${match}</ul>`)
    .replace(/\n\n/g, '<br>')
    .replace(/\n/g, '<br>');
}


/**
 * Copy plan text to clipboard.
 */
function copyPlan() {
  const contentEl = document.getElementById('planContent');
  const text = contentEl.innerText || contentEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Plan copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Could not copy — try selecting the text manually.', 'warning');
  });
}
