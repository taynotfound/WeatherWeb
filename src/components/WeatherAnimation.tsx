import React, { useEffect, useState, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface WeatherAnimationProps {
  condition: string;
}

const WeatherAnimation: React.FC<WeatherAnimationProps> = ({ condition }) => {
  const lowerCondition = condition.toLowerCase();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimationControls();


 

  const renderRaindrops = useCallback(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      const duration = 1 + Math.random();
      const delay = Math.random() * 2;
      const leftPos = `${Math.random() * 100}%`;
      
      return (
        <motion.div
          key={`raindrop-${i}`}
          style={{
            position: 'absolute',
            width: '2px',
            height: `${Math.random() * 15 + 10}px`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 100%)',
            borderRadius: '2px',
            left: leftPos,
            top: '-20px',
          }}
          animate={{
            y: ['0%', '2000%'],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: 'linear'
          }}
        />
      );
    });
  }, []);

  const renderMist = useCallback(() => {
    return Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={`mist-${i}`}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)',
          opacity: 0.3,
        }}
        animate={{
          x: ['-100%', '100%'],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 20 + Math.random() * 10,
          repeat: Infinity,
          delay: i * 3,
          ease: 'linear'
        }}
      />
    ));
  }, []);

  const renderOvercastClouds = useCallback(() => {
    return Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={`cloud-${i}`}
        style={{
          position: 'absolute',
          width: '200%',
          height: '100vh',
          background: `linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,${0.02 + (i * 0.01)}) 50%,
            rgba(255,255,255,0) 100%)`,
          top: `${(i * 20)}%`,
          left: '-100%',
        }}
        animate={{
          x: ['0%', '100%']
        }}
        transition={{
          duration: 30 + (i * 5),
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    ));
  }, []);

  const renderClearSky = useCallback(() => {
    return (
      <>
        <motion.div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
          animate={{
            x: mousePosition.x - 150,
            y: mousePosition.y - 150,
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            x: { type: "spring", damping: 20, stiffness: 400 },
            y: { type: "spring", damping: 20, stiffness: 400 },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }}
        />
        {Array.from({ length: 20 }).map((_, i) => {
          const leftPos = `${Math.random() * 100}%`;
          const topPos = `${Math.random() * 100}%`;
          return (
            <motion.div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '50%',
                left: leftPos,
                top: topPos,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut'
              }}
            />
          );
        })}
      </>
    );
  }, [mousePosition]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {(lowerCondition.includes('rain')) && renderRaindrops()}
        {(lowerCondition.includes('mist') || lowerCondition.includes('fog')) && renderMist()}
        {(lowerCondition.includes('overcast')) && renderOvercastClouds()}
        {(lowerCondition.includes('clear')) && renderClearSky()}
      </div>
      <motion.div 
        className="custom-cursor"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 400
        }}
      />
    </>
  );
};

export default WeatherAnimation; 