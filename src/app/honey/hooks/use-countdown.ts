"use client";

import { useEffect, useState } from "react";

export function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function calc() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

/** Days + hours remaining until the end of the current month. */
export function useMonthCountdown(): { days: number; hours: number } {
  const [left, setLeft] = useState({ days: 0, hours: 0 });
  useEffect(() => {
    function calc() {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      const diff = Math.max(0, endOfMonth.getTime() - now.getTime());
      return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
      };
    }
    setLeft(calc());
    const id = setInterval(() => setLeft(calc()), 60_000);
    return () => clearInterval(id);
  }, []);
  return left;
}
