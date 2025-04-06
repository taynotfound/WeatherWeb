import React from 'react';
import { motion } from 'framer-motion';

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-40">
      <motion.div
        className="glass p-6 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex space-x-2 mb-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              style={{ 
                width: '1rem', 
                height: '1rem', 
                backgroundColor: 'rgba(74, 222, 128, 0.5)', 
                borderRadius: '9999px' 
              }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading weather data...</p>
      </motion.div>
    </div>
  );
};

export default Loading; 