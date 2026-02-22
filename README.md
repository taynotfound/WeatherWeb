# WeatherWeb

A modern weather application with a beautiful glassmorphic dark mode UI built with Next.js.

## Features

- 🌈 Modern glassmorphic dark mode UI
- 🔍 Search for weather by city name
- 🌡️ Current weather conditions
- 📅 5-day weather forecast
- 💨 Wind speed, humidity, sunrise, and sunset information
- 📱 Fully responsive design
- ✨ Smooth animations with Framer Motion

## Screenshots

![image](https://github.com/user-attachments/assets/83808267-a7d8-4b25-8a9e-fdc8b63a5465)


## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- OpenWeatherMap API key (get it for free at [OpenWeatherMap](https://openweathermap.org/api))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/taynotfound/weatherweb.git
cd weatherweb
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your OpenWeatherMap API key:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [React Icons](https://react-icons.github.io/react-icons/) - Icons
- [Axios](https://axios-http.com/) - API requests
- For the API's see [weather.taymaerz.de/about](https://weather.taymaerz.de/about)

## License

This project is licensed under the MIT License.

## Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/) for providing the weather data API
- [Glassmorphism CSS Generator](https://ui.glass/generator/) for inspiration on glassmorphism design
