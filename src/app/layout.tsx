import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WeatherProvider from "@/components/WeatherProvider";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "WeatherWeb - Modern Weather App",
  description: "A beautiful glassmorphic dark mode weather application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WeatherProvider>
          {children}
        </WeatherProvider>
      </body>
    </html>
  );
}
