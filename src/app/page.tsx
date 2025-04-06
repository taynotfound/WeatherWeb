'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGithub } from 'react-icons/fi';
import SearchBar from '@/components/SearchBar';
import WeatherCard from '@/components/WeatherCard';
import ForecastCard from '@/components/ForecastCard';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import { getCurrentWeather, getForecast, WeatherData, ForecastData } from '@/services/weatherApi';
import WeatherAnimation from '@/components/WeatherAnimation';

export default function Home() {
  const [city, setCity] = useState<string>('London');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

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

  const getTemperatureInUnit = (celsius: number) => {
    return unit === 'C' ? celsius : convertToFahrenheit(celsius);
  };

  const isDay = (sunrise: number, sunset: number) => {
    const now = Date.now() / 1000; // Convert to seconds
    return now > sunrise && now < sunset;
  };

  const fetchWeatherData = async (cityName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [weather, forecast] = await Promise.all([
        getCurrentWeather(cityName),
        getForecast(cityName)
      ]);
      
      setWeatherData(weather);
      setForecastData(forecast);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Could not fetch weather data. Please check the city name and try again.');
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchWeatherData(city);
  }, []);

  const handleSearch = (searchCity: string) => {
    setCity(searchCity);
    fetchWeatherData(searchCity);
  };

  const handleUnitChange = (newUnit: 'C' | 'F') => {
    setUnit(newUnit);
  };

  return (
    <>
      <div className={`weather-bg ${weatherData ? getWeatherClass(weatherData.condition) : ''}`} />
      {weatherData && <WeatherAnimation condition={weatherData.condition} />}
      <main style={{
        minHeight: '100vh',
        padding: '2.5rem 1rem',
        maxWidth: '64rem',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '2.5rem'
          }}
        >
          <h1 className="text-gradient" style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            WeatherWeb
          </h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            A modern glassmorphic weather application
          </p>
        </motion.div>

        <div style={{ 
          maxWidth: '28rem',
          margin: '0 auto 2rem auto',
          width: '100%'
        }}>
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loading />
        ) : (
          weatherData && (
            <div style={{ margin: '2.5rem auto 0 auto' }}>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                marginBottom: '3rem',
                padding: '0 1rem',
                maxWidth: '64rem',
                margin: '0 auto'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '2rem',
                  alignItems: 'start'
                }}>
                  <WeatherCard
                    city={weatherData.city}
                    country={weatherData.country}
                    temperature={getTemperatureInUnit(weatherData.temperature)}
                    condition={weatherData.condition}
                    icon={weatherData.icon}
                    humidity={weatherData.humidity}
                    windSpeed={weatherData.windSpeed}
                    windGust={weatherData.windGust}
                    sunrise={weatherData.sunrise}
                    sunset={weatherData.sunset}
                    unit={unit}
                    onUnitChange={handleUnitChange}
                    visibility={weatherData.visibility}
                    clouds={weatherData.clouds}
                    lastUpdate={weatherData.dt}
                    feelsLike={getTemperatureInUnit(weatherData.feelsLike)}
                    isDay={isDay(weatherData.sunriseTimestamp, weatherData.sunsetTimestamp)}
                    nightTemp={forecastData[0]?.tempMin}
                    airQuality={weatherData.airQuality}
                  />
                </div>
              </div>

              <div style={{ marginTop: '4rem' }}>
                <h2 style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  5-Day Forecast
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                  maxWidth: '56rem',
                  margin: '0 auto',
                  padding: '0 1rem'
                }}>
                  {forecastData.map((forecast, index) => (
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
          )
        )}

        <footer style={{
          marginTop: '4rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          <a
            href="https://github.com/taygotfound/weatherweb"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)'
            }}
            className="github-link"
          >
            <FiGithub size={16} />
            View on GitHub
          </a>
        </footer>
      </main>
    </>
  );
}
