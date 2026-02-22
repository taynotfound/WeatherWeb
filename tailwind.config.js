/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        'glass-background': 'var(--glass-background)',
        'glass-border': 'var(--glass-border)',
        'glass-hover-bg': 'var(--glass-hover-bg)',
        'glass-hover-border': 'var(--glass-hover-border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      maxWidth: {
        '4xl': '64rem',
      },
      spacing: {
        '95': '95%',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}; 