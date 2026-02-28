import React from "react";

interface ClockProps {
  currentTime: Date;
}

const Clock: React.FC<ClockProps> = ({ currentTime }) => {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold" data-testid="clock-time">
        {currentTime.toLocaleTimeString()}
      </div>
      <div className="text-base" data-testid="clock-date">
        {currentTime.toLocaleDateString()}
      </div>
    </div>
  );
};

export default Clock;
