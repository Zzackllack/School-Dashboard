import { useEffect, useState } from "react";
import { ModuleHeader } from "../ModuleHeader";

const IMAGES = [
  {
    src: "/images/e-h.jpeg",
    alt: "LK Exkursion Hamburg",
    ratio: 4 / 3,
  },
  { src: "/images/e-HPI.jpeg", alt: "Exkursion HPI", ratio: 4 / 3 },
  { src: "/images/c+n.jpeg", alt: "Cédric & Nikolas", ratio: 4 / 3 },
  { src: "/images/c+n-2.jpeg", alt: "Cédric & Nikolas", ratio: 4 / 3 },
  { src: "/images/c+n-4.jpeg", alt: "Cédric & Nikolas", ratio: 4 / 3 },
  {
    src: "/images/cm+e.jpeg",
    alt: "Exkursion zum Computerspiele Museum",
    ratio: 4 / 3,
  },
  // Maybe later
  // { src: "/images/c+n-3.jpeg", alt: "Cédric & Nikolas", ratio: 3 / 4 },
  // { src: "/images/h+c+n.jpeg", alt: "Henrik & Cédric & Nikolas", ratio: 3 / 4 },
] as const;

const SLIDE_INTERVAL = 8_000;

type SlideshowState = {
  slots: [number, number | null];
  active: 0 | 1;
};

// ─── Credits module ───────────────────────────────────────────────────────────────
export function CreditsModule() {
  const [{ slots, active }, setState] = useState<SlideshowState>({
    slots: [0, null],
    active: 0,
  });

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
    <div className="shrink-0" data-testid="module-credits">
      <ModuleHeader title="Credits" />
      <div className="px-3 py-3">
        <div
          className="relative overflow-hidden border-2 border-black bg-[#f5f4f0]"
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
            return (
              <img
                key={`${slot}-${imgIdx}`}
                src={img.src}
                alt={img.alt}
                className={`absolute inset-0 h-full w-full object-cover ${
                  isActive ? "credits-slide-enter" : "credits-slide-leave"
                }`}
                style={{ zIndex: isActive ? 1 : 0 }}
              />
            );
          })}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-black/50 leading-relaxed mt-3">
          Entwickelt mit ♥ von{" "}
          <span className="font-black text-black">Cédric</span> &amp; dem
          Informatik‑LK&thinsp;24/26
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-black/10" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-black/20">
            Cédric Laurent Klinge · Nikolas Jonas Bott
          </span>
          <div className="h-px flex-1 bg-black/10" />
        </div>
      </div>
    </div>
  );
}
