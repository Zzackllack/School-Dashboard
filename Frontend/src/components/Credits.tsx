import { useEffect, useState } from "react";

// ─── Slideshow image manifest ──────────────────────────────────────────────────
// `ratio` = display width / height after EXIF orientation correction.
// Shots taken in portrait mode (EXIF orientation 6/8) display with ratio < 1.
const IMAGES = [
  {
    src: "/images/lk-exkursion-hamburg.jpeg",
    alt: "LK Exkursion Hamburg",
    ratio: 4 / 3,
  },
  { src: "/images/c+n.jpeg", alt: "Cédric & Nikolas", ratio: 4 / 3 },
  { src: "/images/c+n-2.jpeg", alt: "Cédric & Nikolas", ratio: 4 / 3 },
  { src: "/images/c+n-3.jpeg", alt: "Cédric & Nikolas", ratio: 3 / 4 }, // portrait
  { src: "/images/c+n-4.jpeg", alt: "Cédric & Nikolas", ratio: 4 / 3 },
  { src: "/images/cm+e.jpeg", alt: "Foto vom Team", ratio: 4 / 3 },
  { src: "/images/h+c+n.jpeg", alt: "Foto vom Team", ratio: 3 / 4 }, // portrait
] as const;

const SLIDE_INTERVAL = 8_000;

function toWsrvUrl(publicSrc: string): string | null {
  if (typeof window === "undefined") return null;
  const wsrv = new URL("https://wsrv.nl/");
  wsrv.searchParams.set(
    "url",
    new URL(publicSrc, window.location.origin).toString(),
  );
  wsrv.searchParams.set("output", "webp");
  wsrv.searchParams.set("q", "80");
  wsrv.searchParams.set("w", "720");
  return wsrv.toString();
}

// ─── Two-slot state ────────────────────────────────────────────────────────────
// Slots A (0) and B (1) alternate ownership so React keeps the same <img> DOM
// nodes alive and CSS animations trigger naturally on prop changes.
type SlideshowState = {
  slots: [number, number | null]; // image index per slot; B starts empty
  active: 0 | 1;
};

const Credits = () => {
  const [{ slots, active }, setState] = useState<SlideshowState>({
    slots: [0, null],
    active: 0,
  });

  // Track which public srcs have had their WSRV URL fail so we fall back once.
  const [wsrvFailed, setWsrvFailed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const getSrc = (publicSrc: string): string => {
    if (!import.meta.env.PROD || wsrvFailed.has(publicSrc)) return publicSrc;
    return toWsrvUrl(publicSrc) ?? publicSrc;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        const currentIdx = prev.slots[prev.active]!;
        const nextIdx = (currentIdx + 1) % IMAGES.length;
        const nextSlot: 0 | 1 = prev.active === 0 ? 1 : 0;
        const newSlots = [...prev.slots] as [number, number | null];
        newSlots[nextSlot] = nextIdx;
        return { slots: newSlots, active: nextSlot };
      });
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const currentImg = IMAGES[slots[active]!];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
        Credits
      </h2>

      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-[#3E3128] mb-2">
            Dieses Dashboard wurde mit ♥️ von <strong>Cédric</strong> und
            mithilfe des Informatik Leistungskurses 24/26 gemacht
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto max-w-[18rem]">
            {/*
             * The container height is driven by padding-bottom (classic aspect-ratio
             * trick). When the incoming image has a different ratio the padding-bottom
             * value changes and the CSS transition on that property creates the smooth
             * "morph" effect between landscape and portrait frames.
             */}
            <div
              className="relative overflow-hidden rounded-lg border border-gray-200 shadow-md"
              style={{
                paddingBottom: `${(1 / currentImg.ratio) * 100}%`,
                transition: "padding-bottom 750ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {([0, 1] as const).map((slot) => {
                const imgIdx = slots[slot];
                if (imgIdx === null) return null;
                const img = IMAGES[imgIdx];
                const isActive = slot === active;
                const resolvedSrc = getSrc(img.src);
                return (
                  <img
                    // Key changes when the image index changes, so React re-mounts
                    // the element and the enter animation re-triggers from scratch.
                    key={`${slot}-${imgIdx}`}
                    src={resolvedSrc}
                    alt={img.alt}
                    className={`absolute inset-0 h-full w-full object-cover ${
                      isActive ? "credits-slide-enter" : "credits-slide-leave"
                    }`}
                    style={{ zIndex: isActive ? 1 : 0 }}
                    onError={() => {
                      if (resolvedSrc !== img.src) {
                        console.warn(
                          `[Credits] WSRV failed for ${img.src}, using original`,
                        );
                        setWsrvFailed((prev) => new Set([...prev, img.src]));
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-[#5A4635]">
            Informatik Leistungskurs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
