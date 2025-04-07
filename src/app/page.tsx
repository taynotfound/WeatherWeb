'use client';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGithub } from 'react-icons/fi';
import SearchBar from '@/components/SearchBar';
import WeatherCard from '@/components/WeatherCard';
import WeatherDetails from '@/components/WeatherDetails';
import ForecastCard from '@/components/ForecastCard';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import WeatherRadar from '@/components/WeatherRadar';
import { getCurrentWeather, getForecast, WeatherData, ForecastData } from '@/services/weatherApi';
import WeatherAnimation from '@/components/WeatherAnimation';
import RainEffect from '../components/RainEffect';

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRaining, setIsRaining] = useState(false);

  // Handle window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load London weather by default
  useEffect(() => {
    handleCitySelect('London');
  }, []);

  useEffect(() => {
    if (weather?.condition) {
      setIsRaining(weather.condition.toLowerCase().includes('rain'));
    }
  }, [weather?.condition]);

  const getWeatherClass = (condition: string): string => {
    const lowerCondition = condition?.toLowerCase() || '';
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) return 'sunny';
    if (lowerCondition.includes('rain')) return 'rainy';
    if (lowerCondition.includes('cloud')) return 'cloudy';
    if (lowerCondition.includes('snow')) return 'snowy';
    if (lowerCondition.includes('thunder')) return 'thunder';
    return '';
  };

  const convertToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9/5) + 32);
  };

  const formatTemperature = (temp: number) => {
    return Number.isInteger(temp) ? temp : Number(temp.toFixed(1));
  };

  const getTemperatureInUnit = (celsius: number) => {
    const temp = unit === 'C' ? celsius : convertToFahrenheit(celsius);
    return formatTemperature(temp);
  };

  const isDay = (sunrise: number, sunset: number) => {
    const now = Date.now() / 1000;
    return now > sunrise && now < sunset;
  };

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);
    setLoading(true);
    setError('');

    try {
      const [weatherData, forecastData] = await Promise.all([
        getCurrentWeather(city),
        getForecast(city)
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      if (err instanceof Error && (err.message.includes('not supported') || err.message.includes('Failed to fetch'))) {
        setWeather(null);
        setForecast([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (newUnit: 'C' | 'F') => {
    setUnit(newUnit);
  };

  return (
    <>
      <RainEffect isRaining={isRaining} />
      <div className={`${weather ? getWeatherClass(weather.condition) : ''}`} />
      {weather && (
        <WeatherAnimation 
          conditions={[{ type: weather.condition.toLowerCase().includes('rain') ? 'rain' : 'clear' }]} 
          isDay={isDay(weather.sunriseTimestamp, weather.sunsetTimestamp)} 
        />
      )}
      <main className="min-h-screen px-4 py-10 max-w-[90%] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <h1 className="mt-6 text-gradient text-5xl font-bold mb-2 text-center">
            WeatherWeb
          </h1>
          <p className="text-text-secondary text-center">
            A modern glassmorphic weather application
          </p>
        </motion.div>

        <div className="mt-12 max-w-[40rem] w-full mx-auto">
          <SearchBar onCitySelect={handleCitySelect} />
        </div>
        
        {loading && (
          <div className="text-center mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading weather data...</p>
          </div>
        )}

        {error && !weather && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {weather && !loading && (
          <>
            <div className="mt-10 mx-auto max-w-[80rem] w-[95%] relative">
              <div className="flex flex-col gap-12">
                <WeatherCard
                  city={weather.city}
                  country={weather.country}
                  temperature={getTemperatureInUnit(weather.temperature)}
                  condition={weather.condition}
                  icon={weather.icon}
                  humidity={weather.humidity}
                  windSpeed={weather.windSpeed}
                  windGust={weather.windGust}
                  sunrise={weather.sunrise}
                  sunset={weather.sunset}
                  unit={unit}
                  onUnitChange={handleUnitChange}
                  visibility={weather.visibility}
                  clouds={weather.clouds}
                  lastUpdate={weather.dt}
                  feelsLike={getTemperatureInUnit(weather.feelsLike)}
                  isDay={isDay(weather.sunriseTimestamp, weather.sunsetTimestamp)}
                  nightTemp={forecast[0]?.tempMin}
                  airQuality={weather.airQuality}
                  lat={weather.lat}
                  lon={weather.lon}
                  precipitation={weather.precipitation}
                  precipitationForecast={weather.precipitationForecast}
                  currentTime={weather.currentTime}
                  timezone={weather.timezone}
                  tempMin={getTemperatureInUnit(weather.tempMin)}
                  tempMax={getTemperatureInUnit(weather.tempMax)}
                />
                
                <WeatherDetails
                  visibility={weather.visibility}
                  clouds={weather.clouds}
                  windSpeed={weather.windSpeed}
                  windGust={weather.windGust}
                  windDeg={weather.windDeg}
                  lastUpdate={weather.dt}
                  feelsLike={getTemperatureInUnit(weather.feelsLike)}
                  humidity={weather.humidity}
                  pressure={weather.pressure}
                  precipitation={weather.precipitation}
                  isDay={isDay(weather.sunriseTimestamp, weather.sunsetTimestamp)}
                  nightTemp={forecast[0]?.tempMin}
                  airQuality={weather.airQuality}
                  airPollutants={weather.airPollutants}
                  lat={weather.lat}
                  lon={weather.lon}
              
                  unit={unit}
                  onUnitChange={handleUnitChange}
                />

                <div className="mt-4">
                  <h2 className="text-text-primary text-xl font-semibold mb-8 text-center">
                    5-Day Forecast
                  </h2>
                  <div className="forecast-container">
                    {forecast.map((forecast, index) => (
                      <ForecastCard
                        key={index}
                        day={forecast.day}
                        icon={forecast.icon}
                        condition={forecast.condition}
                        tempMax={getTemperatureInUnit(forecast.tempMax)}
                        tempMin={getTemperatureInUnit(forecast.tempMin)}
                        index={index}
                        unit={unit}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <footer className="mt-16 text-center text-sm text-text-secondary flex flex-col items-center gap-4">
          <Link
            href="/about"
            className="glass glass-hover px-6 py-3 rounded-lg text-text-primary no-underline transition-all duration-200 hover:scale-105"
          >
            About WeatherWeb
          </Link>
          <a
            href="https://github.com/taygotfound/weatherweb"
            target="_blank"
            rel="noopener noreferrer"
            className="glass glass-hover px-6 py-3 rounded-lg text-text-primary no-underline flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <FiGithub size={16} />
            View on GitHub
          </a>
        </footer>
      </main>
    </>
  );
}
