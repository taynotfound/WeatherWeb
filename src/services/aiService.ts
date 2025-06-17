import { WeatherData } from './weatherApi';
import { setCache, getCache } from './cache';

interface AIResponse {
  clothing: string[];
  activities: string[];
  tips: string[];
}

export async function getAIRecommendations(weather: WeatherData): Promise<AIResponse> {
  const cacheKey = `ai_${weather.city}_${weather.condition}_${weather.temperature}`;
  const cached = getCache<AIResponse>(cacheKey);
  if (cached) return cached;

  const prompt = `Given the following weather conditions:
    Temperature: ${weather.temperature}°C
    Condition: ${weather.condition}
    Humidity: ${weather.humidity}%
    Wind Speed: ${weather.windSpeed} m/s
    Precipitation: ${weather.precipitation} mm
    
    Please provide:
    1. A list of appropriate clothing items
    2. Suggested activities for this weather
    3. Weather-related tips and precautions
    
    Format the response as a JSON object with arrays for clothing, activities, and tips.`;

  try {
    const response = await fetch('https://api.webraft.in/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful weather assistant that provides personalized recommendations based on weather conditions. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const content = data.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(content);
      
      // Validate the response structure
      if (!Array.isArray(parsedResponse.clothing) || 
          !Array.isArray(parsedResponse.activities) || 
          !Array.isArray(parsedResponse.tips)) {
        throw new Error('Invalid response structure');
      }

      setCache(cacheKey, parsedResponse, 30);
      return parsedResponse;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Return a fallback response if parsing fails
      const fallbackResponse = {
        clothing: [
          'Light jacket or sweater',
          'Comfortable walking shoes',
          'Weather-appropriate layers'
        ],
        activities: [
          'Outdoor activities',
          'Walking or hiking',
          'Local sightseeing'
        ],
        tips: [
          'Stay hydrated',
          'Check weather updates regularly',
          'Dress in layers for changing conditions'
        ]
      };
      setCache(cacheKey, fallbackResponse, 30);
      return fallbackResponse;
    }
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    // Return a fallback response on error
    const fallbackResponse = {
      clothing: [
        'Light jacket or sweater',
        'Comfortable walking shoes',
        'Weather-appropriate layers'
      ],
      activities: [
        'Outdoor activities',
        'Walking or hiking',
        'Local sightseeing'
      ],
      tips: [
        'Stay hydrated',
        'Check weather updates regularly',
        'Dress in layers for changing conditions'
      ]
    };
    setCache(cacheKey, fallbackResponse, 30);
    return fallbackResponse;
  }
} 