'use client';
import Link from 'next/link';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiGithub, FiStar, FiSearch, FiClock, FiShare2, FiMapPin } from 'react-icons/fi';
import SearchBar from '@/components/SearchBar';
import WeatherCard from '@/components/WeatherCard';
import WeatherDetails from '@/components/WeatherDetails';
import ForecastCard from '@/components/ForecastCard';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import WeatherRadar from '@/components/WeatherRadar';
import { getCurrentWeather, getForecast, WeatherData, ForecastData } from '@/services/weatherApi';
import WeatherAnimation from '@/components/WeatherAnimation';
import AIRecommendations from '@/components/AIRecommendations';
import FavoritesSidebar from '@/components/FavoritesSidebar';
import AIChatWidget from '@/components/AIChatWidget';
import { useFavorites } from '@/components/FavoritesContext';
import { useRouter } from 'next/navigation';
import Tomato from '@/components/Tomato';

type LoadingState = Set<string>;

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteWeather, setFavoriteWeather] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState<LoadingState>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { favorites, removeFavorite } = useFavorites();

  const fetchWeather = useCallback(async (city: string) => {
    try {
      setLoading(prev => new Set(prev).add(city));
      const data = await getCurrentWeather(city);
      setFavoriteWeather(prev => ({ ...prev, [city]: data }));
    } catch (error) {
      console.error(`Failed to fetch weather for ${city}:`, error);
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(city);
        return newSet;
      });
    }
  }, []);

  useEffect(() => {
    // Load recent searches from localStorage
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);

    // Fetch weather for favorites
    favorites.forEach(city => {
      if (!favoriteWeather[city]) {
        fetchWeather(city);
      }
    });
  }, [favorites, fetchWeather]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/weather?city=${encodeURIComponent(search.trim())}`);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold mb-4 text-gradient">
            WeatherWeb
          </h1>
          <p className="text-xl text-white/70">
            Your AI-powered weather companion
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <SearchBar
            onCitySelect={(city) => {
              if (city) {
                router.push(`/weather?city=${encodeURIComponent(city)}`);
              }
            }}
          />
        </motion.div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FiMapPin className="text-purple-400" />
              Favorite Cities
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {favorites.map((city) => (
                <motion.div
                  key={city}
                  variants={item}
                  className="glass glass-hover p-6 rounded-xl cursor-pointer 
                           transition-all duration-200 hover:scale-105"
                  onClick={() => router.push(`/weather?city=${encodeURIComponent(city)}`)}
                >
                  {loading.has(city) ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : favoriteWeather[city] ? (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{city}</h3>
                          <p className="text-white/70">
                            {favoriteWeather[city].condition}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(city);
                          }}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 
                                   transition-colors duration-200"
                        >
                          <FiMapPin className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-3xl font-bold">
                        {Math.round(favoriteWeather[city].temperature)}°C
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-white/70">
                      Failed to load weather data
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FiClock className="text-purple-400" />
              Recent Searches
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {recentSearches.map((city) => (
                <motion.div
                  key={city}
                  variants={item}
                  className="glass glass-hover p-6 rounded-xl cursor-pointer 
                           transition-all duration-200 hover:scale-105"
                  onClick={() => router.push(`/weather?city=${encodeURIComponent(city)}`)}
                >
                  <h3 className="text-xl font-semibold">{city}</h3>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-white/60">
          <div className="flex justify-center gap-4 mb-4">
            <Link
              href="/about"
              className="glass glass-hover px-6 py-3 rounded-lg text-white no-underline 
                       transition-all duration-200 hover:scale-105"
            >
              About WeatherWeb
            </Link>
            <a
              href="https://github.com/taygotfound/weatherweb"
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover px-6 py-3 rounded-lg text-white no-underline 
                       flex items-center justify-center gap-2 transition-all duration-200 
                       hover:scale-105"
            >
              <FiGithub size={16} />
              View on GitHub
            </a>
          </div>
          <p>Powered by AI and ❤️</p>
        </footer>
      </main>

      {/* Tomato Character */}
      <Tomato onChat={() => setIsChatOpen(true)} />

      {/* AI Chat Widget */}
      <AIChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
