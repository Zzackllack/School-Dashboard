import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Transportation from './components/Transportation';
import Clock from './components/Clock';
import SubstitutionPlanDisplay from './components/SubstitutionPlanDisplay';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Goethe Gymnasium Lichterfelde</h1>
        <Clock currentTime={currentTime} />
      </header>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-3/4">
            <SubstitutionPlanDisplay />
          </div>
          <div className="lg:w-1/4 flex flex-col gap-4">
            <Weather />
            <Transportation />
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-800 text-white py-2 px-8 text-center text-sm">
        <p>© {new Date().getFullYear()} School Dashboard | GGL</p>
        <p>Last updated: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default App;