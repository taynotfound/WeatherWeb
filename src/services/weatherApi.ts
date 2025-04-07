import axios from 'axios';

// You'll need to get an API key from OpenWeatherMap
// https://openweathermap.org/api
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  windDeg?: number;
  sunrise: string;
  sunset: string;
  sunriseTimestamp: number;
  sunsetTimestamp: number;
  visibility: number;
  clouds: number;
  dt: number;
  feelsLike: number;
  pressure?: number;
  precipitation?: {
    probability: number;
    rain: number;
    snow: number;
    total: number;
  };
  airQuality?: number;
  airPollutants?: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
  lat: number;
  lon: number;
  precipitationForecast?: {
    nextRain?: { time: string; probability: number };
    highestChance: { time: string; probability: number };
    lowestChance: { time: string; probability: number };
  };
  currentTime: number;
  timezone: number;
  tempMin: number;
  tempMax: number;
}

export interface ForecastData {
  day: string;
  icon: string;
  condition: string;
  tempMax: number;
  tempMin: number;
}

// Format time from timestamp
const formatTime = (timestamp: number, timezone: number): string => {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Format day from timestamp
const formatDay = (timestamp: number, timezone: number): string => {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Get current weather data
export const getCurrentWeather = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Location "${city}" is not supported or could not be found.`);
      }
      throw new Error('Failed to fetch weather data.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred while fetching weather data.');
  }
};

// Get 5-day forecast data
export const getForecast = async (city: string): Promise<ForecastData[]> => {
  try {
    const response = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Location "${city}" is not supported or could not be found.`);
      }
      throw new Error('Failed to fetch forecast data.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred while fetching forecast data.');
  }
}; 