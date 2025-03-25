import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Transportation from './components/Transportation';
import Clock from './components/Clock';
import SubstitutionPlanDisplay from './components/SubstitutionPlanDisplay';
import Credits from './components/Credits';

// Custom hook for auto-scrolling
const useAutoScroll = (pauseDuration = 8000, scrollDuration = 20000) => {
  useEffect(() => {
    let isActive = true;
    
    const scrollToBottom = () => {
      if (!isActive) return;
      
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      
      const startTime = performance.now();
      const startPosition = window.scrollY;
      const targetPosition = documentHeight - window.innerHeight;
      
      const scrollStep = (timestamp: number) => {
        if (!isActive) return;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / scrollDuration, 1);
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Smooth easing function
        
        window.scrollTo(0, startPosition + (targetPosition - startPosition) * easeProgress);
        
        if (progress < 1) {
          window.requestAnimationFrame(scrollStep);
        } else {
          // Wait at bottom, then scroll up
          setTimeout(() => {
            if (isActive) scrollToTop();
          }, pauseDuration);
        }
      };
      
      window.requestAnimationFrame(scrollStep);
    };
    
    const scrollToTop = () => {
      if (!isActive) return;
      
      const startTime = performance.now();
      const startPosition = window.scrollY;
      
      const scrollStep = (timestamp: number) => {
        if (!isActive) return;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / scrollDuration, 1);
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Smooth easing function
        
        window.scrollTo(0, startPosition * (1 - easeProgress));
        
        if (progress < 1) {
          window.requestAnimationFrame(scrollStep);
        } else {
          // Wait at top, then scroll down
          setTimeout(() => {
            if (isActive) scrollToBottom();
          }, pauseDuration);
        }
      };
      
      window.requestAnimationFrame(scrollStep);
    };
    
    // Start the loop after a short delay to allow initial render
    const initialTimer = setTimeout(() => {
      if (isActive) scrollToBottom();
    }, 2000);
    
    return () => {
      isActive = false;
      clearTimeout(initialTimer);
    };
  }, [pauseDuration, scrollDuration]);
};

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Initialize auto-scrolling with 8 second pauses and 20 second scroll duration
  useAutoScroll(8000, 20000);

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
          </div>
        </div>
        
        {/* Credits section */}
        <Credits />
      </main>
      
      <footer className="bg-[#8C7356] text-white py-2 px-4 text-center text-sm">
        <p>© {new Date().getFullYear()} School Dashboard | GGL</p>
        <p>Last updated: {currentTime.toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default App;