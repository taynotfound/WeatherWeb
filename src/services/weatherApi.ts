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
  sunrise: string;
  sunset: string;
  sunriseTimestamp: number;
  sunsetTimestamp: number;
  visibility: number;
  clouds: number;
  dt: number;
  feelsLike: number;
  airQuality?: number;
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
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
      },
    });

    const data = response.data;
    
    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windGust: data.wind.gust,
      sunrise: formatTime(data.sys.sunrise, data.timezone),
      sunset: formatTime(data.sys.sunset, data.timezone),
      sunriseTimestamp: data.sys.sunrise,
      sunsetTimestamp: data.sys.sunset,
      visibility: data.visibility,
      clouds: data.clouds.all,
      dt: data.dt,
      feelsLike: Math.round(data.main.feels_like),
      airQuality: undefined, // We would need to make a separate API call for air quality data
    };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
};

// Get 5-day forecast data
export const getForecast = async (city: string): Promise<ForecastData[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
      },
    });

    const data = response.data;
    const timezone = data.city.timezone;
    const dailyForecasts: ForecastData[] = [];
    
    // Get forecasts for each day at noon (closest to 12:00)
    const forecastsByDay = new Map();
    
    data.list.forEach((item: {
      dt: number;
      weather: Array<{ icon: string; description: string }>;
      main: { temp_max: number; temp_min: number };
    }) => {
      const date = new Date((item.dt + timezone) * 1000);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!forecastsByDay.has(dayKey)) {
        forecastsByDay.set(dayKey, item);
      } else {
        const existingDate = new Date((forecastsByDay.get(dayKey).dt + timezone) * 1000);
        const existingHour = existingDate.getHours();
        const currentHour = date.getHours();
        
        // If this forecast is closer to noon, use it instead
        if (Math.abs(12 - currentHour) < Math.abs(12 - existingHour)) {
          forecastsByDay.set(dayKey, item);
        }
      }
    });
    
    // Convert the map to an array of daily forecasts
    forecastsByDay.forEach((forecast) => {
      if (dailyForecasts.length < 5) { // Only include 5 days
        dailyForecasts.push({
          day: formatDay(forecast.dt, timezone),
          icon: forecast.weather[0].icon,
          condition: forecast.weather[0].description,
          tempMax: Math.round(forecast.main.temp_max),
          tempMin: Math.round(forecast.main.temp_min),
        });
      }
    });
    
    return dailyForecasts;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
}; 