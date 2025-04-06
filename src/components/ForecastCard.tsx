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
  const cardStyles = {
    padding: '1rem',
    margin: '0 1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    background: 'var(--glass-background)',
    borderRadius: '0.75rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--glass-border)',
  };

  const tempStyles = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginTop: '0.5rem',
  };

  return (
    <motion.div
      style={cardStyles}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.25rem', textAlign: 'center' as const }}>
        {day}
      </h3>
      <div style={{ margin: '0.25rem 0' }}>
        <img
          src={`https://openweathermap.org/img/wn/${icon}.png`}
          alt={condition}
          style={{ width: '3rem', height: '3rem' }}
        />
      </div>
      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '0.75rem', 
        textTransform: 'capitalize',
        textAlign: 'center' as const,
        marginBottom: '0.25rem'
      }}>
        {condition}
      </p>
      <div style={tempStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <FiArrowUp style={{ color: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{tempMax}°{unit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <FiArrowDown style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{tempMin}°{unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ForecastCard; 