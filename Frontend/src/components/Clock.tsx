import React from 'react';

interface ClockProps {
  currentTime: Date;
}

const Clock: React.FC<ClockProps> = ({ currentTime }) => {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</div>
      <div className="text-base">{currentTime.toLocaleDateString()}</div>
    </div>
  );
};

export default Clock;