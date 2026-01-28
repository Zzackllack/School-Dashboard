import { useMemo, useState } from "react";

const LK_BILD_PUBLIC_SRC = "/images/lk-exkursion-hamburg.jpeg";

function toWsrvUrl(publicSrc: string) {
  if (typeof window === "undefined") return null;
  const absoluteSrc = new URL(publicSrc, window.location.origin).toString();
  const wsrv = new URL("https://wsrv.nl/");
  const wsrv_string = wsrv.toString();
  wsrv.searchParams.set("url", absoluteSrc);
  wsrv.searchParams.set("output", "webp");
  wsrv.searchParams.set("q", "80");
  wsrv.searchParams.set("w", "720");
  console.log("[Image Optimization] " + wsrv_string);
  return wsrv_string;
}

const Credits = () => {
  const lkBildWsrvSrc = useMemo(() => {
    if (!import.meta.env.PROD) {
      console.log("[Image Optimization] Skipping WSRV in development mode");
      return null;
    }
    console.log("[Image Optimization] Using WSRV for image optimization");
    return toWsrvUrl(LK_BILD_PUBLIC_SRC);
  }, []);

  const [lkBildSrc, setLkBildSrc] = useState(
    lkBildWsrvSrc ?? LK_BILD_PUBLIC_SRC,
  );

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
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 shadow-md">
              <img
                src={lkBildSrc}
                alt="Informatik Leistungskurs"
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => {
                  if (lkBildSrc !== LK_BILD_PUBLIC_SRC) {
                    console.warn(
                      `[Image Optimization] Failed to load optimized image from WSRV, falling back to public source: ${lkBildSrc}`,
                    );
                    setLkBildSrc(LK_BILD_PUBLIC_SRC);
                  }
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-[#5A4635]">
            Informatik Leistungskurs
          </p>
          <div className="text-[#5A4635] py-2 px-6 text-center text-sm">
            <p>
              © 2025 - {new Date().getFullYear()} Cédric, Nikolas, Informatik LK
              24/26 | GGL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
