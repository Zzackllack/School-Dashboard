import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Transportation from './components/Transportation';
import SubstitutionPlanDisplay from './components/SubstitutionPlanDisplay';
import Credits from './components/Credits';
import Holidays from './components/Holidays';
import CalendarEvents from './components/CalendarEvents';
import AnalogClock from './components/AnalogClock';

const ClockDisplay = () => {
  try {
    const Clock = require('./components/Clock').default;
    return <Clock />;
  } catch {
    // fallback
    const [time, setTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-[12rem] font-bold text-gray-800 dark:text-gray-100">
          {time.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
    );
  }
};

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<'dashboard' | 'logo' | 'clock'>('dashboard');
  const [fadeState, setFadeState] = useState<'visible' | 'fading-out' | 'hidden' | 'fading-in'>('visible');

  const topComponents = [
    <Weather key="weather" />,
    <Transportation key="transportation" />,
    <CalendarEvents key="calendar" />,
    <Holidays key="holidays" />,
    <Credits key="credits" />
  ];

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

  useEffect(() => {
    const rotationTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topComponents.length);
    }, 32000);

    return () => {
      clearInterval(rotationTimer);
    };
  }, [topComponents.length]);

  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];

    const showLogoAndClock = () => {
      // alle vorherigen timeouts clearen
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds = [];

      // 1. dashboard ausblenden (1s fade-out)
      setFadeState('fading-out');

      timeoutIds.push(setTimeout(() => {
        setFadeState('hidden');

        // 2. 1 sek pause, dann Logo einblenden
        timeoutIds.push(setTimeout(() => {
          setDisplayMode('logo');
          setFadeState('fading-in');

          timeoutIds.push(setTimeout(() => {
            setFadeState('visible');

            // 3. Logo 5 sek anzeigen
            timeoutIds.push(setTimeout(() => {
              setFadeState('fading-out');

              timeoutIds.push(setTimeout(() => {
                setFadeState('hidden');

                // 4. 1 sek pause, dann Uhr einblenden
                timeoutIds.push(setTimeout(() => {
                  setDisplayMode('clock');
                  setFadeState('fading-in');

                  timeoutIds.push(setTimeout(() => {
                    setFadeState('visible');

                    // 5. Uhr 5 sek anzeigen
                    timeoutIds.push(setTimeout(() => {
                      setFadeState('fading-out');

                      timeoutIds.push(setTimeout(() => {
                        setFadeState('hidden');

                        // 6. 1 sek pause, dann dashboard einblenden
                        timeoutIds.push(setTimeout(() => {
                          setDisplayMode('dashboard');
                          setFadeState('fading-in');

                          timeoutIds.push(setTimeout(() => {
                            setFadeState('visible');
                          }, 1000));
                        }, 1000));
                      }, 1000));
                    }, 5000));
                  }, 1000));
                }, 1000));
              }, 1000));
            }, 5000));
          }, 1000));
        }, 1000));
      }, 1000));
    };

    // erste Anzeige: 3 min (180000ms)
    const initialTimer = setTimeout(showLogoAndClock, 180000);

    // 3 min (180000ms)
    const intervalTimer = setInterval(showLogoAndClock, 180000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  const getOpacity = () => {
    switch (fadeState) {
      case 'visible':
        return 'opacity-100';
      case 'fading-out':
      case 'hidden':
        return 'opacity-0';
      case 'fading-in':
        return 'opacity-100';
      default:
        return 'opacity-100';
    }
  };

  return (
      <div className="relative flex flex-col h-screen w-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        <div
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                displayMode === 'dashboard' ? getOpacity() : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="flex flex-col h-full w-full">
            <div className="h-[40%] flex items-stretch gap-6 px-8 py-6 overflow-hidden">
              <div className="flex-grow bg-gradient-to-br from-gray-50/40 to-gray-100/40 dark:from-gray-700/40 dark:to-gray-800/40 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 p-6 overflow-auto">
                {topComponents[currentIndex]}
              </div>
              <div className="flex-shrink-0 bg-gradient-to-br from-gray-50/40 to-gray-100/40 dark:from-gray-700/40 dark:to-gray-800/40 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 p-8 flex items-center justify-center min-w-[280px]">
                <AnalogClock />
              </div>
            </div>
            <div className="h-[60%] px-8 pb-8 overflow-hidden">
              <SubstitutionPlanDisplay />
            </div>
          </div>
        </div>

        <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                displayMode === 'logo' ? getOpacity() : 'opacity-0 pointer-events-none'
            }`}
        >
          <img
              src="/src/assets/Goethe-Logo.webp"
              alt="Schul-Logo"
              className="max-w-[60vw] max-h-[60vh] object-contain"
              onError={(e) => {
                // Fallback wenn logo nicht gefuden wird
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="text-9xl font-bold text-gray-800 dark:text-gray-100">Goethe Gymnasium</div>';
                }
              }}
          />
        </div>

        <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                displayMode === 'clock' ? getOpacity() : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="scale-[2.5] transform-gpu">
            <ClockDisplay />
          </div>
        </div>
      </div>
  );
};

export default App;