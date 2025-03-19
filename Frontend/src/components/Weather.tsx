import React from 'react';

// Mock weather data - would be replaced with real API data in production
const mockWeather = {
  location: 'Berlin',
  current: {
    temp: 12,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 8,
    icon: '🌤️',
  },
  forecast: [
    { day: 'Today', high: 12, low: 5, condition: '🌤️' },
    { day: 'Tomorrow', high: 14, low: 6, condition: '☀️' },
    { day: 'Wed', high: 10, low: 4, condition: '🌧️' },
  ],
};

const Weather = () => {
  return (
    <div className="dashboard-panel weather-panel">
      <h2>Weather</h2>
      <div className="current-weather">
        <div className="weather-location">{mockWeather.location}</div>
        <div className="weather-main">
          <span className="weather-icon">{mockWeather.current.icon}</span>
          <span className="weather-temp">{mockWeather.current.temp}°C</span>
        </div>
        <div className="weather-condition">{mockWeather.current.condition}</div>
        <div className="weather-details">
          <div>Humidity: {mockWeather.current.humidity}%</div>
          <div>Wind: {mockWeather.current.windSpeed} km/h</div>
        </div>
      </div>
      
      <div className="weather-forecast">
        {mockWeather.forecast.map((day, index) => (
          <div key={index} className="forecast-day">
            <div className="forecast-name">{day.day}</div>
            <div className="forecast-icon">{day.condition}</div>
            <div className="forecast-temp">
              <span className="high">{day.high}°</span>
              <span className="low">{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;