import React, { useState, useEffect } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

function App() {
  const [city, setCity] = useState("Chennai");
  const [search, setSearch] = useState("");

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [historicalData, setHistoricalData] = useState(null);

  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  
  const fetchWeather = async (cityName) => {
    if (!API_KEY) {
      setError("API key missing. Check your .env file.");
      return;
    }

    setLoading(true);
    setError("");
    setHistoryError("");
    setHistoricalData(null);

    try {
      const currentURL =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;

      const currentResponse = await fetch(currentURL);
      const currentData = await currentResponse.json();

      if (!currentResponse.ok) {
        throw new Error(currentData.message || "City not found");
      }

      const { lat, lon } = currentData.coord;

      const forecastURL =
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

      const forecastResponse = await fetch(forecastURL);
      const forecastData = await forecastResponse.json();

      if (!forecastResponse.ok) {
        throw new Error("Unable to fetch forecast");
      }

      setWeather(currentData);
      setForecast(forecastData.list);
      setCity(currentData.name);

    } catch (err) {
      setError(err.message);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  
  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      fetchWeather(search.trim());
      setSearch("");
    }
  };

  
  const fetchHistoricalWeather = async (e) => {
    e.preventDefault();

    if (!date) {
      setHistoryError("Please select a date.");
      return;
    }

    if (!weather) {
      setHistoryError("Search for a city first.");
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    setHistoricalData(null);

    try {
      const timestamp = Math.floor(
        new Date(`${date}T12:00:00`).getTime() / 1000
      );

      const { lat, lon } = weather.coord;

      const historyURL =
        `https://history.openweathermap.org/data/3.0/history/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${API_KEY}`;

      const response = await fetch(historyURL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Historical data unavailable."
        );
      }

      const result = data.data?.[0] || data.current;

      if (!result) {
        throw new Error("No historical data found.");
      }

      setHistoricalData(result);

    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  
  useEffect(() => {
    fetchWeather("Chennai");
  }, []);

  return (
    <div className="app-container">

      
      <header className="app-header">
        <h1>Weather Dashboard</h1>
        <p>Real-Time Weather Forecast Application</p>
      </header>

      
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter city name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      
      {error && (
        <p className="error-message">{error}</p>
      )}

      
      {loading && (
        <p className="loading-message">
          Fetching weather information...
        </p>
      )}

      
      {!loading && weather && (
        <>
          <section className="current-weather">
            <h2>Current Weather</h2>

            <h3>
              {weather.name}, {weather.sys.country}
            </h3>

            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt="Weather"
            />

            <h1>{Math.round(weather.main.temp)}°C</h1>

            <p className="description">
              {weather.weather[0].description}
            </p>

            <div className="weather-details">

              <div>
                <span>Feels Like</span>
                <strong>
                  {Math.round(weather.main.feels_like)}°C
                </strong>
              </div>

              <div>
                <span>Humidity</span>
                <strong>{weather.main.humidity}%</strong>
              </div>

              <div>
                <span>Wind Speed</span>
                <strong>{weather.wind.speed} m/s</strong>
              </div>

              <div>
                <span>Pressure</span>
                <strong>{weather.main.pressure} hPa</strong>
              </div>

            </div>
          </section>

          
          <section className="forecast-section">
            <h2>Upcoming Weather Forecast</h2>

            <div className="forecast-container">

              {forecast.slice(0, 5).map((item, index) => (
                <div className="weather-card" key={item.dt}>

                  <h4>
                    {new Date(
                      item.dt * 1000
                    ).toLocaleDateString("en-IN")}
                  </h4>

                  <p>
                    {new Date(
                      item.dt * 1000
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>

                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                    alt="Weather"
                  />

                  <h3>
                    {Math.round(item.main.temp)}°C
                  </h3>

                  <p>{item.weather[0].description}</p>

                  <p>
                    Humidity: {item.main.humidity}%
                  </p>

                </div>
              ))}

            </div>
          </section>

        
          <section className="historical-section">

            <h2>Historical Weather</h2>

            <form
              className="history-form"
              onSubmit={fetchHistoricalWeather}
            >

              <input
                type="date"
                value={date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />

              <button
                type="submit"
                disabled={historyLoading || !date}
              >
                {historyLoading ? "Loading..." : "Check History"}
              </button>

            </form>

            {historyError && (
              <p className="error-message">
                {historyError}
              </p>
            )}

            {historicalData && (
              <div className="history-result">

                <h3>
                  Historical Weather on{" "}
                  {new Date(
                    historicalData.dt * 1000
                  ).toLocaleDateString()}
                </h3>

                <h1>
                  {Math.round(historicalData.main.temp)}°C
                </h1>

                <p>
                  {historicalData.weather?.[0]?.description}
                </p>

                <p>
                  Humidity: {historicalData.main.humidity}%
                </p>

                <p>
                  Wind Speed: {historicalData.wind?.speed ?? "N/A"} m/s
                </p>

              </div>
            )}

          </section>
        </>
      )}

      
      <footer>
        <p>
          Weather Dashboard | Powered by OpenWeatherMap
        </p>
      </footer>

    </div>
  );
}

export default App;