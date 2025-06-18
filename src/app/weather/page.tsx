'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiShare2, FiStar, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import WeatherCard from '@/components/WeatherCard';
import WeatherDetails from '@/components/WeatherDetails';
import ForecastCard from '@/components/ForecastCard';
import AIRecommendations from '@/components/AIRecommendations';
import Tomato from '@/components/Tomato';
import AIChatWidget from '@/components/AIChatWidget';
import AdvancedWeatherInfo from '@/components/AdvancedWeatherInfo';
import { useFavorites } from '@/components/FavoritesContext';
import { getCurrentWeather, getForecast, WeatherData, ForecastData } from '@/services/weatherApi';

// Separate component that uses useSearchParams
function WeatherContent() {
  const searchParams = useSearchParams();
  const city = searchParams.get('city');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { addFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (city) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [weatherData, forecastData] = await Promise.all([
            getCurrentWeather(city),
            getForecast(city)
          ]);
          setWeather(weatherData);
          setForecast(forecastData);
          
          // Add to recent searches
          const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
          const newRecent = [city, ...recent.filter((c: string) => c !== city)].slice(0, 5);
          localStorage.setItem('recentSearches', JSON.stringify(newRecent));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [city]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Weather in ${city}`,
          text: `Check out the weather in ${city} on WeatherWeb!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const getWeatherBackground = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
      return 'weather-sunny';
    } else if (lowerCondition.includes('cloud')) {
      return 'weather-cloudy';
    } else if (lowerCondition.includes('rain')) {
      return 'weather-rainy';
    } else if (lowerCondition.includes('snow')) {
      return 'weather-snowy';
    } else if (lowerCondition.includes('thunder')) {
      return 'weather-thunder';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-white/70 text-shadow-md">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4 text-shadow-lg">Oops! Something went wrong</h2>
          <p className="text-white/70 mb-8 text-shadow-md">{error || 'City not found'}</p>
          <Link
            href="/"
            className="glass glass-hover px-6 py-3 rounded-lg text-white no-underline 
                     transition-all duration-200 hover:scale-105 text-shadow-md"
          >
            <FiArrowLeft className="inline mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${getWeatherBackground(weather.condition)}`}>
      <div className="weather-elements">
        {weather.condition.toLowerCase().includes('clear') && (
          <motion.div 
            className="sun"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {weather.condition.toLowerCase().includes('cloud') && (
          <>
            <motion.div 
              className="cloud cloud-1"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            />
            <motion.div 
              className="cloud cloud-2"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </>
        )}
        {weather.condition.toLowerCase().includes('rain') && (
          <motion.div 
            className="rain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {weather.condition.toLowerCase().includes('snow') && (
          <motion.div 
            className="snow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {weather.condition.toLowerCase().includes('thunder') && (
          <motion.div 
            className="lightning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="glass glass-hover px-4 py-2 rounded-lg text-white no-underline 
                     transition-all duration-200 hover:scale-105 text-shadow-md"
          >
            <FiArrowLeft className="inline mr-2" />
            Back
          </Link>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addFavorite(weather.city)}
              className={`p-2 rounded-full ${
                isFavorite(weather.city)
                  ? 'bg-yellow-400/90 text-yellow-900'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              } transition-colors duration-200 text-shadow-md`}
            >
              <FiStar className={isFavorite(weather.city) ? 'fill-current' : ''} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="glass glass-hover p-2 rounded-full text-white/60 hover:text-white 
                       transition-colors duration-200 text-shadow-md"
            >
              <FiShare2 />
            </motion.button>
          </div>
        </div>

        {/* Weather Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-8">
              <WeatherCard
                city={weather.city}
                country={weather.country}
                temperature={weather.temperature}
                condition={weather.condition}
                icon={weather.icon}
                humidity={weather.humidity}
                windSpeed={weather.windSpeed}
                windGust={weather.windGust}
                sunrise={weather.sunrise}
                sunset={weather.sunset}
                unit={unit}
                onUnitChange={setUnit}
                visibility={weather.visibility}
                clouds={weather.clouds}
                lastUpdate={weather.dt}
                feelsLike={weather.feelsLike}
                isDay={weather.isDay}
                nightTemp={forecast[0]?.tempMin}
                airQuality={weather.airQuality}
                lat={weather.lat}
                lon={weather.lon}
                precipitation={weather.precipitation}
                precipitationForecast={weather.precipitationForecast}
                currentTime={weather.currentTime}
                timezone={weather.timezone}
                tempMin={weather.tempMin}
                tempMax={weather.tempMax}
              />
              
              <WeatherDetails
                visibility={weather.visibility}
                clouds={weather.clouds}
                windSpeed={weather.windSpeed}
                windGust={weather.windGust}
                windDeg={weather.windDeg}
                lastUpdate={weather.dt}
                feelsLike={weather.feelsLike}
                humidity={weather.humidity}
                pressure={weather.pressure}
                precipitation={weather.precipitation}
                isDay={weather.isDay}
                nightTemp={forecast[0]?.tempMin}
                airQuality={weather.airQuality}
                airPollutants={weather.airPollutants}
                lat={weather.lat}
                lon={weather.lon}
                unit={unit}
                onUnitChange={setUnit}
              />

              {/* Advanced Weather Info */}
              <div className="mt-8">
                <AdvancedWeatherInfo city={weather.city} />
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-semibold mb-8 text-center text-white text-shadow-lg">
                  5-Day Forecast
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {forecast.map((forecast, index) => (
                    <ForecastCard
                      key={index}
                      day={forecast.day}
                      icon={forecast.icon}
                      condition={forecast.condition}
                      tempMax={forecast.tempMax}
                      tempMin={forecast.tempMin}
                      unit={unit}
                      sunrise={index === 0 ? weather.sunrise : undefined}
                      sunset={index === 0 ? weather.sunset : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AIRecommendations weather={weather} />
            </div>
          </div>
        </div>
      </main>

      {/* Tomato Character */}
      <Tomato weather={weather} onChat={() => setIsChatOpen(true)} />

      {/* AI Chat Widget */}
      <AIChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

// Loading fallback component
function WeatherLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-white/70 text-shadow-md">Loading weather page...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function WeatherPage() {
  return (
    <Suspense fallback={<WeatherLoading />}>
      <WeatherContent />
    </Suspense>
  );
} 