from fastapi import FastAPI, Query, HTTPException
from datetime import datetime, timedelta
from skyfield.api import load, Topos
from skyfield.almanac import (
    risings_and_settings,
    find_discrete,
    sunrise_sunset,
    dark_twilight_day,
    moon_phases,
)
from fastapi.responses import JSONResponse

app = FastAPI(title="Celestial Calculation Microservice")

# ── Load timescale and high‑precision ephemeris ───────────────
ts  = load.timescale()
eph = load('de440s.bsp')    # ← make sure this file lives next to main.py
# ────────────────────────────────────────────────────────────

@app.get("/calculate")
async def calculate_celestial(
    lat: float   = Query(..., description="Latitude in degrees"),
    lon: float   = Query(..., description="Longitude in degrees"),
    time: datetime = Query(..., description="ISO formatted datetime")
):
    try:
        # Convert input to Skyfield Time
        t = ts.utc(
            time.year, time.month, time.day,
            time.hour, time.minute, time.second
        )

        # Observer location
        observer = Topos(latitude_degrees=lat, longitude_degrees=lon)

        # Define “night” window (20:00 local → +8 hours)
        night_start_dt = datetime(time.year, time.month, time.day, 20, 0, 0)
        night_end_dt   = night_start_dt + timedelta(hours=8)
        night_start = ts.utc(
            night_start_dt.year, night_start_dt.month, night_start_dt.day,
            night_start_dt.hour, night_start_dt.minute, night_start_dt.second
        )
        night_end = ts.utc(
            night_end_dt.year, night_end_dt.month, night_end_dt.day,
            night_end_dt.hour, night_end_dt.minute, night_end_dt.second
        )

        # Hourly samples through the night
        sample_times = [
            ts.utc(night_start_dt.year, night_start_dt.month, night_start_dt.day,
                   night_start_dt.hour + i)
            for i in range(9)  # 0h … 8h
        ]

        # Bodies: planets + Moon
        bodies = {
            "Mercury": eph["mercury"],
            "Venus":   eph["venus"],
            "Mars":    eph["mars"],
            "Jupiter": eph["jupiter barycenter"],
            "Saturn":  eph["saturn barycenter"],
            "Uranus":  eph["uranus barycenter"],
            "Neptune": eph["neptune barycenter"],
            "Moon":    eph["moon"],
        }

        objects_result = []
        for name, body in bodies.items():
            # Current position
            astro = (eph["earth"] + observer).at(t).observe(body)
            alt, az, _ = astro.apparent().altaz()

            # Hourly track
            hourly_data = []
            for tsamp in sample_times:
                astr = (eph["earth"] + observer).at(tsamp).observe(body)
                a, z, _ = astr.apparent().altaz()
                hourly_data.append({
                    "time":     tsamp.utc_iso(),
                    "altitude": a.degrees,
                    "azimuth":  z.degrees,
                })

            # Best viewing = max altitude
            best_view = max(hourly_data, key=lambda d: d["altitude"])["time"]

            # Rise & set between night_start/night_end
            try:
                f_rs      = risings_and_settings(eph, body, observer)
                times_rs, events_rs = find_discrete(night_start, night_end, f_rs)
                rise_time = next((tt.utc_iso() for tt, ev in zip(times_rs, events_rs) if ev), None)
                set_time  = next((tt.utc_iso() for tt, ev in zip(times_rs, events_rs) if not ev), None)
            except:
                rise_time = None
                set_time  = None

            objects_result.append({
                "name": name,
                "hourlyData":     hourly_data,
                "additionalInfo": {
                    "bestViewingTime": best_view,
                    "riseTime":        rise_time,
                    "setTime":         set_time,
                },
                "type": "Moon" if name == "Moon" else "Planet",
            })

        # Sunrise & sunset for the calendar day
        f_sun = sunrise_sunset(eph, observer)
        t0 = ts.utc(time.year, time.month, time.day, 0,  0,  0)
        t1 = ts.utc(time.year, time.month, time.day, 23, 59, 59)
        times_sun, events_sun = find_discrete(t0, t1, f_sun)
        sunrise = next((tt.utc_iso() for tt, ev in zip(times_sun, events_sun) if ev == 1), None)
        sunset  = next((tt.utc_iso() for tt, ev in zip(times_sun, events_sun) if ev == 0), None)

        # ── New: Twilight boundaries (0=day → 3=astronomical night) ──
        times_tw, states_tw = find_discrete(
            night_start, night_end,
            dark_twilight_day(eph, observer)
        )
        twilight = [
            {"time": tt.utc_iso(), "state": int(st)}
            for tt, st in zip(times_tw, states_tw)
        ]

        # ── New: Moon phase angle (0° = new, 180° = full) ───────────
        moon_phase_angle = float(moon_phases(eph, t))

        return {
            "objects":       objects_result,
            "nightStart":    night_start.utc_iso(),
            "nightEnd":      night_end.utc_iso(),
            "weather": {
                "currentCloudCover": 20,  # placeholder until real API wired
                "lightPollution":    4,   # placeholder
                "hourlyForecast":    []
            },
            "location": {"latitude": lat, "longitude": lon},
            "sunrise":        sunrise,
            "sunset":         sunset,
            "twilight":       twilight,
            "moonPhaseAngle": moon_phase_angle,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
