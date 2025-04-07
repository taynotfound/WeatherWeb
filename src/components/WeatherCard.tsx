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

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div 
          className="glass"
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
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
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ 
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {temperature}°
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      marginLeft: '0.5rem'
                    }}>
                      <button
                        onClick={() => onUnitChange('C')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          color: unit === 'C' ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: unit === 'C' ? 'bold' : 'normal'
                        }}
                      >
                        °C
                      </button>
                      <button
                        onClick={() => onUnitChange('F')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          color: unit === 'F' ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: unit === 'F' ? 'bold' : 'normal'
                        }}
                      >
                        °F
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '1.25rem',
                  marginTop: '0.5rem',
                  textTransform: 'capitalize'
                }}>
                  {condition}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FiSunrise style={{ color: 'var(--primary)', flexShrink: 0 }} size={24} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sunrise</div>
                  <div style={{ color: 'var(--text-primary)' }}>{sunrise}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FiSunset style={{ color: 'var(--accent)', flexShrink: 0 }} size={24} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sunset</div>
                  <div style={{ color: 'var(--text-primary)' }}>{sunset}</div>
                </div>
              </div>
            </div>

            {precipitation && (precipitation.total > 0 || precipitation.probability > 0) && (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '0.75rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Precipitation</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500 }}>
                    {Math.round(precipitation.probability * 100)}%
                  </div>
                </div>
                {precipitation.total > 0 && (
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Amount</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500 }}>
                      {precipitation.total.toFixed(1)}mm
                    </div>
                  </div>
                )}
              </div>
            )}

            {pressure && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '0.75rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pressure</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500 }}>
                    {pressure} hPa
                  </div>
                </div>
              </div>
            )}
          </div>
          { /* Last Update Section */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginTop: '2rem' 
            }}>
                <FiClock style={{ color: 'var(--text-secondary)' }} size={24} />
                <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Last Update</div>
                <div style={{ color: 'var(--text-primary)' }}>
                    {new Date(lastUpdate * 1000).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short'
                    })}
                </div>
                </div>
            </div>
        </motion.div>

      

        {/* Precipitation Forecast Section */}
        {precipitationForecast && (
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              width: '100%'
            }}
          >
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 500, 
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              Precipitation Forecast
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {precipitationForecast.nextRain && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '0.5rem'
                }}>
                  <FiDroplet size={20} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Next Rain</div>
                    <div style={{ color: 'var(--text-primary)' }}>
                      {precipitationForecast.nextRain.time} ({Math.round(precipitationForecast.nextRain.probability * 100)}%)
                    </div>
                  </div>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '0.5rem'
              }}>
                <FiTrendingDown size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Lowest Chance</div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {precipitationForecast.lowestChance.time} ({Math.round(precipitationForecast.lowestChance.probability * 100)}%)
                  </div>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '0.5rem'
              }}>
                <FiTrendingUp size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Highest Chance</div>
                  <div style={{ color: 'var(--text-primary)' }}>
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