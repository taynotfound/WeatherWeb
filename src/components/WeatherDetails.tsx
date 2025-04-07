import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiWind, FiDroplet, FiEye, FiCloud, FiThermometer, FiClock } from 'react-icons/fi';
import { WiDaySunny, WiNightClear } from 'react-icons/wi';
import { MdAir } from 'react-icons/md';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

interface WeatherMapProps {
  center: [number, number];
  radarUrl: string;
  hasRadarData: boolean;
}

const Map = dynamic<WeatherMapProps>(
  () => import('./WeatherMap').then((mod) => mod.default),
  { ssr: false }
);

interface WeatherDetailsProps {
  visibility: number;
  clouds: number;
  windSpeed: number;
  windGust?: number;
  windDeg?: number;
  lastUpdate: number;
  feelsLike: number;
  humidity: number;
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
  unit: string;
  onUnitChange: (unit: 'C' | 'F') => void;
}

interface RadarFrame {
  path: string;
  time: number;
}

const WeatherDetails: React.FC<WeatherDetailsProps> = ({
  visibility,
  clouds,
  windSpeed,
  windGust,
  windDeg,
  lastUpdate,
  feelsLike,
  humidity,
  pressure,
  precipitation,
  isDay,
  nightTemp,
  airQuality,
  airPollutants,
  lat,
  lon,
  unit,
  onUnitChange
}) => {
  const [currentFrame, setCurrentFrame] = useState<RadarFrame | null>(null);

  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        
        if (data.radar.past.length > 0) {
          setCurrentFrame(data.radar.past[data.radar.past.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching radar data:', error);
      }
    };

    fetchRadarData();
    const interval = setInterval(fetchRadarData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getRadarUrl = () => {
    if (!currentFrame) return '';
    const baseUrl = 'https://tilecache.rainviewer.com';
    return `${baseUrl}${currentFrame.path}/256/{z}/{x}/{y}/4/1_1.png`;
  };

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
  console.log(precipitation)
  return (
    <>
      <motion.div
        className="glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          width: '100%'
        }}
      >
        <div className="weather-details-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem'
        }}>
          <motion.div
            className="glass-hover"
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '1.5rem',
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
              fontSize: '1.5rem',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              {feelsLike}°{unit}
            </div>
          </motion.div>

          <motion.div
            className="glass-hover"
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '1.5rem',
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
              fontSize: '1.5rem',
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
                Gusts: {windGust.toFixed(1)} m/s
              </div>
            )}
          </motion.div>

          <motion.div
            className="glass-hover"
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '1.5rem',
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
              fontSize: '1.5rem',
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
              padding: '1.5rem',
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
              fontSize: '1.5rem',
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
              padding: '1.5rem',
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
              fontSize: '1.5rem',
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
                padding: '1.5rem',
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
                fontSize: '1.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                {getAirQualityLabel(airQuality)}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          height: '400px',
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          color: 'var(--text-secondary)'
        }}>
          <span className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 500 }}>Weather Radar</span>
        </div>
        {typeof window !== 'undefined' && (
          <div style={{ height: 'calc(100% - 2rem)', width: '100%', position: 'relative' }}>
            <Map
              center={[lat, lon]}
              radarUrl={getRadarUrl()}
              hasRadarData={!!currentFrame}
            />
            <div style={{
              position: 'absolute',
              bottom: '0.5rem',
              right: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              zIndex: 1000
            }}>
              Powered by RainViewer
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default WeatherDetails; 