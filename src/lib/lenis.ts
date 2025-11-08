import Lenis from '@studio-freight/lenis';

let globalLenis: Lenis | null = null;
let rafId: number | null = null;

const startRaf = () => {
  const loop = (time: number) => {
    globalLenis?.raf(time);
    rafId = window.requestAnimationFrame(loop);
  };

  rafId = window.requestAnimationFrame(loop);
};

export const initLenis = () => {
  if (globalLenis) {
    return globalLenis;
  }

  globalLenis = new Lenis({
    duration: 0.4,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  startRaf();

  return globalLenis;
};

export const destroyLenis = () => {
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  globalLenis?.destroy();
  globalLenis = null;
};

export const getLenis = () => globalLenis;

