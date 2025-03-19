import { useState, useEffect } from 'react';
import './assets/Dashboard.css';
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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>School Dashboard</h1>
        <Clock currentTime={currentTime} />
      </header>
      
      <div className="dashboard-content">
        <div className="main-panel">
          <SubstitutionPlan />
        </div>
        <div className="side-panel">
          <Weather />
          <Transportation />
        </div>
      </div>
      
      <footer className="dashboard-footer">
        <p>Last updated: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
}

export default App;