import React, { useState, useEffect } from 'react';

// Import weather icons
import clearIcon from '../assets/airy/clear@4x.png';
import densedrizzleIcon from '../assets/airy/dense-drizzle@4x.png';
import denseFreezeingDrizzleIcon from '../assets/airy/dense-freezing-drizzle@4x.png';
import fogIcon from '../assets/airy/fog@4x.png';
import heavyFreezeingRainIcon from '../assets/airy/heavy-freezing-rain@4x.png';
import heavyRainIcon from '../assets/airy/heavy-rain@4x.png';
import heavySnowfallIcon from '../assets/airy/heavy-snowfall@4x.png';
import lightDrizzleIcon from '../assets/airy/light-drizzle@4x.png';
import lightFreezeingDrizzleIcon from '../assets/airy/light-freezing-drizzle@4x.png';
import lightFreezeingRainIcon from '../assets/airy/light-freezing-rain@4x.png';
import lightRainIcon from '../assets/airy/light-rain@4x.png';
import moderateDrizzleIcon from '../assets/airy/moderate-drizzle@4x.png';
import moderateRainIcon from '../assets/airy/moderate-rain@4x.png';
import moderateSnowfallIcon from '../assets/airy/moderate-snowfall@4x.png';
import mostlyClearIcon from '../assets/airy/mostly-clear@4x.png';
import overcastIcon from '../assets/airy/overcast@4x.png';
import partlyCloudyIcon from '../assets/airy/partly-cloudy@4x.png';
import rimeFogIcon from '../assets/airy/rime-fog@4x.png';
import slightSnowfallIcon from '../assets/airy/slight-snowfall@4x.png';
import snowflakeIcon from '../assets/airy/snowflake@4x.png';
import thunderstormWithHailIcon from '../assets/airy/thunderstorm-with-hail@4x.png';
import thunderstormIcon from '../assets/airy/thunderstorm@4x.png';

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
    switch (true) {
      case code === 0:
        return clearIcon; // Clear sky
      case code === 1:
        return mostlyClearIcon; // Mainly clear
      case code === 2:
        return partlyCloudyIcon; // Partly cloudy
      case code === 3:
        return overcastIcon; // Overcast
      case code === 45:
        return fogIcon; // Fog
      case code === 48:
        return rimeFogIcon; // Rime fog
      case code === 51:
        return lightDrizzleIcon; // Light drizzle
      case code === 53:
        return moderateDrizzleIcon; // Moderate drizzle
      case code === 55:
        return densedrizzleIcon; // Dense drizzle
      case code === 56:
        return lightFreezeingDrizzleIcon; // Light freezing drizzle
      case code === 57:
        return denseFreezeingDrizzleIcon; // Dense freezing drizzle
      case code === 61:
        return lightRainIcon; // Light rain
      case code === 63:
        return moderateRainIcon; // Moderate rain
      case code === 65:
        return heavyRainIcon; // Heavy rain
      case code === 66:
        return lightFreezeingRainIcon; // Light freezing rain
      case code === 67:
        return heavyFreezeingRainIcon; // Heavy freezing rain
      case code === 71:
        return slightSnowfallIcon; // Slight snowfall
      case code === 73:
        return moderateSnowfallIcon; // Moderate snowfall
      case code === 75:
        return heavySnowfallIcon; // Heavy snowfall
      case code === 77:
        return snowflakeIcon; // Snow grains
      case code === 85:
        return slightSnowfallIcon; // Slight snow showers
      case code === 86:
        return heavySnowfallIcon; // Heavy snow showers
      case code === 95:
        return thunderstormIcon; // Thunderstorm
      case [96, 99].includes(code):
        return thunderstormWithHailIcon; // Thunderstorm with hail
      default:
        return clearIcon; // Default
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
    
    // Current time format is like "2025-03-23T14:15"
    const currentTimeString = weatherData.current_weather.time;
    
    // Extract just the date and hour part to match hourly data format
    const currentHour = currentTimeString.substring(0, 13) + ":00"; // Convert "2025-03-23T14:15" to "2025-03-23T14:00"
    
    // Find the index of this hour in the hourly data
    const index = weatherData.hourly.time.findIndex(time => time === currentHour);
    
    if (index !== -1) {
      return weatherData.hourly.relativehumidity_2m[index];
    } else {
      // If exact hour not found, find the closest hour
      console.warn("Exact hour match not found for humidity, using closest available hour");
      
      // Get just the current hour as a Date object for comparison
      const currentTime = new Date(currentTimeString);
      
      // Find the closest time by comparing timestamps
      let closestIndex = 0;
      let smallestDiff = Infinity;
      
      weatherData.hourly.time.forEach((timeString, idx) => {
        const time = new Date(timeString);
        const diff = Math.abs(time.getTime() - currentTime.getTime());
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = idx;
        }
      });
      
      return weatherData.hourly.relativehumidity_2m[closestIndex];
    }
  };

  // Get current precipitation from hourly data
  const getCurrentPrecipitation = (): number => {
    if (!weatherData?.hourly) return 0;
    
    // Use the same approach as getCurrentHumidity to find the current hour
    const currentTimeString = weatherData.current_weather.time;
    const currentHour = currentTimeString.substring(0, 13) + ":00";
    
    const index = weatherData.hourly.time.findIndex(time => time === currentHour);
    
    if (index !== -1) {
      return weatherData.hourly.precipitation[index];
    } else {
      // Find closest hour similar to getCurrentHumidity
      const currentTime = new Date(currentTimeString);
      let closestIndex = 0;
      let smallestDiff = Infinity;
      
      weatherData.hourly.time.forEach((timeString, idx) => {
        const time = new Date(timeString);
        const diff = Math.abs(time.getTime() - currentTime.getTime());
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = idx;
        }
      });
      
      return weatherData.hourly.precipitation[closestIndex];
    }
  };

  // Calculate daily precipitation totals
  const getDailyPrecipitation = (): number[] => {
    if (!weatherData?.daily || !weatherData?.hourly) return [0, 0, 0];
    
    const dailyTotals = weatherData.daily.time.slice(0, 3).map(date => {
      const datePrefix = date + "T";
      const hourlyIndices = weatherData.hourly.time
        .map((time, index) => time.startsWith(datePrefix) ? index : -1)
        .filter(index => index !== -1);
      
      // Sum precipitation for all hours in this day
      return hourlyIndices.reduce(
        (total, index) => total + weatherData.hourly.precipitation[index], 
        0
      );
    });
    
    return dailyTotals;
  };

  // Format precipitation display
  const formatPrecipitation = (amount: number): string => {
    if (amount === 0) return "None";
    if (amount < 0.1) return "Trace";
    return `${amount.toFixed(1)} mm`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4 text-center w-full">
        <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Weather</h2>
        <div className="flex justify-center items-center h-40">
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4 text-center w-full">
        <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Weather</h2>
        <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 rounded">
          {error || 'Failed to load weather data'}
        </div>
      </div>
    );
  }

  // Get forecast for next 3 days
  const forecastDays = weatherData.daily.time.slice(0, 3);
  const dailyPrecipitation = getDailyPrecipitation();
  const currentPrecipitation = getCurrentPrecipitation();
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 text-center w-full">
      <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Weather</h2>
      <div className="mb-4">
        <div className="text-lg font-bold text-[#3E3128]">Berlin</div>
        <div className="flex justify-center items-center my-2">
          <img 
            src={getWeatherIcon(weatherData.current_weather.weathercode)} 
            alt={getWeatherCondition(weatherData.current_weather.weathercode)}
            className="w-16 h-16 mr-4"
          />
          <span className="text-4xl font-bold text-[#3E3128]">{Math.round(weatherData.current_weather.temperature)}°C</span>
        </div>
        <div className="mb-2 text-[#5A4635]">
          {getWeatherCondition(weatherData.current_weather.weathercode)}
        </div>
        <div className="flex justify-around text-[#5A4635] text-sm mb-2">
          <div>Humidity: {getCurrentHumidity()}%</div>
          <div>Wind: {Math.round(weatherData.current_weather.windspeed)} km/h</div>
        </div>
        <div className="text-[#5A4635] text-sm">
          <div className="flex items-center justify-center">
            <span className="mr-1">Precipitation:</span>
            <span className={currentPrecipitation > 0 ? "text-[#8C7356] font-medium" : ""}>
              {formatPrecipitation(currentPrecipitation)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-around border-t border-gray-200 pt-4">
        {forecastDays.map((day, index) => (
          <div key={index} className="text-center">
            <div className="font-medium text-[#3E3128]">{formatDay(day, index)}</div>
            <div className="my-2">
              <img 
                src={getWeatherIcon(weatherData.daily.weathercode[index])} 
                alt={getWeatherCondition(weatherData.daily.weathercode[index])}
                className="w-12 h-12 mx-auto"
              />
            </div>
            <div className="flex justify-center gap-2">
              <span className="font-bold text-[#3E3128]">{Math.round(weatherData.daily.temperature_2m_max[index])}°</span>
              <span className="text-[#5A4635]">{Math.round(weatherData.daily.temperature_2m_min[index])}°</span>
            </div>
            <div className="text-xs mt-1 text-[#5A4635]">
              <span className={dailyPrecipitation[index] > 0 ? "text-[#8C7356]" : ""}>
                {formatPrecipitation(dailyPrecipitation[index])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;