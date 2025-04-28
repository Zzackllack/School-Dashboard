import { useState, useEffect, useRef } from "react";
import Weather from "./components/Weather";
import Transportation from "./components/Transportation";
import Clock from "./components/Clock";
import SubstitutionPlanDisplay from "./components/SubstitutionPlanDisplay";
import Credits from "./components/Credits";
import Holidays from "./components/Holidays";
import CalendarEvents from "./components/CalendarEvents";
import useAutoScroll from "./hooks/useAutoScroll";
import schoolLogo from "./assets/Goethe-Logo.webp";

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [planHeight, setPlanHeight] = useState(0);
  const planRef = useRef<HTMLDivElement | null>(null);
  const rightColumnRef = useRef<HTMLDivElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  useAutoScroll(rightColumnRef, 600, 40);
  useAutoScroll(planRef, 1500, 30);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(() => window.location.reload(), 300000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, []);

  // Effect to measure and update the height of the substitution plan div
  useEffect(() => {
    if (!planRef.current) return;

    const updateHeight = () => {
      setPlanHeight(planRef.current?.offsetHeight || 0);
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(planRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={mainContainerRef}
      className="flex flex-col min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <header className="bg-gray-800/80 backdrop-blur-md text-white px-6 py-2 flex justify-between items-center shadow-lg border-b border-white/10">
        <div className="flex items-center">
          <img
            src={schoolLogo}
            alt="Goethe Gymnasium Lichterfelde Logo"
            className="h-16 mr-4"
          />
        </div>
        <Clock currentTime={currentTime} />
      </header>

      <main className="flex flex-col px-4 py-6 max-h-[87vh] overflow-y-hidden">
        <div className="flex flex-col lg:flex-row w-full gap-5 max-h-[90vh]">
          <div className="lg:w-3/4 col-span-2 rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800">
            <div
              ref={planRef}
              className="h-full overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 2rem)" }}
            >
              <SubstitutionPlanDisplay />
            </div>
          </div>

          <div
            className="lg:w-1/4 rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800"
            style={{ height: planHeight > 0 ? `${planHeight}px` : "auto" }}
          >
            <div
              ref={rightColumnRef}
              className="h-full flex flex-col gap-5 overflow-y-auto"
              style={{ maxHeight: "inherit" }}
            >
              <Weather />
              <Transportation />
              <CalendarEvents />
              <Holidays />
              <Credits />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800/80 backdrop-blur-md text-white py-3 px-6 text-center text-sm border-t border-white/10 fixed bottom-0 w-full">
        <p>© {new Date().getFullYear()} Schul Dashboard | GGL</p>
        <p>Stand: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default App;
