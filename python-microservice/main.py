# python-microservice/main.py

from fastapi import FastAPI, Query, HTTPException
from datetime import datetime, timedelta
from skyfield.api import load, Topos
from skyfield.almanac import risings_and_settings, find_discrete, sunrise_sunset
from fastapi.responses import JSONResponse

app = FastAPI(title="Celestial Calculation Microservice")

# Load ephemeris and timescale (using de421 as a starting point)
eph = load('de421.bsp')
ts = load.timescale()

@app.get("/calculate")
async def calculate_celestial(
    lat: float = Query(..., description="Latitude in degrees"),
    lon: float = Query(..., description="Longitude in degrees"),
    time: datetime = Query(..., description="ISO formatted datetime")
):
    try:
        # Convert input time to Skyfield time
        t = ts.utc(time.year, time.month, time.day, time.hour, time.minute, time.second)
        
        # Define observer location
        observer = Topos(latitude_degrees=lat, longitude_degrees=lon)
        
        # Define night boundaries (for example, night starts at 20:00 local time and lasts 8 hours)
        night_start_dt = datetime(time.year, time.month, time.day, 20, 0, 0)
        night_end_dt = night_start_dt + timedelta(hours=8)
        night_start = ts.utc(night_start_dt.year, night_start_dt.month, night_start_dt.day,
                             night_start_dt.hour, night_start_dt.minute, night_start_dt.second)
        night_end = ts.utc(night_end_dt.year, night_end_dt.month, night_end_dt.day,
                           night_end_dt.hour, night_end_dt.minute, night_end_dt.second)
        
        # Create a list of sample times (hourly from night start to night end)
        num_samples = 9  # 0 to 8 hours (inclusive)
        sample_times = [ts.utc(night_start_dt.year, night_start_dt.month, night_start_dt.day,
                               night_start_dt.hour + i) for i in range(num_samples)]
        
        # Define the celestial bodies to calculate (all planets and the Moon)
        bodies = {
            "Mercury": eph["mercury"],
            "Venus": eph["venus"],
            "Mars": eph["mars"],
            "Jupiter": eph["jupiter barycenter"],
            "Saturn": eph["saturn barycenter"],
            "Uranus": eph["uranus barycenter"],
            "Neptune": eph["neptune barycenter"],
            "Moon": eph["moon"],
        }
        
        objects_result = []
        for name, body in bodies.items():
            # Compute current position at time t
            astrometric = (eph["earth"] + observer).at(t).observe(body)
            alt, az, _ = astrometric.apparent().altaz()
            current_alt = alt.degrees
            current_az = az.degrees
            
            # Compute hourly data for the object
            hourly_data = []
            for t_sample in sample_times:
                ast_sample = (eph["earth"] + observer).at(t_sample).observe(body)
                alt_sample, az_sample, _ = ast_sample.apparent().altaz()
                hourly_data.append({
                    "time": t_sample.utc_iso(),
                    "altitude": alt_sample.degrees,
                    "azimuth": az_sample.degrees
                })
            
            # Determine best viewing time (when altitude is highest)
            best_viewing = max(hourly_data, key=lambda d: d["altitude"])
            
            # Calculate rise and set times for the object between night_start and night_end
            try:
                f = risings_and_settings(eph, body, observer)
                times, events = find_discrete(night_start, night_end, f)
                rise_time = None
                set_time = None
                # Interpretation: Typically, event True (or 1) indicates the object is above the horizon (rising),
                # and False (or 0) when it's below (setting). Adjust based on observed behavior.
                for t_event, event in zip(times, events):
                    if event and rise_time is None:
                        rise_time = t_event.utc_iso()
                    elif not event and set_time is None:
                        set_time = t_event.utc_iso()
            except Exception:
                rise_time = None
                set_time = None
            
            obj_data = {
                "name": name,
                "hourlyData": hourly_data,
                "additionalInfo": {
                    "bestViewingTime": best_viewing["time"],
                    "riseTime": rise_time,
                    "setTime": set_time,
                },
                "type": "Planet" if name != "Moon" else "Moon"
            }
            objects_result.append(obj_data)
        
        # Compute sunrise and sunset for the observer's day using sunrise_sunset
        f_sun = sunrise_sunset(eph, observer)
        t0_day = ts.utc(time.year, time.month, time.day, 0, 0, 0)
        t1_day = ts.utc(time.year, time.month, time.day, 23, 59, 59)
        times_sun, events_sun = find_discrete(t0_day, t1_day, f_sun)
        sunrise = None
        sunset = None
        for t_event, event in zip(times_sun, events_sun):
            # Convention: event == 1 means sunrise, event == 0 means sunset
            if event == 1 and sunrise is None:
                sunrise = t_event.utc_iso()
            elif event == 0 and sunset is None:
                sunset = t_event.utc_iso()
        
        result = {
            "objects": objects_result,
            "nightStart": night_start.utc_iso(),
            "nightEnd": night_end.utc_iso(),
            "weather": {
                "currentCloudCover": 20,  # Placeholder value; integrate real weather data later
                "lightPollution": 4,       # Placeholder value
                "hourlyForecast": []       # Placeholder; integrate real forecast data as needed
            },
            "location": {
                "latitude": lat,
                "longitude": lon
            },
            "sunrise": sunrise,
            "sunset": sunset
        }
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
