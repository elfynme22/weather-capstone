// services/openMeteo.js
import axios from "axios";

export async function getCityCoordinates(city) {
  const geoResponse = await axios.get(
    "https://geocoding-api.open-meteo.com/v1/search",
    {
      params: { name: city, count: 1, language: "en", format: "json" },
    }
  );

  const place = geoResponse.data?.results?.[0];
  if (!place) return null;

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    country: place.country,
  };
}

export async function getDailyForecast(latitude, longitude, days = 7) {
  const forecastResponse = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude,
        longitude,
        daily:
          "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "auto",
        forecast_days: days,
      },
    }
  );

  const daily = forecastResponse.data?.daily;
  if (
    !daily?.time?.length ||
    !daily?.temperature_2m_max?.length ||
    !daily?.temperature_2m_min?.length ||
    !daily?.precipitation_probability_max?.length
  ) {
    return null;
  }

  // UI-friendly array
  return daily.time.map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    rainChance: daily.precipitation_probability_max[i],
  }));
}

export function getRainSummary(rainChance) {
  if (rainChance >= 50) return "Likely rain ☔";
  if (rainChance >= 25) return "Maybe rain 🌦️";
  return "Probably dry 🌤️";
}