/**
 * profile.js — Family Profiles
 * Handles create, switch, and delete operations for family profiles.
 */

// ── Render on load ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', renderProfiles);


function renderProfiles() {
  const grid      = document.getElementById('profilesGrid');
  const noProfiles = document.getElementById('noProfiles');
  const countBadge = document.getElementById('profileCount');
  const names     = Object.keys(SAVED_PROFILES);

  countBadge.textContent = names.length;

  if (names.length === 0) {
    noProfiles.style.display = 'block';
    grid.innerHTML = '';
    return;
  }
  noProfiles.style.display = 'none';

  grid.innerHTML = names.map(name => {
    const p       = SAVED_PROFILES[name];
    const initial = name.charAt(0).toUpperCase();
    const isActive = name === ACTIVE_PROFILE_NAME;
    const goalLabel = (p.fitness_goal || 'general').replace('_', ' ');
    return `
      <div class="col-sm-6 col-lg-4">
        <div class="fb-profile-card text-center ${isActive ? 'active-profile' : ''}">
          <div class="fb-profile-avatar">${initial}</div>
          <div class="fw-bold mb-1">${name}</div>
          <div class="text-muted small mb-1">${p.age ? p.age + ' yrs' : ''} ${p.gender ? '• ' + p.gender : ''}</div>
          <div class="badge bg-primary bg-opacity-15 text-primary small mb-2">${goalLabel}</div>
          ${isActive ? '<span class="badge bg-success mb-2 d-block">Active Profile</span>' : ''}
          <div class="d-flex gap-2 justify-content-center mt-2">
            <button class="btn btn-sm fb-btn-primary" onclick="switchProfile('${name}')">
              <i class="bi bi-arrow-repeat me-1"></i>Switch
            </button>
            <button class="btn btn-sm fb-btn-outline" onclick="editProfile('${name}')">
              <i class="bi bi-pencil me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProfile('${name}')">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}


// ── Save ───────────────────────────────────────────────────────────────────
async function saveProfile() {
  const name = document.getElementById('pName').value.trim();
  if (!name) { showToast('Please enter a name for this profile.', 'warning'); return; }

  const payload = {
    name,
    age:            document.getElementById('pAge').value,
    gender:         document.getElementById('pGender').value,
    weight_kg:      document.getElementById('pWeight').value,
    height_cm:      document.getElementById('pHeight').value,
    activity_level: document.getElementById('pActivity').value,
    fitness_goal:   document.getElementById('pGoal').value,
    workout_time:   document.getElementById('pWorkoutTime').value,
    experience:     document.getElementById('pExperience').value,
    dietary_pref:   document.getElementById('pDiet').value,
    health_notes:   document.getElementById('pHealthNotes').value,
  };

  try {
    const res  = await fetch('/api/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.error || 'Save failed.', 'danger'); return; }

    // Update local state and re-render
    SAVED_PROFILES[name] = data.profile;
    ACTIVE_PROFILE_NAME  = name;
    renderProfiles();
    updateNavBadge(name);
    showToast(`Profile "${name}" saved!`, 'success');
  } catch (err) {
    showToast('Network error. Please try again.', 'danger');
  }
}


// ── Switch ─────────────────────────────────────────────────────────────────
async function switchProfile(name) {
  try {
    const res  = await fetch('/api/profile/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) { showToast('Could not switch profile.', 'danger'); return; }

    ACTIVE_PROFILE_NAME = name;
    renderProfiles();
    updateNavBadge(name);
    showToast(`Switched to "${name}"`, 'success');
  } catch (err) {
    showToast('Network error.', 'danger');
  }
}


// ── Edit ───────────────────────────────────────────────────────────────────
function editProfile(name) {
  const p = SAVED_PROFILES[name];
  if (!p) return;

  document.getElementById('pName').value         = p.name         || '';
  document.getElementById('pAge').value          = p.age          || '';
  document.getElementById('pGender').value       = p.gender       || '';
  document.getElementById('pWeight').value       = p.weight_kg    || '';
  document.getElementById('pHeight').value       = p.height_cm    || '';
  document.getElementById('pActivity').value     = p.activity_level || '';
  document.getElementById('pGoal').value         = p.fitness_goal || '';
  document.getElementById('pWorkoutTime').value  = p.workout_time || '';
  document.getElementById('pExperience').value   = p.experience   || '';
  document.getElementById('pDiet').value         = p.dietary_pref || '';
  document.getElementById('pHealthNotes').value  = p.health_notes || '';

  document.getElementById('formTitle').textContent = `Edit — ${name}`;
  document.getElementById('pName').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ── Delete ─────────────────────────────────────────────────────────────────
async function deleteProfile(name) {
  if (!confirm(`Delete profile "${name}"? This cannot be undone.`)) return;

  try {
    await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    delete SAVED_PROFILES[name];
    if (ACTIVE_PROFILE_NAME === name) {
      ACTIVE_PROFILE_NAME = '';
      updateNavBadge('');
    }
    renderProfiles();
    showToast(`Profile "${name}" deleted.`, 'info');
  } catch (err) {
    showToast('Network error.', 'danger');
  }
}


// ── Utilities ──────────────────────────────────────────────────────────────
function clearForm() {
  document.getElementById('profileForm').reset();
  document.getElementById('formTitle').textContent = 'Edit Profile';
}

function updateNavBadge(name) {
  const badge = document.querySelector('.fb-profile-badge');
  if (!badge) return;
  if (name) {
    badge.innerHTML = `<i class="bi bi-person-fill me-1"></i>${name}`;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}
