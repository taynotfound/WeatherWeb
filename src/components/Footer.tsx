'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiGithub, FiGlobe, FiHeart } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative mt-16 py-8 border-t border-white/10"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-6">
            <motion.a
              href="https://github.com/taynotfound"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiGithub size={24} />
            </motion.a>
            <motion.a
              href="https://discord.gg/C2bAXnYXzm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaDiscord size={24} />
            </motion.a>
            <motion.a
              href="https://taynotfound.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiGlobe size={24} />
            </motion.a>
          </div>
          
          <div className="flex items-center gap-2 text-white/70">
            <span>Created with</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <FiHeart className="text-red-500" />
            </motion.div>
            <span>by tay maerz</span>
          </div>
          
          <p className="text-sm text-white/50">
            © {currentYear} WeatherWeb. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
} 