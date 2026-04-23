declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    scalar?: number;
    ticks?: number;
    shapes?: ('square' | 'circle')[];
    disableForReducedMotion?: boolean;
    zIndex?: number;
  }

  function confetti(options?: ConfettiOptions): Promise<void>;
  export default confetti;
}
