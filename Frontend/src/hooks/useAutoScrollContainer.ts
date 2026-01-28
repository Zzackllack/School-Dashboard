import { RefObject, useEffect, useState } from 'react';

const useAutoScrollContainer = (
  containerRef: RefObject<HTMLElement>,
  basePauseDuration = 5000,
  baseScrollSpeed = 40,
) => {
  const [contentHeight, setContentHeight] = useState(0);

  const calculateScrollDuration = (height: number, viewportHeight: number) => {
    const scrollableDistance = Math.max(0, height - viewportHeight);
    return Math.max(3000, (scrollableDistance * 1000) / baseScrollSpeed);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContentHeight = () => {
      setContentHeight(container.scrollHeight);
    };

    updateContentHeight();
    const observer = new ResizeObserver(updateContentHeight);
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isActive = true;

    const scrollToPosition = (target: number, onComplete: () => void) => {
      const startPosition = container.scrollTop;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const clampedTarget = Math.min(maxScroll, Math.max(0, target));
      const duration = calculateScrollDuration(container.scrollHeight, container.clientHeight);
      const startTime = performance.now();

      const step = (timestamp: number) => {
        if (!isActive) return;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
        container.scrollTop = startPosition + (clampedTarget - startPosition) * easeProgress;

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setTimeout(() => {
            if (isActive) onComplete();
          }, basePauseDuration);
        }
      };

      window.requestAnimationFrame(step);
    };

    const scrollLoop = () => {
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      if (maxScroll <= 0) return;
      scrollToPosition(maxScroll, () => scrollToPosition(0, scrollLoop));
    };

    const initialTimer = setTimeout(() => {
      if (isActive && container.scrollHeight > container.clientHeight) {
        scrollLoop();
      }
    }, 2000);

    return () => {
      isActive = false;
      clearTimeout(initialTimer);
    };
  }, [containerRef, contentHeight, basePauseDuration, baseScrollSpeed]);
};

export default useAutoScrollContainer;
