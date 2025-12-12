import { useState, useEffect, useRef, RefObject } from "react";

// Custom hook for auto-scrolling a div with adaptive duration based on content
const useAutoScroll = (
  containerRef: RefObject<HTMLElement | null>,
  basePauseDuration = 500,
  baseScrollSpeed = 40
) => {
  const [contentHeight, setContentHeight] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate the appropriate scroll duration based on content height
  // We use pixels-per-second as the base unit so scrolling speed feels consistent
  const calculateScrollDuration = (height: number, viewportHeight: number) => {
    const scrollableDistance = Math.max(0, height - viewportHeight);
    // baseScrollSpeed is pixels per second (e.g., 40px/s)
    // Min duration of 3000ms, or calculated based on content
    return Math.max(3000, (scrollableDistance * 1000) / baseScrollSpeed);
  };

  // Update content height when container changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContentHeight = () => {
      const container = containerRef.current;
      if (!container) return;

      const height = container.scrollHeight;
      setContentHeight(height);
      console.log(`[AutoScroll] Content height updated: ${height}px`);
    };

    // Initial height calculation
    updateContentHeight();

    // Set up resize observer to detect content changes
    const observer = new ResizeObserver(() => {
      updateContentHeight();
    });

    // Observe container for size changes
    observer.observe(containerRef.current);
    resizeObserverRef.current = observer;

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [containerRef]);

  useEffect(() => {
    if (!containerRef.current) return;

    let isActive = true;

    // Create a single scroll function that takes direction parameters
    const scroll = (isDown = true) => {
      if (!isActive || !containerRef.current) return;

      const container = containerRef.current;
      const currentHeight = container.scrollHeight;
      const viewportHeight = container.clientHeight;
      const scrollDuration = calculateScrollDuration(
        currentHeight,
        viewportHeight
      );

      const startTime = performance.now();
      const startPosition = container.scrollTop;
      const targetPosition = isDown ? currentHeight - viewportHeight : 0;

      const scrollStep = (timestamp: number) => {
        if (!isActive || !containerRef.current) return;

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / scrollDuration, 1);
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

        containerRef.current.scrollTop =
          startPosition + (targetPosition - startPosition) * easeProgress;

        if (progress < 1) {
          window.requestAnimationFrame(scrollStep);
        } else {
          console.log(
            `[AutoScroll] Reached ${
              isDown ? "bottom" : "top"
            }, pausing for ${basePauseDuration}ms`
          );
          setTimeout(() => {
            if (isActive) scroll(!isDown);
          }, basePauseDuration);
        }
      };

      window.requestAnimationFrame(scrollStep);
    };

    // Start the loop after a short delay to allow initial render
    const initialTimer = setTimeout(() => {
      if (isActive && containerRef.current) {
        const container = containerRef.current;
        if (contentHeight > container.clientHeight) {
          console.log(
            `[AutoScroll] Starting initial scroll with content height: ${contentHeight}px`
          );
          scroll(true);
        } else {
          console.log(
            `[AutoScroll] Content fits in container (${contentHeight}px), not scrolling`
          );
        }
      }
    }, 2000);

    return () => {
      isActive = false;
      clearTimeout(initialTimer);
    };
  }, [contentHeight, basePauseDuration, baseScrollSpeed, containerRef]);
};

export default useAutoScroll;
