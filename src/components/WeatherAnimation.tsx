'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './WeatherAnimation.module.css';
import type { WeatherCondition } from './WeatherProvider';

interface WeatherAnimationProps {
  conditions?: WeatherCondition[];
  isDay: boolean;
}

const WeatherAnimation: React.FC<WeatherAnimationProps> = ({ 
  conditions = [], 
  isDay 
}) => {
  const renderParticles = (condition: WeatherCondition) => {
    const baseCount = condition.probability 
      ? Math.floor(condition.probability * 150)
      : condition.intensity === 'light' ? 25 
        : condition.intensity === 'moderate' ? 50 
        : 75;

    const count = condition.probability && condition.probability > 0.05
      ? Math.max(10, Math.min(baseCount, 100))
      : baseCount;

    return Array.from({ length: count }).map((_, i) => {
      const delay = Math.random() * 3;
      
      const speedFactor = condition.probability 
        ? 1 + condition.probability
        : condition.intensity === 'heavy' ? 2 
          : condition.intensity === 'moderate' ? 1.5 
          : 1;
      
      const duration = condition.type === 'snow' 
        ? 6 + Math.random() * 4
        : condition.type === 'rain'
          ? (0.9 + Math.random() * 0.4) / speedFactor
          : 2 + Math.random() * 2;

      const maxOpacity = condition.probability 
        ? Math.min(0.8, 0.4 + condition.probability * 0.6)
        : condition.intensity === 'heavy' ? 0.8
          : condition.intensity === 'moderate' ? 0.6
          : 0.4;

      const scale = condition.probability
        ? 0.8 + (condition.probability * 0.4)
        : condition.intensity === 'heavy' ? 1.2
          : condition.intensity === 'moderate' ? 1
          : 0.8;

      return (
        <motion.div
          key={`${condition.type}-${i}`}
          className={`${styles.particle} ${styles[condition.type]}`}
          initial={{
            opacity: 0,
            x: `${Math.random() * 100}%`,
            y: '-10%',
            scale,
          }}
          animate={{
            opacity: [0, maxOpacity, maxOpacity, 0],
            x: `${Math.random() * 100}%`,
            y: ['-10%', '110%'],
            scale,
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: condition.type === 'snow' ? 'easeInOut' : 'linear',
          }}
        />
      );
    });
  };

  return (
    <div className={styles.container}>
      {conditions.map((condition, index) => (
        <div key={`${condition.type}-${index}`} className={styles.layer}>
          {condition.type === 'fog' && (
            <motion.div
              className={styles.fog}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
          {(condition.type === 'rain' || condition.type === 'snow') && renderParticles(condition)}
          {condition.type === 'thunder' && (
            <motion.div
              className={styles.lightning}
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 5 + 2,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WeatherAnimation; 