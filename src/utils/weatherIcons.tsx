import { FiSun, FiCloud, FiCloudRain, FiCloudSnow, FiWind } from 'react-icons/fi';
import { WiThunderstorm, WiFog } from 'react-icons/wi';

export function getWeatherIcon(icon: string) {
  const code = icon.slice(0, 2);
  
  switch (code) {
    case '01':
      return FiSun;
    case '02':
    case '03':
    case '04':
      return FiCloud;
    case '09':
    case '10':
      return FiCloudRain;
    case '11':
      return WiThunderstorm;
    case '13':
      return FiCloudSnow;
    case '50':
      return WiFog;
    default:
      return FiWind;
  }
} 