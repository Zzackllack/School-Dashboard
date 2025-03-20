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
    <div className="bg-white rounded-lg shadow p-4 mb-4 text-center">
      <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Weather</h2>
      <div className="mb-4">
        <div className="text-lg font-bold">{mockWeather.location}</div>
        <div className="flex justify-center items-center my-2">
          <span className="text-5xl mr-4">{mockWeather.current.icon}</span>
          <span className="text-4xl font-bold">{mockWeather.current.temp}°C</span>
        </div>
        <div className="mb-2">{mockWeather.current.condition}</div>
        <div className="flex justify-around text-gray-600 text-sm">
          <div>Humidity: {mockWeather.current.humidity}%</div>
          <div>Wind: {mockWeather.current.windSpeed} km/h</div>
        </div>
      </div>
      
      <div className="flex justify-around border-t border-gray-200 pt-4">
        {mockWeather.forecast.map((day, index) => (
          <div key={index} className="text-center">
            <div className="font-medium">{day.day}</div>
            <div className="text-3xl my-2">{day.condition}</div>
            <div className="flex justify-center gap-2">
              <span className="font-bold">{day.high}°</span>
              <span className="text-gray-600">{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;