"""
fitness_utils.py
────────────────
Pure-Python helper functions for fitness calculations and data
processing.  No AI calls here – these are deterministic utilities.
"""

from __future__ import annotations
import math
from typing import Any


# ─── BMI ──────────────────────────────────────────────────────────────────────

def calculate_bmi(weight_kg: float, height_cm: float) -> dict[str, Any]:
    """
    Calculate BMI and return a categorised result dict.

    Args:
        weight_kg: Body weight in kilograms.
        height_cm: Height in centimetres.

    Returns:
        Dict with keys: bmi, category, color, advice.
    """
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Weight and height must be positive numbers.")

    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        category, color, advice = (
            "Underweight", "warning",
            "Consider increasing calorie intake with nutrient-rich foods. "
            "Strength training can help build healthy muscle mass.",
        )
    elif bmi < 25.0:
        category, color, advice = (
            "Normal weight", "success",
            "Great job! Maintain your healthy weight with balanced nutrition "
            "and regular exercise (150+ min/week).",
        )
    elif bmi < 30.0:
        category, color, advice = (
            "Overweight", "warning",
            "A mix of cardio and strength training, combined with a mindful "
            "diet, can help you reach a healthier weight.",
        )
    else:
        category, color, advice = (
            "Obese", "danger",
            "Please consult a healthcare professional for a personalised plan. "
            "Small, consistent changes in diet and activity make a big difference.",
        )

    return {"bmi": bmi, "category": category, "color": color, "advice": advice}


# ─── Calorie estimation ───────────────────────────────────────────────────────

def estimate_daily_calories(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
) -> dict[str, int]:
    """
    Estimate TDEE (Total Daily Energy Expenditure) using Mifflin-St Jeor.

    activity_level choices: sedentary | light | moderate | active | very_active
    """
    # Basal Metabolic Rate
    if gender.lower() in ("male", "m"):
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }
    multiplier = multipliers.get(activity_level.lower(), 1.55)
    tdee = round(bmr * multiplier)

    return {
        "maintenance": tdee,
        "weight_loss": tdee - 500,         # ~0.5 kg/week deficit
        "aggressive_loss": tdee - 750,     # ~0.75 kg/week deficit
        "muscle_gain": tdee + 300,         # lean bulk surplus
    }


# ─── Ideal weight range ───────────────────────────────────────────────────────

def ideal_weight_range(height_cm: float) -> tuple[float, float]:
    """Return (min_kg, max_kg) for a healthy BMI (18.5–24.9)."""
    h = height_cm / 100.0
    return round(18.5 * h ** 2, 1), round(24.9 * h ** 2, 1)


# ─── Water intake recommendation ─────────────────────────────────────────────

def daily_water_litres(weight_kg: float, activity_level: str = "moderate") -> float:
    """Recommend daily water intake in litres."""
    base = weight_kg * 0.033
    bonus = {"sedentary": 0, "light": 0.3, "moderate": 0.5,
             "active": 0.7, "very_active": 1.0}
    extra = bonus.get(activity_level.lower(), 0.5)
    return round(base + extra, 1)


# ─── Workout duration suggestion ─────────────────────────────────────────────

def recommended_weekly_minutes(fitness_goal: str) -> dict[str, Any]:
    """Return cardio + strength split based on the user's primary goal."""
    plans = {
        "weight_loss":   {"cardio": 200, "strength": 90,  "flexibility": 30},
        "muscle_gain":   {"cardio": 75,  "strength": 180, "flexibility": 30},
        "endurance":     {"cardio": 250, "strength": 60,  "flexibility": 30},
        "flexibility":   {"cardio": 75,  "strength": 60,  "flexibility": 120},
        "general":       {"cardio": 150, "strength": 90,  "flexibility": 30},
    }
    plan = plans.get(fitness_goal.lower(), plans["general"])
    plan["total"] = sum(plan.values())
    return plan


# ─── Profile summary for prompt injection ────────────────────────────────────

def build_user_profile_summary(profile: dict[str, Any]) -> str:
    """
    Convert a user profile dict into a concise natural-language summary
    suitable for prepending to an AI prompt.
    """
    lines = []
    if profile.get("name"):
        lines.append(f"User name: {profile['name']}")
    if profile.get("age"):
        lines.append(f"Age: {profile['age']} years")
    if profile.get("gender"):
        lines.append(f"Gender: {profile['gender']}")
    if profile.get("weight_kg"):
        lines.append(f"Weight: {profile['weight_kg']} kg")
    if profile.get("height_cm"):
        lines.append(f"Height: {profile['height_cm']} cm")
    if profile.get("activity_level"):
        lines.append(f"Activity level: {profile['activity_level']}")
    if profile.get("fitness_goal"):
        lines.append(f"Primary fitness goal: {profile['fitness_goal']}")
    if profile.get("workout_time"):
        lines.append(f"Available workout time per session: {profile['workout_time']} minutes")
    if profile.get("experience"):
        lines.append(f"Fitness experience: {profile['experience']}")
    if profile.get("dietary_pref"):
        lines.append(f"Dietary preference: {profile['dietary_pref']}")
    if profile.get("health_notes"):
        lines.append(f"Health notes: {profile['health_notes']}")

    return "\n".join(lines) if lines else "No profile information provided yet."
