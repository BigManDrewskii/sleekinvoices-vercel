import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
}

// Custom hook for triggering confetti
export function useConfetti() {
  const fire = useCallback((options: ConfettiOptions = {}) => {
    const defaults = {
      particleCount: 100,
      spread: 70,
      startVelocity: 30,
      decay: 0.95,
      scalar: 1,
      origin: { y: 0.6 },
      colors: ["#5f6fff", "#a855f7", "#22c55e", "#eab308", "#ef4444"],
      ...options,
    };

    confetti(defaults);
  }, []);

  // Burst from both sides
  const fireworks = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.2, y: Math.random() - 0.2 },
        colors: ["#5f6fff", "#a855f7", "#22c55e"],
      });

      // Confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.2 + 0.8, y: Math.random() - 0.2 },
        colors: ["#5f6fff", "#a855f7", "#22c55e"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Subtle celebration (for smaller wins)
  const celebrate = useCallback(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#5f6fff", "#a855f7"],
      scalar: 0.8,
    });
  }, []);

  // Big celebration (for major milestones)
  const bigCelebration = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#5f6fff"],
    });
    fire(0.2, {
      spread: 60,
      colors: ["#a855f7"],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ["#22c55e"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ["#eab308"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ["#5f6fff", "#a855f7"],
    });
  }, []);

  // Money rain (for payment received)
  const moneyRain = useCallback(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 3,
        angle: 90,
        spread: 55,
        origin: { x: Math.random(), y: -0.1 },
        colors: ["#22c55e", "#16a34a", "#15803d"],
        shapes: ["circle"],
        gravity: 1.2,
        scalar: 1.5,
        drift: 0,
        ticks: 300,
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return {
    fire,
    fireworks,
    celebrate,
    bigCelebration,
    moneyRain,
  };
}

// Event-based confetti trigger
export function ConfettiTrigger() {
  const { celebrate, bigCelebration, moneyRain } = useConfetti();

  useEffect(() => {
    const handleInvoiceSent = () => celebrate();
    const handlePaymentReceived = () => moneyRain();
    const handleMilestone = () => bigCelebration();

    window.addEventListener("invoice-sent", handleInvoiceSent);
    window.addEventListener("payment-received", handlePaymentReceived);
    window.addEventListener("milestone-reached", handleMilestone);

    return () => {
      window.removeEventListener("invoice-sent", handleInvoiceSent);
      window.removeEventListener("payment-received", handlePaymentReceived);
      window.removeEventListener("milestone-reached", handleMilestone);
    };
  }, [celebrate, bigCelebration, moneyRain]);

  return null;
}

// Helper function to trigger confetti from anywhere
export const triggerConfetti = {
  invoiceSent: () => window.dispatchEvent(new CustomEvent("invoice-sent")),
  paymentReceived: () =>
    window.dispatchEvent(new CustomEvent("payment-received")),
  milestone: () => window.dispatchEvent(new CustomEvent("milestone-reached")),
};
