import { useEffect, useState } from "react";
import useAutoScroll from "#/hooks/useAutoScroll";

export function useDisplayRuntime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useAutoScroll(5, 80);

  useEffect(() => {
    setIsHydrated(true);

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const refreshTimer = setInterval(() => {
      window.location.reload();
    }, 300000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
    };
  }, []);

  return {
    currentTime,
    isHydrated,
  };
}
