/**
 * bmi.js — BMI Calculator
 * Calls the /api/bmi endpoint and renders results.
 */

async function calculateBMI() {
  const weight   = parseFloat(document.getElementById('weight').value);
  const height   = parseFloat(document.getElementById('height').value);
  const age      = parseInt(document.getElementById('age').value) || 25;
  const gender   = document.getElementById('gender').value;
  const activity = document.getElementById('activity').value;

  if (!weight || !height || weight <= 0 || height <= 0) {
    showToast('Please enter valid weight and height.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/bmi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: weight, height_cm: height, age, gender, activity_level: activity }),
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.error || 'Calculation failed.', 'danger'); return; }

    renderBMI(data);
    renderCalories(data.calories);
    renderWater(data.daily_water_litres, data.ideal_weight_range);
  } catch (err) {
    showToast('Network error. Please try again.', 'danger');
  }
}


function renderBMI(data) {
  const { bmi, category, color, advice } = data.bmi;

  document.getElementById('bmiEmpty').classList.add('d-none');
  document.getElementById('bmiResult').classList.remove('d-none');

  const valueEl    = document.getElementById('bmiValue');
  const categoryEl = document.getElementById('bmiCategory');
  const adviceEl   = document.getElementById('bmiAdvice');
  const gauge      = document.getElementById('bmiGauge');
  const pointer    = document.getElementById('bmiPointer');

  valueEl.textContent    = bmi;
  categoryEl.textContent = category;
  adviceEl.textContent   = advice;

  // Badge colour on category
  const colorMap = { success: '#28a745', warning: '#ffc107', danger: '#dc3545', info: '#17a2b8' };
  categoryEl.style.color = colorMap[color] || '#333';

  // Animate gauge (conic gradient: 0–40 maps to Underweight→Obese)
  const pct = Math.min(Math.max((bmi - 10) / 30 * 100, 0), 100);
  gauge.style.background = `conic-gradient(${colorMap[color] || '#4f46e5'} ${pct}%, var(--fb-border) 0%)`;

  // Move pointer on scale bar  (scale: 10–40, so 30-point range)
  const pointerPct = Math.min(Math.max((bmi - 10) / 30 * 100, 0), 100);
  if (pointer) pointer.style.left = `${pointerPct}%`;
}


function renderCalories(calories) {
  if (!calories) return;
  const card = document.getElementById('calorieCard');
  card.classList.remove('d-none');
  document.getElementById('calMaint').textContent   = `${calories.maintenance} kcal`;
  document.getElementById('calLoss').textContent    = `${calories.weight_loss} kcal`;
  document.getElementById('calAggLoss').textContent = `${calories.aggressive_loss} kcal`;
  document.getElementById('calGain').textContent    = `${calories.muscle_gain} kcal`;
}


function renderWater(water, idealRange) {
  const card = document.getElementById('waterCard');
  card.classList.remove('d-none');
  document.getElementById('waterGoal').textContent  = `${water} L`;
  document.getElementById('idealRange').textContent = `${idealRange.min_kg} – ${idealRange.max_kg} kg`;
}
