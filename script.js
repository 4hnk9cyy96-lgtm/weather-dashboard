const DEFAULT_LOCATION = {
  name: "New York, USA",
  latitude: 40.7128,
  longitude: -74.006,
};

const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Moderate drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Heavy freezing drizzle", icon: "🌧️" },
  61: { label: "Slight rain", icon: "🌦️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌧️" },
  67: { label: "Heavy freezing rain", icon: "🌧️" },
  71: { label: "Slight snow", icon: "🌨️" },
  73: { label: "Moderate snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Heavy showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Heavy thunderstorm with hail", icon: "⛈️" },
};

const refs = {
  locationName: document.getElementById("location-name"),
  currentDate: document.getElementById("current-date"),
  currentTemp: document.getElementById("current-temp"),
  weatherCondition: document.getElementById("weather-condition"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  windSpeed: document.getElementById("wind-speed"),
  rainChance: document.getElementById("rain-chance"),
  sunrise: document.getElementById("sunrise"),
  weatherIcon: document.getElementById("weather-icon"),
  forecastList: document.getElementById("forecast-list"),
  hourlyList: document.getElementById("hourly-list"),
  searchForm: document.getElementById("search-form"),
  cityInput: document.getElementById("city-input"),
  useLocationBtn: document.getElementById("use-location-btn"),
};

async function fetchCoordinatesByCity(cityName) {
  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Could not find that city.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Could not find that city.");
  }

  const result = data.results[0];

  return {
    name: `${result.name}, ${result.country || result.admin1 || ""}`.replace(/,\s*$/, ""),
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function fetchWeatherByCoordinates(latitude, longitude, label) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m");
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather data is unavailable right now.");
  }

  const weather = await response.json();
  renderWeather(weather, label);
}

function renderWeather(data, label) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  const currentCode = WEATHER_CODES[current.weather_code] || WEATHER_CODES[0];
  const currentDate = new Date(current.time);

  refs.locationName.textContent = label;
  refs.currentDate.textContent = currentDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  refs.currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  refs.weatherCondition.textContent = currentCode.label;
  refs.feelsLike.textContent = `Feels like ${Math.round(current.apparent_temperature)}°`;
  refs.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  refs.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  refs.weatherIcon.textContent = currentCode.icon;

  const rainChance = hourly.precipitation_probability?.[0] ?? 0;
  refs.rainChance.textContent = `${Math.round(rainChance)}%`;

  const sunriseTime = daily.sunrise?.[0];
  refs.sunrise.textContent = sunriseTime ? formatTime(sunriseTime) : "--";

  refs.forecastList.innerHTML = daily.time
    .slice(0, 7)
    .map((day, index) => {
      const code = WEATHER_CODES[daily.weather_code[index]] || WEATHER_CODES[0];
      const min = Math.round(daily.temperature_2m_min[index]);
      const max = Math.round(daily.temperature_2m_max[index]);
      const date = new Date(day);

      return `
        <div class="forecast-item">
          <span class="day-chip">${date.toLocaleDateString(undefined, { weekday: "short" })}</span>
          <div class="forecast-meta">
            <span class="forecast-icon">${code.icon}</span>
            <span>${code.label}</span>
          </div>
          <span class="forecast-temps">${max}° / ${min}°</span>
        </div>
      `;
    })
    .join("");

  const nextHours = hourly.time.slice(0, 8);
  refs.hourlyList.innerHTML = nextHours
    .map((time, index) => {
      const code = WEATHER_CODES[hourly.weather_code[index]] || WEATHER_CODES[0];
      const temp = Math.round(hourly.temperature_2m[index]);
      const date = new Date(time);

      return `
        <div class="hourly-item">
          <span>${date.toLocaleTimeString(undefined, { hour: "numeric" })}</span>
          <strong>${temp}°</strong>
          <span>${code.icon}</span>
        </div>
      `;
    })
    .join("");
}

function formatTime(timeString) {
  const time = new Date(timeString);
  return time.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function loadWeatherForLocation(latitude, longitude, label) {
  try {
    await fetchWeatherByCoordinates(latitude, longitude, label);
  } catch (error) {
    alert(error.message);
  }
}

async function handleSearch(event) {
  event.preventDefault();
  const city = refs.cityInput.value.trim();

  if (!city) {
    return;
  }

  try {
    const result = await fetchCoordinatesByCity(city);
    await fetchWeatherByCoordinates(result.latitude, result.longitude, result.name);
  } catch (error) {
    alert(error.message);
  }
}

async function requestUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        const reverseEndpoint = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&limit=1&language=en&format=json`;
        const reverseResponse = await fetch(reverseEndpoint);
        const reverseData = await reverseResponse.json();

        const locationName = reverseData.results && reverseData.results[0]
          ? `${reverseData.results[0].name}, ${reverseData.results[0].country || reverseData.results[0].admin1 || ""}`.replace(/,\s*$/, "")
          : "My Location";

        await fetchWeatherByCoordinates(latitude, longitude, locationName);
      } catch (error) {
        alert("Could not load your location weather.");
      }
    },
    () => {
      alert("Location access was denied. Please use the search box instead.");
    }
  );
}

refs.searchForm.addEventListener("submit", handleSearch);
refs.useLocationBtn.addEventListener("click", requestUserLocation);

loadWeatherForLocation(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.name);
