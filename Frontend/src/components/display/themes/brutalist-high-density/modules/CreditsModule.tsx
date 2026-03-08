import { ModuleHeader } from "../BrutalistHighDensityTheme";

// ─── Credits module ───────────────────────────────────────────────────────────────
export function CreditsModule() {
  return (
    <div className="shrink-0" data-testid="module-credits">
      <ModuleHeader title="System" />
      <div className="px-3 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wide text-black/50 leading-relaxed">
          Entwickelt mit ♥ von{" "}
          <span className="font-black text-black">Cédric</span> &amp; dem
          Informatik‑LK&thinsp;24/26
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-px flex-1 bg-black/10" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-black/20">
            GGL · Lichterfelde
          </span>
          <div className="h-px flex-1 bg-black/10" />
        </div>
      </div>
    </div>
  );
}
