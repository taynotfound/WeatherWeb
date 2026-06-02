// WMO Weather interpretation codes → label + icon name + gradient
export type WeatherInfo = {
  label: string;
  icon: 'sun' | 'cloud' | 'cloud-sun' | 'cloud-rain' | 'cloud-drizzle' | 'cloud-snow' | 'cloud-lightning' | 'cloud-fog' | 'moon' | 'cloud-moon';
  gradient: [string, string, string]; // 3-stop gradient for the orb
};

export function getWeatherInfo(code: number, isDay = 1): WeatherInfo {
  const day = isDay === 1;
  switch (code) {
    case 0:
      return day
        ? { label: 'Clear', icon: 'sun', gradient: ['#fbbf24', '#f59e0b', '#dc2626'] }
        : { label: 'Clear', icon: 'moon', gradient: ['#312e81', '#1e1b4b', '#0a0a0f'] };
    case 1:
      return day
        ? { label: 'Mostly Clear', icon: 'sun', gradient: ['#fcd34d', '#fb923c', '#a78bfa'] }
        : { label: 'Mostly Clear', icon: 'moon', gradient: ['#4338ca', '#312e81', '#0a0a0f'] };
    case 2:
      return day
        ? { label: 'Partly Cloudy', icon: 'cloud-sun', gradient: ['#7dd3fc', '#a78bfa', '#6366f1'] }
        : { label: 'Partly Cloudy', icon: 'cloud-moon', gradient: ['#4338ca', '#312e81', '#0a0a0f'] };
    case 3:
      return { label: 'Overcast', icon: 'cloud', gradient: ['#94a3b8', '#64748b', '#334155'] };
    case 45:
    case 48:
      return { label: 'Foggy', icon: 'cloud-fog', gradient: ['#cbd5e1', '#94a3b8', '#475569'] };
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle', icon: 'cloud-drizzle', gradient: ['#60a5fa', '#3b82f6', '#1e3a8a'] };
    case 56:
    case 57:
      return { label: 'Freezing Drizzle', icon: 'cloud-drizzle', gradient: ['#93c5fd', '#60a5fa', '#2563eb'] };
    case 61:
    case 63:
    case 65:
      return { label: 'Rain', icon: 'cloud-rain', gradient: ['#3b82f6', '#1d4ed8', '#1e1b4b'] };
    case 66:
    case 67:
      return { label: 'Freezing Rain', icon: 'cloud-rain', gradient: ['#93c5fd', '#60a5fa', '#1e40af'] };
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: 'Snow', icon: 'cloud-snow', gradient: ['#f0f9ff', '#bae6fd', '#7dd3fc'] };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain Showers', icon: 'cloud-rain', gradient: ['#60a5fa', '#3b82f6', '#1e3a8a'] };
    case 85:
    case 86:
      return { label: 'Snow Showers', icon: 'cloud-snow', gradient: ['#f1f5f9', '#cbd5e1', '#94a3b8'] };
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', icon: 'cloud-lightning', gradient: ['#a855f7', '#7c3aed', '#1e1b4b'] };
    default:
      return { label: 'Unknown', icon: 'cloud', gradient: ['#94a3b8', '#64748b', '#334155'] };
  }
}

export function formatTime(iso: string, timezone?: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
}

export function formatHour(iso: string, timezone?: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    timeZone: timezone,
  });
}

export function formatDay(iso: string, timezone?: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: timezone,
  });
}

export function windDirection(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
