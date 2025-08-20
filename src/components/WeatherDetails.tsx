import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiWind, FiDroplet, FiEye, FiCloud, FiThermometer, FiClock } from 'react-icons/fi';
import { WiDaySunny, WiNightClear } from 'react-icons/wi';
import { MdAir } from 'react-icons/md';
// ...existing code...
import { WeatherData } from '@/services/weatherApi';
import { displayTemperature } from '@/utils/weatherIcons';

// ...existing code...

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
        className="weather-details-container glass p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="weather-details-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            className="weather-detail-card glass-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="weather-detail-header">
              <FiThermometer className="weather-detail-icon" />
              <span className="weather-detail-label">Feels Like</span>
            </div>
            <div className="weather-detail-value">
              {displayTemperature(feelsLike, unit as 'C' | 'F')}°{unit}
            </div>
          </motion.div>

          <motion.div
            className="weather-detail-card glass-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="weather-detail-header">
              <FiWind className="weather-detail-icon" />
              <span className="weather-detail-label">Wind</span>
            </div>
            <div className="weather-detail-value">
              {windSpeed ? (windSpeed / 3.6).toFixed(1) : '--'} m/s
            </div>
            {windGust && (
              <div className="weather-detail-subtext">
                Gust: {(windGust / 3.6).toFixed(1)} m/s
              </div>
            )}
          </motion.div>

          <motion.div
            className="weather-detail-card glass-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="weather-detail-header">
              <FiDroplet className="weather-detail-icon" />
              <span className="weather-detail-label">Humidity</span>
            </div>
            <div className="weather-detail-value">
              {humidity}%
            </div>
          </motion.div>

          <motion.div
            className="weather-detail-card glass-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="weather-detail-header">
              <FiEye className="weather-detail-icon" />
              <span className="weather-detail-label">Visibility</span>
            </div>
            <div className="weather-detail-value">
              {formatVisibility(visibility)}
            </div>
          </motion.div>

          <motion.div
            className="weather-detail-card glass-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="weather-detail-header">
              <FiCloud className="weather-detail-icon" />
              <span className="weather-detail-label">Clouds</span>
            </div>
            <div className="weather-detail-value">
              {clouds}%
            </div>
          </motion.div>

          {pressure && (
            <motion.div
              className="weather-detail-card glass-hover"
              whileHover={{ scale: 1.02 }}
            >
              <div className="weather-detail-header">
                <MdAir className="weather-detail-icon" />
                <span className="weather-detail-label">Pressure</span>
              </div>
              <div className="weather-detail-value">
                {pressure} hPa
              </div>
            </motion.div>
          )}

          {airQuality && (
            <motion.div
              className="weather-detail-card glass-hover"
              whileHover={{ scale: 1.02 }}
            >
              <div className="weather-detail-header">
                <FiThermometer className="weather-detail-icon" />
                <span className="weather-detail-label">Air Quality</span>
              </div>
              <div className="weather-detail-value">
                {airQuality} - {getAirQualityLabel(airQuality)}
              </div>
            </motion.div>
          )}

          <motion.div
            className="weather-detail-card glass-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="weather-detail-header">
              <FiClock className="weather-detail-icon" />
              <span className="weather-detail-label">Last Update</span>
            </div>
            <div className="weather-detail-value">
              {formatTime(lastUpdate)}
            </div>
          </motion.div>
        </div>

        
      </motion.div>
  {/* Map removed */}
    </>
  );
};

export default WeatherDetails; 