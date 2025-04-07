import React from 'react';
import { motion } from 'framer-motion';
import { FiDroplet, FiWind, FiSunrise, FiSunset, FiClock, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
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

  // Update weather conditions when they change
  React.useEffect(() => {
    updateWeather(condition, isDay, precipitation);
  }, [condition, isDay, updateWeather, precipitation]);

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

  const formatTimeWithTimezone = (timestamp: number, timezone: number) => {
    return new Date((timestamp + timezone) * 1000).toLocaleTimeString(undefined, {
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

  return (
    <div className="weather-card">
      <div className="weather-card-container">
        <motion.div 
          className="weather-card-content glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="weather-card-header">
            <div className="weather-card-location">
              <h2 className="weather-card-city">{city}</h2>
              <div className="weather-card-country">
                <ReactCountryFlag countryCode={country} svg />
                <p>{country}</p>
              </div>
            </div>
            <div className="weather-card-temperature">
              <div className="temperature-display">
                <div className="temperature-value">
                  {temperature}°
                  <div className="temperature-units">
                    <button
                      onClick={() => onUnitChange('C')}
                      className={`unit-button ${unit === 'C' ? 'active' : ''}`}
                    >
                      °C
                    </button>
                    <button
                      onClick={() => onUnitChange('F')}
                      className={`unit-button ${unit === 'F' ? 'active' : ''}`}
                    >
                      °F
                    </button>
                  </div>
                </div>
              </div>
              <div className="weather-condition">{condition}</div>
            </div>
          </div>
          
          <div className="weather-details">
            <div className="weather-details-row">
              <div className="weather-detail-item">
                <FiSunrise className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Sunrise</div>
                  <div className="weather-detail-value">{sunrise}</div>
                </div>
              </div>
              <div className="weather-detail-item">
                <FiSunset className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Sunset</div>
                  <div className="weather-detail-value">{sunset}</div>
                </div>
              </div>
              <div className="weather-detail-item">
                <FiDroplet className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Humidity</div>
                  <div className="weather-detail-value">{humidity}%</div>
                </div>
              </div>
              <div className="weather-detail-item">
                <FiWind className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Wind Speed</div>
                  <div className="weather-detail-value">{windSpeed} m/s</div>
                </div>
              </div>
              {precipitation && precipitation.total > 0 && (
                <div className="weather-detail-item">
                  <FiTrendingUp className="weather-icon" />
                  <div>
                    <div className="weather-detail-label">Precipitation</div>
                    <div className="weather-detail-value">{precipitation.total} mm</div>
                  </div>
                </div>
              )}
              {precipitation && precipitation.probability > 0 && (
                <div className="weather-detail-item">
                  <FiClock className="weather-icon" />
                  <div>
                    <div className="weather-detail-label">Probability</div>
                    <div className="weather-detail-value">{precipitation.probability}%</div>
                  </div>
                </div>
              )}
              {pressure && (
                <div className="weather-detail-item">
                  <FiTrendingDown className="weather-icon" />
                  <div>
                    <div className="weather-detail-label">Pressure</div>
                    <div className="weather-detail-value">{pressure} hPa</div>
                  </div>
                </div>
              )}
              <div className="weather-detail-item">
                <FiClock className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Current Time</div>
                  <div className="weather-detail-value">{formatTimeWithTimezone(currentTime, timezone)}</div>
                </div>
              </div>
              <div className="weather-detail-item">
                <FiClock className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Timezone</div>
                  <div className="weather-detail-value">{formatTimezone(timezone)}</div>
                </div>
              </div>
              <div className="weather-detail-item">
                <FiTrendingDown className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Min Temperature</div>
                  <div className="weather-detail-value">{tempMin}°</div>
                </div>
              </div>
              <div className="weather-detail-item">
                <FiTrendingUp className="weather-icon" />
                <div>
                  <div className="weather-detail-label">Max Temperature</div>
                  <div className="weather-detail-value">{tempMax}°</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Precipitation Forecast Section */}
        {precipitationForecast && (
          <motion.div
            className="glass p-6 rounded-2xl mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-text-primary mb-4">Precipitation Forecast</h3>
            <div className="flex flex-col gap-4">
              {precipitationForecast.nextRain && (
                <div className="flex items-center gap-4 p-4 glass-hover rounded-lg">
                  <FiDroplet size={20} className="text-primary" />
                  <div>
                    <div className="text-text-secondary text-sm">Next Rain</div>
                    <div className="text-text-primary">
                      {precipitationForecast.nextRain.time} ({Math.round(precipitationForecast.nextRain.probability * 100)}%)
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 p-4 glass-hover rounded-lg">
                <FiTrendingDown size={20} className="text-accent" />
                <div>
                  <div className="text-text-secondary text-sm">Lowest Chance</div>
                  <div className="text-text-primary">
                    {precipitationForecast.lowestChance.time} ({Math.round(precipitationForecast.lowestChance.probability * 100)}%)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 glass-hover rounded-lg">
                <FiTrendingUp size={20} className="text-primary" />
                <div>
                  <div className="text-text-secondary text-sm">Highest Chance</div>
                  <div className="text-text-primary">
                    {precipitationForecast.highestChance.time} ({Math.round(precipitationForecast.highestChance.probability * 100)}%)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard; 