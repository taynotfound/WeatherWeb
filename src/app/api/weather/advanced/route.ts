import { NextResponse } from 'next/server';

const WEATHER_API_KEY = process.env.WEATHER_API;
const BASE_URL = 'https://api.weatherapi.com/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  try {
    // Get alerts, astronomy (moon phases), and hourly forecast in parallel
    const [alertsResponse, astronomyResponse, forecastResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&alerts=yes`
      ),
      fetch(
        `${BASE_URL}/astronomy.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}`
      ),
      fetch(
        `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=1&aqi=no&alerts=no`
      )
    ]);

    const [alertsData, astronomyData, forecastData] = await Promise.all([
      alertsResponse.json(),
      astronomyResponse.json(),
      forecastResponse.json()
    ]);

    // Format the response
    const formattedResponse = {
      alerts: alertsData.alerts?.alert || [],
      astronomy: {
        moonrise: astronomyData.astronomy.astro.moonrise,
        moonset: astronomyData.astronomy.astro.moonset,
        moonPhase: astronomyData.astronomy.astro.moon_phase,
        moonIllumination: astronomyData.astronomy.astro.moon_illumination
      },
      hourlyForecast: forecastData.forecast.forecastday[0].hour.map((hour: any) => ({
        time: hour.time,
        tempC: hour.temp_c,
        tempF: hour.temp_f,
        condition: hour.condition.text,
        icon: hour.condition.icon,
        windKph: hour.wind_kph,
        windMph: hour.wind_mph,
        windDegree: hour.wind_degree,
        windDir: hour.wind_dir,
        pressureMb: hour.pressure_mb,
        precipMm: hour.precip_mm,
        precipIn: hour.precip_in,
        humidity: hour.humidity,
        cloud: hour.cloud,
        feelslikeC: hour.feelslike_c,
        feelslikeF: hour.feelslike_f,
        visKm: hour.vis_km,
        visMiles: hour.vis_miles,
        uv: hour.uv,
        gustKph: hour.gust_kph,
        gustMph: hour.gust_mph
      }))
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 