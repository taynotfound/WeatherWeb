'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import Image from 'next/image';
import type { WeatherData } from '@/services/weatherApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  weather?: WeatherData;
}

export default function AIChatWidget({ isOpen, onClose, weather }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Add introduction message
      setMessages([
        {
          role: 'assistant',
          content: `👋 Hi! I'm Tomato, your friendly weather companion! I'm here to help you understand the weather and make the most of your day. Feel free to ask me anything about the weather, and I'll do my best to assist you!`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (weather) {
      // Add weather info message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `It's currently ${weather.condition.toLowerCase()} in ${weather.city} with a temperature of ${Math.round(weather.temperature)}°C. How can I help you today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [weather]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are Tomato, a friendly and knowledgeable weather assistant. You have access to the following weather data for ${weather?.city}: 
              - Current condition: ${weather?.condition}
              - Temperature: ${weather?.temperature}°C
              - Humidity: ${weather?.humidity}%
              - Wind Speed: ${weather?.windSpeed} m/s
              - Visibility: ${weather?.visibility} meters
              - Air Quality: ${weather?.airQuality}
              Be helpful, friendly, and occasionally make weather-related jokes or puns.`
            },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Oops! I'm having trouble connecting right now. Please try again in a moment!",
          timestamp: new Date()
        }
      ]);
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-4 w-96 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl 
                   border border-white/20 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                <Image
                  src="/tomato.svg"
                  alt="Tomato"
                  width={40}
                  height={40}
                  className="cursor-pointer hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-semibold text-white">Chat with Tomato</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <FiX className="text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-purple-500/20 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex-shrink-0">
                        <Image
                          src="/tomato.svg"
                          alt="Tomato"
                          width={24}
                          height={24}
                          className="cursor-pointer hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm">{message.content}</p>
                      {message.timestamp && (
                        <p className="text-xs text-white/40 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 text-white p-3 rounded-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-200" />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Tomato about the weather..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 
                         text-white placeholder-white/50 focus:outline-none focus:ring-2 
                         focus:ring-purple-500/50 transition-all duration-200"
              />
              <motion.button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-purple-500/20 text-white disabled:opacity-50 
                         disabled:cursor-not-allowed hover:bg-purple-500/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSend className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 