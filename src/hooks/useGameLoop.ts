import { useEffect, useRef } from 'react';

export function useGameLoop(callback: () => void, delay = 1200, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => window.clearInterval(timer);
  }, [delay, enabled]);
}

