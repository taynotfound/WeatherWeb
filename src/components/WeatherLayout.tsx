import React from 'react';
import { useEffect, useState } from 'react';
import WeatherCard from './WeatherCard';
import WeatherMap from './WeatherMap';
import WeatherRadar from './WeatherRadar';
import ForecastCard from './ForecastCard';
import WeatherDetails from './WeatherDetails';

interface WeatherLayoutProps {
  weatherData: any;
  mapData?: any;
  radarData?: any;
  forecastData?: any;
  detailsData?: any;
}

const WeatherLayout: React.FC<WeatherLayoutProps> = ({
  weatherData,
  mapData,
  radarData,
  forecastData,
  detailsData,
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Define breakpoints for different layouts
  const isDesktop = windowWidth > 1200;
  const isTablet = windowWidth > 768 && windowWidth <= 1200;
  const isMobile = windowWidth <= 768;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isDesktop 
        ? 'repeat(3, 1fr)' 
        : isTablet 
          ? 'repeat(2, 1fr)' 
          : '1fr',
      gap: '1rem',
      maxWidth: '1400px',
      margin: '0',
    }}>
      <div style={{
        gridColumn: isDesktop ? 'span 1' : isTablet ? 'span 1' : 'span 1',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <WeatherCard {...weatherData} />
      </div>

      <div style={{
        gridColumn: isDesktop ? 'span 1' : isTablet ? 'span 1' : 'span 1',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <WeatherDetails {...detailsData} />
      </div>

      <div style={{
        gridColumn: isDesktop ? 'span 1' : 'span 2',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <WeatherMap {...mapData} />
        <WeatherRadar {...radarData} />
      </div>

      <div style={{
        gridColumn: isDesktop ? 'span 3' : 'span 2',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <ForecastCard {...forecastData} />
      </div>
    </div>
  );
};

export default WeatherLayout; 