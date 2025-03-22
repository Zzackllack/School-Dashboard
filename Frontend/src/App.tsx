import { useState, useEffect } from 'react';
import SubstitutionPlan from './components/SubstitutionPlan';
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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600">School Dashboard</h1>
        <p className="text-gray-600">Goethe Gymnasium Lichterfelde</p>
        <Clock currentTime={currentTime} />
      </header>
      
      <main>
        <SubstitutionPlanDisplay />
        <div className="flex flex-grow p-4 gap-4">
          <div className="flex-grow basis-3/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
            <SubstitutionPlan />
          </div>
          <div className="flex flex-col basis-1/4 gap-4">
            <Weather />
            <Transportation />
          </div>
        </div>
      </main>
      
      <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} School Dashboard | Goethe Gymnasium Lichterfelde</p>
        <p>Last updated: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default App;