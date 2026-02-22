import { NextResponse } from 'next/server';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  try {
    // Get coordinates from current weather endpoint
    const weatherResponse = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );
    const weatherData = await weatherResponse.json();

    if (weatherData.cod !== 200) {
      return NextResponse.json(
        { error: `Location "${city}" is not supported or could not be found.` },
        { status: 404 }
      );
    }

    // Get 5-day forecast using coordinates
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&units=metric&appid=${API_KEY}`
    );
    const forecastData = await forecastResponse.json();

    if (forecastData.cod !== '200') {
      throw new Error(forecastData.message || 'Failed to fetch forecast data');
    }

    // Process forecast data to get daily forecasts
    const dailyForecasts = forecastData.list.reduce((acc: any[], item: any) => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Find existing day in accumulator
      const existingDay = acc.find(d => d.day === day);
      
      if (existingDay) {
        // Update max/min temperatures
        existingDay.tempMax = Math.max(existingDay.tempMax, item.main.temp_max);
        existingDay.tempMin = Math.min(existingDay.tempMin, item.main.temp_min);
        
        // Update condition if it's a daytime reading (between 9 AM and 6 PM)
        const hour = date.getHours();
        if (hour >= 9 && hour <= 18) {
          existingDay.condition = item.weather[0].description;
          existingDay.icon = item.weather[0].icon;
        }
      } else if (acc.length < 5) { // Only take first 5 days
        acc.push({
          day,
          icon: item.weather[0].icon,
          condition: item.weather[0].description,
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min
        });
      }
      
      return acc;
    }, []);

    return NextResponse.json(dailyForecasts);
  } catch (error) {
    console.error('Forecast API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch forecast data' },
      { status: 500 }
    );
  }
} 