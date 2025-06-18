import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WeatherData } from '@/services/weatherApi';

interface WeatherMapProps {
  weather: WeatherData;
}

const WeatherMap = ({ weather }: WeatherMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [radarLayer, setRadarLayer] = useState<L.TileLayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default center coordinates (can be adjusted based on your needs)
  const defaultCenter: [number, number] = [51.1657, 10.4515]; // Center of Germany

  // Use weather coordinates if available, otherwise use default
  const center = useMemo(() => {
    return weather?.lat && weather?.lon 
      ? [weather.lat, weather.lon] as [number, number]
      : defaultCenter;
  }, [weather?.lat, weather?.lon, defaultCenter]);

  useEffect(() => {
    if (!mapRef.current) {
      try {
        mapRef.current = L.map('map', {
          center,
          zoom: 8,
          zoomControl: true,
          attributionControl: true,
          minZoom: 3,
          maxZoom: 10
        });

        // Add base tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '©OpenStreetMap, ©CartoDB',
          maxZoom: 19
        }).addTo(mapRef.current);

        setMap(mapRef.current);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center]);

  useEffect(() => {
    const fetchRadarData = async () => {
      if (!map) return;

      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();

        if (!data || !data.radar || !data.radar.past || data.radar.past.length === 0) {
          throw new Error('Invalid radar data received');
        }

        // Get the most recent radar frame
        const latestFrame = data.radar.past[data.radar.past.length - 1];
        const radarUrl = `${data.host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

        // Remove existing radar layer if it exists
        if (radarLayer) {
          map.removeLayer(radarLayer);
        }

        // Add new radar layer
        const newRadarLayer = L.tileLayer(radarUrl, {
          opacity: 0.7,
          attribution: '©RainViewer'
        }).addTo(map);

        setRadarLayer(newRadarLayer);
      } catch (err) {
        console.error('Error fetching radar data:', err);
        setError('Failed to load weather radar data');
      }
    };

    if (map) {
      fetchRadarData();
    }
  }, [map, radarLayer]);

  if (isLoading) {
    return (
      <div className="glass glass-hover p-4 rounded-xl h-[400px] flex items-center justify-center">
        <div className="text-white/70">Loading map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass glass-hover p-4 rounded-xl h-[400px] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="glass glass-hover p-4 rounded-xl">
      <div id="map" className="h-[400px] rounded-lg" />
    </div>
  );
};

export default WeatherMap; 