import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDroplet, FiWind, FiSunrise, FiSunset, FiClock, FiTrendingUp, FiTrendingDown, FiThermometer, FiEye } from 'react-icons/fi';
import ReactCountryFlag from 'react-country-flag';
import Image from 'next/image';
import { useWeather } from './WeatherProvider';

interface WeatherCardProps {
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
  unit: 'C' | 'F';
  onUnitChange: (unit: 'C' | 'F') => void;
  visibility: number;
  clouds: number;
  lastUpdate: number;
  feelsLike: number;
  pressure?: number;
  precipitation?: {
    probability: number;
    rain: number;
    snow: number;
    total: number;
  };
  isDay: boolean;
  nightTemp?: number;
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
    highestChance: { time: string; probability: number };
    lowestChance: { time: string; probability: number };
    nextRain?: { time: string; probability: number };
  };
  currentTime: number;
  timezone: number;
  tempMin: number;
  tempMax: number;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  city,
  country,
  temperature,
  condition = '',
  icon,
  humidity,
  windSpeed,
  windGust,
  windDeg,
  sunrise,
  sunset,
  unit,
  onUnitChange,
  visibility,
  clouds,
  lastUpdate,
  feelsLike,
  pressure,
  precipitation,
  isDay = true,
  nightTemp,
  airQuality,
  airPollutants,
  lat,
  lon,
  precipitationForecast,
  currentTime,
  timezone,
  tempMin,
  tempMax,
}) => {
  const { updateWeather } = useWeather();

  const getWeatherConditions = (condition: string): { type: string; intensity?: 'light' | 'moderate' | 'heavy' }[] => {
    if (!condition) return [];
    
    const conditions: { type: string; intensity?: 'light' | 'moderate' | 'heavy' }[] = [];
    const lowerCondition = condition.toLowerCase();

    // Base condition
    if (lowerCondition.includes('rain')) {
      conditions.push({ 
        type: 'rain', 
        intensity: lowerCondition.includes('light') ? 'light' 
          : lowerCondition.includes('heavy') ? 'heavy' 
          : 'moderate' 
      });
    }
    if (lowerCondition.includes('snow')) {
      conditions.push({ 
        type: 'snow',
        intensity: lowerCondition.includes('light') ? 'light' 
          : lowerCondition.includes('heavy') ? 'heavy' 
          : 'moderate'  
      });
    }
    if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
      conditions.push({ type: 'fog' });
    }
    if (lowerCondition.includes('thunder')) {
      conditions.push({ type: 'thunder' });
    }

    return conditions;
  };

  useEffect(() => {
    if (condition) {
      updateWeather(condition, isDay, precipitation ? { probability: precipitation.probability } : undefined);
    }
  }, [condition, isDay, precipitation, updateWeather]);

  const weatherConditions = getWeatherConditions(condition);

  const getWeatherClass = (condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) return 'sunny';
    if (lowerCondition.includes('rain')) return 'rainy';
    if (lowerCondition.includes('cloud')) return 'cloudy';
    if (lowerCondition.includes('snow')) return 'snowy';
    if (lowerCondition.includes('thunder')) return 'thunder';
    return '';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeWithTimezone = (timezone: number) => {
    const currentGMTTime = new Date().getTime();
    const adjustedTime = new Date(currentGMTTime + timezone * 1000);
    return adjustedTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatTimezone = (timezone: number) => {
    const hours = timezone / 3600;
    const sign = hours >= 0 ? '+' : '-';
    return `GMT${sign}${Math.abs(hours)}`;
  };

  const getFrostEffect = (temp: number) => {
    if (temp <= 0) {
      return 'frost-effect';
    } else if (temp >= 20) {
      return 'melt-effect';
    }
    return '';
  };

  return (
    <div className="relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass p-4 sm:p-6 rounded-2xl ${getFrostEffect(temperature)}`}
      >
        {/* City and Country */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              {city}
              <ReactCountryFlag
                countryCode={country}
                svg
                className="rounded-sm"
                style={{
                  width: '1.5em',
                  height: '1.5em',
                }}
              />
            </h2>
            <p className="text-white/60 text-xs sm:text-sm">
              Last updated: {new Date(lastUpdate * 1000).toLocaleTimeString()}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUnitChange(unit === 'C' ? 'F' : 'C')}
            className="px-3 py-1 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 
                     transition-colors duration-200"
          >
            °{unit}
          </motion.button>
        </div>

        {/* Main Weather Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              <Image
                src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                alt={condition}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                {Math.round(temperature)}°{unit}
              </h3>
              <p className="text-white/60 capitalize text-sm sm:text-base">{condition}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-hover p-3 rounded-xl"
            >
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <FiThermometer />
                <span className="text-xs sm:text-sm">Feels Like</span>
              </div>
              <p className="text-white font-medium text-sm sm:text-base">{Math.round(feelsLike)}°{unit}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-hover p-3 rounded-xl"
            >
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <FiDroplet />
                <span className="text-xs sm:text-sm">Humidity</span>
              </div>
              <p className="text-white font-medium text-sm sm:text-base">{humidity}%</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-hover p-3 rounded-xl"
            >
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <FiWind />
                <span className="text-xs sm:text-sm">Wind</span>
              </div>
              <p className="text-white font-medium text-sm sm:text-base">{windSpeed} m/s</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-hover p-3 rounded-xl"
            >
              <div className="flex items-center gap-2 text-white/60 mb-1">
                <FiEye />
                <span className="text-xs sm:text-sm">Visibility</span>
              </div>
              <p className="text-white font-medium text-sm sm:text-base">
                {visibility >= 1000 ? `${(visibility / 1000).toFixed(1)}km` : `${visibility}m`}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Sunrise and Sunset */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-hover p-3 sm:p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-white/60 mb-2">
              <FiSunrise className="text-yellow-400" />
              <span className="text-sm">Sunrise</span>
            </div>
            <p className="text-white font-medium text-sm sm:text-base">{sunrise}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-hover p-3 sm:p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-white/60 mb-2">
              <FiSunset className="text-orange-400" />
              <span className="text-sm">Sunset</span>
            </div>
            <p className="text-white font-medium text-sm sm:text-base">{sunset}</p>
          </motion.div>
        </div>

        {/* Temperature Range */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-hover p-3 sm:p-4 rounded-xl mb-4 sm:mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <FiTrendingDown className="text-blue-400" />
              <span className="text-sm">Min</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <FiTrendingUp className="text-red-400" />
              <span className="text-sm">Max</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-white font-medium text-sm sm:text-base">{Math.round(tempMin)}°{unit}</p>
            <p className="text-white font-medium text-sm sm:text-base">{Math.round(tempMax)}°{unit}</p>
          </div>
        </motion.div>

        {/* Precipitation Forecast */}
        {precipitationForecast && precipitationForecast.highestChance.probability > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-4 sm:p-6 rounded-2xl"
          >
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Precipitation Forecast</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {precipitationForecast.nextRain && precipitationForecast.nextRain.probability > 0 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass-hover p-4 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                    <FiDroplet className="text-blue-400" />
                    <span>Next Rain</span>
                  </div>
                  <p className="text-white font-medium">
                    {precipitationForecast.nextRain.time}
                  </p>
                  <p className="text-white/60 text-sm">
                    {Math.round(precipitationForecast.nextRain.probability * 100)}% chance
                  </p>
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-hover p-4 rounded-xl"
              >
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <FiTrendingDown className="text-green-400" />
                  <span>Lowest Chance</span>
                </div>
                <p className="text-white font-medium">
                  {precipitationForecast.lowestChance.time}
                </p>
                <p className="text-white/60 text-sm">
                  {Math.round(precipitationForecast.lowestChance.probability * 100)}% chance
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-hover p-4 rounded-xl"
              >
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <FiTrendingUp className="text-red-400" />
                  <span>Highest Chance</span>
                </div>
                <p className="text-white font-medium">
                  {precipitationForecast.highestChance.time}
                </p>
                <p className="text-white/60 text-sm">
                  {Math.round(precipitationForecast.highestChance.probability * 100)}% chance
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WeatherCard; 