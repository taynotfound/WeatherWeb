'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

export default function About() {
  return (
    <main style={{
      minHeight: '100vh',
      padding: '2.5rem 1rem',
      maxWidth: '64rem',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    }}>
      <Link
        href="/"
        className="glass-hover"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          marginBottom: '2rem'
        }}
      >
        <FiArrowLeft /> Back to Weather
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass"
        style={{
          padding: '2rem',
          borderRadius: '1rem',
        }}
      >
        <h1 className="text-gradient" style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem'
        }}>
          About WeatherWeb
        </h1>

        <div style={{ color: 'var(--text-primary)' }}>
          <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
            WeatherWeb is a modern weather application that provides real-time weather information and forecasts. 
            It features a beautiful glassmorphic design and intuitive user interface to help you stay informed about weather conditions.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>
            Data Sources
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>OpenWeather API</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The primary weather data, including current conditions, forecasts, and air quality information, 
                is provided by OpenWeather API. This ensures reliable and accurate weather information for locations worldwide.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>RainViewer API</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Real-time precipitation radar data is powered by RainViewer API, offering detailed precipitation maps 
                and animations to help visualize weather patterns.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Open-Meteo API</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Additional precipitation data and detailed weather metrics are sourced from Open-Meteo API, 
                providing high-precision weather forecasts and historical data.
              </p>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>
            Features
          </h2>

          <ul style={{ 
            listStyle: 'disc', 
            paddingLeft: '1.5rem', 
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <li>Real-time weather conditions</li>
            <li>5-day weather forecast</li>
            <li>Precipitation radar with animations</li>
            <li>Air quality information</li>
            <li>Detailed weather metrics (humidity, wind, visibility, etc.)</li>
            <li>Temperature unit conversion (Celsius/Fahrenheit)</li>
            <li>Responsive design for all devices</li>
          </ul>
        </div>
      </motion.div>
    </main>
  );
} 