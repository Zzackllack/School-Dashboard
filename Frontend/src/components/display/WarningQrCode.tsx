import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type WarningQrCodeVariant = "overlay" | "module";

interface WarningQrCodeProps {
  url: string | null | undefined;
  variant: WarningQrCodeVariant;
}

export function WarningQrCode({ url, variant }: WarningQrCodeProps) {
  const normalizedUrl = url?.trim();

  if (!normalizedUrl) return null;

  const isOverlay = variant === "overlay";
  const size = isOverlay ? 144 : 76;

  return (
    <div
      className={
        isOverlay
          ? "flex items-center gap-4 border border-white/15 bg-white/[0.06] p-3 sm:p-4"
          : "flex shrink-0 items-center gap-2"
      }
      data-testid="warning-qr-code"
      role="img"
      aria-label="QR-Code für weitere Informationen zur Warnung"
    >
      <div
        className={
          isOverlay
            ? "shrink-0 border-4 border-white bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            : "shrink-0 border-2 border-black/15 bg-white p-1.5 dark:border-white/20"
        }
      >
        <QRCodeSVG
          value={normalizedUrl}
          size={size}
          level="M"
          marginSize={2}
          title="Weitere Informationen zur Warnung scannen"
        />
      </div>
      <div className={isOverlay ? "min-w-0" : "sr-only"}>
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em]">
          <QrCode className="size-3.5 shrink-0" aria-hidden="true" />
          Weitere Informationen
        </div>
        {isOverlay ? (
          <p className="mt-1.5 text-sm leading-snug text-white/65">
            Mit dem Smartphone scannen
          </p>
        ) : null}
      </div>
    </div>
  );
}
