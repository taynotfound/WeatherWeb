import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <motion.div
      className="glass p-6 w-full max-w-md mx-auto my-4"
      style={{ borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: '1px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <FiAlertTriangle style={{ color: '#f87171' }} className="text-xl" />
        <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
      </div>
    </motion.div>
  );
};

export default ErrorMessage; 