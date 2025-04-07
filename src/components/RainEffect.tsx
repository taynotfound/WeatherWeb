import React, { useEffect, useState } from 'react';

interface RainEffectProps {
  isRaining: boolean;
}

const RainEffect: React.FC<RainEffectProps> = ({ isRaining }) => {
  const [raindrops, setRaindrops] = useState<Array<{
    id: number;
    left: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isRaining) {
      // Create 100 raindrops with random positions and timing
      const drops = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 120 - 10, // Spawn slightly outside the screen for a more natural effect
        duration: 0.8 + Math.random() * 0.6, // Duration between 0.8s and 1.4s
        delay: Math.random() * 5, // Stagger the initial drops
      }));
      setRaindrops(drops);
    } else {
      setRaindrops([]);
    }
  }, [isRaining]);

  if (!isRaining) return null;

  return (
    <div className="rain-container">
      {raindrops.map((drop) => (
        <div 
          key={drop.id} 
          className="rain-drop"
          style={{
            left: `${drop.left}%`,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
            top: `${Math.random() * -100}%`, // Random starting position above the screen
          }}
        />
      ))}
    </div>
  );
};

export default RainEffect; 