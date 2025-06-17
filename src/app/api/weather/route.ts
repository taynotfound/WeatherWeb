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
    // Get current weather data
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

    // Get additional data in parallel
    const [airQualityResponse, openMeteoResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/air_pollution?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${weatherData.coord.lat}&longitude=${weatherData.coord.lon}&hourly=temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall&current_weather=true&timezone=auto&forecast_days=1`
      )
    ]);

    const [airQualityData, openMeteoData] = await Promise.all([
      airQualityResponse.json(),
      openMeteoResponse.json()
    ]);

    // Get current hour index from Open-Meteo data
    const currentTime = new Date();
    const currentHourIndex = currentTime.getHours();

    // Calculate precipitation data from Open-Meteo
    const precipitation = {
      probability: openMeteoData.hourly.precipitation_probability[currentHourIndex] / 100,
      rain: (
        openMeteoData.hourly.rain[currentHourIndex] +
        openMeteoData.hourly.showers[currentHourIndex]
      ),
      snow: openMeteoData.hourly.snowfall[currentHourIndex],
      total: openMeteoData.hourly.precipitation[currentHourIndex]
    };

    // Get next 24 hours precipitation forecast
    const nextHours = Array.from({ length: 24 }, (_, i) => {
      const index = (currentHourIndex + i) % 24;
      return {
        time: new Date(openMeteoData.hourly.time[index]).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        probability: openMeteoData.hourly.precipitation_probability[index] / 100,
        rain: openMeteoData.hourly.rain[index] + openMeteoData.hourly.showers[index],
        snow: openMeteoData.hourly.snowfall[index],
        total: openMeteoData.hourly.precipitation[index]
      };
    });

    // Find next rain, and highest/lowest precipitation chances
    const precipitationForecast = {
      nextRain: nextHours.find(hour => hour.rain > 0),
      highestChance: nextHours.reduce((max, hour) => 
        hour.probability > max.probability ? hour : max, nextHours[0]),
      lowestChance: nextHours.reduce((min, hour) => 
        hour.probability < min.probability ? hour : min, nextHours[0])
    };

    const formattedResponse = {
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: weatherData.main.temp,
      condition: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      windGust: weatherData.wind.gust,
      windDeg: weatherData.wind.deg,
      sunrise: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      sunset: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      visibility: weatherData.visibility,
      clouds: weatherData.clouds.all,
      dt: weatherData.dt,
      feelsLike: weatherData.main.feels_like,
      pressure: weatherData.main.pressure,
      sunriseTimestamp: weatherData.sys.sunrise,
      sunsetTimestamp: weatherData.sys.sunset,
      airQuality: airQualityData.list?.[0]?.main?.aqi,
      airPollutants: airQualityData.list?.[0]?.components,
      precipitation,
      precipitationForecast,
      lat: weatherData.coord.lat,
      lon: weatherData.coord.lon,
      currentTime: weatherData.dt,
      timezone: weatherData.timezone,
      tempMin: weatherData.main.temp_min,
      tempMax: weatherData.main.temp_max
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