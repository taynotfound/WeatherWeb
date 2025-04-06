import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

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
      className="glass glass-hover"
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '1rem',
        minWidth: '140px',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <h3 style={{ 
        color: 'var(--text-primary)',
        fontWeight: 500,
        marginBottom: '0.5rem',
        fontSize: '1rem'
      }}>
        {day}
      </h3>
      
      <div className={`weather-animation ${getWeatherClass(condition)}`} style={{ 
        margin: '0.5rem 0',
        position: 'relative',
        width: '3rem',
        height: '3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src={`https://openweathermap.org/img/wn/${icon}.png`}
          alt={condition}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <p style={{ 
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        textTransform: 'capitalize',
        textAlign: 'center',
        marginBottom: '0.5rem',
        minHeight: '2rem'
      }}>
        {condition}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <FiArrowUp style={{ color: 'var(--primary)' }} />
          <span style={{ 
            color: 'var(--text-primary)',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}>
            {tempMax}°{unit}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <FiArrowDown style={{ color: 'var(--accent)' }} />
          <span style={{ 
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}>
            {tempMin}°{unit}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ForecastCard; 