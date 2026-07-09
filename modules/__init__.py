# Fitness Buddy – modules package
from .watsonx_client import generate_response
from .fitness_utils import (
    calculate_bmi, estimate_daily_calories, ideal_weight_range,
    daily_water_litres, recommended_weekly_minutes, build_user_profile_summary,
)
