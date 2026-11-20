import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FileWarning, RotateCcw, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SlideSparkles } from './SlideSparkles';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfSlideViewerProps {
  pdfUrl: string;
  zoom: number;
  isOpened: boolean;
  onZoomChange: (nextZoom: number) => void;
  onPageLoadedCount: (count: number) => void;
  onReadyChange: (ready: boolean) => void;
  onActivePageChange: (page: number) => void;
  scrollToTarget: { page: number; nonce: number } | null;
  scrollToClosingNonce: number;
  onScrollToTop: () => void;
  onReplayCurtain: () => void;
}

interface PdfPageCardProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  totalPages: number;
  baseWidth: number;
  baseRatio: number;
  zoom: number;
  isOpened: boolean;
  isActive: boolean;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  registerElement: (page: number, el: HTMLElement | null) => void;
  onZoomToggle: () => void;
}

function PdfPageCard({
  pdfDoc,
  pageNumber,
  totalPages,
  baseWidth,
  baseRatio,
  zoom,
  isOpened,
  isActive,
  scrollRootRef,
  registerElement,
  onZoomToggle,
}: PdfPageCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const lastTapRef = useRef<number>(0);

  const [hasRendered, setHasRendered] = useState<boolean>(false);
  const [hasPoppedIn, setHasPoppedIn] = useState<boolean>(false);
  const [sparkleTick, setSparkleTick] = useState<number>(0);

  const displayWidth = Math.round(baseWidth * zoom);
  const displayHeight = Math.round((baseWidth / baseRatio) * zoom);

  // Trigger pop-up & sparkle burst when Page 1 opens or when page becomes active
  useEffect(() => {
    if ((pageNumber === 1 && isOpened) || (isOpened && isActive)) {
      if (!hasPoppedIn) {
        setHasPoppedIn(true);
        setSparkleTick((t) => t + 1);
      }
    }
  }, [pageNumber, isOpened, isActive, hasPoppedIn]);

  // Render this page crisply onto its own dedicated persistent canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const targetPixelWidth = Math.min(2200, Math.max(320, Math.round(displayWidth * dpr)));

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const baseVp = page.getViewport({ scale: 1 });
        const scale = targetPixelWidth / baseVp.width;
        const viewport = page.getViewport({ scale });

        const offscreen = document.createElement('canvas');
        offscreen.width = Math.floor(viewport.width);
        offscreen.height = Math.floor(viewport.height);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const task = page.render({
          canvas: offscreen,
          viewport,
        });
        renderTaskRef.current = task;

        await task.promise;
        if (cancelled) return;

        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(offscreen, 0, 0);
        }
        setHasRendered(true);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          err.name === 'RenderingCancelledException'
        ) {
          return;
        }
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNumber, displayWidth]);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      onZoomToggle();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <section
      ref={(el) => registerElement(pageNumber, el)}
      data-page-number={pageNumber}
      aria-label={`Halaman ${pageNumber} daripada ${totalPages}`}
      className="flex w-full flex-col items-center scroll-mt-4 [perspective:1100px]"
    >
      {/* Pop-Up Reveal Container (once: true ensures pages NEVER vanish when scrolling) */}
      <motion.div
        initial={
          prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 0, scale: 0.85, y: 42, rotateX: 5 }
        }
        animate={
          hasPoppedIn
            ? { opacity: 1, scale: 1, y: 0, rotateX: 0 }
            : undefined
        }
        whileInView={
          isOpened
            ? { opacity: 1, scale: 1, y: 0, rotateX: 0 }
            : undefined
        }
        viewport={{ root: scrollRootRef, once: true, amount: 0.05 }}
        onViewportEnter={() => {
          if (isOpened && !hasPoppedIn) {
            setHasPoppedIn(true);
            setSparkleTick((t) => t + 1);
          }
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0.2 }
            : {
                type: 'spring',
                stiffness: 165,
                damping: 18,
                mass: 0.9,
                delay: pageNumber === 1 && isOpened ? 0.16 : 0,
              }
        }
        className={`relative max-w-full ${
          zoom > 1.05 ? 'overflow-x-auto pb-2' : 'overflow-visible'
        }`}
      >
        <div
          onClick={handleTap}
          className="relative mx-auto"
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
          }}
        >
          {/* Ambient Golden Backlight Glow */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -inset-4 -z-10 rounded-3xl blur-2xl transition-opacity duration-500 ${
              isActive ? 'opacity-95' : 'opacity-45'
            }`}
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(230, 194, 122, 0.3), rgba(128, 14, 42, 0.26) 60%, transparent 80%)',
            }}
          />

          {/* Pop-Up Sparkle Burst */}
          <SlideSparkles triggerKey={sparkleTick} />

          {/* Corner Metallic Brackets */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1.5 -left-1.5 z-10 h-4 w-4 rounded-tl-md border-t-2 border-l-2 border-[#F7E3B0]/70"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 h-4 w-4 rounded-tr-md border-t-2 border-r-2 border-[#F7E3B0]/70"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-10 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-[#F7E3B0]/70"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-1.5 -bottom-1.5 z-10 h-4 w-4 rounded-br-md border-r-2 border-b-2 border-[#F7E3B0]/70"
          />

          {/* Exact A4 Framed Canvas */}
          <div
            className={`relative h-full w-full overflow-hidden rounded-lg border bg-[#23050C] transition-shadow duration-500 ${
              isActive
                ? 'border-[#E6C27A]/65 shadow-[0_24px_65px_rgba(0,0,0,0.85),0_0_40px_rgba(212,175,55,0.22)]'
                : 'border-[#E6C27A]/30 shadow-[0_16px_45px_rgba(0,0,0,0.7)]'
            }`}
          >
            <canvas
              ref={canvasRef}
              aria-label={`Halaman ${pageNumber} daripada ${totalPages}`}
              className="block h-full w-full"
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
            />

            {/* Subtle Gold Light Sheen Sweep on Pop-Up Reveal */}
            {hasPoppedIn && !prefersReducedMotion && (
              <motion.div
                aria-hidden="true"
                initial={{ x: '-130%', opacity: 0.7 }}
                animate={{ x: '150%', opacity: 0 }}
                transition={{ duration: 0.95, ease: 'easeOut', delay: 0.12 }}
                className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[#FFF1C9]/22 to-transparent"
              />
            )}

            {!hasRendered && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#23050C]"
              >
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E6C27A]/25 border-t-[#E6C27A]" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function PdfSlideViewer({
  pdfUrl,
  zoom,
  isOpened,
  onZoomChange,
  onPageLoadedCount,
  onReadyChange,
  onActivePageChange,
  scrollToTarget,
  scrollToClosingNonce,
  onScrollToTop,
  onReplayCurtain,
}: PdfSlideViewerProps) {
  const prefersReducedMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageElementsRef = useRef<Map<number, HTMLElement>>(new Map());
  const closingSectionRef = useRef<HTMLElement | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const userInteractedRef = useRef<boolean>(false);
  const nudgeRafRef = useRef<number | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(4);
  const [activePage, setActivePage] = useState<number>(1);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(380);
  const [containerHeight, setContainerHeight] = useState<number>(640);
  const [baseRatio, setBaseRatio] = useState<number>(1 / Math.SQRT2);

  // Measure vertical scroll viewport dimensions
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  // Load PDF document once
  useEffect(() => {
    let cancelled = false;
    setErrorMessage(null);
    onReadyChange(false);

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapPacked: true,
    });

    loadingTask.onProgress = (progress: pdfjsLib.OnProgressParameters) => {
      if (cancelled) return;
      if (progress.total > 0) {
        setLoadingProgress(Math.min(100, Math.round((progress.loaded / progress.total) * 100)));
      }
    };

    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;

    loadingTask.promise
      .then(async (doc) => {
        if (cancelled) {
          void doc.cleanup();
          return;
        }
        loadedDoc = doc;
        setTotalPages(doc.numPages);
        onPageLoadedCount(doc.numPages);

        const firstPage = await doc.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        if (!cancelled && vp.width > 0 && vp.height > 0) {
          setBaseRatio(vp.width / vp.height);
        }

        if (!cancelled) {
          setPdfDoc(doc);
          onReadyChange(true);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Gagal memuatkan fail buku-program.pdf.';
        setErrorMessage(msg);
        onReadyChange(true);
      });

    return () => {
      cancelled = true;
      if (loadedDoc) {
        void loadedDoc.cleanup();
      }
      void loadingTask.destroy();
    };
  }, [pdfUrl, onPageLoadedCount, onReadyChange]);

  // Observe which page is most centered while user scrolls vertically
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || !pdfDoc) return;

    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const p = Number((entry.target as HTMLElement).dataset.pageNumber);
          if (!Number.isNaN(p)) {
            ratios.set(p, entry.intersectionRatio);
          }
        }

        let bestPage = activePage;
        let bestRatio = -1;
        ratios.forEach((ratio, pageNum) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = pageNum;
          }
        });

        if (bestRatio > 0.08 && bestPage !== activePage) {
          setActivePage(bestPage);
          onActivePageChange(bestPage);
        }
      },
      {
        root,
        threshold: [0.1, 0.25, 0.45, 0.65, 0.85],
      },
    );

    pageElementsRef.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pdfDoc, activePage, onActivePageChange]);

  // Subtle downward peek/nudge scroll if user hasn't scrolled yet after opening
  useEffect(() => {
    if (!isOpened || !pdfDoc || prefersReducedMotion) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    userInteractedRef.current = false;

    const cancelNudge = () => {
      userInteractedRef.current = true;
      if (nudgeRafRef.current !== null) {
        window.cancelAnimationFrame(nudgeRafRef.current);
        nudgeRafRef.current = null;
      }
      container.style.scrollBehavior = '';
    };

    const runNudge = (distancePx: number) => {
      if (userInteractedRef.current || container.scrollTop > 12) return;

      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll < 40) return;
      const targetOffset = Math.min(distancePx, maxScroll);

      container.style.scrollBehavior = 'auto';
      const downDuration = 680;
      const holdDuration = 280;
      const upDuration = 620;
      const totalDuration = downDuration + holdDuration + upDuration;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now: number) => {
        if (userInteractedRef.current) {
          container.style.scrollBehavior = '';
          return;
        }

        const elapsed = now - startTime;
        if (elapsed < downDuration) {
          const p = easeInOutCubic(elapsed / downDuration);
          container.scrollTop = targetOffset * p;
        } else if (elapsed < downDuration + holdDuration) {
          container.scrollTop = targetOffset;
        } else if (elapsed < totalDuration) {
          const p = easeInOutCubic((elapsed - downDuration - holdDuration) / upDuration);
          container.scrollTop = targetOffset * (1 - p);
        } else {
          container.scrollTop = 0;
          container.style.scrollBehavior = '';
          nudgeRafRef.current = null;
          return;
        }

        nudgeRafRef.current = window.requestAnimationFrame(step);
      };

      nudgeRafRef.current = window.requestAnimationFrame(step);
    };

    const onUserTouchOrWheel = () => {
      cancelNudge();
    };

    container.addEventListener('wheel', onUserTouchOrWheel, { passive: true });
    container.addEventListener('touchstart', onUserTouchOrWheel, { passive: true });
    container.addEventListener('pointerdown', onUserTouchOrWheel, { passive: true });

    const firstNudgeTimer = window.setTimeout(() => runNudge(96), 2100);
    const secondNudgeTimer = window.setTimeout(() => runNudge(78), 7200);

    return () => {
      window.clearTimeout(firstNudgeTimer);
      window.clearTimeout(secondNudgeTimer);
      if (nudgeRafRef.current !== null) {
        window.cancelAnimationFrame(nudgeRafRef.current);
        nudgeRafRef.current = null;
      }
      container.style.scrollBehavior = '';
      container.removeEventListener('wheel', onUserTouchOrWheel);
      container.removeEventListener('touchstart', onUserTouchOrWheel);
      container.removeEventListener('pointerdown', onUserTouchOrWheel);
    };
  }, [isOpened, pdfDoc, prefersReducedMotion]);

  // Programmatic smooth scroll when user taps Next / Prev / Page Dots
  useEffect(() => {
    if (!scrollToTarget) return;
    userInteractedRef.current = true;
    const el = pageElementsRef.current.get(scrollToTarget.page);
    if (el) {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  }, [scrollToTarget, prefersReducedMotion]);

  // Smooth scroll to Closing section at bottom
  useEffect(() => {
    if (scrollToClosingNonce <= 0) return;
    userInteractedRef.current = true;
    closingSectionRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [scrollToClosingNonce, prefersReducedMotion]);

  // Compute crisp responsive A4 base width fitting both mobile portrait and desktop cleanly
  const computeBaseWidth = (): number => {
    const horizontalPadding = containerWidth < 640 ? 28 : 64;
    const maxByWidth = Math.max(240, Math.min(560, containerWidth - horizontalPadding));
    const maxByHeight = Math.max(260, Math.floor((containerHeight - 54) * baseRatio));
    return Math.min(maxByWidth, maxByHeight);
  };

  const baseWidth = computeBaseWidth();

  const registerElement = (page: number, el: HTMLElement | null) => {
    if (el) {
      pageElementsRef.current.set(page, el);
    } else {
      pageElementsRef.current.delete(page);
    }
  };

  // Two-finger pinch-to-zoom support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDistRef.current;
      const clamped = Math.min(2.25, Math.max(1, Math.round(pinchStartZoomRef.current * ratio * 20) / 20));
      onZoomChange(clamped);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartDistRef.current = null;
    }
  };

  if (errorMessage) {
    return (
      <div
        ref={scrollContainerRef}
        className="flex h-full w-full items-center justify-center p-6"
      >
        <div className="w-full max-w-md rounded-2xl border border-[#E6C27A]/35 bg-[#2A050E]/90 p-7 text-center shadow-2xl">
          <FileWarning className="mx-auto mb-3 h-10 w-10 text-[#E6C27A]" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-semibold text-[#FAF4EA]">
            Fail Buku Program Tidak Ditemui
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#FAF4EA]/80">
            Pastikan fail PDF rasmi diletakkan di laluan{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-[#F7E3B0]">
              /public/buku-program.pdf
            </code>{' '}
            supaya keempat-empat halaman program dapat dipaparkan dengan tepat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-full w-full overflow-x-hidden overflow-y-auto scroll-smooth overscroll-y-contain"
    >
      {!pdfDoc ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E6C27A]/25 border-t-[#E6C27A]" />
          <p className="font-serif text-lg tracking-wide text-[#FAF4EA]/90">
            Menyediakan Buku Program…
          </p>
          <div className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#C99733] to-[#F7E3B0] transition-all duration-200"
              style={{ width: `${Math.max(12, loadingProgress)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-7 px-3 pt-4 pb-14 sm:gap-12 sm:px-6 sm:pt-7 sm:pb-20">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
            <PdfPageCard
              key={pageNum}
              pdfDoc={pdfDoc}
              pageNumber={pageNum}
              totalPages={totalPages}
              baseWidth={baseWidth}
              baseRatio={baseRatio}
              zoom={zoom}
              isOpened={isOpened}
              isActive={activePage === pageNum}
              scrollRootRef={scrollContainerRef}
              registerElement={registerElement}
              onZoomToggle={() => onZoomChange(zoom > 1.1 ? 1 : 1.65)}
            />
          ))}

          {/* Celebratory Pop-Up Closing Section beneath Page 4 */}
          <motion.section
            ref={closingSectionRef}
            aria-label="Penutup Buku Program"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: 36 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ root: scrollContainerRef, once: true, amount: 0.15 }}
            transition={{
              type: 'spring',
              stiffness: 165,
              damping: 20,
            }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E6C27A]/35 bg-gradient-to-b from-[#330612]/90 to-[#190208]/95 p-7 text-center shadow-[0_22px_60px_rgba(0,0,0,0.8),0_0_32px_rgba(212,175,55,0.16)] sm:p-8"
          >
            <div className="mx-auto mb-3 flex items-center justify-center gap-3 text-[#E6C27A]">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#E6C27A]/70" />
              <Sparkles className="h-4 w-4 text-[#F7E3B0]" aria-hidden="true" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#E6C27A]/70" />
            </div>

            <h2 className="gold-metallic-text font-serif text-4xl font-semibold tracking-wide sm:text-5xl">
              Terima Kasih
            </h2>

            <p className="mt-2.5 text-sm font-medium tracking-wide text-[#FAF4EA]/90">
              Sekolah Kebangsaan Abdul Samat
            </p>
            <p className="mt-1 text-xs tracking-[0.14em] text-[#E6C27A]/80">
              23 November 2026
            </p>

            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[#E6C27A]/35 to-transparent" />

            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onScrollToTop}
                className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#FFF1C9]/45 px-5 py-2.5 text-xs font-bold tracking-wider text-[#1C0309] uppercase shadow-lg transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[#F7E3B0] active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(135deg, #F7E3B0 0%, #E6C27A 50%, #C99733 100%)',
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Kembali ke Atas</span>
              </button>

              <button
                type="button"
                onClick={onReplayCurtain}
                className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E6C27A]/30 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-wider text-[#FAF4EA]/90 uppercase transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E6C27A]"
              >
                <span className="whitespace-nowrap">Mainkan Semula Tirai</span>
              </button>
            </div>
          </motion.section>
        </div>
      )}
    </div>
  );
}
