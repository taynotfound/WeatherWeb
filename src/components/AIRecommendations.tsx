import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiCloud, FiUmbrella, FiWind } from 'react-icons/fi';
import { WeatherData } from '@/services/weatherApi';
import { getAIRecommendations } from '@/services/aiService';

interface AIRecommendationsProps {
  weather: WeatherData;
}

export default function AIRecommendations({ weather }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{
    clothing: string[];
    activities: string[];
    tips: string[];
  } | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWeatherKey, setLastWeatherKey] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<{
    clothing: string[];
    activities: string[];
    tips: string[];
  } | string | null>(null);

  useEffect(() => {
    if (!weather || !weather.city) return;
    const weatherKey = `${weather.city}_${weather.condition}_${weather.temperature}`;
    if (lastWeatherKey === weatherKey && lastResponse) {
      setRecommendations(lastResponse);
      return;
    }
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAIRecommendations(weather);
        setRecommendations(data);
        setLastResponse(data);
        setLastWeatherKey(weatherKey);
      } catch (err) {
        setError('Failed to load recommendations');
        console.error(err);
        if (lastResponse) {
          setRecommendations(lastResponse);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [weather, lastResponse, lastWeatherKey]);

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
          <div className="h-4 bg-white/10 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 rounded-xl border border-red-500/20 text-red-500">
        {error}
      </div>
    );
  }

  if (!recommendations) return null;

  let isEmpty = false;
  if (typeof recommendations === 'string') {
    isEmpty = recommendations.trim().length === 0;
  } else {
    isEmpty =
      (!recommendations.clothing || recommendations.clothing.length === 0) &&
      (!recommendations.activities || recommendations.activities.length === 0) &&
      (!recommendations.tips || recommendations.tips.length === 0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass p-6 rounded-xl"
    >
      <h2 className="text-2xl font-semibold mb-6 text-gradient">AI Recommendations</h2>
      {isEmpty ? (
        <div className="text-white/70">No recommendations available for the current weather.</div>
      ) : typeof recommendations === 'string' ? (
        <pre className="bg-black/20 text-white/80 p-4 rounded-xl whitespace-pre-wrap">{recommendations}</pre>
      ) : (
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FiSun className="text-yellow-400" />
              <h3 className="text-lg font-medium">What to Wear</h3>
            </div>
            <ul className="space-y-2">
              {recommendations.clothing.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <FiCloud className="text-blue-400" />
              <h3 className="text-lg font-medium">Suggested Activities</h3>
            </div>
            <ul className="space-y-2">
              {recommendations.activities.map((activity, index) => (
                <li key={index} className="flex items-center gap-2 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  {activity}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <FiUmbrella className="text-purple-400" />
              <h3 className="text-lg font-medium">Weather Tips</h3>
            </div>
            <ul className="space-y-2">
              {recommendations.tips.map((tip, index) => (
                <li key={index} className="flex items-center gap-2 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </motion.div>
  );
} 