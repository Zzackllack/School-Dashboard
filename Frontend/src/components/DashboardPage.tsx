import { useEffect, useState } from "react";
import CalendarEvents from "./CalendarEvents";
import Clock from "./Clock";
import Credits from "./Credits";
import Holidays from "./Holidays";
import SubstitutionPlanDisplay from "./SubstitutionPlanDisplay";
import Transportation from "./Transportation";
import Weather from "./Weather";
import schoolLogo from "../assets/Goethe-Logo.webp";
import useAutoScroll from "../hooks/useAutoScroll";

const DashboardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useAutoScroll(5, 80);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const refreshTimer = setInterval(() => {
      window.location.reload();
    }, 300000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="flex items-center justify-between border-b border-white/10 bg-gray-800/80 px-6 py-2 text-white shadow-lg backdrop-blur-md">
        <div className="flex items-center">
          <img
            src={schoolLogo}
            alt="Goethe Gymnasium Lichterfelde Logo"
            className="mr-4 h-16"
          />
        </div>
        <Clock currentTime={currentTime} />
      </header>

      <main className="flex flex-grow flex-col px-4 py-6">
        <div className="flex w-full flex-col gap-5 lg:flex-row">
          <div className="lg:w-3/4">
            <SubstitutionPlanDisplay />
          </div>
          <div className="flex flex-col gap-5 lg:w-1/4">
            <Weather />
            <Transportation />
            <CalendarEvents />
            <Holidays />
            <Credits />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-gray-800/80 px-6 py-3 text-center text-sm text-white backdrop-blur-md">
        <p>
          © 2025 - {new Date().getFullYear()} Cédric, Nikolas, Informatik LK
          24/26 | GGL
        </p>
        <p>Stand: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default DashboardPage;
