import { useState, useEffect, useRef } from 'react';

// Custom hook for auto-scrolling with adaptive duration based on content
const useAutoScroll = (basePauseDuration = 500, baseScrollSpeed = 40) => {
  const [documentHeight, setDocumentHeight] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate the appropriate scroll duration based on content height
  // We use pixels-per-second as the base unit so scrolling speed feels consistent
  const calculateScrollDuration = (height: number, viewportHeight: number) => {
    const scrollableDistance = Math.max(0, height - viewportHeight);
    // baseScrollSpeed is pixels per second (e.g., 40px/s)
    // Min duration of 3000ms, or calculated based on content
    return Math.max(3000, scrollableDistance * 1000 / baseScrollSpeed);
  };

  // Update document height when content changes
  useEffect(() => {
    const updateDocumentHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      setDocumentHeight(height);
      console.log(`[AutoScroll] Document height updated: ${height}px`);
    };

    // Initial height calculation
    updateDocumentHeight();

    // Set up resize observer to detect content changes
    const observer = new ResizeObserver(() => {
      updateDocumentHeight();
    });
    
    // Observe body for size changes
    observer.observe(document.body);
    resizeObserverRef.current = observer;

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    
    const scrollToBottom = () => {
      if (!isActive) return;
      
      const currentDocHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll duration based on content height
      const scrollDuration = calculateScrollDuration(currentDocHeight, viewportHeight);
      console.log(`[AutoScroll] Scrolling down with duration: ${scrollDuration}ms`);
      
      const startTime = performance.now();
      const startPosition = window.scrollY;
      const targetPosition = currentDocHeight - viewportHeight;
      
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
          console.log(`[AutoScroll] Reached bottom, pausing for ${basePauseDuration}ms`);
          setTimeout(() => {
            if (isActive) scrollToTop();
          }, basePauseDuration);
        }
      };
      
      window.requestAnimationFrame(scrollStep);
    };
    
    const scrollToTop = () => {
      if (!isActive) return;
      
      const currentDocHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll duration based on content height
      const scrollDuration = calculateScrollDuration(currentDocHeight, viewportHeight);
      console.log(`[AutoScroll] Scrolling up with duration: ${scrollDuration}ms`);
      
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
          console.log(`[AutoScroll] Reached top, pausing for ${basePauseDuration}ms`);
          setTimeout(() => {
            if (isActive) scrollToBottom();
          }, basePauseDuration);
        }
      };
      
      window.requestAnimationFrame(scrollStep);
    };
    
    // Start the loop after a short delay to allow initial render
    const initialTimer = setTimeout(() => {
      if (isActive && documentHeight > window.innerHeight) {
        console.log(`[AutoScroll] Starting initial scroll with document height: ${documentHeight}px`);
        scrollToBottom();
      } else if (isActive) {
        console.log(`[AutoScroll] Content fits in viewport (${documentHeight}px), not scrolling`);
      }
    }, 2000);
    
    return () => {
      isActive = false;
      clearTimeout(initialTimer);
    };
  }, [documentHeight, basePauseDuration, baseScrollSpeed]);
};

export default useAutoScroll;
