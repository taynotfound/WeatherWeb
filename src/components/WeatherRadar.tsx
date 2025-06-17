import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface WeatherRadarProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lon: number;
}

interface RadarFrame {
  path: string;
  time: number;
}

const WeatherRadar: React.FC<WeatherRadarProps> = ({ isOpen, onClose, lat, lon }) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRadarData();
    }
  }, [isOpen]);

  const fetchRadarData = async () => {
    try {
      setError(null);
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!response.ok) {
        throw new Error('Failed to fetch radar data');
      }
      const data = await response.json();
      
      if (!data.radar?.past?.length) {
        throw new Error('No radar data available');
      }

      const radarFrames = data.radar.past.map((item: any) => ({
        path: item.path,
        time: item.time
      }));
      
      setFrames(radarFrames);
    } catch (error) {
      console.error('Error fetching radar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load radar data');
      onClose(); // Close the radar view when there's an error
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => 
          prev === frames.length - 1 ? 0 : prev + 1
        );
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  // Don't render anything if there's an error or if not open
  if (!isOpen || error) return null;

  const baseUrl = 'https://tilecache.rainviewer.com';
  const zoom = 7;
  const size = 512;
  const color = 4;
  const smooth = 1;
  const snow = 1;

  const getTileUrl = (frame: RadarFrame) => {
    return `${baseUrl}${frame.path}/256/${zoom}/${lat}/${lon}/${color}/${smooth}_${snow}.png`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-4xl w-full mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX size={24} />
          </button>

          <div className="relative aspect-video">
            {frames.length > 0 && (
              <img
                src={getTileUrl(frames[currentFrameIndex])}
                alt="Weather Radar"
                className="w-full h-full object-cover rounded"
                onError={() => {
                  setError('Failed to load radar image');
                  onClose();
                }}
              />
            )}
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
                className="w-48"
              />
            </div>
          </div>
          
          <div className="mt-2 text-center text-sm text-gray-500">
            Powered by <a href="https://www.rainviewer.com/api.html" target="_blank" rel="noopener noreferrer" className="underline">RainViewer</a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeatherRadar; 