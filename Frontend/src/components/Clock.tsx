import React from 'react';

interface ClockProps {
  currentTime: Date;
}

const Clock: React.FC<ClockProps> = ({ currentTime }) => {
  return (
    <div className="text-center text-white">
      <div className="text-7xl font-bold">{currentTime.toLocaleTimeString()}</div>
      <div className="text-6xl font-medium">{currentTime.toLocaleDateString()}</div>
    </div>
  );
};

export default Clock;