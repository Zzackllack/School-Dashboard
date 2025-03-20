import { useState, useEffect } from 'react';
import SubstitutionPlan from './components/SubstitutionPlan';
import Weather from './components/Weather';
import Transportation from './components/Transportation';
import Clock from './components/Clock';

function App() {
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
    <div className="flex flex-col h-screen">
      <header className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">School Dashboard</h1>
        <Clock currentTime={currentTime} />
      </header>
      
      <div className="flex flex-grow p-4 gap-4">
        <div className="flex-grow basis-3/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <SubstitutionPlan />
        </div>
        <div className="flex flex-col basis-1/4 gap-4">
          <Weather />
          <Transportation />
        </div>
      </div>
      
      <footer className="bg-slate-800 text-white py-2 px-8 text-center text-sm">
        <p>Last updated: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
}

export default App;