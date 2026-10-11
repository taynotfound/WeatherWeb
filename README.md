# Tomato 🍅

Weather with attitude. Material 3 UI whose color scheme is generated live from the sky.

- **6 weather sources, cross-checked**: Open-Meteo, MET Norway, WeatherAPI.com, plus ECMWF / NOAA GFS / DWD ICON models. Current conditions are the median; the Source check card shows who agrees.
- **Material 3 dynamic color**: the whole palette re-seeds from the current conditions (clear, rain, snow, storm, golden hour, night), light/dark/auto.
- **Today / Forecast / Radar / Air / Sky** tabs: hourly + 10-day, model-confidence, rain nowcast, RainViewer radar + satellite, temp/wind/cloud map layers, AQI, pollen, UV, alerts (NWS, Meteoalarm, WeatherAPI), moon, planets, ISS, meteor showers.
- **Tomato**: AI chat + daily summary (OpenRouter, falls back to a keyless provider, then to offline quips). Three attitudes: mild, rude, feral.

## Setup

```bash
npm install
cp .env.example .env   # then fill in keys
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `WEATHER_API` | [WeatherAPI.com](https://www.weatherapi.com/) key (extra source, alerts, AQI). Optional but recommended. |
| `AI_KEY` | OpenRouter key (`sk-or-…`) for Tomato. Optional; without it a keyless provider is used. |

Everything else is keyless.
