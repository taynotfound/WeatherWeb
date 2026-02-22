import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from './FavoritesContext';
import { FiStar, FiX } from 'react-icons/fi';

interface FavoritesSidebarProps {
  onSelectCity: (city: string) => void;
}

export default function FavoritesSidebar({ onSelectCity }: FavoritesSidebarProps) {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-full w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 p-4 z-50"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
          <FiStar className="text-yellow-400" />
          Favorites
        </h2>
      </div>

      <AnimatePresence>
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/50 text-center py-8"
          >
            No favorites yet
          </motion.div>
        ) : (
          <div className="space-y-2">
            {favorites.map((city) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group relative"
              >
                <button
                  onClick={() => onSelectCity(city)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 
                           transition-all duration-200 flex items-center justify-between"
                >
                  <span className="text-white/90">{city}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(city);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             hover:text-red-400 p-1"
                  >
                    <FiX />
                  </button>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 