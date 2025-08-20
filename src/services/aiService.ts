import { WeatherData } from './weatherApi';
import { setCache, getCache } from './cache';

interface AIResponse {
  clothing: string[];
  activities: string[];
  tips: string[];
}

export async function getAIRecommendations(weather: WeatherData): Promise<AIResponse> {
  // No caching, always call the AI

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Given the following weather conditions:
    City: ${weather.city}
    Date: ${today}
    Temperature: ${weather.temperature}°C
    Condition: ${weather.condition}
    Humidity: ${weather.humidity}%
    Wind Speed: ${weather.windSpeed} m/s
    Precipitation: ${weather.precipitation} mm

    Please provide:
    1. A list of appropriate clothing items
    2. Suggested activities for this weather
    3. Weather-related tips and precautions
    4. If possible, suggest some local events happening in ${weather.city} on ${today} or in the next few days. (if you know any, otherwise say 'No local events found').

    Format the response as a JSON object with arrays for clothing, activities, tips, and localEvents.`;

  try {
    const response = await fetch('https://api.webraft.in/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer wr-P5vKkHsI42aGQGZeTy6z9m`
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

      let content = data.choices[0].message.content;
      // Remove code block markers if present
      content = content.trim();
      if (content.startsWith('```')) {
        content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
      }
    
    try {
      console.log('AI Response:', content);
      const parsedResponse = JSON.parse(content);
      
      // Validate the response structure
      if (!Array.isArray(parsedResponse.clothing) || 
          !Array.isArray(parsedResponse.activities) || 
          !Array.isArray(parsedResponse.tips)) {
        throw new Error('Invalid response structure');
      }

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
  return fallbackResponse;
  }
} 