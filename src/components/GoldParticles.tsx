import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  alpha: number;
  twinkleSpeed: number;
}

interface GoldParticlesProps {
  density?: 'subtle' | 'ceremony';
  className?: string;
}

export function GoldParticles({ density = 'subtle', className = '' }: GoldParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const createParticles = (count: number) => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.9 + Math.random() * 2.1,
        speedY: 0.14 + Math.random() * 0.28,
        swayAmp: 0.2 + Math.random() * 0.55,
        swayFreq: 0.008 + Math.random() * 0.012,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.55,
        twinkleSpeed: 0.015 + Math.random() * 0.025,
      }));
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || window.innerWidth;
      height = rect?.height || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = width < 768;
      const targetCount =
        density === 'ceremony' ? (isMobile ? 26 : 42) : isMobile ? 16 : 28;
      createParticles(targetCount);
    };

    resize();
    window.addEventListener('resize', resize);

    let tick = 0;
    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.y -= p.speedY;
          p.x += Math.sin(tick * p.swayFreq + p.phase) * p.swayAmp;

          if (p.y < -12) {
            p.y = height + 12;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const twinkle = prefersReducedMotion
          ? p.alpha
          : p.alpha * (0.65 + 0.35 * Math.sin(tick * p.twinkleSpeed + p.phase));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.2);
        grad.addColorStop(0, `rgba(255, 236, 179, ${twinkle})`);
        grad.addColorStop(0.45, `rgba(212, 175, 55, ${twinkle * 0.65})`);
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
