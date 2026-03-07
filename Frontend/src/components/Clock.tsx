import React from "react";

interface ClockProps {
  currentTime: Date;
}

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

const Clock: React.FC<ClockProps> = ({ currentTime }) => {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold" data-testid="clock-time">
        {currentTime.toLocaleTimeString("de-DE", TIME_FORMAT_OPTIONS)}
      </div>
      <div className="text-base" data-testid="clock-date">
        {currentTime.toLocaleDateString("de-DE", DATE_FORMAT_OPTIONS)}
      </div>
    </div>
  );
};

export default Clock;
