#!/usr/bin/env python3
"""
Weather-Triggered Marketing System for Your Business Name
Monroe, LA (32.5093, -92.1193)

Checks weather conditions via Open-Meteo API and auto-generates
marketing posts into Supabase cc_posts table when trigger thresholds hit.

Triggers:
  - Storm/severe: wind > 40 mph, WMO severe codes
  - Heavy rain: > 1 inch in 24 hrs
  - Freeze warning: temp < 32F
  - Extreme heat: temp > 95F

Run periodically (e.g. every 2-4 hours via cron).
"""

import json
import os
import sys
import random
import hashlib
from datetime import datetime, timezone, timedelta
from urllib.request import Request, urlopen
from urllib.error import URLError

# ─── Configuration ────────────────────────────────────────────────────────────

LAT = 32.5093
LON = -92.1193

SUPABASE_URL = "process.env.NEXT_PUBLIC_SUPABASE_URL"
SUPABASE_KEY = (
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbXdmZWVldmtvcWZtdWlqanVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc3NTY1MSwiZXhwIjoyMDg0MzUxNjUxfQ."
    "VcK7aoj3NTgA2SFlf0_Gm2Z39fK-g8Er5YxuPpo_UVw"
)

PLATFORMS = ["facebook", "instagram", "x", "nextdoor"]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TRIGGER_LOG = os.path.join(SCRIPT_DIR, "weather-triggers-log.json")

# How many hours before the same trigger type can fire again
COOLDOWN_HOURS = 24

# WMO weather codes that indicate severe/storm conditions
# 95-99 = thunderstorm w/ hail, 85-86 = snow showers, 71-77 = snow/ice,
# 55/65/67 = heavy drizzle/rain/freezing rain
SEVERE_WMO_CODES = {95, 96, 99}  # thunderstorm, thunderstorm + hail
STORM_WMO_CODES = {95, 96, 99, 85, 86}

# ─── Post Templates ──────────────────────────────────────────────────────────

STORM_TEMPLATES = [
    (
        "Monroe and West Monroe -- if the storm left damage in your yard, "
        "Your Business Name has our full team ready for cleanup. "
        "Fallen branches, downed limbs, debris everywhere -- we handle it all "
        "so you don't have to. Reach out today at www.yourbusiness.com"
    ),
    (
        "After last night's storm, yards across Monroe and West Monroe are a mess. "
        "Your Business Name is already scheduling storm cleanup. "
        "Our established team can get your property back in shape fast. "
        "Visit www.yourbusiness.com or give us a call."
    ),
    (
        "Storm damage does not fix itself. If you are in Monroe or West Monroe "
        "and need trees cleared, debris hauled, or your yard put back together, "
        "Your Business Name is here for you. We have multiple crews "
        "ready to help. www.yourbusiness.com"
    ),
]

RAIN_TEMPLATES = [
    (
        "All that rain hitting Monroe and West Monroe has to go somewhere. "
        "If your yard is holding water, you have got a drainage problem -- not "
        "just a wet week. Your Business Name can assess your property "
        "and fix the issue before it gets worse. www.yourbusiness.com"
    ),
    (
        "Standing water in your yard after heavy rain is not normal. It means "
        "something needs attention. Your Business Name helps homeowners "
        "across Monroe and West Monroe solve drainage issues the right way. "
        "Let us take a look. www.yourbusiness.com"
    ),
    (
        "Another round of heavy rain across Monroe and West Monroe. If your lawn "
        "looks more like a pond right now, Your Business Name can help "
        "with grading, drainage solutions, and cleanup. Our established team "
        "handles it all. www.yourbusiness.com"
    ),
]

FREEZE_TEMPLATES = [
    (
        "Freeze warnings are no joke for your property. If you are in Monroe "
        "or West Monroe and dealing with damage from the cold -- busted pipes, "
        "broken branches, ice damage -- Your Business Name is ready "
        "to help with the outdoor cleanup. www.yourbusiness.com"
    ),
    (
        "When temperatures drop below freezing in Monroe and West Monroe, your "
        "landscaping takes a hit. Dead plants, cracked branches, and yard damage "
        "add up fast. Your Business Name has an established team ready "
        "to get your property cleaned up. www.yourbusiness.com"
    ),
    (
        "Cold snap hitting Monroe and West Monroe hard. If the freeze left your "
        "yard looking rough, Your Business Name can handle the cleanup. "
        "We have multiple crews and we are ready to work. "
        "Reach out at www.yourbusiness.com"
    ),
]

HEAT_TEMPLATES = [
    (
        "This heat is brutal on lawns across Monroe and West Monroe. If your "
        "grass is turning brown and your yard is struggling, Your Business "
        "Outdoor Services can help you keep it alive. Proper mowing height, "
        "care schedules, and real expertise. www.yourbusiness.com"
    ),
    (
        "Triple-digit heat does not care about your lawn, but we do. College "
        "Bros Outdoor Services helps homeowners across Monroe and West Monroe "
        "protect their yards during the worst of summer. Our full team knows "
        "how to keep your property looking good even in this heat. "
        "www.yourbusiness.com"
    ),
    (
        "Your lawn needs help right now. When it is this hot in Monroe and "
        "West Monroe, the wrong mowing schedule or cut height can kill your "
        "grass fast. Your Business Name knows what your yard needs "
        "to survive the summer. Let us handle it. www.yourbusiness.com"
    ),
]

TEMPLATES = {
    "storm": STORM_TEMPLATES,
    "heavy_rain": RAIN_TEMPLATES,
    "freeze": FREEZE_TEMPLATES,
    "extreme_heat": HEAT_TEMPLATES,
}

TAG_MAP = {
    "storm": ["weather", "storm-cleanup", "monroe-la"],
    "heavy_rain": ["weather", "drainage", "rain", "monroe-la"],
    "freeze": ["weather", "freeze", "cleanup", "monroe-la"],
    "extreme_heat": ["weather", "heat", "lawn-care", "monroe-la"],
}

NOTE_MAP = {
    "storm": "Auto-generated: storm/severe weather trigger",
    "heavy_rain": "Auto-generated: heavy rain trigger",
    "freeze": "Auto-generated: freeze warning trigger",
    "extreme_heat": "Auto-generated: extreme heat trigger",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


def fetch_json(url: str) -> dict:
    """Fetch JSON from a URL using only stdlib."""
    req = Request(url, headers={"User-Agent": "YourBrandWeatherBot/1.0"})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def load_trigger_log() -> dict:
    """Load the trigger log (tracks last fire time per trigger type)."""
    if os.path.exists(TRIGGER_LOG):
        with open(TRIGGER_LOG, "r") as f:
            return json.load(f)
    return {}


def save_trigger_log(data: dict):
    with open(TRIGGER_LOG, "w") as f:
        json.dump(data, f, indent=2)


def trigger_key(trigger_type: str, date_str: str) -> str:
    """Unique key for a trigger event so we don't spam the same one."""
    return f"{trigger_type}:{date_str}"


def is_on_cooldown(tlog: dict, trigger_type: str) -> bool:
    """Check if this trigger type has fired recently."""
    key_prefix = f"{trigger_type}:"
    now = datetime.now(timezone.utc)
    for key, ts_str in tlog.items():
        if key.startswith(key_prefix):
            fired_at = datetime.fromisoformat(ts_str)
            if (now - fired_at).total_seconds() < COOLDOWN_HOURS * 3600:
                return True
    return False


def mark_fired(tlog: dict, trigger_type: str) -> dict:
    """Record that a trigger just fired."""
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = trigger_key(trigger_type, date_str)
    tlog[key] = datetime.now(timezone.utc).isoformat()
    # Prune entries older than 7 days
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    pruned = {}
    for k, v in tlog.items():
        try:
            if datetime.fromisoformat(v) > cutoff:
                pruned[k] = v
        except Exception:
            pass
    return pruned


def pick_template(trigger_type: str) -> str:
    """Pick a random template for the trigger type."""
    return random.choice(TEMPLATES[trigger_type])


def insert_post(content: str, trigger_type: str) -> dict:
    """Insert a post into Supabase cc_posts with status pending_review."""
    url = f"{SUPABASE_URL}/rest/v1/cc_posts"
    scheduled = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    payload = {
        "content": content,
        "platforms": PLATFORMS,
        "scheduled_at": scheduled,
        "status": "draft",
        "photo_urls": [],
        "posted_ids": {},
        "tags": TAG_MAP.get(trigger_type, ["weather"]),
        "notes": NOTE_MAP.get(trigger_type, "Auto-generated: weather trigger")
                 + " -- NEEDS REVIEW before posting",
    }

    data = json.dumps(payload).encode()
    req = Request(url, data=data, method="POST")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")

    with urlopen(req, timeout=30) as resp:
        body = resp.read().decode()
        status = resp.status
        log(f"Supabase insert status: {status}")
        return json.loads(body)


# ─── Weather Fetch ────────────────────────────────────────────────────────────


def fetch_weather() -> dict:
    """
    Fetch current + forecast weather from Open-Meteo.
    Returns parsed JSON with current conditions and daily forecast.
    """
    params = (
        f"latitude={LAT}&longitude={LON}"
        "&current=temperature_2m,wind_speed_10m,weather_code,precipitation"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
        "wind_speed_10m_max,weather_code"
        "&temperature_unit=fahrenheit"
        "&wind_speed_unit=mph"
        "&precipitation_unit=inch"
        "&timezone=America%2FChicago"
        "&forecast_days=2"
    )
    url = f"https://api.open-meteo.com/v1/forecast?{params}"
    log(f"Fetching weather from Open-Meteo...")
    data = fetch_json(url)
    return data


# ─── Trigger Detection ───────────────────────────────────────────────────────


def detect_triggers(weather: dict) -> list[str]:
    """
    Analyze weather data and return list of trigger types that are active.
    """
    triggers = []
    current = weather.get("current", {})
    daily = weather.get("daily", {})

    # Current conditions
    curr_temp = current.get("temperature_2m")
    curr_wind = current.get("wind_speed_10m")
    curr_code = current.get("weather_code")
    curr_precip = current.get("precipitation", 0)

    log(f"Current: temp={curr_temp}F, wind={curr_wind}mph, "
        f"code={curr_code}, precip={curr_precip}in")

    # Daily forecast (today = index 0)
    daily_precip = daily.get("precipitation_sum", [0])[0] if daily.get("precipitation_sum") else 0
    daily_wind_max = daily.get("wind_speed_10m_max", [0])[0] if daily.get("wind_speed_10m_max") else 0
    daily_temp_max = daily.get("temperature_2m_max", [0])[0] if daily.get("temperature_2m_max") else 0
    daily_temp_min = daily.get("temperature_2m_min", [0])[0] if daily.get("temperature_2m_min") else 0
    daily_code = daily.get("weather_code", [0])[0] if daily.get("weather_code") else 0

    log(f"Today forecast: high={daily_temp_max}F, low={daily_temp_min}F, "
        f"precip={daily_precip}in, wind_max={daily_wind_max}mph, code={daily_code}")

    # 1. Storm / Severe Weather
    is_storm = False
    if curr_wind is not None and curr_wind > 40:
        log("TRIGGER: Wind exceeds 40 mph (current)")
        is_storm = True
    if daily_wind_max > 40:
        log("TRIGGER: Wind exceeds 40 mph (daily max)")
        is_storm = True
    if curr_code in SEVERE_WMO_CODES or daily_code in SEVERE_WMO_CODES:
        log(f"TRIGGER: Severe WMO weather code detected (current={curr_code}, daily={daily_code})")
        is_storm = True
    if is_storm:
        triggers.append("storm")

    # 2. Heavy Rain (> 1 inch in 24 hrs)
    if daily_precip > 1.0:
        log(f"TRIGGER: Heavy rain -- {daily_precip} inches today")
        triggers.append("heavy_rain")

    # 3. Freeze Warning (temp < 32F)
    freeze = False
    if curr_temp is not None and curr_temp < 32:
        log(f"TRIGGER: Current temp {curr_temp}F below freezing")
        freeze = True
    if daily_temp_min < 32:
        log(f"TRIGGER: Daily low {daily_temp_min}F below freezing")
        freeze = True
    if freeze:
        triggers.append("freeze")

    # 4. Extreme Heat (temp > 95F)
    heat = False
    if curr_temp is not None and curr_temp > 95:
        log(f"TRIGGER: Current temp {curr_temp}F exceeds 95F")
        heat = True
    if daily_temp_max > 95:
        log(f"TRIGGER: Daily high {daily_temp_max}F exceeds 95F")
        heat = True
    if heat:
        triggers.append("extreme_heat")

    return triggers


# ─── Main ─────────────────────────────────────────────────────────────────────


def main():
    log("=" * 60)
    log("Your Business Weather Trigger System - Starting")
    log("=" * 60)

    # Load trigger log
    tlog = load_trigger_log()

    # Fetch weather
    try:
        weather = fetch_weather()
    except (URLError, Exception) as e:
        log(f"ERROR fetching weather: {e}")
        sys.exit(1)

    # Detect triggers
    triggers = detect_triggers(weather)

    if not triggers:
        log("No weather triggers active. All clear.")
        save_trigger_log(tlog)
        return

    log(f"Active triggers: {triggers}")

    # Process each trigger
    posts_created = 0
    for trigger_type in triggers:
        if is_on_cooldown(tlog, trigger_type):
            log(f"SKIP: '{trigger_type}' is on cooldown (fired within last {COOLDOWN_HOURS}h)")
            continue

        # Pick a template and insert
        content = pick_template(trigger_type)
        log(f"Creating post for trigger '{trigger_type}'...")
        log(f"Content preview: {content[:80]}...")

        try:
            result = insert_post(content, trigger_type)
            log(f"Post inserted successfully: {json.dumps(result, indent=2)[:200]}")
            tlog = mark_fired(tlog, trigger_type)
            posts_created += 1
        except Exception as e:
            log(f"ERROR inserting post for '{trigger_type}': {e}")

    save_trigger_log(tlog)
    log(f"Done. Created {posts_created} post(s).")


if __name__ == "__main__":
    main()
