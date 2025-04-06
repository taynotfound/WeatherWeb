import React from 'react';
import { motion } from 'framer-motion';
import { FiDroplet, FiWind, FiSunrise, FiSunset } from 'react-icons/fi';
import ReactCountryFlag from 'react-country-flag';
import WeatherDetails from './WeatherDetails';

interface WeatherCardProps {
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
  unit: 'C' | 'F';
  onUnitChange: (unit: 'C' | 'F') => void;
  visibility: number;
  clouds: number;
  lastUpdate: number;
  feelsLike: number;
  isDay: boolean;
  nightTemp?: number;
  airQuality?: number;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  city,
  country,
  temperature,
  condition,
  icon,
  humidity,
  windSpeed,
  windGust,
  sunrise,
  sunset,
  unit,
  onUnitChange,
  visibility,
  clouds,
  lastUpdate,
  feelsLike,
  isDay,
  nightTemp,
  airQuality
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      alignItems: 'start'
    }}>
      <motion.div 
        className="glass glass-hover"
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem' 
            }}>{city}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ReactCountryFlag countryCode={country} svg style={{ fontSize: '1.5em' }} />
              <p style={{ color: 'var(--text-secondary)' }}>{country}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)' 
              }}>
                {temperature}°{unit}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  onClick={() => onUnitChange('C')}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: unit === 'C' ? 'var(--primary)' : 'transparent',
                    color: unit === 'C' ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    border: '1px solid var(--primary)',
                  }}
                >
                  °C
                </button>
                <button
                  onClick={() => onUnitChange('F')}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: unit === 'F' ? 'var(--primary)' : 'transparent',
                    color: unit === 'F' ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    border: '1px solid var(--primary)',
                  }}
                >
                  °F
                </button>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'capitalize' }}>
              {condition}
            </p>
          </div>
        </div>
        
        <div className={`weather-animation ${getWeatherClass(condition)}`} style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          margin: '1.5rem 0',
          position: 'relative'
        }}>
          <img 
            src={`https://openweathermap.org/img/wn/${icon}@4x.png`} 
            alt={condition}
            style={{ width: '7rem', height: '7rem', objectFit: 'contain' }}
          />
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginTop: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FiSunrise style={{ color: 'var(--primary)', flexShrink: 0 }} size={20} />
            <span style={{ color: 'var(--text-secondary)' }}>Sunrise: {sunrise}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FiSunset style={{ color: 'var(--accent)', flexShrink: 0 }} size={20} />
            <span style={{ color: 'var(--text-secondary)' }}>Sunset: {sunset}</span>
          </div>
        </div>
      </motion.div>

      <WeatherDetails
        visibility={visibility}
        clouds={clouds}
        windSpeed={windSpeed}
        windGust={windGust}
        lastUpdate={lastUpdate}
        feelsLike={feelsLike}
        humidity={humidity}
        isDay={isDay}
        nightTemp={nightTemp}
        airQuality={airQuality}
      />
    </div>
  );
};

export default WeatherCard; 