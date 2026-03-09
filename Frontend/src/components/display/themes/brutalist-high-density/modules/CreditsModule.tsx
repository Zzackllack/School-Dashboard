import { ModuleHeader } from "../ModuleHeader";
import HamburgExkursionLK from "/images/lk-exkursion-hamburg.jpeg";

// ─── Credits module ───────────────────────────────────────────────────────────────
export function CreditsModule() {
  return (
    <div className="shrink-0" data-testid="module-credits">
      <ModuleHeader title="Credits" />
      <div className="px-3 py-3">
        <div className="border-2 border-black bg-[#f5f4f0] p-2">
          <img
            src={HamburgExkursionLK}
            alt="Leistungs‑Kurs Exkursion Hamburg"
            className="h-full w-full object-contain"
          />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-black/50 leading-relaxed">
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
