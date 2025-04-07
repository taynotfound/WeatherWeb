import { FC } from 'react';

interface WeatherMapProps {
  center: [number, number];
  radarUrl: string;
  hasRadarData: boolean;
}

declare const WeatherMap: FC<WeatherMapProps>;
export default WeatherMap; 