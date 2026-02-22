import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiMoon, FiSun, FiWind, FiDroplet, FiThermometer } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Image from 'next/image';
import { displayTemperature } from '@/utils/weatherIcons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AdvancedWeatherInfoProps {
  city: string;
}

interface WeatherAlert {
  headline: string;
  msgtype: string;
  severity: string;
  urgency: string;
  areas: string;
  category: string;
  certainty: string;
  event: string;
  note: string;
  effective: string;
  expires: string;
  desc: string;
  instruction: string;
}

interface MoonPhase {
  moonrise: string;
  moonset: string;
  moonPhase: string;
  moonIllumination: string;
}

interface HourlyForecast {
  time: string;
  tempC: number;
  tempF: number;
  condition: string;
  icon: string;
  windKph: number;
  humidity: number;
  precipMm: number;
  uv: number;
}

const AdvancedWeatherInfo: React.FC<AdvancedWeatherInfoProps> = ({ city }) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  useEffect(() => {
    const fetchAdvancedWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/weather/advanced?city=${encodeURIComponent(city)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch advanced weather data');
        }
        const data = await response.json();
        
        setAlerts(data.alerts);
        setMoonPhase(data.astronomy);
        setHourlyForecast(data.hourlyForecast);
      } catch (error) {
        console.error('Error fetching advanced weather:', error);
        setError(error instanceof Error ? error.message : 'Failed to load advanced weather data');
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      fetchAdvancedWeather();
    }
  }, [city]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        {error}
      </div>
    );
  }

  const hasPrecipitation = hourlyForecast.some(hour => hour.precipMm > 0);

  const chartData = {
    labels: hourlyForecast.slice(1).map(hour => new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric' })),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: hourlyForecast.slice(1).map(hour => hour.tempC),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      ...(hasPrecipitation ? [{
        label: 'Precipitation (mm)',
        data: hourlyForecast.slice(1).map(hour => hour.precipMm),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }] : [])
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          boxWidth: 12,
          padding: 15,
        },
      },
      title: {
        display: true,
        text: '24-Hour Forecast',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: 'rgba(255, 255, 255, 0.7)',
          padding: { top: 0, bottom: 10 },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 8,
        },
      },
      y1: {
        type: 'linear' as const,
        display: hasPrecipitation,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Precipitation (mm)',
          color: 'rgba(255, 255, 255, 0.7)',
          padding: { top: 0, bottom: 10 },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 8,
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 8,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-hover p-6 rounded-xl"
        >
          <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2 mb-4">
            <FiAlertTriangle /> Weather Alerts
          </h3>
          {alerts.map((alert, index) => (
            <div key={index} className="mt-4 first:mt-0 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="font-medium text-red-300">{alert.headline}</p>
              <p className="text-sm mt-2 text-red-200/80">{alert.desc}</p>
              <p className="text-sm mt-2 text-red-200/80">{alert.instruction}</p>
              <p className="text-xs mt-3 text-red-200/60">
                Effective: {new Date(alert.effective).toLocaleString()} - 
                Expires: {new Date(alert.expires).toLocaleString()}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Moon Phase */}
      {moonPhase && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glass-hover p-6 rounded-xl"
        >
          <h3 className="text-xl font-semibold text-blue-400 flex items-center gap-2 mb-4">
            <FiMoon /> Moon Phase
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-200/80">
                  <span className="font-medium text-blue-300">Phase:</span> {moonPhase.moonPhase}
                </p>
                <p className="text-sm text-blue-200/80 mt-2">
                  <span className="font-medium text-blue-300">Illumination:</span> {moonPhase.moonIllumination}%
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-200/80">
                  <span className="font-medium text-blue-300">Moonrise:</span> {moonPhase.moonrise}
                </p>
                <p className="text-sm text-blue-200/80 mt-2">
                  <span className="font-medium text-blue-300">Moonset:</span> {moonPhase.moonset}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hourly Forecast Chart */}
      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gradient">24-Hour Forecast</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="px-3 py-1 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 
                     transition-colors duration-200"
          >
            °{unit}
          </motion.button>
        </div>
        <div className="w-full max-w-3xl mx-auto" style={{ height: '300px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {hourlyForecast.slice(1, 5).map((hour, index) => (
          <div key={index} className="glass glass-hover p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-white/90">
              {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric' })}
            </p>
            <div className="relative w-12 h-12 mx-auto my-2">
              <Image
                src={hour.icon.startsWith('//') ? `https:${hour.icon}` : hour.icon}
                alt={hour.condition}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-lg font-bold text-white">{displayTemperature(hour.tempC, unit)}°{unit === 'C' ? 'C' : 'F'}</p>
            <p className="text-sm text-white/70 capitalize">{hour.condition}</p>
            <div className="mt-2 flex justify-center gap-3 text-sm text-white/60">
              {hour.precipMm > 0 && (
                <div className="flex items-center gap-1">
                  <FiDroplet className="text-blue-400" />
                  <span>{hour.precipMm}mm</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FiWind className="text-gray-400" />
                <span>{hour.windKph}km/h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedWeatherInfo; 