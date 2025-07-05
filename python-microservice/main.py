import os
import logging
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, timezone
from functools import lru_cache, wraps
from skyfield.api import load, Topos
from skyfield.almanac import (
    risings_and_settings,
    find_discrete,
    sunrise_sunset,
    dark_twilight_day,
    moon_phase,
)

# ── Configure logging ───────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

def log_lru(func):
    """Log whether an lru_cache call was a HIT or MISS."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        before = func.cache_info()
        result = func(*args, **kwargs)
        after = func.cache_info()
        tag = "HIT" if after.hits > before.hits else "MISS"
        logging.info(f"[cache {tag}] {func.__name__}{args}")
        return result
    return wrapper

app = FastAPI(title="Celestial Calculation Microservice")

# ── Verify ephemeris file ───────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
BSP_PATH = os.path.join(BASE_DIR, "de440s.bsp")
if not os.path.exists(BSP_PATH):
    logging.error(f"Missing ephemeris at {BSP_PATH}")
    raise RuntimeError("Place de440s.bsp next to main.py")
# ────────────────────────────────────────────────────────────

# ── Load Skyfield ───────────────────────────────────────────
ts  = load.timescale()
eph = load(BSP_PATH)
# ────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    logging.info(f"Loaded ephemeris: {BSP_PATH}")
    logging.info(f"Available bodies: {eph.names()}")

@log_lru
@lru_cache(maxsize=128)
def compute_objects(lat: float, lon: float, iso_time: str):
    """
    Returns:
      - hourlySeries: list of {time, altitude, azimuth} sampled each hour of true night
      - riseTime:      last rise ≤ query time
      - setTime:       next set ≥ query time
      - bestViewingTime: max altitude in the sampled series
    """
    # Parse inputs into UTC-aware datetime
    dt_query = datetime.fromisoformat(iso_time).replace(tzinfo=timezone.utc)
    observer = Topos(latitude_degrees=lat, longitude_degrees=lon)
    t_query  = ts.utc(
        dt_query.year, dt_query.month, dt_query.day,
        dt_query.hour, dt_query.minute, dt_query.second
    )

    # 1) Full-day window (UTC midnight → next midnight)
    start_day = ts.utc(dt_query.year, dt_query.month, dt_query.day, 0, 0, 0)
    end_day   = ts.utc(dt_query.year, dt_query.month, dt_query.day + 1, 0, 0, 0)

    # 2) Determine true night via astronomical twilight
    f_tw = dark_twilight_day(eph, observer)
    times_tw, states_tw = find_discrete(start_day, end_day, f_tw)
    night_starts = [t for t, s in zip(times_tw, states_tw) if s == 0]
    night_ends   = [t for t, s in zip(times_tw, states_tw) if s != 0 and t > night_starts[0]]
    if night_starts and night_ends:
        ns, ne = night_starts[0], night_ends[0]
    else:
        ns, ne = start_day, end_day  # fallback

    # 3) Build hourly sample times between ns and ne
    dt_ns = ns.utc_datetime()
    dt_ne = ne.utc_datetime()
    hours = int((dt_ne - dt_ns).total_seconds() // 3600)
    sample_times = [
        ts.utc(*(dt_ns + timedelta(hours=i)).timetuple()[:6])
        for i in range(hours + 1)
    ]

    # 4) Compute altitude/azimuth series and best viewing
    bodies = {
        "Mercury": eph["mercury"],
        "Venus":   eph["venus"],
        "Mars":    eph["mars barycenter"],
        "Jupiter": eph["jupiter barycenter"],
        "Saturn":  eph["saturn barycenter"],
        "Uranus":  eph["uranus barycenter"],
        "Neptune": eph["neptune barycenter"],
        "Moon":    eph["moon"],
    }
    results = []

    for name, body in bodies.items():
        # 4a) Hourly series for this body
        hourly_series = []
        for t_s in sample_times:
            astro = (eph["earth"] + observer).at(t_s).observe(body)
            alt, az, _ = astro.apparent().altaz()
            hourly_series.append({
                "time":     t_s.utc_iso(),
                "altitude": alt.degrees,
                "azimuth":  az.degrees,
            })

        best_time = max(hourly_series, key=lambda x: x["altitude"])["time"]

        # 5) Full-day rise/set events
        f_rs = risings_and_settings(eph, body, observer)
        times_rs, events_rs = find_discrete(start_day, end_day, f_rs)

        # Debug: log every rise/set event
        for t_e, is_rise in zip(times_rs, events_rs):
            logging.info(f"{name}: {'rise' if is_rise else 'set '} at {t_e.utc_iso()}")

        # 6) Pick last rise ≤ query time
        rises = [t for t, ev in zip(times_rs, events_rs) if ev]
        rises_before = [r for r in rises if r.utc_datetime() <= dt_query]
        rise_time = max(rises_before).utc_iso() if rises_before else None

        # 7) Pick next set ≥ query time
        sets = [t for t, ev in zip(times_rs, events_rs) if not ev]
        sets_after = [s for s in sets if s.utc_datetime() >= dt_query]
        set_time = min(sets_after).utc_iso() if sets_after else None

        results.append({
            "name":         name,
            "hourlySeries": hourly_series,
            "additionalInfo": {
                "bestViewingTime": best_time,
                "riseTime":        rise_time,
                "setTime":         set_time,
            },
            "type": "Moon" if name == "Moon" else "Planet",
        })

    return results

@log_lru
@lru_cache(maxsize=128)
def compute_twilight(lat: float, lon: float, iso_time: str):
    """Return sky-phase transitions (0–4) over the full day."""
    dt = datetime.fromisoformat(iso_time).replace(tzinfo=timezone.utc)
    obs = Topos(latitude_degrees=lat, longitude_degrees=lon)
    start = ts.utc(dt.year, dt.month, dt.day, 0, 0, 0)
    end   = ts.utc(dt.year, dt.month, dt.day + 1, 0, 0, 0)
    f_tw = dark_twilight_day(eph, obs)
    times, states = find_discrete(start, end, f_tw)
    return [{"time": t.utc_iso(), "state": int(s)} for t, s in zip(times, states)]

@log_lru
@lru_cache(maxsize=128)
def compute_moon_phase(lat: float, lon: float, iso_time: str):
    """Return the Moon's phase angle (degrees) at the given time."""
    dt = datetime.fromisoformat(iso_time).replace(tzinfo=timezone.utc)
    t  = ts.utc(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
    return moon_phase(eph, t).degrees

@app.get("/calculate")
async def calculate_celestial(
    lat: float     = Query(...),
    lon: float     = Query(...),
    time: datetime = Query(...)
):
    try:
        iso       = time.isoformat()
        objects   = compute_objects(lat, lon, iso)
        twilight  = compute_twilight(lat, lon, iso)
        moon_ang  = compute_moon_phase(lat, lon, iso)

        # sunrise/sunset (calendar day)
        obs = Topos(latitude_degrees=lat, longitude_degrees=lon)
        f_sun = sunrise_sunset(eph, obs)
        t0 = ts.utc(time.year, time.month, time.day, 0,  0,  0)
        t1 = ts.utc(time.year, time.month, time.day, 23, 59, 59)
        tsun, esun = find_discrete(t0, t1, f_sun)
        sunrise = next((t.utc_iso() for t, e in zip(tsun, esun) if e), None)
        sunset  = next((t.utc_iso() for t, e in zip(tsun, esun) if not e), None)

        return {
            "objects":        objects,
            "twilight":       twilight,
            "sunrise":        sunrise,
            "sunset":         sunset,
            "moonPhaseAngle": moon_ang,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
