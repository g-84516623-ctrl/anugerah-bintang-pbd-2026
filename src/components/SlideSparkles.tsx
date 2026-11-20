import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface SlideSparklesProps {
  triggerKey: number;
}

const SPARKLE_POINTS = [
  { id: 1, top: '8%', left: '-10px', delay: 0, size: 12 },
  { id: 2, top: '24%', right: '-10px', delay: 0.08, size: 10 },
  { id: 3, top: '52%', left: '-11px', delay: 0.14, size: 9 },
  { id: 4, top: '76%', right: '-9px', delay: 0.06, size: 13 },
  { id: 5, bottom: '-9px', left: '28%', delay: 0.12, size: 10 },
  { id: 6, top: '-9px', right: '26%', delay: 0.04, size: 11 },
];

export function SlideSparkles({ triggerKey }: SlideSparklesProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || triggerKey <= 0) {
    return null;
  }

  return (
    <AnimatePresence mode="popLayout">
      <div
        key={triggerKey}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20"
      >
        {SPARKLE_POINTS.map((sp) => (
          <motion.svg
            key={sp.id}
            width={sp.size}
            height={sp.size}
            viewBox="0 0 16 16"
            fill="none"
            style={{
              position: 'absolute',
              top: sp.top,
              right: sp.right,
              bottom: sp.bottom,
              left: sp.left,
            }}
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
            animate={{
              opacity: [0, 0.95, 0],
              scale: [0.4, 1.15, 0.5],
              rotate: [0, 35, 65],
            }}
            transition={{
              duration: 0.72,
              delay: sp.delay,
              ease: 'easeOut',
            }}
          >
            <path
              d="M8 0L9.6 6.4L16 8L9.6 9.6L8 16L6.4 9.6L0 8L6.4 6.4L8 0Z"
              fill="#F7E3B0"
            />
          </motion.svg>
        ))}
      </div>
    </AnimatePresence>
  );
}
