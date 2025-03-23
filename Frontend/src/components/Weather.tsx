import React, { useState, useEffect } from 'react';

// Define TypeScript interfaces for Open Meteo API responses
interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  time: string;
}

interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relativehumidity_2m: number[];
  precipitation: number[];
  weathercode: number[];
}

interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weathercode: number[];
}

const Weather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // School coordinates - same as in Transportation.tsx
  const schoolLat = 52.43432378391319;
  const schoolLng = 13.305375391277634;

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${schoolLat}&longitude=${schoolLng}` +
          `&current_weather=true` +
          `&hourly=temperature_2m,relativehumidity_2m,precipitation,weathercode` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
          `&timezone=Europe/Berlin`
        );

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data: WeatherData = await response.json();
        console.log('Weather data:', data); // Debug log
        setWeatherData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        setError('Failed to load weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [schoolLat, schoolLng]);

  // Function to get weather icon based on weather code
  const getWeatherIcon = (code: number): string => {
    // WMO weather codes mapping to emojis: https://open-meteo.com/en/docs#:~:text=Code%20Description%200%20Clear%20sky,Slight%2C%20moderate%2C%20and%20heavy%20intensity
    switch (true) {
      case code === 0:
        return '☀️'; // Clear sky
      case code === 1:
        return '🌤️'; // Mainly clear
      case code === 2:
        return '⛅'; // Partly cloudy
      case code === 3:
        return '☁️'; // Overcast
      case [45, 48].includes(code):
        return '🌫️'; // Fog
      case [51, 53, 55].includes(code):
        return '🌦️'; // Drizzle
      case [61, 63, 65, 80, 81, 82].includes(code):
        return '🌧️'; // Rain
      case [71, 73, 75, 85, 86].includes(code):
        return '❄️'; // Snow
      case [95, 96, 99].includes(code):
        return '⛈️'; // Thunderstorm
      default:
        return '🌡️'; // Default/unknown
    }
  };

  // Function to get weather condition text based on weather code
  const getWeatherCondition = (code: number): string => {
    switch (true) {
      case code === 0:
        return 'Clear sky';
      case code === 1:
        return 'Mainly clear';
      case code === 2:
        return 'Partly cloudy';
      case code === 3:
        return 'Overcast';
      case [45, 48].includes(code):
        return 'Fog';
      case [51, 53, 55].includes(code):
        return 'Drizzle';
      case [61, 63, 65].includes(code):
        return 'Rain';
      case [80, 81, 82].includes(code):
        return 'Rain showers';
      case [71, 73, 75].includes(code):
        return 'Snow fall';
      case [85, 86].includes(code):
        return 'Snow showers';
      case [95, 96, 99].includes(code):
        return 'Thunderstorm';
      default:
        return 'Unknown';
    }
  };

  // Format date to day name (Today, Tomorrow, or day of week)
  const formatDay = (dateString: string, index: number): string => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Get current humidity from hourly data
  const getCurrentHumidity = (): number => {
    if (!weatherData?.hourly) return 0;
    
    const currentTime = weatherData.current_weather.time;
    const index = weatherData.hourly.time.findIndex(time => time === currentTime);
    return index !== -1 ? weatherData.hourly.relativehumidity_2m[index] : 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4 text-center">
        <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Weather</h2>
        <div className="flex justify-center items-center h-40">
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4 text-center">
        <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Weather</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load weather data'}
        </div>
      </div>
    );
  }

  // Get forecast for next 3 days
  const forecastDays = weatherData.daily.time.slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 text-center">
      <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Weather</h2>
      <div className="mb-4">
        <div className="text-lg font-bold">Berlin</div>
        <div className="flex justify-center items-center my-2">
          <span className="text-5xl mr-4">
            {getWeatherIcon(weatherData.current_weather.weathercode)}
          </span>
          <span className="text-4xl font-bold">{Math.round(weatherData.current_weather.temperature)}°C</span>
        </div>
        <div className="mb-2">
          {getWeatherCondition(weatherData.current_weather.weathercode)}
        </div>
        <div className="flex justify-around text-gray-600 text-sm">
          <div>Humidity: {getCurrentHumidity()}%</div>
          <div>Wind: {Math.round(weatherData.current_weather.windspeed)} km/h</div>
        </div>
      </div>
      
      <div className="flex justify-around border-t border-gray-200 pt-4">
        {forecastDays.map((day, index) => (
          <div key={index} className="text-center">
            <div className="font-medium">{formatDay(day, index)}</div>
            <div className="text-3xl my-2">
              {getWeatherIcon(weatherData.daily.weathercode[index])}
            </div>
            <div className="flex justify-center gap-2">
              <span className="font-bold">{Math.round(weatherData.daily.temperature_2m_max[index])}°</span>
              <span className="text-gray-600">{Math.round(weatherData.daily.temperature_2m_min[index])}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;