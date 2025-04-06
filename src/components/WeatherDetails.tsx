import React from 'react';
import { motion } from 'framer-motion';
import { FiWind, FiDroplet, FiEye, FiCloud, FiThermometer, FiClock } from 'react-icons/fi';
import { WiDaySunny, WiNightClear } from 'react-icons/wi';
import { MdAir } from 'react-icons/md';

interface WeatherDetailsProps {
  visibility: number;
  clouds: number;
  windSpeed: number;
  windGust?: number;
  lastUpdate: number;
  feelsLike: number;
  humidity: number;
  isDay: boolean;
  nightTemp?: number;
  airQuality?: number;
}

const WeatherDetails: React.FC<WeatherDetailsProps> = ({
  visibility,
  clouds,
  windSpeed,
  windGust,
  lastUpdate,
  feelsLike,
  humidity,
  isDay,
  nightTemp,
  airQuality
}) => {
  const formatVisibility = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAirQualityLabel = (aqi?: number) => {
    if (!aqi) return 'N/A';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <motion.div
      className="glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        padding: '1.5rem',
        borderRadius: '1rem',
        height: 'fit-content',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem'
      }}>
        <motion.div
          className="glass-hover"
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <FiThermometer size={20} />
            <span>Feels Like</span>
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {feelsLike.toFixed(1)}°C
          </div>
          {nightTemp && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {isDay ? <WiNightClear size={16} /> : <WiDaySunny size={16} />}
              <span>{nightTemp.toFixed(1)}°C expected</span>
            </div>
          )}
        </motion.div>

        <motion.div
          className="glass-hover"
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <FiWind size={20} />
            <span>Wind</span>
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {windSpeed.toFixed(1)} m/s
          </div>
          {windGust && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Gusts up to {windGust.toFixed(1)} m/s
            </div>
          )}
        </motion.div>

        <motion.div
          className="glass-hover"
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <FiDroplet size={20} />
            <span>Humidity</span>
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {humidity}%
          </div>
        </motion.div>

        <motion.div
          className="glass-hover"
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <FiEye size={20} />
            <span>Visibility</span>
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {formatVisibility(visibility)}
          </div>
        </motion.div>

        <motion.div
          className="glass-hover"
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <FiCloud size={20} />
            <span>Cloud Cover</span>
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {clouds}%
          </div>
        </motion.div>

        {airQuality && (
          <motion.div
            className="glass-hover"
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              <MdAir size={20} />
              <span>Air Quality</span>
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              {getAirQualityLabel(airQuality)}
            </div>
          </motion.div>
        )}

        <motion.div
          className="glass-hover"
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: 'var(--text-secondary)'
          }}>
            <FiClock size={20} />
            <span>Last Updated</span>
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {formatTime(lastUpdate)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WeatherDetails; 