import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Transportation from './components/Transportation';
import Clock from './components/Clock';
import SubstitutionPlanDisplay from './components/SubstitutionPlanDisplay';
import Credits from './components/Credits';
import useAutoScroll from './hooks/useAutoScroll';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Initialize auto-scrolling with 5 second pauses
  // baseScrollSpeed is pixels per second (80px/s means it takes 12.5 seconds to scroll 1000px)
  useAutoScroll(3500, 80);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const refreshTimer = setInterval(() => {
      window.location.reload();
    }, 300000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#FBF8F1]">
      <header className="bg-[#8C7356] text-white px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-center w-full">Goethe Gymnasium Lichterfelde</h1>
        <Clock currentTime={currentTime} />
      </header>
      
      <main className="flex-grow flex flex-col">
        <div className="flex flex-col lg:flex-row w-full">
          <div className="lg:w-3/4 px-2">
            <SubstitutionPlanDisplay />
          </div>
          <div className="lg:w-1/4 flex flex-col px-2">
            <Weather />
            <Transportation />
            <Credits />
          </div>
        </div>
      </main>
      
      <footer className="bg-[#8C7356] text-white py-2 px-4 text-center text-sm">
        <p>© {new Date().getFullYear()} School Dashboard | GGL</p>
        <p>Last updated: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default App;