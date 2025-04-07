import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Image from 'next/image';

interface ForecastCardProps {
  day: string;
  icon: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  index: number;
  unit: 'C' | 'F';
}

const ForecastCard: React.FC<ForecastCardProps> = ({
  day,
  icon,
  condition,
  tempMax,
  tempMin,
  index,
  unit
}) => {
  const getWeatherClass = (condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) return 'sunny';
    if (lowerCondition.includes('rain')) return 'rainy';
    if (lowerCondition.includes('cloud')) return 'cloudy';
    if (lowerCondition.includes('snow')) return 'snowy';
    if (lowerCondition.includes('thunder')) return 'thunder';
    return '';
  };

  return (
    <motion.div
      className="glass glass-hover p-4 flex flex-col items-center rounded-2xl min-w-[140px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <h3 className="text-text-primary font-medium mb-2 text-base">
        {day}
      </h3>
      
      <div className={`weather-animation ${getWeatherClass(condition)} my-2 relative w-12 h-12 flex items-center justify-center`}>
        <Image
          src={`https://openweathermap.org/img/wn/${icon}.png`}
          alt={condition}
          width={48}
          height={48}
          className="object-contain"
        />
      </div>

      <p className="text-text-secondary text-xs capitalize text-center mb-2 min-h-8">
        {condition}
      </p>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <FiArrowUp className="text-primary" />
          <span className="text-text-primary font-bold text-sm">
            {tempMax}°{unit}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FiArrowDown className="text-accent" />
          <span className="text-text-secondary text-sm">
            {tempMin}°{unit}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ForecastCard; 