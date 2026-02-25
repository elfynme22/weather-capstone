// index.js
import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); // (POST kullanmasak da sorun değil)
app.use(express.static("public"));
app.set("view engine", "ejs");

// Home page
app.get("/", (req, res) => {
  res.render("index", { weather: null, error: null, lastCity: "" });
});

// ✅ GET endpoint (Capstone requirement)
app.get("/weather", async (req, res) => {
  const city = req.query.city;

  if (!city || city.trim().length < 2) {
    return res.render("index", {
      weather: null,
      error: "Please enter a valid city name.",
      lastCity: city ?? "",
    });
  }

  try {
    // 1) City -> coordinates
    const geoResponse = await axios.get(
      "https://geocoding-api.open-meteo.com/v1/search",
      {
        params: {
          name: city.trim(),
          count: 1,
          language: "en",
          format: "json",
        },
      }
    );

    const place = geoResponse.data?.results?.[0];
    if (!place) {
      return res.render("index", {
        weather: null,
        error: "City not found. Try another name.",
        lastCity: city.trim(),
      });
    }

    const { latitude, longitude, name, country } = place;

    // 2) Coordinates -> 7-day forecast
    const forecastResponse = await axios.get(
      "https://api.open-meteo.com/v1/forecast",
      {
        params: {
          latitude,
          longitude,
          daily:
            "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
          timezone: "auto",
          forecast_days: 7,
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
      return res.render("index", {
        weather: null,
        error: "Weather data is missing. Please try again.",
        lastCity: city.trim(),
      });
    }

    const forecast = daily.time.map((date, i) => ({
      date,
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      rainChance: daily.precipitation_probability_max[i],
    }));

    const tomorrow = forecast[1];
    if (!tomorrow) {
      return res.render("index", {
        weather: null,
        error: "Not enough forecast data for tomorrow.",
        lastCity: city.trim(),
      });
    }

    const summary =
      tomorrow.rainChance >= 50
        ? "Likely rain ☔"
        : tomorrow.rainChance >= 25
        ? "Maybe rain 🌦️"
        : "Probably dry 🌤️";

    return res.render("index", {
      error: null,
      lastCity: city.trim(),
      weather: {
        city: `${name}, ${country}`,
        date: tomorrow.date,
        tempMax: tomorrow.tempMax,
        tempMin: tomorrow.tempMin,
        rainChance: tomorrow.rainChance,
        summary,
        forecast,
      },
    });
  } catch (err) {
    console.error(err);
    return res.render("index", {
      weather: null,
      error: "Something went wrong while contacting the weather service.",
      lastCity: city?.trim?.() ?? "",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});