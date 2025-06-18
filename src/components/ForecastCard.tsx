import React from 'react';
import { motion } from 'framer-motion';
import { FiThermometer, FiDroplet, FiWind, FiSunrise, FiSunset, FiMoon } from 'react-icons/fi';
import { getWeatherIcon, displayTemperature } from '@/utils/weatherIcons';
import { useTheme } from '@/context/ThemeContext';

interface ForecastCardProps {
  day: string;
  icon: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation?: number;
  windSpeed?: number;
  unit: 'C' | 'F';
  sunrise?: string;
  sunset?: string;
}

export default function ForecastCard({
  day,
  icon,
  condition,
  tempMax,
  tempMin,
  precipitation,
  windSpeed,
  unit,
  sunrise,
  sunset
}: ForecastCardProps) {
  const { theme, timeMode } = useTheme();
  const WeatherIcon = getWeatherIcon(icon);
  const hasPrecipitation = precipitation !== undefined && precipitation > 0;

  const getFrostEffect = (temp: number) => {
    if (temp <= 0) {
      return 'frost-effect';
    } else if (temp >= 20) {
      return 'melt-effect';
    }
    return '';
  };

  const getTemperatureColor = (temp: number) => {
    if (theme === 'dark') {
      if (temp <= 0) return '#4a90e2'; // Dark ice blue
      if (temp <= 10) return '#2c5282'; // Dark cool blue
      if (temp <= 20) return '#2b6cb0'; // Dark moderate blue
      if (temp <= 25) return '#b7791f'; // Dark warm yellow
      return '#c53030'; // Dark hot red
    } else {
      if (temp <= 0) return '#a5d8ff'; // Light ice blue
      if (temp <= 10) return '#4ecdc4'; // Light cool blue
      if (temp <= 20) return '#45b7d1'; // Light moderate blue
      if (temp <= 25) return '#ffd93d'; // Light warm yellow
      return '#ff6b6b'; // Light hot red
    }
  };

  const getWeatherBackground = () => {
    const lowerCondition = condition.toLowerCase();
    const isNight = timeMode === 'night';
    
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
      return isNight ? 'weather-sunny night-mode' : 'weather-sunny';
    } else if (lowerCondition.includes('cloud')) {
      return isNight ? 'weather-cloudy night-mode' : 'weather-cloudy';
    } else if (lowerCondition.includes('rain')) {
      return isNight ? 'weather-rainy night-mode' : 'weather-rainy';
    } else if (lowerCondition.includes('snow')) {
      return isNight ? 'weather-snowy night-mode' : 'weather-snowy';
    } else if (lowerCondition.includes('thunder')) {
      return isNight ? 'weather-thunder night-mode' : 'weather-thunder';
    }
    return '';
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const iconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`glass glass-hover p-3 sm:p-6 rounded-xl backdrop-blur-xl relative overflow-hidden 
                 ${getFrostEffect(tempMax)} ${getWeatherBackground()} ${theme === 'dark' ? 'dark' : ''}`}
    >
      {/* Dynamic background gradient */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: `linear-gradient(135deg, 
            ${getTemperatureColor(tempMax)}, 
            ${getTemperatureColor(tempMin)})`
        }}
      />

      {/* Weather Background Elements */}
      <div className="weather-elements">
        {timeMode === 'night' ? (
          <>
            <motion.div 
              className="moon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div 
              className="stars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />
          </>
        ) : (
          condition.toLowerCase().includes('clear') && (
            <motion.div 
              className="sun"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          )
        )}
        {condition.toLowerCase().includes('cloud') && (
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
        {condition.toLowerCase().includes('rain') && (
          <motion.div 
            className="rain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {condition.toLowerCase().includes('snow') && (
          <motion.div 
            className="snow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {condition.toLowerCase().includes('thunder') && (
          <motion.div 
            className="lightning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center"
          >
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
              {day}
            </h3>
            <p className="text-xs sm:text-sm text-white/60 capitalize">
              {condition}
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <motion.div
            variants={iconVariants}
            className="relative w-12 h-12 sm:w-16 sm:h-16"
          >
            <WeatherIcon className="w-full h-full text-white" />
          </motion.div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg sm:text-xl font-bold text-white">
                {Math.round(displayTemperature(tempMax, unit))}°
              </span>
              <span className="text-sm sm:text-base text-white/60">
                {Math.round(displayTemperature(tempMin, unit))}°
              </span>
            </div>
            <span className="text-xs sm:text-sm text-white/60">{unit}</span>
          </div>

          {/* Additional weather info */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
            {hasPrecipitation && (
              <div className="flex items-center gap-1 text-white/60">
                <FiDroplet className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{Math.round(precipitation * 100)}%</span>
              </div>
            )}
            {windSpeed !== undefined && (
              <div className="flex items-center gap-1 text-white/60">
                <FiWind className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{Math.round(windSpeed)} m/s</span>
              </div>
            )}
          </div>

          {/* Sunrise/Sunset for today */}
          {(sunrise || sunset) && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-2">
              {sunrise && (
                <div className="flex items-center gap-1 text-white/60">
                  <FiSunrise className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm">{sunrise}</span>
                </div>
              )}
              {sunset && (
                <div className="flex items-center gap-1 text-white/60">
                  <FiSunset className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  <span className="text-xs sm:text-sm">{sunset}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 