"""
app.py – Fitness Buddy Flask Application
=========================================
Entry point for the AI-powered Fitness Buddy web app.
Integrates IBM watsonx.ai Granite models for personalized fitness coaching.

Run locally:
    pip install -r requirements.txt
    cp .env.example .env   # fill in credentials
    python app.py
"""

import os
import json
import logging
from datetime import datetime
from flask import (
    Flask, render_template, request, jsonify,
    session, redirect, url_for, flash,
)
from dotenv import load_dotenv

# Load .env before importing modules that need env vars
load_dotenv()

from modules.watsonx_client import generate_response
from modules.fitness_utils import (
    calculate_bmi,
    estimate_daily_calories,
    ideal_weight_range,
    daily_water_litres,
    recommended_weekly_minutes,
    build_user_profile_summary,
)

# ─────────────────────────────────────────────────────────────────────────────
#  AGENT_INSTRUCTIONS
#  ──────────────────
#  Edit this section to customise the AI assistant's behaviour without
#  touching any other application code.
# ─────────────────────────────────────────────────────────────────────────────
AGENT_INSTRUCTIONS = """
You are Fitness Buddy, a friendly, supportive, and highly motivational virtual
fitness coach designed to help Indian families lead healthier lives.

## Personality & Tone
- Warm, encouraging, and conversational — like a trusted friend who happens
  to be a fitness expert.
- Professional yet approachable; never condescending.
- Use positive reinforcement: celebrate small wins and progress.
- Keep responses clear, practical, and actionable.

## Fitness Specialisation
- General fitness, home workouts (no or minimal equipment), yoga, walking,
  and bodyweight training.
- Weight loss, muscle gain, endurance, flexibility, and healthy lifestyle.
- Suitable for all age groups including teenagers, adults, and senior citizens.

## Nutrition Guidance
- Basic, non-medical nutritional guidance only.
- Prioritise balanced Indian meal suggestions: dal, sabzi, roti, rice,
  sprouts, curd, fruits, salads, and healthy snacks like makhana or chana.
- Highlight hydration, portion control, and meal timing.
- Respect vegetarian, vegan, and regional dietary preferences.

## Safety Rules (MUST follow)
- NEVER provide medical diagnoses, prescriptions, or specific medical advice.
- Always recommend consulting a qualified doctor or physiotherapist for
  injuries, chronic illnesses, or medical conditions.
- Include warm-up and cool-down reminders for workout plans.
- Remind users to stop exercise and rest if they feel pain or dizziness.
- Encourage gradual progression — avoid extreme diets or overtraining advice.

## Motivation Style
- Use the user's name when available.
- Celebrate milestones and streaks.
- Provide daily motivational quotes when relevant.
- Encourage habit stacking and small, consistent daily actions.
- Reference Indian cultural context (festivals, seasons, local foods) where
  appropriate to make advice more relatable.

## Output Format
- Use clear sections with headings (##) when providing plans.
- Use bullet points (•) for lists of exercises, tips, or meal ideas.
- Provide specific, actionable steps — not vague generalities.
- For workout plans include: exercise name, sets/reps or duration, rest time.
- Keep responses concise unless a detailed plan is requested.
- End responses with an encouraging closing line or follow-up suggestion.

## Context Awareness
- Use the user profile information provided to personalise every response.
- Remember conversation history to give contextually relevant follow-ups.
- Adjust difficulty and recommendations based on fitness experience level.
"""
# ─────────────────────────────────────────────────────────────────────────────


# ─── Flask app setup ──────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-in-production")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s – %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Conversation history limit ───────────────────────────────────────────────
MAX_HISTORY_TURNS = 10   # Keep last N user+assistant exchanges in session


# ─── Prompt builder ───────────────────────────────────────────────────────────

def build_prompt(user_message: str, history: list[dict], profile: dict) -> str:
    """
    Assemble the full prompt sent to the Granite model.

    Structure:
        [AGENT_INSTRUCTIONS]
        [User Profile]
        [Conversation History]
        [Current User Message]
        Assistant:
    """
    profile_summary = build_user_profile_summary(profile)

    # Build conversation history block
    history_text = ""
    for turn in history[-MAX_HISTORY_TURNS:]:
        role = "User" if turn["role"] == "user" else "Assistant"
        history_text += f"{role}: {turn['content']}\n"

    prompt = (
        f"{AGENT_INSTRUCTIONS.strip()}\n\n"
        f"## User Profile\n{profile_summary}\n\n"
        f"## Conversation History\n{history_text}"
        f"User: {user_message}\n"
        f"Assistant:"
    )
    return prompt


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Dashboard / home page."""
    profile = session.get("profile", {})
    stats = _build_dashboard_stats(profile)
    return render_template("index.html", profile=profile, stats=stats)


@app.route("/chat")
def chat():
    """Chat interface page."""
    profile = session.get("profile", {})
    history = session.get("chat_history", [])
    return render_template("chat.html", profile=profile, history=history)


@app.route("/api/chat", methods=["POST"])
def api_chat():
    """Handle chat messages and return AI response."""
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400
    if len(user_message) > 2000:
        return jsonify({"error": "Message too long (max 2000 characters)."}), 400

    profile = session.get("profile", {})
    history: list[dict] = session.get("chat_history", [])

    try:
        prompt = build_prompt(user_message, history, profile)
        ai_response = generate_response(prompt)
    except EnvironmentError as exc:
        logger.warning("Credentials missing: %s", exc)
        return jsonify({
            "error": "IBM watsonx.ai credentials are not configured. "
                     "Please add IBM_API_KEY and WATSONX_PROJECT_ID to your .env file."
        }), 503
    except RuntimeError as exc:
        logger.error("AI error: %s", exc)
        return jsonify({"error": str(exc)}), 500

    # Persist history in session (trimmed)
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": ai_response})
    session["chat_history"] = history[-(MAX_HISTORY_TURNS * 2):]
    session.modified = True

    return jsonify({
        "response": ai_response,
        "timestamp": datetime.now().strftime("%H:%M"),
    })


@app.route("/api/chat/clear", methods=["POST"])
def clear_chat():
    """Clear conversation history for the current session."""
    session.pop("chat_history", None)
    return jsonify({"status": "cleared"})


@app.route("/workout")
def workout():
    """Workout planner page."""
    profile = session.get("profile", {})
    goal = profile.get("fitness_goal", "general")
    weekly_plan = recommended_weekly_minutes(goal)
    return render_template("workout.html", profile=profile, weekly_plan=weekly_plan)


@app.route("/api/workout/plan", methods=["POST"])
def api_workout_plan():
    """Generate an AI workout plan based on user inputs."""
    data = request.get_json(silent=True) or {}
    profile = session.get("profile", {})

    goal = data.get("goal") or profile.get("fitness_goal", "general fitness")
    duration = data.get("duration") or profile.get("workout_time", 30)
    experience = data.get("experience") or profile.get("experience", "beginner")
    equipment = data.get("equipment", "no equipment")
    days = data.get("days", 5)

    prompt = (
        f"{AGENT_INSTRUCTIONS.strip()}\n\n"
        f"## User Profile\n{build_user_profile_summary(profile)}\n\n"
        f"Create a detailed {days}-day/week workout plan for the following:\n"
        f"• Goal: {goal}\n"
        f"• Session duration: {duration} minutes\n"
        f"• Experience level: {experience}\n"
        f"• Equipment available: {equipment}\n\n"
        f"Include warm-up, main workout with sets/reps/duration, cool-down, "
        f"rest days, and weekly progression tips.\n"
        f"Assistant:"
    )

    try:
        plan = generate_response(prompt)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"plan": plan, "timestamp": datetime.now().isoformat()})


@app.route("/bmi")
def bmi():
    """BMI calculator page."""
    profile = session.get("profile", {})
    bmi_result = None
    if profile.get("weight_kg") and profile.get("height_cm"):
        try:
            bmi_result = calculate_bmi(
                float(profile["weight_kg"]), float(profile["height_cm"])
            )
        except ValueError:
            pass
    return render_template("bmi.html", profile=profile, bmi_result=bmi_result)


@app.route("/api/bmi", methods=["POST"])
def api_bmi():
    """Calculate BMI and return detailed result with calorie estimates."""
    data = request.get_json(silent=True) or {}
    try:
        weight = float(data["weight_kg"])
        height = float(data["height_cm"])
        age    = int(data.get("age", 25))
        gender = str(data.get("gender", "male"))
        activity = str(data.get("activity_level", "moderate"))
    except (KeyError, ValueError, TypeError) as exc:
        return jsonify({"error": f"Invalid input: {exc}"}), 400

    try:
        bmi_result   = calculate_bmi(weight, height)
        calories     = estimate_daily_calories(weight, height, age, gender, activity)
        ideal_range  = ideal_weight_range(height)
        water        = daily_water_litres(weight, activity)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({
        "bmi": bmi_result,
        "calories": calories,
        "ideal_weight_range": {"min_kg": ideal_range[0], "max_kg": ideal_range[1]},
        "daily_water_litres": water,
    })


@app.route("/habits")
def habits():
    """Habit tracker page."""
    return render_template("habits.html",
                           profile=session.get("profile", {}),
                           today=datetime.now().strftime("%A, %d %B %Y"))


@app.route("/api/habits/motivate", methods=["POST"])
def api_habit_motivate():
    """Get AI motivation for habit building."""
    data = request.get_json(silent=True) or {}
    habits_list = data.get("habits", [])
    streak = data.get("streak", 0)
    profile = session.get("profile", {})

    habits_text = "\n".join(f"• {h}" for h in habits_list) if habits_list else "• Exercise daily\n• Drink water\n• Sleep 8 hours"

    prompt = (
        f"{AGENT_INSTRUCTIONS.strip()}\n\n"
        f"## User Profile\n{build_user_profile_summary(profile)}\n\n"
        f"The user is tracking these daily fitness habits:\n{habits_text}\n"
        f"Current streak: {streak} days.\n\n"
        f"Provide an encouraging motivational message (3–5 sentences) that "
        f"celebrates their consistency, gives one practical tip to maintain "
        f"momentum, and ends with an inspiring quote.\n"
        f"Assistant:"
    )

    try:
        motivation = generate_response(prompt)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"motivation": motivation})


@app.route("/profile")
def profile_page():
    """User profile page."""
    profiles = session.get("all_profiles", {})
    current  = session.get("profile", {})
    return render_template("profile.html", profile=current, all_profiles=profiles)


@app.route("/api/profile/save", methods=["POST"])
def api_profile_save():
    """Save or update a user profile."""
    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "name", "age", "gender", "weight_kg", "height_cm",
        "activity_level", "fitness_goal", "workout_time",
        "experience", "dietary_pref", "health_notes",
    ]
    profile = {k: data[k] for k in allowed_fields if k in data and data[k] != ""}

    # Numeric coercions
    for field in ("age", "weight_kg", "height_cm", "workout_time"):
        if field in profile:
            try:
                profile[field] = float(profile[field])
                if field == "age":
                    profile[field] = int(profile[field])
            except ValueError:
                return jsonify({"error": f"Invalid value for {field}."}), 400

    session["profile"] = profile

    # Store in multi-profile registry keyed by name
    name = profile.get("name", "default")
    all_profiles = session.get("all_profiles", {})
    all_profiles[name] = profile
    session["all_profiles"] = all_profiles
    session.modified = True

    return jsonify({"status": "saved", "profile": profile})


@app.route("/api/profile/switch", methods=["POST"])
def api_profile_switch():
    """Switch to another saved family profile."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "")
    all_profiles = session.get("all_profiles", {})
    if name not in all_profiles:
        return jsonify({"error": "Profile not found."}), 404
    session["profile"] = all_profiles[name]
    # Clear chat history when switching profile
    session.pop("chat_history", None)
    session.modified = True
    return jsonify({"status": "switched", "profile": all_profiles[name]})


@app.route("/api/profile/delete", methods=["POST"])
def api_profile_delete():
    """Delete a saved family profile."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "")
    all_profiles = session.get("all_profiles", {})
    if name in all_profiles:
        del all_profiles[name]
        session["all_profiles"] = all_profiles
        # If deleted profile was active, clear it
        if session.get("profile", {}).get("name") == name:
            session.pop("profile", None)
        session.modified = True
    return jsonify({"status": "deleted"})


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _build_dashboard_stats(profile: dict) -> dict:
    """Build dashboard statistics dict from the current user profile."""
    stats: dict = {}

    w = profile.get("weight_kg")
    h = profile.get("height_cm")
    if w and h:
        try:
            stats["bmi"] = calculate_bmi(float(w), float(h))
            stats["water"] = daily_water_litres(float(w),
                                                profile.get("activity_level", "moderate"))
            stats["ideal_weight"] = ideal_weight_range(float(h))
        except Exception:
            pass

    goal = profile.get("fitness_goal", "general")
    stats["weekly_minutes"] = recommended_weekly_minutes(goal)

    a = profile.get("age")
    g = profile.get("gender")
    act = profile.get("activity_level", "moderate")
    if w and h and a and g:
        try:
            stats["calories"] = estimate_daily_calories(
                float(w), float(h), int(a), str(g), str(act)
            )
        except Exception:
            pass

    return stats


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
