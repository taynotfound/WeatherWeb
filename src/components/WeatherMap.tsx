import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface WeatherMapProps {
  center: [number, number];
  radarUrl: string;
  hasRadarData: boolean;
}

const WeatherMap: React.FC<WeatherMapProps> = ({ center, radarUrl, hasRadarData }) => {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center,
        zoom: 8,
        zoomControl: true,
        attributionControl: true,
      });

      // Add OpenStreetMap base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView(center);
    }

    // Add or update radar layer
    if (hasRadarData && radarUrl) {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      tileLayerRef.current = L.tileLayer(radarUrl, {
        opacity: 0.6
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, radarUrl, hasRadarData]);

  return <div id="map" style={{ width: '100%', height: '100%' }} />;
};

export default WeatherMap; 