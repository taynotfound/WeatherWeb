'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import type { WeatherData } from '@/services/weatherApi';

interface TomatoProps {
  weather?: WeatherData;
  onChat?: () => void;
}

export default function Tomato({ weather, onChat }: TomatoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState('');
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    // Show Tomato after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (weather) {
      // Calculate if it's day or night
      const currentTime = weather.currentTime * 1000; // Convert to milliseconds
      const isDay = currentTime >= weather.sunriseTimestamp * 1000 && 
                   currentTime <= weather.sunsetTimestamp * 1000;

      // Generate a weather-related message
      const messages = [
        `It's ${weather.condition.toLowerCase()} in ${weather.city}!`,
        `Temperature: ${Math.round(weather.temperature)}°C`,
        `Humidity: ${weather.humidity}%`,
        isDay ? 'Have a sunny day! ☀️' : 'Sweet dreams! 🌙',
      ];
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, [weather]);

  // Random bounce animation
  useEffect(() => {
    const bounceInterval = setInterval(() => {
      if (!isHovered) {
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 1000);
      }
    }, 5000);

    return () => clearInterval(bounceInterval);
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="relative">
            {/* Speech Bubble */}
            <AnimatePresence>
              {isHovered && message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute bottom-full right-0 mb-4 p-4 bg-white/10 backdrop-blur-lg 
                           rounded-lg text-white max-w-xs shadow-lg"
                >
                  <p className="text-sm">{message}</p>
                  <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 
                                w-3 h-3 bg-white/10"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tomato Character */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={isBouncing ? {
                y: [0, -10, 0],
                transition: {
                  duration: 0.5,
                  ease: "easeInOut"
                }
              } : {}}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              className="relative cursor-pointer"
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Image
                  src="/tomato.svg"
                  alt="Tomato the Weather Rabbit"
                  width={80}
                  height={80}
                  className="drop-shadow-lg"
                />
              </motion.div>
              
              {/* Chat Button */}
              {onChat && (
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onChat}
                  className="absolute -top-2 -right-2 p-2 rounded-full bg-purple-500 
                           text-white shadow-lg hover:bg-purple-600 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 