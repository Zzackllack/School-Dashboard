import { useEffect, useState } from 'react';

const AnalogClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Berechne die Rotation für sanfte Übergänge
    const secondDegrees = seconds * 6;
    const minuteDegrees = minutes * 6 + seconds * 0.1;
    const hourDegrees = hours * 30 + minutes * 0.5;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-w-[300px] max-h-[300px] aspect-square">
                <style>{`
          .clock-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
          }

          .hour_hand,
          .min_hand,
          .sec_hand {
            position: absolute;
            border-radius: 20px;
            transform-origin: bottom center;
            background: linear-gradient(180deg, 
              rgba(200, 200, 220, 0.95) 0%, 
              rgba(180, 180, 210, 0.85) 50%,
              rgba(160, 160, 200, 0.75) 100%);
            backdrop-filter: blur(8px);
            box-shadow: 
              0 0 20px rgba(255, 255, 255, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.5),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .hour_hand {
            width: 10px;
            height: 80px;
            top: calc(50% - 80px);
            left: calc(50% - 5px);
          }

          .min_hand {
            width: 8px;
            height: 110px;
            top: calc(50% - 110px);
            left: calc(50% - 4px);
            background: linear-gradient(180deg, 
              rgba(220, 220, 240, 0.98) 0%, 
              rgba(200, 200, 230, 0.88) 50%,
              rgba(180, 180, 220, 0.78) 100%);
          }

          .sec_hand {
            width: 4px;
            height: 120px;
            top: calc(50% - 120px);
            left: calc(50% - 2px);
            background: linear-gradient(180deg, 
              rgba(239, 68, 68, 0.95) 0%, 
              rgba(220, 38, 38, 0.85) 50%,
              rgba(200, 20, 20, 0.75) 100%);
            box-shadow: 
              0 0 15px rgba(239, 68, 68, 0.5),
              0 4px 10px rgba(0, 0, 0, 0.4),
              inset 0 2px 4px rgba(255, 100, 100, 0.6),
              inset 0 -2px 4px rgba(150, 0, 0, 0.3);
          }

          .clock-center {
            position: absolute;
            width: 18px;
            height: 18px;
            background: radial-gradient(circle, 
              rgba(240, 240, 250, 0.98) 0%, 
              rgba(200, 200, 230, 0.9) 100%);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
              0 0 15px rgba(255, 255, 255, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.8),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.3);
            z-index: 10;
            backdrop-filter: blur(4px);
          }
        `}</style>

                <div className="clock-container">
                    <div
                        className="hour_hand"
                        style={{
                            transform: `rotateZ(${hourDegrees}deg)`,
                            transition: 'none'
                        }}
                    />
                    <div
                        className="min_hand"
                        style={{
                            transform: `rotateZ(${minuteDegrees}deg)`,
                            transition: 'none'
                        }}
                    />
                    <div
                        className="sec_hand"
                        style={{
                            transform: `rotateZ(${secondDegrees}deg)`,
                            transition: seconds === 0 ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                        }}
                    />
                    <div className="clock-center" />
                </div>
            </div>
        </div>
    );
};

export default AnalogClock;