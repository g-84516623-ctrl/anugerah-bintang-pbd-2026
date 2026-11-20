import { motion, useReducedMotion } from 'motion/react';
import { GoldParticles } from './GoldParticles';

interface CurtainOpeningProps {
  isOpening: boolean;
  onOpen: () => void;
  pdfReady: boolean;
}

export function CurtainOpening({ isOpening, onOpen, pdfReady }: CurtainOpeningProps) {
  const prefersReducedMotion = useReducedMotion();

  const curtainTransition = prefersReducedMotion
    ? { duration: 0.35 }
    : { duration: 1.45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden select-none ${
        isOpening ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Pembukaan Buku Program Anugerah Bintang PBD Tahap 1 2026"
    >
      {/* Left Maroon Velvet Curtain */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: isOpening ? '-103%' : '0%' }}
        transition={curtainTransition}
        className="velvet-curtain-left absolute inset-y-0 left-0 w-1/2 shadow-[24px_0_60px_rgba(0,0,0,0.85)]"
      >
        {/* Subtle curtain drape shadow gradient toward center */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(10,1,3,0.45) 0%, rgba(10,1,3,0) 45%, rgba(10,1,3,0.5) 100%)',
          }}
        />
        {/* Metallic Champagne Gold Vertical Inner Edge Trim */}
        <div className="gold-trim-vertical absolute inset-y-0 right-0 w-[3px] shadow-[0_0_18px_rgba(230,194,122,0.55)]" />
        <div className="absolute inset-y-0 right-[7px] w-[1px] bg-[#E6C27A]/40" />
        {/* Bottom Gold Hem Trim */}
        <div className="gold-trim-horizontal absolute inset-x-0 bottom-0 h-[4px] opacity-85" />
      </motion.div>

      {/* Right Maroon Velvet Curtain */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: isOpening ? '103%' : '0%' }}
        transition={curtainTransition}
        className="velvet-curtain-right absolute inset-y-0 right-0 w-1/2 shadow-[-24px_0_60px_rgba(0,0,0,0.85)]"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(270deg, rgba(10,1,3,0.45) 0%, rgba(10,1,3,0) 45%, rgba(10,1,3,0.5) 100%)',
          }}
        />
        {/* Metallic Champagne Gold Vertical Inner Edge Trim */}
        <div className="gold-trim-vertical absolute inset-y-0 left-0 w-[3px] shadow-[0_0_18px_rgba(230,194,122,0.55)]" />
        <div className="absolute inset-y-0 left-[7px] w-[1px] bg-[#E6C27A]/40" />
        {/* Bottom Gold Hem Trim */}
        <div className="gold-trim-horizontal absolute inset-x-0 bottom-0 h-[4px] opacity-85" />
      </motion.div>

      {/* Warm Theatre Spotlight & Floating Gold Motes (fades gracefully on open) */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isOpening ? 0 : 1 }}
        transition={{ duration: prefersReducedMotion ? 0.2 : 0.65, ease: 'easeOut' }}
        className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center"
      >
        {/* Overhead Theatre Spotlight */}
        <div
          aria-hidden="true"
          className="animate-spotlight pointer-events-none absolute top-0 left-1/2 h-[82vh] w-[min(92vw,680px)] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse 65% 58% at 50% 34%, rgba(230, 194, 122, 0.2) 0%, rgba(140, 20, 48, 0.22) 42%, rgba(20, 2, 7, 0) 78%)',
          }}
        />

        <GoldParticles density="ceremony" />

        {/* Center Invitation Crest */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex max-w-lg flex-col items-center"
        >
          {/* Minimal Luxury Star & Filigree Ornament */}
          <svg
            width="124"
            height="36"
            viewBox="0 0 124 36"
            fill="none"
            aria-hidden="true"
            className="mb-5 text-[#E6C27A]"
          >
            <line x1="4" y1="18" x2="44" y2="18" stroke="url(#goldLineL)" strokeWidth="1" />
            <line x1="80" y1="18" x2="120" y2="18" stroke="url(#goldLineR)" strokeWidth="1" />
            <path
              d="M62 4L65.4 13.4L75 14L67.6 20.1L70.1 29.6L62 24.3L53.9 29.6L56.4 20.1L49 14L58.6 13.4L62 4Z"
              fill="url(#goldStar)"
            />
            <circle cx="44" cy="18" r="1.75" fill="#E6C27A" />
            <circle cx="80" cy="18" r="1.75" fill="#E6C27A" />
            <defs>
              <linearGradient id="goldLineL" x1="4" y1="18" x2="44" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E6C27A" stopOpacity="0" />
                <stop offset="1" stopColor="#E6C27A" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="goldLineR" x1="80" y1="18" x2="120" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E6C27A" stopOpacity="0.9" />
                <stop offset="1" stopColor="#E6C27A" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="goldStar" x1="49" y1="4" x2="75" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF1C9" />
                <stop offset="0.5" stopColor="#E6C27A" />
                <stop offset="1" stopColor="#A67C23" />
              </linearGradient>
            </defs>
          </svg>

          <p className="mb-2 text-xs font-medium tracking-[0.26em] text-[#E6C27A]/90 uppercase">
            Buku Program Digital
          </p>

          <h1
            className="gold-metallic-text font-serif text-4xl leading-[1.08] font-semibold tracking-wide sm:text-5xl md:text-6xl"
            style={{ textWrap: 'balance' }}
          >
            Anugerah Bintang PBD
          </h1>

          <p className="mt-2 font-serif text-2xl font-medium tracking-[0.14em] text-[#FAF4EA]/95 sm:text-3xl">
            Tahap 1 · 2026
          </p>

          <div className="my-6 h-px w-40 bg-gradient-to-r from-transparent via-[#E6C27A]/55 to-transparent" />

          {/* Primary Curtain Opening Button */}
          <button
            type="button"
            onClick={onOpen}
            className="group relative inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg border border-[#FFF1C9]/55 px-8 py-3.5 text-sm font-bold tracking-[0.14em] text-[#1C0309] uppercase shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_28px_rgba(212,175,55,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_18px_46px_rgba(0,0,0,0.75),0_0_36px_rgba(230,194,122,0.48)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7E3B0] active:scale-[0.98]"
            style={{
              background:
                'linear-gradient(135deg, #F7E3B0 0%, #E6C27A 42%, #C99733 78%, #F3D998 100%)',
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            <span className="relative whitespace-nowrap">BUKA BUKU PROGRAM</span>
          </button>

          {/* Small Event Title Underneath */}
          <p className="mt-5 text-xs leading-relaxed tracking-wider text-[#FAF4EA]/80 sm:text-sm">
            Sekolah Kebangsaan Abdul Samat
            <span className="mx-2 text-[#E6C27A]/70" aria-hidden="true">
              ·
            </span>
            23 November 2026
          </p>

          <p className="mt-2 h-4 text-[11px] tracking-wide text-[#E6C27A]/65">
            {pdfReady ? '' : 'Memuatkan halaman buku program...'}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
