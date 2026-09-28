# Weather Dashboard

A responsive weather dashboard that fetches live weather data from the public Open-Meteo API.

## Features

- Search by city name
- Use browser geolocation for local weather
- Current conditions panel
- 7-day forecast
- Next 8 hours temperature view
- Mobile-friendly responsive design

## Run locally

Because this app uses a public API directly from the browser, there is no installation required.

1. Open `index.html` in a browser, or
2. Serve the project locally:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## API used

- Open-Meteo Geocoding API
- Open-Meteo Forecast API

These APIs are public and do not require an API key.
