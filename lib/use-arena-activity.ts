"use client";

import { useState, useEffect, useRef } from "react";

export function useArenaActivity() {
  const [activePlayers, setOnlineUsers] = useState(0);
  const historyRef = useRef<number[]>([]);
  const lastValueRef = useRef<number>(0);

  const generateNextValue = (current: number) => {
    const min = 50;
    const max = 700;
    let nextValue = current;
    let attempts = 0;

    while (attempts < 50) {
      // Change by ±5 to ±35
      const change = (Math.floor(Math.random() * 31) + 5) * (Math.random() > 0.5 ? 1 : -1);
      nextValue = current + change;

      // Clamp
      if (nextValue < min) nextValue = min + Math.floor(Math.random() * 20);
      if (nextValue > max) nextValue = max - Math.floor(Math.random() * 20);

      // Unique in last 25
      if (!historyRef.current.includes(nextValue)) {
        break;
      }
      attempts++;
    }

    // Update history
    const newHistory = [nextValue, ...historyRef.current].slice(0, 25);
    historyRef.current = newHistory;
    lastValueRef.current = nextValue;
    return nextValue;
  };

  useEffect(() => {
    // Initial random value between 200 and 500
    const initial = Math.floor(Math.random() * 301) + 200;
    setOnlineUsers(initial);
    lastValueRef.current = initial;
    historyRef.current = [initial];

    const interval = setInterval(() => {
      setOnlineUsers(prev => generateNextValue(lastValueRef.current));
    }, Math.floor(Math.random() * 15000) + 15000); // 15-30 seconds

    return () => clearInterval(interval);
  }, []);

  return activePlayers;
}
