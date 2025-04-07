'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import WeatherAnimation from './WeatherAnimation';

interface WeatherCondition {
  type: string;
  intensity?: 'light' | 'moderate' | 'heavy';
  probability?: number;
}

interface WeatherContextType {
  updateWeather: (condition: string, isDay: boolean, precipitation?: { probability: number }) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}

interface WeatherProviderProps {
  children: ReactNode;
}

function WeatherProvider({ children }: WeatherProviderProps) {
  const [conditions, setConditions] = useState<WeatherCondition[]>([]);
  const [isDay, setIsDay] = useState(true);

  const parseWeatherConditions = useCallback((condition: string, precipitation?: { probability: number }): WeatherCondition[] => {
    if (!condition) return [];
    
    const conditions: WeatherCondition[] = [];
    const lowerCondition = condition.toLowerCase();
    const probability = precipitation?.probability || 0;

    // Show rain animation if precipitation probability is over 5%
    if (probability > 0.05) {
      conditions.push({ 
        type: 'rain', 
        intensity: probability > 0.8 ? 'heavy'
          : probability > 0.5 ? 'moderate'
          : 'light',
        probability
      });
    }
    // Only add condition-based weather if no precipitation probability
    else if (lowerCondition.includes('rain')) {
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
  }, []);

  const updateWeather = useCallback((condition: string, isDayTime: boolean, precipitation?: { probability: number }) => {
    setConditions(parseWeatherConditions(condition, precipitation));
    setIsDay(isDayTime);
  }, [parseWeatherConditions]);

  return (
    <WeatherContext.Provider value={{ updateWeather }}>
      <WeatherAnimation conditions={conditions} isDay={isDay} />
      {children}
    </WeatherContext.Provider>
  );
}

export { WeatherProvider as default, useWeather, type WeatherCondition }; 