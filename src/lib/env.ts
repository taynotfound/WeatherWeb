// Server-only env access with the aliases this project's .env has used over time.
export const env = {
  weatherApi: () => process.env.WEATHER_API || process.env.WEATHERAPI_KEY || '',
  aiKey: () => {
    const k = process.env.OPENROUTER_API_KEY || process.env.AI_KEY || '';
    // Ignore obvious placeholders so we fall through to the keyless provider.
    return /^sk-/.test(k) ? k : '';
  },
};
