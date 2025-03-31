import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Transportation from './components/Transportation';
import Clock from './components/Clock';
import SubstitutionPlanDisplay from './components/SubstitutionPlanDisplay';
import Credits from './components/Credits';
import useAutoScroll from './hooks/useAutoScroll';
import schoolLogo from './assets/Goethe-Logo.webp'; // Import the school logo

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
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
      
      <main className="flex-grow flex flex-col px-4 py-6">
        <div className="flex flex-col lg:flex-row w-full gap-5">
          <div className="lg:w-3/4">
            <SubstitutionPlanDisplay />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-5">
            <Weather />
            <Transportation />
            <Credits />
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800/80 backdrop-blur-md text-white py-3 px-6 text-center text-sm border-t border-white/10">
        <p>© {new Date().getFullYear()} Schul Dashboard | GGL</p>
        <p>Stand: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default App;