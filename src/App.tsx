import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CurtainOpening } from './components/CurtainOpening';
import { GoldParticles } from './components/GoldParticles';
import { PdfSlideViewer } from './components/PdfSlideViewer';
import { ceremonyAudio } from './utils/ceremonyAudio';

const SLIDE_TITLES: Record<number, string> = {
  1: 'Muka Depan',
  2: 'Atur Cara Majlis',
  3: 'Jawatankuasa',
  4: 'Penghargaan',
};

type CurtainPhase = 'closed' | 'opening' | 'opened';

export default function App() {
  const pdfUrl = `${import.meta.env.BASE_URL}buku-program.pdf`;

  const [curtainPhase, setCurtainPhase] = useState<CurtainPhase>('closed');
  const [pdfReady, setPdfReady] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(4);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scrollToTarget, setScrollToTarget] = useState<{
    page: number;
    nonce: number;
  } | null>(null);
  const [scrollToClosingNonce, setScrollToClosingNonce] = useState<number>(0);

  const [zoom, setZoom] = useState<number>(1);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.55);
  const [showVolumePopover, setShowVolumePopover] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const volumePopoverRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | null>(null);

  const formatTwoDigits = (n: number) => String(n).padStart(2, '0');

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!showVolumePopover) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        volumePopoverRef.current &&
        !volumePopoverRef.current.contains(e.target as Node)
      ) {
        setShowVolumePopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [showVolumePopover]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
      }
      ceremonyAudio.dispose();
    };
  }, []);

  const handleOpenProgramme = useCallback(() => {
    if (curtainPhase !== 'closed') return;

    ceremonyAudio.setVolume(volume);
    ceremonyAudio.setMuted(!isMusicOn);
    if (isMusicOn) {
      ceremonyAudio.startMusic(true);
    }

    setCurtainPhase('opening');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openDuration = prefersReduced ? 380 : 1480;
    openTimerRef.current = window.setTimeout(() => {
      setCurtainPhase('opened');
    }, openDuration);
  }, [curtainPhase, isMusicOn, volume]);

  const scrollToPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages) return;
      setCurrentPage(targetPage);
      setScrollToTarget((prev) => ({
        page: targetPage,
        nonce: (prev?.nonce ?? 0) + 1,
      }));
      ceremonyAudio.playPageTurnSound();
    },
    [totalPages],
  );

  const handleNextSlide = useCallback(() => {
    if (currentPage < totalPages) {
      scrollToPage(currentPage + 1);
    } else {
      ceremonyAudio.playPageTurnSound();
      setScrollToClosingNonce((n) => n + 1);
    }
  }, [currentPage, scrollToPage, totalPages]);

  const handlePrevSlide = useCallback(() => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  }, [currentPage, scrollToPage]);

  const handleScrollToTop = useCallback(() => {
    setZoom(1);
    scrollToPage(1);
  }, [scrollToPage]);

  const handleReplayCurtain = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
    }
    setZoom(1);
    setCurrentPage(1);
    setScrollToTarget((prev) => ({ page: 1, nonce: (prev?.nonce ?? 0) + 1 }));
    setCurtainPhase('closed');
  }, []);

  const handleToggleMusic = useCallback(() => {
    const next = !isMusicOn;
    setIsMusicOn(next);
    ceremonyAudio.setMuted(!next);
  }, [isMusicOn]);

  const handleVolumeChange = useCallback(
    (nextVol: number) => {
      setVolume(nextVol);
      ceremonyAudio.setVolume(nextVol);
      if (nextVol > 0 && !isMusicOn) {
        setIsMusicOn(true);
        ceremonyAudio.setMuted(false);
      }
    },
    [isMusicOn],
  );

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenEnabled) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.25, Math.round((z + 0.25) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100));
  }, []);

  // Keyboard shortcuts for desktop accessibility
  useEffect(() => {
    if (curtainPhase !== 'opened') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        setZoom(1);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMusic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    curtainPhase,
    handleNextSlide,
    handlePrevSlide,
    handleToggleMusic,
    handleZoomIn,
    handleZoomOut,
  ]);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-b from-[#23040C] via-[#170208] to-[#110105] text-[#FAF4EA]">
      {/* Subtle Ambient Background Spotlight & Floating Gold Particles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="animate-spotlight absolute -top-24 left-1/2 h-[70vh] w-[min(96vw,860px)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 24, 56, 0.34) 0%, rgba(212, 175, 55, 0.1) 38%, transparent 72%)',
          }}
        />
        <GoldParticles density="subtle" />
      </div>

      {/* Theatre Curtain Opening Experience */}
      {curtainPhase !== 'opened' && (
        <CurtainOpening
          isOpening={curtainPhase === 'opening'}
          onOpen={handleOpenProgramme}
          pdfReady={pdfReady}
        />
      )}

      {/* Minimalist Top Utility Bar */}
      <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[#E6C27A]/15 bg-[#190309]/85 px-3 backdrop-blur-md sm:h-14 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rotate-45 bg-[#E6C27A]"
          />
          <span className="truncate font-serif text-base font-semibold tracking-wide text-[#FAF4EA] sm:text-lg">
            Anugerah Bintang PBD 2026
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Audio Toggle + Volume Control */}
          <div className="relative flex items-center" ref={volumePopoverRef}>
            <button
              type="button"
              onClick={handleToggleMusic}
              aria-label={isMusicOn ? 'Matikan muzik latar' : 'Hidupkan muzik latar'}
              title={isMusicOn ? 'Matikan muzik' : 'Hidupkan muzik'}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#E6C27A] transition-colors hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-[#E6C27A]"
            >
              {isMusicOn ? (
                <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 shrink-0 text-[#FAF4EA]/55" aria-hidden="true" />
              )}
              <span className="hidden whitespace-nowrap sm:inline">
                {isMusicOn ? 'Muzik' : 'Senyap'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowVolumePopover((v) => !v)}
              aria-label="Laras kelantangan muzik"
              aria-expanded={showVolumePopover}
              title="Kelantangan muzik"
              className="inline-flex min-h-[44px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg text-[#FAF4EA]/70 transition-colors hover:bg-white/8 hover:text-[#E6C27A] focus-visible:outline-2 focus-visible:outline-[#E6C27A]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <AnimatePresence>
              {showVolumePopover && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 z-30 mt-2 w-48 rounded-xl border border-[#E6C27A]/30 bg-[#25040D]/95 p-3 shadow-2xl backdrop-blur-md"
                >
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#FAF4EA]/85">
                    <span>Kelantangan</span>
                    <span className="tabular-nums text-[#E6C27A]">
                      {Math.round((isMusicOn ? volume : 0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMusicOn ? volume : 0}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    aria-label="Kelantangan muzik latar"
                    className="h-2 w-full cursor-pointer accent-[#E6C27A]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? 'Keluar skrin penuh' : 'Paparan skrin penuh'}
            title={isFullscreen ? 'Keluar skrin penuh' : 'Skrin penuh'}
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-[#FAF4EA]/85 transition-colors hover:bg-white/8 hover:text-[#E6C27A] focus-visible:outline-2 focus-visible:outline-[#E6C27A]"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* Download Original PDF */}
          <a
            href={pdfUrl}
            download="Buku-Program-Anugerah-Bintang-PBD-2026.pdf"
            aria-label="Muat turun PDF Buku Program"
            title="Muat turun PDF asal"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#E6C27A]/35 bg-[#E6C27A]/12 px-2.5 text-xs font-semibold text-[#F7E3B0] transition-colors hover:bg-[#E6C27A]/22 focus-visible:outline-2 focus-visible:outline-[#E6C27A] sm:px-3.5"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden whitespace-nowrap sm:inline">Muat Turun</span>
          </a>
        </div>
      </header>

      {/* Main Phone-Style Vertical Scroll Stage */}
      <main className="relative z-10 min-h-0 flex-1">
        <PdfSlideViewer
          pdfUrl={pdfUrl}
          zoom={zoom}
          isOpened={curtainPhase !== 'closed'}
          onZoomChange={setZoom}
          onPageLoadedCount={setTotalPages}
          onReadyChange={setPdfReady}
          onActivePageChange={setCurrentPage}
          scrollToTarget={scrollToTarget}
          scrollToClosingNonce={scrollToClosingNonce}
          onScrollToTop={handleScrollToTop}
          onReplayCurtain={handleReplayCurtain}
        />
      </main>

      {/* Minimalist Ergonomic Bottom Navigation Dock */}
      <footer className="relative z-20 shrink-0 border-t border-[#E6C27A]/15 bg-[#190309]/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:px-6">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2">
          {/* Scroll Up / Previous Section */}
          <button
            type="button"
            onClick={handlePrevSlide}
            disabled={currentPage <= 1}
            aria-label="Ke halaman atas"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#FAF4EA] transition-colors hover:bg-white/8 hover:text-[#F7E3B0] focus-visible:outline-2 focus-visible:outline-[#E6C27A] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronUp className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="hidden whitespace-nowrap sm:inline">Atas</span>
          </button>

          {/* Center Page Counter & Quick Jump Dots */}
          <div className="flex min-w-0 flex-col items-center justify-center">
            <span className="text-xs font-semibold tracking-widest text-[#F7E3B0] tabular-nums sm:text-sm">
              {formatTwoDigits(currentPage)} / {formatTwoDigits(totalPages)}
            </span>

            <div
              className="mt-1 flex items-center gap-1.5"
              role="tablist"
              aria-label="Lompat ke halaman"
            >
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                const active = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`${SLIDE_TITLES[pageNum] ?? `Halaman ${pageNum}`}`}
                    onClick={() => scrollToPage(pageNum)}
                    className="group flex h-4 cursor-pointer items-center justify-center px-1 focus-visible:outline-2 focus-visible:outline-[#E6C27A]"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-200 ${
                        active
                          ? 'w-5 bg-[#E6C27A]'
                          : 'w-1.5 bg-[#FAF4EA]/30 group-hover:bg-[#E6C27A]/65'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Group: Zoom Controls + Scroll Down / Next */}
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden items-center rounded-lg border border-[#E6C27A]/20 bg-black/25 px-1 sm:flex">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                aria-label="Zum keluar"
                title="Zum keluar"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[#FAF4EA]/85 transition-colors hover:text-[#E6C27A] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Tetapkan semula zum kepada 100%"
                title="Tetapkan semula zum"
                className="min-w-[44px] cursor-pointer px-1 text-center text-[11px] font-medium text-[#E6C27A] tabular-nums"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.25}
                aria-label="Zum masuk"
                title="Zum masuk"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[#FAF4EA]/85 transition-colors hover:text-[#E6C27A] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Compact Mobile Zoom Toggle */}
            <button
              type="button"
              onClick={() => setZoom((z) => (z > 1.05 ? 1 : 1.65))}
              aria-label={zoom > 1.05 ? 'Tetapkan semula zum' : 'Zum masuk'}
              title={zoom > 1.05 ? 'Zum 100%' : 'Zum 165%'}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-[#FAF4EA]/85 transition-colors hover:bg-white/8 hover:text-[#E6C27A] sm:hidden"
            >
              {zoom > 1.05 ? (
                <ZoomOut className="h-4 w-4 text-[#E6C27A]" aria-hidden="true" />
              ) : (
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNextSlide}
              aria-label={currentPage < totalPages ? 'Ke halaman bawah' : 'Ke penutup'}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#F7E3B0] transition-colors hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-[#E6C27A]"
            >
              <span className="hidden whitespace-nowrap sm:inline">
                {currentPage < totalPages ? 'Bawah' : 'Penutup'}
              </span>
              <ChevronDown className="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
