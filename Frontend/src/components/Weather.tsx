import { useState, useEffect } from 'react';

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
        setWeatherData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        setError('Fehler beim Laden der Wetterdaten');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [schoolLat, schoolLng]);

  const getWeatherIcon = (code: number): string => {
    switch (true) {
      case code === 0: return clearIcon;
      case code === 1: return mostlyClearIcon;
      case code === 2: return partlyCloudyIcon;
      case code === 3: return overcastIcon;
      case code === 45: return fogIcon;
      case code === 48: return rimeFogIcon;
      case code === 51: return lightDrizzleIcon;
      case code === 53: return moderateDrizzleIcon;
      case code === 55: return densedrizzleIcon;
      case code === 56: return lightFreezeingDrizzleIcon;
      case code === 57: return denseFreezeingDrizzleIcon;
      case code === 61: return lightRainIcon;
      case code === 63: return moderateRainIcon;
      case code === 65: return heavyRainIcon;
      case code === 66: return lightFreezeingRainIcon;
      case code === 67: return heavyFreezeingRainIcon;
      case code === 71: return slightSnowfallIcon;
      case code === 73: return moderateSnowfallIcon;
      case code === 75: return heavySnowfallIcon;
      case code === 77: return snowflakeIcon;
      case code === 80: return lightRainIcon;
      case code === 81: return moderateRainIcon;
      case code === 82: return heavyRainIcon;
      case code === 85: return slightSnowfallIcon;
      case code === 86: return heavySnowfallIcon;
      case code === 95: return thunderstormIcon;
      case code === 96: return thunderstormWithHailIcon;
      case code === 99: return thunderstormWithHailIcon;
      default: return clearIcon;
    }
  };

  const getWeatherCondition = (code: number): string => {
    switch (true) {
      case code === 0: return 'Klarer Himmel';
      case code === 1: return 'Überwiegend klar';
      case code === 2: return 'Teilweise bewölkt';
      case code === 3: return 'Bedeckt';
      case [45, 48].includes(code): return 'Nebel';
      case [51, 53, 55].includes(code): return 'Nieselregen';
      case [61, 63, 65].includes(code): return 'Regen';
      case [80, 81, 82].includes(code): return 'Regenschauer';
      case [71, 73, 75].includes(code): return 'Schneefall';
      case [85, 86].includes(code): return 'Schneeschauer';
      case [95, 96, 99].includes(code): return 'Gewitter';
      default: return 'Unbekannt';
    }
  };

  const formatDay = (dateString: string, index: number): string => {
    if (index === 0) return 'Heute';
    if (index === 1) return 'Morgen';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { weekday: 'short' });
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-2xl text-gray-600 dark:text-gray-400">Lade Wetterdaten...</p>
          </div>
        </div>
    );
  }

  if (error || !weatherData) {
    return (
        <div className="flex justify-center items-center h-full">
          <div className="bg-red-100/90 dark:bg-red-900/50 border-2 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 px-8 py-6 rounded-2xl text-2xl text-center backdrop-blur-sm">
            {error || 'Wetterdaten nicht verfügbar'}
          </div>
        </div>
    );
  }

  const forecastDays = weatherData.daily.time.slice(0, 3);

  return (
      <div className="h-full flex flex-col gap-4 p-1">
        {/* Hauptwetter-Card */}
        <div className="relative bg-gradient-to-br from-blue-400/30 via-blue-500/20 to-blue-600/30 dark:from-blue-600/40 dark:via-blue-700/30 dark:to-blue-800/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md border border-white/30 dark:border-white/10 overflow-hidden flex-shrink-0">
          {/* Dekorativer Hintergrund */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative flex items-center justify-between">
            {/* Linke Seite: Ort & Temperatur */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Berlin</h2>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                  {Math.round(weatherData.current_weather.temperature)}°
                </span>
                <span className="text-2xl text-gray-700 dark:text-gray-300 mb-1">C</span>
              </div>
              <p className="text-xl text-gray-700 dark:text-gray-300 font-medium mt-1">
                {getWeatherCondition(weatherData.current_weather.weathercode)}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <img
                  src={getWeatherIcon(weatherData.current_weather.weathercode)}
                  alt={getWeatherCondition(weatherData.current_weather.weathercode)}
                  className="w-28 h-28 drop-shadow-2xl"
              />
              <div className="flex gap-4 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span className="text-base font-medium">{Math.round(weatherData.current_weather.windspeed)} km/h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
          {forecastDays.map((day, index) => (
              <div
                  key={index}
                  className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-3 shadow-lg backdrop-blur-sm border border-white/40 dark:border-gray-700/40 hover:scale-105 transition-transform duration-200 flex flex-col justify-center"
              >
                <p className="text-lg font-bold text-gray-800 dark:text-white text-center mb-2">
                  {formatDay(day, index)}
                </p>
                <img
                    src={getWeatherIcon(weatherData.daily.weathercode[index])}
                    alt={getWeatherCondition(weatherData.daily.weathercode[index])}
                    className="w-16 h-16 mx-auto mb-2 drop-shadow-lg"
                />
                <div className="flex justify-center items-center gap-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {Math.round(weatherData.daily.temperature_2m_max[index])}°
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    {Math.round(weatherData.daily.temperature_2m_min[index])}°
                  </span>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
};

export default Weather;