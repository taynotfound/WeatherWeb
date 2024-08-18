## Website is currently down!

# WeatherNotFound

This Weather Dashboard is a comprehensive web application that allows users to look up weather conditions by location, star their favorite locations for quick access, and receive AI-generated clothing suggestions based on the current weather conditions. It utilizes the Weather API from [WeatherAPI.com](https://www.weatherapi.com) and AI services from [Webraft](https://discord.gg/webraftai) to provide tailored clothing recommendations.

## Features

- **Weather Lookup by Location**: Enter a location to receive the current weather conditions and a 2-day forecast.
- **Star Location**: Save your favorite locations for quick and easy access in future queries.
- **AI Clothing Suggestions**: Get suggestions on what to wear based on the current weather conditions, powered by AI.
- **Text Glow Effects**: Visual enhancements such as text glow on weather conditions and temperature to reflect the weather visually.
- **2 Day Weather Forecast**: Stay prepared with a concise 2-day weather forecast.
- **Autistic Friendly Design**: The interface is designed to be accessible and friendly for individuals with autism.
- **No Bullshit**: Straightforward, efficient, and clutter-free user experience.

## Getting Started

To use this dashboard, simply navigate to the deployed web application and enter a location to see the Weather

### Prerequisites

Ensure you have the following installed:
- Node.js
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/taynotfound/WeatherWeb.git
   ```
2. Navigate to the project directory:
   ```bash
   cd WeatherWeb
   ```
3. Update the `.env.example` with the required Tokens.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- **Lookup Weather**: Enter a location in the search bar and submit to retrieve weather information.
- **Star a Location**: Click the star icon next to any location to save it to your starred locations.
- **Get Clothing Suggestions**: Based on the current weather displayed, click the "Get Clothing Suggestions" button to receive AI-powered advice on what to wear.

## API Keys

- Obtain a Weather API key from [WeatherAPI.com](https://www.weatherapi.com).
- Get an AI API key for clothing suggestions from [Webraft AI](https://discord.gg/webraftai).

## Known Issues

- **Not Fully Responsive**: Some elements may not display correctly on all devices or screen sizes.
- **Environment Variables Dependency**: If the `.env` file is not set up correctly, the application will not function. An error handling mechanism should be implemented to catch and report these issues effectively.
- **Installing on Mobile on Chrome doesnt let you go back**

## Contact

For support, queries, or contributions, please join my Discord server: [Join Discord](https://discord.gg/GeYbxZ5QfW).

## Code References

For detailed code implementations and setups, refer to the following sections in the codebase:

- **Weather API Integration**: `src/pages/weather.astro` (startLine: 1, endLine: 160)
- **AI Clothing Suggestions API**: `src/pages/api/clothing.ts` (startLine: 1, endLine: 43)
- **Frontend Implementation**: `src/pages/index.astro` (startLine: 1, endLine: 52)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
